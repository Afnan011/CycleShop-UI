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

  // Check if the route requires admin privileges
  if (route.data['requiresAdmin'] && user.role !== 'admin') {
    // If user is an employee, redirect to dashboard
    // This allows employees to access the dashboard but not admin-only routes
    if (user.role === 'employee') {
      router.navigate(['/admin/dashboard']);
    } else {
      // For other non-admin roles, redirect to login
      router.navigate(['/login']);
    }
    return false;
  }

  // Check if route is restricted by role
  if (route.data['roles'] && !route.data['roles'].includes(user.role)) {
    if (user.role === 'admin') {
      router.navigate(['/admin/dashboard']);
    } else if (user.role === 'employee') {
      router.navigate(['/admin/dashboard']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  return true;
};
