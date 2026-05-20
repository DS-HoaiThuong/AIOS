import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

// Lazy init — đảm bảo env đã load trước khi dùng key
const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

export const summarizeJournal = async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const model = getGemini();
    const prompt = `You are an empathetic AI. Summarize the following journal entry in 1-2 short sentences, extracting the core emotion and main event:\n\n${content}`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text() || 'Unable to generate summary.';
    res.json({ summary });
  } catch (error: any) {
    console.error('Gemini Error (summarizeJournal):', error?.message || error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

export const autoScheduleTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: 'todo' },
      select: { id: true, title: true, priority: true }
    });

    if (tasks.length === 0) {
      return res.json({ message: 'No tasks to schedule.', suggestions: [] });
    }

    const prompt = `Given the following list of tasks, suggest an optimal order to tackle them today based on their priority.
Return ONLY a valid JSON object in this format: { "suggestions": [ { "id": "...", "reason": "5-word reason" } ] }
Tasks: ${JSON.stringify(tasks)}`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let suggestions = [];
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      suggestions = parsed.suggestions || parsed || [];
    } catch (e) {
      suggestions = [];
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Gemini Error (autoScheduleTasks):', error?.message || error);
    res.status(500).json({ error: 'Failed to auto-schedule tasks' });
  }
};

export const generateProjectTasks = async (req: Request, res: Response) => {
  const { goal, projectName } = req.body;
  if (!goal || !projectName) {
    return res.status(400).json({ error: 'goal and projectName are required' });
  }

  try {
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
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
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

    res.status(201).json({
      projectSummary: parsed.projectSummary || '',
      tasks: createdTasks,
    });
  } catch (error: any) {
    console.error('Gemini Error (generateProjectTasks):', error?.message || error);
    res.status(500).json({ error: 'Failed to generate project tasks' });
  }
};
