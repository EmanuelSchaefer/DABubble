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

@Component({
   selector: "app-my-posts",
   standalone: true,
   imports: [CommonModule, ReactionsComponent, NgIf, NgFor, MatDialogModule, FormsModule],
   templateUrl: "./my-posts.component.html",
   styleUrl: "./my-posts.component.scss",
})
export class MyPostsComponent implements OnInit {
   @Input() message!: Message;
   @Input() currentChannelId!: string;
   @Input() isReply: boolean = false;

   formattedDate!: string;
   formattedTime!: string;
   formattedLastAnswerTime!: string;
   showIconsDiv: boolean = false;
   isDivHidden: boolean = true;
   isEditing: boolean = false;
   editedMessage: string = "";

   dialog = inject(MatDialog);
   userService = inject(UserService);
   authenticationService = inject(AuthenticationService);
   route = inject(ActivatedRoute);
   firestore: Firestore = inject(Firestore);
   channelService = inject(ChannelService);
   threadService = inject(ThreadService);

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

      this.route.paramMap.subscribe((paramMap) => {
         const channelId = paramMap.get("id");
         if (channelId) {
            this.currentChannelId = channelId;
         }
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

      this.authenticationService.getCurrentUser().subscribe((user) => {
         this.userId = user ? user.uid : null;
      });
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
      this.channelService.addReaction(this.currentChannelId, this.message.messageId, emoji);
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
            maxWidth: "80vw",
            width: "auto",
            panelClass: "custom-dialog-container",
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
      this.threadService.openThread(this.currentChannelId, this.message.messageId);
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
      this.channelService.updateReactions(this.currentChannelId, this.message.messageId, this.message.reactions);
   }
}