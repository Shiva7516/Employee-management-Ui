import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (role: 'ADMIN' | 'EMPLOYEE'): CanActivateFn =>
  () => {

    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasRole(role)) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
