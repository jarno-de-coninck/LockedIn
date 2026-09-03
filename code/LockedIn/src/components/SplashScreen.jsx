import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';

const LOCKED_IN_QUOTES = [
  "Stay locked in all the time with LockedIn 🔒🔥",
  "Legends don't skip leg day... or recovery.",
  "Champions are built on the days they don't feel like it 🏆",
  "Calories fuel performance... macros build the engine 🥑⚡",
  "Coach Lock is tracking your compound consistency 📊",
  "100% Locked In: No excuses, just discipline.",
  "Fuel your engine with high-protein power ⚡",
  "Neural Athletic Intelligence Online ⚡",
  "Consistency beats motivation every single time 🎯",
  "Lock in today so tomorrow's competition fears you 🥇",
];

export default function SplashScreen({ onFinish }) {
  const [quote, setQuote] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * LOCKED_IN_QUOTES.length);
    setQuote(LOCKED_IN_QUOTES[randomIdx]);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      onClick={() => {
        setIsFadingOut(true);
        setTimeout(() => onFinish && onFinish(), 200);
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-slate-950 text-white select-none transition-all duration-500 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'max(32px, env(safe-area-inset-top, 32px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
      }}
    >
      {/* Top Ambient Glow */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Status */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Athletic OS Active</span>
      </div>

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center gap-4 my-auto animate-scale-up">
        <BrandLogo size="hero" showText={true} textDark={false} />

        {/* Motivational Dynamic Quote */}
        {quote && (
          <div className="max-w-xs text-center px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl">
            <p className="text-xs font-bold text-slate-300 italic leading-relaxed">
              "{quote}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Loading Indicator */}
      <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-progress" />
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Tap anywhere to skip
        </span>
      </div>
    </div>
  );
}
