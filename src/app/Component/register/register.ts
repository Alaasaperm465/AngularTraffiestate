import { Component, inject, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private router = inject(Router);
  userFormGroup: FormGroup;
  submitted: boolean = false;

  // roles = signal(['Owner', 'Buyer']);
  
  // form = new FormGroup({
  //   roleName: new FormControl('')
  // });
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
    if (this.userFormGroup.valid) {
      this.auth.register(this.userFormGroup.value).subscribe((date) => {
        this.router.navigate(['/login']);
      });
    }
  }

}
