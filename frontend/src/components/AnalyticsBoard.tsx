'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchAnalytics } from '../lib/api';
import {
  Loader2, BarChart3, TrendingUp, CheckCircle2, Zap,
  Brain, Heart, Flame, Clock, Target, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

type Period = 'week' | 'month';

export default function AnalyticsBoard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics(period);
      setData(res);
    } catch (err) {
      console.error('Analytics error', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
        <p className="text-zinc-400 text-sm font-medium">Đang phân tích dữ liệu...</p>
      </div>
    );
  }

  const score = data?.workLifeScore || 0;
  const breakdown = data?.scoreBreakdown || { focus: 0, habits: 0, health: 0, tasks: 0 };
  const series = data?.dailySeries || [];
  const totals = data?.totals || {};

  const maxFocus = Math.max(...series.map((d: any) => d.focusMinutes), 1);
  const maxTasks = Math.max(...series.map((d: any) => d.tasksCompleted), 1);

  const scoreColor = score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = score >= 75 ? 'from-emerald-500 to-teal-400' : score >= 50 ? 'from-amber-500 to-orange-400' : 'from-red-500 to-rose-400';
  const scoreLabel = score >= 75 ? 'Xuất sắc 🌟' : score >= 60 ? 'Tốt 👍' : score >= 40 ? 'Cần cải thiện ⚡' : 'Cần chú ý ❤️';

  const projectCounts = data?.projectCounts || {};
  const totalProjectTasks = Object.values(projectCounts).reduce((a: any, b: any) => a + b, 0) as number;
  const projectColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const projectList = Object.entries(projectCounts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="max-w-6xl w-full flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Analytics</h2>
          <p className="text-zinc-500 text-sm mt-1">Phân tích work-life balance toàn diện</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl">
          {(['week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                period === p ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {p === 'week' ? '7 ngày' : '30 ngày'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Score + Breakdown + Totals */}
      <div className="grid grid-cols-12 gap-5">

        {/* Work-Life Score (big) */}
        <div className={`col-span-3 bg-gradient-to-br ${scoreBg} rounded-2xl p-6 text-white relative overflow-hidden`}>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -bottom-2 w-24 h-24 bg-white/10 rounded-full" />
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80 mb-2">Work-Life Score</p>
          <p className="text-7xl font-black leading-none mb-1">{score}</p>
          <p className="text-white/90 font-bold text-lg">{scoreLabel}</p>
          <p className="text-white/60 text-xs mt-3">{data?.days} ngày gần nhất</p>
        </div>

        {/* Score Breakdown */}
        <div className="col-span-4 bg-white border border-zinc-100 shadow-sm rounded-2xl p-6">
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-4">Phân tích điểm số</p>
          <div className="space-y-3">
            <ScoreBar label="Focus" icon={<Brain className="w-4 h-4 text-violet-500"/>} value={breakdown.focus} max={25} color="bg-violet-500" />
            <ScoreBar label="Habits" icon={<Flame className="w-4 h-4 text-amber-500"/>} value={breakdown.habits} max={25} color="bg-amber-500" />
            <ScoreBar label="Sức khỏe" icon={<Heart className="w-4 h-4 text-rose-500"/>} value={breakdown.health} max={25} color="bg-rose-500" />
            <ScoreBar label="Công việc" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500"/>} value={breakdown.tasks} max={25} color="bg-emerald-500" />
          </div>
        </div>

        {/* Totals */}
        <div className="col-span-5 grid grid-cols-2 gap-4">
          <StatCard
            icon={<Clock className="w-5 h-5 text-violet-500" />}
            iconBg="bg-violet-50"
            label="Tổng Focus"
            value={`${totals.focusHours || 0}h`}
            sub={`${data?.days} ngày`}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            iconBg="bg-emerald-50"
            label="Tasks Done"
            value={totals.tasksCompleted || 0}
            sub="hoàn thành"
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            iconBg="bg-amber-50"
            label="Habit Checkins"
            value={totals.habitCheckins || 0}
            sub={`/${totals.totalHabits || 0} habits`}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            iconBg="bg-blue-50"
            label="Số dư"
            value={`${(data?.finance?.balance || 0) >= 0 ? '+' : ''}${Math.round(data?.finance?.balance || 0).toLocaleString('vi-VN')}₫`}
            sub="thu - chi"
            valueClass={(data?.finance?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-5">

        {/* Focus Bar Chart */}
        <div className="col-span-2 bg-white border border-zinc-100 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-zinc-900">Thời gian Focus</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Phút mỗi ngày</p>
            </div>
            <BarChart3 className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {series.map((d: any, i: number) => {
              const h = maxFocus > 0 ? (d.focusMinutes / maxFocus) * 100 : 0;
              const isToday = i === series.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                  >
                    {d.focusMinutes}m
                  </div>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-violet-500' : 'bg-violet-200 group-hover:bg-violet-400'}`}
                      style={{ height: `${Math.max(h, 3)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 font-medium text-center leading-tight">
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Distribution */}
        <div className="col-span-1 bg-white border border-zinc-100 shadow-sm rounded-2xl p-6">
          <h3 className="font-bold text-zinc-900 mb-1">Phân bố Project</h3>
          <p className="text-xs text-zinc-400 mb-5">Theo số task</p>
          <div className="space-y-3">
            {projectList.length === 0 ? (
              <p className="text-zinc-400 text-sm text-center py-4">Chưa có task nào</p>
            ) : (
              projectList.map(([name, count]: any, i: number) => {
                const pct = totalProjectTasks > 0 ? Math.round((count / totalProjectTasks) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-zinc-700 truncate max-w-[120px]">{name}</span>
                      <span className="font-bold text-zinc-500">{pct}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: projectColors[i % projectColors.length] }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Task Velocity + Habit Heatmap */}
      <div className="grid grid-cols-2 gap-5">

        {/* Task Velocity */}
        <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-zinc-900">Task Velocity</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Tasks hoàn thành mỗi ngày</p>
            </div>
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-end gap-2 h-28">
            {series.map((d: any, i: number) => {
              const h = maxTasks > 0 ? (d.tasksCompleted / maxTasks) * 100 : 0;
              const isToday = i === series.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {d.tasksCompleted} task
                  </div>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-emerald-500' : 'bg-emerald-200 group-hover:bg-emerald-400'}`}
                      style={{ height: `${Math.max(h, 3)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 font-medium">
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit Rate Heatmap */}
        <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-zinc-900">Habit Completion</h3>
              <p className="text-xs text-zinc-400 mt-0.5">% habits hoàn thành mỗi ngày</p>
            </div>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col gap-2">
            {series.map((d: any, i: number) => {
              const pct = d.habitRate || 0;
              const isToday = i === series.length - 1;
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <p className="text-[10px] text-zinc-400 font-medium w-14 text-right shrink-0">
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex-1 h-5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 80 ? 'bg-amber-400' : pct >= 50 ? 'bg-amber-300' : pct > 0 ? 'bg-amber-200' : 'bg-zinc-100'
                      } ${isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 w-8 shrink-0">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Health Quick View */}
      <HealthSummaryRow series={series} />

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, icon, value, max, color }: { label: string; icon: React.ReactNode; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
          {icon}
          {label}
        </div>
        <span className="text-xs font-bold text-zinc-500">{value}/{max}</span>
      </div>
      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, sub, valueClass }: {
  icon: React.ReactNode; iconBg: string; label: string; value: any; sub: string; valueClass?: string;
}) {
  return (
    <div className="bg-white border border-zinc-100 shadow-sm rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className={`text-2xl font-extrabold ${valueClass || 'text-zinc-900'}`}>{value}</p>
      <p className="text-xs text-zinc-400 font-medium">{sub}</p>
    </div>
  );
}

function HealthSummaryRow({ series }: { series: any[] }) {
  const withHealth = series.filter(d => d.health && (d.health.sleepHours || d.health.exercised || d.health.waterGlasses > 0));
  const avgSleep = withHealth.length > 0
    ? Math.round((withHealth.reduce((a: number, d: any) => a + (d.health?.sleepHours || 0), 0) / withHealth.length) * 10) / 10
    : null;
  const exercisedDays = series.filter(d => d.health?.exercised).length;
  const avgWater = withHealth.length > 0
    ? Math.round(withHealth.reduce((a: number, d: any) => a + (d.health?.waterGlasses || 0), 0) / withHealth.length)
    : null;

  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Heart className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-rose-900">Sức khoẻ tuần này</h3>
        <span className="text-xs text-rose-400 font-medium ml-auto">Điền trong tab Life OS</span>
      </div>
      {withHealth.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-rose-400 font-medium text-sm">Chưa có dữ liệu sức khỏe.</p>
          <p className="text-rose-300 text-xs mt-1">Hãy điền vào mục Health trong tab Life OS mỗi ngày để thấy analytics ở đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-black text-rose-600">{avgSleep ?? '—'}h</p>
            <p className="text-xs text-rose-500 font-semibold mt-1">💤 TB Giấc ngủ</p>
            <p className="text-xs text-rose-300 mt-0.5">Mục tiêu: 7-8h</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-rose-600">{exercisedDays}/{series.length}</p>
            <p className="text-xs text-rose-500 font-semibold mt-1">🏃 Ngày tập thể dục</p>
            <p className="text-xs text-rose-300 mt-0.5">Mục tiêu: 5/{series.length} ngày</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-rose-600">{avgWater ?? '—'}</p>
            <p className="text-xs text-rose-500 font-semibold mt-1">💧 TB Ly nước/ngày</p>
            <p className="text-xs text-rose-300 mt-0.5">Mục tiêu: 8 ly</p>
          </div>
        </div>
      )}
    </div>
  );
}
