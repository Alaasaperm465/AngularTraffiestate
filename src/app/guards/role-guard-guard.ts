import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service';
import { inject } from '@angular/core';

export const roleGuardGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService)
  const router = inject(Router)

  const allowedRoles = route.data['roles'] as string[];

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.warn(`Access denied. User role: ${userRole}, Required: ${allowedRoles}`);
    router.navigate(['/not-found']); // أو أي صفحة خطأ
    return false;
  }

  return true;
};
