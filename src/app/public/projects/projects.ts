import { Component, inject, OnInit } from '@angular/core';

import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements OnInit {

  private projectService = inject(ProjectService);

  projects: Project[] = [];

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projects = this.projectService
      .getProjects()
      .filter(project => project.status === 'published');
  }

  get years(): number[] {
    return [
      ...new Set(
        this.projects.map(project => project.year)
      )
    ].sort((a, b) => b - a);
  }

  getProjectsByYear(year: number): Project[] {
    return this.projects
      .filter(project => project.year === year)
      .sort((a, b) => a.serialNo - b.serialNo);
  }
getProjects(): Project[] {
  return [...this.projects].sort(
    (a, b) => a.serialNo - b.serialNo
  );
}

  scrollToYear(year: number): void {
    const element =
      document.getElementById(`year-${year}`);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}