import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private baseUrl = 'https://localhost:7030/api/PropertyOwner';

  constructor(private http: HttpClient) {}

  getCities(): Observable<any[]> {
    return this.http.get<any[]>('https://localhost:7030/api/City/GetAll');
  }

  getAreasByCity(cityId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/LoadAreas?cityId=${cityId}`);
  }
}
