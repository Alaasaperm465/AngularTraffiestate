import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://localhost:7030/api/payment';

  constructor(private http: HttpClient) {}

  // دالة لطلب إنشاء Session من الباكند
  createPaymentSession(propertyId: number) {
    return firstValueFrom(
      this.http.post<any>(
        `${this.apiUrl}/create-session`,
        { propertyId }
      )
    );
  }
}

