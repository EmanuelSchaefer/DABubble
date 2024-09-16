import { Component, Input, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactionsComponent } from "../../reactions/reactions.component";
import { Message } from "../../../../interfaces/message.interface";
import { NgFor, NgIf } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { FileViewerComponent } from "../file-viewer/file-viewer.component";
import { UserService } from "../../../../services/user.service";

import { DialogProfileComponent } from "../../header/dropdown-menu/dialog-profile/dialog-profile.component";
import { AuthenticationService } from "../../../../services/authentication.service";
import { ChannelService } from "../../../../services/channel.service";
import { PrivateReactionsComponent } from "../../reactions/private-reactions/private-reactions.component";
import { ThreadService } from "../../../../services/thread.service";
import { PrivateChatService } from "../../../../services/private-chat.service";

@Component({
   selector: "app-private-message-other-posts",
   standalone: true,
   imports: [CommonModule, ReactionsComponent, NgIf, NgFor, PrivateReactionsComponent],
   templateUrl: "./private-message-other-posts.component.html",
   styleUrl: "./private-message-other-posts.component.scss",
})
export class PrivateMessageOtherPostsComponent implements OnInit {
   @Input() message!: Message;
   @Input() currentChannelId!: string;
   @Input() privateChatId!: string;
   @Input() isThreadContext: boolean = false;

   dialog = inject(MatDialog);
   userService = inject(UserService);
   authenticationService = inject(AuthenticationService);
   channelService = inject(ChannelService);
   threadService = inject(ThreadService);
   privateChatService = inject(PrivateChatService);

   formattedDate!: string;
   formattedTime!: string;
   formattedLastAnswerTime!: string;
   showIconsDiv: boolean = false;
   isDivHidden: boolean = true;
   isEditing: boolean = false;
   editedMessage: string = "";

   showEmojiPicker = false;

   emotes = ["/dabubble/browser/public/img/emotes/pray-emote.png", "/dabubble/browser/public/img/emotes/right-emote.png", "/dabubble/browser/public/img/emotes/rocket-emote.png", "/dabubble/browser/public/img/emotes/smiley-emote.png"];
   isMentioned: boolean = false;
   userId: string | null = null;

   async ngOnInit() {
      if (this.message && this.message.timestamp) {
         const timestamp = this.message.timestamp;
         const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
         this.formattedDate = date.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
         this.formattedTime = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      }

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
      this.privateChatService.privateChatId$.subscribe((privateChatId) => {
         this.privateChatId = privateChatId ?? "";
      });

      this.authenticationService.getCurrentUser().subscribe((user) => {
         this.userId = user ? user.uid : null;
      });
      this.isMentioned = await this.channelService.isUserMentionedInMessage(this.message);
   }

   openFile(file: { url: string; type: string }) {
      if (file.type !== "application/pdf") {
         this.dialog.open(FileViewerComponent, {
            data: { fileUrl: file.url, fileType: file.type },
            width: "80%",
         });
      }
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

   toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
   }

   closeEmojiPicker(event: Event): void {
      this.showEmojiPicker = false;
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
      this.privateChatService.updatePrivateMessageReactions(this.privateChatId, this.message.messageId, this.message.reactions).catch((error) => {
         console.error("Error updating reactions:", error);
      });
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