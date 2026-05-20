import { useState, useEffect, useRef } from 'react';
import { fetchFocusSessions, startFocusSession, completeFocusSession } from '../lib/api';
import { Play, Pause, SkipForward, Music, Maximize2, Minimize2, Volume2, VolumeX, Youtube, Leaf } from 'lucide-react';

type FocusMode = 'pomodoro' | 'deepwork' | 'short_break' | 'custom';

// ─── Cute Mushroom SVG ───────────────────────────────────────────────────────
const CuteMushroom = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 220 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="110" cy="188" rx="55" ry="12" fill="#000" opacity="0.12" />
    <path d="M82 105 C75 130, 73 165, 92 182 C103 192, 125 192, 137 181 C154 165, 146 130, 139 105 Z" fill="#FFE8C7" stroke="#5B3A29" strokeWidth="5" />
    <circle cx="91" cy="145" r="8" fill="#FFB6B6" opacity="0.7" />
    <circle cx="132" cy="145" r="8" fill="#FFB6B6" opacity="0.7" />
    <circle cx="98" cy="132" r="5" fill="#3A251B" />
    <circle cx="123" cy="132" r="5" fill="#3A251B" />
    <path d="M104 148 C109 153, 116 153, 121 148" stroke="#3A251B" strokeWidth="4" strokeLinecap="round" />
    <path d="M35 104 C39 55, 75 28, 111 28 C151 28, 184 58, 187 105 C158 119, 72 119, 35 104 Z" fill="#FF5A5F" stroke="#5B3A29" strokeWidth="5" />
    <path d="M42 103 C70 116, 150 116, 180 104 C168 129, 59 129, 42 103 Z" fill="#FFD6A5" stroke="#5B3A29" strokeWidth="5" />
    <circle cx="79" cy="68" r="14" fill="#FFF4D8" />
    <circle cx="117" cy="55" r="11" fill="#FFF4D8" />
    <circle cx="148" cy="80" r="16" fill="#FFF4D8" />
    <circle cx="61" cy="96" r="8" fill="#FFF4D8" />
    <circle cx="112" cy="91" r="9" fill="#FFF4D8" />
    <path d="M72 48 C88 36, 106 34, 120 36" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
  </svg>
);

// ─── Floating Island ─────────────────────────────────────────────────────────
const FloatingIsland = ({ hasMushroom, isGrowing }: { hasMushroom: boolean; isGrowing?: boolean }) => (
  <div className="w-20 h-20 relative transform hover:-translate-y-1 transition-transform">
    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
      <polygon points="50,30 90,50 50,70 10,50" fill="#81C784" />
      <polygon points="50,30 90,50 50,70 10,50" fill="none" stroke="#66BB6A" strokeWidth="1" />
      <polygon points="10,50 50,70 50,85 10,65" fill="#8D6E63" />
      <polygon points="50,70 90,50 90,65 50,85" fill="#795548" />
      <path d="M 10 50 Q 20 55 30 52 Q 40 58 50 70" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <path d="M 50 70 Q 60 58 70 52 Q 80 55 90 50" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
    </svg>
    {hasMushroom && (
      <div className="absolute inset-0 flex items-center justify-center -translate-y-4">
        <CuteMushroom className="w-10 h-10" />
      </div>
    )}
    {isGrowing && !hasMushroom && (
      <div className="absolute inset-0 flex items-center justify-center -translate-y-3">
        <div className="text-lg animate-bounce">🌱</div>
      </div>
    )}
  </div>
);

// ─── Ambient Sounds ───────────────────────────────────────────────────────────
const AMBIENT_SOUNDS = [
  { id: 'none',    label: 'Không',    emoji: '🔇', url: null },
  { id: 'rain',    label: 'Mưa rơi', emoji: '🌧️', url: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3' },
  { id: 'fire',    label: 'Lửa đốt', emoji: '🔥', url: 'https://assets.mixkit.co/active_storage/sfx/1234/1234-preview.mp3' },
  { id: 'ocean',   label: 'Sóng biển', emoji: '🌊', url: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' },
  { id: 'forest',  label: 'Rừng cây', emoji: '🌲', url: 'https://assets.mixkit.co/active_storage/sfx/2517/2517-preview.mp3' },
  { id: 'wind',    label: 'Gió thổi', emoji: '💨', url: 'https://assets.mixkit.co/active_storage/sfx/2516/2516-preview.mp3' },
  { id: 'white',   label: 'White Noise', emoji: '📻', url: 'https://assets.mixkit.co/active_storage/sfx/2520/2520-preview.mp3' },
  { id: 'coffee',  label: 'Quán cà phê', emoji: '☕', url: 'https://assets.mixkit.co/active_storage/sfx/2522/2522-preview.mp3' },
];

export default function FocusBoard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState('15');
  const [sessionGoal, setSessionGoal] = useState('');

  // Âm thanh
  const [selectedSound, setSelectedSound] = useState('none');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // YouTube
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [youtubePlaylist, setYoutubePlaylist] = useState<string[]>([]);
  const [currentYtIndex, setCurrentYtIndex] = useState(0);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchFocusSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load focus sessions', error);
    }
  };

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  // Mode change reset
  useEffect(() => {
    if (!isActive) {
      const t = mode === 'pomodoro' ? 25 * 60
        : mode === 'deepwork' ? 50 * 60
        : mode === 'short_break' ? 5 * 60
        : parseInt(customMinutes || '1') * 60;
      setTimeLeft(t);
      setTotalTime(t);
    }
  }, [mode, isActive, customMinutes]);

  // Ambient sound control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const sound = AMBIENT_SOUNDS.find(s => s.id === selectedSound);
    if (sound?.url) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = soundVolume;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    return () => { audioRef.current?.pause(); };
  }, [selectedSound]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = soundVolume;
  }, [soundVolume]);

  // Fullscreen API
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && fullscreenRef.current) {
      await fullscreenRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleStart = async () => {
    if (!sessionId) {
      try {
        const session = await startFocusSession({ mode, duration: totalTime });
        setSessionId(session.id);
      } catch {}
    }
    setIsActive(true);
  };

  const handlePause = () => setIsActive(false);
  const handleSkip = () => { setIsActive(false); setSessionId(null); setTimeLeft(totalTime); };

  const handleComplete = async () => {
    setIsActive(false);
    if (sessionId) {
      try {
        await completeFocusSession(sessionId);
        loadSessions();
      } catch {}
    }
    setSessionId(null);
    setTimeLeft(totalTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = youtubeInput.split('\n').map(s => s.trim()).filter(Boolean);
    const ids = urls.map(extractYouTubeId).filter(Boolean) as string[];
    if (ids.length > 0) {
      setYoutubePlaylist(ids);
      setCurrentYtIndex(0);
      setYoutubeId(ids[0]);
      setYoutubeInput('');
    } else {
      alert('Vui lòng nhập link YouTube hợp lệ (mỗi link 1 dòng)!');
    }
  };

  const playNext = () => {
    if (youtubePlaylist.length > 1) {
      const next = (currentYtIndex + 1) % youtubePlaylist.length;
      setCurrentYtIndex(next);
      setYoutubeId(youtubePlaylist[next]);
    }
  };

  const playPrev = () => {
    if (youtubePlaylist.length > 1) {
      const prev = (currentYtIndex - 1 + youtubePlaylist.length) % youtubePlaylist.length;
      setCurrentYtIndex(prev);
      setYoutubeId(youtubePlaylist[prev]);
    }
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  // 9 ô đất cố định (3×3)
  const mushroomCount = sessions.filter((s: any) => s.completedAt).length;
  const TOTAL_PLOTS = 9;
  const farmGrid = Array.from({ length: TOTAL_PLOTS }).map((_, i) => ({
    hasMushroom: i < mushroomCount,
    isGrowing: i === mushroomCount && isActive,
  }));

  const currentSoundEmoji = AMBIENT_SOUNDS.find(s => s.id === selectedSound)?.emoji || '🔇';

  return (
    <div
      ref={fullscreenRef}
      className={`w-full h-full flex flex-col md:flex-row overflow-hidden rounded-xl shadow-xl font-sans ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''}`}
    >
      {/* ── LEFT: TIMER ───────────────────────────────────────── */}
      <main className="flex-1 bg-gradient-to-br from-[#4a9985] to-[#2d7a63] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-10"
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        <h1 className="text-2xl font-bold mb-1 tracking-wide text-white/90">
          {isActive ? '🍄 Đang trồng nấm...' : '🌱 Bắt đầu trồng nấm!'}
        </h1>
        <p className="text-white/60 text-sm mb-4">Tập trung để ươm mầm một cây nấm mới</p>

        {/* Session Goal */}
        {!isActive ? (
          <div className="w-full max-w-sm mb-4">
            <input
              type="text"
              value={sessionGoal}
              onChange={e => setSessionGoal(e.target.value)}
              placeholder="🎯 Mục tiêu session (tùy chọn)..."
              className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
            />
          </div>
        ) : sessionGoal ? (
          <div className="mb-4 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
            <p className="text-xs text-white/60 font-medium">🎯 Mục tiêu</p>
            <p className="text-sm text-white font-semibold">{sessionGoal}</p>
          </div>
        ) : null}

        {/* Mode Selector */}
        <div className="flex items-center gap-1 mb-6 bg-black/20 p-1 rounded-full">
          {([['pomodoro','🍅 25m'], ['deepwork','🧠 50m'], ['short_break','☕ 5m'], ['custom','⚙️']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={isActive}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${mode === m ? 'bg-white text-[#4a9985] shadow-md' : 'text-white/70 hover:text-white'} ${isActive ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'custom' && !isActive && (
          <div className="mb-4 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl">
            <input
              type="text"
              value={customMinutes}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) setCustomMinutes(e.target.value); }}
              className="w-14 text-center bg-transparent border-b-2 border-white/60 text-xl font-bold text-white outline-none"
            />
            <span className="text-white/70 text-sm">phút</span>
          </div>
        )}

        {/* Timer Circle */}
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r={radius}
              fill="transparent"
              stroke="#A3D95D"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <div
              className="relative mb-1 transition-transform duration-1000"
              style={{ transform: `scale(${isActive ? 1 - (timeLeft / totalTime) * 0.3 : 1})` }}
            >
              <CuteMushroom className={`w-20 h-20 ${isActive ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        <div className="text-5xl font-black tracking-widest text-white mb-6 drop-shadow-lg">
          {formatTime(timeLeft)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          {!isActive ? (
            <button onClick={handleStart} className="w-14 h-14 rounded-full bg-white text-[#4a9985] flex items-center justify-center hover:scale-105 transition-transform shadow-lg border-b-4 border-black/10 active:border-b-0 active:translate-y-1">
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            </button>
          ) : (
            <button onClick={handlePause} className="w-14 h-14 rounded-full bg-white text-[#4a9985] flex items-center justify-center hover:scale-105 transition-transform shadow-lg border-b-4 border-black/10 active:border-b-0 active:translate-y-1">
              <Pause className="w-6 h-6" fill="currentColor" />
            </button>
          )}
          <button onClick={handleSkip} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* ── AMBIENT SOUND PANEL ── */}
        <div className="w-full max-w-sm bg-black/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Tiếng ambient</span>
            </div>
            <div className="flex items-center gap-1.5">
              <VolumeX className="w-3 h-3 text-white/50" />
              <input
                type="range" min="0" max="1" step="0.05"
                value={soundVolume}
                onChange={e => setSoundVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-white cursor-pointer"
              />
              <Volume2 className="w-3 h-3 text-white/50" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {AMBIENT_SOUNDS.map(sound => (
              <button
                key={sound.id}
                onClick={() => setSelectedSound(sound.id === selectedSound ? 'none' : sound.id)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all
                  ${selectedSound === sound.id ? 'bg-white text-[#4a9985] shadow-md' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}
                `}
              >
                <span className="text-base leading-none">{sound.emoji}</span>
                <span className="leading-none">{sound.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* ── RIGHT: FARM + MUSIC ───────────────────────────────── */}
      <aside className="w-full md:w-[380px] bg-[#FDF5D3] flex flex-col border-l-4 border-[#F0E5B5] overflow-hidden">

        {/* Farm Header */}
        <div className="text-center pt-5 pb-3 px-6 border-b border-[#F0E5B5]">
          <h2 className="text-xl font-bold text-[#8D6E63]">🌾 Nông Trại Nấm</h2>
          <p className="text-[#A1887F] text-xs font-medium mt-0.5">Đã thu hoạch: {mushroomCount}/9 🍄</p>
        </div>

        {/* 3×3 Farm Grid */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="grid grid-cols-3 gap-2">
            {farmGrid.map((plot, idx) => (
              <FloatingIsland key={idx} hasMushroom={plot.hasMushroom} isGrowing={plot.isGrowing} />
            ))}
          </div>
        </div>

        {/* ── MUSIC SECTION ── */}
        <div className="border-t border-[#F0E5B5] bg-white/50 p-4 flex flex-col gap-3 shrink-0">

          {/* YouTube Player */}
          {youtubeId ? (
            <div className="rounded-xl overflow-hidden border border-[#F0E5B5] shadow-sm">
              <div className="w-full aspect-video bg-black relative">
                <iframe
                  key={youtubeId}
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title="YouTube"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              {/* Playlist controls */}
              <div className="bg-[#FFF8E1] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {youtubePlaylist.length > 1 && (
                    <>
                      <button onClick={playPrev} className="text-[#8D6E63] hover:text-[#5D4037] text-xs font-bold">◀</button>
                      <span className="text-[10px] text-[#A1887F] font-medium">{currentYtIndex + 1}/{youtubePlaylist.length}</span>
                      <button onClick={playNext} className="text-[#8D6E63] hover:text-[#5D4037] text-xs font-bold">▶</button>
                    </>
                  )}
                  <span className="text-[10px] font-bold text-[#8D6E63]">🎶 Đang phát</span>
                </div>
                <button onClick={() => { setYoutubeId(null); setYoutubePlaylist([]); }} className="text-[10px] text-[#FF7043] font-bold hover:underline">
                  Đổi nhạc
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#F0E5B5] p-3">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-[#8D6E63]">YouTube / Playlist</span>
              </div>
              <p className="text-[10px] text-[#A1887F] mb-2 leading-relaxed">
                Dán 1 link hoặc nhiều link (mỗi dòng 1 link) để tạo playlist nhạc tự động.
              </p>
              <form onSubmit={handleYoutubeSubmit} className="flex flex-col gap-2">
                <textarea
                  value={youtubeInput}
                  onChange={e => setYoutubeInput(e.target.value)}
                  placeholder={"https://youtu.be/...\nhttps://youtu.be/..."}
                  rows={2}
                  className="w-full bg-zinc-50 border border-[#F0E5B5] rounded-xl px-3 py-2 text-xs text-[#5D4037] outline-none focus:border-[#FF7043] resize-none"
                />
                <button type="submit" className="bg-[#FF7043] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#F4511E] transition-colors shadow-sm flex items-center justify-center gap-1.5">
                  <Music className="w-3.5 h-3.5" /> Phát nhạc
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
