import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  FolderOpen,
  AlertCircle,
  X,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { Project } from '../types';

interface ProjectForm {
  title: string;
  description: string;
  status: 'active' | 'completed';
}

const projectSchema = yup.object({
  title: yup.string().required('Title is required').max(100),
  description: yup.string().required('Description is required'),
  status: yup.mixed<'active' | 'completed'>().oneOf(['active', 'completed']).required()
});

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProjectForm>({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      status: 'active'
    }
  });

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects(page, 10, search);
      setProjects(response.projects);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      reset({
        title: project.title,
        description: project.description,
        status: project.status
      });
    } else {
      setSelectedProject(null);
      reset({
        title: '',
        description: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
    reset();
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    
    try {
      await projectService.deleteProject(selectedProject._id);
      setDeleteDialog(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const onSubmit = async (data: ProjectForm) => {
    try {
      if (selectedProject) {
        await projectService.updateProject(selectedProject._id, data);
      } else {
        await projectService.createProject(data);
      }
      handleCloseDialog();
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project');
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle2 className="w-4 h-4 text-green-500" /> 
      : <CheckCircle2 className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              My Projects
            </h1>
            <p className="text-gray-600">
              Manage and track all your projects in one place
            </p>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Projects Found</h3>
            <p className="text-gray-600 mb-6">
              {search ? 'No projects match your search' : "You haven't created any projects yet"}
            </p>
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(project.status)}
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {project.title}
                          </h3>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => navigate(`/projects/${project._id}`)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                      title="View project"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDialog(project)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(project)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Project Statistics */}
        {projects.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <p className="text-2xl font-bold text-gray-800">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
              <p className="text-sm text-gray-600 mb-1">Completed Projects</p>
              <p className="text-2xl font-bold text-gray-800">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        )}

        {/* Project Form Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {selectedProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                <div className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className={`w-full px-4 py-3 border ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                      placeholder="Enter project title"
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
                      rows={4}
                      className={`w-full px-4 py-3 border ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200`}
                      placeholder="Enter project description"
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
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
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
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </span>
                    ) : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Delete Project</h2>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete
                  </p>
                  <p className="font-bold text-indigo-600 text-lg mb-4">
                    "{selectedProject?.title}"
                  </p>
                  <p className="text-sm text-red-600">
                    This action cannot be undone and will delete all associated tasks.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;