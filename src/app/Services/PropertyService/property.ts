import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IProperty } from '../../models/iproperty';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = 'https://localhost:7030/api/Client';

  constructor(private http: HttpClient) {}

  /**
   * جلب كل العقارات (Buy + Rent مع بعض)
   * @returns Observable<IProperty[]>
   */
  getAllProperties(): Observable<IProperty[]> {
    // جلب عقارات البيع والإيجار في نفس الوقت
    return forkJoin({
      forSale: this.getPropertiesForSale().pipe(catchError(() => of([]))),
      forRent: this.getPropertiesForRent().pipe(catchError(() => of([])))
    }).pipe(
      map(result => {
        console.log('🏠 For Sale properties:', result.forSale.length);
        console.log('🏘️ For Rent properties:', result.forRent.length);
        
        // دمج النتيجتين
        const allProperties = [...result.forSale, ...result.forRent];
        console.log('📊 Total properties:', allProperties.length);
        
        return allProperties;
      })
    );
  }

  /**
   * جلب عقارات البيع فقط
   * @returns Observable<IProperty[]>
   */
  getPropertiesForSale(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.apiUrl}/properties/ForSale`).pipe(
      map(response => {
        // معالجة الـ response
        let data: IProperty[] = this.extractPropertiesArray(response);
        
        // إضافة purpose = "Buy" لكل عقار
        data = data.map(property => ({
          ...property,
          purpose: 'Buy'
        }));
        
        console.log('✅ For Sale properties processed:', data.length);
        return data;
      })
    );
  }

  /**
   * جلب عقارات الإيجار فقط
   * @returns Observable<IProperty[]>
   */
  getPropertiesForRent(): Observable<IProperty[]> {
    return this.http.get<any>(`${this.apiUrl}/properties/ForRent`).pipe(
      map(response => {
        // معالجة الـ response
        let data: IProperty[] = this.extractPropertiesArray(response);
        
        // إضافة purpose = "Rent" لكل عقار
        data = data.map(property => ({
          ...property,
          purpose: 'Rent'
        }));
        
        console.log('✅ For Rent properties processed:', data.length);
        return data;
      })
    );
  }

  /**
   * جلب عقار واحد حسب الـ id
   * @param id معرف العقار
   * @returns Observable<IProperty>
   */
  getPropertyById(id: number): Observable<IProperty> {
    return this.http.get<IProperty>(`${this.apiUrl}/properties/${id}`);
  }

  /**
   * البحث عن العقارات حسب المدينة أو المنطقة
   * @param searchData اسم المدينة أو المنطقة
   * @returns Observable<IProperty[]>
   */
  getByCityOrArea(searchData: string): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(
      `${this.apiUrl}/ByCity?cityName=${searchData}`
    );
  }

  /**
   * البحث عن العقارات حسب معايير متعددة
   * @param filters كائن يحتوي على معايير البحث
   * @returns Observable<IProperty[]>
   */
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

    // إزالة الـ & الأخير
    queryString = queryString.slice(0, -1);

    return this.http.get<IProperty[]>(
      `${this.apiUrl}/search?${queryString}`
    );
  }
//***************************************************** */
sortByPrice(order: 'asc' | 'desc') {
  return this.http.get<IProperty[]>(
    `${this.apiUrl}/properties/sort/price/${order}`
  );
}

sortByNewest() {
  return this.http.get<IProperty[]>(
    `${this.apiUrl}/properties/sort/newest`
  );
}

sortByPopular() {
  return this.http.get<IProperty[]>(
    `${this.apiUrl}/properties/sort/popular`
  );
}
filterByPropertyType(type: string) {
  return this.http.get<IProperty[]>(
    `${this.apiUrl}/properties/by-type?type=${type}`
  );
}




  /**
   * استخراج array من العقارات من الـ response
   * @param response الـ response من الـ API
   * @returns IProperty[]
   */
  private extractPropertiesArray(response: any): IProperty[] {
    if (Array.isArray(response)) {
      return response;
    } else if (response?.value && Array.isArray(response.value)) {
      return response.value;
    } else if (response?.items && Array.isArray(response.items)) {
      return response.items;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('⚠️ Unexpected response format:', response);
    return [];
  }
}
