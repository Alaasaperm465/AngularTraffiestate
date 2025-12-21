import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IUser } from '../models/iuser';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  retry,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
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

  private refreshTokenInProgress = false;
  private refreshTokenSubject: Observable<IloginResponse> | null = null;

  private cachedTokenString: string | null = null;
  private cachedTokenClaims: ITokenClaims | null = null;

  userSubject: BehaviorSubject<IUser | null>;
  isAuthenticatedSubject: BehaviorSubject<boolean>;

  user$: Observable<IUser | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(private http: HttpClient) {
    this.userSubject = new BehaviorSubject<IUser | null>(null);
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    this.user$ = this.userSubject.asObservable();
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    setTimeout(() => this.initializeAuth(), 0);
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getUserFromStorage();

    if (token && user) {
      if (this.isTokenExpired(token)) {
        console.log('Token expired on init, attempting refresh...');

        this.refreshToken().subscribe({
          next: () => {
            console.log(' Token refreshed on init');
            const updatedUser = this.getUserFromStorage();
            this.userSubject.next(updatedUser);
            this.isAuthenticatedSubject.next(true);
            this.startTokenExpiryCheck();
          },
          error: () => {
            console.log(' Token refresh failed on init, clearing auth');
            this.clearAuthData();
          },
        });
      } else {
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        console.log(' User authenticated from storage:', user.userName);
        this.startTokenExpiryCheck();
      }
    } else {
      this.clearAuthData();
    }
  }

  private startTokenExpiryCheck(): void {
    this.stopTokenExpiryCheck();
    console.log('Starting token expiry check...');

    this.tokenCheckInterval = setInterval(() => {
      if (this.refreshTokenInProgress) {
        console.log('Refresh already in progress, skipping check');
        return;
      }

      if (!this.isAuthenticated()) {
        console.log('User not authenticated, stopping token check');
        this.stopTokenExpiryCheck();
        return;
      }

      const token = this.getToken();
      if (!token) return;

      const decoded = this.decodeToken(token);
      if (!decoded?.exp) return;

      const expiresIn = decoded.exp * 1000 - Date.now();
      const threeMinutes = 3 * 60 * 1000;

      if (expiresIn < threeMinutes && expiresIn > 0) {
        console.log(' Token expiring soon, refreshing...');

        this.refreshToken().subscribe({
          next: () => console.log(' Token refreshed preemptively'),
          error: (err) => {
            console.error(' Preemptive refresh failed:', err);
            if (err.status === 401) {
              this.handleRefreshFailure();
            }
          },
        });
      } else if (expiresIn <= 0) {
        console.log(' Token expired, attempting immediate refresh...');

        this.refreshToken().subscribe({
          next: () => console.log('Token refreshed successfully'),
          error: () => this.handleRefreshFailure(),
        });
      }
    }, 60000);
  }

  private stopTokenExpiryCheck(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
      console.log('Token expiry check stopped');
    }
  }

  private handleRefreshFailure(): void {
    console.warn('Refresh token expired, logging out...');
    this.clearAuthData();
    this.stopTokenExpiryCheck();
    this.router.navigate(['/login'], {
      queryParams: { reason: 'session-expired' },
    });
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
        console.log('API Response:', response);
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
            this.setToken(response.accessToken);
            const userInfo = this.decodeToken(response.accessToken);

            if (userInfo) {
              const user = this.extractUserFromToken(userInfo);
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
        {},
        { withCredentials: true }
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
    if (this.refreshTokenInProgress && this.refreshTokenSubject) {
      return this.refreshTokenSubject;
    }
    this.refreshTokenInProgress = true;

    this.refreshTokenSubject = this.http
      .post<IloginResponse>(
        `${environment.apiUrl}/Account/refresh-token`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((response: IloginResponse) => {
          if (response.accessToken) {
            this.setToken(response.accessToken);
            const userInfo = this.decodeToken(response.accessToken);
            if (userInfo) {
              const user = this.extractUserFromToken(userInfo);
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              this.userSubject.next(user);
              console.log('Token refreshed successfully');
            }
          }
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject = null;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Refresh token failed:', error);

          this.refreshTokenInProgress = false;
          this.refreshTokenSubject = null;

          if (error.status === 401) {
            console.warn('Refresh token expired or invalid');
            this.clearAuthData();
          }
          return throwError(() => error);
        }),
        shareReplay(1)
      );
    return this.refreshTokenSubject;
  }
  isRefreshingToken(): boolean {
    return this.refreshTokenInProgress;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.clearTokenCache();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private decodeToken(token: string): ITokenClaims | null {
    if (token === this.cachedTokenString && this.cachedTokenClaims) {
      return this.cachedTokenClaims;
    }

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload)) as ITokenClaims;

      this.cachedTokenString = token;
      this.cachedTokenClaims = decoded;
      console.log('Decoded Token:', decoded);

      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.clearTokenCache();
      return null;
    }
  }

  isTokenExpired(token?: string | null): boolean {
    if (!token) {
      token = this.getToken();
    }
    if (!token) return true;
    const decoded = this.decodeToken(token);
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
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
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
    return user?.roleName || null;
  }

  public clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.stopTokenExpiryCheck();
    this.clearTokenCache();
    this.refreshTokenInProgress = false;
    this.refreshTokenSubject = null;
    console.log('Auth data cleared');
  }

  private clearTokenCache(): void {
    this.cachedTokenString = null;
    this.cachedTokenClaims = null;
  }

  forgetPassword(email: string): Observable<any> {
  return this.http.post(`${environment.apiUrl}/Account/forget-password`, { email }).pipe(
    tap((response) => {
      console.log('✅ Forget password request sent', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Forget password failed:', error);
      return throwError(() => error);
    })
  );
}
  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
  return this.http
    .post(`${environment.apiUrl}/Account/reset-password`, {
      email: email,
      token: token,
      newPassword: newPassword,
      confirmPassword: newPassword
    })
    .pipe(
      tap((response) => {
        console.log(' Password reset successful', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(' Reset password failed:', error);
        return throwError(() => error);
      })
    );
}

  // helper
  private extractUserFromToken(decoded: any): IUser {
    return {
      id: this.getClaimValue(decoded, 'nameidentifier') || '',
      userName: this.getClaimValue(decoded, 'name') || '',
      email: this.getClaimValue(decoded, 'emailaddress') || '',
      roleName: this.getClaimValue(decoded, 'role') || '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    };
  }

  private getClaimValue(decoded: any, claimType: string): string | null {
    const shortNames: { [key: string]: string } = {
      nameidentifier: 'nameid',
      name: 'unique_name',
      emailaddress: 'email',
      role: 'role',
    };

    const shortName = shortNames[claimType] || claimType;
    if (decoded[shortName]) {
      return decoded[shortName];
    }

    const longNames: { [key: string]: string } = {
      nameidentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
      name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      emailaddress: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    };

    const longName = longNames[claimType];
    if (longName && decoded[longName]) {
      return decoded[longName];
    }

    return null;
  }
}
