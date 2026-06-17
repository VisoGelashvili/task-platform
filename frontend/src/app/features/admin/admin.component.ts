import { Component, inject, signal, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { environment } from "../../../environments/environment";

interface ActiveUser {
  _id: string;
  name: string;
  email: string;
}

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <h1 class="page-title" style="margin-bottom:2rem">Admin Panel</h1>

      <section class="card" style="margin-bottom:2rem;max-width:560px">
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:1.25rem">
          Invite a New User
        </h2>

        <form [formGroup]="inviteForm" (ngSubmit)="sendInvite()">
          <div
            style="display:flex;gap:.75rem;align-items:flex-end;flex-wrap:wrap"
          >
            <div class="field" style="flex:1;min-width:200px;margin-bottom:0">
              <label>Email address</label>
              <input
                type="email"
                formControlName="email"
                placeholder="colleague@example.com"
                autocomplete="off"
              />
            </div>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="inviteForm.invalid || inviting()"
            >
              {{ inviting() ? "Sending…" : "Send Invite" }}
            </button>
          </div>

          @if (inviteError()) {
            <p class="error-msg" style="margin-top:.75rem;margin-bottom:0">
              {{ inviteError() }}
            </p>
          }
        </form>

        @if (inviteLink()) {
          <div
            style="margin-top:1.25rem;padding:1rem;background:var(--bg);
                      border-radius:var(--radius);border:1px solid var(--border)"
          >
            <p
              style="font-size:.8125rem;font-weight:500;margin-bottom:.5rem;color:var(--muted)"
            >
              Share this registration link with the invitee:
            </p>
            <div style="display:flex;gap:.5rem;align-items:center">
              <code
                style="font-size:.8rem;word-break:break-all;flex:1;
                            background:var(--surface);padding:.375rem .625rem;
                            border-radius:4px;border:1px solid var(--border)"
              >
                {{ inviteLink() }}
              </code>
              <button
                class="btn btn-outline btn-sm"
                style="flex-shrink:0"
                (click)="copyLink()"
              >
                {{ copied() ? "Copied!" : "Copy" }}
              </button>
            </div>
          </div>
        }
      </section>

      <section>
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:.875rem">
          Active Users ({{ users().length }})
        </h2>

        @if (usersLoading()) {
          <div class="empty"><p>Loading…</p></div>
        } @else if (users().length === 0) {
          <div class="empty"><h3>No active users yet</h3></div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:.5rem">
            @for (user of users(); track user._id) {
              <div
                class="card"
                style="display:flex;align-items:center;gap:1rem;padding:.875rem 1.25rem"
              >
                <div
                  style="width:36px;height:36px;border-radius:50%;background:var(--primary);
                             display:flex;align-items:center;justify-content:center;
                             color:#fff;font-weight:600;font-size:.9rem;flex-shrink:0"
                >
                  {{ initial(user) }}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:500">{{ user.name || "—" }}</div>
                  <div style="font-size:.8125rem;color:var(--muted)">
                    {{ user.email }}
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);

  inviting = signal(false);
  inviteError = signal<string | null>(null);
  inviteLink = signal<string | null>(null);
  copied = signal(false);

  inviteForm = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
  });

  users = signal<ActiveUser[]>([]);
  usersLoading = signal(true);

  ngOnInit() {
    this.http.get<ActiveUser[]>(`${environment.apiUrl}/users`).subscribe({
      next: (users) => {
        this.users.set(users);
        this.usersLoading.set(false);
      },
      error: () => this.usersLoading.set(false),
    });
  }

  sendInvite() {
    if (this.inviteForm.invalid) return;
    this.inviting.set(true);
    this.inviteError.set(null);
    this.inviteLink.set(null);

    this.http
      .post<{
        inviteToken: string;
      }>(`${environment.apiUrl}/auth/invite`, this.inviteForm.value)
      .subscribe({
        next: (res) => {
          const link = `${window.location.origin}/register?token=${res.inviteToken}`;
          this.inviteLink.set(link);
          this.inviting.set(false);
          this.inviteForm.reset();
        },
        error: (err) => {
          this.inviteError.set(err.error?.message ?? "Failed to send invite");
          this.inviting.set(false);
        },
      });
  }

  copyLink() {
    navigator.clipboard.writeText(this.inviteLink()!).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  initial(user: ActiveUser): string {
    return (user.name || user.email).charAt(0).toUpperCase();
  }
}
