import { Project } from '../models/project';

export const PROJECTS: Project[] = [
  {
    id: 'project-1',
    year: 2026,
    serialNo: 4,
    title: 'Project A',
    description: 'Description for Project A',
    coverImage: 'assets/images/project-a.jpg',
    slug: 'project-a',
    status: 'published'
  },

  {
    id: 'project-2',
    year: 2025,
    serialNo: 3,
    title: 'Project B',
    description: 'Description for Project B',
    coverImage: 'assets/images/project-b.jpg',
    slug: 'project-b',
    status: 'published'
  },

  {
    id: 'project-3',
    year: 2026,
    serialNo: 5,
    title: 'Project C',
    description: 'Description for Project C',
    coverImage: 'assets/images/project-c.jpg',
    slug: 'project-c',
    status: 'published'
  },

  {
    id: 'project-4',
    year: 2025,
    serialNo: 1,
    title: 'Project D',
    description: 'Description for Project D',
    coverImage: 'assets/images/project-d.jpg',
    slug: 'project-d',
    status: 'published'
  },

  {
    id: 'project-5',
    year: 2025,
    serialNo: 2,
    title: 'Project E',
    description: 'Description for Project E',
    coverImage: 'assets/images/project-e.jpg',
    slug: 'project-e',
    status: 'published'
  }
];