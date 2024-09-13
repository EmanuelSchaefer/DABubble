import { Component, inject, signal } from "@angular/core";
import { AuthenticationService } from "../../../../../services/authentication.service";
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, updateEmail, updateProfile } from "@angular/fire/auth";
import { DialogRef } from "@angular/cdk/dialog";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { PickAvatarComponent } from "../../../../../auth/pick-avatar/pick-avatar.component";
import { ProfileAvatarPickerComponent } from "../profile-avatar-picker/profile-avatar-picker.component";
import { collection, doc, Firestore, getDocs, updateDoc, where, writeBatch } from "@angular/fire/firestore";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgClass, NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { merge } from "rxjs";
import { UserService } from "../../../../../services/user.service";
import { query } from "firebase/firestore";

@Component({
   selector: "app-dialog-edit-profile",
   standalone: true,
   imports: [FormsModule, MatCardModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, NgIf, NgClass, MatInputModule],
   templateUrl: "./dialog-edit-profile.component.html",
   styleUrl: "./dialog-edit-profile.component.scss",
})
export class DialogEditProfileComponent {
   authService = inject(AuthenticationService);
   dialogRef = inject(DialogRef<DialogEditProfileComponent>);
   dialog = inject(MatDialog);
   userService = inject(UserService);
   firestore = inject(Firestore);
   formBuilder = inject(FormBuilder);

   username = signal(this.authService.currentUser?.displayName);
   email = signal(this.authService.currentUser?.email);
   user = this.authService.currentUser;
   userSuccessfullyUpdated = false;
   isSaveButtonEnabled = false;
   usernameErrorMessage = "";
   emailErrorMessage = "";
   originalUsername: string;
   originalEmail: string;

   // emailControl = new FormControl(this.email(), [Validators.required, Validators.email]);
   profileForm: FormGroup;

   constructor() {
      if (this.user) {
         this.originalUsername = this.user.displayName || "";
         this.originalEmail = this.user.email || "";
      } else {
         this.originalUsername = "";
         this.originalEmail = "";
      }

      this.profileForm = this.formBuilder.group({
         username: [this.originalUsername, [Validators.required]],
         email: [this.originalEmail, [Validators.required, Validators.email]],
      });

      merge(
         this.profileForm.get("email")!.statusChanges,
         this.profileForm.get("email")!.valueChanges,
         this.profileForm.get("username")!.statusChanges,
         this.profileForm.get("username")!.valueChanges
      ).subscribe(() => this.updateFormStatus());
   }

   updateFormStatus() {
      const currentUsername = this.profileForm.get("username")?.value;
      const currentEmail = this.profileForm.get("email")?.value;
      const isFormValid = this.profileForm.valid;
      const isChanged = currentUsername !== this.originalUsername || currentEmail !== this.originalEmail;
      const isNotEmpty = currentUsername.trim() !== "" && currentEmail.trim() !== "";
      this.isSaveButtonEnabled = isFormValid && isChanged && isNotEmpty;
   }

   updateErrorMessages() {
      const email = this.profileForm.get("email");
      const username = this.profileForm.get("username");

      if (email?.hasError("required")) {
         this.emailErrorMessage = "Bitte E-Mail-Adresse eingeben.";
      } else if (email?.hasError("email")) {
         this.emailErrorMessage = "Diese E-Mail-Adresse ist leider ungültig.";
      } else {
         this.emailErrorMessage = "";
      }

      if (username?.hasError("required")) {
         this.usernameErrorMessage = "Bitte vollständigen Namen eingeben.";
      } else {
         this.usernameErrorMessage = "";
      }
   }

   async updateUserProfile() {
      if (this.profileForm.invalid) {
         this.profileForm.markAllAsTouched();
         this.updateErrorMessages();
         return;
      }

      if (this.user) {
         const oldEmail = this.user.email;
         const newEmail = this.profileForm.get("email")?.value;
         const newUsername = this.profileForm.get("username")?.value;

         try {
            if (this.user.email) {
               // const credential = EmailAuthProvider.credential(this.user.email, prompt("Bitte geben Sie Ihr Passwort zur Bestätigung ein:") || "");
               // await reauthenticateWithCredential(this.user, credential);

               if (newUsername && newUsername !== this.user.displayName) {
                  await updateProfile(this.user, { displayName: newUsername });
               }

               if (newEmail && newEmail !== oldEmail) {
                  await updateEmail(this.user, newEmail);
                  await sendEmailVerification(this.user);
               }
               const userRef = doc(this.firestore, `users/${this.user.uid}`);
               await updateDoc(userRef, {
                  name: newUsername,
                  email: newEmail,
               });
               this.userSuccessfullyUpdated = true;
            } else {
               console.error("E-Mail-Adresse ist null oder nicht definiert.");
            }
         } catch (error) {
            if (error instanceof Error) {
               console.error("Fehler bei der Aktualisierung des Profils:", error.message);

               if ((error as any).code === "auth/requires-recent-login") {
                  alert("Bitte loggen Sie sich erneut ein, um diese Änderung vorzunehmen.");
               } else {
                  console.error("Ein anderer Fehler ist aufgetreten:", error);
               }
            } else {
               console.error("Unbekannter Fehler:", error);
            }
         }
      }
      this.userService.getAllOnlineUser();
      this.userService.getAllOfflineUser();
      this.close();
   }

   close() {
      this.dialogRef.close();
   }

   selectAvatar() {
      let rightPosition = "580px";
      let topPosition = "150px";
      let widthDialog = "fit-content";

      if (window.innerWidth <= 900) {
         rightPosition = "-100px";
      }

      if (window.innerWidth <= 600) {
         rightPosition = "0px";
         topPosition = "0px";
         widthDialog = "100vw";
      }

      const dialogRef = this.dialog.open(ProfileAvatarPickerComponent, {
         position: { right: rightPosition, top: topPosition },
         panelClass: "dropdown-dialog",
         autoFocus: false,
         width: widthDialog,
      });

      dialogRef.afterClosed().subscribe((result) => {
         if (result) {
            this.updateUserProfilePhoto(result);
         }
      });
   }

   async updateUserProfilePhoto(photoURL: string) {
      if (this.user) {
         const userRef = doc(this.firestore, `users/${this.user.uid}`);
         await updateDoc(userRef, {
            photoUrl: photoURL,
            lastUpdated: Date.now(),
         });

         await updateProfile(this.user, { photoURL });
         await this.updateChannelsWithNewPhotoUrl(photoURL);
         await this.user.reload();

         this.dialogRef.close();
      }
   }
   async updateChannelsWithNewPhotoUrl(photoURL: string) {
      if (this.user && this.user.uid) {
         const channelsCollection = collection(this.firestore, "channel");
         const snapshot = await getDocs(channelsCollection);

         if (snapshot.empty) {
            return;
         }

         const batch = writeBatch(this.firestore);
         let batchUpdated = false;

         snapshot.forEach((doc) => {
            const channelData = doc.data();
            const userAccess = channelData["userAccess"].map((member: any) => {
               if (member.uid === this.user!.uid) {
                  batchUpdated = true;
                  return {
                     ...member,
                     photoUrl: photoURL,
                  };
               }
               return member;
            });

            if (batchUpdated) {
               const channelRef = doc.ref;
               batch.update(channelRef, { userAccess: userAccess });
            }
         });
      } else {
         console.error("User oder User ID ist null.");
      }
   }
}
