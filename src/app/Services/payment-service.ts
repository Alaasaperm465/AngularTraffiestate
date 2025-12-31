import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreatePaymentDto } from '../models/create-payment-dto';

interface PaymentSessionResponse {
  bookingId: number;
  url: string;
}
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://traffiestate.runasp.net/api/payment';

  constructor(private http: HttpClient) {}

  // دالة لطلب إنشاء Session من الباكند
  // createPaymentSession(propertyId: number) {
  // createPaymentSession(dto: CreatePaymentDto) {
  //   return firstValueFrom(
  //     this.http.post<any>(
  //       `${this.apiUrl}/create-session`,
  //       // { propertyId }
  //       dto
  //     )
  //   );
  // }
   createPaymentSession(dto: CreatePaymentDto): Promise<PaymentSessionResponse> {
    return firstValueFrom(
      this.http.post<PaymentSessionResponse>(
        `${this.apiUrl}/create-session`,
        dto
      )
    );
  }
}

