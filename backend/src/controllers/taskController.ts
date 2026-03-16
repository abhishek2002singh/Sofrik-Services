import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { status } = req.query;
    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    
    // Check if project belongs to user
    const project = await Project.findOne({
      _id: projectObjectId,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const query: any = { project: projectObjectId };
    
    if (status) {
      query.status = status;
    }
    
    const tasks = await Task.find(query).sort({ dueDate: 1 });
    
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
export const createTask = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const projectId = req.params.projectId as string;
    const { title, description, status, dueDate } = req.body;
    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    
    // Check if project belongs to user
    const project = await Project.findOne({
      _id: projectObjectId,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      dueDate,
      project: projectObjectId
    });
    
    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
export const updateTask = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const task = await Task.findById(req.params.id).populate('project');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task's project belongs to user
    const project = await Project.findOne({
      _id: task.project,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task's project belongs to user
    const project = await Project.findOne({
      _id: task.project,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await task.deleteOne();
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};