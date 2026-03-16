import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing data');

    // Create test user
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const user = await User.create({
      email: 'test@example.com',
      password: hashedPassword
    });
    console.log('Created test user: test@example.com');

    // Create projects
    const projects = await Project.create([
      {
        title: 'E-commerce Website Development',
        description: 'Build a full-stack e-commerce platform with React and Node.js',
        status: 'active',
        user: user._id
      },
      {
        title: 'Mobile App Design',
        description: 'Design UI/UX for fitness tracking mobile application',
        status: 'completed',
        user: user._id
      }
    ]);
    console.log('Created 2 projects');

    // Create tasks for first project
    await Task.create([
      {
        title: 'Setup project repository',
        description: 'Initialize Git repository and project structure',
        status: 'done',
        dueDate: new Date('2024-01-15'),
        project: projects[0]._id
      },
      {
        title: 'Design database schema',
        description: 'Create MongoDB schema for users, products, and orders',
        status: 'in-progress',
        dueDate: new Date('2024-01-20'),
        project: projects[0]._id
      },
      {
        title: 'Implement authentication',
        description: 'Add JWT-based authentication for users',
        status: 'todo',
        dueDate: new Date('2024-01-25'),
        project: projects[0]._id
      }
    ]);

    // Create tasks for second project
    await Task.create([
      {
        title: 'Create wireframes',
        description: 'Design low-fidelity wireframes for main screens',
        status: 'done',
        dueDate: new Date('2023-12-10'),
        project: projects[1]._id
      },
      {
        title: 'Design color scheme',
        description: 'Choose color palette and typography',
        status: 'done',
        dueDate: new Date('2023-12-15'),
        project: projects[1]._id
      },
      {
        title: 'Create high-fidelity mockups',
        description: 'Design final UI mockups in Figma',
        status: 'done',
        dueDate: new Date('2023-12-20'),
        project: projects[1]._id
      }
    ]);

    console.log('Created 6 tasks (3 per project)');
    console.log('Database seeding completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();