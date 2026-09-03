import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Dumbbell,
  CheckCircle2,
  UtensilsCrossed,
  ArrowRight,
  Trophy,
  Check,
  Star,
  Zap,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import RecipeModal from './RecipeModal';
import { useLanguage } from '../services/i18n';
import { getDailyHistory, formatHumanDate } from '../services/history';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrackerTab({
  goal,
  meals,
  setMeals,
  workouts,
  dietPlan = [],
  trainingSchedule,
  activeSport,
  onNavigateToDiet,
  onNavigateToWorkouts,
  onOpenHistory,
}) {
  const { t } = useLanguage();
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [selectedRecipeMeal, setSelectedRecipeMeal] = useState(null);

  // Historical Day Navigator state (null = today)
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const historyRecords = getDailyHistory();
  const selectedPastDay = selectedHistoryDate
    ? historyRecords.find((h) => h.date === selectedHistoryDate)
    : null;

  const todayName = DAYS_OF_WEEK[new Date().getDay()];
  const activeDayName = selectedPastDay?.dayName || todayName;

  // Active data (Today vs. Historical day being viewed)
  const activeMeals = selectedPastDay ? selectedPastDay.meals : meals;
  const activeWorkouts = selectedPastDay ? selectedPastDay.workouts : workouts;
  const activeGoal = selectedPastDay ? selectedPastDay.goalCalories : goal;

  // Energy balance calculations
  const totalConsumed = activeMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalBurned = activeWorkouts.reduce((acc, w) => acc + (Number(w.caloriesBurned) || 0), 0);
  const netCalories = totalConsumed - totalBurned;
  const remainingBudget = activeGoal - netCalories;

  const rawPercentage = Math.round((netCalories / Math.max(1, activeGoal)) * 100);
  const isOverGoal = netCalories > activeGoal;
  const displayPercentage = Math.min(100, Math.max(0, rawPercentage));

  // Scheduled Workout for the active day
  const scheduledForToday = trainingSchedule?.schedule?.find((s) => s.day === activeDayName);
  const isWorkoutDoneToday = activeWorkouts.length > 0 || scheduledForToday?.type === 'Rest';
  const isCalorieGoalSatisfied = totalConsumed >= Math.round(activeGoal * 0.85);
  const isMealsLogged = activeMeals.length >= 3;

  // Gamification & XP
  const completedMissionsCount =
    (isWorkoutDoneToday ? 1 : 0) +
    (isCalorieGoalSatisfied ? 1 : 0) +
    (isMealsLogged ? 1 : 0);
  const isFullyLockedIn = completedMissionsCount === 3;
  const earnedXp = (isWorkoutDoneToday ? 100 : 0) + (isCalorieGoalSatisfied ? 75 : 0) + (activeMeals.length * 25);

  // SVG Energy Halo calculations
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

  // Diet Plan Meal Slots
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const loggedMealsByType = {
    Breakfast: activeMeals.filter((m) => m.name.toLowerCase().includes('breakfast') || m.time < '11:00'),
    Lunch: activeMeals.filter((m) => m.name.toLowerCase().includes('lunch') || (m.time >= '11:00' && m.time < '16:00')),
    Dinner: activeMeals.filter((m) => m.name.toLowerCase().includes('dinner') || m.time >= '17:30'),
    Snack: activeMeals.filter((m) => m.name.toLowerCase().includes('snack') || (m.time >= '16:00' && m.time < '17:30')),
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleAddMeal = (e) => {
    e?.preventDefault();
    setErrorMsg('');

    const trimmedName = mealName.trim();
    const parsedCals = parseInt(calories, 10);

    if (!trimmedName) {
      setErrorMsg('Enter food name');
      return;
    }

    if (isNaN(parsedCals) || parsedCals <= 0) {
      setErrorMsg('Enter valid calories');
      return;
    }

    const newMeal = {
      id: Date.now(),
      name: trimmedName,
      calories: parsedCals,
      time: getFormattedTime(),
    };

    setMeals((prev) => [newMeal, ...prev]);
    setMealName('');
    setCalories('');
    showToast(`+${parsedCals} kcal • ${trimmedName}`);
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 animate-slide-up border border-orange-500/40 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-orange-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Recipe Modal */}
      <RecipeModal
        isOpen={Boolean(selectedRecipeMeal)}
        onClose={() => setSelectedRecipeMeal(null)}
        meal={selectedRecipeMeal}
        onLogMeal={(m) => {
          const newM = {
            id: Date.now(),
            name: `[${m.meal}] ${m.title}`,
            calories: m.calories,
            time: getFormattedTime(),
          };
          setMeals((prev) => [newM, ...prev]);
          showToast(`Logged ${m.title}`);
        }}
      />

      {/* 0. DAY NAVIGATOR & ATHLETIC HISTORY BAR */}
      <div className="flex items-center justify-between px-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Previous Day Button */}
          <button
            type="button"
            onClick={() => {
              if (historyRecords.length > 0) {
                if (!selectedHistoryDate) {
                  setSelectedHistoryDate(historyRecords[0].date);
                } else {
                  const currIdx = historyRecords.findIndex((h) => h.date === selectedHistoryDate);
                  if (currIdx < historyRecords.length - 1) {
                    setSelectedHistoryDate(historyRecords[currIdx + 1].date);
                  }
                }
              } else if (onOpenHistory) {
                onOpenHistory();
              }
            }}
            disabled={
              historyRecords.length === 0 ||
              (selectedHistoryDate &&
                historyRecords.findIndex((h) => h.date === selectedHistoryDate) ===
                  historyRecords.length - 1)
            }
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center active-press disabled:opacity-25 transition-colors shrink-0"
            title="View previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex items-center gap-1.5">
            {!selectedHistoryDate && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
            <span className="text-xs font-black text-white uppercase tracking-wider truncate">
              {selectedHistoryDate ? formatHumanDate(selectedHistoryDate) : 'Today'}
            </span>
            <span className="text-[11px] text-slate-400 font-bold hidden xs:inline truncate">
              • {selectedPastDay?.dayName || todayName}
            </span>
          </div>

          {/* Next Day Button (disabled when viewing today) */}
          <button
            type="button"
            onClick={() => {
              if (selectedHistoryDate) {
                const currIdx = historyRecords.findIndex((h) => h.date === selectedHistoryDate);
                if (currIdx > 0) {
                  setSelectedHistoryDate(historyRecords[currIdx - 1].date);
                } else {
                  setSelectedHistoryDate(null); // return to today
                }
              }
            }}
            disabled={!selectedHistoryDate}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center active-press disabled:opacity-25 transition-colors shrink-0"
            title="View next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Full History Archive Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-black flex items-center gap-1.5 active-press transition-colors shadow-xs shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span>{t('history') || 'Past Days'}</span>
        </button>
      </div>

      {/* Viewing Past Day Notice Banner */}
      {selectedHistoryDate && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 animate-slide-up">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black text-amber-200 truncate">
              Archived: {formatHumanDate(selectedHistoryDate)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedHistoryDate(null)}
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs active-press shrink-0 shadow-xs transition-colors"
          >
            Back to Today
          </button>
        </div>
      )}

      {/* =========================================================================
          1. HERO ELEMENT: THE "LOCKEDIN ENERGY HALO"
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 shadow-2xl space-y-4">
        {/* Subtle Ambient Energy Glow */}
        <div
          className={`absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isFullyLockedIn ? 'bg-emerald-500/20' : 'bg-orange-500/15'
          }`}
        />

        {/* Top Header Badge & Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-black text-slate-200">
            <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>+{earnedXp} XP</span>
          </div>

          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${
              isFullyLockedIn
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{Math.round((completedMissionsCount / 3) * 100)}% {t('score')}</span>
          </div>
        </div>

        {/* Circular Energy Ring */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 190 190">
              {/* Background Track */}
              <circle
                cx="95"
                cy="95"
                r={radius}
                className="text-slate-800/70"
                strokeWidth="14"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress Halo */}
              <circle
                cx="95"
                cy="95"
                r={radius}
                stroke={isOverGoal ? '#f43f5e' : isFullyLockedIn ? '#10b981' : '#f97316'}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: isFullyLockedIn
                    ? 'drop-shadow(0 0 10px rgba(16,185,129,0.5))'
                    : 'drop-shadow(0 0 10px rgba(249,115,22,0.5))',
                }}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {remainingBudget < 0 ? t('kcalOver') : t('remaining')}
              </span>
              <span className="text-3xl font-black tracking-tight text-white font-mono mt-0.5">
                {Math.abs(remainingBudget)}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {remainingBudget < 0 ? t('kcalOver') : t('kcalLeft')}
              </span>

              {/* Status Tag */}
              <span
                className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isFullyLockedIn
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                {isFullyLockedIn ? t('lockedInStatus') : t('fuelingStatus')}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Pillar Metric Strip */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/50">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight block">
              {t('baseGoal')}
            </span>
            <span className="text-base font-black text-white mt-0.5 block">{goal}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/50">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight block">
              {t('foodIn')}
            </span>
            <span className="text-base font-black text-orange-400 mt-0.5 block">+{totalConsumed}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/50">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight block">
              {t('burnedOut')}
            </span>
            <span className="text-base font-black text-emerald-400 mt-0.5 block">-{totalBurned}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/50">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight block">
              {t('netCals')}
            </span>
            <span className="text-base font-black text-slate-200 mt-0.5 block">{netCalories}</span>
          </div>
        </div>

        {/* Quick Food / Snack Entry Form */}
        {!selectedHistoryDate ? (
          <form onSubmit={handleAddMeal} className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                {t('quickLogTitle')}
              </span>
              {errorMsg && <span className="text-xs text-rose-400 font-bold">{errorMsg}</span>}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder={t('foodPlaceholder')}
                className="col-span-7 px-3 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 font-bold"
              />
              <input
                type="number"
                min="1"
                max="5000"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder={t('calsPlaceholder')}
                className="col-span-3 px-3 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 font-black text-center"
              />
              <button
                type="submit"
                className="col-span-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press flex items-center justify-center transition-all shadow-md shadow-orange-500/25"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-slate-300">
              Archived Record • {activeMeals.length} meals logged
            </span>
            <button
              type="button"
              onClick={() => setSelectedHistoryDate(null)}
              className="text-orange-400 hover:text-orange-300 font-black text-xs transition-colors"
            >
              Return to Today →
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. DAILY MISSIONS / QUESTS
          ========================================================================= */}
      <div className="bg-slate-900/80 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              {t('dailyQuests')} ({completedMissionsCount}/3)
            </h3>
          </div>
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
            {Math.round((completedMissionsCount / 3) * 100)}%
          </span>
        </div>

        <div className="space-y-2">
          {/* Quest 1: Workout */}
          <div
            onClick={onNavigateToWorkouts}
            className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all active-press border ${
              isWorkoutDoneToday
                ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isWorkoutDoneToday
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'border border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-xs font-bold truncate">
                {isWorkoutDoneToday ? t('trainingDone') : (scheduledForToday?.title || t('trainingPending'))}
              </span>
            </div>
            <span className={`text-[11px] font-black shrink-0 ${isWorkoutDoneToday ? 'text-emerald-400' : 'text-orange-400'}`}>
              {isWorkoutDoneToday ? t('doneBadge') : `${t('startBadge')} →`}
            </span>
          </div>

          {/* Quest 2: Calorie Target */}
          <div
            onClick={onNavigateToDiet}
            className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all active-press border ${
              isCalorieGoalSatisfied
                ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isCalorieGoalSatisfied
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'border border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-xs font-bold truncate">
                {isCalorieGoalSatisfied ? t('calsHit') : `${t('calsPending')}: ${Math.max(0, goal - totalConsumed)} kcal`}
              </span>
            </div>
            <span className={`text-[11px] font-black shrink-0 ${isCalorieGoalSatisfied ? 'text-emerald-400' : 'text-orange-400'}`}>
              {isCalorieGoalSatisfied ? t('doneBadge') : `${t('logBadge')} →`}
            </span>
          </div>

          {/* Quest 3: 3+ Meals Logged */}
          <div
            onClick={onNavigateToDiet}
            className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all active-press border ${
              isMealsLogged
                ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isMealsLogged
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'border border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-xs font-bold truncate">
                {t('mealsLoggedCount')} ({meals.length}/3)
              </span>
            </div>
            <span className={`text-[11px] font-black shrink-0 ${isMealsLogged ? 'text-emerald-400' : 'text-orange-400'}`}>
              {isMealsLogged ? t('doneBadge') : `${t('logBadge')} →`}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. TODAY'S TRAINING SESSION SUMMARY (RULE OF ONE PRIMARY ACTION)
          ========================================================================= */}
      <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-orange-400 block">
                {t('todaysWorkout')}
              </span>
              <h3 className="text-sm font-black text-white truncate mt-0.5">
                {scheduledForToday?.title || `${todayName} Session`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToWorkouts}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-black text-orange-400 flex items-center gap-1 shrink-0 active-press transition-colors"
          >
            <span>{isWorkoutDoneToday ? t('reviewWorkout') : t('startWorkout')}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {isWorkoutDoneToday ? (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-emerald-200 truncate">
                  {workouts.length > 0 ? workouts[0].title : t('restDay')}
                </p>
                <span className="text-xs text-emerald-400/80 font-bold block truncate">
                  {workouts.length > 0
                    ? `${workouts[0].duration}m • -${workouts[0].caloriesBurned} kcal`
                    : t('restFocus')}
                </span>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              {t('completed')}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-xs text-slate-200 font-bold truncate">
                {scheduledForToday?.focus || 'Scheduled athletic session'}
              </p>
              {scheduledForToday?.duration && (
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  ⏱ {scheduledForToday.duration}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onNavigateToWorkouts}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press shadow-md shadow-orange-500/20 shrink-0 transition-colors"
            >
              {t('startWorkout')}
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. 4-MEAL NUTRITION SCHEDULE GLANCE
          ========================================================================= */}
      <div className="bg-slate-900/80 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                {t('nutritionSchedule')}
              </span>
              <h3 className="text-xs font-black text-white truncate">
                {meals.length} / 4 {t('mealsLoggedOf')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToDiet}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-black text-orange-400 hover:text-orange-300 flex items-center gap-1 shrink-0 active-press transition-colors"
          >
            <span>{t('planRecipes')}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {/* 4-Slot Grid Cards */}
        <div className="grid grid-cols-2 gap-2">
          {mealSlots.map((slot) => {
            const planItem = dietPlan.find((p) => p.meal === slot);
            const isLogged = loggedMealsByType[slot]?.length > 0;

            return (
              <div
                key={slot}
                onClick={() => {
                  if (planItem) setSelectedRecipeMeal(planItem);
                  else onNavigateToDiet();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer active-press ${
                  isLogged
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100'
                    : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {slot}
                  </span>
                  {isLogged ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[11px] font-black text-orange-400">
                      {planItem ? `${planItem.calories} kcal` : 'Empty'}
                    </span>
                  )}
                </div>
                <p className="text-xs font-black truncate">
                  {isLogged
                    ? loggedMealsByType[slot][0].name
                    : planItem
                    ? planItem.title
                    : t('tapToLog')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
