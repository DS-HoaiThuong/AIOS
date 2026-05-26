import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const subs = await prisma.subscription.findMany();
    return NextResponse.json(subs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, amount, billingCycle, icon } = await req.json();
    const sub = await prisma.subscription.create({
      data: {
        title,
        amount: parseFloat(amount),
        billingCycle,
        icon: icon || 'terminal'
      }
    });
    return NextResponse.json(sub, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
