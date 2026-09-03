import React from 'react';
import { Flame, Lock } from 'lucide-react';

export default function BrandLogo({ size = 'md', showText = true, textDark = true, className = '' }) {
  // Size variations
  const sizeMap = {
    sm: {
      box: 'w-7 h-7 rounded-xl',
      flame: 'w-4 h-4',
      lock: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
      text: 'text-sm',
    },
    md: {
      box: 'w-8 h-8 rounded-xl',
      flame: 'w-4.5 h-4.5',
      lock: 'w-2.5 h-2.5 bottom-1 right-1',
      text: 'text-base',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      flame: 'w-6 h-6',
      lock: 'w-3.5 h-3.5 bottom-1.5 right-1.5',
      text: 'text-xl',
    },
    hero: {
      box: 'w-20 h-20 rounded-3xl',
      flame: 'w-10 h-10',
      lock: 'w-5 h-5 bottom-2.5 right-2.5',
      text: 'text-3xl',
    },
  };

  const config = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Black Badge with Glowing Flame & Interlocking Orange Lock */}
      <div
        className={`relative flex items-center justify-center bg-black border border-slate-800 shadow-md shadow-orange-500/10 shrink-0 ${config.box}`}
      >
        {/* Ambient Fire Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/30 to-amber-500/20 rounded-[inherit] pointer-events-none" />

        {/* Fiery Flame */}
        <Flame
          className={`${config.flame} text-orange-500 fill-orange-500 stroke-[2.2] drop-shadow-[0_2px_8px_rgba(249,115,22,0.6)]`}
        />

        {/* Interlocking Orange Padlock */}
        <div className={`absolute ${config.lock} flex items-center justify-center`}>
          <div className="p-0.5 rounded bg-black/80 border border-orange-500/60 shadow-xs">
            <Lock className="w-full h-full text-orange-400 fill-orange-400/40 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="leading-none">
          <span
            className={`font-black tracking-tight ${
              textDark ? 'text-slate-900' : 'text-white'
            } ${config.text}`}
          >
            Locked<span className="text-orange-500">In</span>
          </span>
        </div>
      )}
    </div>
  );
}
