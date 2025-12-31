import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface ObserveSearchRequest {
  cityId: number;
  propertyType: string;
  purpose: string;
  bedRooms?: number;
  minPrice?: number;
  maxPrice?: number;
  hasResults: boolean;
}



@Injectable({
  providedIn: 'root'
})
export class PropertyInterestAgentService {
  private http = inject(HttpClient);

  //  استخدام environment للـ URL
  private apiUrl = `${environment.apiUrl}/PropertyInterestAgent`;

  /**
   * Notify the Agent of user search activity
   * This helps the system track user interests and send emails accordingly
   */
  observeSearch(searchData: ObserveSearchRequest): Observable<any> {
    // Get authentication token
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.warn('⚠️ No auth token found, Agent observation skipped');
      return of(null); // Return empty observable if not authenticated
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('📡 Sending search observation to Agent:', searchData);

    return this.http.post(`${this.apiUrl}/observe-search`, searchData, { headers }).pipe(
      tap((response) => {
        console.log(' Agent notified successfully:', response);
      }),
      catchError((error) => {
        console.warn(' Agent notification failed (non-critical):', error);
        // Don't break the search flow if Agent fails
        return of(null);
      })
    );
  }

  /**
   * Get user interest score for specific search criteria
   */
  getInterestScore(cityId: number, propertyType: string, purpose: string, bedRooms?: number): Observable<any> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params: any = { cityId, propertyType, purpose };
    if (bedRooms) params.bedRooms = bedRooms;

    return this.http.get(`${this.apiUrl}/interest-score`, { headers, params }).pipe(
      catchError((error) => {
        console.error('Error getting interest score:', error);
        return of(null);
      })
    );
  }
}
