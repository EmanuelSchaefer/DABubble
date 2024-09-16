import { AfterViewInit, ChangeDetectorRef, Component, Inject, inject, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { WorkspaceComponent } from "./workspace/workspace.component";
import { HeaderComponent } from "./header/header.component";
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { CreateChannelComponent } from "./workspace/create-channel/create-channel.component";
import { ThreadComponent } from "./thread/thread.component";
import { ChannelContentComponent } from "./channel-content/channel-content.component";
import { RouterOutlet } from "@angular/router";
import { ThreadService } from "../../services/thread.service";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
   selector: "app-home",
   standalone: true,
   imports: [CommonModule, WorkspaceComponent, MatDialogModule, RouterOutlet, HeaderComponent, MatSidenavModule, CreateChannelComponent, ThreadComponent, ChannelContentComponent],
   templateUrl: "./home.component.html",
   styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit, AfterViewInit {
   isToggled: boolean = false;
   hover: boolean = false;
   showMainContent: boolean = true;
   threadService = inject(ThreadService);
   dialog = inject(MatDialog);
   @ViewChild("thread") thread!: MatDrawer;
   @ViewChild("drawer") drawer!: MatDrawer;
   cdr = inject(ChangeDetectorRef);
   showWorkspace: boolean = true;
   isLargeScreen: boolean = true;
   mobileQuery: MediaQueryList;
   drawerOpen: boolean = true;

   constructor(private mediaMatcher: MediaMatcher) {
      this.mobileQuery = mediaMatcher.matchMedia("(max-width: 1000px)");

      if (this.mobileQuery.addEventListener) {
         this.mobileQuery.addEventListener("change", () => this.checkScreenSize());
      } else {
         this.mobileQuery.addListener(() => this.checkScreenSize());
      }
   }

   ngOnInit(): void {
      this.checkScreenSize();
      this.threadService.openThread$.subscribe(() => {
         this.thread.open();
         this.checkThreadAndScreenSize();
         this.cdr.detectChanges();
      });
      this.threadService.closeThread$.subscribe(() => {
         this.thread.close();
         this.showMainContent = true;
         this.cdr.detectChanges();
      });
   }
   ngAfterViewInit(): void {
      this.checkScreenSize();
      this.cdr.detectChanges();
      this.drawer.openedChange.subscribe((isOpened) => {
         this.drawerOpen = isOpened;
      });
   }

   checkScreenSize(): void {
      this.isLargeScreen = !this.mobileQuery.matches;
   }

   checkThreadAndScreenSize(): void {
      if (!this.isLargeScreen && this.thread.opened && window.innerWidth <= 1000) {
         this.showMainContent = false;
         this.cdr.detectChanges();
      }
   }

   openCreateChannelDialog() {
      const dialogRef = this.dialog.open(CreateChannelComponent, {
         width: "500px",
      });

      dialogRef.afterClosed();
   }

   toggleImage() {
      this.isToggled = !this.isToggled;
   }

   getImageSource(): string {
      if (this.hover) {
         return this.isToggled ? "/dabubble/browser/public/img/workspaceImg/Frame 18.png" : "/dabubble/browser/public/img/workspaceImg/Frame 41.png";
      } else {
         return this.isToggled ? "/dabubble/browser/public/img/workspaceImg/Group 2.png" : "/dabubble/browser/public/img/workspaceImg/Hide-navigation.png";
      }
   }

   toggleDrawer(): void {
      this.drawer.toggle();
      this.toggleImage();
      this.cdr.detectChanges();
   }
   onChannelSelected(): void {
      if (!this.isLargeScreen) {
         this.drawer.close();
         this.thread.close();
         this.cdr.detectChanges();
      }
   }
}