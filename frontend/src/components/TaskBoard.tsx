import { useState, useEffect } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask, autoScheduleTasks } from '../lib/api';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import TaskItem from './TaskItem';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      const newTask = await createTask({ title: newTaskTitle });
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
      await updateTask(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task', error);
      loadTasks(); // reload to revert
    }
  };

  const handleAutoSchedule = async () => {
    setScheduling(true);
    try {
      const data = await autoScheduleTasks();
      if (data.suggestions && data.suggestions.length > 0) {
        const top = data.suggestions[0];
        const task = tasks.find(t => t.id === top.id);
        if (task) {
          alert(`AI Suggests starting with: "${task.title}"\nReason: ${top.reason}`);
        } else {
          alert('AI organized your tasks! (Refresh needed for visual update in MVP)');
        }
      } else {
        alert(data.message || 'No suggestions right now.');
      }
    } catch (error) {
      console.error('Failed to auto-schedule', error);
      alert('AI is currently unavailable.');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Today's Tasks</h2>
          <p className="text-zinc-500 text-sm mt-1">You have {todoTasks.length} tasks to do.</p>
        </div>
        <button 
          onClick={handleAutoSchedule}
          disabled={scheduling || todoTasks.length === 0}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-[14px] text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-indigo-500/20"
        >
          {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Auto-Schedule
        </button>
      </div>

      <form onSubmit={handleCreateTask} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-white border border-zinc-200 focus:border-indigo-500 rounded-2xl px-5 py-4 pl-12 text-zinc-900 placeholder:text-zinc-400 outline-none transition-all shadow-sm"
          />
          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
        </div>
      </form>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <TaskColumn 
          title="To Do" 
          tasks={todoTasks} 
          onStatusChange={handleStatusChange} 
          targetStatus="todo"
        />
        <TaskColumn 
          title="In Progress" 
          tasks={inProgressTasks} 
          onStatusChange={handleStatusChange} 
          targetStatus="in-progress"
        />
        <TaskColumn 
          title="Done" 
          tasks={doneTasks} 
          onStatusChange={handleStatusChange} 
          targetStatus="done"
        />
      </div>
    </div>
  );
}

function TaskColumn({ title, tasks, onStatusChange, targetStatus }: { title: string, tasks: any[], onStatusChange: (id: string, status: string) => void, targetStatus: string }) {
  return (
    <div className="flex-1 flex flex-col bg-zinc-50/50 border border-zinc-200 rounded-[20px] p-5">
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="font-bold text-[15px] text-zinc-700">{title}</h3>
        <span className="bg-zinc-200 text-zinc-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} onStatusChange={onStatusChange} />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center text-sm font-medium text-zinc-400">
            No tasks here
          </div>
        )}
      </div>
    </div>
  );
}
