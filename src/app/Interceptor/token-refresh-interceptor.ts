import { HttpInterceptorFn ,HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../Services/auth-service';

let isRefreshing = false;

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

  const excludedUrls = [
    '/Account/login',
    '/Account/register',
    '/Account/forget-password',
    '/Account/reset-password',
    '/Account/Get-Roles'
  ];
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

      if (shouldExclude) {
        return throwError(() => error);
      }
      //  إذا حصل خطأ 401 (Unauthorized) والـ request ليس refresh-token نفسه
      if (error.status === 401 && !req.url.includes('/Account/refresh-token')) {
        if (isRefreshing) {
          console.log('Refresh already in progress, rejecting request');
          return throwError(() => error);
        }
        isRefreshing = true;
        console.warn('Token expired, attempting refresh...');
        //  حاول تجديد الـ Token
        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            //  نجح التجديد، أعد المحاولة مع الـ Token الجديد
            const newToken = authService.getToken();
            if (!newToken) {
              throw new Error('No token after refresh');
            }
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            console.log('Token refreshed successfully, retrying request');
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            //  فشل التجديد، اذهب لصفحة Login
            console.error('Token refresh failed, redirecting to login');
            authService.clearAuthData();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      //  أي خطأ آخر، ارجعه كما هو
      return throwError(() => error);
    })
  );
};
