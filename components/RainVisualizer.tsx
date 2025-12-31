import React, { useRef, useEffect } from 'react';
import { Note, RainDrop, Ripple, Theme, NoteParticle } from '../types';

interface RainVisualizerProps {
  drops: RainDrop[];
  ripples: Ripple[];
  particles: NoteParticle[];
  notes: Note[];
  canvasWidth: number;
  canvasHeight: number;
  theme: Theme;
}

const RainVisualizer: React.FC<RainVisualizerProps> = ({
  drops,
  ripples,
  particles,
  notes,
  canvasWidth,
  canvasHeight,
  theme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw Drops
      drops.forEach((drop) => {
        const dropLength = 40;
        const dropWidth = 1.5;

        ctx.save();
        
        // Tapered trail
        ctx.beginPath();
        const grad = ctx.createLinearGradient(drop.x, drop.y, drop.x, drop.y - dropLength);
        grad.addColorStop(0, theme.rainColor);
        grad.addColorStop(0.2, theme.rainColor);
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = dropWidth;
        ctx.lineCap = 'round';
        
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y - dropLength);
        ctx.stroke();

        // Glowing head
        ctx.beginPath();
        const headGrad = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, 4);
        headGrad.addColorStop(0, '#fff');
        headGrad.addColorStop(0.5, theme.rainColor);
        headGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = headGrad;
        ctx.arc(drop.x, drop.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Draw Ripples
      ripples.forEach((ripple) => {
        ctx.save();
        ctx.globalAlpha = ripple.opacity;
        
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.size, 0, Math.PI * 2);
        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (ripple.opacity > 0.4) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = ripple.color;
          ctx.globalAlpha = ripple.opacity * 0.3;
          ctx.fill();
        }

        ctx.restore();
      });

      // Draw Particles (Note Visualization)
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = theme.accentColor;
        
        if (p.text) {
          // Floating Music Notes
          ctx.font = `italic ${18 + (1 - p.opacity) * 14}px serif`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = theme.accentColor;
          ctx.fillText(p.text, p.x, p.y);
        } else {
          // Sparkles / Embers
          ctx.beginPath();
          const size = 3 * p.opacity;
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.shadowBlur = 8;
          ctx.shadowColor = theme.accentColor;
          ctx.fill();
        }
        
        ctx.restore();
      });
    };

    render();
  }, [drops, ripples, particles, canvasWidth, canvasHeight, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute top-0 left-0 pointer-events-none z-10"
    />
  );
};

export default RainVisualizer;