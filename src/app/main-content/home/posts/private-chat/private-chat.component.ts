import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, inject, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ChannelService } from "../../../../services/channel.service";
import { AuthenticationService } from "../../../../services/authentication.service";
import { Message } from "../../../../interfaces/message.interface";
import { Observable } from "rxjs";
import { User } from "firebase/auth";
import { Timestamp } from "@angular/fire/firestore";
import { PrivateMessageTextAreaComponent } from "../private-message-text-area/private-message-text-area.component";
import { PrivateMessageMyPostComponent } from "../private-message-my-post/private-message-my-post.component";
import { PrivateMessageOtherPostsComponent } from "../private-message-other-posts/private-message-other-posts.component";
import { PrivateChatService } from "../../../../services/private-chat.service";

@Component({
   selector: "app-private-chat",
   standalone: true,
   imports: [CommonModule, FormsModule, PrivateMessageTextAreaComponent, PrivateMessageMyPostComponent, PrivateMessageOtherPostsComponent],
   templateUrl: "./private-chat.component.html",
   styleUrl: "./private-chat.component.scss",
})
export class PrivateChatComponent implements OnInit {
   @Input() otherUserId!: string;
   @ViewChild("messagesContainer") messagesContainer!: ElementRef;
   @Output() close = new EventEmitter<void>();

   messages: Message[] = [];
   currentUser$!: Observable<User | null>;
   currentUserId: string = "";
   otherUserName: string = "";
   otherUserProfilePic: string = "";

   private authService = inject(AuthenticationService);
   private channelService = inject(ChannelService);
   privateChatService = inject(PrivateChatService);

   constructor() {}

   ngOnInit(): void {
      this.currentUser$ = this.authService.getCurrentUser();
      this.currentUser$.subscribe((user) => {
         if (user) {
            this.currentUserId = user.uid;
            const privateChatId = [this.currentUserId, this.otherUserId].sort().join("_");
            this.privateChatService.openPrivateChat(this.otherUserId, privateChatId);
            this.loadMessages();
            this.getOtherUserName();
         }
      });
   }

   ngAfterViewInit(): void {
      this.privateChatService.closePrivateChat();
   }

   loadMessages() {
      this.channelService.getPrivateMessages(this.otherUserId).subscribe((messages) => {
         this.messages = messages || [];
         this.scrollToBottom();
      });
   }

   closeChat() {
      this.close.emit();
   }

   private scrollToBottom() {
      setTimeout(() => {
         if (this.messagesContainer) {
            this.messagesContainer.nativeElement.scroll({
               top: this.messagesContainer.nativeElement.scrollHeight,
               behavior: "smooth",
            });
         }
      }, 100);
   }

   private getOtherUserName() {
      this.channelService.getUserNameAndProfilePicById(this.otherUserId).then((user) => {
         this.otherUserName = user.name;
         this.otherUserProfilePic = user.photoUrl;
      });
   }

   private getOtherUserDetails() {
      const otherUserId = this.privateChatService.getPrivateChatUserId();
      if (!otherUserId) return;
      this.channelService.getUserNameAndProfilePicById(otherUserId).then((user) => {
         this.otherUserName = user.name;
         this.otherUserProfilePic = user.photoUrl;
      });
   }
}
