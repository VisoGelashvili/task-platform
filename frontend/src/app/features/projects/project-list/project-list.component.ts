import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Projects</h1>
        <button class="btn btn-primary" (click)="showModal.set(true)">+ New Project</button>
      </div>

      @if (loading()) {
        <div class="empty"><p>Loading…</p></div>
      } @else if (projects().length === 0) {
        <div class="empty">
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
        </div>
      } @else {
        <div class="grid-auto">
          @for (project of projects(); track project._id) {
            <a [routerLink]="['/projects', project._id]" class="card card-link">
              <div class="card-title">{{ project.name }}</div>
              <div class="card-meta">{{ project.members.length }} member(s)</div>
              @if (project.description) {
                <p class="card-description">{{ project.description }}</p>
              }
            </a>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">New Project</h2>

          <form [formGroup]="form" (ngSubmit)="create()">
            <div class="field">
              <label for="proj-name">Name</label>
              <input id="proj-name" formControlName="name"
                     placeholder="My awesome project" />
            </div>

            <div class="field">
              <label for="proj-desc">
                Description
                <span style="color:var(--muted);font-weight:400"> (optional)</span>
              </label>
              <textarea id="proj-desc" formControlName="description"
                        placeholder="What is this project about?"></textarea>
            </div>

            @if (createError()) {
              <p class="error-msg">{{ createError() }}</p>
            }

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeModal()">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary"
                      [disabled]="form.invalid || creating()">
                {{ creating() ? 'Creating…' : 'Create Project' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .card-description {
      font-size: .875rem;
      margin-top: .5rem;
      color: var(--muted);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  `],
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);

  projects   = signal<Project[]>([]);
  loading    = signal(true);
  showModal  = signal(false);
  creating   = signal(false);
  createError = signal<string | null>(null);

  form = new FormGroup({
    name:        new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl(''),
  });

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next:  data => { this.projects.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  create() {
    if (this.form.invalid) return;
    this.creating.set(true);
    this.createError.set(null);

    const { name, description } = this.form.value;
    this.projectService.create({ name: name!, description: description ?? undefined }).subscribe({
      next: project => {
        this.projects.update(list => [...list, project]);
        this.closeModal();
        this.creating.set(false);
      },
      error: err => {
        this.createError.set(err.error?.message ?? 'Failed to create project');
        this.creating.set(false);
      },
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.form.reset();
    this.createError.set(null);
  }
}
