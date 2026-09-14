import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/projects';


  // =========================
  // GET ALL PROJECTS
  // =========================

getProjects(): Observable<Project[]> {
  return this.http
    .get<any[]>(this.apiUrl)
    .pipe(
      map(projects =>
        projects.map(project => ({
          ...project,
          id: project._id
        }))
      )
    );
}


  // =========================
  // GET PROJECT
  // =========================

  getProjectById(
    id: string
  ): Observable<Project> {
    return this.http.get<Project>(
      `${this.apiUrl}/${id}`
    );
  }


  // =========================
  // ADD PROJECT
  // =========================

  addProject(
    project: Omit<Project, 'id'>
  ): Observable<Project> {

    return this.http.post<Project>(
      this.apiUrl,
      project
    );
  }


  // =========================
  // UPDATE PROJECT
  // =========================

  updateProject(
    project: Project
  ): Observable<Project> {

    return this.http.patch<Project>(
      `${this.apiUrl}/${project.id}`,
      {
        year: project.year,
        serialNo: project.serialNo,
        title: project.title,
        description: project.description,
        coverImage: project.coverImage,
        slug: project.slug,
        status: project.status
      }
    );
  }


  // =========================
  // DELETE PROJECT
  // =========================

  deleteProject(
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}