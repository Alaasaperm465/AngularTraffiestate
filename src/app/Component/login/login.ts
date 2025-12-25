import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IloginRequest } from '../../models/ilogin-request';
import { AuthService } from '../../Services/auth-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  submitted = false;

  constructor() {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.markFormGroupTouched(this.loginForm);

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      this.cd.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cd.detectChanges();
    const loginRequest: IloginRequest = this.loginForm.value;

    this.authService.Login(loginRequest)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = 'Login successful! Redirecting...';
          console.log('✅ Login successful');

          const userProfile = localStorage.getItem('currentUser');
          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: userProfile ? JSON.parse(userProfile) : null
          }));
          console.log('📢 userLoggedIn event emitted');

          setTimeout(() => {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
            this.router.navigateByUrl(returnUrl);
          }, 300);
        },
        error: (error) => {
          console.error('❌ Login failed', error);
          if (error.status === 401) {
            this.errorMessage = 'Invalid email/username or password';
          } else if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Invalid request';
          } else if (error.status === 0) {
            this.errorMessage = 'Connection error. Please check your internet connection';
          } else {
            this.errorMessage = error.error?.message || 'Login failed. Please try again';
          }
          this.cd.detectChanges();
        },
      });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  markFieldAsTouched(fieldName: string) {
    this.loginForm.get(fieldName)?.markAsTouched();
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.errors) return '';

    // Username errors
    if (fieldName === 'userName') {
      if (control.hasError('required')) return 'Email or username is required';
      if (control.hasError('minlength')) return 'Must be at least 3 characters long';
    }

    // Password errors
    if (fieldName === 'password') {
      if (control.hasError('required')) return 'Password is required';
      if (control.hasError('minlength')) return 'Password must be at least 6 characters long';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }
}
