import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // format: YYYY-MM

    const where: any = {};
    if (month) {
      where.month = month;
    }

    const items = await prisma.budgetItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch budget items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, amount, type, month, isRecurring, category } = await req.json();
    
    if (!title || !amount || !type || !month) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.budgetItem.create({
      data: {
        title,
        amount: parseFloat(amount),
        type,
        month,
        isRecurring: isRecurring || false,
        category: category || 'Khác',
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create budget item' }, { status: 500 });
  }
}
