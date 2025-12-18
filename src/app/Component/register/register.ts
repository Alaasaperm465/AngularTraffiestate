import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../Services/auth-service';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private router = inject(Router);
  userFormGroup: FormGroup;

  roles = signal(['Owner', 'Buyer']);
  
  form = new FormGroup({
    roleName: new FormControl('')
  });
  constructor(private auth: AuthService) {
    this.userFormGroup = new FormGroup({
      userName: new FormControl('', Validators.required),
      phoneNumber: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
      roleName: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }
  register() {
    this.auth.register(this.userFormGroup.value).subscribe((date) => {
      this.router.navigate(['/login']);
    });
  }
loadRoles() {
  this.auth.getRoles().subscribe({
    next: (roles: string[]) => { // <-- now 'roles' is typed correctly
      this.roles.set(roles);
      console.log('Roles loaded:', this.roles()); // ["Owner", "Buyer"]
    },
    error: (err) => console.error(err),
  });
}

}
