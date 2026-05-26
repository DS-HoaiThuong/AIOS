import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: error?.message || String(error) });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  const { title, description, status, project, priority, tags, dueDate, link } = req.body;
  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'todo',
        project: project || 'Inbox',
        priority: priority || 'medium',
        tags: tags || '[]',
        dueDate: dueDate ? new Date(dueDate) : null,
        link,
      }
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task', details: error?.message || String(error) });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, project, priority, tags, dueDate, link } = req.body;
  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        project,
        priority,
        tags,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        link: link !== undefined ? link : undefined,
      }
    });
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({
      where: { id }
    });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const deleteTasksByProject = async (req: Request, res: Response) => {
  const { projectName } = req.params;
  try {
    const result = await prisma.task.deleteMany({
      where: { project: projectName }
    });
    res.json({ message: `Deleted ${result.count} tasks from project ${projectName}` });
  } catch (error) {
    console.error('Error deleting project tasks:', error);
    res.status(500).json({ error: 'Failed to delete project tasks' });
  }
};
