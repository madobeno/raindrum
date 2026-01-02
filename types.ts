export interface Note {
  id: string;
  name: string;
  frequency: number;
  label: string;
  color: string;
  left: number; // Percentage 0-100 relative to drum container
  top: number;  // Percentage 0-100 relative to drum container
  cloudLeft: number; // Percentage 0-100 relative to screen width
}

export type SoundType = 'Crystal' | 'Metallic' | 'Wood' | 'Ether' | 'Celestial' | 'Deep' | 'Bamboo' | 'MusicBox' | 'Kalimba' | 'Flute';

export interface RainDrop {
  id: string;
  noteId: string;
  x: number;
  y: number;
  speed: number;
  targetY: number;
  hasHit: boolean;
  opacity: number;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

export interface NoteParticle {
  id: string;
  x: number;
  y: number;
  text: string;
  opacity: number;
  velocity: number;
}

export interface RecordedNote {
  timestamp: number;
  noteId: string;
}

export interface Song {
  id: string;
  title: string;
  date: string;
  notes: RecordedNote[];
  duration: number;
}

export type AmbienceType = 'rain' | 'wind' | 'birds' | 'thunder' | 'ocean' | 'fire' | 'crickets' | 'frogs';

export interface AmbienceConfig {
  active: boolean;
  volume: number;
}

export interface Theme {
  id: string;
  name: string;
  bgGradient: string;
  bgImage: string;
  drumColor: string;
  rainColor: string;
  accentColor: string;
}