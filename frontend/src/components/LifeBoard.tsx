import { useState, useEffect } from 'react';
import { fetchHabits, createHabit, checkinHabit, deleteHabit, summarizeJournal, fetchHealthToday, upsertHealthToday } from '../lib/api';
import { Plus, Check, Loader2, Sparkles, Heart, Droplets, Dumbbell, Moon, Zap, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function LifeBoard() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('📖');
  const [journalEntry, setJournalEntry] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  // Health state
  const [health, setHealth] = useState({ sleepHours: '', waterGlasses: 0, exercised: false, energyLevel: 0 });
  const [healthSaving, setHealthSaving] = useState(false);
  const [healthSaved, setHealthSaved] = useState(false);

  useEffect(() => {
    loadHabits();
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await fetchHealthToday();
      setHealth({
        sleepHours: data.sleepHours?.toString() || '',
        waterGlasses: data.waterGlasses || 0,
        exercised: data.exercised || false,
        energyLevel: data.energyLevel || 0,
      });
    } catch (e) { /* silent */ }
  };

  const handleSaveHealth = async () => {
    setHealthSaving(true);
    try {
      await upsertHealthToday({
        sleepHours: health.sleepHours ? parseFloat(health.sleepHours) : undefined,
        waterGlasses: health.waterGlasses,
        exercised: health.exercised,
        energyLevel: health.energyLevel || undefined,
      });
      setHealthSaved(true);
      setTimeout(() => setHealthSaved(false), 2000);
    } catch (e) { console.error('Health save failed', e); }
    finally { setHealthSaving(false); }
  };

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
      loadHabits();
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!window.confirm('Xóa habit này?')) return;
    try {
      await deleteHabit(id);
      setHabits(habits.filter(h => h.id !== id));
    } catch (e) { console.error(e); }
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
                  const isExpanded = expandedHabit === habit.id;

                  // Build last 30 days streak grid
                  const last30 = Array.from({ length: 30 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    const s = d.toISOString().split('T')[0];
                    return { s, done: dates.includes(s) };
                  });

                  return (
                    <div key={habit.id} className="bg-zinc-50 border border-zinc-100 rounded-xl hover:border-zinc-200 transition-all">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl bg-white border border-zinc-100 shadow-sm w-12 h-12 flex items-center justify-center rounded-xl">
                            {habit.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-[15px] text-zinc-900">{habit.title}</h4>
                            <p className="text-xs font-medium text-zinc-500 mt-0.5">Streak: <span className="text-orange-500 font-bold">{habit.streak || dates.length} days</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Xem lịch streak"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa habit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCheckin(habit.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDoneToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-white border-2 border-zinc-200 text-zinc-300 hover:border-emerald-300 hover:text-emerald-300'}`}
                          >
                            <Check className="w-5 h-5" strokeWidth={isDoneToday ? 3 : 2} />
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-zinc-100 pt-3">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">30 ngày gần nhất</p>
                          <div className="flex gap-1 flex-wrap">
                            {last30.map(({ s, done }) => (
                              <div
                                key={s}
                                title={s}
                                className={`w-5 h-5 rounded-sm transition-colors ${
                                  done ? 'bg-emerald-400' : 'bg-zinc-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Health Tracker + Journal */}
        <div className="col-span-1 flex flex-col gap-5">

          {/* Health Tracker Card */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 shadow-sm rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-base text-rose-900">Sức khoẻ hôm nay</h3>
            </div>

            <div className="space-y-4">
              {/* Sleep */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <label className="text-xs font-semibold text-zinc-600">Giờ ngủ</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0" max="12" step="0.5"
                    value={health.sleepHours}
                    onChange={e => setHealth(h => ({ ...h, sleepHours: e.target.value }))}
                    placeholder="7.5"
                    className="w-20 bg-white border border-rose-200 focus:border-rose-400 rounded-lg px-3 py-1.5 text-sm font-bold text-zinc-900 outline-none"
                  />
                  <span className="text-xs text-zinc-400 font-medium">giờ</span>
                  <div className="flex-1 h-1.5 bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (parseFloat(health.sleepHours || '0') / 9) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Water */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-xs font-semibold text-zinc-600">Nước uống</label>
                  <span className="ml-auto text-xs font-bold text-blue-500">{health.waterGlasses}/8 ly</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHealth(h => ({ ...h, waterGlasses: i < h.waterGlasses ? i : i + 1 }))}
                      className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${
                        i < health.waterGlasses
                          ? 'bg-blue-400 text-white shadow-sm'
                          : 'bg-white border border-rose-200 text-zinc-300 hover:border-blue-300'
                      }`}
                    >
                      💧
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                  <label className="text-xs font-semibold text-zinc-600">Tập thể dục</label>
                </div>
                <button
                  onClick={() => setHealth(h => ({ ...h, exercised: !h.exercised }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    health.exercised ? 'bg-emerald-500' : 'bg-zinc-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    health.exercised ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

            </div>

            <button
              onClick={handleSaveHealth}
              disabled={healthSaving}
              className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                healthSaved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 active:scale-[0.98]'
              }`}
            >
              {healthSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : healthSaved ? '✓ Đã lưu!' : 'Lưu sức khoẻ'}
            </button>
          </div>

          {/* Mood Tracker */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
            <h3 className="font-bold text-base text-zinc-900 mb-3">Tâm trạng hôm nay</h3>
            <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-xl border border-zinc-100">
              {['😭', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setHealth(h => ({ ...h, energyLevel: i + 1 }))}
                  className={`text-2xl hover:scale-125 transition-transform p-2 ${
                    health.energyLevel === i + 1 ? 'grayscale-0 scale-125 bg-white shadow-sm rounded-lg border border-zinc-200' : 'grayscale hover:grayscale-0 active:scale-95'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Journal */}
          <div className="flex-1 bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-zinc-900">Journal</h3>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="Hôm nay bạn cảm thấy thế nào? AI sẽ tóm tắt cho bạn..."
              className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 rounded-xl p-4 text-zinc-900 placeholder:text-zinc-400 outline-none resize-none custom-scrollbar text-sm leading-relaxed transition-colors min-h-[120px]"
            />
            {aiSummary && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-sm font-medium text-indigo-900/80 leading-relaxed">{aiSummary}</p>
              </div>
            )}
            <button
              onClick={handleSummarize}
              disabled={summarizing || !journalEntry.trim()}
              className="mt-3 w-full bg-zinc-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Journal Summary
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
