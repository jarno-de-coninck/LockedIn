import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  Dumbbell,
  Clock,
  Zap,
  CheckCircle2,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Award,
  Check,
  Star,
} from 'lucide-react';
import RecipeModal from './RecipeModal';

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
}) {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [selectedRecipeMeal, setSelectedRecipeMeal] = useState(null);

  const todayName = DAYS_OF_WEEK[new Date().getDay()];

  // Energy balance calculations
  const totalConsumed = meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalBurned = workouts.reduce((acc, w) => acc + (Number(w.caloriesBurned) || 0), 0);
  const netCalories = totalConsumed - totalBurned;
  const remainingBudget = goal - netCalories;
  
  const rawPercentage = Math.round((netCalories / Math.max(1, goal)) * 100);
  const isOverGoal = netCalories > goal;
  const displayPercentage = Math.min(100, Math.max(0, rawPercentage));

  // Today's Scheduled Workout
  const scheduledForToday = trainingSchedule?.schedule?.find((s) => s.day === todayName);
  const isWorkoutDoneToday = workouts.length > 0 || scheduledForToday?.type === 'Rest';
  const isCalorieGoalSatisfied = totalConsumed >= Math.round(goal * 0.85);
  const isMealsLogged = meals.length >= 3;

  // Daily Completion Mastery
  const isFullyLockedIn = isWorkoutDoneToday && isCalorieGoalSatisfied && isMealsLogged;
  const completedMissionsCount = (isWorkoutDoneToday ? 1 : 0) + (isCalorieGoalSatisfied ? 1 : 0) + (isMealsLogged ? 1 : 0);

  // Diet Plan Meal Slots
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const loggedMealsByType = {
    Breakfast: meals.filter((m) => m.name.toLowerCase().includes('breakfast') || m.time < '11:00'),
    Lunch: meals.filter((m) => m.name.toLowerCase().includes('lunch') || (m.time >= '11:00' && m.time < '16:00')),
    Dinner: meals.filter((m) => m.name.toLowerCase().includes('dinner') || m.time >= '17:30'),
    Snack: meals.filter((m) => m.name.toLowerCase().includes('snack') || (m.time >= '16:00' && m.time < '17:30')),
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
    showToast(`Logged ${trimmedName} (+${parsedCals} kcal)`);
  };

  const handleQuickAdd = (amount) => {
    const newMeal = {
      id: Date.now(),
      name: `Quick Snack (+${amount} kcal)`,
      calories: amount,
      time: getFormattedTime(),
    };

    setMeals((prev) => [newMeal, ...prev]);
    showToast(`Added +${amount} kcal`);
  };

  const handleDeleteMeal = (id, name) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    showToast(`Removed "${name}"`);
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-slide-up border border-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
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

      {/* =========================================================================
          1. REWARDING "LOCKED IN TODAY" CELEBRATION HERO BANNER
          ========================================================================= */}
      {isFullyLockedIn ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-xl border border-emerald-500/40 animate-scale-up">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-3.5">
            {/* Top Bar with Balanced Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider shadow-inner">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Locked In</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[10px] font-black border border-white/10">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>3/3 Quests Done</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>You Crushed Today!</span>
                <span className="text-base">🔥</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                All daily training finished, {totalConsumed} kcal tracked, and recovery initiated. Consistency is compounding.
              </p>
            </div>

            {/* Checklist of Finished Missions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-white/5 border border-emerald-500/30 text-center">
                <div className="w-4 h-4 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-[9px] font-bold text-slate-300 block">Training</span>
                <span className="text-[10px] font-black text-emerald-400">{workouts.length > 0 ? `${workouts[0].duration}m` : 'Rest Day'}</span>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-emerald-500/30 text-center">
                <div className="w-4 h-4 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-[9px] font-bold text-slate-300 block">Calorie Target</span>
                <span className="text-[10px] font-black text-emerald-400">{totalConsumed} kcal</span>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-emerald-500/30 text-center">
                <div className="w-4 h-4 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-[9px] font-bold text-slate-300 block">Nutrition</span>
                <span className="text-[10px] font-black text-emerald-400">{meals.length} Meals</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DAILY QUESTS TRACKER (PROGRESS TOWARDS 100%) */
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daily Quests ({completedMissionsCount}/3 Done)
              </h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
              {Math.round((completedMissionsCount / 3) * 100)}%
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Quest 1: Workout */}
            <div
              onClick={onNavigateToWorkouts}
              className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors active-press ${
                isWorkoutDoneToday ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isWorkoutDoneToday ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                  {isWorkoutDoneToday && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold truncate">
                  {scheduledForToday?.title || "Today's Training"}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 shrink-0">
                {isWorkoutDoneToday ? 'Done ✓' : 'Start →'}
              </span>
            </div>

            {/* Quest 2: Calorie Target */}
            <div
              onClick={onNavigateToDiet}
              className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors active-press ${
                isCalorieGoalSatisfied ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isCalorieGoalSatisfied ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                  {isCalorieGoalSatisfied && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold truncate">
                  Reach Daily Calorie Budget ({goal} kcal)
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 shrink-0">
                {isCalorieGoalSatisfied ? 'Hit ✓' : `${Math.max(0, goal - totalConsumed)} left`}
              </span>
            </div>

            {/* Quest 3: 3+ Meals Logged */}
            <div
              onClick={onNavigateToDiet}
              className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors active-press ${
                isMealsLogged ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isMealsLogged ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                  {isMealsLogged && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold truncate">
                  Track Nutrition ({meals.length}/3 Meals)
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 shrink-0">
                {isMealsLogged ? 'Logged ✓' : 'Log →'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. HERO CALORIE HUD CARD
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Remaining Budget
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                {Math.abs(remainingBudget)}
              </h2>
              <span className="text-xs font-bold text-slate-400">
                {remainingBudget < 0 ? 'kcal over' : 'kcal left'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Daily Target
            </span>
            <span className="text-xs font-extrabold text-slate-800">
              {goal} kcal
            </span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverGoal
                  ? 'bg-rose-500'
                  : isFullyLockedIn
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}
              style={{ width: `${displayPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
            <span>{displayPercentage}% consumed</span>
            <span>{netCalories} net kcal</span>
          </div>
        </div>

        {/* 4-Stat Metrics Row */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100 text-center">
          <div className="p-1.5 rounded-xl bg-slate-50">
            <span className="text-[8px] font-bold text-slate-400 uppercase block">Base</span>
            <span className="text-xs font-extrabold text-slate-800">{goal}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50">
            <span className="text-[8px] font-bold text-slate-400 uppercase block">Food</span>
            <span className="text-xs font-extrabold text-orange-600">+{totalConsumed}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50">
            <span className="text-[8px] font-bold text-slate-400 uppercase block">Burned</span>
            <span className="text-xs font-extrabold text-emerald-600">-{totalBurned}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-slate-50">
            <span className="text-[8px] font-bold text-slate-400 uppercase block">Net</span>
            <span className="text-xs font-extrabold text-slate-800">{netCalories}</span>
          </div>
        </div>

        {/* Quick Food / Snack Entry Form with Name & Calories */}
        <form onSubmit={handleAddMeal} className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Log Food / Snack
            </span>
            {errorMsg && <span className="text-[10px] text-rose-500 font-bold">{errorMsg}</span>}
          </div>

          <div className="grid grid-cols-12 gap-1.5">
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Greek Yogurt, Protein Bar"
              className="col-span-7 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
            />
            <input
              type="number"
              min="1"
              max="5000"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="kcal"
              className="col-span-3 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold text-center"
            />
            <button
              type="submit"
              className="col-span-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press flex items-center justify-center transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================================
          3. TODAY'S TRAINING SESSION SUMMARY
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Today's Workout
              </span>
              <h3 className="text-xs font-black text-slate-900">
                {scheduledForToday?.title || `${todayName} Session`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToWorkouts}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 active-press"
          >
            <span>{isWorkoutDoneToday ? 'Review' : 'Start'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {isWorkoutDoneToday ? (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {workouts.length > 0 ? workouts[0].title : 'Rest & Recovery Day'}
                </p>
                <span className="text-[10px] text-emerald-700">
                  {workouts.length > 0 ? `${workouts[0].duration}m • -${workouts[0].caloriesBurned} kcal burned` : 'Active recovery active'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900">
              Completed
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-600 font-medium">
              {scheduledForToday?.focus || 'Scheduled strength training session'}
            </p>
            <button
              type="button"
              onClick={onNavigateToWorkouts}
              className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold active-press shadow-xs shrink-0"
            >
              Start
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. 4-MEAL NUTRITION SCHEDULE GLANCE
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Nutrition Schedule
              </span>
              <h3 className="text-xs font-black text-slate-900">
                {meals.length} / 4 Meals Logged
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToDiet}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 active-press"
          >
            <span>Plan & Recipes</span>
            <ArrowRight className="w-3 h-3" />
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
                className={`p-2.5 rounded-xl border transition-all cursor-pointer active-press ${
                  isLogged
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    {slot}
                  </span>
                  {isLogged ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-[9px] font-bold text-orange-500">
                      {planItem ? `${planItem.calories} kcal` : 'Empty'}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold truncate">
                  {isLogged
                    ? loggedMealsByType[slot][0].name
                    : planItem
                    ? planItem.title
                    : 'Tap to log'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
