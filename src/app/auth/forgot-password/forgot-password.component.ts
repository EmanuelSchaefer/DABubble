import { Component, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthenticationService } from "../../services/authentication.service";
import { MatFormFieldControl, MatFormFieldModule } from "@angular/material/form-field";
import { NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { Router } from "@angular/router";
import { merge } from "rxjs";

@Component({
   selector: "app-forgot-password",
   standalone: true,
   imports: [MatCardModule, MatFormFieldModule, FormsModule, ReactiveFormsModule, NgIf, MatInputModule],
   templateUrl: "./forgot-password.component.html",
   styleUrl: "./forgot-password.component.scss",
})
export class ForgotPasswordComponent {
   authService = inject(AuthenticationService);
   formBuilder = inject(FormBuilder);
   router = inject(Router);

   resetPasswordForm: FormGroup;
   errorMessage = "";

   constructor() {
      this.resetPasswordForm = this.formBuilder.group({
         email: ["", [Validators.required, Validators.email]],
      });

      merge(this.resetPasswordForm.get("email")!.statusChanges, this.resetPasswordForm.get("email")!.valueChanges).subscribe(() => this.updateErrorMessage());
   }

   updateErrorMessage() {
      const email = this.resetPasswordForm.get("email");

      if (email?.hasError("required")) {
         this.errorMessage = "Bitte E-Mail eingeben.";
      } else if (email?.hasError("email")) {
         this.errorMessage = "Diese E-Mail-Adresse ist leider ungültig.";
      } else {
         this.errorMessage = "";
      }
   }

   onSubmitReset() {
      if (this.resetPasswordForm.valid) {
         const email = this.resetPasswordForm.value.email;
         this.authService
            .resetPassword(email)
            .then(() => {
               this.authService.isSuccessMessageVisible = true;
               setTimeout(() => {
                  this.authService.isSuccessMessageVisible = false;
                 this.router.navigate(['/login']);
               }, 2400);
            })
            .catch((error) => {
               console.error("Fehler beim Zurücksetzen des Passworts", error);
            });
      }
   }

   goBack() {
      this.router.navigate(["/login"]);
   }
}
