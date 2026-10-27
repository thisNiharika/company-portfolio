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

import { finalize } from 'rxjs';

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

  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly router = inject(Router);

  imagePreview = '';
  slugManuallyEdited = false;
  loadingProjects = false;
  isEditMode = false;
  projectId = '';
  saving = false;

  successMessage = '';
  errorMessage = '';

  // Retained for compatibility with the existing HTML template.
  showOrderModal = false;
  conflictingProject: Project | null = null;
  requestedSerialNo = 0;

  projects: Project[] = [];

  projectForm = this.fb.group({
    year: [
      new Date().getFullYear(),
      [
        Validators.required,
        Validators.min(1)
      ]
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

  ngOnInit(): void {
    this.projectId =
      this.route.snapshot.paramMap.get('id') || '';

    this.isEditMode = !!this.projectId;

    if (this.isEditMode) {
      this.loadProject();
    } else {
      this.loadProjectsForAdd();
    }
  }

  // --------------------------------------------------
  // LOAD PROJECT FOR EDIT
  // --------------------------------------------------

  private loadProject(): void {
    this.loadingProjects = true;
    this.clearMessages();

    this.projectService
      .getProjectById(this.projectId)
      .pipe(
        finalize(() => {
          this.loadingProjects = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (project) => {
          this.projectForm.patchValue({
            year: Number(project.year),
            serialNo: Number(project.serialNo),
            title: project.title,
            description: project.description,
            coverImage: project.coverImage,
            slug: project.slug,
            status: project.status
          });

          this.imagePreview = project.coverImage || '';
          this.slugManuallyEdited = true;
        },

        error: (error) => {
          console.error('Failed to load project:', error);

          this.errorMessage =
            error?.error?.message ||
            'Failed to load project. Please try again.';
        }
      });
  }

  // --------------------------------------------------
  // LOAD PROJECTS FOR ADD
  // --------------------------------------------------

  private loadProjectsForAdd(): void {
    this.loadingProjects = true;

    this.projectService
      .getProjects()
      .pipe(
        finalize(() => {
          this.loadingProjects = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (projects) => {
          this.projects = [...projects];

          const nextSerialNo = this.getNextSerialNo();

          this.projectForm.patchValue({
            serialNo: nextSerialNo
          });
        },

        error: (error) => {
          console.error('Failed to load projects:', error);

          this.errorMessage =
            'Could not load existing projects. You can retry by reopening the form.';
        }
      });
  }

  // --------------------------------------------------
  // NEXT SERIAL NUMBER
  // --------------------------------------------------

  private getNextSerialNo(): number {
    if (!this.projects.length) {
      return 1;
    }

    const serialNumbers = this.projects
      .map(project => Number(project.serialNo))
      .filter(serialNo => Number.isFinite(serialNo) && serialNo > 0);

    if (!serialNumbers.length) {
      return 1;
    }

    return Math.max(...serialNumbers) + 1;
  }

  // --------------------------------------------------
  // IMAGE UPLOAD
  // --------------------------------------------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    this.clearMessages();

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      this.imagePreview = imageData;

      this.projectForm.controls.coverImage.setValue(imageData);
      this.projectForm.controls.coverImage.markAsTouched();
      this.projectForm.controls.coverImage.updateValueAndValidity();

      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.errorMessage = 'Failed to read the selected image.';
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // --------------------------------------------------
  // SLUG
  // --------------------------------------------------

  generateSlug(): void {
    if (this.slugManuallyEdited) {
      return;
    }

    const title = this.projectForm.controls.title.value || '';

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

  // --------------------------------------------------
  // SAVE PROJECT
  // --------------------------------------------------

  saveProject(): void {
    console.log('SAVE BUTTON CLICKED');

    if (this.saving) {
      console.warn('Save blocked: request already in progress.');
      return;
    }

    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();

      this.errorMessage =
        'Please complete all required fields before saving.';

      console.error('Form validation failed:', {
        values: this.projectForm.getRawValue(),
        invalidFields: Object.keys(this.projectForm.controls)
          .filter(
            key =>
              this.projectForm.controls[
                key as keyof typeof this.projectForm.controls
              ].invalid
          )
      });

      return;
    }

    const formValue = this.projectForm.getRawValue();
    const serialNo = Number(formValue.serialNo);
    const year = Number(formValue.year);

    if (
      !Number.isInteger(serialNo) ||
      serialNo < 1
    ) {
      this.projectForm.controls.serialNo.setErrors({
        invalidSerialNo: true
      });

      this.errorMessage = 'S.No. must be a positive whole number.';
      return;
    }

    if (!Number.isInteger(year) || year < 1) {
      this.errorMessage = 'Please enter a valid year.';
      return;
    }

    const projectData: Omit<Project, 'id'> = {
      year,
      serialNo,
      title: (formValue.title || '').trim(),
      description: (formValue.description || '').trim(),
      coverImage: formValue.coverImage || '',
      slug: (formValue.slug || '').trim(),
      status: formValue.status || 'draft'
    };

    this.clearMessages();
    this.showOrderModal = false;
    this.conflictingProject = null;
    this.saving = true;

    if (this.isEditMode) {
      this.updateProject(projectData);
    } else {
      this.createProject(projectData);
    }
  }

  // --------------------------------------------------
  // ADD PROJECT
  // --------------------------------------------------

  private createProject(
    projectData: Omit<Project, 'id'>
  ): void {
    this.projectService
      .addProject(projectData)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (createdProject) => {
          console.log('PROJECT CREATED SUCCESSFULLY:', createdProject);

          this.successMessage = 'Project added successfully.';

          setTimeout(() => {
            this.router.navigate(['/admin/projects']);
          }, 700);
        },

        error: (error) => {
          console.error('Failed to create project:', error);

          this.errorMessage =
            this.getErrorMessage(error, 'Failed to add project.');
        }
      });
  }

  // --------------------------------------------------
  // EDIT PROJECT
  // --------------------------------------------------

  private updateProject(
    projectData: Omit<Project, 'id'>
  ): void {
    const updatedProject: Project = {
      ...projectData,
      id: this.projectId
    };

    this.projectService
      .updateProject(updatedProject)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (savedProject) => {
          console.log('PROJECT UPDATED SUCCESSFULLY:', savedProject);

          this.successMessage = 'Project updated successfully.';

          setTimeout(() => {
            this.router.navigate(['/admin/projects']);
          }, 700);
        },

        error: (error) => {
          console.error('Failed to update project:', error);

          this.errorMessage =
            this.getErrorMessage(error, 'Failed to update project.');
        }
      });
  }

  // --------------------------------------------------
  // LEGACY ORDER-MODAL COMPATIBILITY
  // The backend now handles shifting S.No. values.
  // --------------------------------------------------

  onSerialNoChange(): void {
    this.clearMessages();

    // Do not shift projects from the frontend.
    // The backend handles insertion and reordering.
    this.showOrderModal = false;
    this.conflictingProject = null;
  }

  confirmOrderChange(): void {
    // Close any stale modal and use the normal save flow.
    this.showOrderModal = false;
    this.conflictingProject = null;

    this.saveProject();
  }

  cancelOrderChange(): void {
    this.showOrderModal = false;
    this.conflictingProject = null;

    if (!this.isEditMode) {
      this.projectForm.patchValue({
        serialNo: this.getNextSerialNo()
      });
    }
  }

  // --------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------

  private getErrorMessage(
    error: any,
    fallback: string
  ): string {
    const message = error?.error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error?.status === 0) {
      return 'Could not connect to the server. Please try again.';
    }

    return fallback;
  }

  // --------------------------------------------------
  // CANCEL
  // --------------------------------------------------

  cancel(): void {
    if (this.saving) {
      return;
    }

    this.router.navigate(['/admin/projects']);
  }

  // --------------------------------------------------
  // CLEAR MESSAGES
  // --------------------------------------------------

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}