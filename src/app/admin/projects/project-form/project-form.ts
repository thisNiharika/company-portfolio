import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { ProjectService } from '../../../core/services/project';
import { Project } from '../../../core/models/project';

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule],
  templateUrl: './project-form.html',
  styleUrl: './project-form.css'
})
export class ProjectForm implements OnInit {

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);

  router = inject(Router);

  imagePreview = '';
  slugManuallyEdited = false;

  isEditMode = false;
  projectId = '';

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


  // =========================
  // INIT
  // =========================

  ngOnInit(): void {

    this.projectId =
      this.route.snapshot.paramMap.get('id') || '';

    // EDIT MODE
    if (this.projectId) {

      this.isEditMode = true;

      this.projectService
        .getProjectById(this.projectId)
        .subscribe({
          next: (project) => {

            this.projectForm.patchValue({
              year: project.year,
              serialNo: project.serialNo,
              title: project.title,
              description: project.description,
              coverImage: project.coverImage,
              slug: project.slug,
              status: project.status
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

            this.router.navigate([
              '/admin/projects'
            ]);
          }
        });

      return;
    }

    // ADD MODE
    this.projectService
      .getProjects()
      .subscribe({
        next: (projects) => {

          const nextSerialNo =
            projects.length === 0
              ? 1
              : Math.max(
                  ...projects.map(
                    project => project.serialNo
                  )
                ) + 1;

          this.projectForm.patchValue({
            serialNo: nextSerialNo
          });
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
  // FILE UPLOAD
  // =========================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {

      alert(
        'Please select an image file.'
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      const imageData =
        reader.result as string;

      this.imagePreview = imageData;

      this.projectForm.patchValue({
        coverImage: imageData
      });
    };

    reader.readAsDataURL(file);
  }


  // =========================
  // SLUG
  // =========================

generateSlug(): void {
  if (this.slugManuallyEdited) return;

  const title = this.projectForm.controls.title.value;
  if (!title) return;

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  this.projectForm.controls.slug.setValue(slug);
}


  onSlugEdit(): void {

    this.slugManuallyEdited = true;
  }


  // =========================
  // SAVE PROJECT
  // =========================

  saveProject(): void {

    if (this.projectForm.invalid) {

      this.projectForm.markAllAsTouched();

      return;
    }

    const formValue =
      this.projectForm.getRawValue();


    // =========================
    // ADD
    // =========================

    if (!this.isEditMode) {

      const newSerialNo =
        formValue.serialNo!;

      const newProject: Omit<Project, 'id'> = {

        year: formValue.year!,

        serialNo: newSerialNo,

        title: formValue.title!,

        description:
          formValue.description!,

        coverImage:
          formValue.coverImage!,

        slug: formValue.slug!,

        status:
          formValue.status!
      };


      // Check global S.No. conflict
      this.projectService
        .getProjects()
        .subscribe({

          next: (projects) => {

            const conflictingProject =
              projects.find(
                project =>
                  project.serialNo ===
                  newSerialNo
              );


            if (conflictingProject) {

              const confirmed = confirm(
                `S.No. ${newSerialNo} already belongs to "${conflictingProject.title}".\n\n` +
                `Do you want to change the order?`
              );

              if (!confirmed) {
                return;
              }
            }


            this.projectService
              .addProject(newProject)
              .subscribe({

                next: () => {

                  this.router.navigate([
                    '/admin/projects'
                  ]);
                },

                error: (error) => {

                  console.error(
                    'Failed to create project:',
                    error
                  );

                  alert(
                    'Failed to create project.'
                  );
                }
              });
          },

          error: (error) => {

            console.error(
              'Failed to check S.No.:',
              error
            );

            alert(
              'Failed to check project order.'
            );
          }
        });

      return;
    }


    // =========================
    // EDIT
    // =========================

    this.projectService
      .getProjectById(this.projectId)
      .subscribe({

        next: (existingProject) => {

          const newSerialNo =
            formValue.serialNo!;


          // S.No. changed
          if (
            existingProject.serialNo !==
            newSerialNo
          ) {

            this.projectService
              .getProjects()
              .subscribe({

                next: (projects) => {

                  const conflictingProject =
                    projects.find(
                      project =>
                        project.id !==
                          this.projectId &&
                        project.serialNo ===
                          newSerialNo
                    );


                  if (conflictingProject) {

                    const confirmed =
                      confirm(
                        `S.No. ${newSerialNo} already belongs to "${conflictingProject.title}".\n\n` +
                        `Do you want to change the order?`
                      );

                    if (!confirmed) {

                      this.projectForm.patchValue({
                        serialNo:
                          existingProject.serialNo
                      });

                      return;
                    }
                  }


                  this.sendUpdate(
                    existingProject
                  );
                },

                error: (error) => {

                  console.error(
                    'Failed to check S.No.:',
                    error
                  );

                  alert(
                    'Failed to check project order.'
                  );
                }
              });

            return;
          }


          // S.No. unchanged
          this.sendUpdate(
            existingProject
          );
        },

        error: (error) => {

          console.error(
            'Failed to load project:',
            error
          );

          alert(
            'Failed to load project.'
          );
        }
      });
  }


  // =========================
  // SEND UPDATE
  // =========================

  private sendUpdate(
    existingProject: Project
  ): void {

    const formValue =
      this.projectForm.getRawValue();

    const updatedProject: Project = {

      ...existingProject,

      year:
        formValue.year!,

      serialNo:
        formValue.serialNo!,

      title:
        formValue.title!,

      description:
        formValue.description!,

      coverImage:
        formValue.coverImage!,

      slug:
        formValue.slug!,

      status:
        formValue.status!
    };


    this.projectService
      .updateProject(updatedProject)
      .subscribe({

        next: () => {

          this.router.navigate([
            '/admin/projects'
          ]);
        },

        error: (error) => {

          console.error(
            'Failed to update project:',
            error
          );

          alert(
            'Failed to update project.'
          );
        }
      });
  }
} 