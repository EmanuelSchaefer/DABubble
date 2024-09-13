import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, viewChild, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DropdownMenuComponent } from "./dropdown-menu/dropdown-menu.component";
import { MatButtonModule } from "@angular/material/button";
import { AuthenticationService } from "../../../services/authentication.service";
import { AddChannel } from "../../../models/addChannel.class";
import { UserService } from "../../../services/user.service";
import { ChannelService } from "../../../services/channel.service";
import { DialogProfileComponent } from "./dropdown-menu/dialog-profile/dialog-profile.component";
import { Firestore, collectionData, collection } from "@angular/fire/firestore";
import { RouterLink, Router } from "@angular/router";
import { UserProfile } from "firebase/auth";
import { MatDrawer } from "@angular/material/sidenav";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
   selector: "app-header",
   standalone: true,
   imports: [MatDialogModule, MatButtonModule, CommonModule, RouterLink],
   templateUrl: "./header.component.html",
   styleUrl: "./header.component.scss",
})
export class HeaderComponent implements AfterViewInit {
   dialog = inject(MatDialog);
   authService = inject(AuthenticationService);
   userService = inject(UserService);
   channelService = inject(ChannelService);
   channels: AddChannel[] = [];
   searchResults: any[] = [];
   filteredChannels: any[] = [];
   filteredUsers: any[] = [];
   filteredMessages: any[] = [];
   selectedChannelId: string | null = null;
   selectedProfileName: string | null = null;

   @ViewChild("profilContainer") profilContainer!: ElementRef;
   @Output() drawerToggle = new EventEmitter<void>();
   @Input() drawerOpen: boolean = false;
   isToggled: boolean = false;
   isLargeScreen: boolean = true;
   cdr = inject(ChangeDetectorRef);
   mobileQuery: MediaQueryList;

   constructor(private router: Router, private mediaMatcher: MediaMatcher) {
      this.mobileQuery = mediaMatcher.matchMedia("(max-width: 1000px)");

      if (this.mobileQuery.addEventListener) {
         this.mobileQuery.addEventListener("change", () => this.checkScreenSize());
      } else {
         this.mobileQuery.addListener(() => this.checkScreenSize());
      }
   }

   ngOnInit(): void {
      this.loadChannels();
      this.userService.getAllOnlineUser();
      this.userService.getAllOfflineUser();
      this.checkScreenSize();
   }

   ngAfterViewInit() {
      this.checkScreenSize();
      this.cdr.detectChanges();
   }

   loadChannels(): void {
      const channelCollection = collection(this.channelService.firestore, "channel");
      collectionData(channelCollection, { idField: "channelId" }).subscribe((changes: any) => {
         this.channels = changes.map((change: any) => new AddChannel(change));
         this.channels = this.filterChannels(this.channels);
      });
   }

   toggleDrawer(): void {
      this.drawerToggle.emit();
      this.drawerOpen = !this.drawerOpen;
   }

   toggleImage() {
      this.isToggled = !this.isToggled;
   }

   checkScreenSize(): void {
      this.isLargeScreen = !this.mobileQuery.matches;
      if (this.isLargeScreen) {
         this.drawerOpen = true;
      }
   }

   openDialog() {
      if (this.profilContainer) {
         const rect = this.profilContainer.nativeElement.getBoundingClientRect();
         let leftPosition = rect.left - 100;

         if (window.innerWidth <= 950) {
            leftPosition = window.innerWidth - 300;
         }

         this.dialog.open(DropdownMenuComponent, {
            position: { left: `${leftPosition}px`, top: `${rect.bottom}px` },
            panelClass: "dropdown-dialog",
            autoFocus: false,
         });
      }
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
         this.selectMessage(result.data);
      }
      this.clearSearchResults();
   }

   selectChannel(channelId: string | undefined): void {
      this.clearSearchResults();
      this.router.navigate([`/home/${channelId}`]);
   }

   selectProfile(user: UserProfile): void {
      this.dialog.open(DialogProfileComponent, {
         data: { user: user, currentUser: false },
      });
   }

   clearSearchResults(): void {
      if (this.searchResults.length > 0) {
         this.searchResults = [];
      }
   }

   selectMessage(message: any): void {
      this.router.navigate([`/home/${message.channelId}`]).then(() => {
         setTimeout(() => {
            const messageElement = document.getElementById(`message-${message.messageId}`);
            if (messageElement) {
               messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
         }, 500);
      });
   }

   getCombinedChannels() {
      return [...this.filteredChannels, ...this.channels].filter((channel) => channel && channel.channelId && channel.channelName);
   }

   filterChannels(channels: AddChannel[]): AddChannel[] {
      const currentUserEmail = this.authService.currentUser?.email;
      const currentUserUid = this.authService.currentUser?.uid;
      return channels.filter((channel) => channel.userAccess.some((user) => user.email === currentUserEmail || user.uid === currentUserUid));
   }
}
