import { useState, useEffect } from 'react';
import { fetchHabits, createHabit, checkinHabit, summarizeJournal } from '../lib/api';
import { Plus, Check, Loader2, Sparkles } from 'lucide-react';

export default function LifeBoard() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('📖');
  const [journalEntry, setJournalEntry] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const data = await fetchHabits();
      setHabits(data);
    } catch (error) {
      console.error('Failed to load habits', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const habit = await createHabit({ title: newTitle, icon: newIcon });
      setHabits([...habits, habit]);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to create habit', error);
    }
  };

  const handleCheckin = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      // Optimistic update
      setHabits(habits.map(h => {
        if (h.id === id) {
          const dates = JSON.parse(h.completedDates);
          const newDates = dates.includes(today) ? dates.filter((d: string) => d !== today) : [...dates, today];
          return { ...h, completedDates: JSON.stringify(newDates) };
        }
        return h;
      }));
      await checkinHabit(id, today);
    } catch (error) {
      console.error('Failed to checkin habit', error);
      loadHabits(); // revert on failure
    }
  };

  const handleSummarize = async () => {
    if (!journalEntry.trim()) return;
    setSummarizing(true);
    try {
      const { summary } = await summarizeJournal(journalEntry);
      setAiSummary(summary);
    } catch (error) {
      console.error('Failed to summarize', error);
      setAiSummary('Failed to connect to AI.');
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Life & Habits</h2>
          <p className="text-zinc-500 text-sm mt-1">Build good routines, one day at a time.</p>
        </div>
        <button 
          onClick={handleSummarize}
          disabled={summarizing || !journalEntry.trim()}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-5 py-2.5 rounded-[14px] text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Journal Summary
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8 flex-1">
        
        {/* Habit Tracker */}
        <div className="col-span-2 flex flex-col">
          <h3 className="font-bold text-lg mb-4 text-zinc-900">Daily Habits</h3>
          
          <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 mb-6">
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-14 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 rounded-xl px-0 py-3 text-center text-xl outline-none transition-colors"
                maxLength={2}
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New habit (e.g., Read 10 pages)"
                className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl transition-all flex items-center justify-center shadow-sm shadow-indigo-500/20 active:scale-[0.98]">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="flex-1 bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {habits.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400 font-medium">
                  No habits tracked yet.
                </div>
              ) : (
                habits.map(habit => {
                  const dates = JSON.parse(habit.completedDates);
                  const isDoneToday = dates.includes(todayStr);
                  
                  return (
                    <div key={habit.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-zinc-300 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl bg-white border border-zinc-100 shadow-sm w-12 h-12 flex items-center justify-center rounded-xl">
                          {habit.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-[15px] text-zinc-900">{habit.title}</h4>
                          <p className="text-xs font-medium text-zinc-500 mt-0.5">Streak: <span className="text-orange-500 font-bold">{habit.streak || dates.length} days</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCheckin(habit.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDoneToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-white border-2 border-zinc-200 text-zinc-300 hover:border-emerald-300 hover:text-emerald-300'}`}
                      >
                        <Check className="w-5 h-5" strokeWidth={isDoneToday ? 3 : 2} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Mood & Journal Skeleton */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4 text-zinc-900">Today's Mood</h3>
            <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-xl border border-zinc-100">
              {['😭', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
                <button key={i} className="text-2xl hover:scale-125 transition-transform p-2 grayscale hover:grayscale-0 active:scale-95">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-zinc-900">Journal</h3>
            <textarea 
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="How was your day? AI will summarize this later..."
              className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 rounded-xl p-4 text-zinc-900 placeholder:text-zinc-400 outline-none resize-none custom-scrollbar text-sm leading-relaxed transition-colors"
            ></textarea>
            {aiSummary && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-sm font-medium text-indigo-900/80 leading-relaxed">{aiSummary}</p>
              </div>
            )}
            <button className="mt-4 w-full bg-zinc-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors">
              Save Entry
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
