import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { merge } from 'rxjs';
import { AuthenticationService } from '../../services/authentication.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, RouterLink, NgIf, ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  authService = inject(AuthenticationService);
  formBuilder = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);

  changePasswordForm: FormGroup;
  passwordErrorMessage = '';
  confirmPasswordErrorMessage = '';
  actionCode: string | null = null;

  constructor() {
    this.changePasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validator: this.passwordMatchValidator });

    this.route.queryParams.subscribe(params => {
      this.actionCode = params['oobCode'];
    });

    merge(
      this.changePasswordForm.get('password')!.statusChanges,
      this.changePasswordForm.get('password')!.valueChanges,
      this.changePasswordForm.get('confirmPassword')!.statusChanges,
      this.changePasswordForm.get('confirmPassword')!.valueChanges
    ).subscribe(() => this.updateErrorMessages());
  }

  passwordMatchValidator(control: FormGroup) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      return null;
    }
  }

  onSubmit() {
    if (this.changePasswordForm.valid && this.actionCode) {
      const password = this.changePasswordForm.value.password;
      this.authService.confirmPasswordReset(this.actionCode, password)
        .then(() => {
          this.authService.isSuccessMessageVisible = true;
          setTimeout(() => {
            this.authService.isSuccessMessageVisible = false;
            this.router.navigate(['/login']);
          }, 2400);
        })
        .catch(error => {
          console.error('Fehler beim Zurücksetzen des Passworts', error);
        });
    } else {
      this.changePasswordForm.markAllAsTouched();
      this.updateErrorMessages();
    }
  }

  updateErrorMessages() {
    const password = this.changePasswordForm.get('password');
    const confirmPassword = this.changePasswordForm.get('confirmPassword');

    if (password?.hasError('required')) {
      this.passwordErrorMessage = 'Bitte Passwort eingeben.';
    } else if (password?.hasError('minlength')) {
      this.passwordErrorMessage = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
    } else {
      this.passwordErrorMessage = '';
    }

    if (confirmPassword?.hasError('required')) {
      this.confirmPasswordErrorMessage = 'Bitte Passwort bestätigen.';
    } else if (confirmPassword?.hasError('passwordMismatch')) {
      this.confirmPasswordErrorMessage = 'Die Passwörter stimmen nicht überein.';
    } else {
      this.confirmPasswordErrorMessage = '';
    }
  }

}
