import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FilePreview } from "../../../../interfaces/file-preview";
import { firstValueFrom, Subscription } from "rxjs";
import { ThreadService } from "../../../../services/thread.service";
import { FileUploadService } from "../../../../services/file-upload.service";
import { AuthenticationService } from "../../../../services/authentication.service";
import { Firestore, Timestamp, collection, doc } from "@angular/fire/firestore";
import { NgFor, NgIf } from "@angular/common";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { Message } from "../../../../interfaces/message.interface";
import { ThreadFilePreview } from "../../../../interfaces/thread-file-preview";
import { ActivatedRoute } from "@angular/router";
import { ChannelService } from "../../../../services/channel.service";

const DE_TRANSLATIONS = {
   search: "Suche",
   clear: "Löschen",
   notfound: "Keine Emojis gefunden",
   categories: {
      search: "Suchergebnisse",
      recent: "Häufig benutzt",
      smileys: "Smileys & Emotionen",
      people: "Personen & Körper",
      nature: "Tiere & Natur",
      foods: "Essen & Trinken",
      activity: "Aktivitäten",
      places: "Reisen & Orte",
      objects: "Objekte",
      symbols: "Symbole",
      flags: "Flaggen",
      custom: "Benutzerdefiniert",
   },
   skintones: {
      1: "Standard-Hautton",
      2: "Heller Hautton",
      3: "Mittlerer heller Hautton",
      4: "Mittlerer Hautton",
      5: "Mittlerer dunkler Hautton",
      6: "Dunkler Hautton",
   },
};

@Component({
   selector: "app-thread-textarea",
   standalone: true,
   imports: [FormsModule, NgIf, NgFor, PickerComponent],
   templateUrl: "./thread-textarea.component.html",
   styleUrls: ["./thread-textarea.component.scss"],
})
export class ThreadTextareaComponent implements OnInit, OnDestroy {
   @Input() threadFilePreviews: ThreadFilePreview[] = [];
   @Input() messageId: string = "";
   @Input() privateChatId: string = "";
   @Input() isPrivateChat: boolean = false;
   @Output() sendMessage = new EventEmitter<string>();

   @ViewChild("threadTextInput") threadTextInput!: ElementRef;

   authService = inject(AuthenticationService);
   threadService = inject(ThreadService);
   fileUploadService = inject(FileUploadService);
   firestore = inject(Firestore);
   route = inject(ActivatedRoute);
   channelService = inject(ChannelService);

   message = signal("");
   showEmojiPicker: boolean = false;
   threadSubscription: Subscription | null = null;
   currentChannelId: string | null = null;

   deTranslations = DE_TRANSLATIONS;
   userSubscription: Subscription | null = null;
   showUserDropdown: boolean = false;
   showChannelDropdown: boolean = false;
   usersInChannel: any[] = [];
   allChannels: any[] = [];
   filteredUsers: any[] = [];
   filteredChannels: any[] = [];
   selectedUserIndex: number = 0;
   selectedChannelIndex: number = 0;

   cdr = inject(ChangeDetectorRef);

   ngOnInit() {
      this.route.paramMap.subscribe((paramMap) => {
         this.currentChannelId = paramMap.get("id")!;
         this.loadUsersInChannel();
         this.loadAllChannels();
      });
      this.channelService.currentChannelId$.subscribe((channelId) => {
         this.currentChannelId = channelId;
      });

      this.threadSubscription = this.threadService.openThread$.subscribe(() => {
         this.focusTextInput();
      });
   }

   ngAfterViewInit(): void {
      this.focusTextInput();
   }

   ngOnDestroy() {
      if (this.threadSubscription) {
         this.threadSubscription.unsubscribe();
      }
   }

   focusTextInput() {
      if (this.threadTextInput && this.threadTextInput.nativeElement) {
         setTimeout(() => {
            this.threadTextInput.nativeElement.focus();
         }, 10);
      }
   }

   async loadUsersInChannel() {
      this.usersInChannel = await this.channelService.getUsersInChannel(this.currentChannelId!);
   }

   async loadAllChannels() {
      this.allChannels = await firstValueFrom(this.channelService.getAllChannels());
   }

   async onFileChange(event: any) {
      this.threadFilePreviews = await this.fileUploadService.handleThreadFileInput(event, this.threadFilePreviews);
   }

   removeFile(preview: ThreadFilePreview) {
      this.threadFilePreviews = this.threadFilePreviews.filter((p) => p !== preview);
   }

   async processSendMessage() {
      if (!this.message && this.threadFilePreviews.length === 0) {
         return;
      }

      const user = await firstValueFrom(this.authService.getCurrentUser());
      if (!user) {
         console.error("User is not authenticated");
         return;
      }

      const messagesCollectionPath = this.isPrivateChat ? `privateChats/${this.privateChatId}/messages/${this.messageId}/answers` : `${this.currentChannelId}`;
      const messagesCollection = collection(this.firestore, messagesCollectionPath);
      const newMessageDoc = doc(messagesCollection);

      const newMessage: Message = {
         messageId: newMessageDoc.id,
         userId: user.uid,
         timestamp: Timestamp.now(),
         userName: user.displayName || "Gast",
         text: this.message(),
         profilePicture: user.photoURL || "",
         files: [],
         reactions: {},
         answers: [],
      };

      if (this.threadFilePreviews.length > 0) {
         const fileUrls = await this.fileUploadService.uploadAllFiles(this.threadFilePreviews);
         newMessage.files = fileUrls.map((url, index) => ({
            url,
            name: this.threadFilePreviews[index].name,
            type: this.threadFilePreviews[index].type,
         }));
      }

      if (!this.privateChatId) {
         this.addMessageToCollection(newMessage, this.currentChannelId!);
      } else {
         this.handleReplyInThread(newMessage);
      }
   }

   async handleReplyInThread(newMessage: any) {
      await this.channelService
         .addReplyToPrivateMessage(this.privateChatId, this.messageId, newMessage)
         .then(() => {
            this.message.set("");
            this.threadFilePreviews = [];
         })
         .catch((error) => {
            console.error.apply(error);
         });
   }

   private addMessageToCollection(newMessage: any, collectionPath: string) {
      this.channelService
         .addReplyToThreadMessage(collectionPath, this.messageId, newMessage)
         .then(() => {
            this.message.set("");
            this.threadFilePreviews = [];
         })
         .catch((error) => {
            console.error(error);
         });
   }

   triggerSendThreadMessage() {
      this.processSendMessage();
   }

   toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
   }

   addEmoji(event: any) {
      this.message += event.emoji.native;
      this.showEmojiPicker = false;
   }

   toggleUserDropdown() {
      this.showUserDropdown = !this.showUserDropdown;
      if (this.showUserDropdown) {
         this.filteredUsers = this.usersInChannel;
      } else {
         this.filteredUsers = [];
         this.selectedUserIndex = -1;
      }
   }

   addChannelToMessage(channel: any) {
      let currentMessage = this.message();
      const hashIndex = currentMessage.lastIndexOf("#");
      if (hashIndex !== -1) {
         currentMessage = currentMessage.slice(0, hashIndex + 1) + channel.channelName;
      } else {
         currentMessage += `#${channel.channelName}`;
      }
      this.message.set(currentMessage);
      this.showChannelDropdown = false;
      this.selectedUserIndex = -1;
   }

   addUserToMessage(user: any) {
      let currentMessage = this.message();
      const atIndex = currentMessage.lastIndexOf("@");
      if (atIndex !== -1) {
         currentMessage = currentMessage.slice(0, atIndex + 1) + user.name;
      } else {
         currentMessage += `@${user.name}`;
      }
      this.message.set(currentMessage);
      this.showUserDropdown = false;
      this.selectedUserIndex = -1;
   }

   onInput(event: Event) {
      const input = (event.target as HTMLTextAreaElement).value;
      const atIndex = input.lastIndexOf("@");
      const hashIndex = input.lastIndexOf("#");
      const lastChar = input.slice(-1);

      if (lastChar === "@") {
         this.filteredUsers = this.usersInChannel;
         this.showUserDropdown = true;
         this.selectedUserIndex = 0;
      } else if (lastChar === "#") {
         this.filteredChannels = this.allChannels;
         this.showChannelDropdown = true;
         this.selectedUserIndex = -1;
      } else {
         this.checkForAtSymbol(atIndex, input);
         this.checkForHashSymbol(hashIndex, input);
      }

      if (!this.isInMentionMode(input)) {
         this.showUserDropdown = false;
         this.showChannelDropdown = false;
      }
   }

   checkForAtSymbol(atIndex: number, input: any) {
      if (atIndex !== -1) {
         const searchTerm = input.slice(atIndex + 1).toLowerCase();
         if (searchTerm.length > 0) {
            this.filteredUsers = this.usersInChannel.filter((user) => user.name.toLowerCase().includes(searchTerm));
            this.showUserDropdown = true;
         } else {
            this.showUserDropdown = false;
         }
      } else {
         this.filteredUsers = [];
         this.showUserDropdown = false;
      }
   }

   checkForHashSymbol(hashIndex: number, input: any) {
      if (hashIndex !== -1) {
         const searchTerm = input.slice(hashIndex + 1).toLowerCase();
         if (searchTerm.length > 0) {
            this.filteredChannels = this.allChannels.filter((channel) => channel.channelName.toLowerCase().includes(searchTerm));
            this.showChannelDropdown = true;
         } else {
            this.showChannelDropdown = false;
         }
      } else {
         this.filteredChannels = [];
         this.showChannelDropdown = false;
      }
   }

   isInMentionMode(input: string): boolean {
      const atIndex = input.lastIndexOf("@");
      const hashIndex = input.lastIndexOf("#");
      const spaceIndex = input.lastIndexOf(" ");
      return atIndex > spaceIndex || hashIndex > spaceIndex;
   }
}
