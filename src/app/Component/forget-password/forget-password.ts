import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forget-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css',
})
export class ForgetPassword {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  forgetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  countdown = 5; // عد تنازلي 5 ثواني

  constructor() {
    this.forgetPasswordForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        ],
      ],
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgetPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgetPasswordForm);
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;
    const email = this.forgetPasswordForm.value.email.trim().toLowerCase();

    this.authService
      .forgetPassword(email)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          // ✅ Backend دائماً يرجع 200 OK حتى لو Email غير موجود (Security Best Practice)
          this.successMessage =
            response?.message ||
            'If your email exists in our system, you will receive a password reset link. Please check your inbox and spam folder.';
          console.log('✅ Password reset request sent', response);

          this.forgetPasswordForm.disable();
          this.startCountdown();
        },
        error: (error) => {
          console.error('❌ Forget password failed', error);

          // ✅ Error Handling محسّن
          if (error.status === 400) {
            this.errorMessage = 'Invalid email address format.';
          } else if (error.status === 429) {
            this.errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Network error. Please check your internet connection.';
          } else {
            this.errorMessage =
              error.error?.message || 'Failed to send reset email. Please try again later.';
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
    const control = this.forgetPasswordForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      return 'Email address is required';
    }
    if (control.errors['email'] || control.errors['pattern']) {
      return 'Please enter a valid email address (e.g., user@example.com)';
    }
    return '';
  }
}
