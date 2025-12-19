import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/City/GetAll`);
  }

  getAreasByCity(cityId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/Area/GetByCity/${cityId}`);
  }
}
