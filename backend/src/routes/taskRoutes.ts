import express from 'express';
import { body } from 'express-validator';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/taskController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect); // All task routes require authentication

router
  .route('/projects/:projectId/tasks')
  .get(getTasks)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('dueDate').isISO8601().withMessage('Valid due date is required'),
      body('status').optional().isIn(['todo', 'in-progress', 'done'])
    ],
    createTask
  );

router
  .route('/tasks/:id')
  .put(
    [
      body('title').optional().notEmpty(),
      body('description').optional().notEmpty(),
      body('dueDate').optional().isISO8601(),
      body('status').optional().isIn(['todo', 'in-progress', 'done'])
    ],
    updateTask
  )
  .delete(deleteTask);

export default router;