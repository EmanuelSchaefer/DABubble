import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CreateChannelComponent } from "./create-channel/create-channel.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { RouterLink, Router } from "@angular/router";
import { UserService } from "../../../services/user.service";
import { AddChannel } from "../../../models/addChannel.class";
import { Firestore, collectionData, collection, where, onSnapshot } from "@angular/fire/firestore";
import { ChannelService } from "../../../services/channel.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { DialogProfileComponent } from "../header/dropdown-menu/dialog-profile/dialog-profile.component";
import { UserProfile } from "../../../interfaces/user-profile.interface";
import { query } from "firebase/firestore";

@Component({
   selector: "app-workspace",
   standalone: true,
   imports: [CommonModule, RouterLink, MatDialogModule, CreateChannelComponent],
   templateUrl: "./workspace.component.html",
   styleUrl: "./workspace.component.scss",
})
export class WorkspaceComponent implements OnInit, OnDestroy {
   authService = inject(AuthenticationService);
   channelsListVisible: boolean = true;
   contactMessageListVisible: boolean = true;
   userService = inject(UserService);
   addChannel = new AddChannel();
   channels: AddChannel[] = [];
   firestore: Firestore = inject(Firestore);
   channelService = inject(ChannelService);
   selectedChannelId: string | null = null;
   selectedProfileName: string | null = null;
   dialog = inject(MatDialog);
   searchResults: any[] = [];
   filteredChannels: any[] = [];
   filteredUsers: any[] = [];
   filteredMessages: any[] = [];
   private cdr = inject(ChangeDetectorRef);
   onlineUsers: UserProfile[] = [];
   offlineUsers: UserProfile[] = [];
   private unsubscribeOnline: (() => void) | null = null;
   private unsubscribeOffline: (() => void) | null = null;

   hovering = false;
   hoveringChannelId: string | null = null;

   @Output() channelSelected = new EventEmitter<void>();

   constructor(private router: Router) {}

   ngOnInit(): void {
      this.userService.getAllOnlineUser();
      this.userService.getAllOfflineUser();
      const channelCollection = collection(this.firestore, "channel");
      collectionData(channelCollection, { idField: "channelId" }).subscribe((changes: any) => {
         this.channels = changes.map((change: any) => new AddChannel(change));
         this.channels = this.filterChannels(this.channels);
         this.sortWelcomeChannel();
      });

      this.subscribeToOnlineUsers();
      this.subscribeToOfflineUsers();
   }

   sortWelcomeChannel() {
      const welcomeChannelIndex = this.channels.findIndex((channel) => channel.channelName === "Willkommen");

      if (welcomeChannelIndex !== -1) {
         const welcomeChannel = this.channels.splice(welcomeChannelIndex, 1)[0];
         this.channels.unshift(welcomeChannel);
      }
   }

   ngOnDestroy(): void {
      if (this.unsubscribeOnline) {
         this.unsubscribeOnline();
      }
      if (this.unsubscribeOffline) {
         this.unsubscribeOffline();
      }
   }

   onMouseEnter() {
      this.hovering = true;
   }

   onMouseLeave() {
      this.hovering = false;
   }

   onMouseEnterChannel(channelId: string) {
      this.hoveringChannelId = channelId;
   }

   onMouseLeaveChannel(channelId: string) {
      this.hoveringChannelId = null;
   }

   trackByUserEmail(index: number, user: UserProfile): string {
      return user.email;
   }
   subscribeToOnlineUsers() {
      const onlineUsersQuery = query(collection(this.firestore, "users"), where("status", "==", "online"));

      this.unsubscribeOnline = onSnapshot(onlineUsersQuery, (snapshot) => {
         this.onlineUsers = snapshot.docs.map((doc) => doc.data() as UserProfile);
         this.cdr.detectChanges();
      });
   }
   subscribeToOfflineUsers() {
      const offlineUsersQuery = query(collection(this.firestore, "users"), where("status", "==", "offline"));

      this.unsubscribeOffline = onSnapshot(offlineUsersQuery, (snapshot) => {
         this.offlineUsers = snapshot.docs.map((doc) => doc.data() as UserProfile);
         this.cdr.detectChanges();
      });
   }

   opencloseChannels(): void {
      this.channelsListVisible = !this.channelsListVisible;
   }

   opencloseContactMessage(): void {
      this.contactMessageListVisible = !this.contactMessageListVisible;
   }

   openCreateChannelDialog() {
      this.dialog.open(CreateChannelComponent, {});
   }

   search(event: any): void {
      const searchTerm = event.target.value.toLowerCase().trim();

      if (searchTerm.trim() === "") {
         this.clearSearchResults();
         return;
      }

      this.filteredChannels = [];
      this.filteredUsers = [];
      this.filteredMessages = [];

      const channels = this.channels.filter((channel) => channel && channel.channelName && channel.channelName.toLowerCase().includes(searchTerm));
      this.filteredChannels.push(...channels.map((channel) => ({ name: channel.channelName, type: "channel", data: channel })));
      const onlineUsers = this.userService.onlineUser().filter((user) => user && user.name && user.name.toLowerCase().includes(searchTerm));
      this.filteredUsers.push(...onlineUsers.map((user) => ({ name: user.name, type: "user", data: user })));
      const offlineUsers = this.userService.offlineUser().filter((user) => user && user.name && user.name.toLowerCase().includes(searchTerm));
      this.filteredUsers.push(...offlineUsers.map((user) => ({ name: user.name, type: "user", data: user })));

      channels.forEach((channel) => {
         if (channel.messages) {
            channel.messages.forEach((message: any) => {
               if (message && message.text && message.text.toLowerCase().includes(searchTerm)) {
                  this.filteredMessages.push({
                     text: message.text,
                     channelName: channel.channelName,
                     channelId: channel.channelId,
                     messageId: message.messageId,
                     type: "message",
                     data: message,
                  });
               }
            });
         }
      });

      this.searchResults = [...this.filteredChannels, ...this.filteredUsers, ...this.filteredMessages];
   }

   selectResult(result: any): void {
      if (result.type === "channel") {
         this.selectChannel(result.data.channelId);
      } else if (result.type === "user") {
         this.selectProfile(result.data);
      } else if (result.type === "message") {
         this.selectMessage(result.data, result.data.channelId);
      }
      this.clearSearchResults();
   }

   selectChannel(channelId: string | undefined): void {
      this.clearSearchResults();
      this.channelSelected.emit();
   }

   selectProfile(user: UserProfile): void {
      this.dialog.open(DialogProfileComponent, {
         data: { user: user, currentUser: false },
      });
      this.channelSelected.emit();
   }

   selectMessage(message: any, channelId: string | undefined): void {
      this.selectChannel(channelId);
      this.router.navigate([`/home/${message.channelId}`]).then(() => {
         setTimeout(() => {
            const messageElement = document.getElementById(`message-${message.messageId}`);
            if (messageElement) {
               messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
         }, 500);
      });
   }

   clearSearchResults(): void {
      if (this.searchResults.length > 0) {
         this.searchResults = [];
      }
   }

   getCombinedChannels() {
      return [...this.filteredChannels, ...this.channels].filter((channel) => channel && channel.channelId && channel.channelName);
   }

   filterChannels(channels: AddChannel[]): AddChannel[] {
      const currentUserEmail = this.authService.currentUser?.email;
      const currentUserUid = this.authService.currentUser?.uid;

      return channels.filter((channel) => {
         return channel.userAccess.some((user) => user.email === currentUserEmail || user.uid === currentUserUid);
      });
   }
}
