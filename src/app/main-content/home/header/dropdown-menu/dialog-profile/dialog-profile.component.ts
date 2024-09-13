import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from "@angular/core";
import { AuthenticationService } from "../../../../../services/authentication.service";
import { MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { DialogRef } from "@angular/cdk/dialog";
import { DialogEditProfileComponent } from "../dialog-edit-profile/dialog-edit-profile.component";
import { UserProfile } from "../../../../../interfaces/user-profile.interface";
import { Firestore, Unsubscribe, collection, getDocs, onSnapshot, query, where } from "@angular/fire/firestore";
import { ChannelService } from "../../../../../services/channel.service";
import { NgIf } from "@angular/common";

@Component({
   selector: "app-dialog-profile",
   standalone: true,
   imports: [NgIf],
   templateUrl: "./dialog-profile.component.html",
   styleUrl: "./dialog-profile.component.scss",
})
export class DialogProfileComponent implements OnDestroy {
   authService = inject(AuthenticationService);
   firestore: Firestore = inject(Firestore);
   channelService = inject(ChannelService);
   dialog = inject(MatDialog);
   dialogRef = inject(DialogRef<DialogProfileComponent>);
   data = inject(MAT_DIALOG_DATA);
   user: UserProfile | null = null;
   unsub: Unsubscribe | null = null;
   isCurrentUser: boolean = false;

   @ViewChild("dialogContainer") dialogContainer!: ElementRef;

   constructor() {
      this.checkIfCurrentUser();
      if (!this.data.currentUser) {
         this.unsub = this.getUser();
      }
   }

   ngOnDestroy(): void {
      if (this.unsub) {
         this.unsub();
      }
   }

   checkIfCurrentUser(): void {
      const currentUser = this.authService.currentUser;
      this.isCurrentUser = currentUser ? currentUser.uid === this.data.user.uid : false;
   }

   openDialog() {
      if (this.dialogContainer) {
         const rect = this.dialogContainer.nativeElement.getBoundingClientRect();
         let leftPosition = rect.left;
         let topPosition = "90";
         let widthDialog = "fit-content";

         if (window.innerWidth <= 950) {
            leftPosition = rect.left - 100;
         }
         if (window.innerWidth <= 600) {
            widthDialog = "100vw";
            topPosition = "8";
         }

         this.dialog.open(DialogEditProfileComponent, {
            position: { left: `${leftPosition}px`, top: `${topPosition}px` },
            panelClass: "dropdown-dialog",
            autoFocus: false,
            width: `${widthDialog}`,
         });
      }
   }

   getUser() {
      const q = query(collection(this.firestore, "users"), where("name", "==", this.data.user.name));

      const unsub = onSnapshot(q, (snapshot) => {
         snapshot.forEach((doc) => {
            this.user = doc.data() as UserProfile;
         });
      });
      return unsub;
   }

   closeProfileDialog() {
      this.dialogRef.close();
   }

   //  openPrivateChat() {
   //     this.channelService.openPrivateChat(this.data.user.uid);
   //     this.closeProfileDialog();
   //  }

   async startPrivateChat() {
      if (this.user) {
         const userName = this.user.name;
         const q = query(collection(this.firestore, "users"), where("name", "==", userName));
         const querySnapshot = await getDocs(q);
         let userId: string | null = null;

         querySnapshot.forEach((doc) => {
            if (doc.exists()) {
               const userData = doc.data() as UserProfile;
               userId = doc.id;
            }
         });

         if (userId) {
            this.channelService.openPrivateChat(userId);
            this.closeProfileDialog();
         } else {
            console.error("User not found");
         }
      }
   }
}
