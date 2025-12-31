// import { Injectable } from '@angular/core';
// import { environment } from '../../environments/environment';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Favorite } from '../models/favorite';

// @Injectable({
//   providedIn: 'root',
// })
// export class FavoriteService {
// private apiUrl = `${environment.apiUrl}/Favorite`;

//   constructor(private http: HttpClient) {}

//   // Get My Favorites
// getMyFavorites(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
//   return this.http.get<any>(
//     `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
//   );
// }


//   // Add to Favorites
//   addToFavorites(propertyId: number): Observable<any> {
//     return this.http.post(`${this.apiUrl}/${propertyId}`, {});


// }



// deleteAllFavorites(): Observable<any> {
//   return this.http.delete(`https://localhost:7030/api/Favorite/deleteAll`);
// }

// // Remove from Favorites
// removeFromFavorites(propertyId: number) {
//   return this.http.delete(
//     `${this.apiUrl}/${propertyId}`
//   );
// }

// }



import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private apiUrl = 'https://traffiestate.runasp.net/api/Favorite'; // تأكد من URL الـ API

  constructor(private http: HttpClient) {}

  /**
   * جلب المفضلات الخاصة بي
   * @param pageNumber رقم الصفحة (افتراضي: 1)
   * @param pageSize عدد العناصر في الصفحة (افتراضي: 10)
   * @returns Observable<any>
   */
  getMyFavorites(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  }

  /**
   * إضافة عقار إلى المفضلات
   * @param propertyId معرف العقار
   * @returns Observable<any>
   */
  addToFavorites(propertyId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${propertyId}`, {});
  }

  /**
   * إزالة عقار من المفضلات
   * @param propertyId معرف العقار
   * @returns Observable<any>
   */
  removeFromFavorites(propertyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${propertyId}`);
  }

  /**
   * حذف جميع المفضلات
   * @returns Observable<any>
   */
  deleteAllFavorites(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteAll`);
  }

  /**
   * التحقق من وجود عقار في المفضلات
   * @param propertyId معرف العقار
   * @returns Observable<boolean>
   */
  isFavorite(propertyId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${propertyId}/check`);
  }

  // ملاحظات:
  // - تأكد من أن URL الـ API صحيح
  // - تحقق من أن المسارات تتطابق مع API الخاص بك
  // - تأكد من أن الـ Authorization headers تم إضافتها إذا كان مطلوباً
}
