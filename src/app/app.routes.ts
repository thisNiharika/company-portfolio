import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // PUBLIC
  {
    path: 'home',
    loadComponent: () =>
      import('./public/home/home').then(m => m.Home)
  },

  {
    path: 'projects',
    loadComponent: () =>
      import('./public/projects/projects').then(m => m.Projects)
  },

  // ADMIN
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/login').then(m => m.Login)
  },

  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./admin/dashboard/dashboard').then(m => m.Dashboard)
  },

  {
    path: 'admin/projects',
    loadComponent: () =>
      import('./admin/projects/project-list/project-list')
        .then(m => m.ProjectList)
  },

  {
    path: 'admin/projects/new',
    loadComponent: () =>
      import('./admin/projects/project-form/project-form')
        .then(m => m.ProjectForm)
  },

  {
    path: 'admin/projects/:id/builder',
    loadComponent: () =>
      import('./admin/projects/project-builder/project-builder')
        .then(m => m.ProjectBuilder)
  },

  {
  path: 'admin/projects/:id/edit',
  loadComponent: () =>
    import('./admin/projects/project-form/project-form')
      .then(m => m.ProjectForm)
},

  {
    path: '**',
    redirectTo: 'home'
  }

];