// Internal API client - calls Next.js API routes directly (no external backend needed)

const apiFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData?.error || `API error: ${res.status}`);
  }
  return res.json();
};

// Tasks API
export const fetchTasks = () => apiFetch('/tasks');

export const createTask = (taskData: any) =>
  apiFetch('/tasks', { method: 'POST', body: JSON.stringify(taskData) });

export const updateTask = (id: string, taskData: any) =>
  apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) });

export const deleteTask = (id: string) =>
  apiFetch(`/tasks/${id}`, { method: 'DELETE' });

// Finance API
export const fetchTransactions = (month?: string) =>
  apiFetch(`/finance/transactions${month ? `?month=${month}` : ''}`);

export const createTransaction = (data: any) =>
  apiFetch('/finance/transactions', { method: 'POST', body: JSON.stringify(data) });

export const deleteTransaction = (id: string) =>
  apiFetch(`/finance/transactions/${id}`, { method: 'DELETE' });

export const fetchGoals = () => apiFetch('/finance/goals');

export const createGoal = (data: any) =>
  apiFetch('/finance/goals', { method: 'POST', body: JSON.stringify(data) });

export const updateGoal = (id: string, data: any) =>
  apiFetch(`/finance/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const fetchSubscriptions = () => apiFetch('/finance/subscriptions');

export const createSubscription = (data: any) =>
  apiFetch('/finance/subscriptions', { method: 'POST', body: JSON.stringify(data) });

// Budget API
export const fetchBudgetItems = (month: string) =>
  apiFetch(`/finance/budget?month=${month}`);

export const createBudgetItem = (data: any) =>
  apiFetch('/finance/budget', { method: 'POST', body: JSON.stringify(data) });

export const deleteBudgetItem = (id: string) =>
  apiFetch(`/finance/budget/${id}`, { method: 'DELETE' });

// Life API
export const fetchHabits = () => apiFetch('/life/habits');

export const createHabit = (data: any) =>
  apiFetch('/life/habits', { method: 'POST', body: JSON.stringify(data) });

export const checkinHabit = (id: string, date: string) =>
  apiFetch(`/life/habits/${id}/checkin`, { method: 'POST', body: JSON.stringify({ date }) });

export const deleteHabit = (id: string) =>
  apiFetch(`/life/habits/${id}`, { method: 'DELETE' });

// AI API
export const summarizeJournal = (content: string) =>
  apiFetch('/ai/journal/summarize', { method: 'POST', body: JSON.stringify({ content }) });

export const autoScheduleTasks = () =>
  apiFetch('/ai/tasks/auto-schedule', { method: 'POST' });

// Dashboard API
export const fetchDashboardSummary = () => apiFetch('/dashboard/summary');

// Focus API
export const fetchFocusSessions = () => apiFetch('/focus');

export const startFocusSession = (data: { mode: string; duration: number; taskId?: string }) =>
  apiFetch('/focus/start', { method: 'POST', body: JSON.stringify(data) });

export const completeFocusSession = (id: string) =>
  apiFetch(`/focus/${id}/complete`, { method: 'POST' });

// Projects / AI Project Planner
export const generateProjectTasks = (goal: string, projectName: string) =>
  apiFetch('/ai/projects/generate', { method: 'POST', body: JSON.stringify({ goal, projectName }) });

export const deleteProject = (projectName: string) =>
  apiFetch(`/tasks/project/${encodeURIComponent(projectName)}`, { method: 'DELETE' });

// Analytics API
export const fetchAnalytics = (period: 'week' | 'month' = 'week') =>
  apiFetch(`/analytics/worklife?period=${period}`);

// Health API
export const fetchHealthToday = () => apiFetch('/health/today');

export const upsertHealthToday = (data: {
  sleepHours?: number;
  waterGlasses?: number;
  exercised?: boolean;
  energyLevel?: number;
  notes?: string;
}) => apiFetch('/health/today', { method: 'POST', body: JSON.stringify(data) });

export const fetchHealthWeek = () => apiFetch('/health/week');

// Voice Command
export const processVoiceCommand = (text: string) =>
  apiFetch('/ai/command', { method: 'POST', body: JSON.stringify({ text }) });
