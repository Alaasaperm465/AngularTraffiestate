import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service';
import Swal from 'sweetalert2';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const authService  = inject(AuthService);
  const router = inject(Router);

  if(authService.isAuthenticated()){
    return true;
  }

  // إذا لم يكن المستخدم مسجل دخول
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'warning',
    title: 'Access Denied',
    text: 'Please log in to continue',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#fff',
    color: '#2c3e50',
    iconColor: '#E2B43B',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  router.navigate(['/login'],{
    queryParams : {returnUrl:state.url}
  });
  return false;
};
