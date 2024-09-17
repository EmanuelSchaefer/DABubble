import { NgFor, NgIf } from "@angular/common";
import { Component, Input, OnInit, SimpleChanges, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { ChannelService } from "../../../services/channel.service";
import { Message } from "../../../interfaces/message.interface";
import { AuthenticationService } from "../../../services/authentication.service";

@Component({
   selector: "app-reactions",
   standalone: true,
   imports: [MatDialogModule, MatIconModule, MatButtonModule, MatMenuModule, NgFor, NgIf],
   templateUrl: "./reactions.component.html",
   styleUrl: "./reactions.component.scss",
})
export class ReactionsComponent implements OnInit {
   channelService = inject(ChannelService);
   authService = inject(AuthenticationService);
   @Input() message!: Message;
   @Input() channelId!: string;

   hoveredUsers: string[] = [];
   userId: string | null = null;
   emotes = ["/dabubble/browser/public/img/emotes/pray-emote.png", "/dabubble/browser/public/img/emotes/right-emote.png", "/dabubble/browser/public/img/emotes/rocket-emote.png", "/dabubble/browser/public/img/emotes/smiley-emote.png"];

   ngOnInit() {
      this.authService.getCurrentUser().subscribe((user) => {
         this.userId = user ? user.uid : null;
      });
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

   toggleUserReaction(emote: string) {
      const emoteKey = this.getEmoteKey(emote);
      const userReacted = emoteKey && this.message?.reactions?.[emoteKey]?.includes(this.userId!);
      this.updateReaction(emote, !userReacted);
   }

   updateReactionsInFirestore() {
      this.channelService.updateReactions(this.channelId, this.message.messageId, this.message.reactions).catch((error) => {
         console.error("Error updating reactions:", error);
      });
   }

   getUsersForReaction(emote: string): string[] {
      const emoteKey = this.getEmoteKey(emote);
      return emoteKey && this.message.reactions ? this.message.reactions[emoteKey] || [] : [];
   }

   async showUsersForReaction(emote: string) {
      const userIds = this.getUsersForReaction(emote);
      this.hoveredUsers = await Promise.all(userIds.map((id) => this.authService.getUserNameById(id)));
   }

   hideUsersForReaction() {
      this.hoveredUsers = [];
   }

   hasReactions(emote: string): boolean {
      const emoteKey = this.getEmoteKey(emote);
      return emoteKey ? !!(this.message.reactions && this.message.reactions[emoteKey] && this.message.reactions[emoteKey].length > 0) : false;
   }
}