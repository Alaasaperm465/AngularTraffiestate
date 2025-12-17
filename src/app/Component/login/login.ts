import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
// import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import { IloginRequest } from '../../models/ilogin-request';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
private authService = inject( AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

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
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    this.isLoading = true;
    const loginRequest: IloginRequest = this.loginForm.value;

    this.authService.Login(loginRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Login successful', response);
        // Navigate to home or dashboard
        this.router.navigate(['/properties']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login failed', error);
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
      },
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return `${fieldName} is required`;
    }
    if (control.errors['minlength']) {
      return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
