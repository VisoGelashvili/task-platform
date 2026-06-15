import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/projects`;

  // The auth interceptor automatically adds the Bearer token — no manual headers needed here.
  getAll()                  { return this.http.get<Project[]>(this.api); }
  getOne(id: string)        { return this.http.get<Project>(`${this.api}/${id}`); }
  create(body: { name: string; description?: string }) {
    return this.http.post<Project>(this.api, body);
  }
  delete(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }
  addMember(projectId: string, email: string) {
    return this.http.post(`${this.api}/${projectId}/members`, { email });
  }
  removeMember(projectId: string, memberId: string) {
    return this.http.delete(`${this.api}/${projectId}/members/${memberId}`);
  }
}
