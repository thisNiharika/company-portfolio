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
    this.projects = this.projectService.getProjects();
  }


  // =========================
  // ARCHIVE PROJECT
  // =========================

  archiveProject(project: Project): void {

    const confirmed = confirm(
      `Archive "${project.title}"?\n\n` +
      `The project will remain in Admin but will no longer appear on the public website.`
    );

    if (!confirmed) {
      return;
    }

    this.projectService.updateProject({
      ...project,
      status: 'archived'
    });

    this.loadProjects();
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

    this.projectService.deleteProject(project.id);

    this.loadProjects();
  }
}