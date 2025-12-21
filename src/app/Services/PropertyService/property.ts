// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { IProperty } from '../../models/iproperty';

// @Injectable({
//   providedIn: 'root',
// })
// export class PropertyService {
//   private apiUrl = 'https://localhost:7030/api/Client'; // غيرها حسب API الخاص بك

//   constructor(private http: HttpClient) {}

//   // جلب كل العقارات
//   getAllProperties(): Observable<IProperty[]> {
//     return this.http.get<IProperty[]>(`${this.apiUrl}/properties`);
//   }




//   // جلب عقار واحد حسب الـ id
//   getPropertyById(id: number): Observable<IProperty> {
//     return this.http.get<IProperty>(`${this.apiUrl}/properties/${id}`);
//   }

//   // إنشاء عقار جديد
//   // createProperty(property: IProperty): Observable<IProperty> {
//   //   return this.http.post<IProperty>(this.apiUrl, property);
//   // }

//   // // تعديل عقار
//   // updateProperty(id: number, property: IProperty): Observable<IProperty> {
//   //   return this.http.put<IProperty>(`${this.apiUrl}/${id}`, property);
//   // }

//   // حذف عقار
//   // deleteProperty(id: number): Observable<any> {
//   //   return this.http.delete(`${this.apiUrl}/${id}`);
//   // }
//   getByCityOrArea(searchData: string): Observable<IProperty[]> {
//     return this.http.get<IProperty[]>(`${this.apiUrl}/ByCity?cityName=${searchData}`);
//   }
// }



import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProperty } from '../../models/iproperty';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = 'https://localhost:7030/api/Client'; // غيرها حسب API الخاص بك

  constructor(private http: HttpClient) {}

  /**
   * جلب كل العقارات
   * @returns Observable<IProperty[]>
   */
  getAllProperties(): Observable<IProperty[]> {
    return this.http.get<IProperty[]>(`${this.apiUrl}/properties`);
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




//***************************************************** */
  // ملاحظات:
  // - تأكد من أن API URL صحيح
  // - استبدل المسارات حسب API الخاص بك
  // - تأكد من أن النموذج IProperty يتطابق مع البيانات المرجعة من API
}
