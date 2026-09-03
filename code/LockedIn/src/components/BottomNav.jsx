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
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'diet',
      label: t('diet'),
      icon: UtensilsCrossed,
      badge: loggedMealsCount > 0 ? loggedMealsCount : null,
      badgeColor: 'bg-orange-500',
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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-slate-950/95 backdrop-blur-xl border-t border-x border-slate-800/80 rounded-t-2xl sm:rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.6)] overflow-hidden"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
      }}
    >
      <div className="w-full grid grid-cols-4 px-2 pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`tap-target relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 active-press select-none ${
                isActive
                  ? 'text-orange-400 font-black'
                  : 'text-slate-500 hover:text-slate-300 font-bold'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-500/15 text-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.3)] scale-110'
                      : 'text-slate-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                {/* Badge Count */}
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-md border border-slate-950 ${
                      tab.badgeColor || 'bg-orange-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] mt-1 tracking-tight transition-colors ${
                  isActive ? 'text-white font-black' : 'text-slate-500 font-semibold'
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
