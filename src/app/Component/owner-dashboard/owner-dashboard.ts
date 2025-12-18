import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owner-dashboard',
  imports: [],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css',
})
export class OwnerDashboard {
   private router = inject(Router);

goToMyProperties() {
    // دلوقتي مجرد تجربة، مش مربوط بالـ API
    this.router.navigateByUrl('/owner-properties');
  }

  goToAddProperty() {
    this.router.navigateByUrl('/add-property');
  }
    goToAnalytics() {}
  goToMessages(){}

}
