import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Timestamp, collection } from "firebase/firestore";
import { NgFor, NgIf } from "@angular/common";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { Message } from "../../../interfaces/message.interface";
import { FilePreview } from "../../../interfaces/file-preview";
import { AuthenticationService } from "../../../services/authentication.service";
import { ChannelService } from "../../../services/channel.service";
import { FileUploadService } from "../../../services/file-upload.service";
import { Firestore, doc, getDocs } from "@angular/fire/firestore";
import { firstValueFrom, Subscription } from "rxjs";
import { UserProfile } from "../../../interfaces/user-profile.interface";

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
   selector: "app-textarea",
   standalone: true,
   imports: [FormsModule, NgIf, PickerComponent, NgFor],
   templateUrl: "./textarea.component.html",
   styleUrl: "./textarea.component.scss",
})
export class TextareaComponent implements OnInit, OnDestroy {
   @Input() isReply: boolean = false;
   @Input() isPrivateChat: boolean = false;
   @Input() messageId: string = "";
   @Input() privateChatId: string = "";
   @Output() sendMessage = new EventEmitter<string>();
   @ViewChild("textInput2") textInput!: ElementRef;

   authService = inject(AuthenticationService);
   message = signal("");
   channelService = inject(ChannelService);
   route = inject(ActivatedRoute);
   fileUploadService = inject(FileUploadService);
   firestore = inject(Firestore);

   showEmojiPicker: boolean = false;
   currentChannelId: string = "";
   deTranslations = DE_TRANSLATIONS;
   filePreviews: FilePreview[] = [];
   userSubscription: Subscription | null = null;
   showUserDropdown: boolean = false;
   showChannelDropdown: boolean = false;
   usersInChannel: any[] = [];
   allChannels: any[] = [];
   filteredUsers: any[] = [];
   filteredChannels: any[] = [];
   selectedUserIndex: number = 0;
   selectedChannelIndex: number = 0;
   isSmallScreen: boolean = false;

   ngOnInit() {
      this.route.paramMap.subscribe((paramMap) => {
         this.currentChannelId = paramMap.get("id")!;
         this.loadUsersInChannel();
         this.loadAllChannels();
      });
      window.addEventListener("resize", this.checkScreenSize.bind(this));
      this.checkScreenSize();
      this.focusTextInput();
   }
   ngOnDestroy() {
      if (this.userSubscription) {
         this.userSubscription.unsubscribe();
      }
      window.removeEventListener("resize", this.checkScreenSize.bind(this));
   }

   ngAfterViewInit(): void {
      this.focusTextInput();
   }

   focusTextInput() {
      if (this.textInput && this.textInput.nativeElement) {
         this.textInput.nativeElement.focus();
      }
   }

   checkScreenSize() {
      this.isSmallScreen = window.innerWidth <= 600;
   }

   async processSendMessage() {
      if (!this.message() && this.filePreviews.length === 0) {
         return;
      }

      if (this.userSubscription) {
         this.userSubscription.unsubscribe();
      }

      this.userSubscription = this.authService.getCurrentUser().subscribe(async (user) => {
         if (user) {
            const messagesCollectionPath = this.isPrivateChat
               ? `privateChats/${this.privateChatId}/messages/${this.messageId}/answers`
               : `channel/${this.currentChannelId}/messages`;
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

            if (this.filePreviews.length > 0) {
               const fileUrls = await this.fileUploadService.uploadAllFiles(this.filePreviews);
               newMessage.files = fileUrls.map((url, index) => ({
                  url,
                  name: this.filePreviews[index].name,
                  type: this.filePreviews[index].type,
               }));
            }

            this.addMessageToCollection(newMessage, messagesCollectionPath);
         } else {
            console.error("User is not authenticated");
         }
      });
   }

   triggerSendMessage() {
      if (this.isReply) {
         this.sendMessage.emit(this.message());
      } else {
         this.processSendMessage();
      }
   }

   private addMessageToCollection(newMessage: Message, collectionPath: string) {
      this.channelService
         .addMessageToCollection(collectionPath, newMessage)
         .then(() => {
            this.message.set("");
            this.filePreviews = [];
         })
         .catch((error) => {
            console.error(error);
         });
   }

   async onFileChange(event: any) {
      this.filePreviews = await this.fileUploadService.handleFileInput(event, this.filePreviews);
   }

   removeFile(preview: FilePreview) {
      this.filePreviews = this.filePreviews.filter((p) => p !== preview);
   }

   toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
   }

   addEmoji(event: any) {
      const text = `${this.message()}${event.emoji.native}`;
      this.message.set(text);
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

   async loadUsersInChannel() {
      this.usersInChannel = await this.channelService.getUsersInChannel(this.currentChannelId);
   }

   // async loadAllChannels() {
   //    this.allChannels = await firstValueFrom(this.channelService.getAllChannels());
   // }
   async loadAllChannels() {
      try {
         const allChannels = await firstValueFrom(this.channelService.getAllChannels());
         const currentUser = await firstValueFrom(this.authService.getCurrentUser());

         if (currentUser && currentUser.uid) {
            this.allChannels = allChannels.filter((channel) => {
               // Überprüfe, ob das userAccess-Array vorhanden ist und ob es die uid des aktuellen Benutzers enthält
               if (channel.userAccess && Array.isArray(channel.userAccess)) {
                  // Finde den Benutzer im userAccess-Array
                  return channel.userAccess.some((user: UserProfile) => user.uid === currentUser.uid);
               }
               return false; // Schließe Channels ohne userAccess aus
            });
         } else {
            console.error("Current user or user ID is undefined.");
         }
      } catch (error) {
         console.error("Error loading channels or user:", error);
      }
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

   // checkForHashSymbol(hashIndex: number, input: any) {
   //    if (hashIndex !== -1) {
   //       const searchTerm = input.slice(hashIndex + 1).toLowerCase();
   //       if (searchTerm.length > 0) {
   //          this.filteredChannels = this.allChannels.filter((channel) => channel.channelName.toLowerCase().includes(searchTerm));
   //          this.showChannelDropdown = true;
   //       } else {
   //          this.showChannelDropdown = false;
   //       }
   //    } else {
   //       this.filteredChannels = [];
   //       this.showChannelDropdown = false;
   //    }
   // }

   checkForHashSymbol(hashIndex: number, input: any) {
      if (hashIndex !== -1) {
         const searchTerm = input.slice(hashIndex + 1).toLowerCase();
         if (searchTerm.length > 0) {
            // Filtere nur Channels, auf die der Benutzer Zugriff hat.
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

   @HostListener("window:keydown", ["$event"])
   handleKeyDown(event: KeyboardEvent) {
      if (this.showUserDropdown) {
         if (event.key === "ArrowDown") {
            event.preventDefault();
            this.selectedUserIndex = (this.selectedUserIndex + 1) % this.filteredUsers.length;
         } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this.selectedUserIndex = (this.selectedUserIndex - 1 + this.filteredUsers.length) % this.filteredUsers.length;
         } else if (event.key === "Enter" && this.selectedUserIndex !== -1) {
            event.preventDefault();
            this.addUserToMessage(this.filteredUsers[this.selectedUserIndex]);
         } else if (event.key === "Escape") {
            this.showUserDropdown = false;
         }
      } else if (this.showChannelDropdown) {
         if (event.key === "ArrowDown") {
            event.preventDefault();
            this.selectedChannelIndex = (this.selectedChannelIndex + 1) % this.filteredChannels.length;
         } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this.selectedChannelIndex = (this.selectedChannelIndex - 1 + this.filteredChannels.length) % this.filteredChannels.length;
         } else if (event.key === "Enter" && this.selectedChannelIndex !== -1) {
            event.preventDefault();
            this.addChannelToMessage(this.filteredChannels[this.selectedChannelIndex]);
         } else if (event.key === "Escape") {
            this.showChannelDropdown = false;
         }
      }
   }
}
