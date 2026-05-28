import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const updated = await prisma.spendingJar.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating jar:', error);
    return NextResponse.json({ error: 'Failed to update spending jar', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.spendingJar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting jar:', error);
    return NextResponse.json({ error: 'Failed to delete spending jar', details: error?.message }, { status: 500 });
  }
}
