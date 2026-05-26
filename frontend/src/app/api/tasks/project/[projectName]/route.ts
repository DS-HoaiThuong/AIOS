import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ projectName: string }> }) {
  const { projectName } = await params;
  try {
    const decodedName = decodeURIComponent(projectName);
    const result = await prisma.task.deleteMany({
      where: { project: decodedName }
    });
    return NextResponse.json({ message: `Deleted ${result.count} tasks from project ${decodedName}` });
  } catch (error) {
    console.error('Error deleting project tasks:', error);
    return NextResponse.json({ error: 'Failed to delete project tasks' }, { status: 500 });
  }
}
