import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (taskData: any) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id: string, taskData: any) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

// Finance API
export const fetchTransactions = async () => {
  const response = await api.get('/finance/transactions');
  return response.data;
};

export const createTransaction = async (data: any) => {
  const response = await api.post('/finance/transactions', data);
  return response.data;
};

export const deleteTransaction = async (id: string) => {
  const response = await api.delete(`/finance/transactions/${id}`);
  return response.data;
};

// Life API
export const fetchHabits = async () => {
  const response = await api.get('/life/habits');
  return response.data;
};

export const createHabit = async (data: any) => {
  const response = await api.post('/life/habits', data);
  return response.data;
};

export const checkinHabit = async (id: string, date: string) => {
  const response = await api.post(`/life/habits/${id}/checkin`, { date });
  return response.data;
};

// AI API
export const summarizeJournal = async (content: string) => {
  const response = await api.post('/ai/journal/summarize', { content });
  return response.data;
};

export const autoScheduleTasks = async () => {
  const response = await api.post('/ai/tasks/auto-schedule');
  return response.data;
};

// Dashboard API
export const fetchDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

export const fetchFocusSessions = async () => {
  const response = await api.get('/focus');
  return response.data;
};

export const startFocusSession = async (data: { mode: string; duration: number; taskId?: string }) => {
  const response = await api.post('/focus/start', data);
  return response.data;
};

export const completeFocusSession = async (id: string) => {
  const response = await api.post(`/focus/${id}/complete`);
  return response.data;
};
