import { Note, Theme, Song } from './types';

// 指定された11音のタングドラムレイアウト
const degToRad = (deg: number) => deg * (Math.PI / 180);
const ringRadius = 38; 
const getPos = (index: number) => {
    const angle = 90 + (index * 36); 
    return {
        left: 50 + ringRadius * Math.cos(degToRad(angle)),
        top: 50 + ringRadius * Math.sin(degToRad(angle))
    };
};

const rawNotes = [
    { id: 'n_c#4', name: 'C#4', freq: 277.18, label: 'C#4', cloud: 50, pos: { left: 50, top: 50 } },
    { id: 'n_a3',   name: 'A3',   freq: 220.00, label: 'A3',   cloud: 50, pos: getPos(0) },
    { id: 'n_e4',   name: 'E4',   freq: 329.63, label: 'E4',   cloud: 25, pos: getPos(1) },
    { id: 'n_g4',   name: 'G4',   freq: 392.00, label: 'G4',   cloud: 10, pos: getPos(2) },
    { id: 'n_b4',   name: 'B4',   freq: 493.88, label: 'B4',   cloud: 15, pos: getPos(3) },
    { id: 'n_d5',   name: 'D5',   freq: 587.33, label: 'D5',   cloud: 30, pos: getPos(4) },
    { id: 'n_b3',   name: 'B3',   freq: 246.94, label: 'B3',   cloud: 50, pos: getPos(5) },
    { id: 'n_c#5',  name: 'C#5',  freq: 554.37, label: 'C#5',  cloud: 70, pos: getPos(6) },
    { id: 'n_a4',   name: 'A4',   freq: 440.00, label: 'A4',   cloud: 85, pos: getPos(7) },
    { id: 'n_f#4',  name: 'F#4',  freq: 369.99, label: 'F#4',  cloud: 90, pos: getPos(8) },
    { id: 'n_d4',   name: 'D4',   freq: 293.66, label: 'D4',   cloud: 75, pos: getPos(9) },
];

export const NOTES: Note[] = rawNotes.map(n => ({
    id: n.id,
    name: n.name,
    frequency: n.freq,
    label: n.label,
    color: '#a5b4fc', 
    left: n.pos.left,
    top: n.pos.top,
    cloudLeft: n.cloud
}));

// 曲生成ヘルパー
const createSong = (id: string, title: string, melody: string[], tempo: number = 900): Song => {
  return {
    id,
    title,
    date: 'Masterpiece',
    notes: melody.map((noteId, i) => ({
      timestamp: i * tempo,
      noteId
    })),
    duration: melody.length * tempo + 2000
  };
};

export const MASTERPIECES: Song[] = [
  createSong('twinkle', 'きらきら星', [
    'n_d4', 'n_d4', 'n_a4', 'n_a4', 'n_b4', 'n_b4', 'n_a4',
    'n_g4', 'n_g4', 'n_f#4', 'n_f#4', 'n_e4', 'n_e4', 'n_d4',
    'n_a4', 'n_a4', 'n_g4', 'n_g4', 'n_f#4', 'n_f#4', 'n_e4',
    'n_a4', 'n_a4', 'n_g4', 'n_g4', 'n_f#4', 'n_f#4', 'n_e4',
    'n_d4', 'n_d4', 'n_a4', 'n_a4', 'n_b4', 'n_b4', 'n_a4',
    'n_g4', 'n_g4', 'n_f#4', 'n_f#4', 'n_e4', 'n_e4', 'n_d4'
  ], 900),

  createSong('frog', 'かえるの合唱', [
    'n_d4', 'n_e4', 'n_f#4', 'n_g4', 'n_f#4', 'n_e4', 'n_d4',
    'n_f#4', 'n_g4', 'n_a4', 'n_b4', 'n_a4', 'n_g4', 'n_f#4',
    'n_d4', 'n_d4', 'n_d4', 'n_d4',
    'n_d4', 'n_d4', 'n_e4', 'n_e4', 'n_f#4', 'n_f#4', 'n_g4', 'n_g4',
    'n_f#4', 'n_e4', 'n_d4'
  ], 1100),

  createSong('london_bridge', 'ロンドン橋落ちた', [
    'n_a4', 'n_b4', 'n_a4', 'n_g4', 'n_f#4', 'n_g4', 'n_a4',
    'n_e4', 'n_f#4', 'n_g4', 'n_f#4', 'n_g4', 'n_a4',
    'n_a4', 'n_b4', 'n_a4', 'n_g4', 'n_f#4', 'n_g4', 'n_a4',
    'n_e4', 'n_a4', 'n_f#4', 'n_d4'
  ], 1200),

  createSong('mary', 'メリーさんのひつじ', [
    'n_f#4', 'n_e4', 'n_d4', 'n_e4', 'n_f#4', 'n_f#4', 'n_f#4',
    'n_e4', 'n_e4', 'n_e4', 'n_f#4', 'n_a4', 'n_a4',
    'n_f#4', 'n_e4', 'n_d4', 'n_e4', 'n_f#4', 'n_f#4', 'n_f#4',
    'n_f#4', 'n_e4', 'n_e4', 'n_f#4', 'n_e4', 'n_d4'
  ], 850),

  createSong('lullaby', 'ブラームスの子守唄', [
    'n_f#4', 'n_f#4', 'n_a4', 'n_f#4', 'n_f#4', 'n_a4',
    'n_f#4', 'n_a4', 'n_d5', 'n_c#5', 'n_b4', 'n_b4', 'n_a4',
    'n_e4', 'n_f#4', 'n_g4', 'n_e4', 'n_f#4', 'n_g4',
    'n_e4', 'n_g4', 'n_c#5', 'n_b4', 'n_a4', 'n_c#5', 'n_d5'
  ], 1100)
];

export const DEMO_SONGS = {
    twinkle: MASTERPIECES[0]
};

export const THEMES: Theme[] = [
  {
    id: 'forest',
    name: '雨の森 (Forest Echoes)',
    bgGradient: 'from-[#0a1a1a] via-[#1a3333] to-[#0a1a1a]',
    bgImage: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(25, 45, 40, 0.85)',
    rainColor: 'rgba(200, 255, 240, 0.9)',
    accentColor: '#86efac'
  },
  {
    id: 'deep_space',
    name: '深宇宙 (Deep Space)',
    bgGradient: 'from-[#020617] via-[#1e1b4b] to-[#020617]',
    bgImage: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(30, 27, 75, 0.85)',
    rainColor: 'rgba(232, 240, 255, 0.95)',
    accentColor: '#c084fc'
  },
  {
    id: 'waterfall',
    name: '聖なる滝 (Sacred Waterfall)',
    bgGradient: 'from-[#083344] via-[#155e75] to-[#083344]',
    bgImage: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(21, 94, 117, 0.8)',
    rainColor: 'rgba(207, 250, 254, 0.95)',
    accentColor: '#22d3ee'
  },
  {
    id: 'night_sea',
    name: '夜の海 (Night Sea)',
    bgGradient: 'from-[#020617] via-[#0c4a6e] to-[#020617]',
    bgImage: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(12, 74, 110, 0.85)',
    rainColor: 'rgba(224, 242, 254, 0.9)',
    accentColor: '#38bdf8'
  },
  {
    id: 'city',
    name: 'Night City',
    bgGradient: 'from-[#020617] via-[#0f172a] to-[#020617]',
    bgImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(15, 23, 42, 0.9)',
    rainColor: 'rgba(186, 230, 253, 0.95)',
    accentColor: '#818cf8'
  }
];

export const GRAVITY_SPEED = 15; 
export const PAD_Y_PERCENT = 85;