import { NgFor, NgStyle } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { Router } from "@angular/router";
import { AuthenticationService } from "../../services/authentication.service";
import { Auth } from "@angular/fire/auth";
import { MatIconModule } from "@angular/material/icon";
import { getDownloadURL, getStorage, ref, uploadBytes } from "@angular/fire/storage";
@Component({
   selector: "app-pick-avatar",
   standalone: true,
   imports: [MatCardModule, NgFor, MatIconModule, NgStyle],
   templateUrl: "./pick-avatar.component.html",
   styleUrl: "./pick-avatar.component.scss",
})
export class PickAvatarComponent {
   auth = inject(Auth);
   router = inject(Router);
   authService = inject(AuthenticationService);

   defaultAvatar: string = "./public/img/profile-pics-register/avatar_default.png";
   selectedAvatar: string | null = null;
   avatars: string[] = [
      "./public/img/profile-pics-register/avatar_female_1.png",
      "./public/img/profile-pics-register/avatar_male_1.png",
      "./public/img/profile-pics-register/avatar_male_2.png",
      "./public/img/profile-pics-register/avatar_male_3.png",
      "./public/img/profile-pics-register/avatar_female_2.png",
      "./public/img/profile-pics-register/avatar_male_4.png",
   ];
   nameValue = this.authService.registerForm.get("name");
   currentUserName = this.nameValue?.value;
   file: string = "";

   constructor() {}

   selectAvatar(avatar: string) {
      this.selectedAvatar = avatar;
      this.authService.avatar = avatar;
   }

   goBack() {
      this.router.navigate(["/register-user"]);
   }
   async onFileChange(event: any) {
      const files = event.target.files as FileList;

      if (files.length > 0) {
         const file = files[0];
         const storage = getStorage();
         const storageRef = ref(storage, `avatars/${file.name}`);
         await uploadBytes(storageRef, file);
         const downloadURL = await getDownloadURL(storageRef);
         this.selectedAvatar = downloadURL;
         this.authService.avatar = downloadURL;
         this.resetInput();
      }
   }

   resetInput() {
      const input = document.getElementById("avatar-input-file") as HTMLInputElement;
      if (input) {
         input.value = "";
      }
   }

   playSuccessAnimation() {
      setTimeout(() => {
         this.authService.isSuccessMessageVisible = false;
      }, 2200);
   }
}
