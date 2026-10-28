import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProjectService } from '../../../core/services/project';
import { Project } from '../../../core/models/project';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectListComponent implements OnInit {

  private projectService = inject(ProjectService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  projects: Project[] = [];

  loading = false;

  error = '';

  openMenuId: string | null = null;

  deleteModalOpen = false;

  selectedProject: Project | null = null;


  ngOnInit(): void {
    this.loadProjects();
  }


  loadProjects(): void {

    this.loading = true;
    this.error = '';

    this.projectService
      .getProjects()
      .subscribe({

        next: (projects) => {

          this.zone.run(() => {

            this.projects = [...projects].sort(
              (a, b) =>
                a.serialNo - b.serialNo
            );

            this.loading = false;

            this.cdr.detectChanges();

          });

        },

        error: (err) => {

          console.error(
            'PROJECT API ERROR:',
            err
          );

          this.zone.run(() => {

            this.projects = [];

            this.loading = false;

            this.error =
              err?.error?.message ||
              'Unable to load projects.';

            this.cdr.detectChanges();

          });

        }

      });

  }


  addProject(): void {

    this.router.navigate([
      '/admin/projects/new'
    ]);

  }


  editProject(project: Project): void {

    this.openMenuId = null;

    this.router.navigate([
      '/admin/projects',
      project.id,
      'edit'
    ]);

  }


  viewProject(project: Project): void {

    this.openMenuId = null;

    this.router.navigate([
      '/projects',
      project.slug
    ]);

  }


  toggleMenu(id: string): void {

    this.openMenuId =
      this.openMenuId === id
        ? null
        : id;

  }


  duplicateProject(project: Project): void {

    this.openMenuId = null;

    /*
     * We'll connect this to the
     * create-project flow after
     * the duplicate behaviour
     * is defined.
     */

    console.log(
      'Duplicate project:',
      project
    );

  }


  openDeleteModal(project: Project): void {

    this.openMenuId = null;

    this.selectedProject = project;

    this.deleteModalOpen = true;

  }


  closeDeleteModal(): void {

    this.deleteModalOpen = false;

    this.selectedProject = null;

  }


  archiveProject(): void {

    if (!this.selectedProject) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Your current backend does not
     * support archived projects yet.
     *
     * Do not delete the project here.
     *
     * We'll connect this after adding
     * `archived` to the backend model.
     */

    console.log(
      'Archive requested:',
      this.selectedProject
    );

    alert(
      'Archive functionality needs to be enabled in the API first.'
    );

  }


  permanentDeleteProject(): void {

    if (!this.selectedProject) {
      return;
    }

    const project =
      this.selectedProject;


    this.projectService
      .deleteProject(project.id)
      .subscribe({

        next: () => {

          this.closeDeleteModal();

          this.loadProjects();

        },

        error: (err) => {

          console.error(
            'DELETE ERROR:',
            err
          );

          alert(
            err?.error?.message ||
            'Failed to delete project.'
          );

        }

      });

  }
editProjectPage(project: Project): void {
  this.openMenuId = null;

  this.router.navigate([
    '/admin/projects',
    project.id,
    'edit-page'
  ]);
}


}