import { Component, ElementRef, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PostFromOthersComponent } from "../posts/post-from-others/post-from-others.component";
import { MyPostsComponent } from "../posts/my-posts/my-posts.component";
import { TextareaComponent } from "../textarea/textarea.component";
import { ChannelService } from "../../../services/channel.service";
import { Observable } from "rxjs";
import { User } from "firebase/auth";
import { AuthenticationService } from "../../../services/authentication.service";
import { ActivatedRoute } from "@angular/router";
import { ThreadService } from "../../../services/thread.service";
import { Message } from "../../../interfaces/message.interface";
import { Firestore, collection, doc, Timestamp, getDoc } from "@angular/fire/firestore";
import { PrivateChatService } from "../../../services/private-chat.service";
import { PrivateMessageMyPostComponent } from "../posts/private-message-my-post/private-message-my-post.component";
import { PrivateMessageOtherPostsComponent } from "../posts/private-message-other-posts/private-message-other-posts.component";
import { ThreadTextareaComponent } from "./thread-textarea/thread-textarea.component";
import { FilePreview } from "../../../interfaces/file-preview";

@Component({
   selector: "app-thread",
   standalone: true,
   imports: [CommonModule, PostFromOthersComponent, MyPostsComponent, TextareaComponent, PrivateMessageMyPostComponent, PrivateMessageOtherPostsComponent, ThreadTextareaComponent],
   templateUrl: "./thread.component.html",
   styleUrl: "./thread.component.scss",
})
export class ThreadComponent implements OnInit {
   currentChannel: any = {};
   currentUser$!: Observable<User | null>;
   authService = inject(AuthenticationService);
   route = inject(ActivatedRoute);
   channelService = inject(ChannelService);
   threadService = inject(ThreadService);
   privateChatService = inject(PrivateChatService);
   firestore = inject(Firestore);

   @ViewChild("threadContainer") threadContainer!: ElementRef;

   currentChannelId: string = "";
   privateChatId: string = "";
   messageId = "";
   messageReplies: Message[] = [];
   otherUserName: string = "";

   private scrollTimeout: any;

   threadFilePreviews: FilePreview[] = [];
   selectedMessage: Message | null = null;

   ngOnInit(): void {
      this.currentUser$ = this.authService.getCurrentUser();
      this.threadService.channelId$.subscribe((channelId) => {
         this.currentChannelId = channelId ?? "";
         this.privateChatId = "";
         this.otherUserName = "";
         this.loadChannelData();
      });

      this.privateChatService.privateChatId$.subscribe((privateChatId) => {
         this.privateChatId = privateChatId ?? "";
         this.currentChannelId = "";
         if (this.privateChatId) {
            this.loadPrivateReplies();
            this.setOtherUserName();
         }
      });

      this.threadService.messageId$.subscribe((messageId) => {
         this.messageId = messageId ?? "";
         if (this.privateChatId && this.messageId) {
            this.loadPrivateReplies();
            this.loadReplies();
         }
      });

      this.threadService.threadOpened$.subscribe((isOpened) => {
         if (isOpened && this.privateChatId && this.messageId) {
            this.loadPrivateReplies();
            this.selectedMessageId();
         } else if (isOpened && this.currentChannelId && this.messageId) {
            this.loadReplies();
         }
      });
   }

   ngOnDestroy(): void {
      if (this.scrollTimeout) {
         clearTimeout(this.scrollTimeout);
      }
   }

   selectedMessageId() {
      const docRef = doc(this.firestore, `privateChats/${this.privateChatId}`);

      getDoc(docRef)
         .then((docSnap) => {
            if (docSnap.exists()) {
               const data = docSnap.data();
               if (data && data["messages"]) {
                  this.selectedMessage = data["messages"].find((msg: Message) => msg.messageId === this.messageId) || null;
                  if (!this.selectedMessage) {
                     console.error("Message not found in the messages array.");
                  }
               } else {
                  console.error("No messages array found in the document.");
               }
            } else {
               console.error("No such document exists at path:", `privateChats/${this.privateChatId}`);
            }
         })
         .catch((error) => {
            console.error("Error getting document:", error);
         });
   }

   loadChannelData() {
      if (this.currentChannelId) {
         this.channelService.getChannelById(this.currentChannelId).subscribe((channel) => {
            this.currentChannel = channel;
            if (this.messageId) {
               this.loadReplies();
            }
         });
      }
   }

   loadReplies() {
      if (this.currentChannelId && this.messageId) {
         this.channelService.getChannelById(this.currentChannelId).subscribe((channel) => {
            const message = channel.messages.find((msg: Message) => msg.messageId === this.messageId);
            if (message) {
               this.messageReplies = message.answers ?? [];
               this.scrollToBottom();
            }
         });
      }
   }

   loadPrivateReplies() {
      if (this.privateChatId && this.messageId) {
         this.channelService.getPrivateMessageReplies(this.privateChatId, this.messageId).subscribe(
            (replies) => {
               if (replies.length > 0) {
                  this.messageReplies = replies;
                  this.scrollToBottom();
               }
            },
            (error) => {
               console.error("Error loading private replies:", error);
            }
         );
      }
   }

   addReply(text: string) {
      this.authService.getCurrentUser().subscribe(async (user) => {
         if (user) {
            let repliesCollection;
            if (this.privateChatId) {
               repliesCollection = collection(this.firestore, `privateChats/${this.privateChatId}/messages/${this.messageId}/answers`);
            } else if (this.currentChannelId) {
               repliesCollection = collection(this.firestore, `channel/${this.currentChannelId}/messages`);
            } else {
               console.error("Neither currentChannelId nor privateChatId is set");
               return;
            }

            const newReplyDoc = doc(repliesCollection);
            const newMessage: Message = {
               messageId: newReplyDoc.id,
               userId: user.uid,
               timestamp: Timestamp.now(),
               userName: user.displayName || "Gast",
               text,
               profilePicture: user.photoURL || "",
               files: [],
               reactions: {},
               answers: [],
            };

            if (this.currentChannelId) {
               await this.channelService.addReplyToMessage(this.currentChannelId, this.messageId, newMessage);
               this.loadReplies();
            } else if (this.privateChatId) {
               await this.channelService.addReplyToPrivateMessage(this.privateChatId, this.messageId, newMessage);
               this.loadPrivateReplies();
            }
         }
      });
   }
   setOtherUserName() {
      this.authService.getCurrentUser().subscribe(async (user) => {
         if (user && this.privateChatId) {
            const otherUserId = this.privateChatId.replace(user.uid, "").replace("_", "");
            const userInfo = await this.channelService.getUserNameById(otherUserId);
            this.otherUserName = userInfo;
         }
      });
   }
   scrollToBottom() {
      this.scrollTimeout = setTimeout(() => {
         if (this.threadContainer) {
            this.threadContainer.nativeElement.scroll({
               top: this.threadContainer.nativeElement.scrollHeight,
               behavior: "smooth",
            });
         }
      }, 100);
   }
}
