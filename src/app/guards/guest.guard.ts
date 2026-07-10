import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isInitialized()) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (auth.isInitialized()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  if (auth.isAuthenticated()) {
    return router.parseUrl('/');
  }

  return true;
};
