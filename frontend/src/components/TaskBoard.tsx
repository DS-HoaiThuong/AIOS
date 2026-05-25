import { useState, useEffect, useRef } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask, autoScheduleTasks, generateProjectTasks, deleteProject } from '../lib/api';
import { Plus, Loader2, Sparkles, ChevronDown, X, Wand2, FolderKanban, CheckCircle2, AlertCircle, Trash2, ListTodo, Columns3, Calendar, LayoutGrid, LayoutTemplate, Filter, ArrowUpDown, Search, ChevronRight } from 'lucide-react';
import TaskItem from './TaskItem';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [activeProject, setActiveProject] = useState('Frontend Overhaul');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [creatingTaskStatus, setCreatingTaskStatus] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState<any>({ title: '', description: '', priority: 'medium', link: '', dueDate: '' });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'gallery' | 'calendar'>('board');

  // Toolbar states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'title' | 'dueDate'>('default');
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const newDropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // AI Generate Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiProjectName, setAiProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{ summary: string; count: number } | null>(null);
  const [generationError, setGenerationError] = useState('');
  const goalInputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
    
    const handleProjectCreated = () => {
      loadTasks();
    };
    window.addEventListener('aios-project-created', handleProjectCreated);
    
    return () => {
      window.removeEventListener('aios-project-created', handleProjectCreated);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleClickOutsideToolbar = (e: MouseEvent) => {
      if (newDropdownRef.current && !newDropdownRef.current.contains(e.target as Node)) setIsNewDropdownOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutsideToolbar);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutsideToolbar as EventListener);
    };
  }, []);

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
      const projects = Array.from(new Set(data.map((t: any) => t.project).filter(Boolean))) as string[];
      if (projects.length > 0 && !projects.includes(activeProject)) {
        setActiveProject(projects[0]);
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueProjects = Array.from(new Set(tasks.map(t => t.project).filter(Boolean))) as string[];
  if (!uniqueProjects.includes(activeProject) && activeProject !== 'Inbox') {
    uniqueProjects.push(activeProject);
  }

  const activeProjectsList: string[] = [];
  const completedProjectsList: string[] = [];

  uniqueProjects.forEach(proj => {
    const projTasks = tasks.filter(t => t.project === proj);
    const hasActiveTasks = projTasks.some(t => t.status !== 'done');
    if (projTasks.length > 0 && !hasActiveTasks) {
      completedProjectsList.push(proj);
    } else {
      activeProjectsList.push(proj);
    }
  });

  const handleDeleteProject = async (projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = window.confirm(`Bạn có chắc muốn xóa dự án "${projectName}" và TOÀN BỘ công việc bên trong không? Hành động này không thể hoàn tác!`);
    if (!isConfirmed) return;

    try {
      await deleteProject(projectName);
      const remainingTasks = tasks.filter(t => t.project !== projectName);
      setTasks(remainingTasks);
      
      if (activeProject === projectName) {
         const remainingProjects = Array.from(new Set(remainingTasks.map(t => t.project).filter(Boolean))) as string[];
         setActiveProject(remainingProjects.length > 0 ? remainingProjects[0] : 'Inbox');
      }
      setIsDropdownOpen(false);
    } catch (error) {
       console.error('Failed to delete project', error);
       alert('Xóa dự án thất bại. Vui lòng thử lại sau.');
    }
  };

  const handleCreateTask = async (title: string, status: string = 'todo') => {
    if (!title.trim()) return;
    try {
      const newTask = await createTask({ title, project: activeProject, status });
      setTasks([newTask, ...tasks]);
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleCreateFullTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title.trim() || !creatingTaskStatus) return;
    try {
      const newTask = await createTask({ ...newTaskData, status: creatingTaskStatus, project: activeProject });
      setTasks([...tasks, newTask]);
      setCreatingTaskStatus(null);
      setNewTaskData({ title: '', description: '', priority: 'medium', link: '', dueDate: '' });
    } catch (error) {
      console.error(error);
      alert('Lỗi khi tạo công việc');
    }
  };

  const handleDeleteTask = async (id: string) => {
    const isConfirmed = window.confirm('Bạn có chắc muốn xóa công việc này không?');
    if (!isConfirmed) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to delete task', error);
      alert('Xóa công việc thất bại.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
      await updateTask(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task', error);
      loadTasks();
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
          alert('AI organized your tasks!');
        }
      } else {
        alert(data.message || 'No suggestions right now.');
      }
    } catch (error) {
      alert('AI is currently unavailable.');
    } finally {
      setScheduling(false);
    }
  };

  const openAIModal = (projectName?: string) => {
    setAiProjectName(projectName || activeProject);
    setAiGoal('');
    setGenerationResult(null);
    setGenerationError('');
    setIsAIModalOpen(true);
    setIsDropdownOpen(false);
    setTimeout(() => goalInputRef.current?.focus(), 100);
  };

  const handleGenerateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim() || !aiProjectName.trim()) return;

    setIsGenerating(true);
    setGenerationResult(null);
    setGenerationError('');

    try {
      const data = await generateProjectTasks(aiGoal, aiProjectName);
      setGenerationResult({ summary: data.projectSummary, count: data.tasks?.length || 0 });
      // Add to state & switch to the new project
      setTasks(prev => [...data.tasks, ...prev]);
      setActiveProject(aiProjectName);
    } catch (err: any) {
      setGenerationError(err?.response?.data?.error || 'AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
      </div>
    );
  }

  const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const priorityOrder = ['urgent', 'high', 'medium', 'low'];
  
  const applySort = (tasksArr: any[]) => {
    const arr = [...tasksArr];
    if (sortBy === 'priority') return arr.sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));
    if (sortBy === 'title') return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    if (sortBy === 'dueDate') return arr.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return arr; // default: no sort
  };

  const applyFilter = (tasksArr: any[]) => {
    let result = tasksArr;
    if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }
    return result;
  };

  const projectTasks = tasks.filter(t => t.project === activeProject || (!t.project && activeProject === 'Frontend Overhaul'));
  const todoTasks = applySort(applyFilter(projectTasks.filter(t => t.status === 'todo')));
  const inProgressTasks = applySort(applyFilter(projectTasks.filter(t => t.status === 'in-progress')));
  const doneTasks = applySort(applyFilter(projectTasks.filter(t => t.status === 'done')));

  const allTodoTasks = applySort(applyFilter(tasks.filter(t => t.status === 'todo')));
  const allInProgressTasks = applySort(applyFilter(tasks.filter(t => t.status === 'in-progress')));
  const allDoneTasks = applySort(applyFilter(tasks.filter(t => t.status === 'done')));

  const totalTasks = projectTasks.length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks.length / totalTasks) * 100);

  return (
    <div className="h-full flex flex-col max-w-[1280px] mx-auto w-full pb-10">
      
      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingTask(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 border border-zinc-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
              <h3 className="text-base font-bold text-zinc-950">Chỉnh sửa công việc</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
                <button onClick={() => setEditingTask(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const updated = await updateTask(editingTask.id, editingTask);
                  setTasks(tasks.map(t => t.id === updated.id ? updated : t));
                  setEditingTask(null);
                } catch (error) {
                  alert('Lỗi khi cập nhật công việc');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Tên công việc</label>
                    <input type="text" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Mô tả</label>
                    <textarea value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})} rows={3} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Độ ưu tiên</label>
                      <select value={editingTask.priority || 'medium'} onChange={e => setEditingTask({...editingTask, priority: e.target.value})} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 bg-white">
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Dự án</label>
                      <input type="text" value={editingTask.project || ''} onChange={e => setEditingTask({...editingTask, project: e.target.value})} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">📅 Ngày hết hạn</label>
                      <input
                        type="date"
                        value={editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : ''}
                        onChange={e => setEditingTask({...editingTask, dueDate: e.target.value || null})}
                        className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Trạng thái</label>
                      <select value={editingTask.status || 'todo'} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 bg-white">
                        <option value="todo">To Plan</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Đính kèm Link (Tùy chọn)</label>
                    <input type="url" value={editingTask.link || ''} onChange={e => setEditingTask({...editingTask, link: e.target.value})} placeholder="https://..." className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 text-blue-600" />
                  </div>
                  <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white py-3 rounded-xl text-sm font-semibold mt-2 transition-colors">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {creatingTaskStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCreatingTaskStatus(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 border border-zinc-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
              <h3 className="text-base font-bold text-zinc-950">Tạo công việc mới</h3>
              <button onClick={() => setCreatingTaskStatus(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <form onSubmit={handleCreateFullTask}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Tên công việc</label>
                    <input type="text" autoFocus value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Mô tả</label>
                    <textarea value={newTaskData.description} onChange={e => setNewTaskData({...newTaskData, description: e.target.value})} rows={3} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Độ ưu tiên</label>
                      <select value={newTaskData.priority} onChange={e => setNewTaskData({...newTaskData, priority: e.target.value})} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 bg-white">
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Dự án</label>
                      <input type="text" value={activeProject} disabled className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-zinc-50 text-zinc-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">📅 Ngày hết hạn (Tùy chọn)</label>
                    <input
                      type="date"
                      value={newTaskData.dueDate}
                      onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                      className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase">Đính kèm Link (Tùy chọn)</label>
                    <input type="url" value={newTaskData.link} onChange={e => setNewTaskData({...newTaskData, link: e.target.value})} placeholder="https://..." className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-950 text-blue-600" />
                  </div>
                  <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white py-3 rounded-xl text-sm font-semibold mt-6 transition-colors">
                    Tạo công việc
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI Project Generator Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !isGenerating && setIsAIModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 border border-zinc-200 w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">AI Project Planner</h3>
                  <p className="text-xs text-zinc-500">Tự động phân rã công việc bằng AI</p>
                </div>
              </div>
              {!isGenerating && (
                <button onClick={() => setIsAIModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {generationResult ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-950 mb-2">Đã tạo {generationResult.count} công việc!</h4>
                  <p className="text-sm text-zinc-600 leading-relaxed mb-5">{generationResult.summary}</p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setIsAIModalOpen(false)}
                      className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Xem Kanban Board →
                    </button>
                    <button
                      onClick={() => { setGenerationResult(null); setAiGoal(''); }}
                      className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Tạo tiếp
                    </button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleGenerateProject}>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase tracking-wider">Tên dự án</label>
                    <input
                      type="text"
                      value={aiProjectName}
                      onChange={e => setAiProjectName(e.target.value)}
                      placeholder="Ví dụ: Chiến dịch Marketing Q3"
                      disabled={isGenerating}
                      className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 transition-colors disabled:opacity-60"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5 uppercase tracking-wider">Mục tiêu dự án</label>
                    <textarea
                      ref={goalInputRef}
                      value={aiGoal}
                      onChange={e => setAiGoal(e.target.value)}
                      placeholder="Mô tả mục tiêu hoặc kết quả bạn muốn đạt được. Ví dụ: Xây dựng và ra mắt landing page bán sản phẩm mới, tăng tỉ lệ chuyển đổi lên 15%..."
                      rows={4}
                      disabled={isGenerating}
                      className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-950 resize-none transition-colors disabled:opacity-60"
                    />
                  </div>

                  {generationError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{generationError}</p>
                    </div>
                  )}

                  {/* AI Hint */}
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3 mb-5">
                    <Sparkles className="w-4 h-4 text-zinc-500 shrink-0" />
                    <p className="text-xs text-zinc-600">AI sẽ tự động phân rã mục tiêu thành <strong>5–8 công việc cụ thể</strong>, đánh giá độ ưu tiên và ước tính thời gian hoàn thành.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating || !aiGoal.trim() || !aiProjectName.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI đang phân tích & tạo công việc...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Generate Project Tasks</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notion-style Header with Pill Tabs */}
      <div className="mb-6">
        {/* Top Row: Title and Right Tools */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-zinc-100 rounded-md px-2 py-1 transition-colors group -ml-2"
            >
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{activeProject}</h1>
              <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl shadow-zinc-200/50 py-2 z-50">
                <div className="px-3 pb-2 mb-1 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Active Projects
                </div>
                {activeProjectsList.map(proj => (
                  <div key={proj} className="flex items-center group/proj w-full relative">
                    <button
                      onClick={() => { setActiveProject(proj); setIsDropdownOpen(false); }}
                      className={`flex-1 flex items-center gap-2 text-left px-4 py-2.5 text-sm transition-colors ${
                        activeProject === proj
                          ? 'bg-zinc-50 text-zinc-950 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      <FolderKanban className="w-4 h-4 shrink-0" />
                      <span className="truncate pr-6">{proj}</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteProject(proj, e)}
                      className="opacity-0 group-hover/proj:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all absolute right-1"
                      title="Xóa dự án"
                    >
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {completedProjectsList.length > 0 && (
                  <>
                    <div className="px-3 pb-2 pt-3 mb-1 border-b border-zinc-100 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-2">
                      Completed Projects
                    </div>
                    {completedProjectsList.map(proj => (
                      <div key={proj} className="flex items-center group/proj w-full relative opacity-70 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setActiveProject(proj); setIsDropdownOpen(false); }}
                          className={`flex-1 flex items-center gap-2 text-left px-4 py-2 text-sm transition-colors ${
                            activeProject === proj
                              ? 'bg-emerald-50 text-emerald-900 font-semibold'
                              : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate pr-6 line-through decoration-zinc-300">{proj}</span>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteProject(proj, e)}
                          className="opacity-0 group-hover/proj:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all absolute right-1"
                          title="Xóa dự án"
                        >
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                <div className="px-2 pt-2 mt-1 border-t border-zinc-100 flex flex-col gap-1">
                  {!isCreatingProject ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreatingProject(true);
                      }}
                      className="w-full flex items-center gap-2 text-left px-2 py-2 text-sm text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Tạo dự án mới
                    </button>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newProjectName.trim()) {
                          setActiveProject(newProjectName.trim());
                          setIsDropdownOpen(false);
                          setIsCreatingProject(false);
                          setNewProjectName('');
                        }
                      }}
                      className="px-2 py-1 flex items-center gap-2"
                    >
                      <input 
                        type="text" 
                        autoFocus
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Tên dự án..."
                        className="flex-1 min-w-0 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-zinc-950"
                      />
                      <button type="submit" className="text-xs bg-zinc-950 text-white px-2 py-1.5 rounded-lg font-medium">Lưu</button>
                      <button type="button" onClick={() => setIsCreatingProject(false)} className="text-zinc-400 hover:text-zinc-700">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Tools: Action Icons & Blue New Button */}
          <div className="flex items-center gap-1 mt-4 sm:mt-0">

            {/* Filter Button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                className={`p-1.5 rounded-md transition-colors ${ isFilterOpen || filterPriority !== 'all' ? 'bg-blue-100 text-blue-700' : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100' }`}
                title="Lọc theo độ ưu tiên"
              >
                <Filter className="w-4 h-4" />
                {filterPriority !== 'all' && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />}
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-50">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 pb-1.5">Độ ưu tiên</p>
                  {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => { setFilterPriority(p); setIsFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${ filterPriority === p ? 'text-blue-700 font-semibold bg-blue-50' : 'text-zinc-700 hover:bg-zinc-50' }`}
                    >
                      {p === 'all' ? '🗂 Tất cả' : p === 'urgent' ? '🔴 Urgent' : p === 'high' ? '🟠 High' : p === 'medium' ? '⚪ Medium' : '🟢 Low'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Button */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                className={`p-1.5 rounded-md transition-colors ${ isSortOpen || sortBy !== 'default' ? 'bg-blue-100 text-blue-700' : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100' }`}
                title="Sắp xếp"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-50">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 pb-1.5">Sắp xếp theo</p>
                  {([['default','📋 Mặc định'], ['priority','🎯 Độ ưu tiên'], ['title','📝 Tên A-Z'], ['dueDate','📅 Ngày đến hạn']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setSortBy(val); setIsSortOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${ sortBy === val ? 'text-blue-700 font-semibold bg-blue-50' : 'text-zinc-700 hover:bg-zinc-50' }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button + Expandable Input */}
            <div className="flex items-center gap-1 transition-all">
              {isSearchOpen ? (
                <div className="flex items-center gap-1 bg-zinc-100 rounded-md px-2 py-1">
                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="bg-transparent text-sm outline-none w-36 text-zinc-800 placeholder:text-zinc-400"
                  />
                  <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="text-zinc-400 hover:text-zinc-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
                  title="Tìm kiếm"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="w-px h-4 bg-zinc-200 mx-2"></div>
            
            {/* New Dropdown */}
            <div className="relative" ref={newDropdownRef}>
              <button
                onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#2383e2] hover:bg-[#1a6bbd] transition-colors px-3 py-1.5 rounded-md shadow-sm"
              >
                New <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
              {isNewDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-50">
                  <button
                    onClick={() => { setCreatingTaskStatus('todo'); setIsNewDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5"
                  >
                    <Plus className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="font-semibold text-zinc-800">Tạo task mới</p>
                      <p className="text-xs text-zinc-400">Nhập thủ công</p>
                    </div>
                  </button>
                  <div className="border-t border-zinc-100 my-1" />
                  <button
                    onClick={() => { openAIModal(); setIsNewDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5"
                  >
                    <Wand2 className="w-4 h-4 text-violet-500" />
                    <div>
                      <p className="font-semibold text-zinc-800">AI Generate</p>
                      <p className="text-xs text-zinc-400">Tự động phân rã bằng AI</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Pill Tabs */}
        <div className="flex items-center gap-1 text-sm font-medium text-zinc-500 border-b border-zinc-200 pb-2">
          <button 
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            <Columns3 className="w-4 h-4" /> Board
          </button>
          <button 
            onClick={() => setViewMode('gallery')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${viewMode === 'gallery' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Gallery
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            <Calendar className="w-4 h-4" /> Calendar
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            <ListTodo className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {/* Views Layout */}
      {viewMode === 'board' && (
        <div className="flex gap-6 flex-1 overflow-x-auto h-[calc(100%-120px)] min-h-[500px]">
          <TaskColumn
            title="To Plan"
            tasks={todoTasks}
            onStatusChange={handleStatusChange}
            onEditClick={setEditingTask}
            onOpenCreate={setCreatingTaskStatus}
            targetStatus="todo"
            theme="purple"
          />
          <TaskColumn
            title="In Progress"
            tasks={inProgressTasks}
            onStatusChange={handleStatusChange}
            onEditClick={setEditingTask}
            onOpenCreate={setCreatingTaskStatus}
            targetStatus="in-progress"
            theme="green"
          />
          <TaskColumn
            title="Completed"
            tasks={doneTasks}
            onStatusChange={handleStatusChange}
            onEditClick={setEditingTask}
            onOpenCreate={setCreatingTaskStatus}
            targetStatus="done"
            theme="orange"
          />
        </div>
      )}
      
      {viewMode === 'list' && (
        <div className="flex-1 bg-white flex flex-col min-h-[500px]">
          <TaskListView 
            todoTasks={allTodoTasks} 
            inProgressTasks={allInProgressTasks} 
            doneTasks={allDoneTasks} 
            onStatusChange={handleStatusChange} 
            onEditClick={setEditingTask} 
          />
        </div>
      )}

      {viewMode === 'gallery' && (
        <div className="flex-1 bg-white flex flex-col min-h-[500px]">
          <TaskGalleryView 
            tasks={[...allTodoTasks, ...allInProgressTasks, ...allDoneTasks]} 
            onStatusChange={handleStatusChange} 
            onEditClick={setEditingTask} 
          />
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="flex-1 bg-white flex flex-col min-h-[500px]">
          <TaskCalendarView 
            tasks={[...allTodoTasks, ...allInProgressTasks, ...allDoneTasks]} 
            onEditClick={setEditingTask} 
          />
        </div>
      )}
    </div>
  );
}

function TaskListView({ todoTasks, inProgressTasks, doneTasks, onStatusChange, onEditClick }: any) {
  const Group = ({ title, tasks, dotColor }: any) => (
    <div className="mb-0">
      <div className="flex items-center gap-2 px-6 py-3 bg-zinc-50/80 border-b border-zinc-100 sticky top-0 z-10 backdrop-blur-sm">
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
          {title} <span className="text-zinc-400 font-normal ml-1.5">{tasks.length}</span>
        </h3>
      </div>
      {tasks.length === 0 ? (
        <p className="text-zinc-400 text-sm px-6 py-4 border-b border-zinc-100">Không có công việc nào</p>
      ) : (
        <div className="divide-y divide-zinc-100 border-b border-zinc-100">
          {tasks.map((task: any) => (
            <div key={task.id} className="flex items-center group hover:bg-zinc-50 px-6 py-3.5 transition-colors cursor-pointer" onClick={() => onEditClick(task)}>
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done'); }}
                className={`w-5 h-5 rounded-md border flex items-center justify-center mr-4 transition-colors shrink-0 ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 bg-white hover:border-zinc-400 group-hover:border-zinc-400'}`}
              >
                {task.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
              
              <div className="flex-1 min-w-0 pr-4">
                <p className={`text-sm font-semibold truncate transition-colors ${task.status === 'done' ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-900 group-hover:text-indigo-600'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-zinc-500 truncate mt-0.5 max-w-xl">{task.description}</p>
                )}
              </div>

              <div className="flex items-center gap-6 shrink-0">
                {task.project && (
                  <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md max-w-[120px] truncate" title={task.project}>
                    {task.project}
                  </span>
                )}
                {task.priority && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase w-20 text-center tracking-wider ${
                    task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-100' :
                    task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    task.priority === 'medium' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {task.priority}
                  </span>
                )}
                
                <div className="w-24 text-right">
                  {task.dueDate ? (
                    <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 justify-end">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(task.dueDate).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5 justify-end"><Calendar className="w-3.5 h-3.5 opacity-50"/> —</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
      <Group title="In Progress" tasks={inProgressTasks} dotColor="bg-[#b8c8df]" />
      <Group title="To Plan" tasks={todoTasks} dotColor="bg-zinc-400" />
      <Group title="Completed" tasks={doneTasks} dotColor="bg-[#708a7a]" />
    </div>
  );
}

function TaskColumn({ title, tasks, onStatusChange, onEditClick, targetStatus, onOpenCreate, theme }: any) {
  const themeStyles: any = {
    purple: { bg: 'bg-purple-100/50', text: 'text-purple-800', border: 'border-purple-200', countText: 'text-purple-400' },
    green: { bg: 'bg-emerald-100/50', text: 'text-emerald-800', border: 'border-emerald-200', countText: 'text-emerald-400' },
    orange: { bg: 'bg-orange-100/50', text: 'text-orange-800', border: 'border-orange-200', countText: 'text-orange-400' },
  };

  const currentTheme = themeStyles[theme] || themeStyles.purple;

  return (
    <div className="flex-1 min-w-[280px] flex flex-col bg-transparent flex-shrink-0">
      {/* Colorful Header */}
      <div className={`flex justify-between items-center mb-4 px-3 py-1.5 rounded-lg ${currentTheme.bg}`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-semibold ${currentTheme.text}`}>{title}</h3>
          <span className={`text-xs font-medium ${currentTheme.countText}`}>{tasks.length}</span>
        </div>
        <button 
          onClick={() => onOpenCreate(targetStatus)}
          className={`p-1 rounded-md transition-colors ${currentTheme.text} opacity-60 hover:opacity-100 hover:bg-white/50`}
          title="Tạo công việc mới"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-10">
        {tasks.map((task: any) => (
          <TaskItem key={task.id} task={task} onStatusChange={onStatusChange} onEditClick={onEditClick} theme={theme} />
        ))}
      </div>
    </div>
  );
}

function TaskGalleryView({ tasks, onStatusChange, onEditClick }: any) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
      {tasks.length === 0 ? (
        <p className="text-zinc-400 text-sm">Không có công việc nào</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.map((task: any) => (
            <div key={task.id} className="h-full">
              <TaskItem task={task} onStatusChange={onStatusChange} onEditClick={onEditClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCalendarView({ tasks, onEditClick }: any) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(today.toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const monthLabel = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }).map((_, i) => {
    const dayNumber = i - firstDayOfWeek + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const dateStr = isCurrentMonth
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
      : null;
    const dayTasks = dateStr ? tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) === dateStr) : [];
    return { dayNumber, isCurrentMonth, dateStr, dayTasks };
  });

  const selectedDayTasks = selectedDay ? tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) === selectedDay) : [];
  const selectedDayLabel = selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(todayStr); };

  const taskColor = (t: any) => {
    if (t.status === 'done') return 'bg-zinc-100 text-zinc-400 line-through';
    if (t.status === 'in-progress') return 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-400';
    if (t.priority === 'urgent') return 'bg-red-100 text-red-800 border-l-2 border-red-400';
    if (t.priority === 'high') return 'bg-orange-100 text-orange-800 border-l-2 border-orange-400';
    return 'bg-violet-100 text-violet-800 border-l-2 border-violet-400';
  };

  return (
    <div className="flex-1 flex gap-5 overflow-hidden min-h-0">
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-900 capitalize">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
            >
              Hôm nay
            </button>
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-zinc-100">
          {weekDays.map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {cells.map((cell, i) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDay;
            return (
              <div
                key={i}
                onClick={() => cell.dateStr && setSelectedDay(cell.dateStr)}
                className={`min-h-[90px] p-2 border-r border-b border-zinc-100 flex flex-col gap-1 transition-colors last:border-r-0
                  ${!cell.isCurrentMonth ? 'bg-zinc-50/60' : 'bg-white hover:bg-zinc-50/80'}
                  ${isSelected ? 'bg-blue-50/60' : ''}
                  ${cell.dateStr ? 'cursor-pointer' : ''}
                `}
              >
                {/* Day number */}
                <span className={`
                  w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full self-start
                  ${isToday ? 'bg-[#2383e2] text-white shadow-sm' : ''}
                  ${isSelected && !isToday ? 'bg-zinc-200 text-zinc-800' : ''}
                  ${!isToday && !isSelected ? (cell.isCurrentMonth ? 'text-zinc-700' : 'text-zinc-300') : ''}
                `}>
                  {cell.dayNumber > 0 && cell.dayNumber <= daysInMonth ? cell.dayNumber : ''}
                </span>

                {/* Task pills */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {cell.dayTasks.slice(0, 2).map((t: any) => (
                    <div
                      key={t.id}
                      onClick={e => { e.stopPropagation(); onEditClick(t); }}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${taskColor(t)}`}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                  {cell.dayTasks.length > 2 && (
                    <span className="text-[9px] text-zinc-400 font-semibold pl-1">+{cell.dayTasks.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar: Selected Day Tasks */}
      <div className="w-64 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm shrink-0">
        <div className="px-4 py-4 border-b border-zinc-100">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Công việc</p>
          <p className="text-sm font-bold text-zinc-800 capitalize">{selectedDayLabel || 'Chọn một ngày'}</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {selectedDayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
              <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-zinc-300" />
              </div>
              <p className="text-xs text-zinc-400 text-center">Không có task nào<br />trong ngày này</p>
            </div>
          ) : (
            selectedDayTasks.map((t: any) => (
              <div
                key={t.id}
                onClick={() => onEditClick(t)}
                className="p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all group"
              >
                <p className={`text-xs font-semibold leading-snug mb-1 group-hover:text-[#2383e2] transition-colors ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                  {t.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide
                    ${t.status === 'done' ? 'bg-zinc-100 text-zinc-400' :
                      t.status === 'in-progress' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-violet-100 text-violet-700'}
                  `}>
                    {t.status === 'done' ? 'Done' : t.status === 'in-progress' ? 'In Progress' : 'To Plan'}
                  </span>
                  {t.priority && (
                    <span className={`text-[9px] font-bold uppercase tracking-wide
                      ${t.priority === 'urgent' ? 'text-red-500' : t.priority === 'high' ? 'text-orange-500' : 'text-zinc-400'}
                    `}>
                      {t.priority}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
