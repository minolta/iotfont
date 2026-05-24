import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.currentUser()) {
    return true;
  }

  return authService.loadCurrentUser().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const ensureAdmin = (user: { role: string } | null) =>
    user?.role?.toUpperCase() === 'ADMIN' ? true : router.createUrlTree(['/devices']);

  if (authService.currentUser()) {
    return ensureAdmin(authService.currentUser());
  }

  return authService.loadCurrentUser().pipe(map((user) => ensureAdmin(user)));
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  if (authService.currentUser()) {
    return router.createUrlTree(['/devices']);
  }

  return authService.loadCurrentUser().pipe(
    map((user) => (user ? router.createUrlTree(['/devices']) : true)),
  );
};
