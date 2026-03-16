import api from './api';
import { Task, TasksResponse } from '../types';

export const taskService = {
  async getTasks(projectId: string, status?: string): Promise<TasksResponse> {
    const response = await api.get(`/projects/${projectId}/tasks`, {
      params: { status }
    });
    return response.data;
  },

  async createTask(projectId: string, taskData: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};