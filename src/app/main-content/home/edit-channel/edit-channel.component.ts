import { Component, Inject, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ChannelService } from "../../../services/channel.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { CommonModule } from "@angular/common";
import { UserProfile } from "../../../interfaces/user-profile.interface";
import { DialogProfileComponent } from "../header/dropdown-menu/dialog-profile/dialog-profile.component";
import { DialogAddUserComponent } from "../channel-content/dialog-add-user/dialog-add-user.component";

@Component({
   selector: "app-edit-channel",
   standalone: true,
   imports: [CommonModule, FormsModule],
   templateUrl: "./edit-channel.component.html",
   styleUrl: "./edit-channel.component.scss",
})
export class EditChannelComponent implements OnInit {
   currentChannelName: string = "";
   currentChannelDescription: string = "";
   editedChannelName: string = "";
   editedChannelDescription: string = "";
   isEditingName: boolean = false;
   isEditingDescription: boolean = false;
   channelId: string = "";
   creatorName: string = "";
   showErrorMessage: boolean = false;
   showSuccessMessage: boolean = false;
   authService = inject(AuthenticationService);
   dialog = inject(MatDialog);
   dialogRef = inject(MatDialogRef<EditChannelComponent>);
   data = inject(MAT_DIALOG_DATA);
   userInChannel: UserProfile[] = this.data.this;
   channelService = inject(ChannelService);
   channelExists: boolean = false;
   isEditAllowed: boolean = true;

   ngOnInit(): void {
      this.channelId = this.data.channelId;
      if (this.channelId === "MeCr1XlRySnaAv81qBMK") {
         this.isEditAllowed = false;
      }
      this.channelService.getChannelById(this.channelId).subscribe(
         (channel) => {
            this.currentChannelName = channel.channelName;
            this.currentChannelDescription = channel.description;
            this.creatorName = channel.creatorName;
            this.userInChannel = channel.userAccess || [];
         },
         (error) => {
            console.error("Fehler beim Laden des Channels:", error);
         }
      );
   }

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

   startEditing(field: string, event: Event) {
      event.stopPropagation();
      if (field === "name") {
         this.editedChannelName = this.currentChannelName;
         this.isEditingName = true;
      } else if (field === "description") {
         this.editedChannelDescription = this.currentChannelDescription;
         this.isEditingDescription = true;
      }
   }

   async saveChanges(field: string) {
      if (!this.isEditAllowed) {
         return;
      }
      if (field === "name") {
         if (!(await this.checkChannelAvailability())) {
            this.channelService
               .updateChannelName(this.channelId, this.editedChannelName)
               .then(() => {
                  this.currentChannelName = this.editedChannelName;
                  this.isEditingName = false;
               })
               .catch((error) => {
                  console.error("Error updating channel name:", error);
               });
         }
      } else if (field === "description") {
         this.channelService
            .updateChannelDescription(this.channelId, this.editedChannelDescription)
            .then(() => {
               this.currentChannelDescription = this.editedChannelDescription;
               this.isEditingDescription = false;
            })
            .catch((error) => {
               console.error("Error updating channel description:", error);
            });
      }
   }

   checkChannelAvailability(): Promise<boolean> {
      return new Promise((resolve, reject) => {
         this.channelService.getAllChannels().subscribe(
            (channels) => {
               this.channelExists = channels.some((channel) => channel.channelName === this.editedChannelName && channel.channelId !== this.channelId);
               resolve(this.channelExists);
            },
            (error) => {
               console.error("Fehler beim Abrufen der Channels:", error);
               reject(false);
            }
         );
      });
   }

   channelIsAvailable(): boolean {
      return this.channelExists;
   }

   leaveChannel() {
      const userId = this.authService.currentUser?.uid;

      if (!userId) {
         this.showSuccessMessage = false;
         this.showErrorMessage = true;
         return;
      }

      this.channelService
         .leaveChannel(this.channelId)
         .then(() => {
            this.showSuccessMessage = true;
            this.showErrorMessage = false;
            this.redirectToAnotherChannel();
            setTimeout(() => {
               this.close();
            }, 2500);
         })
         .catch((error) => {
            console.error(error);
            this.showSuccessMessage = false;
            this.showErrorMessage = true;
         });
   }

   redirectToAnotherChannel() {
      this.channelService.getAllChannels().subscribe({
         next: (channels) => {
            const otherChannel = channels.find((channel) => channel.channelId !== this.channelId);

            if (otherChannel) {
               this.channelService.navigateToChannel(otherChannel.channelId);
            } else {
               this.channelService.navigateToOverview();
            }
         },
         error: (error) => {
            console.error("Fehler beim Abrufen der Channels:", error);
            this.channelService.navigateToOverview();
         },
      });
   }
}
