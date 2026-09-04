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

  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const historyRecords = getDailyHistory();
  const selectedPastDay = selectedHistoryDate
    ? historyRecords.find((h) => h.date === selectedHistoryDate)
    : null;

  const todayName = DAYS_OF_WEEK[new Date().getDay()];
  const activeDayName = selectedPastDay?.dayName || todayName;

  const activeMeals = selectedPastDay ? selectedPastDay.meals : meals;
  const activeWorkouts = selectedPastDay ? selectedPastDay.workouts : workouts;
  const activeGoal = selectedPastDay ? selectedPastDay.goalCalories : goal;

  const totalConsumed = activeMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalBurned = activeWorkouts.reduce((acc, w) => acc + (Number(w.caloriesBurned) || 0), 0);
  const netCalories = totalConsumed - totalBurned;
  const remainingBudget = activeGoal - netCalories;

  const rawPercentage = Math.round((netCalories / Math.max(1, activeGoal)) * 100);
  const isOverGoal = netCalories > activeGoal;
  const displayPercentage = Math.min(100, Math.max(0, rawPercentage));

  const scheduledForToday = trainingSchedule?.schedule?.find((s) => s.day === activeDayName);
  const isWorkoutDoneToday = activeWorkouts.length > 0 || scheduledForToday?.type === 'Rest';
  const isCalorieGoalSatisfied = totalConsumed >= Math.round(activeGoal * 0.85);
  const isMealsLogged = activeMeals.length >= 3;

  const completedMissionsCount =
    (isWorkoutDoneToday ? 1 : 0) +
    (isCalorieGoalSatisfied ? 1 : 0) +
    (isMealsLogged ? 1 : 0);
  const isFullyLockedIn = completedMissionsCount === 3;
  const earnedXp = (isWorkoutDoneToday ? 100 : 0) + (isCalorieGoalSatisfied ? 75 : 0) + (activeMeals.length * 25);

  const getLockedInStatus = (count) => {
    switch (count) {
      case 3:
        return {
          badge: '100% LOCKED IN 👑',
          pillClass: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50',
          ringStatus: '100% LOCKED IN (ABSOLUTE BEAST)',
        };
      case 2:
        return {
          badge: '66% LOCKED IN 🔥',
          pillClass: 'bg-orange-950/80 text-orange-300 border border-orange-500/50',
          ringStatus: '66% LOCKED IN (STAY FOCUSED)',
        };
      case 1:
        return {
          badge: '33% LOCKED IN ⚡',
          pillClass: 'bg-amber-950/80 text-amber-300 border border-amber-500/50',
          ringStatus: '33% LOCKED IN (WARMING UP)',
        };
      default:
        return {
          badge: '0% LOCKED IN 💀',
          pillClass: 'bg-slate-900 text-slate-400 border border-slate-700',
          ringStatus: '0% LOCKED IN (WAKE UP BRO)',
        };
    }
  };
  const lockedInStatusInfo = getLockedInStatus(completedMissionsCount);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

  const mealSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const loggedMealsByType = {
    Breakfast: activeMeals.filter((m) => m.name.toLowerCase().includes('breakfast') || m.time < '11:00'),
    Lunch: activeMeals.filter((m) => m.name.toLowerCase().includes('lunch') || (m.time >= '11:00' && m.time < '16:00')),
    Dinner: activeMeals.filter((m) => m.name.toLowerCase().includes('dinner') || m.time >= '17:30'),
    Snack: activeMeals.filter((m) => m.name.toLowerCase().includes('snack') || (m.time >= '16:00' && m.time < '17:30')),
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
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
      setErrorMsg('Please enter the name of your food');
      return;
    }

    if (isNaN(parsedCals) || parsedCals <= 0) {
      setErrorMsg('Please enter a positive calorie number');
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
    showToast(`Added: ${trimmedName} (${parsedCals} calories)`);
  };

  return (
    <div className="space-y-5 pb-32 animate-fade-in w-full max-w-lg mx-auto">
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900 text-white text-sm font-extrabold rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-orange-400"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

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
          showToast(`Logged meal: ${m.title}`);
        }}
      />

      <nav aria-label="Day Navigation" className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
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
            aria-label="View previous day records"
            className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white flex items-center justify-center active-press disabled:opacity-30 transition-colors shrink-0 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="min-w-0 flex items-center gap-2">
            {!selectedHistoryDate && (
              <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0 ring-2 ring-emerald-950" />
            )}
            <span className="text-sm font-black text-white uppercase tracking-wider truncate">
              {selectedHistoryDate ? formatHumanDate(selectedHistoryDate) : 'Today'}
            </span>
            <span className="text-xs text-slate-300 font-bold hidden xs:inline truncate">
              ({selectedPastDay?.dayName || todayName})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedHistoryDate) {
                const currIdx = historyRecords.findIndex((h) => h.date === selectedHistoryDate);
                if (currIdx > 0) {
                  setSelectedHistoryDate(historyRecords[currIdx - 1].date);
                } else {
                  setSelectedHistoryDate(null);
                }
              }
            }}
            disabled={!selectedHistoryDate}
            aria-label="View next day records"
            className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white flex items-center justify-center active-press disabled:opacity-30 transition-colors shrink-0 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="Open past days history archive"
          className="min-h-[48px] px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white text-sm font-black flex items-center gap-2 active-press transition-colors shrink-0 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <Calendar className="w-5 h-5 text-amber-400" />
          <span>{t('history') || 'Past Days'}</span>
        </button>
      </nav>

      {selectedHistoryDate && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border-2 border-amber-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Calendar className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-sm font-black text-amber-100 truncate">
              Viewing: {formatHumanDate(selectedHistoryDate)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedHistoryDate(null)}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm active-press shrink-0 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            Back to Today
          </button>
        </div>
      )}

      <section
        aria-label="Today's Calorie Summary"
        className="relative overflow-hidden rounded-3xl bg-slate-900 border-2 border-slate-700 p-6 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-sm font-black text-white">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>+{earnedXp} Points</span>
          </div>

          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border-2 transition-all ${lockedInStatusInfo.pillClass}`}
          >
            <Trophy className="w-4 h-4" />
            <span>{lockedInStatusInfo.badge}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-2 relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="text-slate-800"
                strokeWidth="18"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke={isOverGoal ? '#f43f5e' : isFullyLockedIn ? '#10b981' : '#f97316'}
                strokeWidth="18"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                {remainingBudget < 0 ? 'Calories Over Target' : 'Calories Remaining'}
              </span>
              <span className="text-4xl font-black text-white font-mono mt-1">
                {Math.abs(remainingBudget)}
              </span>
              <span className="text-sm font-extrabold text-slate-200 mt-0.5">
                {remainingBudget < 0 ? 'kcal over limit' : 'kcal to eat'}
              </span>

              <span
                className={`mt-2.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 ${
                  isFullyLockedIn
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-400'
                    : 'bg-orange-950 text-orange-300 border-orange-400'
                }`}
              >
                {lockedInStatusInfo.ringStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5 pt-3 border-t-2 border-slate-800 text-center">
          <div className="p-3 rounded-2xl bg-slate-950 border-2 border-slate-800">
            <span className="text-xs font-black text-slate-300 uppercase block">
              Daily Goal
            </span>
            <span className="text-lg font-black text-white mt-1 block font-mono">{goal}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border-2 border-slate-800">
            <span className="text-xs font-black text-slate-300 uppercase block">
              Food In
            </span>
            <span className="text-lg font-black text-amber-400 mt-1 block font-mono">+{totalConsumed}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border-2 border-slate-800">
            <span className="text-xs font-black text-slate-300 uppercase block">
              Burned
            </span>
            <span className="text-lg font-black text-emerald-400 mt-1 block font-mono">-{totalBurned}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border-2 border-slate-800">
            <span className="text-xs font-black text-slate-300 uppercase block">
              Net Total
            </span>
            <span className="text-lg font-black text-white mt-1 block font-mono">{netCalories}</span>
          </div>
        </div>

        {!selectedHistoryDate ? (
          <form onSubmit={handleAddMeal} className="space-y-2.5 pt-3 border-t-2 border-slate-800">
            <div className="flex items-center justify-between">
              <label htmlFor="quick-meal-name" className="text-xs font-black text-white uppercase tracking-wider block">
                Quick Food Logger
              </label>
              {errorMsg && <span className="text-xs text-rose-300 font-extrabold">{errorMsg}</span>}
            </div>

            <div className="grid grid-cols-12 gap-2.5">
              <input
                id="quick-meal-name"
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="What did you eat?"
                aria-label="Food name"
                className="col-span-7 min-h-[52px] px-3.5 text-sm rounded-2xl border-2 border-slate-700 bg-slate-950 text-white placeholder:text-slate-400 font-bold focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
              />
              <input
                id="quick-meal-calories"
                type="number"
                min="1"
                max="5000"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Calories"
                aria-label="Food calories"
                className="col-span-3 min-h-[52px] px-2 text-sm rounded-2xl border-2 border-slate-700 bg-slate-950 text-white placeholder:text-slate-400 font-black text-center font-mono focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
              />
              <button
                type="submit"
                aria-label="Add meal"
                className="col-span-2 min-h-[52px] min-w-[52px] rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-base font-black active-press flex items-center justify-center transition-all shadow-md focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-3 border-t-2 border-slate-800 flex items-center justify-between text-sm text-slate-300">
            <span className="font-bold">
              Archived Record • {activeMeals.length} meals logged
            </span>
            <button
              type="button"
              onClick={() => setSelectedHistoryDate(null)}
              className="min-h-[48px] px-3 py-2 text-amber-400 hover:text-amber-300 font-black text-sm transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              Return to Today →
            </button>
          </div>
        )}
      </section>

      <section
        aria-label="Daily Goals and Missions"
        className="bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {t('dailyQuests')} ({completedMissionsCount}/3 Completed)
            </h3>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full border-2 transition-all ${lockedInStatusInfo.pillClass}`}>
            {lockedInStatusInfo.badge}
          </span>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onNavigateToWorkouts}
            className={`w-full min-h-[58px] p-4 rounded-2xl flex items-center justify-between transition-all active-press border-2 text-left focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isWorkoutDoneToday
                ? 'bg-emerald-950/70 text-emerald-100 border-emerald-400'
                : 'bg-slate-950 text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isWorkoutDoneToday
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border-2 border-slate-500 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm font-extrabold truncate">
                {isWorkoutDoneToday ? t('trainingDone') : (scheduledForToday?.title || t('trainingPending'))}
              </span>
            </div>
            <span className={`text-xs font-black shrink-0 ${isWorkoutDoneToday ? 'text-emerald-300' : 'text-amber-400'}`}>
              {isWorkoutDoneToday ? t('doneBadge') : `${t('startBadge')} →`}
            </span>
          </button>

          <button
            type="button"
            onClick={onNavigateToDiet}
            className={`w-full min-h-[58px] p-4 rounded-2xl flex items-center justify-between transition-all active-press border-2 text-left focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isCalorieGoalSatisfied
                ? 'bg-emerald-950/70 text-emerald-100 border-emerald-400'
                : 'bg-slate-950 text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isCalorieGoalSatisfied
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border-2 border-slate-500 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm font-extrabold truncate">
                {isCalorieGoalSatisfied ? t('calsHit') : `${t('calsPending')}: ${Math.max(0, goal - totalConsumed)} kcal left`}
              </span>
            </div>
            <span className={`text-xs font-black shrink-0 ${isCalorieGoalSatisfied ? 'text-emerald-300' : 'text-amber-400'}`}>
              {isCalorieGoalSatisfied ? t('doneBadge') : `${t('logBadge')} →`}
            </span>
          </button>

          <button
            type="button"
            onClick={onNavigateToDiet}
            className={`w-full min-h-[58px] p-4 rounded-2xl flex items-center justify-between transition-all active-press border-2 text-left focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isMealsLogged
                ? 'bg-emerald-950/70 text-emerald-100 border-emerald-400'
                : 'bg-slate-950 text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isMealsLogged
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border-2 border-slate-500 text-transparent'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm font-extrabold truncate">
                {t('mealsLoggedCount')} ({meals.length}/3 Meals)
              </span>
            </div>
            <span className={`text-xs font-black shrink-0 ${isMealsLogged ? 'text-emerald-300' : 'text-amber-400'}`}>
              {isMealsLogged ? t('doneBadge') : `${t('logBadge')} →`}
            </span>
          </button>
        </div>
      </section>

      <section
        aria-label="Today's Workout"
        className="bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-3.5 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-orange-950 text-orange-400 border-2 border-orange-500/40 flex items-center justify-center shrink-0">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs uppercase font-black tracking-wider text-orange-300 block">
                {t('todaysWorkout')}
              </span>
              <h3 className="text-base font-black text-white truncate mt-0.5">
                {scheduledForToday?.title || `${todayName} Session`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToWorkouts}
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 text-sm font-black text-orange-400 flex items-center gap-2 shrink-0 active-press transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <span>{isWorkoutDoneToday ? t('reviewWorkout') : t('startWorkout')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {isWorkoutDoneToday ? (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border-2 border-emerald-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-emerald-100 truncate">
                  {workouts.length > 0 ? workouts[0].title : t('restDay')}
                </p>
                <span className="text-xs text-emerald-300 font-bold block truncate">
                  {workouts.length > 0
                    ? `${workouts[0].duration} mins • -${workouts[0].caloriesBurned} calories burned`
                    : t('restFocus')}
                </span>
              </div>
            </div>
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shrink-0">
              {t('completed')}
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-sm text-white font-extrabold truncate">
                {scheduledForToday?.focus || 'Scheduled workout session'}
              </p>
              {scheduledForToday?.duration && (
                <span className="text-xs text-slate-300 font-bold block mt-0.5">
                  Target duration: {scheduledForToday.duration}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onNavigateToWorkouts}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black active-press shadow-md shrink-0 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {t('startWorkout')}
            </button>
          </div>
        )}
      </section>

      <section
        aria-label="Nutrition and Meal Schedule"
        className="bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-3.5 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs uppercase font-black tracking-wider text-slate-300 block">
                {t('nutritionSchedule')}
              </span>
              <h3 className="text-base font-black text-white truncate">
                {meals.length} / 4 {t('mealsLoggedOf')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToDiet}
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 text-sm font-black text-orange-400 hover:text-orange-300 flex items-center gap-2 shrink-0 active-press transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <span>{t('planRecipes')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mealSlots.map((slot) => {
            const planItem = dietPlan.find((p) => p.meal === slot);
            const isLogged = loggedMealsByType[slot]?.length > 0;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  if (planItem) setSelectedRecipeMeal(planItem);
                  else onNavigateToDiet();
                }}
                className={`min-h-[72px] p-3.5 rounded-2xl border-2 transition-all active-press text-left focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isLogged
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-100'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {slot}
                  </span>
                  {isLogged ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="text-xs font-black text-amber-400">
                      {planItem ? `${planItem.calories} kcal` : 'Not logged'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-black truncate">
                  {isLogged
                    ? loggedMealsByType[slot][0].name
                    : planItem
                    ? planItem.title
                    : t('tapToLog')}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
