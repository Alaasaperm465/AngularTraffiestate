import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, UserProfile } from '../../Services/users';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit, OnDestroy {

  user: UserProfile | null = null;
  loading = true;
  error: string | null = null;

  private refreshListener: any;
  private loginListener: any;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load profile immediately
    this.loadProfile();

    // Listen for profile refresh events with proper function reference for cleanup
    this.refreshListener = () => {
      console.log('🔄 Profile refresh event received');
      this.loadProfile();
    };
    window.addEventListener('refreshUserProfile', this.refreshListener);

    // Listen for login success to refresh profile - instant response
    this.loginListener = () => {
      console.log('✅ User logged in, refreshing profile');
      // Immediate response - no delay needed
      this.loadProfile();
    };
    window.addEventListener('userLoggedIn', this.loginListener);

    // Also try to load from cached data if available
    this.loadCachedProfile();
  }

  ngOnDestroy(): void {
    // Cleanup listeners with proper function references
    if (this.refreshListener) {
      window.removeEventListener('refreshUserProfile', this.refreshListener);
    }
    if (this.loginListener) {
      window.removeEventListener('userLoggedIn', this.loginListener);
    }
  }

  loadCachedProfile(): void {
    // Quick load from cache if available
    try {
      // Try both keys - currentUser (from AuthService) and userProfile (fallback)
      let cachedProfile = localStorage.getItem('currentUser');
      if (!cachedProfile) {
        cachedProfile = localStorage.getItem('userProfile');
      }

      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        if (profile && profile.name) {
          // Show cached data while fetching fresh data
          this.user = profile;
          console.log('📦 Loaded cached profile:', profile.name);
        }
      }
    } catch (e) {
      console.log('Cache load skipped');
    }
  }

  loadProfile(): void {
    this.loading = true;
    this.error = null;

    this.userService.getProfile().subscribe({
      next: (res) => {
        this.user = res;
        this.loading = false;

        // Cache the profile for quick access
        localStorage.setItem('currentUser', JSON.stringify(res));
        localStorage.setItem('userProfile', JSON.stringify(res)); // Keep both keys
        console.log('✅ Profile loaded:', res.name);
      },
      error: (err) => {
        console.error('❌ Profile error', err);
        this.error = err.error?.message || 'Failed to load profile. Please try again.';
        this.loading = false;

        // If API fails, try to use cached data
        this.loadCachedProfile();
      }
    });
  }

  goToEditProfile(): void {
    this.router.navigate(['/edit-profile']);
  }
}
