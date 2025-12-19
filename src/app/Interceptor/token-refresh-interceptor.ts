import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Subject, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../Services/auth-service';

let refreshTokenSubject: Subject<string | null> | null = null;
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
        '/Account/refresh-token',
        '/Account/logout',
      ];

      const shouldExclude = excludedUrls.some((url) => req.url.includes(url));

      if (shouldExclude) {
        return throwError(() => error);
      }

      //  معالجة خطأ 401 (Unauthorized)
      if (error.status === 401) {
        console.warn('⚠️ 401 error detected, attempting token refresh...');

        //  إذا كان الـ refresh قيد التنفيذ، انتظر
        if (isRefreshing) {
          if (!refreshTokenSubject) {
            refreshTokenSubject = new Subject<string | null>();
          }

          return refreshTokenSubject.pipe(
            switchMap((newToken) => {
              if (!newToken) {
                return throwError(() => new Error('No token after refresh'));
              }

              const clonedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
                withCredentials: true,
              });

              return next(clonedReq);
            }),
            catchError(() => throwError(() => error))
          );
        }

        //  بدء الـ refresh
        isRefreshing = true;
        refreshTokenSubject = new Subject<string | null>();

        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = authService.getToken();

            if (!newToken) {
              console.error(' No token after refresh');
              throw new Error('No token after refresh');
            }

            //  إشعار جميع الـ requests المنتظرة
            if (refreshTokenSubject) {
              refreshTokenSubject.next(newToken);
              refreshTokenSubject.complete();
            }

            //  إعادة المحاولة للـ request الحالي
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
              withCredentials: true,
            });

            console.log(' Token refreshed, retrying request:', req.url);
            return next(clonedReq);
          }),
          catchError((refreshError: HttpErrorResponse) => {
            console.error(' Token refresh failed:', refreshError.status);

            //  إشعار جميع الـ requests بالفشل
            if (refreshTokenSubject) {
              refreshTokenSubject.error(refreshError);
              refreshTokenSubject.complete();
            }

            if (refreshError.status === 401) {
              authService.clearAuthData();
              router.navigate(['/login'], {
                queryParams: {
                  reason: 'session-expired',
                  returnUrl: router.url,
                },
              });
            }

            return throwError(() => refreshError);
          }),
          finalize(() => {
            // ✅ Reset state
            isRefreshing = false;
            refreshTokenSubject = null;
            console.log('🔄 Refresh state reset');
          })
        );
      }
      return throwError(() => error);
    })
  );
};
