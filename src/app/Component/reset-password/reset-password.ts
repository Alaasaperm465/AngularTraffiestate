import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showNewPassword = false;
  showConfirmPassword = false;
  countdown = 3;

  email: string = '';
  token: string = '';

  constructor() {
    this.resetPasswordForm = this.formBuilder.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(6), // ✅ Backend requires min 6 chars
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    //  جلب Email و Token من الـ URL (يأتي من الـ Email link)
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';

      this.token = encodeURIComponent(this.token);

      console.log(' Email:', this.email);
      console.log(' Token:', this.token);

      if (!this.email || !this.token) {
        this.errorMessage = 'Invalid or missing reset link. Please request a new one.';
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    if (!this.email || !this.token) {
      this.errorMessage = 'Invalid reset link. Please request a new one.';
      return;
    }

    this.isLoading = true;
    const newPassword = this.resetPasswordForm.value.newPassword;

    //  استدعاء الـ API مع الـ parameters الصحيحة
    this.authService
      .resetPassword(this.email, this.token, newPassword)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.message || 'Password reset successful! Redirecting to login...';
          console.log('✅ Password reset successful', response);

          this.resetPasswordForm.disable();
          this.startCountdown();
        },
        error: (error) => {
          console.error('Reset password failed', error);

          //  Error Handling محسّن حسب Backend responses
          if (error.status === 400) {
            // Backend يرجع errors array
            if (error.error?.errors && Array.isArray(error.error.errors)) {
              this.errorMessage = error.error.errors.join('. ');
            } else {
              this.errorMessage = 'Invalid or expired reset link. Please request a new one.';
            }
          } else if (error.status === 404) {
            this.errorMessage = 'User not found.';
          } else if (error.status === 0) {
            this.errorMessage = 'Network error. Please check your internet connection.';
          } else {
            this.errorMessage =
              error.error?.message ||
              'Failed to reset password. The link may be expired or invalid.';
          }
        },
      });
  }

  private startCountdown() {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.resetPasswordForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      return `${fieldName === 'newPassword' ? 'New password' : 'Confirm password'} is required`;
    }
    if (control.errors['minlength']) {
      return `Password must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getPasswordMismatchError(): string {
    if (this.resetPasswordForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }
}
