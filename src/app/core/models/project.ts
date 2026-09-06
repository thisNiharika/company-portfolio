export interface Project {
  id: string;
  year: number;
  serialNo: number;
  title: string;
  description: string;
  coverImage: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
}