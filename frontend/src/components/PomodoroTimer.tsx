import { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Hourglass, Settings2 } from 'lucide-react';
import { startFocusSession, completeFocusSession } from '../lib/api';

type FocusMode = 'pomodoro' | 'deepwork' | 'break' | 'custom';

export default function PomodoroTimer() {
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Custom mode state
  const [customMinutes, setCustomMinutes] = useState<string>('15');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set time based on mode
  useEffect(() => {
    if (!isActive) {
      if (mode === 'pomodoro') setTimeLeft(25 * 60);
      else if (mode === 'deepwork') setTimeLeft(50 * 60);
      else if (mode === 'break') setTimeLeft(5 * 60);
      else if (mode === 'custom') setTimeLeft(parseInt(customMinutes || '1') * 60);
    }
  }, [mode, isActive, customMinutes]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleStart = async () => {
    if (mode === 'custom' && (!customMinutes || parseInt(customMinutes) <= 0)) {
      alert("Please enter a valid time for custom mode.");
      return;
    }

    let initialDuration = 0;
    if (mode === 'pomodoro') initialDuration = 25 * 60;
    else if (mode === 'deepwork') initialDuration = 50 * 60;
    else if (mode === 'break') initialDuration = 5 * 60;
    else if (mode === 'custom') initialDuration = parseInt(customMinutes) * 60;

    if (!sessionId) {
      try {
        const session = await startFocusSession({ mode, duration: initialDuration });
        setSessionId(session.id);
      } catch (error) {
        console.error('Failed to start session', error);
      }
    }
    setIsActive(true);
    setIsEditingCustom(false);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setSessionId(null);
    // Reset timer visually based on current mode
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    else if (mode === 'deepwork') setTimeLeft(50 * 60);
    else if (mode === 'break') setTimeLeft(5 * 60);
    else if (mode === 'custom') setTimeLeft(parseInt(customMinutes || '1') * 60);
  };

  const handleComplete = async () => {
    setIsActive(false);
    if (sessionId) {
      try {
        await completeFocusSession(sessionId);
        const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
        alert(`${modeLabel} session completed! Great job.`);
      } catch (error) {
        console.error('Failed to complete session', error);
      }
    }
    setSessionId(null);
    
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    else if (mode === 'deepwork') setTimeLeft(50 * 60);
    else if (mode === 'break') setTimeLeft(5 * 60);
    else if (mode === 'custom') setTimeLeft(parseInt(customMinutes || '1') * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCustomMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCustomMinutes(val);
      if (!isActive) {
        setTimeLeft((parseInt(val) || 0) * 60);
      }
    }
  };

  const getModeColor = (currentMode: FocusMode) => {
    switch(currentMode) {
      case 'pomodoro': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'deepwork': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'break': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'custom': return 'text-zinc-600 bg-zinc-100 border-zinc-200';
      default: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    }
  };

  const currentModeColor = getModeColor(mode);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col items-center shadow-sm">
      <div className="flex items-center gap-2 text-zinc-500 mb-6">
        <Hourglass className="w-5 h-5 text-indigo-500" />
        <span className="text-sm font-bold uppercase tracking-widest text-zinc-600">Focus Timer</span>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button 
          disabled={isActive}
          onClick={() => setMode('pomodoro')} 
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === 'pomodoro' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'} ${isActive && 'opacity-50 cursor-not-allowed'}`}
        >
          Pomodoro (25m)
        </button>
        <button 
          disabled={isActive}
          onClick={() => setMode('deepwork')} 
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === 'deepwork' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'} ${isActive && 'opacity-50 cursor-not-allowed'}`}
        >
          Deepwork (50m)
        </button>
        <button 
          disabled={isActive}
          onClick={() => setMode('break')} 
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === 'break' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'} ${isActive && 'opacity-50 cursor-not-allowed'}`}
        >
          Break (5m)
        </button>
        <button 
          disabled={isActive}
          onClick={() => setMode('custom')} 
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${mode === 'custom' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'} ${isActive && 'opacity-50 cursor-not-allowed'}`}
        >
          <Settings2 className="w-3 h-3" /> Custom
        </button>
      </div>

      {/* Custom Time Input (Only visible when Custom mode is selected and not active) */}
      {mode === 'custom' && !isActive && (
        <div className="mb-4 flex items-center gap-2">
          <input 
            ref={inputRef}
            type="text" 
            value={customMinutes} 
            onChange={handleCustomMinuteChange} 
            className="w-16 text-center bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900"
            placeholder="Min"
          />
          <span className="text-sm font-medium text-zinc-500">phút</span>
        </div>
      )}

      {/* Timer Display */}
      <div className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center mb-8 shadow-sm transition-colors ${currentModeColor.replace('text-', 'border-').split(' ')[2]}`}>
        <div className={`text-5xl font-mono font-extrabold tracking-wider ${currentModeColor.split(' ')[0]}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-2">
          {mode}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {!isActive ? (
          <button onClick={handleStart} className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center transition-all shadow-md active:scale-95">
            <Play className="w-6 h-6 ml-1" fill="currentColor" />
          </button>
        ) : (
          <button onClick={handlePause} className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-all shadow-md active:scale-95">
            <Pause className="w-6 h-6" fill="currentColor" />
          </button>
        )}
        <button onClick={handleStop} disabled={!isActive && !sessionId && timeLeft === (mode === 'pomodoro' ? 25*60 : mode === 'deepwork' ? 50*60 : mode === 'break' ? 5*60 : parseInt(customMinutes||'0')*60)} className="w-12 h-12 rounded-full bg-white border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 text-zinc-400 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95">
          <Square className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
