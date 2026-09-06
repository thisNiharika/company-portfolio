import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '../../../core/models/project';
import { ProjectService } from '../../../core/services/project';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList {

  private projectService = inject(ProjectService);

  projects: Project[] = [];

  ngOnInit(): void {
    this.projects = this.projectService.getProjects();
  }

}