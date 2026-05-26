import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const getLocalDateKey = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().split('T')[0];
};

export async function GET() {
  try {
    const today = getLocalDateKey();
    const log = await prisma.healthLog.findUnique({ where: { date: today } });
    return NextResponse.json(log || { date: today, sleepHours: null, waterGlasses: 0, exercised: false, energyLevel: null, notes: null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch health log' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const today = getLocalDateKey();
    const { sleepHours, waterGlasses, exercised, energyLevel, notes } = await req.json();

    const log = await prisma.healthLog.upsert({
      where: { date: today },
      update: {
        ...(sleepHours !== undefined && { sleepHours: parseFloat(sleepHours) || null }),
        ...(waterGlasses !== undefined && { waterGlasses: parseInt(waterGlasses) || 0 }),
        ...(exercised !== undefined && { exercised: Boolean(exercised) }),
        ...(energyLevel !== undefined && { energyLevel: parseInt(energyLevel) || null }),
        ...(notes !== undefined && { notes }),
      },
      create: {
        date: today,
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        waterGlasses: waterGlasses ? parseInt(waterGlasses) : 0,
        exercised: exercised || false,
        energyLevel: energyLevel ? parseInt(energyLevel) : null,
        notes: notes || null
      }
    });
    return NextResponse.json(log);
  } catch (error) {
    console.error('Health upsert error:', error);
    return NextResponse.json({ error: 'Failed to update health log' }, { status: 500 });
  }
}
