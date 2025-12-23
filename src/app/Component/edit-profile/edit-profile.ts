import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserProfile, UpdateUserDto } from '../../Services/users';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit {

  editForm!: FormGroup;
  currentUser: UserProfile | null = null;
  loading = true;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = null;

    this.userService.getProfile().subscribe({
      next: (res) => {
        this.currentUser = res;
        this.initializeForm(res);
        this.loading = false;
      },
      error: (err) => {
        console.error('Profile error', err);
        this.errorMessage = err.error?.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  initializeForm(user: UserProfile): void {
    this.editForm = this.fb.group({
      userName: [user.userName, [Validators.required, Validators.minLength(3)]],
      phoneNumber: [user.phoneNumber, [Validators.required, Validators.minLength(10)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.successMessage = null;
    this.errorMessage = null;

    const updateDto: UpdateUserDto = {
      userName: this.editForm.get('userName')?.value,
      phoneNumber: this.editForm.get('phoneNumber')?.value
    };

    this.userService.updateProfile(updateDto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = 'Profile updated successfully!';

        // Update current user
        if (res.value) {
          this.currentUser = res.value;
        }

        // Redirect to profile page after 1 second
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.error?.errors?.[0] || 'Failed to update profile';
        console.error('Update error', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }

}
