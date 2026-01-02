import { Note, Theme, Song } from './types';

// Helper to define positions clockwise starting from bottom (6 o'clock)
const getRingPos = (index: number, total: number) => {
    // 90 degrees is the bottom in this specific coordinate calculation
    const angle = 90 + (index * (360 / total));
    const rad = angle * (Math.PI / 180);
    const radius = 38;
    return {
        left: 50 + radius * Math.cos(rad),
        top: 50 + radius * Math.sin(rad)
    };
};

// Fixed Note Placement:
// A3(5) is the lowest note -> Center
// C#4(7) is at the bottom ring position
// Others follow clockwise: E4(2), G4(4), B4(6), D5(1), B3(6), C#5(7), A4(5), F#4(3), D4(1)
const rawNotes = [
    { id: 'n_c#4',  name: 'C#4',  freq: 277.18, label: '7', cloud: 20, pos: getRingPos(0, 10) }, // Bottom Ring
    { id: 'n_e4',   name: 'E4',   freq: 329.63, label: '2', cloud: 15, pos: getRingPos(1, 10) },
    { id: 'n_g4',   name: 'G4',   freq: 392.00, label: '4', cloud: 50, pos: getRingPos(2, 10) },
    { id: 'n_b4',   name: 'B4',   freq: 493.88, label: '6', cloud: 85, pos: getRingPos(3, 10) },
    { id: 'n_d5',   name: 'D5',   freq: 587.33, label: '1', cloud: 75, pos: getRingPos(4, 10) },
    { id: 'n_b3',   name: 'B3',   freq: 246.94, label: '6', cloud: 35, pos: getRingPos(5, 10) },
    { id: 'n_c#5',  name: 'C#5',  freq: 554.37, label: '7', cloud: 90, pos: getRingPos(6, 10) },
    { id: 'n_a4',   name: 'A4',   freq: 440.00, label: '5', cloud: 70, pos: getRingPos(7, 10) },
    { id: 'n_f#4',  name: 'F#4',  freq: 369.99, label: '3', cloud: 30, pos: getRingPos(8, 10) },
    { id: 'n_d4',   name: 'D4',   freq: 293.66, label: '1', cloud: 50, pos: getRingPos(9, 10) },
    { id: 'n_a3',   name: 'A3',   freq: 220.00, label: '5', cloud: 50, pos: { left: 50, top: 50 } }, // Center
];

export const NOTES: Note[] = rawNotes.map(n => ({
    id: n.id,
    name: n.name,
    frequency: n.freq,
    label: `${n.label}\n${n.name}`, 
    color: '#a5b4fc', 
    left: n.pos.left,
    top: n.pos.top,
    cloudLeft: n.cloud
}));

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
  createSong('jesu', '主よ、人の望みの喜びよ', [
    'n_d4', 'n_e4', 'n_f#4', 'n_a4', 'n_g4', 'n_g4', 'n_b4', 'n_a4', 'n_a4', 'n_d5', 'n_c#5', 'n_d5', 
    'n_a4', 'n_f#4', 'n_d4', 'n_e4', 'n_f#4', 'n_g4', 'n_a4', 'n_b4', 'n_a4', 'n_g4', 'n_f#4', 'n_e4', 
    'n_f#4', 'n_d4', 'n_c#4', 'n_d4', 'n_e4', 'n_a3', 'n_c#4', 'n_e4', 'n_g4', 'n_f#4', 'n_e4', 'n_f#4', 
    'n_d4', 'n_e4', 'n_f#4', 'n_a4', 'n_g4', 'n_g4', 'n_b4', 'n_a4', 'n_a4', 'n_d5', 'n_c#5', 'n_d5', 
    'n_a4', 'n_f#4', 'n_d4', 'n_e4', 'n_f#4', 'n_b3', 'n_a4', 'n_g4', 'n_f#4', 'n_e4', 'n_d4', 'n_a3', 
    'n_d4', 'n_c#4', 'n_d4', 'n_f#4', 'n_a4', 'n_d5', 'n_a4', 'n_f#4', 'n_d4', 'n_f#4', 'n_a4', 'n_d5'
  ], 750),

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