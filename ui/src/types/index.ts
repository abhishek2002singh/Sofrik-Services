export interface User {
  id: string;
  email: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
  project: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ProjectsResponse {
  success: boolean;
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TasksResponse {
  success: boolean;
  tasks: Task[];
}