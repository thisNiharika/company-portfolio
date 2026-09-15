import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { RouteStaggerDirective } from '../../core/shared/directives/route-stagger.directive';

import { Project } from '../../core/models/project';
import { ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-projects',
  imports: [
    RouteStaggerDirective
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})

export class Projects implements OnInit {

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  projects: Project[] = [];

  ngOnInit(): void {
    this.loadProjects();
  }

   readonly routeTransition = inject(RouteTransitionService);
  goTo(url: string, event: MouseEvent): void {
    void this.routeTransition.navigate(url, event);
  }

  // =========================
  // LOAD PUBLISHED PROJECTS
  // =========================

 loadProjects(): void {

  this.projectService
    .getProjects()
    .subscribe({
      next: (projects) => {

        console.log('PROJECTS FROM API:', projects);

        this.projects = projects.filter(
          project =>
            project.status === 'published'
        );

        console.log(
          'PROJECTS AFTER FILTER:',
          this.projects
        );

        console.log(
          'YEARS:',
          this.years
        );

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Failed to load projects:',
          error
        );
      }
    });
}

  // =========================
  // YEARS
  // =========================

  get years(): number[] {

    return [
      ...new Set(
        this.projects.map(
          project => project.year
        )
      )
    ].sort(
      (a, b) => b - a
    );
  }

  // =========================
  // PROJECTS BY YEAR
  // =========================

  getProjectsByYear(
    year: number
  ): Project[] {

    return this.projects
      .filter(
        project =>
          project.year === year
      )
      .sort(
        (a, b) =>
          a.serialNo - b.serialNo
      );
  }

  // =========================
  // SCROLL TO YEAR
  // =========================

  scrollToYear(
    year: number
  ): void {

    const element =
      document.getElementById(
        `year-${year}`
      );

    if (element) {

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }
  }
}