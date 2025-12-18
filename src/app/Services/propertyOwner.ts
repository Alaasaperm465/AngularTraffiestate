import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyOwnerService {

  private baseUrl = `${environment.apiUrl}/api/PropertyOwner`;

  constructor(private http: HttpClient) {}

  // =============================
  // Dashboard / My Properties
  // =============================

  /** Get all properties for owner */
  getOwnerProperties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/owner-properties`);
  }

  /** Get properties for sale */
  getForSaleProperties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ForSale`);
  }

  /** Get properties for rent */
  getForRentProperties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ForRent`);
  }

  // =============================
  // Form Data
  // =============================

  /** Get dropdowns data (types, cities, etc.) */
  getFormData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/FormData`);
  }

  // =============================
  // CRUD Operations
  // =============================

  /** Create new property */
  addProperty(property: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, property);
  }

  /** Get property by id */
  getPropertyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  /** Update property */
  updateProperty(id: number, property: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, property);
  }

  /** Delete property */
  deleteProperty(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}