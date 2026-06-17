import { Component, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { TaskService } from "../../core/services/task.service";

interface SearchHit {
  id: string;
  score: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: string;
}

@Component({
  selector: "app-search",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title" style="margin-bottom:1.5rem">Search Tasks</h1>

      <form [formGroup]="form" (ngSubmit)="doSearch()">
        <div
          style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:flex-end"
        >
          <div class="field" style="flex:1;min-width:220px;margin-bottom:0">
            <input
              formControlName="q"
              placeholder="Search by title or description…"
              (keydown.enter)="doSearch()"
            />
          </div>
          <div class="field" style="margin-bottom:0;min-width:130px">
            <select formControlName="status">
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div class="field" style="margin-bottom:0;min-width:130px">
            <select formControlName="priority">
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            {{ loading() ? "Searching…" : "Search" }}
          </button>
        </div>
      </form>

      @if (loading()) {
        <div class="empty"><p>Searching…</p></div>
      } @else if (!searched()) {
        <div class="empty">
          <h3>Find tasks across your projects</h3>
          <p>
            Full-text search powered by Elasticsearch — tolerates typos too.
          </p>
        </div>
      } @else if (results().length === 0) {
        <div class="empty">
          <h3>No results</h3>
          <p>Try different keywords or remove the filters.</p>
        </div>
      } @else {
        <p style="color:var(--muted);font-size:.875rem;margin-bottom:1rem">
          {{ results().length }} result{{ results().length === 1 ? "" : "s" }}
        </p>

        <div style="display:flex;flex-direction:column;gap:.75rem">
          @for (hit of results(); track hit.id) {
            <div class="card">
              <div
                style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem"
              >
                <div style="flex:1;min-width:0">
                  <div class="card-title" style="margin-bottom:.375rem">
                    {{ hit.title }}
                  </div>
                  @if (hit.description) {
                    <p
                      style="font-size:.875rem;color:var(--muted);margin-bottom:.5rem;
                               overflow:hidden;display:-webkit-box;
                               -webkit-line-clamp:2;-webkit-box-orient:vertical"
                    >
                      {{ hit.description }}
                    </p>
                  }
                  <div style="display:flex;gap:.375rem;flex-wrap:wrap">
                    <span class="badge badge-{{ hit.status }}">{{
                      hit.status
                    }}</span>
                    <span class="badge badge-{{ hit.priority }}">{{
                      hit.priority
                    }}</span>
                  </div>
                </div>
                <a
                  [routerLink]="['/projects', hit.projectId]"
                  class="btn btn-outline btn-sm"
                  style="white-space:nowrap;flex-shrink:0"
                >
                  Open Project →
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SearchComponent implements OnInit {
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  results = signal<SearchHit[]>([]);
  loading = signal(false);
  searched = signal(false);

  form = new FormGroup({
    q: new FormControl(""),
    status: new FormControl(""),
    priority: new FormControl(""),
  });

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get("q") ?? "";
    if (q) {
      this.form.patchValue({ q });
      this.doSearch();
    }
  }

  doSearch() {
    const { q, status, priority } = this.form.value;
    this.loading.set(true);
    this.taskService
      .search(q ?? "", status || undefined, priority || undefined)
      .subscribe({
        next: (hits) => {
          this.results.set(hits as SearchHit[]);
          this.loading.set(false);
          this.searched.set(true);

          this.router.navigate([], {
            queryParams: { q: q || null },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: () => {
          this.loading.set(false);
          this.searched.set(true);
        },
      });
  }
}
