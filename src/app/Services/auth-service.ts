import { inject, Injectable } from '@angular/core';
// import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IUser } from '../models/iuser';
import { BehaviorSubject, map, Observable, retry, tap } from 'rxjs';
import { IloginRequest } from '../models/ilogin-request';
import { IloginResponse } from '../models/ilogin-response';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router)
  private readonly TOKEN_KEY = 'accessToken';
  private readonly USER_KEY = 'currentUser';

  userSubject: BehaviorSubject<IUser | null>;
  isAuthenticatedSubject: BehaviorSubject<boolean>;

  // Public observables
  user$: Observable<IUser | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(private http: HttpClient) {
    this.userSubject = new BehaviorSubject<IUser | null>(null);
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    // properly initialize public observables
    this.user$ = this.userSubject.asObservable();
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  register(user: IUser): Observable<IUser> {
    return this.http.post<IUser>(`${environment.apiUrl}/Account/register`, user);
    this.router.navigate(['/login']);
  }

  getRoles(): Observable<string[]> {
    return this.http.get<{ roles: string[] }>(`${environment.apiUrl}/Account/Get-Roles`).pipe(
      retry(3),
      map((response) => {
        console.log('API Response:', response); // للتأكد من شكل الـ response
        return response.roles;
      })
    );
  }

  Login(loin:IloginRequest) :Observable<IloginResponse>{
    return this.http.post<IloginResponse>(`${environment.apiUrl}/Account/Login`
      ,loin,{withCredentials:true})
      .pipe(tap((response:IloginResponse)=>{
        console.log('Login Successful',response);
        if(response.accessToken){
          localStorage.setItem(this.TOKEN_KEY,response.accessToken)
          const userInfo = this.decodeToken(response.accessToken);

          if (userInfo) {
            const user: IUser = {
              id: userInfo.nameid || userInfo.sub,
              userName: userInfo.unique_name || userInfo.name,
              email: userInfo.email,
              roleName: userInfo.role,
              phoneNumber: '',
              password: '',
              confirmPassword: ''
            };
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.userSubject.next(user);
            this.isAuthenticatedSubject.next(true);
          }
        }
      })
    );
}

  logout(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Account/logout`,
      {}, // body فارغ (لا نحتاج إرسال بيانات)
      { withCredentials: true } // لإرسال الـ Cookie
    ).pipe(
      tap(() => {
        // مسح جميع البيانات المحفوظة
        this.clearAuthData();
        console.log('logout ')

        // إعادة التوجيه لصفحة اللوجن
        this.router.navigate(['/login']);
      })
    );
  }

refreshToken(): Observable<IloginResponse> {
    return this.http.post<IloginResponse>(
      `${environment.apiUrl}/Account/refresh-token`,
      {}, // body فارغ (الـ Token موجود في الـ Cookie)
      { withCredentials: true } // ضروري لإرسال الـ Cookie
    ).pipe(
      tap((response: IloginResponse) => {
        // خطوة 1: التحقق من وجود Token جديد
        if (response.accessToken) {
          // خطوة 2: حفظ الـ Access Token الجديد
          localStorage.setItem(this.TOKEN_KEY, response.accessToken);

          // خطوة 3: فك تشفير الـ Token لتحديث بيانات المستخدم
          const userInfo = this.decodeToken(response.accessToken);

          if (userInfo) {
            // خطوة 4: بناء كائن المستخدم المحدث
            const user: IUser = {
              id: userInfo.nameid || userInfo.sub,
              userName: userInfo.unique_name || userInfo.name,
              email: userInfo.email,
              roleName: userInfo.role,
              phoneNumber: '',
              password: '',
              confirmPassword: ''
            };

            // خطوة 5: تحديث البيانات في localStorage و BehaviorSubject
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.userSubject.next(user);
          }
        }
      })
    );
  }
getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
private decodeToken(token: string): any {
    try {
      // خطوة 1: فصل الـ Token ونأخذ الـ Payload (الجزء الثاني)
      const payload = token.split('.')[1];

      // خطوة 2: فك التشفير من Base64 وتحويله لـ Object
      // atob() = decode from Base64
      // JSON.parse() = convert string to object
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(token?: string | null): boolean {
    // خطوة 1: إذا لم يُرسل token، نجلب المحفوظ
    if (!token) {
      token = this.getToken();
    }

    // خطوة 2: إذا لا يوجد token أصلاً، نعتبره منتهي
    if (!token) return true;

    // خطوة 3: فك تشفير الـ Token
    const decoded = this.decodeToken(token);

    // خطوة 4: إذا فشل فك التشفير أو لا يوجد exp، نعتبره منتهي
    if (!decoded || !decoded.exp) return true;

    // خطوة 5: تحويل الـ exp (Unix Timestamp) إلى Date object
    // exp في الـ Token بالثواني، لكن JavaScript Date يستخدم milliseconds
    const expirationDate = new Date(0); // تاريخ بداية Unix (1/1/1970)
    expirationDate.setUTCSeconds(decoded.exp); // نضيف الثواني

    // خطوة 6: مقارنة تاريخ انتهاء الصلاحية مع الوقت الحالي
    // إذا كان تاريخ الانتهاء < الوقت الحالي = انتهت الصلاحية
    return expirationDate < new Date();
  }

  getCurrentUser(): IUser | null {
    // .value تعطينا القيمة الحالية للـ BehaviorSubject مباشرة
    return this.userSubject.value;
  }

  private getUserFromStorage(): IUser | null {
    // خطوة 1: جلب النص من localStorage
    const userJson = localStorage.getItem(this.USER_KEY);

    if (userJson) {
      try {
        // خطوة 2: تحويل النص JSON إلى Object
        return JSON.parse(userJson);
      } catch (error) {
        // خطوة 3: إذا فشل التحويل (بيانات تالفة)، نرجع null
        console.error('Error parsing user from storage:', error);
        return null;
      }
    }
    // إذا لا يوجد بيانات في localStorage
    return null;
}
isAuthenticated(): boolean {
    const token = this.getToken();

    // && = AND operator
    // نتحقق من: يوجد Token و الـ Token لم تنتهي صلاحيته
    //  تحول أي قيمة لـ boolean
    return !!token && !this.isTokenExpired(token);
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();

    // ?. = Optional Chaining
    // إذا كان user = null، لن يحاول الوصول لـ role (يمنع الـ Error)
    return user?.roleName || null;
  }

  private clearAuthData(): void {
    // خطوة 1: مسح Access Token
    localStorage.removeItem(this.TOKEN_KEY);

    // خطوة 2: مسح بيانات المستخدم
    localStorage.removeItem(this.USER_KEY);

    // خطوة 3: إخطار جميع المشتركين بأن المستخدم = null
    // أي Component مشترك في user$ سيتلقى null تلقائياً
    this.userSubject.next(null);

    // خطوة 4: تحديث حالة المصادقة إلى false
    // أي Component مشترك في isAuthenticated$ سيتلقى false
    this.isAuthenticatedSubject.next(false);
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Account/forget-password`,
      { email } // نرسل فقط البريد الإلكتروني
    );
  }
  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Account/reset-password`,
      {
        email,        // البريد الإلكتروني
        token,        // Token التحقق
        newPassword   // كلمة المرور الجديدة
      }
    );
  } 
}