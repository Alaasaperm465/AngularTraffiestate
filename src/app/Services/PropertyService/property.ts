import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProperty } from '../../models/iproperty';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = 'https://localhost:7030/api/Client'; // غيرها حسب API الخاص بك

  constructor(private http: HttpClient) {}

  // جلب كل العقارات
  getAllProperties(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.apiUrl}/properties`);
  }

  // جلب عقار واحد حسب الـ id
  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.apiUrl}/properties/${id}`);
  }

  // إنشاء عقار جديد
  // createProperty(property: IProperty): Observable<IProperty> {
  //   return this.http.post<IProperty>(this.apiUrl, property);
  // }

  // // تعديل عقار
  // updateProperty(id: number, property: IProperty): Observable<IProperty> {
  //   return this.http.put<IProperty>(`${this.apiUrl}/${id}`, property);
  // }

  // حذف عقار
  // deleteProperty(id: number): Observable<any> {
  //   return this.http.delete(`${this.apiUrl}/${id}`);
  // }
  getByCityOrArea(searchData: string): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.apiUrl}/ByCity?cityName=${searchData}`);
  }
}
