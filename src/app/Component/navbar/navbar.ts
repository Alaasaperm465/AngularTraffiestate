import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../Services/language';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  isExploreOpen = false;
  isLoggedIn = false;
  isProfileMenuOpen = false;
  isPropertiesMenuOpen = false;
  userName: string = '';
  userAvatar: string = 'assets/avatar-default.png';
  userEmail: string = '';
  userRole: string = ''; // ← Store user role (roleName from token)

  private loginListener: any;
  private storageListener: any;
  private logoutListener: any;

  get currentLang(): 'ar' | 'en' {
    return this.languageService.currentLang as 'ar' | 'en';
  }

  constructor(private router: Router, private languageService: LanguageService) {
  }

  ngOnInit() {
    this.checkLoginStatus();

    // Listen for storage changes (login from other tabs or pages)
    this.storageListener = () => this.checkLoginStatus();
    window.addEventListener('storage', this.storageListener);

    // Listen for custom login event - instant response
    this.loginListener = () => {
      console.log('🔐 Login event detected, updating navbar');
      // Immediate response - no delay
      this.checkLoginStatus();
    };
    window.addEventListener('userLoggedIn', this.loginListener);

    // Listen for logout event
    this.logoutListener = () => {
      this.isLoggedIn = false;
      this.userName = '';
    };
    window.addEventListener('userLoggedOut', this.logoutListener);
  }

  ngOnDestroy() {
    // Cleanup listeners
    window.removeEventListener('storage', this.storageListener);
    window.removeEventListener('userLoggedIn', this.loginListener);
    window.removeEventListener('userLoggedOut', this.logoutListener);
  }

  checkLoginStatus() {
    // Check if user is logged in from localStorage
    // First try currentUser (from AuthService)
    let userProfile = localStorage.getItem('currentUser');
    // If not found, try userProfile
    if (!userProfile) {
      userProfile = localStorage.getItem('userProfile');
    }

    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        this.isLoggedIn = true;
        this.userName = profile.name || profile.firstName || profile.userName || 'User';
        this.userAvatar = profile.avatar || 'assets/avatar-default.png';
        this.userEmail = profile.email || '';
        this.userRole = profile.roleName || profile.role || ''; // ← Extract roleName (from JWT) or role
        console.log('✅ Navbar updated with user:', this.userName, 'Role:', this.userRole);
      } catch (e) {
        this.isLoggedIn = false;
        this.userName = '';
        this.userRole = '';
      }
    } else {
      this.isLoggedIn = false;
      this.userName = '';
      this.userRole = '';
    }
  }

  toggleExplore() {
    this.isExploreOpen = !this.isExploreOpen;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  togglePropertiesMenu() {
    this.isPropertiesMenuOpen = !this.isPropertiesMenuOpen;
  }

  // Check if user is owner
  isOwner(): boolean {
    if (!this.userRole) {
      console.log('⚠️ No user role set');
      return false;
    }
    const role = this.userRole.toLowerCase().trim();
    const isOwnerRole = role === 'owner' || role === '1';
    console.log('🔍 Role check:', { userRole: this.userRole, role, isOwnerRole });
    return isOwnerRole;
  }

  goToFavorites() {
    this.router.navigate(['/favorites']);
  }

  logout() {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.isLoggedIn = false;
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToDashboard() {
    this.router.navigate(['/ownerDashboard']);
  }

  goToHome() {
    this.router.navigate(['/home']).then(() => {
      // Dispatch event to load all properties
      window.dispatchEvent(new CustomEvent('loadAllProperties'));
    });
  }

  // Toggle sidebar in owner-dashboard
  toggleSidebar() {
    window.dispatchEvent(new CustomEvent('toggleProfileMenu'));
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }
}
