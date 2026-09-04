import React, { useState } from 'react';
import { User, Flame, Settings } from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import BrandLogo from './BrandLogo';
import { useLanguage } from '../services/i18n';
import { getGroqApiKey } from '../services/groq';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 pb-2 transition-all shadow-md w-full"
        style={{
          paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        }}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="shrink-0 min-w-0">
            <BrandLogo size="sm" showText={true} textDark={false} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="min-h-[38px] px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center gap-1.5 select-none shadow-xs shrink-0"
              title={`${streakCount} Day Streak`}
              aria-label={`Current streak is ${streakCount} days`}
            >
              <Flame className="w-4 h-4 fill-orange-400 text-orange-400 shrink-0" />
              <span className="text-xs font-black tracking-tight">{streakCount}d</span>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings and Language"
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors active-press relative shrink-0"
              title="Settings & Language"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              {getGroqApiKey() && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-950" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label={t('athleteProfile') || 'Athlete Profile'}
              className="min-h-[38px] flex items-center gap-1.5 p-1 sm:px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all active-press shadow-xs shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                <User className="w-4 h-4 text-slate-950" />
              </div>

              <div className="hidden sm:flex items-center gap-1 leading-none pr-1">
                <span className="text-xs font-bold text-white">
                  {userProfile?.weight || 78}kg
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenSettings={() => {
          setIsProfileOpen(false);
          setIsSettingsOpen(true);
        }}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        goal={goal}
        setGoal={setGoal}
        activeSport={activeSport}
        setActiveSport={setActiveSport}
        trainingGoal={trainingGoal}
        setTrainingGoal={setTrainingGoal}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
