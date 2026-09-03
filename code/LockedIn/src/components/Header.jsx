import React, { useState } from 'react';
import { User, Flame, Globe } from 'lucide-react';
import ProfileModal from './ProfileModal';
import BrandLogo from './BrandLogo';
import { useLanguage, LANGUAGES } from '../services/i18n';

export default function Header({
  goal,
  setGoal,
  userProfile,
  setUserProfile,
  activeSport,
  setActiveSport,
  trainingGoal,
  setTrainingGoal,
  streakCount = 3,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 pb-2.5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo with white text */}
          <BrandLogo size="md" showText={true} textDark={false} />

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5">
            {/* Streak Flame Badge */}
            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 select-none shadow-[0_0_12px_rgba(249,115,22,0.15)]"
              title={`${streakCount} Day Streak!`}
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
              <span className="text-xs font-black tracking-tight">{streakCount}d</span>
            </div>

            {/* Quick Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="tap-target px-2 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-black text-slate-300 flex items-center gap-1 active-press transition-colors"
                title={t('languageLabel')}
              >
                <span>{currentLangObj.flag}</span>
                <span className="text-[11px] font-black uppercase">{currentLangObj.code}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl min-w-[130px] animate-scale-up space-y-0.5">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        language === l.code
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="tap-target group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all active-press shadow-xs"
              title={t('athleteProfile')}
            >
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                  <User className="w-3 h-3 text-slate-950" />
                </div>
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse"
                  title={t('aiOnline')}
                />
              </div>

              <div className="flex items-center gap-1 leading-none pr-0.5">
                <span className="text-xs font-black text-slate-100">
                  {userProfile?.weight || 78}kg
                </span>
                <span className="text-[11px] text-slate-500 font-bold">•</span>
                <span className="text-xs font-black text-orange-400">
                  {goal}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        goal={goal}
        setGoal={setGoal}
        activeSport={activeSport}
        setActiveSport={setActiveSport}
        trainingGoal={trainingGoal}
        setTrainingGoal={setTrainingGoal}
      />
    </>
  );
}
