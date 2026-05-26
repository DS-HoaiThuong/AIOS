import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const habits = await prisma.habit.findMany();
    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, icon } = await req.json();
    const habit = await prisma.habit.create({
      data: {
        title,
        icon: icon || '✨',
        completedDates: '[]'
      }
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
