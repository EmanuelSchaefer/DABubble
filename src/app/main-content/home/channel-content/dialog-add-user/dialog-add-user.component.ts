import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit, inject, model } from "@angular/core";
import { Firestore, arrayUnion, collection, doc, onSnapshot, updateDoc } from "@angular/fire/firestore";
import { FormsModule } from "@angular/forms";
import { UserProfile } from "../../../../interfaces/user-profile.interface";
import { ChannelService } from "../../../../services/channel.service";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
   selector: "app-dialog-add-user",
   standalone: true,
   imports: [FormsModule, CommonModule],
   templateUrl: "./dialog-add-user.component.html",
   styleUrl: "./dialog-add-user.component.scss",
})
export class DialogAddUserComponent implements OnInit {
   firestore = inject(Firestore);
   username = model<string>("");
   dialogRef = inject(DialogRef<DialogAddUserComponent>);
   currentChannelName: string = "";
   data = inject(MAT_DIALOG_DATA);
   channelService = inject(ChannelService);

   allUser: UserProfile[] = [];
   filteredUser: UserProfile[] = [];
   selectedUser: UserProfile | null = null;
   isUserInChannel: boolean = false;
   unsub: () => void = () => { };

   channelId: string = this.data.channelId;

   ngOnInit(): void {
      this.unsub = this.getAllUsersFromFirebase();
      this.channelService.getCurrentChannelName().subscribe((name) => {
         this.currentChannelName = name;
      });
   }

   ngOnChanges(): void {
      this.checkIfUserAlreadyInChannel();
   }

   checkIfUserAlreadyInChannel() {
      if (!this.selectedUser) return;

      const channelRef = doc(this.firestore, "channel", this.channelId);
      onSnapshot(channelRef, (channelDoc) => {
         const channelData = channelDoc.data();
         const usersInChannel = Array.isArray(channelData?.['userAccess']) ? channelData['userAccess'] : [];
         this.isUserInChannel = usersInChannel.some((user: UserProfile) => user.email === this.selectedUser?.email);
      });
   }

   ngOnDestroy(): void {
      this.unsub();
   }

   getAllUsersFromFirebase() {
      const userDocs = collection(this.firestore, "users");
      const unsub = onSnapshot(userDocs, (snapshot) => {
         this.allUser = snapshot.docs.map(doc => doc.data() as UserProfile);
         this.filteredUser = this.allUser;
      });
      return unsub;
   }

   searchForUserByInput() {
      this.filteredUser = this.allUser.filter((user) => user.name.toLowerCase().includes(this.username().toLowerCase()));
   }

   addToInput(user: UserProfile) {
      this.selectedUser = user;
      this.username.set("");
      this.checkIfUserAlreadyInChannel();
   }

   removeSelectedUser() {
      this.selectedUser = null;
      this.isUserInChannel = false;
   }

   async addUserToChannel() {
      if (this.isUserInChannel) return;

      try {
         const channelRef = doc(this.firestore, "channel", this.channelId);
         await updateDoc(channelRef, {
            userAccess: arrayUnion(this.selectedUser),
         });
         this.closeDialog();
      } catch (err) {
         console.error(err);
      }
   }

   closeDialog() {
      this.dialogRef.close();
   }
}