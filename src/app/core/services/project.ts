import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { PROJECTS } from '../data/project-data';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private projects: Project[] = [...PROJECTS];


  // =========================
  // GET ALL PROJECTS
  // =========================

  getProjects(): Project[] {
    return [...this.projects].sort(
      (a, b) => a.serialNo - b.serialNo
    );
  }


  // =========================
  // GET PROJECT
  // =========================

  getProjectById(id: string): Project | undefined {
    return this.projects.find(
      project => project.id === id
    );
  }


  // =========================
  // NEXT S.NO.
  // =========================

  getNextSerialNo(): number {

    if (this.projects.length === 0) {
      return 1;
    }

    return Math.max(
      ...this.projects.map(
        project => project.serialNo
      )
    ) + 1;
  }


  // =========================
  // ADD PROJECT
  // =========================

  addProject(project: Project): void {

    const serialNo = Math.max(
      1,
      Math.min(
        project.serialNo,
        this.projects.length + 1
      )
    );


    // Move existing projects forward
    for (const existingProject of this.projects) {

      if (existingProject.serialNo >= serialNo) {
        existingProject.serialNo++;
      }
    }


    project.serialNo = serialNo;

    this.projects.push(project);

    this.normalizeSerialNumbers();
  }


  // =========================
  // CHANGE S.NO.
  // =========================

  changeSerialNo(
    projectId: string,
    newSerialNo: number
  ): void {

    const project =
      this.projects.find(
        p => p.id === projectId
      );

    if (!project) {
      return;
    }


    const oldSerialNo =
      project.serialNo;


    if (oldSerialNo === newSerialNo) {
      return;
    }


    // Moving UP
    if (newSerialNo < oldSerialNo) {

      for (const existingProject of this.projects) {

        if (
          existingProject.id !== projectId &&
          existingProject.serialNo >= newSerialNo &&
          existingProject.serialNo < oldSerialNo
        ) {
          existingProject.serialNo++;
        }
      }
    }


    // Moving DOWN
    else {

      for (const existingProject of this.projects) {

        if (
          existingProject.id !== projectId &&
          existingProject.serialNo > oldSerialNo &&
          existingProject.serialNo <= newSerialNo
        ) {
          existingProject.serialNo--;
        }
      }
    }


    project.serialNo = newSerialNo;

    this.normalizeSerialNumbers();
  }


  // =========================
  // UPDATE PROJECT
  // =========================

  updateProject(project: Project): void {

    const index =
      this.projects.findIndex(
        p => p.id === project.id
      );

    if (index !== -1) {
      this.projects[index] = project;
    }
  }


  // =========================
  // DELETE PROJECT
  // =========================

  deleteProject(id: string): void {

    this.projects =
      this.projects.filter(
        project => project.id !== id
      );

    this.normalizeSerialNumbers();
  }


  // =========================
  // NORMALIZE
  // =========================

  private normalizeSerialNumbers(): void {

    this.projects.sort(
      (a, b) => a.serialNo - b.serialNo
    );

    this.projects.forEach(
      (project, index) => {
        project.serialNo = index + 1;
      }
    );
  }
}