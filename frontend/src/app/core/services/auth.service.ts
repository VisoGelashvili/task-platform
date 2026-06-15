import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private readonly api = `${environment.apiUrl}/auth`;

  // Signals are Angular 17's reactive primitive — like a BehaviorSubject but simpler.
  // Any template or computed() that reads token() automatically re-renders when it changes.
  readonly token       = signal<string | null>(localStorage.getItem('token'));
  readonly currentUser = signal<User | null>(null);

  // computed() derives a value from other signals — no manual subscription needed.
  readonly isLoggedIn  = computed(() => !!this.token());
  readonly isAdmin     = computed(() => this.currentUser()?.role === 'admin');

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${this.api}/login`, { email, password })
      .pipe(
        tap(res => {
          this.token.set(res.access_token);
          localStorage.setItem('token', res.access_token);
          this.fetchCurrentUser();
        }),
      );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // Called once from AppComponent.ngOnInit to restore the session after a page refresh.
  init() {
    if (this.token()) this.fetchCurrentUser();
  }

  private fetchCurrentUser() {
    this.http.get<User>(`${this.api}/me`).subscribe({
      next:  user  => this.currentUser.set(user),
      error: ()    => this.logout(), // token is expired or invalid
    });
  }
}
