import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, UserProfile, UpdateUserDto } from '../../Services/users';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit, OnDestroy {

  editForm!: FormGroup;
  currentUser: UserProfile | null = null;
  loading = true;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private refreshListener: any;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Try to load from cache first for faster initial display
    this.loadCachedProfile();

    // Fetch fresh data immediately (non-blocking)
    this.loadProfile();

    // Listen for profile updates from other components - instant response
    this.refreshListener = () => {
      console.log('🔄 Edit profile refresh event received');
      // Immediate refresh without delay
      this.loadProfile();
    };
    window.addEventListener('refreshUserProfile', this.refreshListener);
  }

  ngOnDestroy(): void {
    if (this.refreshListener) {
      window.removeEventListener('refreshUserProfile', this.refreshListener);
    }
  }

  loadCachedProfile(): void {
    // Quick load from cache if available
    try {
      let cachedProfile = localStorage.getItem('currentUser');
      if (!cachedProfile) {
        cachedProfile = localStorage.getItem('userProfile');
      }

      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        if (profile && profile.name) {
          this.currentUser = profile;
          this.initializeForm(profile);
          console.log('📦 Loaded cached profile:', profile.name);
        }
      }
    } catch (e) {
      console.log('Cache load skipped');
    }
  }

  loadProfile(): void {
    this.errorMessage = null;

    this.userService.getProfile().subscribe({
      next: (res) => {
        this.currentUser = res;
        this.initializeForm(res);
        this.loading = false;

        // Cache the profile
        localStorage.setItem('currentUser', JSON.stringify(res));
        localStorage.setItem('userProfile', JSON.stringify(res));
        console.log('✅ Profile loaded:', res.name);
      },
      error: (err) => {
        console.error('❌ Profile error', err);
        const errorMessage = err.error?.message || this.translate.instant('dashboard.edit_profile.load_error');
        this.errorMessage = errorMessage;
        this.loading = false;

        // If API fails but we have cached data, keep showing it
        if (this.currentUser) {
          console.log('Using cached profile due to API error');
        }
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
        this.successMessage = this.translate.instant('dashboard.edit_profile.success');

        // Update current user and cache
        if (res.value) {
          this.currentUser = res.value;
          localStorage.setItem('currentUser', JSON.stringify(res.value));
          localStorage.setItem('userProfile', JSON.stringify(res.value));
        }

        // Emit refresh event for other components (instant - no delay)
        window.dispatchEvent(new CustomEvent('refreshUserProfile', { detail: res.value }));
        console.log('📢 Profile refresh event emitted');

        // Redirect to profile page after 1 second
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.message || err.error?.errors?.[0] || this.translate.instant('dashboard.edit_profile.error');
        this.errorMessage = errorMessage;
        console.error('❌ Update error', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }

}
