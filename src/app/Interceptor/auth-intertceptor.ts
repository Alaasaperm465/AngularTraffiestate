import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth-service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const excludedUrls = [
    '/Account/login',
    '/Account/register',
    '/Account/forget-password',
    '/Account/reset-password',
    '/Account/Get-Roles',
    '/Account/refresh-token',
    '/Account/logout'
  ];

  // تحقق إذا كان الـ URL من القائمة المستثناة
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

  if (shouldExclude) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && !authService.isTokenExpired(token)) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials:true
    });
    console.log('Token added to request:', req.url);
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.warn('❌ 401 Unauthorized - Session expired or invalid token');
          authService.clearAuthData();
          router.navigate(['/login'], {
            queryParams: { reason: 'session-expired' }
          });
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
