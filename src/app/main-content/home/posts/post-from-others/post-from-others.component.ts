import { Component, Input, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactionsComponent } from "../../reactions/reactions.component";
import { Message } from "../../../../interfaces/message.interface";
import { NgFor, NgIf } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { FileViewerComponent } from "../file-viewer/file-viewer.component";
import { ActivatedRoute } from "@angular/router";
import { UserService } from "../../../../services/user.service";
import { AuthenticationService } from "../../../../services/authentication.service";
import { DialogProfileComponent } from "../../header/dropdown-menu/dialog-profile/dialog-profile.component";
import { ThreadComponent } from "../../thread/thread.component";
import { ThreadService } from "../../../../services/thread.service";
import { ChannelService } from "../../../../services/channel.service";

@Component({
   selector: "app-post-from-others",
   standalone: true,
   imports: [CommonModule, ReactionsComponent, NgIf, NgFor, ThreadComponent],
   templateUrl: "./post-from-others.component.html",
   styleUrl: "./post-from-others.component.scss",
})
export class PostFromOthersComponent implements OnInit {
   @Input() message!: Message;
   @Input() isReply: boolean = false;
   dialog = inject(MatDialog);
   formattedDate!: string;
   formattedTime!: string;
   formattedLastAnswerTime!: string;
   userService = inject(UserService);
   authenticationService = inject(AuthenticationService);
   currentChannelId: string = "";
   showIconsDiv: boolean = false;
   route = inject(ActivatedRoute);
   threadService = inject(ThreadService);
   showEmojiPicker = false;
   emotes = ["public/img/emotes/pray-emote.png", "public/img/emotes/right-emote.png", "public/img/emotes/rocket-emote.png", "public/img/emotes/smiley-emote.png"];
   channelService = inject(ChannelService);
   isMentioned: boolean = false;
   userId: string | null = null;

   async ngOnInit() {
      if (!this.message.files) {
         this.message.files = [];
      }

      if (this.message && this.message.timestamp) {
         const timestamp = this.message.timestamp;
         const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
         this.formattedDate = date.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
         });
         this.formattedTime = date.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
         });
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

      this.route.paramMap.subscribe((paramMap) => {
         this.currentChannelId = paramMap.get("id")!;
      });

      this.isMentioned = await this.channelService.isUserMentionedInMessage(this.message);
      this.authenticationService.getCurrentUser().subscribe((user) => {
         this.userId = user ? user.uid : null;
      });
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
      this.threadService.openThread(this.currentChannelId, this.message.messageId);
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
      this.channelService.updateReactions(this.currentChannelId, this.message.messageId, this.message.reactions).catch((error) => {
         console.error("Error updating reactions:", error);
      });
   }
}