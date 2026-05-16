import { useState, useEffect } from 'react';
import { fetchDashboardSummary } from '../lib/api';
import { Loader2, Target, CheckCircle2, Clock, Zap, Sparkles } from 'lucide-react';

export default function DashboardBoard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard summary', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const completedTasks = summary?.tasks?.completed || 0;
  const totalTasks = (summary?.tasks?.pending || 0) + completedTasks;
  const focusHours = Math.floor((summary?.focus?.todayMinutes || 0) / 60);
  const focusMins = (summary?.focus?.todayMinutes || 0) % 60;
  const focusScore = Math.min(100, Math.floor(((summary?.focus?.todayMinutes || 0) / 240) * 100)) || 0; 
  const habitsPercent = summary?.habits?.total > 0 ? Math.floor((summary?.habits?.completedToday / summary?.habits?.total) * 100) : 0;
  
  const topPriorities = summary?.tasks?.topPriorities || [];
  const aiBrief = summary?.aiBrief || "Generating insights...";

  return (
    <div className="max-w-6xl w-full flex flex-col gap-8">
      {/* Header Greeting */}
      <div>
        <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          {getGreeting()}, Hien! ☀️
        </h2>
        <p className="text-zinc-500 mt-2 text-base">
          You have {summary?.tasks?.pending || 0} important tasks and {focusHours}h {focusMins}m of deep work logged today.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard 
          title="Focus Score" 
          value={`${focusScore}%`} 
          icon={<Target className="w-5 h-5 text-emerald-500" />} 
          iconBg="bg-emerald-50" 
        />
        <MetricCard 
          title="Tasks Done" 
          value={`${completedTasks}/${totalTasks}`} 
          icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />} 
          iconBg="bg-blue-50" 
        />
        <MetricCard 
          title="Deep Work" 
          value={`${focusHours}h ${focusMins}m`} 
          icon={<Clock className="w-5 h-5 text-purple-500" />} 
          iconBg="bg-purple-50" 
        />
        <MetricCard 
          title="Habits" 
          value={`${habitsPercent}%`} 
          icon={<Zap className="w-5 h-5 text-amber-500" />} 
          iconBg="bg-amber-50" 
        />
      </div>

      {/* Lower Section Grid */}
      <div className="grid grid-cols-3 gap-8">
        
        {/* Left Col: Top Priorities */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl text-zinc-900">Top Priorities</h3>
            <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {topPriorities.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex items-center justify-center text-zinc-400 font-medium">
                No pending tasks right now. You're all caught up!
              </div>
            ) : (
              topPriorities.map((task: any) => (
                <PriorityItem 
                  key={task.id}
                  title={task.title} 
                  tag={task.project} 
                  date={task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date'} 
                  urgency={task.priority.toUpperCase()} 
                />
              ))
            )}
          </div>
        </div>

        {/* Right Col: AI Daily Brief & Balance */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* AI Daily Brief Card */}
          <div className="bg-[#F3F0FF] rounded-2xl p-6 relative overflow-hidden border border-[#E9E4FF]">
            {/* Background huge icon decoration */}
            <Zap className="absolute -right-6 -bottom-6 w-40 h-40 text-purple-200/40 transform rotate-12" strokeWidth={1} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-indigo-600 mb-4">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-lg">AI Daily Brief</h3>
              </div>
              <p className="text-indigo-900/80 text-sm leading-relaxed mb-6 font-medium">
                {aiBrief}
              </p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]">
                Start Focus Mode
              </button>
            </div>
          </div>

          {/* Balance Preview */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-zinc-900">Balance</h3>
              <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                Details
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-3xl font-extrabold text-zinc-900">${summary?.finance?.balance?.toFixed(2) || '12,450.00'}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, iconBg }: { title: string, value: string, icon: React.ReactNode, iconBg: string }) {
  return (
    <div className="bg-white border border-zinc-100 shadow-sm rounded-[20px] p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <p className="text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">{title}</p>
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-zinc-900">{value}</p>
    </div>
  );
}

function PriorityItem({ title, tag, date, urgency }: { title: string, tag: string, date: string, urgency: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-300 transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <button className="w-6 h-6 rounded-full border-2 border-zinc-200 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
          <CheckCircle2 className="w-4 h-4 text-transparent" />
        </button>
        <div>
          <h4 className="font-bold text-[15px] text-zinc-900 mb-1.5">{title}</h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
              {tag}
            </span>
            <span className="text-zinc-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {date}
            </span>
          </div>
        </div>
      </div>
      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${urgency === 'URGENT' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
        {urgency}
      </span>
    </div>
  );
}
