import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProperty } from '../models/iproperty';
import { HttpClient } from '@angular/common/http';
import { ICreatePropertyDto } from '../models/icreate-property-dto';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private baseUrl = 'https://localhost:7030/api/PropertyOwner';
  private clientBaseUrl = 'https://localhost:7030/api/Client';
  private viewedProperties = new Set<number>(); // Track viewed properties in this session

  constructor(private http: HttpClient) {}

  /**
   * Get all properties for rent (from Client endpoint)
   */
  getPropertyForRent(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.clientBaseUrl}/properties/ForRent`);
  }

  /**
   * Get all properties for sale (from Client endpoint)
   */
  getPropertyForBuy(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.clientBaseUrl}/properties/ForSale`);
  }

  /**
   * Get property by ID (from Client endpoint)
   */
  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.clientBaseUrl}/properties/${id}`);
  }

  /**
   * Get owner's properties
   */
  getOwnerProperties(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.baseUrl}/owner-properties`);
  }

  getOwnerPropertiesPending(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.baseUrl}/pending`);
  }

  getOwnerPropertiesRejected(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.baseUrl}/Rejected`);
  }

  /**
   * Get form data (cities and areas)
   */
  getFormData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/FormData`);
  }

  /**
   * Get all properties with pagination
   */
  getAll(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }

  increaseView(propertyId: number) {
    const url = `${this.clientBaseUrl}/properties/${propertyId}/view`;
    console.log('📤 Sending request to:', url);
    
    return this.http.post(url, {}).pipe(
      tap(response => {
        console.log('📥 Response received:', response);
      }),
      catchError(error => {
        console.error('❌ Request failed:', error);
        throw error;
      })
    );
  }

  // Check if property was already viewed in this session
  isPropertyViewed(propertyId: number): boolean {
    return this.viewedProperties.has(propertyId);
  }

  // Mark property as viewed
  markPropertyAsViewed(propertyId: number): void {
    this.viewedProperties.add(propertyId);
  }
  /**
   * Create new property
   * Endpoint: POST /api/PropertyOwner/Create
   * Uses FormData for images
   */
  create(property: ICreatePropertyDto, mainImage: File, additionalImages: File[]): Observable<any> {
    const formData = new FormData();

    // Property data
    formData.append('Title', property.title);
    formData.append('Description', property.description);
    formData.append('Price', property.price.toString());
    formData.append('AreaSpace', property.areaSpace.toString());
    formData.append('Location', property.location);
    formData.append('CityId', property.cityId.toString());
    formData.append('AreaId', property.areaId.toString());
    formData.append('Rooms', property.rooms.toString());
    formData.append('Bathrooms', property.bathrooms.toString());
    formData.append('FinishingLevel', property.finishingLevel);
    formData.append('PropertyType', property.propertyType);
    formData.append('Purpose', property.purpose);
    formData.append('Status', property.status.toString());

    // Images
    formData.append('mainImage', mainImage);
    additionalImages.forEach(img => formData.append('AdditionalImages', img));

    return this.http.post(`${this.baseUrl}/Create`, formData);
  }

  /**
   * Update property
   * Endpoint: PUT /api/PropertyOwner/{id}
   * Now supports FormData with images!
   */
  update(
    id: number,
    property: ICreatePropertyDto,
    mainImage?: File,
    additionalImages?: File[]
  ): Observable<any> {
    const formData = new FormData();

    // Property data
    formData.append('Title', property.title);
    formData.append('Description', property.description);
    formData.append('Price', property.price.toString());
    formData.append('AreaSpace', property.areaSpace.toString());
    formData.append('Location', property.location);
    formData.append('CityId', property.cityId.toString());
    formData.append('AreaId', property.areaId.toString());
    formData.append('Rooms', property.rooms.toString());
    formData.append('Bathrooms', property.bathrooms.toString());
    formData.append('FinishingLevel', property.finishingLevel);
    formData.append('PropertyType', property.propertyType);
    formData.append('Purpose', property.purpose);
    formData.append('Status', property.status.toString());

    // Add ApprovalStatus (will be reset to Pending on update)
    formData.append('ApprovalStatus', '0'); // 0 = Pending

    // Add new main image if provided
    if (mainImage) {
      formData.append('newMainImage', mainImage);
    }

    // Add new additional images if provided
    if (additionalImages && additionalImages.length > 0) {
      additionalImages.forEach(img => formData.append('newAdditionalImages', img));
    }

    return this.http.put(`${this.baseUrl}/${id}`, formData);
  }

  /**
   * Delete property
   * Endpoint: DELETE /api/PropertyOwner/{id}
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get owner properties for sale
   * Endpoint: GET /api/PropertyOwner/ForSale
   */
  getOwnerPropertiesForSale(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.baseUrl}/ForSale`);
  }

  /**
   * Get owner properties for rent
   * Endpoint: GET /api/PropertyOwner/ForRent
   */
  getOwnerPropertiesForRent(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.baseUrl}/ForRent`);
  }

  /**
   * Get booked dates for a property
   * Endpoint: GET /api/Booking/booked-dates/{propertyId}
   */
  getBookedDates(propertyId: number): Observable<string[]> {
    return this.http.get<string[]>(`https://localhost:7030/api/Booking/booked-dates/${propertyId}`);
  }

  /**
   * Check if property is available for a date range
   * Endpoint: GET /api/Booking/check-availability
   */
  checkAvailability(propertyId: number, startDate: Date, endDate: Date): Observable<{ isAvailable: boolean }> {
    return this.http.get<{ isAvailable: boolean }>(`https://localhost:7030/api/Booking/check-availability`, {
      params: {
        propertyId: propertyId.toString(),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
  }
}

