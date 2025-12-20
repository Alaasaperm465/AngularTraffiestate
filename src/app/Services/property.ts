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
export class PropertyService {
  private baseUrl = 'https://localhost:7030/api/PropertyOwner';

  constructor(private http: HttpClient) {}
  getPropertyForRent(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`https://localhost:7030/api/Client/properties/ForRent`);
  }
  getPropertyForBuy(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`https://localhost:7030/api/Client/properties/ForSale`);
  }
  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`https://localhost:7030/api/Client/properties/${id}`);
  }

  create(property: ICreatePropertyDto, mainImage: File, additionalImages: File[]): Observable<any> {
    const formData = new FormData();

    formData.append('Title', property.title);
    formData.append('Description', property.description);
    formData.append('Price', property.price.toString());
    formData.append('AreaSpace', property.areaSpace.toString());
    formData.append('Location', property.location);

    formData.append('CityId', property.cityId.toString());
    formData.append('AreaId', property.areaId.toString());

    formData.append('Rooms', property.rooms.toString());
    formData.append('Bathrooms', property.bathrooms.toString());

    formData.append('FinishingLevel', property.finishingLevel || '');
    formData.append('PropertyType', property.propertyType || '');
    formData.append('Purpose', property.purpose || '');

    formData.append('Status', '0'); // Enum as number

    formData.append('mainImage', mainImage);

    additionalImages.forEach((img) => {
      formData.append('additionalImages', img);
    });

    //  important: set responseType to 'text' explicitly
    return this.http.post(`${this.baseUrl}/Create`, formData, { responseType: 'text' });
  }
}
