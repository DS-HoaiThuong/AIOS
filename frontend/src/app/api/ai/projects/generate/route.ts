import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

export async function POST(req: Request) {
  try {
    const { goal, projectName } = await req.json();
    if (!goal || !projectName) {
      return NextResponse.json({ error: 'goal and projectName are required' }, { status: 400 });
    }

    const prompt = `You are an expert Project Manager. Break down the following project goal into a Work Breakdown Structure (WBS).

Project: "${projectName}"
Goal: "${goal}"

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "projectSummary": "A 1-sentence summary of what this project involves",
  "tasks": [
    {
      "title": "Short action-oriented task title",
      "description": "Brief 1-2 sentence description",
      "priority": "high",
      "estimatedDays": 3
    }
  ]
}

Rules:
- Generate between 5 and 8 tasks
- priority must be exactly one of: "high", "medium", "low"
- Prioritize logically: research/setup first, execution second, review/launch last
- estimatedDays is an integer number of days
- All text content (projectSummary, title, description) MUST be written in Vietnamese
- Output raw JSON only, no explanation`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let parsed: any;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini JSON:', raw);
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 });
    }

    const tasksToCreate = (parsed.tasks || []).map((t: any) => ({
      title: t.title || 'Untitled Task',
      description: t.description || '',
      status: 'todo',
      project: projectName,
      priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
      tags: '[]',
      dueDate: t.estimatedDays
        ? new Date(Date.now() + Number(t.estimatedDays) * 24 * 60 * 60 * 1000)
        : null,
    }));

    await prisma.task.createMany({ data: tasksToCreate });

    const createdTasks = await prisma.task.findMany({
      where: { project: projectName, status: 'todo' },
      orderBy: { createdAt: 'asc' },
      take: tasksToCreate.length,
    });

    return NextResponse.json({
      projectSummary: parsed.projectSummary || '',
      tasks: createdTasks,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Gemini Error (generateProjectTasks):', error?.message || error);
    return NextResponse.json({ error: 'Failed to generate project tasks' }, { status: 500 });
  }
}
