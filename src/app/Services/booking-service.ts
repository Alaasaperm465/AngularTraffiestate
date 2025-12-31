import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookedDateRange {
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'https://traffiestate.runasp.net/api/booking';

  constructor(private http: HttpClient) {}

  getBookedDates(propertyId: number): Observable<BookedDateRange[]> {
    return this.http.get<BookedDateRange[]>(
      `${this.apiUrl}/booked-dates/${propertyId}`
    );
  }

  checkAvailability(
    propertyId: number,
    startDate: string,
    endDate: string
  ): Observable<{ isAvailable: boolean }> {
    return this.http.get<{ isAvailable: boolean }>(
      `${this.apiUrl}/check-availability`,
      {
        params: { propertyId, startDate, endDate }
      }
    );
  }
}
