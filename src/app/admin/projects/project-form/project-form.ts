import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { ProjectService } from '../../../core/services/project';

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
    year: [new Date().getFullYear(), Validators.required],

    serialNo: [
      1,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    title: ['', Validators.required],

    description: ['', Validators.required],

    coverImage: ['', Validators.required],

    slug: ['', Validators.required],

    status: [
      'draft' as 'draft' | 'published' | 'archived',
      Validators.required
    ]
  });


  // =========================
  // INITIALIZE
  // =========================

  ngOnInit(): void {

    this.projectId =
      this.route.snapshot.paramMap.get('id') || '';

    // =========================
    // EDIT PROJECT
    // =========================

    if (this.projectId) {

      this.isEditMode = true;

      const project =
        this.projectService.getProjectById(this.projectId);

      if (!project) {
        this.router.navigate(['/admin/projects']);
        return;
      }

      this.projectForm.patchValue({
        year: project.year,
         serialNo: this.projectService.getNextSerialNo(),
        title: project.title,
        description: project.description,
        coverImage: project.coverImage,
        slug: project.slug,
        status: project.status
      });

      this.imagePreview = project.coverImage;

      // Existing slug should not be regenerated
      this.slugManuallyEdited = true;

      return;
    }

    // =========================
    // ADD PROJECT
    // =========================

    this.projectForm.patchValue({
      serialNo: this.projectService.getNextSerialNo()
    });
  }


  // =========================
  // IMAGE
  // =========================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
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

    if (this.slugManuallyEdited) {
      return;
    }

    const title =
      this.projectForm.controls.title.value;

    if (!title) {
      return;
    }

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


    // ==================================================
    // ADD PROJECT
    // ==================================================

    if (!this.isEditMode) {

      const newSerialNo =
        formValue.serialNo!;

      const newYear =
        formValue.year!;


      // Check for globally duplicate S.No.
      const conflictingProject =
        this.projectService
          .getProjects()
          .find(
            project =>
              project.serialNo === newSerialNo
          );


      // ==================================================
      // S.NO. CONFLICT
      // ==================================================

      if (conflictingProject) {

        const confirmed = confirm(
          `S.No. ${newSerialNo} already belongs to "${conflictingProject.title}".\n\nDo you want to change the order?`
        );


        // User selected NO
        if (!confirmed) {
          return;
        }
      }


      // ==================================================
      // ADD PROJECT
      // ==================================================

      this.projectService.addProject({

        id: 'project-' + Date.now(),

        year: newYear,

        serialNo: newSerialNo,

        title: formValue.title!,

        description: formValue.description!,

        coverImage: formValue.coverImage!,

        slug: formValue.slug!,

        status: formValue.status!

      });


      this.router.navigate([
        '/admin/projects'
      ]);

      return;
    }


    // ==================================================
    // EDIT PROJECT
    // ==================================================

    const existingProject =
      this.projectService.getProjectById(
        this.projectId
      );


    if (!existingProject) {
      return;
    }


    const newSerialNo =
      formValue.serialNo!;


    // ==================================================
    // S.NO. CHANGED
    // ==================================================

    if (
      existingProject.serialNo !== newSerialNo
    ) {

      const conflictingProject =
        this.projectService
          .getProjects()
          .find(
            project =>
              project.id !== this.projectId &&
              project.serialNo === newSerialNo
          );


      // ==================================================
      // S.NO. CONFLICT
      // ==================================================

      if (conflictingProject) {

        const confirmed = confirm(
          `S.No. ${newSerialNo} already belongs to "${conflictingProject.title}".\n\nDo you want to change the order?`
        );


        // User selected NO
        if (!confirmed) {

          this.projectForm.patchValue({
            serialNo: existingProject.serialNo
          });

          return;
        }
      }


      // ==================================================
      // CHANGE SERIAL NUMBER
      // ==================================================

      this.projectService.changeSerialNo(
        this.projectId,
        newSerialNo
      );
    }


    // ==================================================
    // GET UPDATED PROJECT
    // ==================================================

    const currentProject =
      this.projectService.getProjectById(
        this.projectId
      );


    if (!currentProject) {
      return;
    }


    // ==================================================
    // UPDATE PROJECT DETAILS
    // ==================================================

    this.projectService.updateProject({

      ...currentProject,

      year: formValue.year!,

      title: formValue.title!,

      description: formValue.description!,

      coverImage: formValue.coverImage!,

      slug: formValue.slug!,

      status: formValue.status!

    });


    // ==================================================
    // BACK TO PROJECT LIST
    // ==================================================

    this.router.navigate([
      '/admin/projects'
    ]);
  }
}