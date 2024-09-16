import { Component, Input, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactionsComponent } from "../../reactions/reactions.component";
import { Message } from "../../../../interfaces/message.interface";
import { NgFor, NgIf } from "@angular/common";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { FileViewerComponent } from "../file-viewer/file-viewer.component";
import { ActivatedRoute } from "@angular/router";
import { UserService } from "../../../../services/user.service";
import { AuthenticationService } from "../../../../services/authentication.service";
import { DialogProfileComponent } from "../../header/dropdown-menu/dialog-profile/dialog-profile.component";
import { Firestore } from "@angular/fire/firestore";
import { FormsModule } from "@angular/forms";
import { ChannelService } from "../../../../services/channel.service";
import { ThreadService } from "../../../../services/thread.service";
import { PrivateChatService } from "../../../../services/private-chat.service";
import { PrivateReactionsComponent } from "../../reactions/private-reactions/private-reactions.component";

@Component({
   selector: "app-private-message-my-post",
   standalone: true,
   imports: [CommonModule, ReactionsComponent, NgIf, NgFor, MatDialogModule, FormsModule, PrivateReactionsComponent, NgIf],
   templateUrl: "./private-message-my-post.component.html",
   styleUrl: "./private-message-my-post.component.scss",
})
export class PrivateMessageMyPostComponent implements OnInit {
   @Input() message!: Message;
   @Input() currentChannelId!: string;
   @Input() privateChatId!: string;
   @Input() isThreadContext: boolean = false;

   dialog = inject(MatDialog);
   formattedDate!: string;
   formattedTime!: string;
   formattedLastAnswerTime!: string;

   showIconsDiv: boolean = false;
   isDivHidden: boolean = true;
   isEditing: boolean = false;
   editedMessage: string = "";

   userService = inject(UserService);
   authenticationService = inject(AuthenticationService);
   route = inject(ActivatedRoute);
   firestore: Firestore = inject(Firestore);
   channelService = inject(ChannelService);
   threadService = inject(ThreadService);
   privateChatService = inject(PrivateChatService);

   showEmojiPicker = false;
   emotes = ["/dabubble/browser/public/img/emotes/pray-emote.png", "/dabubble/browser/public/img/emotes/right-emote.png", "/dabubble/browser/public/img/emotes/rocket-emote.png", "/dabubble/browser/public/img/emotes/smiley-emote.png"];
   userId: string | null = null;

   ngOnInit() {
      if (this.message && this.message.timestamp) {
         const timestamp = this.message.timestamp;
         const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
         this.formattedDate = date.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
         this.formattedTime = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
         this.editedMessage = this.message.text;
      }

      this.privateChatService.privateChatId$.subscribe((privateChatId) => {
         this.privateChatId = privateChatId ?? "";
      });

      this.authenticationService.getCurrentUser().subscribe((user) => {
         this.userId = user ? user.uid : null;
      });

      if (this.message.answers && this.message.answers.length > 0) {
         const lastAnswer = this.message.answers[this.message.answers.length - 1];
         if (lastAnswer.timestamp) {
            const lastAnswerTimestamp = lastAnswer.timestamp;
            const lastAnswerDate = new Date(lastAnswerTimestamp.seconds * 1000 + lastAnswerTimestamp.nanoseconds / 1000000);
            this.formattedLastAnswerTime = lastAnswerDate.toLocaleTimeString("de-DE", {
               hour: "2-digit",
               minute: "2-digit",
            });
         }
      }
   }

   toggleDiv() {
      this.isDivHidden = !this.isDivHidden;
   }

   toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
   }

   closeEmojiPicker(event: Event): void {
      this.showEmojiPicker = false;
   }

   addEmoji(event: any) {
      const emoji = event.emoji.native;
      this.channelService.addReaction(this.privateChatId, this.message.messageId, emoji);
      this.showEmojiPicker = false;
   }

   changeImage(event: Event, newSrc: string) {
      const img = event.target as HTMLImageElement;
      img.src = newSrc;
   }

   resetImage(event: Event, originalSrc: string) {
      const img = event.target as HTMLImageElement;
      img.src = originalSrc;
   }

   showIcons() {
      this.showIconsDiv = true;
   }

   hideIcons() {
      this.showIconsDiv = false;
   }

   openFile(file: { url: string; type: string }) {
      if (file.type !== "application/pdf")
         this.dialog.open(FileViewerComponent, {
            data: { fileUrl: file.url, fileType: file.type },
            width: "80%",
         });
   }

   selectProfile(userName: string): void {
      const user = this.userService.getUserByName(userName);
      const currentUser = this.authenticationService.currentUser?.displayName === userName;
      this.dialog.open(DialogProfileComponent, {
         data: { user: user, currentUser: currentUser },
      });
   }

   openThread() {
      const privateChatId = this.privateChatService.getPrivateChatId();
      if (privateChatId) {
         this.threadService.openThread(`privateChats/${privateChatId}/messages/${this.message.messageId}`, this.message.messageId);
      } else {
         console.error("openThread error: privateChatId is undefined");
      }
   }

   editMessage() {
      this.isEditing = true;
      this.isDivHidden = true;
   }

   cancelEdit() {
      this.isEditing = false;
      this.editedMessage = this.message.text;
   }

   async saveEdit() {
      if (!this.editedMessage.trim()) {
         return;
      }

      try {
         await this.channelService.updateMessage(this.currentChannelId, this.message.messageId, this.editedMessage);
         this.message.text = this.editedMessage;
         this.isEditing = false;
         this.isDivHidden = true;
      } catch (error) {
         console.error(error);
      }
   }

   handleEmoteClick(emote: string) {
      const emoteKey = this.getEmoteKey(emote);
      const userReacted = emoteKey && this.message?.reactions?.[emoteKey]?.includes(this.userId!);
      this.updateReaction(emote, !userReacted);
   }

   getEmoteKey(emote: string): string | undefined {
      return emote.split("/").pop();
   }

   updateReaction(emote: string, add: boolean) {
      const emoteKey = this.getEmoteKey(emote);

      if (emoteKey) {
         if (!this.message.reactions![emoteKey]) {
            this.message.reactions![emoteKey] = [];
         }
         const userIndex = this.message.reactions![emoteKey].indexOf(this.userId!);
         if (add && userIndex === -1) {
            this.message.reactions![emoteKey].push(this.userId!);
         } else if (!add && userIndex !== -1) {
            this.message.reactions![emoteKey].splice(userIndex, 1);
         } else {
            return;
         }

         this.updateReactionsInFirestore();
      }
   }

   updateReactionsInFirestore() {
      this.privateChatService.updatePrivateMessageReactions(this.privateChatId!, this.message.messageId, this.message.reactions);
   }

   hasReactions(): boolean {
      if (!this.message.reactions) {
         return false;
      }

      for (const key in this.message.reactions) {
         if (this.message.reactions[key] && this.message.reactions[key].length > 0) {
            return true;
         }
      }

      return false;
   }
}