// import { Property } from './property';

import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { IProperty } from '../models/iproperty';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth-service';
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

  // getAll(pageNumber: number = 1, pageSize: number = 10)
  //   : Observable<PagedResponse<Iproperty>> {

  //   return this.http.get<PagedResponse<Iproperty>>(
  //     `${this.baseUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
  //   );
  }

