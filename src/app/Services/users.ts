// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface UserProfile {
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: string;
  bio: string;
  avatarUrl: string;
  propertiesCount: number;
  favoritesCount: number;
  averageRating: number;
}

export interface UpdateUserDto {
  userName: string;
  phoneNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/Account/profile`);
  }

  updateProfile(dto: UpdateUserDto): Observable<any> {
    return this.http.put(`${environment.apiUrl}/Account/profile`, dto);
  }
}
