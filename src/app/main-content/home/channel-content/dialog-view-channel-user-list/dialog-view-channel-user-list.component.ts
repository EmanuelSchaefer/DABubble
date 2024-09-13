import { Component, OnInit, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { DialogAddUserComponent } from "../dialog-add-user/dialog-add-user.component";
import { UserProfile } from "../../../../interfaces/user-profile.interface";
import { DialogProfileComponent } from "../../header/dropdown-menu/dialog-profile/dialog-profile.component";
import { AuthenticationService } from "../../../../services/authentication.service";
import { ChannelService } from "../../../../services/channel.service";
import { ActivatedRoute } from "@angular/router";

@Component({
   selector: "app-dialog-view-channel-user-list",
   standalone: true,
   imports: [CommonModule],
   templateUrl: "./dialog-view-channel-user-list.component.html",
   styleUrl: "./dialog-view-channel-user-list.component.scss",
})
export class DialogViewChannelUserListComponent implements OnInit {
   dialog = inject(MatDialog);
   dialogRef = inject(MatDialogRef<DialogViewChannelUserListComponent>);
   authService = inject(AuthenticationService);
   route = inject(ActivatedRoute);

   data = inject(MAT_DIALOG_DATA);
   userInChannel: UserProfile[] = this.data.userAccess;
   channelId: string = this.data.currentChannelId;

   ngOnInit(): void { }

   openAddUserDialog() {
      this.dialogRef.close();
      this.dialog.open(DialogAddUserComponent, {
         position: this.data.dialogPosition,
         data: { channelId: this.channelId },
      });
   }

   close() {
      this.dialogRef.close();
   }

   openUserProfile(user: UserProfile) {
      this.dialog.open(DialogProfileComponent, {
         data: { user: user, currentUser: false },
      });
   }
}