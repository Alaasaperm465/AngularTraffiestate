import { inject, Injectable } from '@angular/core';
// import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IUser } from '../models/iuser';
import { BehaviorSubject, catchError, map, Observable, retry, tap, throwError } from 'rxjs';
import { IloginRequest } from '../models/ilogin-request';
import { IloginResponse } from '../models/ilogin-response';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { ITokenClaims } from '../models/itoken-claims';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private readonly TOKEN_KEY = 'accessToken';
  private readonly USER_KEY = 'currentUser';
  private tokenCheckInterval: any;

  private cachedTokenString: string | null = null;
  private cachedTokenClaims: ITokenClaims | null = null;

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

    this.initializeAuth();
  }

  //  وظيفة جديدة لتحميل البيانات من localStorage
  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getUserFromStorage();

    if (token && !this.isTokenExpired(token) && user) {
      this.userSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      console.log('User authenticated from storage:', user.userName);
      this.startTokenExpiryCheck();
    } else {
      this.clearAuthData();
    }
  }

  // تحقق من انتهاء الصلاحية كل دقيقة
  private startTokenExpiryCheck(): void {
    this.stopTokenExpiryCheck();
    console.log('🔄 Starting token expiry check...');
    this.tokenCheckInterval = setInterval(() => {
      const token = this.getToken();

      if (!this.isAuthenticated()) {
        console.log(' User not authenticated, stopping token check');
        this.stopTokenExpiryCheck();
        return;
      }
      if (token && !this.isTokenExpired(token)) {
        const decoded = this.decodeToken(token);

        if (decoded && decoded.exp) {
          const expiresIn = decoded.exp * 1000 - Date.now();
          const fiveMinutes = 3 * 60 * 1000;

          //  إذا باقي 3 دقائق، حدث الـ Token
          if (expiresIn < fiveMinutes && expiresIn > 0) {
            console.log('Token expiring soon, refreshing...');
            this.refreshToken().subscribe({
              next: () => console.log('Token refreshed preemptively'),
              error: (err) => {
                console.error(' Preemptive refresh failed:', err);
                if (err.status === 401) {
                  console.warn('Refresh token expired, logging out...');
                  this.clearAuthData();
                  this.router.navigate(['/login'], {
                    queryParams: { reason: 'session-expired' },
                  });
                }
              },
            });
          }
        }
      }
    }, 60000); // كل دقيقة
  }

  // method جديدة لإيقاف الـ Timer
  private stopTokenExpiryCheck(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
      console.log('Token expiry check stopped');
    }
  }

  register(user: IUser): Observable<IUser> {
    return this.http.post<IUser>(`${environment.apiUrl}/Account/register`, user).pipe(
      tap(() => {
        console.log(' Registration successful');
        this.router.navigate(['/login']);
      })
    );
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

  Login(loin: IloginRequest): Observable<IloginResponse> {
    return this.http
      .post<IloginResponse>(`${environment.apiUrl}/Account/Login`, loin, { withCredentials: true })
      .pipe(
        tap((response: IloginResponse) => {
          console.log('Login Successful', response);
          if (response.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, response.accessToken);
            const userInfo = this.decodeToken(response.accessToken);

            if (userInfo) {
              const user: IUser = {
                id: userInfo.nameid,
                userName: userInfo.unique_name,
                email: userInfo.email,
                roleName: userInfo.role,
                phoneNumber: '',
                password: '',
                confirmPassword: '',
              };
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              this.userSubject.next(user);
              this.isAuthenticatedSubject.next(true);
              this.startTokenExpiryCheck();
            }
          }
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(
        `${environment.apiUrl}/Account/logout`,
        {}, // body فارغ (لا نحتاج إرسال بيانات)
        { withCredentials: true } // لإرسال الـ Cookie
      )
      .pipe(
        tap(() => {
          this.clearAuthData();
          console.log('Logged out successfully ');
          this.router.navigate(['/login']);
        }),
        catchError((error) => {
          console.warn('Logout API failed, clearing local data');
          this.clearAuthData();
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<IloginResponse> {
    return this.http
      .post<IloginResponse>(
        `${environment.apiUrl}/Account/refresh-token`,
        {}, // body فارغ (الـ Token موجود في الـ Cookie)
        { withCredentials: true } // ضروري لإرسال الـ Cookie
      )
      .pipe(
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
                id: userInfo.nameid,
                userName: userInfo.unique_name,
                email: userInfo.email,
                roleName: userInfo.role,
                phoneNumber: '',
                password: '',
                confirmPassword: '',
              };
              // خطوة 5: تحديث البيانات في localStorage و BehaviorSubject
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              this.userSubject.next(user);
              console.log('Token refreshed successfully');
            }
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Refresh token failed:', error);
          if (error.status === 401) {
            console.warn('Refresh token expired or invalid');
            this.clearAuthData();
          }
          return throwError(() => error);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private decodeToken(token: string): ITokenClaims | null {
    if (token === this.cachedTokenString && this.cachedTokenClaims) {
      return this.cachedTokenClaims;
    }

    try {
      // خطوة 1: فصل الـ Token ونأخذ الـ Payload (الجزء الثاني)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload)) as any;

      this.cachedTokenString = token;
      this.cachedTokenClaims = decoded;
      //  Log للتأكد من القيم (للـ debugging)
      console.log('Decoded Token:', decoded);
      // console.log('Token Claims:', decoded);
      // console.log('Available Keys:', Object.keys(decoded));

      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.clearTokenCache();
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
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = 10 * 1000;

    return expirationTime - bufferTime <= currentTime;
  }

  getCurrentUser(): IUser | null {
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
        console.error('Error parsing user from storage:', error);
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    // إذا كان user = null، لن يحاول الوصول لـ role (يمنع الـ Error)
    return user?.roleName || null;
  }

  public clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.stopTokenExpiryCheck();
    this.clearTokenCache();
    console.log('Auth data cleared');
  }

  private clearTokenCache(): void {
    this.cachedTokenString = null;
    this.cachedTokenClaims = null;
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Account/forget-password`,
      { email } // نرسل فقط البريد الإلكتروني
    );
  }
  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/Account/reset-password`, {
      email,
      token,
      newPassword,
    });
  }
}
