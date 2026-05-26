import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks', details: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, status, project, priority, tags, dueDate, link } = await req.json();
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
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task', details: error?.message }, { status: 500 });
  }
}
