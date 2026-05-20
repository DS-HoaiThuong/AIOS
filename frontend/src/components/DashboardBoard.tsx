import { useState, useEffect } from 'react';
import { fetchDashboardSummary, fetchTasks } from '../lib/api';
import {
  Loader2, Target, CheckCircle2, Clock, Zap, Sparkles,
  ArrowRight, TrendingUp, TrendingDown, Calendar, ChevronLeft,
  ChevronRight, BarChart2, Flame, ListTodo, DollarSign
} from 'lucide-react';

interface DashboardBoardProps {
  onNavigate?: (tab: string) => void;
}

export default function DashboardBoard({ onNavigate }: DashboardBoardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => { loadSummary(); }, []);

  const loadSummary = async () => {
    try {
      setError(null);
      const [data, tasks] = await Promise.all([fetchDashboardSummary(), fetchTasks()]);
      setSummary(data);
      setAllTasks(tasks);
    } catch (error: any) {
      console.error('Failed to load dashboard summary', error);
      setError('Không thể tải dữ liệu. Kiểm tra backend có đang chạy không.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <p className="text-zinc-400 text-sm font-medium">Đang tải dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-2">⚠️ Lỗi kết nối</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={loadSummary} className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm">Thử lại</button>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';

  const completedTasks = summary?.tasks?.completed || 0;
  const totalTasks = (summary?.tasks?.pending || 0) + completedTasks;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const focusMinutes = summary?.focus?.todayMinutes || 0;
  const focusHours = Math.floor(focusMinutes / 60);
  const focusMins = focusMinutes % 60;
  const focusScore = Math.min(100, Math.floor((focusMinutes / 240) * 100));
  const habitsCompleted = summary?.habits?.completedToday || 0;
  const habitsTotal = summary?.habits?.total || 0;
  const habitsPercent = habitsTotal > 0 ? Math.floor((habitsCompleted / habitsTotal) * 100) : 0;
  const topPriorities = summary?.tasks?.topPriorities || [];
  const aiBrief = summary?.aiBrief || 'Hãy tập trung vào những nhiệm vụ quan trọng nhất hôm nay. Mỗi bước tiến nhỏ đều tạo nên sự khác biệt lớn!';
  const balance = summary?.finance?.balance ?? null;
  const income = summary?.finance?.income ?? 0;
  const expense = summary?.finance?.expense ?? 0;

  return (
    <div className="max-w-[1200px] w-full flex flex-col gap-6 pb-10">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-8 py-7 text-white shadow-xl shadow-zinc-900/20">
        {/* Abstract blobs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-56 w-32 h-32 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{greetingEmoji}</span>
              <span className="text-white/60 text-sm font-medium">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              {greeting}, Hien!
            </h1>
            <p className="text-white/60 text-sm max-w-lg">
              Bạn có{' '}
              <span className="text-white font-semibold">{summary?.tasks?.pending || 0} task</span>
              {' '}đang chờ và đã hoàn thành{' '}
              <span className="text-white font-semibold">{focusHours}h {focusMins}m</span>
              {' '}deep work hôm nay.
            </p>
          </div>

          {/* Quick action */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigate?.('focus')}
              className="flex items-center gap-2 bg-white text-[#1a1a2e] font-bold text-sm px-5 py-3 rounded-xl hover:bg-white/90 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Target className="w-4 h-4" />
              Bắt đầu Focus
            </button>
            <button
              onClick={() => onNavigate?.('tasks')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95"
            >
              <ListTodo className="w-4 h-4" />
              Xem Tasks
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mt-5 flex items-center gap-4">
          <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all duration-1000"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
          <span className="text-white/70 text-xs font-medium shrink-0">{completedTasks}/{totalTasks} tasks xong</span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Focus Score"
          value={`${focusScore}%`}
          sub={focusScore === 0 ? 'Chưa có phiên' : focusScore >= 75 ? '🔥 Xuất sắc!' : '📈 Tiếp tục cố'}
          gradient="from-emerald-500 to-teal-500"
          icon={<Target className="w-5 h-5" />}
          progress={focusScore}
          onClick={() => onNavigate?.('focus')}
        />
        <StatCard
          label="Tasks Done"
          value={`${completedTasks}/${totalTasks}`}
          sub={totalTasks === 0 ? 'Chưa có task' : `Còn ${summary?.tasks?.pending || 0} đang chờ`}
          gradient="from-blue-500 to-indigo-500"
          icon={<CheckCircle2 className="w-5 h-5" />}
          progress={taskProgress}
          onClick={() => onNavigate?.('tasks')}
        />
        <StatCard
          label="Deep Work"
          value={`${focusHours}h ${focusMins}m`}
          sub={focusHours === 0 && focusMins === 0 ? 'Bắt đầu ngay!' : 'Hôm nay'}
          gradient="from-violet-500 to-purple-600"
          icon={<Clock className="w-5 h-5" />}
          progress={Math.min(100, Math.floor((focusMinutes / 480) * 100))}
          onClick={() => onNavigate?.('focus')}
        />
        <StatCard
          label="Habits"
          value={`${habitsPercent}%`}
          sub={habitsTotal === 0 ? 'Chưa có habit' : `${habitsCompleted}/${habitsTotal} hoàn thành`}
          gradient="from-amber-500 to-orange-500"
          icon={<Flame className="w-5 h-5" />}
          progress={habitsPercent}
          onClick={() => onNavigate?.('life')}
        />
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left: Top Priorities */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 inline-block" />
              Ưu tiên hôm nay
            </h2>
            <button onClick={() => onNavigate?.('tasks')} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 group transition-colors">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {topPriorities.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-zinc-700 font-semibold">Mọi thứ đã hoàn thành! 🎉</p>
                <p className="text-zinc-400 text-sm">Thêm task mới để tiếp tục tiến độ</p>
                <button onClick={() => onNavigate?.('tasks')} className="mt-1 text-sm font-semibold text-indigo-500 hover:underline">
                  Thêm task →
                </button>
              </div>
            ) : (
              topPriorities.map((task: any, idx: number) => (
                <TaskRow key={task.id} task={task} index={idx} onClick={() => onNavigate?.('tasks')} />
              ))
            )}
          </div>

          {/* AI Brief inline */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 relative overflow-hidden">
            <Sparkles className="absolute top-3 right-3 w-5 h-5 text-violet-300" />
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5">AI Daily Brief</p>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">{aiBrief}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-1 flex flex-col gap-4">

          {/* Finance Card */}
          <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => onNavigate?.('finance')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-zinc-800">Tài chính</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            {balance !== null ? (
              <>
                <p className={`text-2xl font-extrabold mb-3 ${balance >= 0 ? 'text-zinc-900' : 'text-red-500'}`}>
                  {balance >= 0 ? '+' : ''}{balance.toLocaleString('vi-VN')}₫
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mb-0.5">Thu</p>
                    <p className="text-sm font-bold text-emerald-700">{income.toLocaleString('vi-VN')}₫</p>
                  </div>
                  <div className="bg-red-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mb-0.5">Chi</p>
                    <p className="text-sm font-bold text-red-600">{expense.toLocaleString('vi-VN')}₫</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-400 text-sm mb-2">Chưa có dữ liệu</p>
                <span className="text-xs font-semibold text-indigo-500 hover:underline">Thêm giao dịch →</span>
              </div>
            )}
          </div>

          {/* Today's Tasks Widget */}
          <TodayTasksWidget tasks={allTasks} onNavigate={onNavigate} todayStr={new Date().toISOString().split('T')[0]} />

          {/* Mini Calendar Widget */}
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm flex-1">
            <MiniCalendar tasks={allTasks.filter((t: any) => t.title.toLowerCase().includes('họp') || t.title.toLowerCase().includes('meeting') || (t.tags && typeof t.tags === 'string' && (t.tags.toLowerCase().includes('họp') || t.tags.toLowerCase().includes('meeting'))))} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TODAY'S TASKS WIDGET ── */
function TodayTasksWidget({ tasks, onNavigate, todayStr }: { tasks: any[]; onNavigate?: (tab: string) => void; todayStr: string }) {
  const todayTasks = tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) === todayStr && t.status !== 'done');
  const overdueTasks = tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) < todayStr && t.status !== 'done');

  if (todayTasks.length === 0 && overdueTasks.length === 0) return null;

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-zinc-800">Hôm nay</span>
          {todayTasks.length > 0 && (
            <span className="text-xs font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">{todayTasks.length}</span>
          )}
        </div>
        <button onClick={() => onNavigate?.('tasks')} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">Xem tất cả →</button>
      </div>

      <div className="space-y-1.5">
        {overdueTasks.slice(0, 2).map((t: any) => (
          <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 bg-red-50 rounded-xl border border-red-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <p className="text-xs font-semibold text-red-700 truncate flex-1">{t.title}</p>
            <span className="text-[9px] font-bold text-red-400 uppercase shrink-0">Trễ</span>
          </div>
        ))}
        {todayTasks.slice(0, 3).map((t: any) => (
          <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-zinc-50 rounded-xl transition-colors">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              t.priority === 'urgent' ? 'bg-red-500' : t.priority === 'high' ? 'bg-orange-500' : 'bg-indigo-400'
            }`} />
            <p className="text-xs font-semibold text-zinc-700 truncate flex-1">{t.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({ label, value, sub, gradient, icon, progress, onClick }: {
  label: string; value: string; sub: string;
  gradient: string; icon: React.ReactNode; progress: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-[0.98]`}
    >
      {/* bg decoration */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-md" />
      <div className="flex items-start justify-between mb-3 relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-extrabold mb-1 relative z-10">{value}</p>
      <p className="text-xs text-white/70 font-medium relative z-10">{sub}</p>
      {/* Progress bar */}
      <div className="mt-3 bg-white/20 rounded-full h-1 overflow-hidden relative z-10">
        <div className="h-full bg-white/80 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

/* ── TASK ROW ── */
function TaskRow({ task, index, onClick }: { task: any; index: number; onClick: () => void }) {
  const priorityConfig: Record<string, { dot: string; badge: string; badgeText: string }> = {
    urgent: { dot: 'bg-red-500', badge: 'bg-red-50 border border-red-100', badgeText: 'text-red-600' },
    high:   { dot: 'bg-orange-500', badge: 'bg-orange-50 border border-orange-100', badgeText: 'text-orange-600' },
    medium: { dot: 'bg-amber-400', badge: 'bg-amber-50 border border-amber-100', badgeText: 'text-amber-600' },
    low:    { dot: 'bg-zinc-300', badge: 'bg-zinc-50 border border-zinc-200', badgeText: 'text-zinc-500' },
  };
  const cfg = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-zinc-100 rounded-2xl px-4 py-3.5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Index number */}
      <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-400 text-[11px] font-bold flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
        {index + 1}
      </span>
      {/* Priority dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 truncate group-hover:text-indigo-700 transition-colors">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.project && <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 px-1.5 py-0.5 rounded-md">{task.project}</span>}
          {task.dueDate && (
            <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      {/* Priority badge */}
      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shrink-0 ${cfg.badge} ${cfg.badgeText}`}>
        {task.priority}
      </span>
    </div>
  );
}

/* ── MINI CALENDAR ── */
function MiniCalendar({ tasks }: { tasks: any[] }) {
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
  const selectedDayLabel = selectedDay
    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  return (
    <>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-sm font-bold text-zinc-800 capitalize">{monthLabel}</p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(todayStr); }}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Nay
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-2 gap-y-0.5 pb-3">
        {cells.map((cell, i) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDay;
          const hasTasks = cell.dayTasks.length > 0;
          return (
            <div
              key={i}
              onClick={() => cell.dateStr && setSelectedDay(cell.dateStr)}
              className={`
                h-8 flex flex-col items-center justify-center rounded-lg transition-all text-xs
                ${cell.dateStr ? 'cursor-pointer' : ''}
                ${isToday ? 'bg-indigo-600 text-white font-bold shadow-sm' : ''}
                ${isSelected && !isToday ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}
                ${!isToday && !isSelected ? (cell.isCurrentMonth ? 'hover:bg-zinc-50 text-zinc-600' : 'text-zinc-200') : ''}
              `}
            >
              <span className="leading-none">{cell.dayNumber > 0 && cell.dayNumber <= daysInMonth ? cell.dayNumber : ''}</span>
              {hasTasks && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-white/70' : isSelected ? 'bg-indigo-400' : 'bg-zinc-400'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 capitalize">{selectedDayLabel}</p>
          {selectedDayTasks.length === 0 ? (
            <p className="text-xs text-zinc-300 text-center py-2">Không có task</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {selectedDayTasks.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0
                    ${t.status === 'done' ? 'bg-zinc-300' : t.status === 'in-progress' ? 'bg-emerald-400' :
                      t.priority === 'urgent' ? 'bg-red-400' : t.priority === 'high' ? 'bg-orange-400' : 'bg-indigo-400'}
                  `} />
                  <p className={`text-xs font-medium truncate ${t.status === 'done' ? 'line-through text-zinc-300' : 'text-zinc-700'}`}>
                    {t.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
