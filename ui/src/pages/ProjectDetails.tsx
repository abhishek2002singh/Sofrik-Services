import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Title as TitleIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { Project, Task } from '../types';

interface TaskForm {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
}

const taskSchema = yup.object({
  title: yup.string().required('Title is required').max(100),
  description: yup.string().required('Description is required'),
  status: yup.mixed<'todo' | 'in-progress' | 'done'>()
    .oneOf(['todo', 'in-progress', 'done'])
    .required(),
  dueDate: yup.string().required('Due date is required')
});

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskForm>({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      status: 'todo'
    }
  });

  useEffect(() => {
    fetchProjectData();
  }, [id, statusFilter]);

  const fetchProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [projectRes, tasksRes] = await Promise.all([
        projectService.getProject(id),
        taskService.getTasks(id, statusFilter)
      ]);
      setProject(projectRes.project);
      setTasks(tasksRes.tasks);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd')
      });
    } else {
      setSelectedTask(null);
      reset({
        title: '',
        description: '',
        status: 'todo',
        dueDate: format(new Date(), 'yyyy-MM-dd')
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
    reset();
  };

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTask) return;
    
    try {
      await taskService.deleteTask(selectedTask._id);
      setDeleteDialog(false);
      setSelectedTask(null);
      fetchProjectData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const onSubmit = async (data: TaskForm) => {
    if (!id) return;
    
    try {
      if (selectedTask) {
        await taskService.updateTask(selectedTask._id, data);
      } else {
        await taskService.createTask(id, data);
      }
      handleCloseDialog();
      fetchProjectData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return '⭕';
      case 'in-progress':
        return '🔄';
      case 'done':
        return '✅';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
            <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ArrowBackIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ArrowBackIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8 transform transition-all duration-300 hover:shadow-3xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {project.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {project.description}
              </p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>Created: {format(new Date(project.createdAt), 'PPP')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {/* Add edit functionality */}}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              >
                <EditIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full sm:w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 cursor-pointer hover:border-gray-400 transition-colors duration-200"
              >
                <option value="">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <FilterIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Add Task Button */}
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <AddIcon className="w-5 h-5 mr-2" />
              Add Task
            </button>
          </div>
        </div>

        {/* Tasks Grid */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tasks Found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter ? `No tasks with status "${statusFilter}"` : "This project doesn't have any tasks yet"}
            </p>
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <AddIcon className="w-5 h-5 mr-2" />
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getStatusIcon(task.status)}</span>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status === 'todo' ? 'To Do' : 
                           task.status === 'in-progress' ? 'In Progress' : 'Done'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 pl-8">
                        {task.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 pl-8">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        <span>Due: {format(new Date(task.dueDate), 'PPP')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:self-center">
                      <button
                        onClick={() => handleOpenDialog(task)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="Edit task"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(task)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete task"
                      >
                        <DeleteIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Task Statistics */}
        {tasks.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
              <p className="text-sm text-gray-600 mb-1">To Do</p>
              <p className="text-2xl font-bold text-gray-800">
                {tasks.filter(t => t.status === 'todo').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-gray-800">
                {tasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {tasks.filter(t => t.status === 'done').length}
              </p>
            </div>
          </div>
        )}

        {/* Task Form Dialog - Using MUI Dialog with Tailwind classes */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            className: "rounded-xl shadow-2xl"
          }}
        >
          <DialogTitle className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xl font-bold py-4">
            {selectedTask ? '✏️ Edit Task' : '➕ Create New Task'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent className="pt-6">
              <div className="space-y-4">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className={`w-full px-4 py-3 border ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                    placeholder="Enter task title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={`w-full px-4 py-3 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                    placeholder="Enter task description"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className={`w-full px-4 py-3 border ${
                      errors.status ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>

                {/* Due Date Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className={`w-full px-4 py-3 border ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                  )}
                </div>
              </div>
            </DialogContent>
            <DialogActions className="p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 ${
                  isSubmitting 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save'}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialog} 
          onClose={() => setDeleteDialog(false)}
          PaperProps={{
            className: "rounded-xl shadow-2xl"
          }}
        >
          <DialogTitle className="text-xl font-bold text-gray-800 border-b border-gray-200">
            Delete Task
          </DialogTitle>
          <DialogContent className="py-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🗑️</div>
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete
              </p>
              <p className="font-bold text-indigo-600 text-lg mb-4">
                "{selectedTask?.title}"
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </DialogContent>
          <DialogActions className="p-6 border-t border-gray-200">
            <button
              onClick={() => setDeleteDialog(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Delete
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default ProjectDetails;