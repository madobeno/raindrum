import { Note, Theme } from './types';

// Layout: Center + 10 notes in ring.
// Sequence (Clockwise from Bottom): A3, E4, G4, B4, D5, B3, C#5, A4, F#4, D4
// Center: C#3

const radius = 38; // %
const degToRad = (deg: number) => deg * (Math.PI / 180);
const getPos = (deg: number) => ({
    left: 50 + radius * Math.cos(degToRad(deg)),
    top: 50 + radius * Math.sin(degToRad(deg))
});

const rawNotes = [
    { id: 'n_center', name: 'C#3', freq: 138.59, cloud: 5, pos: {left: 50, top: 50} },
    { id: 'n1', name: 'A3', freq: 220.00, cloud: 14, pos: getPos(90) },
    { id: 'n2', name: 'E4', freq: 329.63, cloud: 23, pos: getPos(126) },
    { id: 'n3', name: 'G4', freq: 392.00, cloud: 32, pos: getPos(162) },
    { id: 'n4', name: 'B4', freq: 493.88, cloud: 41, pos: getPos(198) },
    { id: 'n5', name: 'D5', freq: 587.33, cloud: 50, pos: getPos(234) },
    { id: 'n6', name: 'B3', freq: 246.94, cloud: 59, pos: getPos(270) },
    { id: 'n7', name: 'C#5', freq: 554.37, cloud: 68, pos: getPos(306) },
    { id: 'n8', name: 'A4', freq: 440.00, cloud: 77, pos: getPos(342) },
    { id: 'n9', name: 'F#4', freq: 369.99, cloud: 86, pos: getPos(18) },
    { id: 'n10', name: 'D4', freq: 293.66, cloud: 95, pos: getPos(54) },
];

export const NOTES: Note[] = rawNotes.map(n => ({
    id: n.id,
    name: n.name,
    frequency: n.freq,
    label: n.name,
    color: '#a5b4fc', 
    left: n.pos.left,
    top: n.pos.top,
    cloudLeft: n.cloud
}));

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
    id: 'bird_sanctuary',
    name: '小鳥のさえずり (Bird Sanctuary)',
    bgGradient: 'from-[#064e3b] via-[#3f6212] to-[#064e3b]',
    bgImage: 'https://images.unsplash.com/photo-1444464666168-49d633b867ad?auto=format&fit=crop&w=2000&q=80',
    drumColor: 'rgba(63, 98, 18, 0.85)',
    rainColor: 'rgba(254, 243, 199, 0.95)',
    accentColor: '#fde047'
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