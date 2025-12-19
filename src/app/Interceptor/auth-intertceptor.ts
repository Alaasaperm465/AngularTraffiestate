import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth-service';

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
  const token = authService.getToken();

  if (token && !authService.isTokenExpired(token)) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials:true
    });
    console.log('Token added to request:', req.url);
    return next(cloned);
  }

  return next(req);
};
