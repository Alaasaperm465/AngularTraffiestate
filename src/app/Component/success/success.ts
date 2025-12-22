import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './success.html',
  styleUrl: './success.css',
})
export class SuccessComponent implements OnInit {
  showAnimation = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Trigger animation on component load
    setTimeout(() => {
      this.showAnimation = true;
    }, 200);

    // Auto redirect after 5 seconds
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 10000);
  }

  /**
   * Navigate to properties page
   */
  goToProperties() {
    this.router.navigate(['/home']);
  }

  /**
   * Navigate to home page
   */
  goToHome() {
    this.router.navigate(['/']);
  }

  /**
   * Add another property
   */
  addAnotherProperty() {
    this.router.navigate(['/add-property']);
  }
}
