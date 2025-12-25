import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../Services/auth-service';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  userFormGroup: FormGroup;
  submitted: boolean = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  roles: string[] = [];

  constructor(private auth: AuthService) {
    this.userFormGroup = new FormGroup(
      {
        userName: new FormControl('', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ]),
        phoneNumber: new FormControl('', [
          Validators.required,
          Validators.pattern(/^01[0125]\d{8}$/),
        ]),
        email: new FormControl('', [
          Validators.required,
          Validators.email,
        ]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{6,}$/),
        ]),
        confirmPassword: new FormControl('', Validators.required),
        roleName: new FormControl('', Validators.required),
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadRoles();
  }
  passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else if (password === confirmPassword && confirmPassword) {
      const errors = control.get('confirmPassword')?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          control.get('confirmPassword')?.setErrors(null);
        }
      }
    }
    return null;
  }

  register() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.markFormGroupTouched(this.userFormGroup);

    if (this.userFormGroup.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      this.cd.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cd.detectChanges();

    this.auth.register(this.userFormGroup.value)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = 'تم التسجيل بنجاح! جاري التحويل...';
          console.log('✅ Registration successful');

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 500);
        },
        error: (error) => {
          console.error('❌ Registration failed', error);
          if (error.status === 400) {
            this.errorMessage = error.error?.message || 'البريد أو رقم الهاتف مسجل بالفعل';
          } else if (error.status === 409) {
            this.errorMessage = 'هذا البريد أو رقم الهاتف مسجل بالفعل';
          } else if (error.status === 0) {
            this.errorMessage = 'خطأ في الاتصال';
          } else {
            this.errorMessage = error.error?.message || 'فشل التسجيل';
          }
          this.cd.detectChanges();
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  markFieldAsTouched(fieldName: string) {
    this.userFormGroup.get(fieldName)?.markAsTouched();
  }

  getFieldError(fieldName: string): string {
    const field = this.userFormGroup.get(fieldName);
    if (!field || !field.errors) return '';

    // Username errors
    if (fieldName === 'userName') {
      if (field.hasError('required')) return 'Full name is required';
      if (field.hasError('minlength')) return 'Name must be at least 3 characters long';
      if (field.hasError('maxlength')) return 'Name cannot exceed 50 characters';
    }

    // Phone number errors
    if (fieldName === 'phoneNumber') {
      if (field.hasError('required')) return 'Phone number is required';
      if (field.hasError('pattern')) return 'Invalid phone number format (e.g., 01012345678)';
    }

    // Email errors
    if (fieldName === 'email') {
      if (field.hasError('required')) return 'Email address is required';
      if (field.hasError('email')) return 'Please enter a valid email address';
    }

    // Role errors
    if (fieldName === 'roleName') {
      if (field.hasError('required')) return 'Please select an account type';
    }

    // Password errors
    if (fieldName === 'password') {
      if (field.hasError('required')) return 'Password is required';
      if (field.hasError('minlength')) return 'Password must be at least 6 characters long';
      if (field.hasError('pattern')) return 'Password must contain at least one uppercase letter and one number';
    }

    // Confirm password errors
    if (fieldName === 'confirmPassword') {
      if (field.hasError('required')) return 'Please confirm your password';
      if (field.hasError('passwordMismatch')) return 'Passwords do not match';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userFormGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  loadRoles() {
    this.auth.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        console.log(roles);
      },
      error: (err) => console.error(err),
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
