import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '../../../core/models/project';
import { ProjectService } from '../../../core/services/project';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList implements OnInit {

  private projectService = inject(ProjectService);

  projects: Project[] = [];

  ngOnInit(): void {
    this.loadProjects();
  }

  // =========================
  // LOAD PROJECTS
  // =========================

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Failed to load projects:', error);
      }
    });
  }

  // =========================
  // DELETE PROJECT
  // =========================

  deleteProject(project: Project): void {

    const confirmed = confirm(
      `Delete "${project.title}" permanently?\n\n` +
      `This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.projectService
      .deleteProject(project.id)
      .subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (error) => {
          console.error('Failed to delete project:', error);
          alert('Failed to delete project.');
        }
      });
  }
}