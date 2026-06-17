import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ProjectService } from "../../../core/services/project.service";
import { TaskService } from "../../../core/services/task.service";
import { AuthService } from "../../../core/services/auth.service";
import { Project } from "../../../core/models/project.model";
import { Task, TaskStatus } from "../../../core/models/task.model";
import { ConfirmDialogComponent } from "../../../shared/confirm-dialog.component";

@Component({
  selector: "app-project-detail",
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgTemplateOutlet,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="empty"><p>Loading…</p></div>
      } @else if (project()) {
        <div style="margin-bottom:2rem">
          <div
            style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem"
          >
            <div>
              <a
                routerLink="/projects"
                class="btn btn-outline btn-sm"
                style="margin-bottom:.875rem;display:inline-flex"
                >← Projects</a
              >
              <h1 class="page-title">{{ project()!.name }}</h1>
              @if (project()!.description) {
                <p style="color:var(--muted);margin-top:.375rem">
                  {{ project()!.description }}
                </p>
              }
            </div>
            @if (canManage()) {
              <button
                class="btn btn-danger btn-sm"
                style="margin-top:2.5rem;white-space:nowrap"
                (click)="deleteProject()"
              >
                Delete Project
              </button>
            }
          </div>
        </div>

        <section>
          <div
            style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem"
          >
            <h2 style="font-size:1rem;font-weight:600">Members</h2>
            @if (canManage()) {
              <button
                class="btn btn-outline btn-sm"
                (click)="showAddMember.set(!showAddMember())"
              >
                {{ showAddMember() ? "Cancel" : "+ Add Member" }}
              </button>
            }
          </div>

          @if (showAddMember()) {
            <div class="card" style="margin-bottom:.75rem">
              <div
                style="display:flex;gap:.75rem;align-items:flex-end;flex-wrap:wrap"
              >
                <div
                  class="field"
                  style="margin-bottom:0;flex:1;min-width:200px"
                >
                  <label>Email address</label>
                  <input
                    type="email"
                    [value]="addEmail()"
                    (input)="addEmail.set($any($event.target).value)"
                    placeholder="colleague@example.com"
                  />
                </div>
                <button
                  class="btn btn-primary"
                  (click)="addMember()"
                  [disabled]="!addEmail().trim() || addLoading()"
                >
                  {{ addLoading() ? "Adding…" : "Add" }}
                </button>
              </div>
              @if (addError()) {
                <p class="error-msg" style="margin-top:.75rem;margin-bottom:0">
                  {{ addError() }}
                </p>
              }
            </div>
          }

          <div style="display:flex;flex-direction:column;gap:.5rem">
            @for (member of project()!.members; track member._id) {
              <div
                class="card"
                style="display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.25rem"
              >
                <div>
                  <span style="font-weight:500">{{ member.name }}</span>
                  <span
                    style="color:var(--muted);font-size:.875rem;margin-left:.5rem"
                    >{{ member.email }}</span
                  >
                  @if (member._id === project()!.owner._id) {
                    <span
                      class="badge badge-in-progress"
                      style="margin-left:.625rem"
                      >Owner</span
                    >
                  }
                </div>
                @if (canManage() && member._id !== project()!.owner._id) {
                  <button
                    class="btn btn-danger btn-sm"
                    (click)="removeMember(member._id)"
                  >
                    Remove
                  </button>
                }
              </div>
            }
          </div>
        </section>

        <section style="margin-top:2.5rem">
          <div
            style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem"
          >
            <h2 style="font-size:1rem;font-weight:600">Tasks</h2>
            <button
              class="btn btn-primary btn-sm"
              (click)="openCreateTask('todo')"
            >
              + New Task
            </button>
          </div>

          @if (taskLoading()) {
            <div class="empty"><p>Loading tasks…</p></div>
          } @else {
            <div class="board">
              <div class="board-col">
                <div class="board-col-header">
                  <span class="board-col-title">To Do</span>
                  <span class="badge badge-todo">{{ todoTasks().length }}</span>
                  <button
                    class="btn btn-outline btn-sm"
                    style="padding:.2rem .6rem"
                    (click)="openCreateTask('todo')"
                  >
                    +
                  </button>
                </div>
                @for (task of todoTasks(); track task._id) {
                  <ng-container
                    *ngTemplateOutlet="taskCard; context: { $implicit: task }"
                  ></ng-container>
                }
                @if (todoTasks().length === 0) {
                  <div class="board-empty">Drop tasks here</div>
                }
              </div>

              <div class="board-col">
                <div class="board-col-header">
                  <span class="board-col-title">In Progress</span>
                  <span class="badge badge-in-progress">{{
                    inProgressTasks().length
                  }}</span>
                  <button
                    class="btn btn-outline btn-sm"
                    style="padding:.2rem .6rem"
                    (click)="openCreateTask('in-progress')"
                  >
                    +
                  </button>
                </div>
                @for (task of inProgressTasks(); track task._id) {
                  <ng-container
                    *ngTemplateOutlet="taskCard; context: { $implicit: task }"
                  ></ng-container>
                }
                @if (inProgressTasks().length === 0) {
                  <div class="board-empty">Nothing in progress</div>
                }
              </div>

              <div class="board-col">
                <div class="board-col-header">
                  <span class="board-col-title">Done</span>
                  <span class="badge badge-done">{{ doneTasks().length }}</span>
                  <button
                    class="btn btn-outline btn-sm"
                    style="padding:.2rem .6rem"
                    (click)="openCreateTask('done')"
                  >
                    +
                  </button>
                </div>
                @for (task of doneTasks(); track task._id) {
                  <ng-container
                    *ngTemplateOutlet="taskCard; context: { $implicit: task }"
                  ></ng-container>
                }
                @if (doneTasks().length === 0) {
                  <div class="board-empty">Completed tasks appear here</div>
                }
              </div>
            </div>
          }
        </section>
      }
    </div>

    <ng-template #taskCard let-task>
      <div class="card task-card" (click)="openEditTask(task)">
        <div
          style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem"
        >
          <div class="task-card-title">{{ task.title }}</div>
          <button
            class="btn btn-danger btn-sm"
            style="flex-shrink:0;padding:.15rem .45rem;font-size:.8rem;line-height:1"
            (click)="deleteTask(task, $event)"
          >
            ×
          </button>
        </div>
        <div class="task-card-meta">
          <span class="badge badge-{{ task.priority }}">{{
            task.priority
          }}</span>
          @if (task.assignee) {
            <span style="font-size:.75rem;color:var(--muted)">{{
              task.assignee.name || task.assignee.email
            }}</span>
          }
          @if (task.dueDate) {
            <span style="font-size:.75rem;color:var(--muted)">{{
              fmtDate(task.dueDate)
            }}</span>
          }
        </div>
      </div>
    </ng-template>

    <app-confirm-dialog
      [open]="!!pendingAction()"
      [title]="pendingAction()?.title ?? ''"
      [message]="pendingAction()?.message ?? ''"
      confirmLabel="Delete"
      (confirmed)="pendingAction()!.action(); pendingAction.set(null)"
      (cancelled)="pendingAction.set(null)"
    />

    @if (showTaskModal()) {
      <div class="modal-overlay" (click)="closeTaskModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">
            {{ editingTask() ? "Edit Task" : "New Task" }}
          </h2>

          <form [formGroup]="taskForm" (ngSubmit)="saveTask()">
            <div class="field">
              <label>Title</label>
              <input
                formControlName="title"
                placeholder="What needs to be done?"
              />
            </div>

            <div class="field">
              <label
                >Description
                <span style="color:var(--muted);font-weight:400"
                  >(optional)</span
                ></label
              >
              <textarea
                formControlName="description"
                placeholder="More details…"
              ></textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="field">
                <label>Status</label>
                <select formControlName="status">
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div class="field">
                <label>Priority</label>
                <select formControlName="priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="field">
                <label
                  >Assignee
                  <span style="color:var(--muted);font-weight:400"
                    >(optional)</span
                  ></label
                >
                <select formControlName="assigneeId">
                  <option value="">Unassigned</option>
                  @for (m of project()!.members; track m._id) {
                    <option [value]="m._id">{{ m.name || m.email }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label
                  >Due Date
                  <span style="color:var(--muted);font-weight:400"
                    >(optional)</span
                  ></label
                >
                <input type="date" formControlName="dueDate" />
              </div>
            </div>

            @if (taskError()) {
              <p class="error-msg">{{ taskError() }}</p>
            }

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline"
                (click)="closeTaskModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="taskForm.invalid || taskSaving()"
              >
                {{
                  taskSaving()
                    ? "Saving…"
                    : editingTask()
                      ? "Save Changes"
                      : "Create Task"
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  auth = inject(AuthService);

  project = signal<Project | null>(null);
  loading = signal(true);
  showAddMember = signal(false);
  addEmail = signal("");
  addLoading = signal(false);
  addError = signal<string | null>(null);

  canManage = computed(() => {
    const p = this.project();
    const u = this.auth.currentUser();
    if (!p || !u) return false;
    return this.auth.isAdmin() || p.owner._id === u.userId;
  });

  pendingAction = signal<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  tasks = signal<Task[]>([]);
  taskLoading = signal(true);
  showTaskModal = signal(false);
  editingTask = signal<Task | null>(null);
  taskSaving = signal(false);
  taskError = signal<string | null>(null);

  todoTasks = computed(() => this.tasks().filter((t) => t.status === "todo"));
  inProgressTasks = computed(() =>
    this.tasks().filter((t) => t.status === "in-progress"),
  );
  doneTasks = computed(() => this.tasks().filter((t) => t.status === "done"));

  taskForm = new FormGroup({
    title: new FormControl("", [Validators.required]),
    description: new FormControl(""),
    status: new FormControl("todo"),
    priority: new FormControl("medium"),
    dueDate: new FormControl(""),
    assigneeId: new FormControl(""),
  });

  private get projectId() {
    return this.route.snapshot.paramMap.get("id")!;
  }

  ngOnInit() {
    this.loadProject();
    this.loadTasks();
  }

  private loadProject() {
    this.projectService.getOne(this.projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loading.set(false);
      },
      error: () => this.router.navigate(["/projects"]),
    });
  }

  addMember() {
    const email = this.addEmail().trim();
    if (!email) return;
    this.addLoading.set(true);
    this.addError.set(null);
    this.projectService.addMember(this.projectId, email).subscribe({
      next: () => {
        this.addEmail.set("");
        this.showAddMember.set(false);
        this.addLoading.set(false);
        this.loadProject();
      },
      error: (err) => {
        this.addError.set(err.error?.message ?? "Failed to add member");
        this.addLoading.set(false);
      },
    });
  }

  removeMember(memberId: string) {
    this.projectService.removeMember(this.projectId, memberId).subscribe({
      next: () => this.loadProject(),
    });
  }

  deleteProject() {
    this.pendingAction.set({
      title: "Delete Project",
      message: `"${this.project()!.name}" and all its tasks will be permanently deleted.`,
      action: () =>
        this.projectService.delete(this.projectId).subscribe({
          next: () => this.router.navigate(["/projects"]),
        }),
    });
  }

  private loadTasks() {
    this.taskLoading.set(true);
    this.taskService.getAll(this.projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.taskLoading.set(false);
      },
      error: () => this.taskLoading.set(false),
    });
  }

  openCreateTask(status: TaskStatus) {
    this.editingTask.set(null);
    this.taskForm.reset({ status, priority: "medium" });
    this.taskError.set(null);
    this.showTaskModal.set(true);
  }

  openEditTask(task: Task) {
    this.editingTask.set(task);
    this.taskForm.setValue({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
      assigneeId: task.assignee?._id ?? "",
    });
    this.taskError.set(null);
    this.showTaskModal.set(true);
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
    this.taskForm.reset();
    this.taskError.set(null);
  }

  saveTask() {
    if (this.taskForm.invalid) return;
    this.taskSaving.set(true);
    this.taskError.set(null);

    const raw = this.taskForm.value;
    const payload: any = {
      title: raw.title,
      description: raw.description || undefined,
      status: raw.status,
      priority: raw.priority,
      dueDate: raw.dueDate || undefined,
      assigneeId: raw.assigneeId || undefined,
    };

    const existing = this.editingTask();
    const call = existing
      ? this.taskService.update(this.projectId, existing._id, payload)
      : this.taskService.create(this.projectId, payload);

    call.subscribe({
      next: (saved) => {
        if (existing) {
          this.tasks.update((list) =>
            list.map((t) => (t._id === saved._id ? saved : t)),
          );
        } else {
          this.tasks.update((list) => [...list, saved]);
        }
        this.closeTaskModal();
        this.taskSaving.set(false);
      },
      error: (err) => {
        this.taskError.set(err.error?.message ?? "Failed to save task");
        this.taskSaving.set(false);
      },
    });
  }

  deleteTask(task: Task, event: Event) {
    event.stopPropagation();
    this.pendingAction.set({
      title: "Delete Task",
      message: `"${task.title}" will be permanently deleted.`,
      action: () =>
        this.taskService.delete(this.projectId, task._id).subscribe({
          next: () =>
            this.tasks.update((list) => list.filter((t) => t._id !== task._id)),
        }),
    });
  }

  fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
