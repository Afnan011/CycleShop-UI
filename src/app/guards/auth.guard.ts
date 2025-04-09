import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const user = authService.getCurrentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Check if the route requires admin role
  if (route.data['requiresAdmin']) {
    if (user.role === 'admin') {
      return true;
    } else {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  // For non-admin routes, allow access
  return true;
};
