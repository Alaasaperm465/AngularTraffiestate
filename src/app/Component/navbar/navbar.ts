import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  isExploreOpen = false;
  isLoggedIn = false;
  isProfileMenuOpen = false;
  userName: string = '';
  userAvatar: string = 'assets/avatar-default.png';
  userEmail: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
    // Listen for storage changes (login from other tabs or pages)
    window.addEventListener('storage', () => this.checkLoginStatus());
    // Listen for custom login event
    window.addEventListener('userLoggedIn', () => this.checkLoginStatus());
  }

  checkLoginStatus() {
    // Check if user is logged in from localStorage
    // First try currentUser (from Auth Service)
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
      } catch (e) {
        this.isLoggedIn = false;
        this.userName = '';
      }
    } else {
      this.isLoggedIn = false;
      this.userName = '';
    }
  }

  toggleExplore() {
    this.isExploreOpen = !this.isExploreOpen;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
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

  // Toggle sidebar in owner-dashboard
  toggleSidebar() {
    window.dispatchEvent(new CustomEvent('toggleProfileMenu'));
  }
}
