import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IProperty } from '../../models/iproperty';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private clientApiUrl = 'https://localhost:7030/api/Client';
  private ownerApiUrl = 'https://localhost:7030/api/PropertyOwner';

  constructor(private http: HttpClient) {}

  getAllProperties(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.clientApiUrl}/properties`).pipe(
      map(response => {
        let data: IProperty[] = this.extractPropertiesArray(response);
        
        data = data.map(property => {
          let normalizedPurpose = (property.purpose || '').toLowerCase().trim();
          
          if (normalizedPurpose === 'sale' || normalizedPurpose === 'forsale') {
            normalizedPurpose = 'buy';
          }
          else if (normalizedPurpose === 'forrent') {
            normalizedPurpose = 'rent';
          }
          
          return {
            ...property,
            purpose: normalizedPurpose
          };
        });
        
        return data;
      }),
      catchError(error => {
        console.error('Error loading from Client API:', error);
        return this.getAllPropertiesFromOwnerAPI();
      })
    );
  }

  private getAllPropertiesFromOwnerAPI(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.ownerApiUrl}/owner-properties`).pipe(
      map(response => {
        let data: IProperty[] = this.extractPropertiesArray(response);
        return data;
      }),
      catchError(error => {
        console.error('Error loading from Owner API:', error);
        return of([]);
      })
    );
  }

  getAllPropertiesWithPagination(pageSize: number = 100, pageNumber: number = 1): Observable<IProperty[]> {
    const endpoints = [
      `${this.clientApiUrl}/properties?pageSize=${pageSize}&pageNumber=${pageNumber}`,
      `${this.clientApiUrl}/properties?$top=${pageSize}&$skip=${(pageNumber - 1) * pageSize}`,
      `${this.clientApiUrl}/properties?limit=${pageSize}&offset=${(pageNumber - 1) * pageSize}`,
      `${this.ownerApiUrl}/owner-properties?pageSize=${pageSize}&pageNumber=${pageNumber}`
    ];

    return this.tryEndpoints(endpoints, `Pagination (pageSize=${pageSize})`);
  }

  private tryEndpoints(endpoints: string[], description: string): Observable<IProperty[]> {
    const tryNext = (index: number): Observable<IProperty[]> => {
      if (index >= endpoints.length) {
        console.error(`All endpoints failed for: ${description}`);
        return of([]);
      }

      return this.http.get<any>(endpoints[index]).pipe(
        map(response => {
          let data = this.extractPropertiesArray(response);
          return data;
        }),
        catchError(error => {
          return tryNext(index + 1);
        })
      );
    };

    return tryNext(0);
  }

  getPropertiesForSale(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.clientApiUrl}/properties/ForSale`).pipe(
      map(response => {
        let data: IProperty[] = this.extractPropertiesArray(response);
        
        data = data.map(property => ({
          ...property,
          purpose: 'buy'
        }));
        
        return data;
      }),
      catchError(error => {
        console.error('Error loading ForSale properties:', error);
        return of([]);
      })
    );
  }

  getPropertiesForRent(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.clientApiUrl}/properties/ForRent`).pipe(
      map(response => {
        let data: IProperty[] = this.extractPropertiesArray(response);
        
        data = data.map(property => ({
          ...property,
          purpose: 'rent'
        }));
        
        return data;
      }),
      catchError(error => {
        console.error('Error loading ForRent properties:', error);
        return of([]);
      })
    );
  }

  getPropertiesForLand(): Observable<IProperty[]> {
    const endpoints = [
      `${this.clientApiUrl}/properties/ForLand`,
      `${this.clientApiUrl}/properties/Land`,
      `${this.clientApiUrl}/properties?purpose=Land`
    ];

    return this.tryEndpoints(endpoints, 'Land Properties').pipe(
      map(data => {
        return data.map(property => ({
          ...property,
          purpose: 'land'
        }));
      })
    );
  }

  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.clientApiUrl}/properties/${id}`).pipe(
      catchError(error => {
        console.error(`Error loading property ${id}:`, error);
        throw error;
      })
    );
  }

  getByCityOrArea(searchData: string): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(
      `${this.clientApiUrl}/ByCity?cityName=${searchData}`
    ).pipe(
      catchError(error => {
        console.error('Error searching by city:', error);
        return of([]);
      })
    );
  }

  searchProperties(filters: any): Observable<IProperty[]> {
    let queryString = '';

    if (filters.city) {
      queryString += `cityName=${filters.city}&`;
    }
    if (filters.propertyType) {
      queryString += `propertyType=${filters.propertyType}&`;
    }
    if (filters.minPrice) {
      queryString += `minPrice=${filters.minPrice}&`;
    }
    if (filters.maxPrice) {
      queryString += `maxPrice=${filters.maxPrice}&`;
    }
    if (filters.rooms) {
      queryString += `bedrooms=${filters.rooms}&`;
    }

    queryString = queryString.slice(0, -1);

    return this.http.get<IProperty[]>(
      `${this.clientApiUrl}/search?${queryString}`
    ).pipe(
      catchError(error => {
        console.error('Error searching properties:', error);
        return of([]);
      })
    );
  }

  sortByPrice(order: 'asc' | 'desc'): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(
      `${this.clientApiUrl}/properties/sort/price/${order}`
    ).pipe(
      catchError(error => {
        console.error('Error sorting by price:', error);
        return of([]);
      })
    );
  }

  sortByNewest(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(
      `${this.clientApiUrl}/properties/sort/newest`
    ).pipe(
      catchError(error => {
        console.error('Error sorting by newest:', error);
        return of([]);
      })
    );
  }

  sortByPopular(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(
      `${this.clientApiUrl}/properties/sort/popular`
    ).pipe(
      catchError(error => {
        console.error('Error sorting by popular:', error);
        return of([]);
      })
    );
  }

  filterByPropertyType(type: string): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(
      `${this.clientApiUrl}/properties/by-type?type=${type}`
    ).pipe(
      catchError(error => {
        console.error('Error filtering by property type:', error);
        return of([]);
      })
    );
  }

  private extractPropertiesArray(response: any): IProperty[] {
    if (Array.isArray(response)) {
      return response;
    } 
    else if (response?.value && Array.isArray(response.value)) {
      return response.value;
    } 
    else if (response?.items && Array.isArray(response.items)) {
      return response.items;
    } 
    else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  }
}