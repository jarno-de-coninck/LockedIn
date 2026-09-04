import React, { useState } from 'react';
import { User, Flame, Globe, X, Check, Bot } from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import BrandLogo from './BrandLogo';
import { useLanguage, LANGUAGES } from '../services/i18n';
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
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3.5 pb-2.5 transition-all shadow-md w-full max-w-full"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        }}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="shrink min-w-0">
            <BrandLogo size="sm" showText={true} textDark={false} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="min-h-[44px] px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center gap-1.5 select-none shadow-sm shrink-0"
              title={`${streakCount} Day Streak`}
              aria-label={`Current streak is ${streakCount} days`}
            >
              <Flame className="w-4 h-4 fill-orange-400 text-orange-400 shrink-0" />
              <span className="text-xs font-black tracking-tight">{streakCount}d</span>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setShowLangMenu(true)}
                aria-label={`Change language, current is ${currentLangObj.label}`}
                className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 active-press transition-colors shrink-0"
              >
                <span className="text-base leading-none" aria-hidden="true">{currentLangObj.flag}</span>
                <span className="text-xs font-extrabold uppercase text-slate-300">{currentLangObj.code}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="AI and App Settings"
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors active-press relative shrink-0"
              title="AI & App Settings"
            >
              <Bot className="w-5 h-5 text-orange-400" />
              {getGroqApiKey() && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-950" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label={t('athleteProfile') || 'Athlete Profile'}
              className="min-h-[44px] flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all active-press shadow-sm shrink-0"
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm">
                  <User className="w-4 h-4 text-slate-950" />
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 leading-none pr-0.5">
                <span className="text-xs font-black text-white">
                  {userProfile?.weight || 78}kg
                </span>
                <span className="text-slate-500 font-bold">•</span>
                <span className="text-xs font-black text-amber-400">
                  {goal} kcal
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {showLangMenu && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="language-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none"
          onClick={() => setShowLangMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="language-modal-title" className="text-base font-black text-white">
                    {t('languageLabel') || 'Select Language'}
                  </h3>
                  <p className="text-xs text-slate-300 font-bold">Choose your preferred language</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLangMenu(false)}
                aria-label="Close language selector"
                className="min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 border-2 border-transparent hover:border-slate-700 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`min-h-[52px] w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-extrabold transition-all active-press border-2 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    language === l.code
                      ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                      : 'bg-slate-950 text-slate-100 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <span className="text-2xl" aria-hidden="true">{l.flag}</span>
                    <span className="text-sm font-bold text-white">{l.label}</span>
                  </span>
                  {language === l.code && (
                    <Check className="w-5 h-5 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
