import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task, CreateTaskPayload } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/projects`;

  getAll(projectId: string) {
    return this.http.get<Task[]>(`${this.api}/${projectId}/tasks`);
  }
  create(projectId: string, body: CreateTaskPayload) {
    return this.http.post<Task>(`${this.api}/${projectId}/tasks`, body);
  }
  update(projectId: string, taskId: string, body: Partial<CreateTaskPayload>) {
    return this.http.patch<Task>(`${this.api}/${projectId}/tasks/${taskId}`, body);
  }
  delete(projectId: string, taskId: string) {
    return this.http.delete(`${this.api}/${projectId}/tasks/${taskId}`);
  }
  search(q: string, status?: string, priority?: string) {
    const params: Record<string, string> = { q };
    if (status)   params['status']   = status;
    if (priority) params['priority'] = priority;
    return this.http.get<any[]>(`${environment.apiUrl}/search/tasks`, { params });
  }
}
