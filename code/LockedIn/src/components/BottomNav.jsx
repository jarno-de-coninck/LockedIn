import React from 'react';
import { Activity, Dumbbell, UtensilsCrossed, Sparkles } from 'lucide-react';

export default function BottomNav({
  activeTab,
  setActiveTab,
  loggedMealsCount = 0,
  loggedWorkoutsCount = 0,
}) {
  const tabs = [
    {
      id: 'today',
      label: 'Today',
      icon: Activity,
    },
    {
      id: 'workouts',
      label: 'Workouts',
      icon: Dumbbell,
      badge: loggedWorkoutsCount > 0 ? loggedWorkoutsCount : null,
      badgeColor: 'bg-slate-900',
    },
    {
      id: 'diet',
      label: 'Diet',
      icon: UtensilsCrossed,
      badge: loggedMealsCount > 0 ? loggedMealsCount : null,
      badgeColor: 'bg-orange-500',
    },
    {
      id: 'ai',
      label: 'AI Studio',
      icon: Sparkles,
      sparkle: true,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      style={{
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`tap-target relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active-press select-none ${
                isActive
                  ? 'text-orange-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-orange-50 text-orange-600 scale-105' : 'text-slate-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                {/* Badge */}
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full text-white text-[8px] font-extrabold flex items-center justify-center shadow-xs ${
                      tab.badgeColor || 'bg-orange-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'text-orange-600 font-bold' : 'text-slate-500 font-medium'
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
