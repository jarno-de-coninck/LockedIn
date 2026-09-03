import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';

const LOCKED_IN_QUOTES = [
  "Stay locked in all the time with LockedIn 🔒🔥",
  "Legends don't skip leg day... or breakfast.",
  "Your phone is locked in, are you? 👀",
  "Calories are just numbers... but macros are life.",
  "Coach Lock is watching your sweet tooth 🍫",
  "100% Locked In: No excuses, just compound gains.",
  "Fueling athlete engine with high-protein power 🥑⚡",
  "Neural AI Coach active on RTX GPU 🚀",
  "Consistency beats motivation every single time.",
  "Lock in today so tomorrow thanks you 🏆",
];

export default function SplashScreen({ onFinish }) {
  const [quote, setQuote] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * LOCKED_IN_QUOTES.length);
    setQuote(LOCKED_IN_QUOTES[randomIdx]);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      onClick={() => {
        setIsFadingOut(true);
        setTimeout(() => onFinish && onFinish(), 300);
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-slate-950 text-white select-none transition-all duration-700 ease-out cursor-pointer ${
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
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>Athletic OS Active</span>
      </div>

      {/* Center Hero Branding */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto animate-scale-up">
        {/* Brand Logo Hero Badge */}
        <BrandLogo size="hero" showText={false} />

        {/* Brand Title */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Locked<span className="text-orange-500">In</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">
            Precision Nutrition & Training
          </p>
        </div>

        {/* Funny / Motivational Quote Card */}
        <div className="max-w-xs px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner mt-4">
          <p className="text-xs font-bold text-slate-200 leading-relaxed italic">
            "{quote || 'Stay locked in all the time with LockedIn 🔒🔥'}"
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Tap to Skip */}
      <div className="w-full max-w-xs space-y-2 text-center">
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full animate-progress" />
        </div>
        <p className="text-[10px] font-semibold text-slate-400">
          Tap anywhere to skip • Neural Engine Ready
        </p>
      </div>
    </div>
  );
}
