import api from './api';
import { Project, ProjectsResponse } from '../types';

export const projectService = {
  async getProjects(page = 1, limit = 10, search = ''): Promise<ProjectsResponse> {
    const response = await api.get('/projects', {
      params: { page, limit, search }
    });
    return response.data;
  },

  async getProject(id: string): Promise<{ success: boolean; project: Project }> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(projectData: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  async updateProject(id: string, projectData: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  async deleteProject(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};