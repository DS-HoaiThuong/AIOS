import { useState, useEffect } from 'react';
import { fetchFocusSessions } from '../lib/api';
import PomodoroTimer from './PomodoroTimer';
import { Loader2, TrendingUp, Clock, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FocusBoard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchFocusSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load focus sessions', error);
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

  // Calculate statistics
  const totalMinutes = sessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  // Format for chart: group by day of week
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  // Initialize chart data for the last 7 days
  const chartDataMap = new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    chartDataMap.set(dateStr, {
      name: i === 0 ? 'Today' : days[d.getDay()],
      date: dateStr,
      minutes: 0
    });
  }

  // Populate with actual data
  sessions.forEach(session => {
    const sessionDate = new Date(session.startedAt);
    const dateStr = sessionDate.toISOString().split('T')[0];
    if (chartDataMap.has(dateStr)) {
      const data = chartDataMap.get(dateStr);
      data.minutes += Math.floor(session.duration / 60);
    }
  });

  const chartData = Array.from(chartDataMap.values());

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Focus & Deep Work</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage your time and track your concentration.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 text-zinc-500 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-medium text-sm tracking-wide uppercase">Focus Time (Last 7 Days)</h3>
          </div>
          <div className="flex-1 h-64 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip 
                  cursor={{ fill: '#F4F4F5' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E4E4E7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#18181B', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Today' ? '#6366F1' : '#C7D2FE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <Clock className="w-5 h-5" />
              <h3 className="font-medium text-sm tracking-wide uppercase">Total Deep Work</h3>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold text-indigo-900">{totalHours}</span>
              <span className="text-lg font-bold text-indigo-700">h</span>
              <span className="text-4xl font-extrabold text-indigo-900 ml-2">{remainingMinutes}</span>
              <span className="text-lg font-bold text-indigo-700">m</span>
            </div>
            <p className="text-sm font-medium text-indigo-500/80 mt-2">All time focus tracked</p>
          </div>
          
          <PomodoroTimer />
        </div>
      </div>

      <div className="flex-1 bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-zinc-900">Recent Sessions</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-400 font-medium">
              No focus sessions yet. Start the Pomodoro timer!
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.slice(0, 10).map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-zinc-900 capitalize mb-0.5">{session.mode} Session</p>
                      <p className="text-xs font-medium text-zinc-500">
                        {new Date(session.startedAt).toLocaleDateString()} at {new Date(session.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold">
                      {Math.floor(session.duration / 60)} min
                    </span>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${session.completedAt ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {session.completedAt ? 'completed' : 'in-progress'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
