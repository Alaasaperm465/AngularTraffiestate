import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cancelbooking.html',
  styleUrls: ['./cancelbooking.css']
})
export class CancelComponent implements OnInit {
  sessionId: string = '';
  isLoading: boolean = true;
  bookingCancelled: boolean = false;
  errorMessage: string = '';
  private apiUrl = 'https://localhost:7030/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('Cancel page loaded');
    console.log('Full URL:', window.location.href);

    this.sessionId = this.route.snapshot.queryParams['session_id'] || '';

    if (this.sessionId) {
      console.log('Session ID found:', this.sessionId);
      this.cancelBooking();
    } else {
      console.warn('No session_id in URL!');
      this.isLoading = false;
      this.errorMessage = 'Invalid session';
    }
  }

  cancelBooking(): void {
    this.http.post(
      `${this.apiUrl}/Payment/cancel?sessionId=${this.sessionId}`,
      {}
    ).subscribe({
      next: (response: any) => {
        console.log('Booking cancelled:', response);
        this.isLoading = false;
        this.bookingCancelled = true;
      },
      error: (error) => {
        console.error('Cancellation failed:', error);
        this.isLoading = false;
        this.bookingCancelled = false;
        this.errorMessage = error?.error?.message || 'Failed to cancel booking';
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToProperties(): void {
    this.router.navigate(['/rent']);
  }

  tryAgain(): void {
    // العودة للصفحة السابقة أو صفحة العقارات
    window.history.back();
  }
}
