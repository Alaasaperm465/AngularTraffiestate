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
  getPropertyForRent(): Observable<IProperty[]>
  {
      return this.http.get<IProperty[]>(`https://localhost:7030/api/Client/properties/ForRent`);
  }
   getPropertyForBuy(): Observable<IProperty[]>
  {
      return this.http.get<IProperty[]>(`https://localhost:7030/api/Client/properties/ForSale`);
  }
<<<<<<< HEAD
     create(property: ICreatePropertyDto, mainImage: File, additionalImages: File[]): Observable<any> {
=======
  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`https://localhost:7030/api/Client/properties/${id}`);
  }

  create(property: ICreatePropertyDto, mainImage: File, additionalImages: File[]): Observable<any> {
>>>>>>> ec36138b080f2f2cdd838e8de1183d19371a97b2
    const formData = new FormData();

    // بيانات العقار
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
    formData.append('Status', property.status);

    // الصور داخل DTO
    formData.append('ImagesFiles', mainImage); // الصورة الرئيسية
    additionalImages.forEach(img => formData.append('AdditionalImages', img));

    return this.http.post(`${this.baseUrl}/Create`, formData);
  }

  // getAll(pageNumber: number = 1, pageSize: number = 10)
  //   : Observable<PagedResponse<Iproperty>> {

  //   return this.http.get<PagedResponse<Iproperty>>(
  //     `${this.baseUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
  //   );
  }

