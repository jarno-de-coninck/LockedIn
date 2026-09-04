import React from 'react';
import { Flame, Dumbbell, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useLanguage } from '../services/i18n';

export default function BottomNav({
  activeTab,
  setActiveTab,
  loggedMealsCount = 0,
  loggedWorkoutsCount = 0,
}) {
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'today',
      label: t('today'),
      icon: Flame,
    },
    {
      id: 'workouts',
      label: t('workouts'),
      icon: Dumbbell,
      badge: loggedWorkoutsCount > 0 ? loggedWorkoutsCount : null,
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'diet',
      label: t('diet'),
      icon: UtensilsCrossed,
      badge: loggedMealsCount > 0 ? loggedMealsCount : null,
      badgeColor: 'bg-orange-600',
    },
    {
      id: 'ai',
      label: t('aiStudio'),
      icon: Sparkles,
      sparkle: true,
    },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 bg-slate-950 border-t-2 border-x-2 border-slate-700 rounded-t-2xl shadow-2xl overflow-hidden"
      style={{
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full grid grid-cols-4 gap-1 px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[56px] min-w-[56px] flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-150 active-press select-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isActive
                  ? 'bg-orange-950/70 border-2 border-orange-400 text-white font-extrabold shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-slate-900 border-2 border-transparent font-bold'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  aria-hidden="true"
                  className={`w-6 h-6 shrink-0 ${
                    isActive ? 'text-orange-400 stroke-[2.75]' : 'text-slate-300 stroke-[2.25]'
                  }`}
                />

                {tab.badge && (
                  <span
                    aria-label={`${tab.badge} logged items`}
                    className={`absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full text-white text-xs font-black flex items-center justify-center border-2 border-slate-950 ${
                      tab.badgeColor || 'bg-orange-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-xs mt-1 leading-tight tracking-normal ${
                  isActive ? 'text-orange-300 font-black' : 'text-slate-200 font-bold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
