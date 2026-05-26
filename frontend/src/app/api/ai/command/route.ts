import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text command is required' }, { status: 400 });
    }

    const prompt = `You are an AI assistant for a personal OS app. The user just spoke a command via voice in Vietnamese: "${text}"
Your job is to parse this command and determine the intent.
Currently supported intents: "CREATE_PROJECT_WITH_TASKS" or "UNKNOWN".
If the user wants to create a project with some specific tasks and schedule, extract the data.

Respond ONLY with a valid JSON object in this exact format:
{
  "intent": "CREATE_PROJECT_WITH_TASKS",
  "data": {
    "projectName": "Name of the project",
    "tasks": [
      {
        "title": "Task title",
        "description": "Task description (if any)",
        "priority": "high",
        "dueDateDays": 3
      }
    ]
  },
  "message": "A friendly Vietnamese message summarizing what you are doing"
}

If the command is unclear or not supported, return:
{
  "intent": "UNKNOWN",
  "message": "Xin lỗi, tôi chưa hiểu lệnh của bạn hoặc tính năng này chưa được hỗ trợ."
}

Rules:
- Respond ONLY with raw JSON, no markdown formatting or code fences.`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let parsed: any;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini JSON:', raw);
      return NextResponse.json({ error: 'AI returned invalid JSON.' }, { status: 500 });
    }

    if (parsed.intent === 'CREATE_PROJECT_WITH_TASKS' && parsed.data) {
      const { projectName, tasks } = parsed.data;
      const tasksToCreate = (tasks || []).map((t: any) => ({
        title: t.title || 'Untitled Task',
        description: t.description || '',
        status: 'todo',
        project: projectName || 'General',
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        tags: '[]',
        dueDate: t.dueDateDays
          ? new Date(Date.now() + Number(t.dueDateDays) * 24 * 60 * 60 * 1000)
          : null,
      }));

      if (tasksToCreate.length > 0) {
        await prisma.task.createMany({ data: tasksToCreate });
      }

      const createdTasks = await prisma.task.findMany({
        where: { project: projectName || 'General', status: 'todo' },
        orderBy: { createdAt: 'desc' },
        take: tasksToCreate.length > 0 ? tasksToCreate.length : undefined,
      });

      return NextResponse.json({
        success: true,
        intent: parsed.intent,
        message: parsed.message,
        data: {
          project: projectName,
          tasks: createdTasks
        }
      });
    }

    // Default response for UNKNOWN or other
    return NextResponse.json({
      success: true,
      intent: parsed.intent,
      message: parsed.message || 'Lệnh đã được xử lý.'
    });
  } catch (error: any) {
    console.error('Gemini Error (processVoiceCommand):', error?.message || error);
    return NextResponse.json({ error: 'Failed to process voice command' }, { status: 500 });
  }
}
