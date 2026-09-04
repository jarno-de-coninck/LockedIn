import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ListChecks,
  CheckCircle2,
  Clock,
  BookOpen,
  Loader2,
  ChefHat,
} from 'lucide-react';
import RecipeModal from './RecipeModal';
import { useLanguage } from '../services/i18n';
import { regenerateSingleMeal, generateCustomMealFromPrompt } from '../services/groq';

const MEAL_THEMES = {
  Breakfast: { badge: 'bg-amber-950/60 text-amber-300 border border-amber-500/40' },
  Lunch: { badge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' },
  Dinner: { badge: 'bg-sky-950/60 text-sky-300 border border-sky-500/40' },
  Snack: { badge: 'bg-orange-950/60 text-orange-300 border border-orange-500/40' },
};

const QUICK_IDEAS = [
  'High-Protein Chicken & Rice Bowl',
  'Low-Carb Salmon & Avocado Salad',
  'Quick 10-Min Eggs & Whole Wheat Toast',
  'Post-Workout Beef & Sweet Potato Mash',
];

export default function DietTab({
  meals,
  setMeals,
  dietPlan = [],
  setDietPlan,
  goal,
  onNavigateToAiStudio,
}) {
  const { t } = useLanguage();
  const [dietView, setDietView] = useState('to_eat');
  const [regeneratingMealId, setRegeneratingMealId] = useState(null);
  const [selectedRecipeMeal, setSelectedRecipeMeal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [cravingSlot, setCravingSlot] = useState('Lunch');
  const [cravingInput, setCravingInput] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const [quickMealName, setQuickMealName] = useState('');
  const [quickMealCals, setQuickMealCals] = useState('');

  const totalFoodConsumed = meals.reduce((a, m) => a + (Number(m.calories) || 0), 0);
  const remainingKcal = Math.max(0, goal - totalFoodConsumed);
  const progressPercent = Math.min(100, Math.round((totalFoodConsumed / (goal || 2500)) * 100));

  const isMealEaten = (planItem) => {
    return meals.some(
      (m) =>
        m.name.toLowerCase().includes(planItem.meal.toLowerCase()) ||
        m.name.toLowerCase().includes(planItem.title.toLowerCase())
    );
  };

  const pendingPlanMeals = dietPlan.filter((p) => !isMealEaten(p));

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const getFormattedTime = (mealType) => {
    const timeMap = { Breakfast: '08:30', Lunch: '12:30', Dinner: '19:00', Snack: '16:00' };
    return timeMap[mealType] || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogPlanMeal = (item) => {
    const newMeal = {
      id: Date.now(),
      name: `[${item.meal}] ${item.title}`,
      calories: Number(item.calories) || 400,
      time: getFormattedTime(item.meal),
      ingredients: item.ingredients,
      instructions: item.instructions,
    };

    setMeals((prev) => [newMeal, ...prev]);
    showToast(`Logged ${item.meal} (+${item.calories} kcal)`);
  };

  const handleSwapSingleMeal = async (targetItem) => {
    if (regeneratingMealId) return;
    setRegeneratingMealId(targetItem.id);

    try {
      const res = await regenerateSingleMeal({
        mealSlot: targetItem.meal,
        targetCalories: targetItem.calories,
        dietType: 'High Protein',
      });

      if (res && res.meal) {
        setDietPlan((prev) =>
          prev.map((m) =>
            m.id === targetItem.id
              ? { ...res.meal, id: targetItem.id, calories: targetItem.calories }
              : m
          )
        );
        showToast(`Swapped ${targetItem.meal} recipe!`);
        if (selectedRecipeMeal?.id === targetItem.id) {
          setSelectedRecipeMeal({ ...res.meal, id: targetItem.id, calories: targetItem.calories });
        }
      }
    } catch (err) {
      console.warn('Single meal swap error:', err);
      showToast('Swap failed. Please try again.');
    } finally {
      setRegeneratingMealId(null);
    }
  };

  const handleGenerateGuidedRecipe = async (specificCraving = null) => {
    if (isGeneratingCustom) return;
    setIsGeneratingCustom(true);

    const targetCals = Math.min(
      850,
      Math.max(300, Math.round(remainingKcal > 350 ? remainingKcal / 2 : goal / 4))
    );

    const promptText = specificCraving || cravingInput.trim() || 'High protein balanced athlete meal';

    try {
      const res = await generateCustomMealFromPrompt({
        promptText,
        mealSlot: cravingSlot,
        targetCalories: targetCals,
        dietType: 'High Protein',
      });

      if (res && res.meal) {
        setDietPlan((prev) => {
          const filtered = prev.filter((p) => p.meal !== cravingSlot);
          return [...filtered, res.meal];
        });
        setSelectedRecipeMeal(res.meal);
        setCravingInput('');
        setDietView('to_eat');
        showToast(`Created: ${res.meal.title}!`);
      }
    } catch (err) {
      console.warn('Recipe generation error:', err);
      showToast('Recipe creation failed. Please try again.');
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    const name = quickMealName.trim();
    const cals = parseInt(quickMealCals, 10);
    if (!name || isNaN(cals) || cals <= 0) return;

    const newMeal = {
      id: Date.now(),
      name,
      calories: cals,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMeals((prev) => [newMeal, ...prev]);
    setQuickMealName('');
    setQuickMealCals('');
    showToast(`Logged ${name} (+${cals} kcal)`);
  };

  return (
    <div className="space-y-4 pb-32 animate-fade-in w-full max-w-md mx-auto px-1">
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-orange-400 backdrop-blur-md"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <RecipeModal
        isOpen={Boolean(selectedRecipeMeal)}
        onClose={() => setSelectedRecipeMeal(null)}
        meal={selectedRecipeMeal}
        onLogMeal={handleLogPlanMeal}
        onSwapMeal={handleSwapSingleMeal}
        isSwapping={Boolean(regeneratingMealId)}
      />

      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Daily Nutrition</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalFoodConsumed} of {goal} kcal ({progressPercent}%)
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
            {remainingKcal} kcal left
          </span>
        </div>

        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Diet View
          </span>
          <select
            value={dietView}
            onChange={(e) => setDietView(e.target.value)}
            className="bg-slate-950 text-white text-xs font-bold rounded-xl border border-slate-700 px-3 py-1.5 focus:border-orange-500 focus:outline-none"
          >
            <option value="to_eat">Planned Meals ({pendingPlanMeals.length})</option>
            <option value="cook">Cook AI Meal</option>
            <option value="eaten">Eaten Log ({meals.length})</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setDietView('to_eat')}
            className={`min-h-[42px] px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
              dietView === 'to_eat'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>To Eat ({pendingPlanMeals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDietView('cook')}
            className={`min-h-[42px] px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
              dietView === 'cook'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Cook Meal</span>
          </button>

          <button
            type="button"
            onClick={() => setDietView('eaten')}
            className={`min-h-[42px] px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
              dietView === 'eaten'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Eaten ({meals.length})</span>
          </button>
        </div>
      </div>

      {dietView === 'cook' && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Chef Lock Meal Cooker</h3>
              <p className="text-xs text-slate-400">
                Target: ~{Math.round(remainingKcal > 350 ? remainingKcal / 2 : goal / 4)} kcal per meal
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Meal Slot
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setCravingSlot(slot)}
                  className={`min-h-[42px] rounded-xl text-xs font-bold border transition-all active-press ${
                    cravingSlot === slot
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              What are you craving?
            </label>
            <input
              type="text"
              value={cravingInput}
              onChange={(e) => setCravingInput(e.target.value)}
              placeholder="e.g. salmon, pasta, chicken, steak (or leave blank)"
              className="w-full min-h-[48px] px-3.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">
              Or pick a 1-tap recipe idea:
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleGenerateGuidedRecipe(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full min-h-[44px] px-3 text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Select a popular athlete recipe idea...</option>
              {QUICK_IDEAS.map((idea) => (
                <option key={idea} value={idea}>
                  {idea}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateGuidedRecipe()}
            disabled={isGeneratingCustom}
            className="w-full min-h-[48px] px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active-press mt-1"
          >
            {isGeneratingCustom ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cooking {cravingSlot} Meal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Cook {cravingSlot} Meal</span>
              </>
            )}
          </button>
        </div>
      )}

      {dietView === 'to_eat' && (
        <div className="space-y-3 animate-slide-up">
          {dietPlan.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900 shadow-md space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">No Planned Meals Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Switch to Cook Meal above to generate your first meal, or generate a 4-meal plan in AI Studio.
              </p>
              <button
                type="button"
                onClick={() => setDietView('cook')}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold active-press transition-colors shadow-sm"
              >
                <ChefHat className="w-4 h-4" />
                <span>Cook a Meal Now</span>
              </button>
            </div>
          ) : pendingPlanMeals.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5 animate-fade-in">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <h4 className="text-sm font-bold text-emerald-200">All Scheduled Meals Logged</h4>
              <p className="text-xs text-emerald-300/80">Great job hitting your nutrition targets today.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingPlanMeals.map((item, idx) => {
                const theme = MEAL_THEMES[item.meal] || { badge: 'bg-slate-950 text-white border-slate-700' };
                const isSwapping = regeneratingMealId === item.id;

                return (
                  <div
                    key={item.id || idx}
                    className={`bg-slate-900 rounded-2xl p-3.5 border border-slate-800 shadow-md space-y-2.5 transition-all ${
                      isSwapping ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${theme.badge}`}>
                          {item.meal}
                        </span>
                        {item.prepTime && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {item.prepTime}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {item.calories} <span className="text-[10px] text-slate-400">kcal</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setSelectedRecipeMeal(item)}
                        className="min-h-[42px] flex-1 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Recipe & Ingredients</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogPlanMeal(item)}
                        className="min-h-[42px] px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 active-press shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Log</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {dietView === 'eaten' && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Eaten Food Log ({meals.length})
            </span>
            {meals.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all logged meals for today?')) {
                    setMeals([]);
                    showToast('Cleared today meal log');
                  }
                }}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900 shadow-md space-y-1">
              <p className="text-xs font-bold text-slate-400">{t('noMealsYet')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-sm"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{meal.name}</p>
                    <span className="text-[11px] text-slate-400 block">{meal.time || 'Logged'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {meal.calories} <span className="text-[10px] text-slate-400">kcal</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMeals((prev) => prev.filter((m) => m.id !== meal.id));
                        showToast(`Removed "${meal.name}"`);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors active-press"
                      aria-label="Remove meal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 shadow-md space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Quick Manual Food Entry
            </span>
            <form onSubmit={handleQuickAdd} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={quickMealName}
                onChange={(e) => setQuickMealName(e.target.value)}
                placeholder="What did you eat?"
                className="col-span-7 min-h-[44px] px-3 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
              />
              <input
                type="number"
                min="1"
                max="5000"
                value={quickMealCals}
                onChange={(e) => setQuickMealCals(e.target.value)}
                placeholder="kcal"
                className="col-span-3 min-h-[44px] px-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-orange-500 text-center font-mono"
              />
              <button
                type="submit"
                className="col-span-2 min-h-[44px] rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold active-press flex items-center justify-center shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
