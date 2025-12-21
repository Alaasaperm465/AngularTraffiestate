import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Favorite } from '../models/favorite';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
private apiUrl = `${environment.apiUrl}/Favorite`;

  constructor(private http: HttpClient) {}

  // Get My Favorites
getMyFavorites(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
  );
}


  // Add to Favorites
  addToFavorites(propertyId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${propertyId}`, {});


}



deleteAllFavorites(): Observable<any> {
  return this.http.delete(`https://localhost:7030/api/Favorite/deleteAll`);
}

// Remove from Favorites
removeFromFavorites(propertyId: number) {
  return this.http.delete(
    `${this.apiUrl}/${propertyId}`
  );
}

}
