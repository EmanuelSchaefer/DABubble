import { Component, inject, OnInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { merge } from "rxjs";
import { NgIf } from "@angular/common";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink, Router } from "@angular/router";
import { AuthenticationService } from "../../services/authentication.service";

@Component({
   selector: "app-login",
   standalone: true,
   imports: [MatCardModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, NgIf, MatDividerModule, MatIconModule, RouterLink],
   templateUrl: "./login.component.html",
   styleUrl: "./login.component.scss",
})
export class LoginComponent {
   authService = inject(AuthenticationService);
   formBuilder = inject(FormBuilder);
   router = inject(Router);

   loginForm: FormGroup;

   errorMessage = "";
   passwordErrorMessage = "";

   isGuestLogin = false;

   constructor() {
      this.loginForm = this.formBuilder.group({
         email: ["", [Validators.required, Validators.email]],
         password: ["", [Validators.required]],
      });
      merge(
         this.loginForm.get("email")!.statusChanges,
         this.loginForm.get("email")!.valueChanges,
         this.loginForm.get("password")!.statusChanges,
         this.loginForm.get("password")!.valueChanges
      ).subscribe(() => this.updateErrorMessages());
   }

   updateErrorMessages() {
      const email = this.loginForm.get("email");
      const password = this.loginForm.get("password");

      if (email?.hasError("required")) {
         this.errorMessage = "Bitte E-Mail eingeben.";
      } else if (email?.hasError("email")) {
         this.errorMessage = "Diese E-Mail-Adresse ist leider ungültig.";
      } else {
         this.errorMessage = "";
      }

      if (password?.hasError("required")) {
         this.passwordErrorMessage = "Bitte Passwort eingeben";
      } else {
         this.passwordErrorMessage = "";
      }
   }

   onLogin() {
      this.isGuestLogin = false;
      if (this.loginForm.valid) {
         const email = this.loginForm.get("email")?.value;
         const password = this.loginForm.get("password")?.value;

         if (email && password) {
            this.authService
               .login(email, password)
               .then(async () => {
                  await this.authService.getCustomUserProfile(this.authService.currentUser!.uid);
                  await this.authService.updateUserStatusToOnline(this.authService.currentUser!);
                  this.router.navigate(["/home/MeCr1XlRySnaAv81qBMK"]);
               })
               .catch((error) => {
                  (this.errorMessage = error), "E-Mail / Passwort nicht korrekt.";
               });
         } else {
            this.errorMessage = "Bitte E-Mail und Passwort eingeben.";
         }
      } else {
         this.loginForm.markAllAsTouched();
         this.updateErrorMessages();
      }
   }

   async onGoogleSignIn() {
      this.authService
         .googleSignIn()
         .then(() => {
            this.authService.createUserProfile(this.authService.currentUser!);
            this.authService.updateUserStatusToOnline(this.authService.currentUser!);
            this.router.navigate(["/home"]);
         })
         .catch((error) => {
            this.errorMessage = error.message;
         });
   }

   async onGuestLogin() {
      this.authService.isGuestLogin.set(true);
      this.isGuestLogin = true;
      this.authService
         .guestLogin()
         .then(() => {
            this.authService.createUserProfile(this.authService.currentUser!);
            this.authService.updateUserStatusToOnline(this.authService.currentUser!);
            this.router.navigate(["/home/MeCr1XlRySnaAv81qBMK"]);
         })
         .catch((error) => {
            this.errorMessage = error.message;
         });
   }
}
