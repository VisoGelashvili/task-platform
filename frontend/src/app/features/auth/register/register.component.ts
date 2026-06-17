import { Component, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Task Platform</h1>
        <h2>Create your account</h2>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="token">Invite Token</label>
            <input
              id="token"
              type="text"
              formControlName="token"
              placeholder="Paste your invite token"
            />
          </div>

          <div class="field">
            <label for="name">Full Name</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Your full name"
              autocomplete="name"
            />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="At least 6 characters"
              autocomplete="new-password"
            />
          </div>

          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }

          @if (success()) {
            <p class="success-msg">{{ success() }}</p>
          }

          <button
            type="submit"
            class="btn btn-primary btn-full"
            [disabled]="form.invalid || loading() || !!success()"
          >
            {{ loading() ? "Creating account…" : "Create account" }}
          </button>
        </form>

        <div class="auth-link">
          Already have an account? <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  error = signal<string | null>(null);
  success = signal<string | null>(null);
  loading = signal(false);

  form = new FormGroup({
    token: new FormControl(
      this.route.snapshot.queryParamMap.get("token") ?? "",
      [Validators.required],
    ),
    name: new FormControl("", [Validators.required, Validators.minLength(2)]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.http
      .post(`${environment.apiUrl}/auth/register`, this.form.value)
      .subscribe({
        next: () => {
          this.success.set("Account created! Redirecting to login…");
          setTimeout(() => this.router.navigate(["/login"]), 1500);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? "Registration failed");
          this.loading.set(false);
        },
      });
  }
}
