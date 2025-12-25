import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IloginRequest } from '../../models/ilogin-request';
import { AuthService } from '../../Services/auth-service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

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
  sessionExpired = false;

  constructor() {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // تحقق من reason query parameter
    this.route.snapshot.queryParams['reason'] === 'session-expired' ? this.sessionExpired = true : this.sessionExpired = false;
    if (this.sessionExpired) {
      this.showSessionExpiredAlert();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  showSessionExpiredAlert(): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please log in again.',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      background: '#fff',
      color: '#2c3e50',
      iconColor: '#E2B43B',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.markFormGroupTouched(this.loginForm);

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill all fields correctly',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        color: '#2c3e50',
        iconColor: '#E2B43B',
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
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

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Login Successful',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            background: '#fff',
            color: '#2c3e50',
            iconColor: '#E2B43B',
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer);
              toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
          });

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
          let errorMsg = 'Login failed. Please try again';

          if (error.status === 401) {
            errorMsg = 'Invalid email/username or password';
          } else if (error.status === 400) {
            errorMsg = error.error?.message || 'Invalid request';
          } else if (error.status === 0) {
            errorMsg = 'Connection error. Please check your internet connection';
          } else {
            errorMsg = error.error?.message || 'Login failed. Please try again';
          }

          this.errorMessage = errorMsg;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: errorMsg,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#fff',
            color: '#2c3e50',
            iconColor: '#E2B43B',
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer);
              toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
          });

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
