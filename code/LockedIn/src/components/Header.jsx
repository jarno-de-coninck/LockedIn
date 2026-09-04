import React, { useState } from 'react';
import { User, Flame, Globe, X, Check } from 'lucide-react';
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
        role="banner"
        className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b-2 border-slate-800 px-3.5 pb-3 transition-all shadow-md w-full max-w-full"
        style={{
          paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        }}
      >
        <div className="flex items-center justify-between gap-2.5 w-full">
          <div className="shrink min-w-0">
            <BrandLogo size="sm" showText={true} textDark={false} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="min-h-[48px] px-3 py-1.5 rounded-2xl bg-orange-950/60 border-2 border-orange-500/60 text-orange-300 flex items-center gap-2 select-none shadow-sm shrink-0"
              title={`${streakCount} Day Streak`}
              aria-label={`Current streak is ${streakCount} days`}
            >
              <Flame className="w-5 h-5 fill-orange-400 text-orange-400 shrink-0" />
              <span className="text-sm font-black tracking-tight">{streakCount}d</span>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setShowLangMenu(true)}
                aria-label={`Change language, current is ${currentLangObj.label}`}
                className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-sm font-black text-slate-100 flex items-center justify-center gap-2 active-press transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none shrink-0"
              >
                <span className="text-lg leading-none" aria-hidden="true">{currentLangObj.flag}</span>
                <span className="text-xs font-black uppercase text-slate-200">{currentLangObj.code}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label={t('athleteProfile') || 'Athlete Profile and Settings'}
              className="min-h-[48px] flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 transition-all active-press shadow-sm focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none shrink-0"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm">
                  <User className="w-5 h-5 text-slate-950" />
                </div>
                <span
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950"
                  title={t('aiOnline')}
                />
              </div>

              <div className="hidden sm:flex items-center gap-1.5 leading-none pr-1">
                <span className="text-sm font-black text-white">
                  {userProfile?.weight || 78}kg
                </span>
                <span className="text-slate-400 font-bold">•</span>
                <span className="text-sm font-black text-amber-400">
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
