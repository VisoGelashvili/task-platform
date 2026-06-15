import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Functional interceptor — Angular 17's modern alternative to class-based interceptors.
// Reads the token signal and clones every outgoing request to add the Authorization header.
// Because it uses inject(), it has access to the full DI tree.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
