import express from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect); // All project routes require authentication

router
  .route('/')
  .get(getProjects)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('status').optional().isIn(['active', 'completed'])
    ],
    createProject
  );

router
  .route('/:id')
  .get(getProject)
  .put(
    [
      body('title').optional().notEmpty(),
      body('description').optional().notEmpty(),
      body('status').optional().isIn(['active', 'completed'])
    ],
    updateProject
  )
  .delete(deleteProject);

export default router;