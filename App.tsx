import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Music, Volume2, VolumeX, Sliders, CloudRain, Wind, Bird, Zap, Repeat, Palette, Clock, X, Settings, RotateCcw, Sparkles, HelpCircle, Droplets, Flame, Waves, Bug, BookOpen } from 'lucide-react';
import { Note, RainDrop, Ripple, Song, RecordedNote, AmbienceType, AmbienceConfig, Theme, SoundType, NoteParticle } from './types';
import { NOTES, THEMES, GRAVITY_SPEED, PAD_Y_PERCENT, DEMO_SONGS, TWINKLE_MELODY_IDS } from './constants';
import { audioEngine } from './services/audioEngine';
import RainVisualizer from './components/RainVisualizer';

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hasStarted, setHasStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<NoteParticle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<RecordedNote[]>([]);
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [currentSongTitle, setCurrentSongTitle] = useState("");
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizeNotes, setVisualizeNotes] = useState(true);
  const [rainDensity, setRainDensity] = useState(0); // デフォルト 0%
  const [showMixer, setShowMixer] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showSongs, setShowSongs] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [hitNote, setHitNote] = useState<string | null>(null);
  const [currentSoundType, setCurrentSoundType] = useState<SoundType>('Crystal');

  // Practice Mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceStep, setPracticeStep] = useState(0);

  const [ambience, setAmbience] = useState<Record<AmbienceType, AmbienceConfig>>({
    rain: { active: true, volume: 0.3 }, // STORM デフォルト 30%
    wind: { active: false, volume: 0.3 },
    birds: { active: false, volume: 0.3 },
    thunder: { active: false, volume: 0.6 },
    ocean: { active: false, volume: 0.4 },
    fire: { active: false, volume: 0.3 },
    crickets: { active: false, volume: 0.2 },
  });
  
  const requestRef = useRef<number>();
  const playbackRef = useRef<{ active: boolean, isDemo: boolean, startTime: number, notes: RecordedNote[], nextIndex: number, duration: number }>({
    active: false, isDemo: false, startTime: 0, notes: [], nextIndex: 0, duration: 0
  });

  useEffect(() => {
    const tutorialSeen = localStorage.getItem('raindrum_tutorial_seen');
    if (!tutorialSeen && hasStarted) {
      setShowTutorial(true);
      localStorage.setItem('raindrum_tutorial_seen', 'true');
    }
  }, [hasStarted]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setElapsedTime(Date.now() - recordingStartTime);
      }, 100);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  useEffect(() => {
    if (!hasStarted || rainDensity === 0) return;
    const intervalTime = Math.max(300, 3000 - (rainDensity * 2700));
    const timer = setInterval(() => {
      const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)];
      spawnDrop(randomNote.id, false);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [hasStarted, rainDensity]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem('raindrum_songs');
    if (saved) {
      try { setSavedSongs(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startExperience = async () => {
    audioEngine.init();
    await audioEngine.resume();
    (Object.keys(ambience) as AmbienceType[]).forEach((type) => {
      audioEngine.setAmbience(type, ambience[type].active, ambience[type].volume);
    });
    setHasStarted(true);
  };

  const handleInteraction = useCallback(async () => {
    await audioEngine.resume();
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    (Object.keys(ambience) as AmbienceType[]).forEach(t => {
      audioEngine.setAmbience(t, nextMuted ? false : ambience[t].active, nextMuted ? 0 : ambience[t].volume);
    });
  };

  const updateAmbience = (type: AmbienceType, changes: Partial<AmbienceConfig>) => {
    setAmbience(prev => {
      const newConfig = { ...prev[type], ...changes };
      if (!isMuted) audioEngine.setAmbience(type, newConfig.active, newConfig.volume);
      return { ...prev, [type]: newConfig };
    });
  };

  const handleHit = useCallback((noteId: string, x: number, y: number) => {
    const note = NOTES.find(n => n.id === noteId);
    if (note && !isMuted) {
      audioEngine.playTone(note.frequency, currentSoundType);
      setHitNote(noteId);
      setTimeout(() => setHitNote(prev => prev === noteId ? null : prev), 250);

      if (visualizeNotes) {
        const symbols = ['♩', '♪', '♫', '♬'];
        const burst: NoteParticle[] = [];
        burst.push({
          id: Math.random().toString(36),
          x: x,
          y: y - 10,
          text: symbols[Math.floor(Math.random() * symbols.length)],
          opacity: 1,
          velocity: 1 + Math.random()
        });
        for (let i = 0; i < 4; i++) {
          burst.push({
            id: Math.random().toString(36),
            x: x + (Math.random() * 60 - 30),
            y: y + (Math.random() * 20 - 10),
            text: '',
            opacity: 1,
            velocity: 0.8 + Math.random() * 1.5
          });
        }
        setParticles(prev => [...prev, ...burst]);
      }
    }

    setRipples(prev => [...prev, {
        id: Math.random().toString(36),
        x: x, y: y, size: 14, opacity: 1.0,
        color: currentTheme.accentColor 
    }]);

    // Practice Mode Progress
    if (isPracticeMode && noteId === TWINKLE_MELODY_IDS[practiceStep]) {
        if (practiceStep < TWINKLE_MELODY_IDS.length - 1) {
            setPracticeStep(s => s + 1);
        } else {
            // Completed!
            const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
            const completionParticles: NoteParticle[] = [];
            for (let i = 0; i < 30; i++) {
                completionParticles.push({
                    id: Math.random().toString(36),
                    x: center.x + (Math.random() * 400 - 200),
                    y: center.y + (Math.random() * 400 - 200),
                    text: '★',
                    opacity: 1,
                    velocity: 0.5 + Math.random() * 2
                });
            }
            setParticles(prev => [...prev, ...completionParticles]);
            setIsPracticeMode(false);
            setPracticeStep(0);
        }
    }
  }, [isMuted, currentTheme, currentSoundType, visualizeNotes, isPracticeMode, practiceStep, dimensions]);

  const spawnDrop = async (noteId: string, shouldRecord = true) => {
    await handleInteraction();
    setActiveNote(noteId);
    setTimeout(() => setActiveNote(null), 150);

    const note = NOTES.find(n => n.id === noteId);
    if (!note) return;

    const startX = (dimensions.width * note.cloudLeft) / 100;
    const startY = -60 - Math.random() * 40;
    const targetY = (dimensions.height * PAD_Y_PERCENT) / 100;
    
    setDrops(prev => [...prev, {
      id: Math.random().toString(36),
      noteId: note.id,
      x: startX,
      y: startY,
      speed: GRAVITY_SPEED + (Math.random() * 2),
      targetY: targetY,
      hasHit: false,
      opacity: 1
    }]);

    if (isRecording && shouldRecord) {
      setCurrentRecording(prev => [...prev, { timestamp: Date.now() - recordingStartTime, noteId }]);
    }
  };

  const animate = (time: number) => {
    setDrops(prevDrops => {
      const nextDrops: RainDrop[] = [];
      prevDrops.forEach(drop => {
        const newY = drop.y + drop.speed;
        if (!drop.hasHit && newY >= drop.targetY) {
          handleHit(drop.noteId, drop.x, drop.targetY);
          nextDrops.push({ ...drop, hasHit: true, y: drop.targetY });
        } else if (!drop.hasHit && newY < dimensions.height + 100) {
          nextDrops.push({ ...drop, y: newY });
        }
      });
      return nextDrops;
    });

    setRipples(prevRipples => prevRipples.map(r => ({
        ...r, size: r.size + 1.4, opacity: r.opacity - 0.02
    })).filter(r => r.opacity > 0));

    setParticles(prevParticles => prevParticles.map(p => ({
        ...p, 
        y: p.y - p.velocity, 
        x: p.x + (Math.sin(time / 200) * 0.5), 
        opacity: p.opacity - 0.012
    })).filter(p => p.opacity > 0));

    if (playbackRef.current.active) {
      const now = Date.now();
      let elapsed = now - playbackRef.current.startTime;
      const { notes, duration } = playbackRef.current;

      if (isLooping && duration > 0 && elapsed >= duration) {
        playbackRef.current.startTime = now;
        playbackRef.current.nextIndex = 0;
        elapsed = 0;
      }

      setPlaybackProgress(duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0);

      let idx = playbackRef.current.nextIndex;
      while (idx < notes.length && notes[idx].timestamp <= elapsed) {
        spawnDrop(notes[idx].noteId, false);
        idx++;
      }
      playbackRef.current.nextIndex = idx;

      if (!isLooping && idx >= notes.length && drops.length === 0 && elapsed >= duration + 1000) {
        stopPlayback();
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (hasStarted) requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [hasStarted, dimensions, isLooping, drops.length, visualizeNotes]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (currentRecording.length > 0) saveSong();
    } else {
      setRecordingStartTime(Date.now());
      setCurrentRecording([]);
      setIsRecording(true);
    }
  };

  const togglePracticeMode = () => {
    if (isPracticeMode) {
      setIsPracticeMode(false);
      setPracticeStep(0);
    } else {
      setIsPracticeMode(true);
      setPracticeStep(0);
      if (isPlayingBack) stopPlayback();
    }
  };

  const saveSong = () => {
    const title = prompt("Melody Name:", `Rain Song ${savedSongs.length + 1}`);
    if (!title) return;
    const newSong = {
      id: Math.random().toString(36), title, date: new Date().toLocaleDateString(),
      notes: currentRecording, duration: Date.now() - recordingStartTime
    };
    const updated = [...savedSongs, newSong];
    setSavedSongs(updated);
    localStorage.setItem('raindrum_songs', JSON.stringify(updated));
  };

  const stopPlayback = () => {
    setIsPlayingBack(false);
    setCurrentSongTitle("");
    setPlaybackProgress(0);
    playbackRef.current.active = false;
  };

  const playSong = async (song: Song, isDemo = false) => {
    await handleInteraction();
    if (isPracticeMode) setIsPracticeMode(false);
    setIsPlayingBack(true);
    setCurrentSongTitle(song.title);
    playbackRef.current = {
      active: true, isDemo: isDemo, startTime: Date.now(), notes: song.notes, nextIndex: 0,
      duration: song.duration || 5000
    };
    setShowSongs(false);
  };

  const resetScene = () => {
    setDrops([]);
    setRipples([]);
    setParticles([]);
    setIsPracticeMode(false);
    setPracticeStep(0);
    if (isPlayingBack) stopPlayback();
    if (isRecording) {
      setIsRecording(false);
      setCurrentRecording([]);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0a1f1c] text-forest-100 relative overflow-hidden" onClick={startExperience}>
        <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
        <div className="z-10 text-center space-y-8 p-12 max-w-lg bg-[#0a1f1c]/80 backdrop-blur-2xl rounded-3xl border border-forest-600 shadow-2xl mx-4">
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-forest-300 to-rain-300 uppercase leading-normal">RAINDRUM</h1>
          <p className="text-lg sm:text-xl font-light text-forest-400">Harmonize with nature's rhythm.</p>
          <div className="p-4 bg-forest-800/50 rounded-lg text-sm text-forest-500 italic animate-pulse cursor-pointer">Tap to Begin</div>
        </div>
      </div>
    );
  }

  const drumSize = Math.min(dimensions.width * 0.9, dimensions.height * 0.45);
  const drumContainerStyle = {
    top: '40%', 
    height: drumSize, 
    width: drumSize,
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };

  const soundOptions: SoundType[] = ['Crystal', 'Metallic', 'Wood', 'Ether'];

  return (
    <div className={`relative h-screen w-full bg-gradient-to-b ${currentTheme.bgGradient} select-none transition-all duration-1000 overflow-hidden`} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
      <div className={`absolute inset-0 opacity-60 pointer-events-none transition-opacity duration-1000 animate-background-drift`} style={{ backgroundImage: `url(${currentTheme.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <RainVisualizer drops={drops} ripples={ripples} particles={particles} notes={NOTES} canvasWidth={dimensions.width} canvasHeight={dimensions.height} theme={currentTheme} />

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
           <div className="bg-black/80 border border-white/20 p-8 rounded-[40px] max-w-md w-full shadow-2xl flex flex-col items-center gap-6 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-forest-500/20 flex items-center justify-center border border-forest-400/30 text-forest-400">
                 <CloudRain size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-light tracking-widest text-white uppercase">How to Play</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Welcome to <span className="text-forest-300 font-bold">RainDrum</span>. Compose peaceful melodies in harmony with nature.
                </p>
              </div>
              <ul className="text-left w-full space-y-4 text-xs tracking-wide text-white/70">
                 <li className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</span>
                    <p>Tap pads to summon raindrops and play notes in the D-Major scale.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</span>
                    <p>Adjust <span className="text-forest-300">Rain Density</span> in the mixer to let nature play for you.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</span>
                    <p>Record your session and save it to your library.</p>
                 </li>
              </ul>
              <button 
                onClick={() => setShowTutorial(false)}
                className="mt-4 px-10 py-3 rounded-full bg-forest-600 text-white font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-forest-500 transition-colors"
              >
                Start Journey
              </button>
           </div>
        </div>
      )}

      {/* Indicators */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-full px-6">
        {isRecording && (
          <div className="bg-red-900/60 backdrop-blur-md px-5 py-2 rounded-full border border-red-500/50 flex items-center gap-3 shadow-xl">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
              <span className="text-red-100 font-mono text-sm tracking-[0.2em]">{formatTime(elapsedTime)}</span>
          </div>
        )}

        {isPracticeMode && (
          <div className="bg-blue-900/60 backdrop-blur-md px-5 py-2 rounded-full border border-blue-500/50 flex items-center gap-3 shadow-xl">
              <BookOpen size={16} className="text-blue-300 animate-bounce" />
              <span className="text-blue-100 font-mono text-sm tracking-[0.2em]">PRACTICE: {practiceStep + 1} / {TWINKLE_MELODY_IDS.length}</span>
          </div>
        )}
        
        {isPlayingBack && (
          <div className="w-full max-w-md flex flex-col items-center gap-3 bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                  <Play size={16} fill="currentColor" className="animate-pulse" />
                </div>
                <div>
                  <div className="text-blue-100 font-medium text-sm tracking-wide truncate max-w-[150px]">{currentSongTitle}</div>
                  <div className="text-blue-300/50 text-[10px] uppercase font-bold tracking-[0.1em]">{playbackRef.current.isDemo ? 'Auto Playing (Healing Tempo)' : 'Atmospheric Replay'}</div>
                </div>
              </div>
              <button onClick={stopPlayback} className="p-2.5 bg-white/5 hover:bg-white/15 rounded-full text-white/60 transition-colors">
                <Square size={14} fill="currentColor" />
              </button>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-blue-400 shadow-[0_0_15px_#60a5fa] transition-all duration-300 ease-linear rounded-full" style={{ width: `${playbackProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Clouds */}
      <div className="absolute top-0 left-0 w-full h-[15%] z-20 pointer-events-none">
        {NOTES.map((note) => (
            <div 
              key={note.id}
              className="absolute transform -translate-x-1/2 top-4 transition-all duration-300"
              style={{ left: `${note.cloudLeft}%`, opacity: activeNote === note.id ? 1 : 0.15 }}
            >
              <div className={`w-16 h-8 bg-white/40 blur-2xl rounded-full transition-all duration-300 ${activeNote === note.id ? 'scale-150 blur-3xl' : ''}`}></div>
            </div>
        ))}
      </div>

      {/* Help - Top Left */}
      <button 
        onClick={() => setShowTutorial(true)} 
        className="absolute left-6 top-8 z-40 p-3 rounded-full bg-black/30 border border-white/10 text-white/40 hover:text-white hover:bg-black/50 transition-all hover:scale-110"
        title="Tutorial"
      >
        <HelpCircle size={18} />
      </button>

      {/* Reset - Top Right */}
      <button 
        onClick={resetScene} 
        className="absolute right-6 top-8 z-40 p-3 rounded-full bg-black/30 border border-white/10 text-white/40 hover:text-white hover:bg-black/50 transition-all hover:scale-110 group"
        title="Reset"
      >
        <RotateCcw size={18} className="group-hover:rotate-[-90deg] transition-transform duration-500" />
      </button>

      {/* Main Drum */}
      <div className="absolute z-30" style={{ ...drumContainerStyle }}>
         <div className="absolute inset-0 rounded-full border border-white/20 backdrop-blur-xl shadow-[0_0_120px_rgba(0,0,0,0.95)]" style={{ backgroundColor: currentTheme.drumColor }}></div>
         
         {NOTES.map((note) => {
             const isActive = activeNote === note.id;
             const isHit = hitNote === note.id;
             // Practice Highlight
             const isPracticeTarget = isPracticeMode && TWINKLE_MELODY_IDS[practiceStep] === note.id;
             
             return (
               <button 
                  key={note.id} 
                  onMouseDown={(e) => { e.stopPropagation(); spawnDrop(note.id); }}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); spawnDrop(note.id); }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none group" 
                  style={{ left: `${note.left}%`, top: `${note.top}%` }}
               >
                 <div className={`w-12 h-12 md:w-20 md:h-20 rounded-full border flex items-center justify-center transition-all duration-200 ${
                   isActive ? 'scale-90 bg-white/40 border-white shadow-[0_0_40px_rgba(255,255,255,0.8)]' : 
                   isHit ? 'scale-105 bg-white/20 border-white/60 shadow-[0_0_30px_rgba(255,255,255,0.6)]' :
                   isPracticeTarget ? 'bg-blue-400/20 border-blue-400/60 animate-pulse scale-105 shadow-[0_0_30px_rgba(59,130,246,0.3)]' :
                   'bg-white/10 border-white/20 group-hover:border-white/40 group-hover:bg-white/15'
                 }`}>
                    <span className={`text-[10px] md:text-xl font-bold pointer-events-none tracking-tight transition-colors ${isActive || isHit ? 'text-white' : isPracticeTarget ? 'text-blue-300' : 'text-white/60'}`}>{note.label}</span>
                 </div>
                 {isHit && (
                   <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
                 )}
               </button>
             );
          })}
      </div>

      {/* Puddle Area */}
      <div className="absolute bottom-0 w-full z-0 pointer-events-none" style={{ height: `${100 - PAD_Y_PERCENT}%`, background: `linear-gradient(to top, ${currentTheme.rainColor}30, transparent)` }}>
          <div className="w-full h-[2px] bg-white/20 absolute top-0 blur-[2px]"></div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-40 flex flex-col gap-4">
        <div className="flex justify-between items-center px-4 max-w-md mx-auto w-full">
            <div className="flex gap-4">
                <button onClick={() => { setShowThemes(!showThemes); setShowMixer(false); setShowSoundSettings(false); setShowSongs(false); }} className={`p-4 rounded-full backdrop-blur-xl border transition-all ${showThemes ? 'bg-white/30 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 border-white/20 text-white/70 hover:bg-black/60'}`}><Palette size={22} /></button>
                <button onClick={() => { setShowMixer(!showMixer); setShowThemes(false); setShowSoundSettings(false); setShowSongs(false); }} className={`p-4 rounded-full backdrop-blur-xl border transition-all ${showMixer ? 'bg-white/30 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 border-white/20 text-white/70 hover:bg-black/60'}`}><Sliders size={22} /></button>
                <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1">
                    <button onClick={() => playSong(DEMO_SONGS.twinkle, true)} className={`p-3 rounded-full transition-all ${isPlayingBack && playbackRef.current.isDemo ? 'bg-yellow-500/30 text-yellow-300' : 'text-white/40 hover:text-white'}`} title="Auto Play Twinkle"><Sparkles size={18} /></button>
                    <button onClick={togglePracticeMode} className={`p-3 rounded-full transition-all ${isPracticeMode ? 'bg-blue-500/30 text-blue-300' : 'text-white/40 hover:text-white'}`} title="Practice Twinkle"><BookOpen size={18} /></button>
                </div>
            </div>
            
            <div className="flex gap-4">
                <button onClick={() => { setShowSoundSettings(!showSoundSettings); setShowThemes(false); setShowMixer(false); setShowSongs(false); }} className={`p-4 rounded-full backdrop-blur-xl border transition-all ${showSoundSettings ? 'bg-white/30 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 border-white/20 text-white/70 hover:bg-black/60'}`}><Settings size={22} /></button>
                <button onClick={toggleMute} className="p-4 rounded-full backdrop-blur-xl bg-black/40 border border-white/20 text-white/70 hover:bg-black/60 transition-colors">{isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
            </div>
        </div>

        <div className="flex justify-center items-center gap-8">
            <button onClick={() => { setShowSongs(!showSongs); setShowThemes(false); setShowMixer(false); setShowSoundSettings(false); }} className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                <div className={`p-5 rounded-full bg-black/50 border border-white/20 backdrop-blur-2xl shadow-xl transition-all ${showSongs ? 'bg-white/20 scale-105' : 'hover:scale-105'}`}><Music size={28} /></div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Library</span>
            </button>

            <button onClick={toggleRecording} className={`flex flex-col items-center gap-1.5 transition-all ${isRecording ? 'text-red-400' : 'text-white/90'}`}>
                <div className={`p-6 rounded-full border backdrop-blur-2xl shadow-2xl transition-all ${isRecording ? 'bg-red-500/30 border-red-400 scale-110 shadow-red-950/40' : 'bg-white/15 border-white/30 hover:bg-white/25 hover:scale-105'}`}>
                    {isRecording ? <Square size={32} fill="currentColor" /> : <Circle size={32} fill="currentColor" className="text-red-500" />}
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold">{isRecording ? 'Stop' : 'Record'}</span>
            </button>
            
            <button onClick={() => setIsLooping(!isLooping)} className={`flex flex-col items-center gap-1.5 transition-all ${isLooping ? 'text-blue-400' : 'text-white/70'}`}>
                <div className={`p-5 rounded-full backdrop-blur-2xl border transition-all ${isLooping ? 'bg-blue-500/30 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/50 border-white/20'}`}><Repeat size={28} /></div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium">{isLooping ? 'Loop ON' : 'Loop OFF'}</span>
            </button>
        </div>
      </div>

      {/* Popups */}
      {showSoundSettings && (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-80 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-[40px] p-8 z-50 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black">Instrument Config</h3>
              <button onClick={() => setShowSoundSettings(false)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold px-1">Selected Timbre</span>
                <div className="grid grid-cols-2 gap-3">
                    {soundOptions.map(type => (
                        <button key={type} onClick={() => setCurrentSoundType(type)} className={`px-4 py-4 rounded-2xl text-[11px] font-bold tracking-widest transition-all ${currentSoundType === type ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/20' : 'text-white/40 hover:bg-white/5 border border-transparent'}`}>
                            {type}
                        </button>
                    ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-white font-medium">Musical Particles</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Impact Visualization</span>
                </div>
                <button onClick={() => setVisualizeNotes(!visualizeNotes)} className={`p-3.5 rounded-full border transition-all ${visualizeNotes ? 'bg-blue-500/10 border-blue-400/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/10 text-white/20'}`}>
                  <Sparkles size={20} />
                </button>
              </div>
            </div>
        </div>
      )}

      {showThemes && (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-80 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-[40px] p-8 z-50 shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black">Visual Atmosphere</h3>
              <button onClick={() => setShowThemes(false)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-2">
                {THEMES.map(t => (
                    <button key={t.id} onClick={() => { setCurrentTheme(t); setShowThemes(false); }} className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-bold tracking-wide transition-all flex items-center justify-between ${currentTheme.id === t.id ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:bg-white/5 border border-transparent'}`}>
                        {t.name}
                        {currentTheme.id === t.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                    </button>
                ))}
            </div>
        </div>
      )}

      {showMixer && (
         <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-80 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-[40px] p-8 z-50 shadow-2xl animate-in slide-in-from-bottom-5">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black">Environmental Mixer</h3>
               <button onClick={() => setShowMixer(false)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
             </div>
             <div className="space-y-6 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
                 <div className="space-y-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-[11px] font-bold text-white tracking-widest uppercase">
                          <Droplets size={16} className="text-blue-400" />
                          <span>Rain Density</span>
                       </div>
                       <span className="text-[10px] text-white/30 font-mono">{Math.round(rainDensity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={rainDensity} 
                      onChange={(e) => setRainDensity(parseFloat(e.target.value))} 
                      className="w-full h-1 appearance-none cursor-pointer bg-white/10 accent-blue-400 rounded-full" 
                    />
                 </div>

                 <div className="grid grid-cols-1 gap-5 pt-2">
                   {[
                     { id: 'rain', icon: <CloudRain size={16} />, label: 'Storm', color: 'accent-blue-400' },
                     { id: 'wind', icon: <Wind size={16} />, label: 'Breeze', color: 'accent-slate-400' },
                     { id: 'birds', icon: <Bird size={16} />, label: 'Fauna', color: 'accent-yellow-400' },
                     { id: 'thunder', icon: <Zap size={16} />, label: 'Electric', color: 'accent-purple-400' },
                     { id: 'ocean', icon: <Waves size={16} />, label: 'Tides', color: 'accent-cyan-400' },
                     { id: 'fire', icon: <Flame size={16} />, label: 'Hearth', color: 'accent-orange-400' },
                     { id: 'crickets', icon: <Bug size={16} />, label: 'Insects', color: 'accent-green-400' }
                   ].map(item => (
                     <div key={item.id} className="space-y-3 px-1">
                       <div className="flex items-center justify-between">
                         <button 
                            onClick={() => updateAmbience(item.id as AmbienceType, { active: !ambience[item.id as AmbienceType].active })} 
                            className={`flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${ambience[item.id as AmbienceType].active ? 'text-white' : 'text-white/20'}`}
                          >
                            <span className={ambience[item.id as AmbienceType].active ? 'text-current' : 'text-white/20'}>{item.icon}</span>
                            <span>{item.label}</span>
                         </button>
                         <span className="text-[10px] text-white/20 font-mono">{Math.round(ambience[item.id as AmbienceType].volume * 100)}%</span>
                       </div>
                       <input 
                          type="range" min="0" max="1" step="0.01" 
                          value={ambience[item.id as AmbienceType].volume} 
                          onChange={(e) => updateAmbience(item.id as AmbienceType, { volume: parseFloat(e.target.value) })} 
                          className={`w-full h-0.5 appearance-none cursor-pointer bg-white/5 ${item.color} rounded-full`} 
                        />
                     </div>
                   ))}
                 </div>
             </div>
         </div>
      )}

      {showSongs && (
          <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[40px] p-8 z-50 shadow-2xl max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/0 pb-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black">Musical Records</h3>
              <button onClick={() => setShowSongs(false)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            {savedSongs.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <Music size={40} className="text-white/5" />
                <p className="text-white/20 text-xs text-center italic font-light tracking-wide">No recordings yet in this sanctuary...</p>
              </div>
            ) : (
                <div className="space-y-4">
                {savedSongs.map(song => (
                    <div key={song.id} className="group flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-transparent hover:border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="overflow-hidden flex flex-col gap-1">
                            <div className="text-white font-bold text-sm truncate tracking-tight">{song.title}</div>
                            <div className="text-white/30 text-[9px] uppercase font-bold tracking-[0.1em]">{song.date} • {formatTime(song.duration)}</div>
                        </div>
                        <button 
                          onClick={() => playSong(song)} 
                          className="p-4 bg-white/10 hover:bg-blue-500 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl"
                        >
                          <Play size={18} fill="currentColor" />
                        </button>
                    </div>
                ))}
                </div>
            )}
          </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}

export default App;