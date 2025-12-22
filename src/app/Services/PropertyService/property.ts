import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IProperty } from '../../models/iproperty';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {

  private readonly clientApiUrl = 'https://localhost:7030/api/Client';
  private readonly ownerApiUrl  = 'https://localhost:7030/api/PropertyOwner';

  constructor(private http: HttpClient) {}

  /* =====================================================
     🔹 MAIN – Get All Properties (Client → Owner fallback)
     ===================================================== */
  getAllProperties(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.clientApiUrl}/properties`).pipe(
      map(res => this.normalizeProperties(res)),
      catchError(err => {
        console.warn(' Client API failed, switching to Owner API', err);
        return this.getAllPropertiesFromOwner();
      })
    );
  }

  private getAllPropertiesFromOwner(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.ownerApiUrl}/owner-properties`).pipe(
      map(res => this.normalizeProperties(res)),
      catchError(err => {
        console.error('❌ Owner API failed', err);
        return of([]);
      })
    );
  }

  /* =====================================================
     🔹 PAGINATION (try multiple formats)
     ===================================================== */
  getAllPropertiesWithPagination(
    pageSize: number = 20,
    pageNumber: number = 1
  ): Observable<IProperty[]> {

    const endpoints = [
      `${this.clientApiUrl}/properties?pageSize=${pageSize}&pageNumber=${pageNumber}`,
      `${this.clientApiUrl}/properties?$top=${pageSize}&$skip=${(pageNumber - 1) * pageSize}`,
      `${this.clientApiUrl}/properties?limit=${pageSize}&offset=${(pageNumber - 1) * pageSize}`,
      `${this.ownerApiUrl}/owner-properties?pageSize=${pageSize}&pageNumber=${pageNumber}`,
    ];

    return this.tryEndpointsSequentially(endpoints);
  }

  private tryEndpointsSequentially(urls: string[]): Observable<IProperty[]> {
    const tryNext = (index: number): Observable<IProperty[]> => {
      if (index >= urls.length) return of([]);

      return this.http.get<any>(urls[index]).pipe(
        map(res => this.normalizeProperties(res)),
        catchError(() => tryNext(index + 1))
      );
    };

    return tryNext(0);
  }

  /* =====================================================
     🔹 FILTERING / SEARCH
     ===================================================== */
  searchProperties(filters: {
    city?: string;
    propertyType?: string;
    rooms?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<IProperty[]> {

    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value as any);
      }
    });

    return this.http.get<any>(`${this.clientApiUrl}/search`, { params }).pipe(
      map(res => this.normalizeProperties(res)),
      catchError(err => {
        console.error(' Search error', err);
        return of([]);
      })
    );
  }

  /* =====================================================
     🔹 SORTING
     ===================================================== */
  sortByPrice(order: 'asc' | 'desc'): Observable<IProperty[]> {
    return this.http
      .get<any>(`${this.clientApiUrl}/properties/sort/price/${order}`)
      .pipe(
        map(res => this.normalizeProperties(res)),
        catchError(() => of([]))
      );
  }

  sortByNewest(): Observable<IProperty[]> {
    return this.http
      .get<any>(`${this.clientApiUrl}/properties/sort/newest`)
      .pipe(
        map(res => this.normalizeProperties(res)),
        catchError(() => of([]))
      );
  }

  sortByPopular(): Observable<IProperty[]> {
    return this.http
      .get<any>(`${this.clientApiUrl}/properties/sort/popular`)
      .pipe(
        map(res => this.normalizeProperties(res)),
        catchError(() => of([]))
      );
  }

  /* =====================================================
     🔹 SINGLE PROPERTY
     ===================================================== */
  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.clientApiUrl}/properties/${id}`);
  }

  /* =====================================================
     🔹 NORMALIZATION (IMPORTANT)
     ===================================================== */
  private normalizeProperties(response: any): IProperty[] {
    const data = this.extractPropertiesArray(response);

    return data.map(property => ({
      ...property,
      purpose: this.normalizePurpose(property.purpose),
    }));
  }

  private normalizePurpose(purpose: string): 'buy' | 'rent' | 'land' {
    const value = (purpose || '').toLowerCase().trim();

    if (['sale', 'forsale', 'buy'].includes(value)) return 'buy';
    if (['rent', 'forrent'].includes(value)) return 'rent';
    if (['land'].includes(value)) return 'land';

    return 'buy';
  }

  /* =====================================================
     🔹 SAFE ARRAY EXTRACTOR
     ===================================================== */
  private extractPropertiesArray(response: any): IProperty[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.value)) return response.value;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }
}
