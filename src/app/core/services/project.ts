import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Project } from '../models/project';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://company-portfolio-api.onrender.com/projects';

  getProjects(): Observable<Project[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(projects => projects.map(project => ({ ...project, id: project._id ?? project.id })))
    );
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(project => ({ ...project, id: project._id ?? project.id }))
    );
  }

  addProject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<any>(this.apiUrl, project).pipe(
      map(created => ({ ...created, id: created._id ?? created.id }))
    );
  }

  updateProject(project: Project): Observable<Project> {
    return this.http.patch<any>(`${this.apiUrl}/${project.id}`, {
      year: Number(project.year),
      serialNo: Number(project.serialNo),
      title: project.title,
      description: project.description,
      coverImage: project.coverImage,
      slug: project.slug,
      status: project.status
    }).pipe(
      map(updated => ({ ...updated, id: updated._id ?? updated.id }))
    );
  }

  reorderProject(id: string, project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reorder`, project).pipe(
      map(result => ({ ...result, id: result._id ?? result.id }))
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}