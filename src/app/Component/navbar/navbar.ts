import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
   isExploreOpen = false;
constructor(private router: Router) {}
  toggleExplore() {
    this.isExploreOpen = !this.isExploreOpen;
  }
  goToFavorites() {
  this.router.navigate(['/favorites']);
}
}
