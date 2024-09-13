import { Component, inject, Input } from "@angular/core";
import { Message } from "../../../../interfaces/message.interface";
import { AuthenticationService } from "../../../../services/authentication.service";
import { PrivateChatService } from "../../../../services/private-chat.service";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { NgFor, NgIf } from "@angular/common";

@Component({
   selector: "app-private-reactions",
   standalone: true,
   imports: [MatDialogModule, MatIconModule, MatButtonModule, MatMenuModule, NgFor, NgIf],
   templateUrl: "./private-reactions.component.html",
   styleUrl: "./private-reactions.component.scss",
})
export class PrivateReactionsComponent {
   privateChatService = inject(PrivateChatService);
   authService = inject(AuthenticationService);
   @Input() message!: Message;
   @Input() privateChatId!: string;

   hoveredUsers: string[] = [];
   userId: string | null = null;
   emotes = ["./public/img/emotes/pray-emote.png", "./public/img/emotes/right-emote.png", "./public/img/emotes/rocket-emote.png", "./public/img/emotes/smiley-emote.png"];

   ngOnInit() {
      this.authService.getCurrentUser().subscribe((user) => {
         this.userId = user ? user.uid : null;
      });
      this.privateChatService.privateChatId$.subscribe((privateChatId) => {
         this.privateChatId = privateChatId ?? "";
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
      if (this.privateChatId) {
         this.privateChatService.updatePrivateMessageReactions(this.privateChatId, this.message.messageId, this.message.reactions).catch((error) => {
            console.error("Error updating reactions:", error);
         });
      }
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
