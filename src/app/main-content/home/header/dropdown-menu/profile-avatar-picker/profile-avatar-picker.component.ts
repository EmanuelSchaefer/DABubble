import { Component, inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { AuthenticationService } from "../../../../../services/authentication.service";
import { NgFor, NgStyle } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
   selector: "app-profile-avatar-picker",
   standalone: true,
   imports: [NgFor, MatCardModule, MatIconModule, NgStyle],
   templateUrl: "./profile-avatar-picker.component.html",
   styleUrl: "./profile-avatar-picker.component.scss",
})
export class ProfileAvatarPickerComponent {
   auth = inject(Auth);
   router = inject(Router);
   authService = inject(AuthenticationService);
   dialogRef = inject(MatDialogRef<ProfileAvatarPickerComponent>);

   defaultAvatar: string = "/dabubble/browser/public/img/profile-pics-register/avatar_default.png";
   selectedAvatar: string | null = null;
   avatars: string[] = [
      "/dabubble/browser/public/img/profile-pics-register/avatar_female_1.png",
      "/dabubble/browser/public/img/profile-pics-register/avatar_male_1.png",
      "/dabubble/browser/public/img/profile-pics-register/avatar_male_2.png",
      "/dabubble/browser/public/img/profile-pics-register/avatar_male_3.png",
      "/dabubble/browser/public/img/profile-pics-register/avatar_female_2.png",
      "/dabubble/browser/public/img/profile-pics-register/avatar_male_4.png",
   ];
   nameValue = this.authService.registerForm.get("name");
   currentUserName = this.nameValue?.value;
   file: string = "";

   user = inject(AuthenticationService).currentUser;

   constructor() { }

   goBack() {
      this.router.navigate(["/register-user"]);
   }

   selectAvatar(avatar: string) {
      this.selectedAvatar = avatar;
   }

   confirmSelection() {
      if (this.selectedAvatar) {
         this.dialogRef.close(this.selectedAvatar);
      } else {
         this.dialogRef.close();
      }
   }

   close() {
      this.dialogRef.close();
   }
}