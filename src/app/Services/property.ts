// import { Property } from './property';

import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { IProperty } from '../models/iproperty';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth-service';
import { ICreatePropertyDto } from '../models/icreate-property-dto';
// import { PagedResponse } from '../models/page-respones';

@Injectable({
  providedIn: 'root',
})
export class PropertyٍService {
  private baseUrl = 'https://localhost:7030/api/PropertyOwner';

  constructor(private http: HttpClient) {}
  getPropertyForRent(): Observable<IProperty[]>
  {
      return this.http.get<IProperty[]>(`https://localhost:7030/api/Client/properties/ForRent`);
  }
   getPropertyForBuy(): Observable<IProperty[]>
  {
      return this.http.get<IProperty[]>(`https://localhost:7030/api/Client/properties/ForSale`);
  }
    create(property: ICreatePropertyDto, mainImage: File, additionalImages: File[]): Observable<any> {
    const formData = new FormData();
    
    // Append property data
    formData.append('title', property.title);
    formData.append('description', property.description);
    formData.append('price', property.price.toString());
    formData.append('areaSpace', property.areaSpace.toString());
    formData.append('location', property.location);
    formData.append('cityId', property.cityId.toString());
    formData.append('areaId', property.areaId.toString());
    formData.append('rooms', property.rooms.toString());
    formData.append('bathrooms', property.bathrooms.toString());
    formData.append('finishingLevel', property.finishingLevel);
    formData.append('propertyType', property.propertyType);
    formData.append('purpose', property.purpose);
    formData.append('status', property.status);
    
    // Append main image
    formData.append('mainImage', mainImage);
    
    // Append additional images
    additionalImages.forEach((image, index) => {
      formData.append(`additionalImages`, image);
    });

    return this.http.post(`${this.baseUrl}/Create`, formData);
  }

  // getAll(pageNumber: number = 1, pageSize: number = 10)
  //   : Observable<PagedResponse<Iproperty>> {

  //   return this.http.get<PagedResponse<Iproperty>>(
  //     `${this.baseUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
  //   );
  }

