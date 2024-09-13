import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from "@angular/core";
import { PostFromOthersComponent } from "../posts/post-from-others/post-from-others.component";
import { MyPostsComponent } from "../posts/my-posts/my-posts.component";
import { TextareaComponent } from "../textarea/textarea.component";
import { DialogPosition, MatDialog } from "@angular/material/dialog";
import { ChannelService } from "../../../services/channel.service";
import { NgFor, NgIf, AsyncPipe } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { AuthenticationService } from "../../../services/authentication.service";
import { Observable } from "rxjs";
import { User } from "firebase/auth";
import { EditChannelComponent } from "../edit-channel/edit-channel.component";
import { DialogAddUserComponent } from "./dialog-add-user/dialog-add-user.component";
import { DialogViewChannelUserListComponent } from "./dialog-view-channel-user-list/dialog-view-channel-user-list.component";
import { PrivateChatComponent } from "../posts/private-chat/private-chat.component";

@Component({
   selector: "app-channel-content",
   standalone: true,
   imports: [PostFromOthersComponent, MyPostsComponent, TextareaComponent, NgIf, NgFor, AsyncPipe, EditChannelComponent, PrivateChatComponent],
   templateUrl: "./channel-content.component.html",
   styleUrl: "./channel-content.component.scss",
})
export class ChannelContentComponent implements OnInit, AfterViewInit, OnDestroy {
   channelService = inject(ChannelService);
   route = inject(ActivatedRoute);
   authService = inject(AuthenticationService);
   dialog = inject(MatDialog);
   channelData: any;
   currentChannelId: string = "";
   currentChannel: any;
   currentUser$!: Observable<User | null>;
   @ViewChild("openAddUserBtn") openAddUserBtn!: ElementRef;
   @ViewChild("postsContainer") postsContainer!: ElementRef;
   @ViewChild("privateChatContainer", { static: false }) privateChatContainer!: ElementRef;
   @ViewChild("textareaComponent") textareaComponent!: TextareaComponent;

   private scrollTimeout: any;
   isPrivateChatOpen = false;
   selectedUserId: string = "";

   ngOnInit() {
      this.currentUser$ = this.authService.getCurrentUser();

      this.route.paramMap.subscribe((paramMap) => {
         this.currentChannelId = paramMap.get("id")! || "MeCr1XlRySnaAv81qBMK";
         if (this.currentChannelId) {
            this.channelService.getChannelById(this.currentChannelId).subscribe((doc) => {
               this.currentChannel = doc;
               this.channelService.setCurrentChannelName(this.currentChannel.channelName);
               this.scrollToBottom();
               this.focusTextarea();
            });
         }
      });

      this.channelService.getPrivateChatUserId().subscribe((userId) => {
         this.openPrivateChat(userId);
      });
   }

   ngAfterViewInit() {
      this.scrollToBottom();
   }

   ngOnDestroy() {
      if (this.scrollTimeout) {
         clearTimeout(this.scrollTimeout);
      }
   }

   focusTextarea() {
      if (this.textareaComponent) {
         this.textareaComponent.focusTextInput();
      }
   }

   openPrivateChat(userId: string) {
      this.isPrivateChatOpen = true;
      this.selectedUserId = userId;
   }

   closePrivateChat() {
      this.isPrivateChatOpen = false;
      this.selectedUserId = "";
   }

   trackByUser(index: number, user: any): string {
      return user.uid;
   }

   openEditChannel() {
      this.dialog.open(EditChannelComponent, {
         data: { channelId: this.currentChannelId },
      });
   }

   openAddUserDialog(event: any): void {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      let dialogPosition: DialogPosition = {
         top: rect.top + 45 + "px",
         left: rect.left - 480 + "px",
      };

      if (window.innerWidth <= 550) {
         dialogPosition.left = "10px";
      }

      this.dialog.open(DialogAddUserComponent, {
         position: dialogPosition,
         panelClass: "add-user-to-channel",
         data: { channelId: this.currentChannelId },
      });
   }

   scrollToBottom() {
      this.scrollTimeout = setTimeout(() => {
         if (this.postsContainer) {
            this.postsContainer.nativeElement.scroll({
               top: this.postsContainer.nativeElement.scrollHeight,
               behavior: "smooth",
            });
         }
      }, 100);
   }

   openChannelUserList(event: any): void {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      let dialogPosition: DialogPosition = {
         top: rect.top + 45 + "px",
         left: rect.left - 369 + "px",
      };

      if (window.innerWidth <= 550) {
         dialogPosition.left = "10px";
         dialogPosition.top = `${rect.bottom + 10}px`;
      }

      this.dialog.open(DialogViewChannelUserListComponent, {
         position: dialogPosition,
         panelClass: "view-channel-user-list",
         data: { dialogPosition, userAccess: this.currentChannel.userAccess, currentChannelId: this.currentChannelId },
         width: "415px",
         height: "411px",
      });
   }
}
