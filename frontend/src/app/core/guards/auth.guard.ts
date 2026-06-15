import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Functional guard — same idea as our NestJS JwtAuthGuard but on the client side.
// Returns true to allow navigation, or a UrlTree to redirect to /login.
export const authGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
