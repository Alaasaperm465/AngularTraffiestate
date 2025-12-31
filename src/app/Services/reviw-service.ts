import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ReviewStats {
  averageRating: number;
  reviewsCount: number;
}

export interface UserRating {
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'https://traffiestate.runasp.net/api/Review';

  constructor(private http: HttpClient) {}

  // جلب احصائيات العقار
  getPropertyStats(propertyId: number): Observable<ReviewStats> {
    return this.http.get<any>(`${this.apiUrl}/stats/${propertyId}`).pipe(
      map(res => res.value)
    );
  }

  // اضافة تقييم جديد
  addReview(dto: { propertyId: number; rating: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, dto);
  }

  // جلب تقييم المستخدم للعقار اذا كان قيم قبل كده
  getUserPropertyRating(propertyId: number): Observable<UserRating | null> {
    return this.http.get<any>(`${this.apiUrl}/user-rating/${propertyId}`).pipe(
      map(res => res.isSuccess ? res.value : null)
    );
  }
}
