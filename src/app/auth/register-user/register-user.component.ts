import { NgIf } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormGroup } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Router, RouterLink } from "@angular/router";
import { merge } from "rxjs";
import { AuthenticationService } from "../../services/authentication.service";

@Component({
   selector: "app-register-user",
   standalone: true,
   imports: [MatCardModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, NgIf, RouterLink],
   templateUrl: "./register-user.component.html",
   styleUrl: "./register-user.component.scss",
})
export class RegisterUserComponent {
   authService = inject(AuthenticationService);
   router = inject(Router);

   errorMessage = "";
   nameErrorMessage = "";
   passwordErrorMessage = "";
   privacyPolicyErrorMessage = "";

   hovering = false;

   constructor() {
      merge(
         this.authService.registerForm.get("name")!.statusChanges,
         this.authService.registerForm.get("name")!.valueChanges,
         this.authService.registerForm.get("email")!.statusChanges,
         this.authService.registerForm.get("email")!.valueChanges,
         this.authService.registerForm.get("password")!.statusChanges,
         this.authService.registerForm.get("password")!.valueChanges,
         this.authService.registerForm.get("privacyPolicy")!.statusChanges,
         this.authService.registerForm.get("privacyPolicy")!.valueChanges
      ).subscribe(() => this.updateErrorMessages());
   }

   onMouseEnter() {
      this.hovering = true;
   }

   onMouseLeave() {
      this.hovering = false;
   }

   async onSubmit() {
      const email = this.authService.registerForm.get("email")!.value;
      const isRegistered = await this.authService.isUserRegistered(email!);

      if (isRegistered) {
         this.errorMessage = "Diese E-Mail-Adresse ist bereits registriert.";
         return;
      }

      if (this.authService.registerForm.valid) {
         this.router.navigate(["/avatar"]);
      } else {
         this.authService.registerForm.markAllAsTouched();
         this.updateErrorMessages();
      }
   }

   async onButtonClick() {
      if (this.authService.registerForm.valid) {
         this.onSubmit();
      } else {
         this.authService.registerForm.markAllAsTouched();
         this.updateErrorMessages();
      }
   }

   updateErrorMessages() {
      const name = this.authService.registerForm.get("name");
      const email = this.authService.registerForm.get("email");
      const password = this.authService.registerForm.get("password");
      const privacyPolicy = this.authService.registerForm.get("privacyPolicy");

      if (email?.hasError("required")) {
         this.errorMessage = "Bitte E-Mail eingeben.";
      } else if (email?.hasError("email")) {
         this.errorMessage = "Diese E-Mail-Adresse ist leider ungültig.";
      } else {
         this.errorMessage = "";
      }

      if (password?.hasError("required")) {
         this.passwordErrorMessage = "Bitte Passwort eingeben.";
      } else if (password?.hasError("minlength")) {
         this.passwordErrorMessage = "Das Passwort muss mindestens 6 Zeichen lang sein.";
      } else {
         this.passwordErrorMessage = "";
      }

      if (name?.hasError("required")) {
         this.nameErrorMessage = "Bitte schreiben Sie einen Namen.";
      } else {
         this.nameErrorMessage = "";
      }
      if (privacyPolicy?.hasError("required")) {
         this.privacyPolicyErrorMessage = "Sie müssen der Datenschutzerklärung zustimmen.";
      } else {
         this.privacyPolicyErrorMessage = "test";
      }
   }

   goBack() {
      this.authService.registerForm.reset();
      this.router.navigate(["/login"]);
   }
}
