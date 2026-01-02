import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Music, Volume2, VolumeX, Sliders, CloudRain, Wind, Bird, Zap, Repeat, Palette, Clock, X, Settings, RotateCcw, Sparkles, HelpCircle, Droplets, Flame, Waves, Bug, BookOpen, Headphones, AlertTriangle, Moon, FastForward } from 'lucide-react';
import { Note, RainDrop, Ripple, Song, RecordedNote, AmbienceType, AmbienceConfig, Theme, SoundType, NoteParticle } from './types';
import { NOTES, THEMES, GRAVITY_SPEED, PAD_Y_PERCENT, MASTERPIECES } from './constants';
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
  const [showMixer, setShowMixer] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showSongs, setShowSongs] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState<{ mode: 'play' | 'practice' } | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [hitNote, setHitNote] = useState<string | null>(null);

  // Audio Control
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playbackSpeedRef = useRef(1.0);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const [ambience, setAmbience] = useState<Record<AmbienceType, AmbienceConfig>>(() => {
    const saved = localStorage.getItem('raindrum_ambience');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      rain: { active: true, volume: 0.3 }, 
      wind: { active: false, volume: 0.3 },
      birds: { active: false, volume: 0.3 },
      thunder: { active: false, volume: 0.6 },
      ocean: { active: false, volume: 0.4 },
      fire: { active: false, volume: 0.3 },
      crickets: { active: false, volume: 0.2 },
      frogs: { active: false, volume: 0.25 },
    };
  });

  const [rainDensity, setRainDensity] = useState<number>(() => {
    const saved = localStorage.getItem('raindrum_rain_density');
    return saved ? parseFloat(saved) : 0.1;
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedId = localStorage.getItem('raindrum_theme_id');
    const theme = THEMES.find(t => t.id === savedId);
    return theme || THEMES[0];
  });

  const [currentSoundType, setCurrentSoundType] = useState<SoundType>(() => {
    const saved = localStorage.getItem('raindrum_sound_type');
    return (saved as SoundType) || 'Crystal';
  });

  useEffect(() => {
    localStorage.setItem('raindrum_ambience', JSON.stringify(ambience));
  }, [ambience]);

  useEffect(() => {
    localStorage.setItem('raindrum_rain_density', rainDensity.toString());
  }, [rainDensity]);

  useEffect(() => {
    localStorage.setItem('raindrum_theme_id', currentTheme.id);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('raindrum_sound_type', currentSoundType);
  }, [currentSoundType]);

  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceStep, setPracticeStep] = useState(0);
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const [currentPracticeSong, setCurrentPracticeSong] = useState<Song | null>(null);
  
  const requestRef = useRef<number>(null);
  const playbackRef = useRef<{ active: boolean, isDemo: boolean, startTime: number, notes: RecordedNote[], nextIndex: number, duration: number, accumulatedTime: number, lastCheck: number }>({
    active: false, isDemo: false, startTime: 0, notes: [], nextIndex: 0, duration: 0, accumulatedTime: 0, lastCheck: 0
  });

  useEffect(() => {
    const tutorialSeen = localStorage.getItem('raindrum_tutorial_seen');
    if (!tutorialSeen && hasStarted) {
      setShowTutorial(true);
      localStorage.setItem('raindrum_tutorial_seen', 'true');
    }
  }, [hasStarted]);

  // Timer countdown logic
  useEffect(() => {
    if (timerSeconds !== null && timerSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds(s => (s !== null && s > 0 ? s - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      audioEngine.fadeOutMaster(10, () => resetScene());
      setTimerSeconds(null);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerSeconds]);

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
      // FIX: Check if document is hidden to prevent "rain burst" when returning to tab
      if (document.hidden) return;
      
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

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
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
    audioEngine.setMasterVolume(masterVolume);
    setHasStarted(true);
  };

  const handleInteraction = useCallback(async () => {
    await audioEngine.resume();
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      audioEngine.setMasterVolume(0);
    } else {
      audioEngine.setMasterVolume(masterVolume);
    }
  };

  const updateMasterVolume = (val: number) => {
    setMasterVolume(val);
    if (!isMuted) {
      audioEngine.setMasterVolume(val);
    }
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

    if (isPracticeMode && currentPracticeSong && !isStepTransitioning && noteId === currentPracticeSong.notes[practiceStep]?.noteId) {
        setIsStepTransitioning(true);
        const isLastStep = practiceStep >= currentPracticeSong.notes.length - 1;
        setTimeout(() => {
            if (!isLastStep) {
                setPracticeStep(s => s + 1);
                setIsStepTransitioning(false);
            } else {
                const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
                const completionParticles: NoteParticle[] = [];
                for (let i = 0; i < 40; i++) {
                    completionParticles.push({
                        id: Math.random().toString(36),
                        x: center.x + (Math.random() * 600 - 300),
                        y: center.y + (Math.random() * 600 - 300),
                        text: '★',
                        opacity: 1,
                        velocity: 0.3 + Math.random() * 2.5
                    });
                }
                setParticles(prev => [...prev, ...completionParticles]);
                setIsPracticeMode(false);
                setPracticeStep(0);
                setIsStepTransitioning(false);
            }
        }, 400);
    }
  }, [isMuted, currentTheme, currentSoundType, visualizeNotes, isPracticeMode, practiceStep, isStepTransitioning, currentPracticeSong, dimensions]);

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
      const timeDiff = now - playbackRef.current.lastCheck;
      
      // FIX: If the tab was inactive (jump > 250ms), we skip the logic to prevent note burst
      if (timeDiff < 250) {
        const delta = timeDiff * playbackSpeedRef.current;
        playbackRef.current.accumulatedTime += delta;
        
        const { notes, duration, accumulatedTime } = playbackRef.current;

        if (isLooping && duration > 0 && accumulatedTime >= duration) {
          playbackRef.current.accumulatedTime = 0;
          playbackRef.current.nextIndex = 0;
        }

        setPlaybackProgress(duration > 0 ? Math.min((accumulatedTime / duration) * 100, 100) : 0);

        let idx = playbackRef.current.nextIndex;
        while (idx < notes.length && notes[idx].timestamp <= accumulatedTime) {
          spawnDrop(notes[idx].noteId, false);
          idx++;
        }
        playbackRef.current.nextIndex = idx;

        if (!isLooping && idx >= notes.length && drops.length === 0 && accumulatedTime >= duration + 1000) {
          stopPlayback();
        }
      }
      
      playbackRef.current.lastCheck = now;
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (hasStarted) requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
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

  const startPractice = (song: Song) => {
    setIsPracticeMode(true);
    setPracticeStep(0);
    setIsStepTransitioning(false);
    setCurrentPracticeSong(song);
    closePopups();
    if (isPlayingBack) stopPlayback();
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

  const closePopups = () => {
    setShowThemes(false);
    setShowMixer(false);
    setShowSoundSettings(false);
    setShowSongs(false);
    setShowSongPicker(null);
    setShowTimerMenu(false);
  };

  const playSong = (song: Song, isDemo: boolean = false) => {
    setIsPlayingBack(true);
    setCurrentSongTitle(song.title);
    setPlaybackProgress(0);
    const now = Date.now();
    playbackRef.current = {
      active: true,
      isDemo,
      startTime: now,
      lastCheck: now,
      accumulatedTime: 0,
      notes: song.notes,
      nextIndex: 0,
      duration: song.duration
    };
    closePopups();
    if (isPracticeMode) setIsPracticeMode(false);
  };

  const stopPlayback = () => {
    setIsPlayingBack(false);
    setCurrentSongTitle("");
    setPlaybackProgress(0);
    playbackRef.current.active = false;
  };

  const resetScene = () => {
    setDrops([]);
    setRipples([]);
    setParticles([]);
    setIsPracticeMode(false);
    setPracticeStep(0);
    setIsStepTransitioning(false);
    setTimerSeconds(null);
    if (isPlayingBack) stopPlayback();
    if (isRecording) {
      setIsRecording(false);
      setCurrentRecording([]);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0a1f1c] text-forest-100 relative overflow-hidden" onClick={startExperience}>
        <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
        <div className="z-10 text-center space-y-8 p-12 max-w-lg bg-[#0a1f1c]/80 backdrop-blur-2xl rounded-3xl border border-forest-600 shadow-2xl mx-4">
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-forest-300 to-rain-300 uppercase leading-normal">RAINDRUM</h1>
          <p className="text-lg sm:text-xl font-light text-forest-400">Harmonize with nature's rhythm.</p>
          <div className="space-y-4">
            <div className="p-4 bg-forest-800/50 rounded-lg text-sm text-forest-500 italic animate-pulse cursor-pointer border border-forest-600/30">Tap to Begin</div>
            <div className="flex flex-col items-center gap-2 text-forest-500/80">
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold"><Headphones size={14} /><span>Headphones Recommended</span></div>
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-yellow-500/60"><AlertTriangle size={12} /><span>Check Volume for Best Experience</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMobile = dimensions.width < 640;
  const drumSize = isMobile ? Math.min(dimensions.width * 0.9, dimensions.height * 0.38) : Math.min(dimensions.width * 0.9, dimensions.height * 0.45);
  
  const drumContainerStyle = {
    top: isMobile ? '35%' : '38%',
    height: drumSize, 
    width: drumSize,
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };

  const soundOptions: SoundType[] = ['Crystal', 'Metallic', 'Wood', 'Ether', 'Celestial', 'Deep', 'Bamboo', 'MusicBox', 'Kalimba', 'Flute'];

  return (
    <div className={`relative h-screen w-full bg-gradient-to-b ${currentTheme.bgGradient} select-none transition-all duration-1000 overflow-hidden`} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
      <div className={`absolute inset-0 opacity-60 pointer-events-none transition-opacity duration-1000 animate-background-drift`} style={{ backgroundImage: `url(${currentTheme.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      <RainVisualizer drops={drops} ripples={ripples} particles={particles} notes={NOTES} canvasWidth={dimensions.width} canvasHeight={dimensions.height} theme={currentTheme} />

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
           <div className="bg-black/80 border border-white/20 p-8 rounded-[40px] max-w-md w-full shadow-2xl flex flex-col items-center gap-6 text-center animate-in zoom-in-95 relative">
              <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20} /></button>
              <div className="w-16 h-16 rounded-full bg-forest-500/20 flex items-center justify-center border border-forest-400/30 text-forest-400">
                 <CloudRain size={32} />
              </div>
              <h2 className="text-2xl font-light tracking-widest text-white uppercase">How to Play</h2>
              <ul className="text-left w-full space-y-4 text-xs tracking-wide text-white/70">
                 <li className="flex gap-4 items-start"><span className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</span><p>Tap pads to summon raindrops and play notes.</p></li>
                 <li className="flex gap-4 items-start"><span className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</span><p>Adjust <span className="text-forest-300">Rain Density</span> to let nature play.</p></li>
                 <li className="flex gap-4 items-start"><span className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</span><p>Use Practice Mode to learn masterpieces.</p></li>
              </ul>
              <button onClick={() => setShowTutorial(false)} className="mt-4 px-10 py-3 rounded-full bg-forest-600 text-white font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg">Begin</button>
           </div>
        </div>
      )}

      {/* Top Left: Help */}
      <div className="absolute left-6 top-8 z-40 flex items-center gap-2">
        <button onClick={() => setShowTutorial(true)} className="p-3 rounded-full bg-black/30 border border-white/10 text-white/40 hover:text-white transition-all"><HelpCircle size={18} /></button>
      </div>

      {/* Center Top: Recording/Playback Status */}
      <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 z-[45] flex flex-col items-center gap-2 w-full max-w-[45%] sm:max-w-[35%] pointer-events-none`}>
        {isRecording && (
          <div className="bg-red-900/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-red-500/50 flex items-center gap-2 shadow-xl animate-in slide-in-from-top-4 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]"></div>
              <span className="text-red-100 font-mono text-xs tracking-widest">{formatTime(elapsedTime)}</span>
          </div>
        )}
        {isPlayingBack && (
          <div className="w-full bg-black/60 backdrop-blur-3xl p-2.5 rounded-xl border border-white/20 shadow-2xl animate-in slide-in-from-top-4 pointer-events-auto ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-1.5 px-0.5 gap-2">
              <span className="text-blue-100 text-[9px] uppercase font-bold tracking-tight truncate">{currentSongTitle}</span>
              <button onClick={stopPlayback} className="text-white/60 hover:text-white p-1.5 bg-white/10 rounded-lg transition-colors"><Square size={12} fill="currentColor" /></button>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-blue-400 shadow-[0_0_10px_#60a5fa] transition-all duration-300" style={{ width: `${playbackProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Top Right: System Stack */}
      <div className="absolute right-6 top-8 z-40 flex flex-col gap-3 items-center">
        <div className="flex flex-col gap-2 items-center bg-black/20 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
            <button onClick={toggleMute} className={`p-3 rounded-full border transition-all ${isMuted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-transparent border-transparent text-white/40 hover:text-white'}`}>{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <div className="relative">
              <button onClick={() => { if (showTimerMenu) closePopups(); else { closePopups(); setShowTimerMenu(true); } }} className={`p-3 rounded-full border transition-all ${timerSeconds !== null ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-transparent border-transparent text-white/40 hover:text-white'}`}><Moon size={18} /></button>
              {timerSeconds !== null && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-mono text-blue-300 bg-black/50 px-1 rounded">{formatTimer(timerSeconds)}</div>
              )}
            </div>
        </div>
        <button onClick={resetScene} className="p-3 rounded-full bg-black/30 border border-white/10 text-white/40 hover:text-white transition-all group"><RotateCcw size={18} className="group-hover:rotate-[-90deg] transition-transform duration-500" /></button>
      </div>

      {/* Bottom Left: Atmosphere Stack */}
      <div className="absolute left-6 bottom-12 z-40 flex flex-col gap-4">
        <button onClick={() => { if (showThemes) closePopups(); else { closePopups(); setShowThemes(true); } }} className={`p-4 rounded-full border transition-all ${showThemes ? 'bg-white/20 text-white border-white' : 'bg-black/40 border-white/10 text-white/40'}`}><Palette size={22} /></button>
        <button onClick={() => { if (showMixer) closePopups(); else { closePopups(); setShowMixer(true); } }} className={`p-4 rounded-full border transition-all ${showMixer ? 'bg-white/20 text-white border-white' : 'bg-black/40 border-white/10 text-white/40'}`}><Sliders size={22} /></button>
      </div>

      {/* Bottom Right: Instrument Stack */}
      <div className="absolute right-6 bottom-12 z-40 flex flex-col gap-4 items-end">
        <div className="flex flex-col gap-2 bg-black/20 p-2 rounded-3xl border border-white/5 backdrop-blur-md">
          <button onClick={() => { if (showSongPicker?.mode === 'play') closePopups(); else { closePopups(); setShowSongPicker({ mode: 'play' }); } }} className={`p-3 rounded-full transition-all ${showSongPicker?.mode === 'play' ? 'bg-yellow-500/20 text-yellow-300' : 'text-white/20 hover:text-white'}`}><Sparkles size={20} /></button>
          <button onClick={() => { if (showSongPicker?.mode === 'practice') closePopups(); else { closePopups(); setShowSongPicker({ mode: 'practice' }); } }} className={`p-3 rounded-full transition-all ${showSongPicker?.mode === 'practice' || isPracticeMode ? 'bg-blue-500/20 text-blue-300' : 'text-white/20 hover:text-white'}`}><BookOpen size={20} /></button>
        </div>
        <button onClick={() => { if (showSoundSettings) closePopups(); else { closePopups(); setShowSoundSettings(true); } }} className={`p-4 rounded-full border transition-all ${showSoundSettings ? 'bg-white/20 text-white border-white' : 'bg-black/40 border-white/10 text-white/40'}`}><Settings size={22} /></button>
      </div>

      {/* Bottom Center: Studio Dock */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] px-4 py-1.5 shadow-2xl scale-95 sm:scale-100">
          <button onClick={() => { if (showSongs) closePopups(); else { closePopups(); setShowSongs(true); } }} className={`p-2.5 rounded-full transition-all ${showSongs ? 'text-forest-300' : 'text-white/30 hover:text-white'}`}><Music size={20} /></button>
          <button onClick={toggleRecording} className={`relative p-4 rounded-full border transition-all duration-300 ${isRecording ? 'bg-red-500/30 border-red-500/50 scale-105' : 'bg-white/5 border-white/10'}`}>
              {isRecording ? <Square size={20} fill="currentColor" className="text-red-500" /> : <Circle size={20} fill="currentColor" className="text-red-500" />}
          </button>
          <button onClick={() => setIsLooping(!isLooping)} className={`p-2.5 rounded-full transition-all ${isLooping ? 'text-blue-400' : 'text-white/30 hover:text-white'}`}><Repeat size={20} /></button>
      </div>

      {/* Main Drum */}
      <div className="absolute z-30 transition-all duration-700" style={{ ...drumContainerStyle }}>
         <div className="absolute inset-0 rounded-full border border-white/20 backdrop-blur-xl shadow-[0_0_120px_rgba(0,0,0,0.95)]" style={{ backgroundColor: currentTheme.drumColor }}></div>
         {NOTES.map((note) => {
             const isActive = activeNote === note.id;
             const isHit = hitNote === note.id;
             const isPracticeTarget = isPracticeMode && !isStepTransitioning && currentPracticeSong?.notes[practiceStep]?.noteId === note.id;
             return (
               <button key={note.id} onMouseDown={(e) => { e.stopPropagation(); spawnDrop(note.id); }} onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); spawnDrop(note.id); }} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none group" style={{ left: `${note.left}%`, top: `${note.top}%` }}>
                 <div className={`w-14 h-14 md:w-22 md:h-22 rounded-full border flex items-center justify-center transition-all duration-200 ${
                   isActive ? 'scale-90 bg-white/40 border-white shadow-[0_0_40px_rgba(255,255,255,0.8)]' : 
                   isHit ? 'scale-105 bg-white/20 border-white/60 shadow-[0_0_30px_rgba(255,255,255,0.6)]' :
                   isPracticeTarget ? 'bg-blue-400/20 border-blue-400/60 animate-pulse scale-110 shadow-[0_0_40px_rgba(59,130,246,0.4)]' :
                   'bg-white/10 border-white/20 group-hover:border-white/40'
                 }`}>
                    <span className={`text-[10px] md:text-sm font-bold pointer-events-none tracking-tight leading-tight whitespace-pre text-center ${isActive || isHit ? 'text-white' : isPracticeTarget ? 'text-blue-300 scale-110' : 'text-white/60'}`}>{note.label}</span>
                 </div>
               </button>
             );
          })}
      </div>

      {/* Puddle Area */}
      <div className="absolute bottom-0 w-full z-0 pointer-events-none" style={{ height: `${100 - PAD_Y_PERCENT}%`, background: `linear-gradient(to top, ${currentTheme.rainColor}30, transparent)` }}>
          <div className="w-full h-[2px] bg-white/20 absolute top-0 blur-[2px]"></div>
      </div>

      {/* --- Popups --- */}

      {showTimerMenu && (
        <div className="absolute top-24 right-6 w-56 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[30px] p-6 z-50 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white/40 text-[9px] uppercase tracking-widest font-black">Sleep Timer</h3>
            <button onClick={closePopups} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="space-y-1.5">
            {[10, 20, 30, 45, 60].map(min => (
              <button key={min} onClick={() => { setTimerSeconds(min * 60); closePopups(); }} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${timerSeconds === min * 60 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-white/60 border border-transparent'}`}>
                {min} Minutes
              </button>
            ))}
            {timerSeconds !== null && (
              <button onClick={() => { setTimerSeconds(null); closePopups(); }} className="w-full text-center px-4 py-2 mt-2 text-[10px] uppercase font-black text-red-400/60 hover:text-red-400">Cancel Timer</button>
            )}
          </div>
        </div>
      )}

      {showSongPicker && (
        <div className="absolute bottom-40 right-6 w-64 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[30px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-white/40 text-[9px] uppercase tracking-widest font-black">{showSongPicker.mode === 'play' ? 'Auto-Play' : 'Practice'}</h3>
               <button onClick={closePopups} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
                <div className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase"><FastForward size={14} className="text-yellow-400" /><span>Tempo</span></div>
                     <span className="text-[9px] text-white/30">{(playbackSpeed * 100).toFixed(0)}%</span>
                   </div>
                   <input type="range" min="0.5" max="2.0" step="0.1" value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} className="w-full h-1 appearance-none bg-white/10 accent-yellow-400 rounded-full" />
                </div>
                <div className="space-y-2">
                    {MASTERPIECES.map(song => (
                        <button key={song.id} onClick={() => showSongPicker.mode === 'play' ? playSong(song, true) : startPractice(song)} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-white/5 border border-transparent hover:border-white/10 text-white/80">{song.title}{showSongPicker.mode === 'play' ? <Play size={12} className="text-yellow-400" /> : <BookOpen size={12} className="text-blue-400" />}</button>
                    ))}
                </div>
            </div>
        </div>
      )}
      
      {showSoundSettings && (
        <div className="absolute bottom-40 right-6 w-64 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[30px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-white/40 text-[9px] uppercase tracking-widest font-black">Instrument</h3>
               <button onClick={closePopups} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {soundOptions.map(type => (
                    <button key={type} onClick={() => setCurrentSoundType(type)} className={`px-2 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all ${currentSoundType === type ? 'bg-white/10 text-white border border-white/20' : 'text-white/30 border border-transparent'}`}>{type}</button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase font-bold">Particles</span>
                <button onClick={() => setVisualizeNotes(!visualizeNotes)} className={`p-2 rounded-full border transition-all ${visualizeNotes ? 'bg-blue-500/10 border-blue-400/50 text-blue-400' : 'bg-black/40 border-white/10 text-white/20'}`}><Sparkles size={16} /></button>
              </div>
            </div>
        </div>
      )}

      {showThemes && (
        <div className="absolute bottom-40 left-6 w-64 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[30px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-white/40 text-[9px] uppercase tracking-widest font-black">Visuals</h3>
               <button onClick={closePopups} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-1">
                {THEMES.map(t => (
                    <button key={t.id} onClick={() => { setCurrentTheme(t); closePopups(); }} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between ${currentTheme.id === t.id ? 'bg-white/10 text-white border border-white/10' : 'text-white/30 border border-transparent'}`}>{t.name}{currentTheme.id === t.id && <div className="w-1 h-1 rounded-full bg-blue-400"></div>}</button>
                ))}
            </div>
        </div>
      )}

      {showMixer && (
         <div className="absolute bottom-40 left-6 w-64 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[30px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-white/40 text-[9px] uppercase tracking-widest font-black">Mixer</h3>
                <button onClick={closePopups} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
             </div>
             <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1 custom-scrollbar">
                 {/* Master Volume Slider */}
                 <div className="space-y-3 p-3 bg-white/10 rounded-2xl border border-white/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase"><Volume2 size={14} className="text-forest-300" /><span>Master Volume</span></div>
                      <span className="text-[9px] text-white/30">{Math.round(masterVolume * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(e) => updateMasterVolume(parseFloat(e.target.value))} className="w-full h-1.5 appearance-none bg-white/10 accent-forest-300 rounded-full cursor-pointer" />
                 </div>

                 <div className="space-y-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase"><Droplets size={14} className="text-blue-400" /><span>Rain</span></div><span className="text-[9px] text-white/30">{Math.round(rainDensity * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.01" value={rainDensity} onChange={(e) => setRainDensity(parseFloat(e.target.value))} className="w-full h-1 appearance-none bg-white/10 accent-blue-400 rounded-full" />
                 </div>
                 {[
                   { id: 'rain', icon: <CloudRain size={14} />, label: 'Storm', color: 'accent-blue-400' },
                   { id: 'wind', icon: <Wind size={14} />, label: 'Breeze', color: 'accent-slate-400' },
                   { id: 'birds', icon: <Bird size={14} />, label: 'Fauna', color: 'accent-yellow-400' },
                   { id: 'crickets', icon: <Bug size={14} />, label: '鈴虫 (Insects)', color: 'accent-indigo-400' },
                   { id: 'thunder', icon: <Zap size={14} />, label: 'Electric', color: 'accent-purple-400' }
                 ].map(item => (
                   <div key={item.id} className="space-y-2 px-1">
                     <div className="flex items-center justify-between">
                       <button onClick={() => updateAmbience(item.id as AmbienceType, { active: !ambience[item.id as AmbienceType].active })} className={`flex items-center gap-3 text-[10px] font-bold uppercase transition-colors ${ambience[item.id as AmbienceType].active ? 'text-white' : 'text-white/20'}`}>{item.icon}<span>{item.label}</span></button>
                       <span className="text-[9px] text-white/20">{Math.round(ambience[item.id as AmbienceType].volume * 100)}%</span>
                     </div>
                     <input type="range" min="0" max="1" step="0.01" value={ambience[item.id as AmbienceType].volume} onChange={(e) => updateAmbience(item.id as AmbienceType, { volume: parseFloat(e.target.value) })} className={`w-full h-0.5 appearance-none bg-white/5 ${item.color} rounded-full`} />
                   </div>
                 ))}
             </div>
         </div>
      )}

      {showSongs && (
          <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-[85%] max-w-sm bg-black/95 backdrop-blur-3xl border border-white/20 rounded-[30px] p-6 z-50 shadow-2xl max-h-[50vh] overflow-y-auto animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-white/40 text-[10px] uppercase tracking-widest font-black">Records</h3>
               <button onClick={closePopups} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            {savedSongs.length === 0 ? (
              <p className="text-white/20 text-[10px] text-center italic py-8">No recordings yet...</p>
            ) : (
                <div className="space-y-3">
                {savedSongs.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all">
                        <div className="overflow-hidden"><div className="text-white font-bold text-xs truncate">{song.title}</div><div className="text-white/30 text-[8px] uppercase">{song.date}</div></div>
                        <button onClick={() => playSong(song)} className="p-3 bg-white/10 hover:bg-blue-500 text-white rounded-xl"><Play size={14} fill="currentColor" /></button>
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