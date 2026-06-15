import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav class="navbar">
      <a routerLink="/projects" class="navbar-brand">Task Platform</a>

      <!-- Inline search bar — navigates to /search?q=... on submit -->
      <form class="navbar-search" (ngSubmit)="goSearch()">
        <input #searchInput
               type="search"
               placeholder="Search tasks…"
               [value]="searchQ"
               (input)="searchQ = $any($event.target).value"
               (keydown.enter)="goSearch()" />
      </form>

      <div class="navbar-right">
        @if (auth.isAdmin()) {
          <a routerLink="/admin" class="btn btn-outline btn-sm">Admin</a>
        }
        <span class="navbar-user">{{ auth.currentUser()?.name || auth.currentUser()?.email }}</span>
        <button class="btn btn-outline btn-sm" (click)="auth.logout()">Sign out</button>
      </div>
    </nav>

    <router-outlet />
  `,
  styles: [`
    .navbar-search {
      flex: 1;
      max-width: 320px;
      margin: 0 1.5rem;
    }
    .navbar-search input {
      width: 100%;
      padding: .4rem .875rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      font-size: .875rem;
      outline: none;
      background: var(--bg);
      transition: border-color .15s;
    }
    .navbar-search input:focus { border-color: var(--primary); }
  `],
})
export class ShellComponent {
  auth    = inject(AuthService);
  router  = inject(Router);
  searchQ = '';

  goSearch() {
    if (!this.searchQ.trim()) {
      this.router.navigate(['/search']);
    } else {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQ.trim() } });
    }
    this.searchQ = '';
  }
}
