import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Project from '../models/Project';
import Task from '../models/Task';

// @desc    Get all projects for logged in user
// @route   GET /api/projects
export const getProjects = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    
    const query: any = { user: req.user?._id };
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const projects = await Project.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Project.countDocuments(query);
    
    res.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create project
// @route   POST /api/projects
export const createProject = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, description, status } = req.body;
    
    const project = await Project.create({
      title,
      description,
      status: status || 'active',
      user: req.user?._id
    });
    
    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
export const updateProject = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let project = await Project.findOne({
      _id: req.params.id,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user?._id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete all tasks associated with this project
    await Task.deleteMany({ project: project._id });
    
    await project.deleteOne();
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};