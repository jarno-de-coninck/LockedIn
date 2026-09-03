import React, { useState } from 'react';
import {
  Calendar,
  X,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Trophy,
} from 'lucide-react';
import { getDailyHistory, formatHumanDate, simulateNextDayRollover } from '../services/history';
import { useLanguage } from '../services/i18n';

export default function DailyHistoryModal({
  isOpen,
  onClose,
  todayMeals = [],
  todayWorkouts = [],
  goal = 2000,
  onTriggerRollover,
}) {
  const { t } = useLanguage();
  const [expandedDate, setExpandedDate] = useState(null);
  const [historyList, setHistoryList] = useState(() => getDailyHistory());

  if (!isOpen) return null;

  const handleRefresh = () => {
    setHistoryList(getDailyHistory());
  };

  const handleSimulateRollover = () => {
    if (onTriggerRollover) {
      onTriggerRollover();
      handleRefresh();
      onClose();
    }
  };

  // Compute today's live preview
  const todayConsumed = todayMeals.reduce((a, m) => a + (Number(m.calories) || 0), 0);
  const todayBurned = todayWorkouts.reduce((a, w) => a + (Number(w.caloriesBurned) || 0), 0);
  const todayNet = todayConsumed - todayBurned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">{t('history') || 'Daily History Log'}</h3>
              <p className="text-[11px] text-slate-400 font-bold">Review what you ate & did</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar (Test rollover helper for instant verification) */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400">
            {historyList.length} past days archived
          </span>
          <button
            type="button"
            onClick={handleSimulateRollover}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 text-[11px] font-black flex items-center gap-1 active-press transition-colors"
            title="Simulate rollover to next calendar day"
          >
            <Zap className="w-3 h-3 text-orange-400" />
            <span>Test Day Rollover</span>
          </button>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* Today's in-progress card */}
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-slate-950 text-[10px] font-black uppercase">
                  Today
                </span>
                <span className="text-xs font-black text-white">In Progress</span>
              </div>
              <span className="text-xs font-mono font-black text-orange-400">
                {todayConsumed} / {goal} kcal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Meals</span>
                <span className="font-mono font-black text-white mt-0.5 block">{todayMeals.length} logged</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Burned</span>
                <span className="font-mono font-black text-emerald-400 mt-0.5 block">-{todayBurned} kcal</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Net</span>
                <span className="font-mono font-black text-slate-200 mt-0.5 block">{todayNet} kcal</span>
              </div>
            </div>
          </div>

          {/* Past days list */}
          {historyList.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">No past days archived yet.</p>
              <p className="text-[11px] text-slate-500">
                At midnight (or when you tap "Test Day Rollover"), today's meals & workouts are automatically saved here and fresh logs start for the new day!
              </p>
            </div>
          ) : (
            historyList.map((day) => {
              const isExpanded = expandedDate === day.date;
              return (
                <div
                  key={day.date}
                  className="rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden transition-all shadow-xs"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 active-press transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {formatHumanDate(day.date)}
                        </span>
                        {day.dayName && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            • {day.dayName}
                          </span>
                        )}
                        {day.isFullyLockedIn && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                            LockedIn ✓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span>+{day.totalConsumed || 0} kcal</span>
                        <span>•</span>
                        <span className="text-emerald-400">-{day.totalBurned || 0} kcal burned</span>
                        <span>•</span>
                        <span>{day.meals?.length || 0} meals</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-orange-400 block">
                          {day.netCalories || 0} kcal
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">
                          Net Intake
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="p-3.5 pt-0 border-t border-slate-800/60 space-y-3 bg-slate-900/40 animate-slide-up">
                      {/* Meals Eaten That Day */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
                          <span>Meals Eaten ({day.meals?.length || 0})</span>
                        </span>

                        {day.meals && day.meals.length > 0 ? (
                          <div className="space-y-1">
                            {day.meals.map((m, idx) => (
                              <div
                                key={m.id || idx}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-slate-200 truncate">{m.name}</p>
                                  {m.time && <span className="text-[10px] text-slate-500">{m.time}</span>}
                                </div>
                                <span className="font-mono font-black text-orange-400 shrink-0">
                                  +{m.calories} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No meals logged this day.</p>
                        )}
                      </div>

                      {/* Workouts Done That Day */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Workouts Completed ({day.workouts?.length || 0})</span>
                        </span>

                        {day.workouts && day.workouts.length > 0 ? (
                          <div className="space-y-1">
                            {day.workouts.map((w, idx) => (
                              <div
                                key={w.id || idx}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-slate-200 truncate">{w.title}</p>
                                  <span className="text-[10px] text-slate-400">
                                    {w.duration ? `${w.duration}m` : ''} {w.type ? `• ${w.type}` : ''}
                                  </span>
                                </div>
                                <span className="font-mono font-black text-emerald-400 shrink-0">
                                  -{w.caloriesBurned} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No workouts logged this day (Rest day).</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
