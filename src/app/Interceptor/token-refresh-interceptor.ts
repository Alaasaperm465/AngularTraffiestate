import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, finalize, switchMap, throwError } from 'rxjs';
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
        '/Account/Get-Roles',
        '/Account/refresh-token'
      ];
      const shouldExclude = excludedUrls.some((url) => req.url.includes(url));

      if (shouldExclude) {
        return throwError(() => error);
      }
      //  إذا حصل خطأ 401 (Unauthorized) والـ request ليس refresh-token نفسه
      if (error.status === 401 && !req.url.includes('/Account/refresh-token')) {
        if (isRefreshing) {
          console.log('Refresh already in progress, canceling request');
          return EMPTY;
        }
        isRefreshing = true;
        console.warn('Token expired, attempting refresh...');
        //  حاول تجديد الـ Token
        return authService.refreshToken().pipe(
          switchMap(() => {
            //  نجح التجديد، أعد المحاولة مع الـ Token الجديد
            const newToken = authService.getToken();
            if (!newToken) {
              console.error('No token after refresh');
              throw new Error('No token after refresh');
            }
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
              withCredentials: true,
            });

            console.log('Token refreshed successfully, retrying request');
            return next(clonedReq);
          }),
          catchError((refreshError: HttpErrorResponse) => {
            //  فشل التجديد، اذهب لصفحة Login
            console.error('Token refresh failed', refreshError.status);
            authService.clearAuthData();
            router.navigate(['/login'], {
              queryParams: {
                reason: 'session-expired',
                returnUrl: router.url,
              },
            });
            return throwError(() => refreshError);
          }),
          finalize(()=> {
            isRefreshing = false;
            console.log('Refresh flag reset');
          })
        );
      }

      //  أي خطأ آخر، ارجعه كما هو
      return throwError(() => error);
    })
  );
};
