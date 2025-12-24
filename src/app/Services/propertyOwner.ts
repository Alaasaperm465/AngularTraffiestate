import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IProperty } from '../models/iproperty';

@Injectable({
  providedIn: 'root'
})
export class PropertyOwnerService {

  allProperties: IProperty[] = [];
  displayedProperties: IProperty[] = [];

   activeTab: 'my-properties' | 'favorites' | 'bookmarks' | 'submitted' = 'my-properties';

  totalProperties = 0;
  activeProperties = 0;
  pendingProperties = 0;


  private baseUrl = `${environment.apiUrl}/api/PropertyOwner`;

  constructor(private http: HttpClient) {}

  // =============================
  // Dashboard / My Properties
  // =============================

  /** Get all properties for owner */
getOwnerProperties(): Observable<IProperty[]> {
  return this.http.get<IProperty[]>(
    `${this.baseUrl}/properties/owner`
  );
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

  /** Create new property (supports files via FormData) */
  addProperty(property: any, mainImage?: File, additionalImages?: File[]): Observable<any> {
    // If a FormData instance is passed directly, forward it
    if (property instanceof FormData) {
      return this.http.post<any>(`${this.baseUrl}/Create`, property);
    }

    const fd = new FormData();
    Object.keys(property || {}).forEach(k => {
      const val = property[k];
      if (val !== null && val !== undefined) fd.append(k, val);
    });

    if (mainImage) fd.append('mainImage', mainImage);
    (additionalImages || []).forEach(file => fd.append('additionalImages', file));

    return this.http.post<any>(`${this.baseUrl}/Create`, fd);
  }

  /** Get property by id */
  getPropertyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  /** Update property (supports files) */
  updateProperty(id: number, property: any, newMainImage?: File, newAdditionalImages?: File[]): Observable<any> {
    // Allow passing FormData directly
    if (property instanceof FormData) {
      return this.http.put<any>(`${this.baseUrl}/${id}`, property);
    }

    const fd = new FormData();
    Object.keys(property || {}).forEach(k => {
      const val = property[k];
      if (val !== null && val !== undefined) fd.append(k, val);
    });

    if (newMainImage) fd.append('newMainImage', newMainImage);
    (newAdditionalImages || []).forEach(f => fd.append('newAdditionalImages', f));

    return this.http.put<any>(`${this.baseUrl}/${id}`, fd);
  }

  /** Delete property */
  deleteProperty(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  
}