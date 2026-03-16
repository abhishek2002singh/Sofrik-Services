import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
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
    reset({ title: '', description: '', status: 'todo', dueDate: format(new Date(), 'yyyy-MM-dd') });
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
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading project details...</Typography>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container>
        <Alert severity="error">Project not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description}
            </Typography>
          </Box>
          <Chip
            label={project.status}
            color={project.status === 'active' ? 'success' : 'default'}
            size="large"
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Task
        </Button>
      </Box>

      <FormControl sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel>Filter by Status</InputLabel>
        <Select
          value={statusFilter}
          label="Filter by Status"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="todo">To Do</MenuItem>
          <MenuItem value="in-progress">In Progress</MenuItem>
          <MenuItem value="done">Done</MenuItem>
        </Select>
      </FormControl>

      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid item xs={12} key={task._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{task.title}</Typography>
                  <Chip
                    label={getStatusLabel(task.status)}
                    size="small"
                    color={getStatusColor(task.status)}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {task.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Due: {format(new Date(task.dueDate), 'PPP')}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(task)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(task)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Task Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={3}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <TextField
              fullWidth
              select
              label="Status"
              margin="normal"
              defaultValue="todo"
              {...register('status')}
              error={!!errors.status}
              helperText={errors.status?.message}
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
              {...register('dueDate')}
              error={!!errors.dueDate}
              helperText={errors.dueDate?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTask?.title}"? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetails;