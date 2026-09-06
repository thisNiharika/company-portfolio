import { Component } from '@angular/core';
import { Project } from '../../core/models/project';
import { PROJECTS } from '../../core/data/project-data';

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects {

  projects: Project[] = PROJECTS;

  get years(): number[] {
    return [...new Set(this.projects.map(project => project.year))]
      .sort((a, b) => b - a);
  }

getProjects(): Project[] {
  return [...this.projects].sort(
    (a, b) => a.serialNo - b.serialNo
  );
}

  scrollToYear(year: number): void {
    const element = document.getElementById(`year-${year}`);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}