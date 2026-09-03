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
        className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 pb-2.5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] w-full max-w-full overflow-hidden"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        }}
      >
        <div className="flex items-center justify-between gap-1.5 w-full">
          {/* Brand Logo with white text - scaled for phones */}
          <div className="shrink min-w-0">
            <BrandLogo size="sm" showText={true} textDark={false} />
          </div>

          {/* Right Action Cluster - strictly scaled to never overflow */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Streak Flame Badge */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 select-none shadow-[0_0_12px_rgba(249,115,22,0.15)] shrink-0"
              title={`${streakCount} Day Streak!`}
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
              <span className="text-xs font-black tracking-tight">{streakCount}d</span>
            </div>

            {/* Quick Language Selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="px-2 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-black text-slate-300 flex items-center gap-1 active-press transition-colors shrink-0"
                title={t('languageLabel')}
              >
                <span className="text-sm leading-none">{currentLangObj.flag}</span>
                <span className="text-[10px] font-black uppercase text-slate-400 hidden xs:inline">{currentLangObj.code}</span>
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

            {/* User Profile Pill - compact on phone, expanded on larger screens */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="group flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all active-press shadow-xs shrink-0"
              title={t('athleteProfile')}
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                  <User className="w-3.5 h-3.5 text-slate-950" />
                </div>
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse"
                  title={t('aiOnline')}
                />
              </div>

              <div className="hidden sm:flex items-center gap-1 leading-none pr-1">
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
