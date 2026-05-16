import { useState, useEffect } from 'react';
import { Play, Square, Pause, Hourglass } from 'lucide-react';
import { startFocusSession, completeFocusSession } from '../lib/api';

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleStart = async () => {
    if (!sessionId) {
      try {
        const session = await startFocusSession({ mode: 'pomodoro', duration: 25 * 60 });
        setSessionId(session.id);
      } catch (error) {
        console.error('Failed to start session', error);
      }
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setSessionId(null);
  };

  const handleComplete = async () => {
    setIsActive(false);
    if (sessionId) {
      try {
        await completeFocusSession(sessionId);
        alert('Pomodoro completed! Great job.');
      } catch (error) {
        console.error('Failed to complete session', error);
      }
    }
    setTimeLeft(25 * 60);
    setSessionId(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col items-center shadow-sm">
      <div className="flex items-center gap-2 text-zinc-500 mb-3">
        <Hourglass className="w-4 h-4 text-indigo-500" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">Pomodoro</span>
      </div>
      <div className="text-4xl font-mono font-extrabold text-zinc-900 tracking-wider mb-5">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center gap-4">
        {!isActive ? (
          <button onClick={handleStart} className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center transition-all shadow-md active:scale-95">
            <Play className="w-5 h-5 ml-1" fill="currentColor" />
          </button>
        ) : (
          <button onClick={handlePause} className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-all shadow-md active:scale-95">
            <Pause className="w-5 h-5" fill="currentColor" />
          </button>
        )}
        <button onClick={handleStop} disabled={timeLeft === 25 * 60} className="w-12 h-12 rounded-full bg-white border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 text-zinc-400 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95">
          <Square className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
