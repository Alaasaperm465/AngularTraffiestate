import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './success-component.html',
  styleUrls: ['./success-component.css']
})
export class SuccessComponent implements OnInit {
  sessionId: string = '';
  isLoading: boolean = true;
  paymentConfirmed: boolean = false;
  private apiUrl = 'http://localhost:7030/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // ✨ اطبع URL و queryParams للتأكد
    console.log('Full URL:', window.location.href);
    console.log('QueryParams snapshot:', this.route.snapshot.queryParams);

    // الحصول على session_id من الـ URL
    this.sessionId = this.route.snapshot.queryParams['session_id'] || '';

    if (this.sessionId) {
      console.log('Session ID found:', this.sessionId);
      this.confirmPayment();
    } else {
      console.warn('No session_id in URL!');
      this.isLoading = false;
      this.paymentConfirmed = false;
    }
  }

  confirmPayment(): void {
    this.http.post(`${this.apiUrl}/Payment/success?sessionId=${this.sessionId}`, {})
      .subscribe({
        next: (response) => {
          console.log('Payment confirmed:', response);
          this.isLoading = false;
          this.paymentConfirmed = true;
        },
        error: (error) => {
          console.error('Payment confirmation failed:', error);
          this.isLoading = false;
          this.paymentConfirmed = false;
        }
      });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToProperties(): void {
    this.router.navigate(['/rent']);
  }

  goToMyBookings(): void {
    this.router.navigate(['/my-bookings']);
  }
  // للحصول على التاريخ الحالي
getCurrentDate(): string {
  return new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// عرض الإيصال (مثال، ممكن تضيفي تحميل PDF لاحقًا)
viewReceipt(): void {
  console.log('View receipt for session:', this.sessionId);
  // لو عندك API لتحميل الإيصال:
  // window.open(`${this.apiUrl}/Payment/receipt/${this.sessionId}`, '_blank');
}

}
