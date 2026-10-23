import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import {
  Router,
  ActivatedRoute
} from '@angular/router';

import {
  concatMap,
  from,
  of
} from 'rxjs';

import { ProjectService } from '../../../core/services/project';
import { Project } from '../../../core/models/project';


@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './project-form.html',
  styleUrl: './project-form.css'
})
export class ProjectForm implements OnInit {

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  imagePreview = '';
  slugManuallyEdited = false;
  loadingProjects = false;
  isEditMode = false;
  projectId = '';

  saving = false;

  successMessage = '';
  errorMessage = '';

  /*
   * S.No. conflict modal
   */
  showOrderModal = false;

  conflictingProject: Project | null = null;
  requestedSerialNo = 0;

  /*
   * Existing projects
   */
  projects: Project[] = [];


  /*
   * FORM
   */
  projectForm = this.fb.group({

    year: [
      new Date().getFullYear(),
      Validators.required
    ],

    serialNo: [
      1,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    title: [
      '',
      Validators.required
    ],

    description: [
      '',
      Validators.required
    ],

    coverImage: [
      '',
      Validators.required
    ],

    slug: [
      '',
      Validators.required
    ],

    status: [
      'draft' as 'draft' | 'published',
      Validators.required
    ]

  });


  // =====================================================
  // INIT
  // =====================================================

    ngOnInit(): void {

      this.projectId =
        this.route.snapshot.paramMap.get('id') || '';

      if (this.projectId) {

        this.isEditMode = true;

        this.loadProject();

        return;
      }

      // ADD MODE
      this.loadingProjects = true;

      this.loadProjectsForAdd();
    }

  // =====================================================
  // LOAD PROJECT FOR EDIT
  // =====================================================

  private loadProject(): void {

    this.projectService
      .getProjectById(this.projectId)
      .subscribe({

        next: (project) => {

          this.projectForm.patchValue({

            year: project.year,

            serialNo: project.serialNo,

            title: project.title,

            description:
              project.description,

            coverImage:
              project.coverImage,

            slug:
              project.slug,

            status:
              project.status

          });

          this.imagePreview =
            project.coverImage;

          this.slugManuallyEdited = true;
        },

        error: (error) => {

          console.error(
            'Failed to load project:',
            error
          );

          this.errorMessage =
            'Failed to load project.';

        }

      });

  }


 private loadProjectsForAdd(): void {

  this.loadingProjects = true;

  this.projectService
    .getProjects()
    .subscribe({

      next: (projects) => {

        console.log(
          'PROJECTS FOR ADD:',
          projects
        );

        this.projects = [...projects];

        console.table(
          this.projects.map(project => ({
            title: project.title,
            serialNo: project.serialNo,
            year: project.year
          }))
        );

        const nextSerialNo =
          this.projects.length > 0
            ? Math.max(
                ...this.projects.map(
                  project =>
                    Number(project.serialNo) || 0
                )
              ) + 1
            : 1;

        console.log(
          'NEXT S.NO:',
          nextSerialNo
        );

        this.projectForm.patchValue({
          serialNo: nextSerialNo
        });

        this.loadingProjects = false;

        // Force the UI to update
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Failed to load projects:',
          error
        );

        this.loadingProjects = false;

        this.errorMessage =
          'Failed to load existing projects.';

        this.cdr.detectChanges();
      }

    });
}

  // =====================================================
  // NEXT S.NO.
  // =====================================================

  private getNextSerialNo(): number {

    if (!this.projects.length) {
      return 1;
    }

    const serialNumbers =
      this.projects.map(
        project =>
          Number(project.serialNo) || 0
      );

    return Math.max(
      ...serialNumbers
    ) + 1;

  }


  // =====================================================
  // FILE UPLOAD
  // =====================================================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }


    const file =
      input.files[0];


    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage =
        'Please select an image file.';

      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      const imageData =
        reader.result as string;

      this.imagePreview =
        imageData;

      this.projectForm.patchValue({

        coverImage:
          imageData

      });

      this.projectForm.controls
        .coverImage
        .markAsTouched();

    };


    reader.readAsDataURL(file);

  }


  // =====================================================
  // SLUG
  // =====================================================

  generateSlug(): void {

    if (this.slugManuallyEdited) {
      return;
    }

    const title =
      this.projectForm.controls
        .title.value;

    if (!title) {
      return;
    }

    const slug =
      title
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9\s-]/g,
          ''
        )
        .replace(
          /\s+/g,
          '-'
        )
        .replace(
          /-+/g,
          '-'
        );

    this.projectForm.controls
      .slug
      .setValue(slug);

  }


  onSlugEdit(): void {

    this.slugManuallyEdited = true;

  }


  // =====================================================
  // SAVE PROJECT
  // =====================================================

  saveProject(): void {

    /*
     * Prevent double submission
     */
    if (this.saving) {
      return;
    }


    /*
     * Validate form
     */
    if (this.projectForm.invalid) {

      this.projectForm.markAllAsTouched();

      this.errorMessage =
        'Please complete all required fields.';

      return;
    }


    this.clearMessages();


    const formValue =
      this.projectForm.getRawValue();


    const newSerialNo =
      Number(formValue.serialNo);


    // ===================================================
    // ADD
    // ===================================================

    if (!this.isEditMode) {

      const newProject:
        Omit<Project, 'id'> = {

        year:
          Number(formValue.year),

        serialNo:
          newSerialNo,

        title:
          formValue.title!.trim(),

        description:
          formValue.description!.trim(),

        coverImage:
          formValue.coverImage!,

        slug:
          formValue.slug!.trim(),

        status:
          formValue.status!

      };


      /*
       * Refresh project list before checking
       * S.No. so we always use the latest data.
       */
      this.projectService
        .getProjects()
        .subscribe({

          next: (projects) => {

            this.projects =
              [...projects];


            const conflictingProject =
              this.projects.find(
                project =>
                  Number(project.serialNo) ===
                  newSerialNo
              );


            /*
             * S.No. is already being used.
             */
            if (conflictingProject) {

              this.requestedSerialNo =
                newSerialNo;

              this.conflictingProject =
                conflictingProject;

              this.showOrderModal =
                true;

              return;
            }


            /*
             * No conflict.
             * Create normally.
             */
            this.createProject(
              newProject
            );

          },

          error: (error) => {

            console.error(
              'Failed to check S.No.:',
              error
            );

            this.errorMessage =
              'Failed to check project order.';

          }

        });

      return;
    }


    // ===================================================
    // EDIT
    // ===================================================

    this.updateExistingProject(
      formValue
    );

  }


  // =====================================================
  // CREATE PROJECT
  // =====================================================

  private createProject(
    newProject: Omit<Project, 'id'>
  ): void {

    this.saving = true;

    this.clearMessages();


    this.projectService
      .addProject(newProject)
      .subscribe({

        next: (createdProject) => {

          console.log(
            'PROJECT CREATED SUCCESSFULLY:',
            createdProject
          );


          /*
           * IMPORTANT:
           * The API successfully created the project.
           *
           * Show success instead of an alert.
           */
          this.saving = false;

          this.successMessage =
            'Project added successfully.';


          /*
           * Redirect after showing success.
           */
          setTimeout(() => {

            this.router.navigate([
              '/admin/projects'
            ]);

          }, 700);

        },

        error: (error) => {

          console.error(
            'Failed to create project:',
            error
          );

          this.saving = false;

          this.errorMessage =
            error?.error?.message ||
            'Failed to create project.';

        }

      });

  }


  // =====================================================
  // CONFIRM S.NO. CHANGE
  // =====================================================

  confirmOrderChange(): void {

    if (!this.conflictingProject) {
      return;
    }


    const newSerialNo =
      this.requestedSerialNo;


    /*
     * Projects at or after the requested
     * position need to move down.
     *
     * IMPORTANT:
     * Highest S.No. is updated first.
     *
     * Example:
     *
     * 1 A
     * 2 B
     * 3 C
     *
     * New project wants 2.
     *
     * C: 3 -> 4
     * B: 2 -> 3
     * New: 2
     */
    const projectsToShift =
      this.projects
        .filter(
          project =>
            Number(project.serialNo) >=
            newSerialNo
        )
        .sort(
          (a, b) =>
            Number(b.serialNo) -
            Number(a.serialNo)
        );


    const formValue =
      this.projectForm.getRawValue();


    const newProject:
      Omit<Project, 'id'> = {

      year:
        Number(formValue.year),

      serialNo:
        newSerialNo,

      title:
        formValue.title!.trim(),

      description:
        formValue.description!.trim(),

      coverImage:
        formValue.coverImage!,

      slug:
        formValue.slug!.trim(),

      status:
        formValue.status!

    };


    this.showOrderModal =
      false;

    this.conflictingProject =
      null;


    this.saving = true;

    this.clearMessages();


    /*
     * Shift projects one by one.
     *
     * concatMap guarantees that the
     * updates happen in order.
     */
    from(projectsToShift)
      .pipe(

        concatMap(project => {

          const shiftedProject:
            Project = {

            ...project,

            serialNo:
              Number(project.serialNo) + 1

          };


          return this.projectService
            .updateProject(
              shiftedProject
            );

        })

      )
      .subscribe({

        next: () => {

          /*
           * Nothing else here.
           *
           * Creation happens after ALL
           * projects have shifted.
           */
        },

        complete: () => {

          /*
           * Now the requested S.No.
           * is available.
           */
          this.projectService
            .addProject(newProject)
            .subscribe({

              next: (createdProject) => {

                console.log(
                  'PROJECT CREATED AFTER ORDER CHANGE:',
                  createdProject
                );


                this.saving = false;

                this.successMessage =
                  'Project added successfully.';


                setTimeout(() => {

                  this.router.navigate([
                    '/admin/projects'
                  ]);

                }, 700);

              },

              error: (error) => {

                console.error(
                  'Failed to create project after order change:',
                  error
                );

                this.saving = false;

                this.errorMessage =
                  error?.error?.message ||
                  'Failed to create project.';

              }

            });

        },

        error: (error) => {
          console.error('Reordering failed:', {
            status: error.status,
            message: error.message,
            response: error.error,
            url: error.url
          });

          this.saving = false;
          this.errorMessage =
            error?.error?.message ||
            'Failed to change project order.';
        }

      });

  }


  // =====================================================
  // CANCEL ORDER MODAL
  // =====================================================

  cancelOrderChange(): void {

    this.showOrderModal =
      false;

    this.conflictingProject =
      null;

    /*
     * Restore the next available S.No.
     */
    this.projectForm.patchValue({

      serialNo:
        this.getNextSerialNo()

    });

  }


  // =====================================================
  // UPDATE PROJECT
  // =====================================================

  private updateExistingProject(
    formValue: any
  ): void {

    this.saving = true;

    this.clearMessages();


    this.projectService
      .getProjectById(this.projectId)
      .subscribe({

        next: (existingProject) => {

          const oldSerialNo =
            Number(existingProject.serialNo);

          const newSerialNo =
            Number(formValue.serialNo);


          /*
           * S.No. has not changed.
           */
          if (
            oldSerialNo ===
            newSerialNo
          ) {

            this.sendUpdate(
              existingProject
            );

            return;
          }


          /*
           * S.No. has changed.
           *
           * Get latest projects before
           * checking for conflict.
           */
          this.projectService
            .getProjects()
            .subscribe({

              next: (projects) => {

                this.projects =
                  [...projects];


                const conflictingProject =
                  projects.find(
                    project =>
                      project.id !==
                      this.projectId &&
                      Number(project.serialNo) ===
                      newSerialNo
                  );


                /*
                 * Conflict exists.
                 */
                if (conflictingProject) {

                  this.saving = false;

                  this.requestedSerialNo =
                    newSerialNo;

                  this.conflictingProject =
                    conflictingProject;

                  this.showOrderModal =
                    true;

                  return;
                }


                /*
                 * No conflict.
                 */
                this.sendUpdate(
                  existingProject
                );

              },

              error: (error) => {

                console.error(
                  'Failed to check S.No.:',
                  error
                );

                this.saving = false;

                this.errorMessage =
                  'Failed to check project order.';

              }

            });

        },

        error: (error) => {

          console.error(
            'Failed to load project:',
            error
          );

          this.saving = false;

          this.errorMessage =
            'Failed to load project.';

        }

      });

  }


  // =====================================================
  // SEND UPDATE
  // =====================================================

  private sendUpdate(
    existingProject: Project
  ): void {

    const formValue =
      this.projectForm.getRawValue();


    const oldSerialNo =
      Number(existingProject.serialNo);

    const newSerialNo =
      Number(formValue.serialNo);


    /*
     * If S.No. changed, reorder the other
     * projects first.
     */
    if (
      oldSerialNo !==
      newSerialNo
    ) {

      this.reorderForEdit(
        existingProject,
        newSerialNo
      );

      return;
    }


    /*
     * Normal update.
     */
    const updatedProject:
      Project = {

      ...existingProject,

      year:
        Number(formValue.year),

      serialNo:
        newSerialNo,

      title:
        formValue.title!.trim(),

      description:
        formValue.description!.trim(),

      coverImage:
        formValue.coverImage!,

      slug:
        formValue.slug!.trim(),

      status:
        formValue.status!

    };


    this.projectService
      .updateProject(updatedProject)
      .subscribe({

        next: () => {

          this.saving = false;

          this.successMessage =
            'Project updated successfully.';


          setTimeout(() => {

            this.router.navigate([
              '/admin/projects'
            ]);

          }, 700);

        },

        error: (error) => {

          console.error(
            'Failed to update project:',
            error
          );

          this.saving = false;

          this.errorMessage =
            error?.error?.message ||
            'Failed to update project.';

        }

      });

  }


  // =====================================================
  // REORDER WHEN EDITING
  // =====================================================
private getTemporarySerialNo(): number {

  const highest =
    this.projects.length
      ? Math.max(
          ...this.projects.map(
            project =>
              Number(project.serialNo) || 0
          )
        )
      : 0;

  return highest + 100000;
}

private finaliseMovedProject(
  existingProject: Project,
  newSerialNo: number,
  formValue: any
): void {

  const updatedProject: Project = {

    ...existingProject,

    year:
      Number(formValue.year),

    serialNo:
      newSerialNo,

    title:
      formValue.title!.trim(),

    description:
      formValue.description!.trim(),

    coverImage:
      formValue.coverImage!,

    slug:
      formValue.slug!.trim(),

    status:
      formValue.status!

  };


  this.projectService
    .updateProject(updatedProject)
    .subscribe({

      next: () => {

        this.saving = false;

        this.successMessage =
          'Project updated successfully.';

        setTimeout(() => {

          this.router.navigate([
            '/admin/projects'
          ]);

        }, 700);

      },

      error: (error) => {

        console.error(
          'Failed to update project:',
          error
        );

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Failed to update project.';

      }

    });
}

private sendNormalUpdate(
  existingProject: Project
): void {

  const formValue =
    this.projectForm.getRawValue();

  const updatedProject: Project = {

    ...existingProject,

    year:
      Number(formValue.year),

    serialNo:
      Number(formValue.serialNo),

    title:
      formValue.title!.trim(),

    description:
      formValue.description!.trim(),

    coverImage:
      formValue.coverImage!,

    slug:
      formValue.slug!.trim(),

    status:
      formValue.status!

  };

  this.projectService
    .updateProject(updatedProject)
    .subscribe({

      next: () => {

        this.saving = false;

        this.successMessage =
          'Project updated successfully.';

        setTimeout(() => {

          this.router.navigate([
            '/admin/projects'
          ]);

        }, 700);

      },

      error: (error) => {

        console.error(
          'Failed to update project:',
          error
        );

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Failed to update project.';

      }

    });
}


private moveProjectDown(
  existingProject: Project,
  newSerialNo: number,
  oldSerialNo: number,
  formValue: any
): void {

  const affectedProjects =
    this.projects
      .filter(
        project =>
          project.id !== existingProject.id &&
          Number(project.serialNo) > oldSerialNo &&
          Number(project.serialNo) <= newSerialNo
      )
      .sort(
        (a, b) =>
          Number(a.serialNo) -
          Number(b.serialNo)
      );


  /*
   * Example:
   *
   * A = 1
   * B = 2
   * C = 3
   *
   * A moves to 3
   *
   * B -> 1
   * C -> 2
   *
   * Update from lowest to highest.
   */
  from(affectedProjects)
    .pipe(

      concatMap(project => {

        return this.projectService
          .updateProject({

            ...project,

            serialNo:
              Number(project.serialNo) - 1

          });

      })

    )
    .subscribe({

      complete: () => {

        this.finaliseMovedProject(
          existingProject,
          newSerialNo,
          formValue
        );

      },

      error: (error) => {

        console.error(
          'Failed to move projects:',
          error
        );

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Failed to change project order.';

      }

    });
}

private moveProjectUp(
  existingProject: Project,
  newSerialNo: number,
  oldSerialNo: number,
  formValue: any
): void {

  const affectedProjects =
    this.projects
      .filter(
        project =>
          project.id !== existingProject.id &&
          Number(project.serialNo) >= newSerialNo &&
          Number(project.serialNo) < oldSerialNo
      )
      .sort(
        (a, b) =>
          Number(b.serialNo) -
          Number(a.serialNo)
      );


  /*
   * Example:
   *
   * A = 1
   * B = 2
   * C = 3
   *
   * C moves to 1
   *
   * B -> 3
   * A -> 2
   *
   * Update from highest to lowest.
   */
  from(affectedProjects)
    .pipe(

      concatMap(project => {

        return this.projectService
          .updateProject({

            ...project,

            serialNo:
              Number(project.serialNo) + 1

          });

      })

    )
    .subscribe({

      complete: () => {

        this.finaliseMovedProject(
          existingProject,
          newSerialNo,
          formValue
        );

      },

      error: (error) => {

        console.error(
          'Failed to move projects:',
          error
        );

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Failed to change project order.';

      }

    });
}

private reorderForEdit(
  existingProject: Project,
  newSerialNo: number
): void {

  const oldSerialNo =
    Number(existingProject.serialNo);

  if (oldSerialNo === newSerialNo) {
    this.sendNormalUpdate(existingProject);
    return;
  }

  const formValue =
    this.projectForm.getRawValue();

  this.saving = true;
  this.clearMessages();

  /*
   * Temporarily move the edited project
   * outside the normal S.No. sequence.
   *
   * This is necessary because serialNo is
   * unique in MongoDB.
   */
  const temporarySerialNo =
    this.getTemporarySerialNo();


  this.projectService
    .updateProject({

      ...existingProject,

      serialNo: temporarySerialNo

    })
    .subscribe({

      next: () => {

        /*
         * MOVING UP
         *
         * Example:
         *
         * 1 A
         * 2 B
         * 3 C
         *
         * C -> 1
         *
         * B: 2 -> 3
         * A: 1 -> 2
         *
         * Because the edited project is already
         * temporarily removed, there is no
         * unique-number collision.
         */
        if (newSerialNo < oldSerialNo) {

          this.moveProjectUp(
            existingProject,
            newSerialNo,
            oldSerialNo,
            formValue
          );

          return;
        }


        /*
         * MOVING DOWN
         *
         * Example:
         *
         * 1 A
         * 2 B
         * 3 C
         *
         * A -> 3
         *
         * C: 3 -> 2
         * B: 2 -> 1
         */
        this.moveProjectDown(
          existingProject,
          newSerialNo,
          oldSerialNo,
          formValue
        );

      },

      error: (error) => {

        console.error(
          'Failed to temporarily move project:',
          error
        );

        this.saving = false;

        this.errorMessage =
          error?.error?.message ||
          'Failed to change project order.';

      }

    });
}

  // =====================================================
  // UPDATE MOVED PROJECT
  // =====================================================

  private updateMovedProject(
    existingProject: Project,
    newSerialNo: number
  ): void {

    const formValue =
      this.projectForm.getRawValue();


    const updatedProject:
      Project = {

      ...existingProject,

      year:
        Number(formValue.year),

      serialNo:
        newSerialNo,

      title:
        formValue.title!.trim(),

      description:
        formValue.description!.trim(),

      coverImage:
        formValue.coverImage!,

      slug:
        formValue.slug!.trim(),

      status:
        formValue.status!

    };


    this.projectService
      .updateProject(updatedProject)
      .subscribe({

        next: () => {

          this.saving = false;

          this.successMessage =
            'Project updated successfully.';


          setTimeout(() => {

            this.router.navigate([
              '/admin/projects'
            ]);

          }, 700);

        },

        error: (error) => {

          console.error(
            'Failed to update moved project:',
            error
          );

          this.saving = false;

          this.errorMessage =
            error?.error?.message ||
            'Failed to update project.';

        }

      });

  }


  // =====================================================
  // CLOSE / CANCEL
  // =====================================================

  cancel(): void {

    if (this.saving) {
      return;
    }

    this.router.navigate([
      '/admin/projects'
    ]);

  }


  // =====================================================
  // CLEAR MESSAGES
  // =====================================================

  private clearMessages(): void {

    this.successMessage = '';
    this.errorMessage = '';

  }
  onSerialNoChange(): void {
  if (this.isEditMode) {
    return;
  }

  this.clearMessages();

  const serialNo =
    Number(this.projectForm.controls.serialNo.value);

  if (!serialNo || serialNo < 1) {
    return;
  }

  const existingProject =
    this.projects.find(
      project =>
        Number(project.serialNo) === serialNo
    );

  if (!existingProject) {
    return;
  }

  this.requestedSerialNo = serialNo;
  this.conflictingProject = existingProject;
  this.showOrderModal = true;
}



}