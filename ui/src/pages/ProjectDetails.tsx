import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  Users,
  Tag,
  FileText,
  Layout,
  Grid,
  List,
  X,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // For password field if needed

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'todo':
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-gray-200',
          text: 'text-gray-700',
          border: 'border-gray-300',
          icon: Circle,
          iconColor: 'text-gray-500',
          label: 'To Do'
        };
      case 'in-progress':
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-amber-200',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: Loader2,
          iconColor: 'text-yellow-600',
          label: 'In Progress'
        };
      case 'done':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-200',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          label: 'Done'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: Circle,
          iconColor: 'text-gray-500',
          label: status
        };
    }
  };

  const getProjectStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-200',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: TrendingUp,
          label: 'Active'
        };
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-indigo-200',
          text: 'text-blue-800',
          border: 'border-blue-300',
          icon: CheckCircle2,
          label: 'Completed'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: Circle,
          label: status
        };
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    progress: calculateProgress()
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading project details...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-center">
            <div className="relative">
              <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h2>
              <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projectStatus = getProjectStatusConfig(project.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="group mb-6 inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-xl hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Project Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 transform transition-all duration-300 hover:shadow-2xl border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Layout className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <div className={`w-4 h-4 rounded-full ${project.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                      {project.title}
                    </h1>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${projectStatus.bg} ${projectStatus.text} ${projectStatus.border} shadow-sm`}>
                      <projectStatus.icon className="w-4 h-4 mr-1.5" />
                      {projectStatus.label}
                    </span>
                  </div>
                  <p className="text-gray-600 text-lg mt-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>
              
              {/* Project Meta Info */}
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  <span>Created: {format(new Date(project.createdAt), 'PPP')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Target className="w-4 h-4 mr-1.5" />
                  <span>Progress: {stats.progress}%</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1.5" />
                  <span>Team: 5 members</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors duration-200 border border-gray-200"
              >
                {darkMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {/* Add edit functionality */}}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors duration-200 border border-gray-200"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-indigo-600">{stats.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500 relative"
                style={{ width: `${stats.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Total Tasks', 
              value: stats.total, 
              icon: FileText, 
              color: 'from-blue-500 to-cyan-500',
              bgColor: 'from-blue-50 to-cyan-50',
              textColor: 'text-blue-600'
            },
            { 
              label: 'To Do', 
              value: stats.todo, 
              icon: Circle, 
              color: 'from-gray-500 to-slate-500',
              bgColor: 'from-gray-50 to-slate-50',
              textColor: 'text-gray-600'
            },
            { 
              label: 'In Progress', 
              value: stats.inProgress, 
              icon: Loader2, 
              color: 'from-yellow-500 to-amber-500',
              bgColor: 'from-yellow-50 to-amber-50',
              textColor: 'text-yellow-600'
            },
            { 
              label: 'Completed', 
              value: stats.done, 
              icon: CheckCircle2, 
              color: 'from-green-500 to-emerald-500',
              bgColor: 'from-green-50 to-emerald-50',
              textColor: 'text-green-600'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
            <p className="text-gray-600 mt-1">Manage and track your project tasks</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* View Toggle */}
            <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-xl hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm border border-gray-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-fadeIn">
                  {['', 'todo', 'in-progress', 'done'].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setStatusFilter(value);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 ${
                        statusFilter === value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      {value === '' ? 'All Tasks' : 
                       value === 'todo' ? 'To Do' :
                       value === 'in-progress' ? 'In Progress' : 'Done'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Task Button */}
            <button
              onClick={() => handleOpenDialog()}
              className="group relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <Plus className="w-5 h-5 mr-2" />
              Add Task
            </button>
          </div>
        </div>

        {/* Tasks Grid/List */}
        {tasks.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <FileText className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {statusFilter 
                  ? `No tasks with status "${statusFilter === 'todo' ? 'To Do' : statusFilter === 'in-progress' ? 'In Progress' : 'Done'}"` 
                  : "This project doesn't have any tasks yet. Create your first task to get started!"}
              </p>
              <button
                onClick={() => handleOpenDialog()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Task
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => {
              const status = getStatusConfig(task.status);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={task._id}
                  className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${status.bg}`}>
                          <StatusIcon className={`w-5 h-5 ${status.iconColor} ${task.status === 'in-progress' ? 'animate-spin' : ''}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {task.title}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-medium">
                          JD
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-medium">
                          AS
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleOpenDialog(task)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(task)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignees</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => {
                    const status = getStatusConfig(task.status);
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr
                        key={task._id}
                        className="hover:bg-gray-50/50 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${status.bg} mr-3`}>
                              <StatusIcon className={`w-4 h-4 ${status.iconColor} ${task.status === 'in-progress' ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {task.title}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {task.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-medium">
                              JD
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-medium">
                              AS
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenDialog(task)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors duration-200 mr-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {openDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center">
                  {selectedTask ? (
                    <>
                      <Edit2 className="w-5 h-5 mr-2" />
                      Edit Task
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create New Task
                    </>
                  )}
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="text-white/80 hover:text-white transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                <div className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        {...register('title')}
                        className={`w-full pl-10 pr-4 py-3 border ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                        placeholder="Enter task title"
                      />
                    </div>
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
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
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
                        errors.status ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white`}
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
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        {...register('dueDate')}
                        className={`w-full pl-10 pr-4 py-3 border ${
                          errors.dueDate ? 'border-red-500' : 'border-gray-300'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                      />
                    </div>
                    {errors.dueDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 ${
                      isSubmitting 
                        ? 'bg-indigo-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    } text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : 'Save Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Delete Task</h2>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete
                  </p>
                  <p className="font-bold text-indigo-600 text-lg mb-4">
                    "{selectedTask?.title}"
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteDialog(false)}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;