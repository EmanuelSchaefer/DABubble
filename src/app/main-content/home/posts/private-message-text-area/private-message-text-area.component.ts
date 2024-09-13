import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Timestamp, collection } from "firebase/firestore";
import { NgFor, NgIf } from "@angular/common";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { Firestore, doc, getDocs } from "@angular/fire/firestore";
import { firstValueFrom, Subscription } from "rxjs";
import { AuthenticationService } from "../../../../services/authentication.service";
import { ChannelService } from "../../../../services/channel.service";
import { FileUploadService } from "../../../../services/file-upload.service";
import { FilePreview } from "../../../../interfaces/file-preview";
import { Message } from "../../../../interfaces/message.interface";

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
   selector: "app-private-message-text-area",
   standalone: true,
   imports: [FormsModule, NgIf, PickerComponent, NgFor],
   templateUrl: "./private-message-text-area.component.html",
   styleUrl: "./private-message-text-area.component.scss",
})
export class PrivateMessageTextAreaComponent implements OnInit, OnDestroy {
   @Input() otherUserId!: string;
   @Output() messageSend = new EventEmitter<void>();
   @ViewChild("textInput") textInput!: ElementRef;

   authService = inject(AuthenticationService);
   message = signal("");
   channelService = inject(ChannelService);
   fileUploadService = inject(FileUploadService);
   firestore = inject(Firestore);

   showEmojiPicker: boolean = false;
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
   currentUserId: string = "";

   ngOnInit() {
      this.authService.getCurrentUser().subscribe((user) => {
         if (user) {
            this.currentUserId = user.uid;
         }
      });
   }

   ngOnDestroy() {
      if (this.userSubscription) {
         this.userSubscription.unsubscribe();
      }
   }

   ngAfterViewInit(): void {
      this.focusTextInput();
   }
   async sendMessage() {
      if (this.message().trim()) {
         const newMessage: Message = {
            messageId: this.generateId(),
            userId: this.currentUserId,
            timestamp: Timestamp.now(),
            userName: this.authService.currentCustomUser?.name || "Gast",
            text: this.message(),
            profilePicture: this.authService.currentCustomUser?.photoUrl || "",
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

         this.channelService.addPrivateMessage(this.otherUserId, newMessage).then(() => {
            this.message.set("");
            this.filePreviews = [];
            this.messageSend.emit();
         });
      }
   }

   focusTextInput() {
      this.textInput.nativeElement.focus();
   }

   triggerSendMessage() {
      this.sendMessage();
   }

   private generateId(): string {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
