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
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  ArrowRight,
  ChefHat,
} from 'lucide-react';
import RecipeModal from './RecipeModal';
import { useLanguage } from '../services/i18n';
import { regenerateSingleMeal, generateCustomMealFromPrompt } from '../services/groq';

const MEAL_THEMES = {
  Breakfast: { badge: 'bg-amber-950 text-amber-300 border-2 border-amber-500/40' },
  Lunch: { badge: 'bg-emerald-950 text-emerald-300 border-2 border-emerald-500/40' },
  Dinner: { badge: 'bg-sky-950 text-sky-300 border-2 border-sky-500/40' },
  Snack: { badge: 'bg-orange-950 text-orange-300 border-2 border-orange-500/40' },
};

const RECIPE_STYLES = [
  { id: 'high_protein', label: 'High Protein Fuel', icon: '🥩', prompt: 'High protein fitness meal with lean protein and veggies' },
  { id: 'quick', label: 'Quick 15-Minute Meal', icon: '⚡', prompt: 'Under 15 minutes quick prep with minimal cleanup' },
  { id: 'low_carb', label: 'Low Carb & Clean', icon: '🥑', prompt: 'Low carb, keto-friendly with healthy fats and greens' },
  { id: 'carb_energy', label: 'High Energy Carb Load', icon: '🍝', prompt: 'Pre-workout carb energy with rice or pasta and protein' },
];

const POPULAR_INGREDIENTS = [
  'Chicken Breast',
  'Ground Beef',
  'Salmon',
  'Eggs',
  'White Rice',
  'Potatoes',
  'Avocado',
  'Broccoli',
  'Oats',
  'Pasta',
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
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [selectedRecipeMeal, setSelectedRecipeMeal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [showCravingBuilder, setShowCravingBuilder] = useState(false);
  const [cravingSlot, setCravingSlot] = useState('Lunch');
  const [cravingInput, setCravingInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('high_protein');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const [quickMealName, setQuickMealName] = useState('');
  const [quickMealCals, setQuickMealCals] = useState('');

  const totalFoodConsumed = meals.reduce((a, m) => a + (Number(m.calories) || 0), 0);
  const remainingKcal = Math.max(0, goal - totalFoodConsumed);

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

  const toggleIngredientTag = (ing) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const handleGenerateGuidedRecipe = async () => {
    if (isGeneratingCustom) return;
    setIsGeneratingCustom(true);

    const targetCals = Math.min(
      850,
      Math.max(300, Math.round(remainingKcal > 350 ? remainingKcal / 2 : goal / 4))
    );

    const styleObj = RECIPE_STYLES.find((s) => s.id === selectedStyle) || RECIPE_STYLES[0];
    let combinedPrompt = styleObj.prompt;

    if (selectedIngredients.length > 0) {
      combinedPrompt += ` featuring ingredients: ${selectedIngredients.join(', ')}`;
    }

    if (cravingInput.trim()) {
      combinedPrompt += `. Custom user request: ${cravingInput.trim()}`;
    }

    try {
      const res = await generateCustomMealFromPrompt({
        promptText: combinedPrompt,
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
        setSelectedIngredients([]);
        setShowCravingBuilder(false);
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
    showToast(`Logged ${name} (+${cals} calories)`);
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
        onLogMeal={handleLogPlanMeal}
        onSwapMeal={handleSwapSingleMeal}
        isSwapping={Boolean(regeneratingMealId)}
      />

      <div className="bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Daily Nutrition Plan</h3>
            <p className="text-xs text-slate-300 font-bold mt-0.5">
              Eaten: {totalFoodConsumed} of {goal} kcal target
            </p>
          </div>
          <span className="text-sm font-black px-3.5 py-1.5 rounded-full bg-orange-950 text-orange-300 border-2 border-orange-500/50">
            {remainingKcal} kcal left
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border-2 border-slate-800">
          <button
            type="button"
            onClick={() => setDietView('to_eat')}
            className={`min-h-[48px] px-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 active-press focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
              dietView === 'to_eat'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ListChecks className="w-5 h-5" />
            <span>To Eat ({pendingPlanMeals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDietView('eaten')}
            className={`min-h-[48px] px-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 active-press focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
              dietView === 'eaten'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Eaten ({meals.length})</span>
          </button>
        </div>
      </div>

      {/* SIMPLE PROFILE-CALIBRATED MEAL CREATOR */}
      <div className="bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-orange-950 text-orange-400 border-2 border-orange-500/40 flex items-center justify-center shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Create a Meal</h3>
              <p className="text-xs text-slate-300 font-bold">
                Auto-calibrated to your profile (~{Math.round(remainingKcal > 350 ? remainingKcal / 2 : goal / 4)} kcal target)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setCravingSlot(slot)}
              className={`min-h-[48px] rounded-2xl text-xs font-black border-2 transition-all ${
                cravingSlot === slot
                  ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={cravingInput}
              onChange={(e) => setCravingInput(e.target.value)}
              placeholder="What are you craving? (e.g. salmon, pasta, steak - or leave blank)"
              className="flex-1 min-h-[52px] px-4 text-sm rounded-2xl border-2 border-slate-700 bg-slate-950 text-white placeholder:text-slate-400 font-bold focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => handleGenerateGuidedRecipe()}
              disabled={isGeneratingCustom}
              className="min-h-[52px] px-6 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 active-press shrink-0 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {isGeneratingCustom ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span>{isGeneratingCustom ? 'Cooking...' : 'Cook Meal'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-bold text-slate-400">Quick ideas:</span>
            {[
              '🥩 High-Protein Chicken Bowl',
              '🥑 Low-Carb Salmon Salad',
              '⚡ Quick 10-Min Eggs & Toast',
            ].map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => handleGenerateGuidedRecipe(idea)}
                disabled={isGeneratingCustom}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold active-press transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      </div>

      {dietView === 'to_eat' && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              {t('dailyTarget')} ({goal} kcal)
            </span>
            {onNavigateToAiStudio && (
              <button
                type="button"
                onClick={onNavigateToAiStudio}
                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-black text-amber-300 hover:text-white flex items-center gap-1.5 active-press"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Studio</span>
              </button>
            )}
          </div>

          {dietPlan.length === 0 ? (
            <div className="text-center py-10 px-5 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900 shadow-xl space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">No Active Meal Plan Yet</h4>
              <p className="text-sm text-slate-300 max-w-xs mx-auto font-medium">
                Tap &ldquo;Start Builder&rdquo; above to create a delicious recipe or architect a 4-meal plan in AI Studio.
              </p>
              {onNavigateToAiStudio && (
                <button
                  type="button"
                  onClick={onNavigateToAiStudio}
                  className="min-h-[50px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-black active-press transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate in AI Studio</span>
                </button>
              )}
            </div>
          ) : pendingPlanMeals.length === 0 ? (
            <div className="text-center py-10 px-5 rounded-3xl bg-emerald-950/70 border-2 border-emerald-400 space-y-2 animate-fade-in">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-base font-black text-emerald-100">All Scheduled Meals Logged!</h4>
              <p className="text-sm text-emerald-300 font-bold">Great job hitting your nutrition targets today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPlanMeals.map((item, idx) => {
                const theme = MEAL_THEMES[item.meal] || { badge: 'bg-slate-900 text-white border-slate-700' };
                const isSwapping = regeneratingMealId === item.id;
                const isExpanded = expandedCardId === item.id;

                const ingredients = Array.isArray(item.ingredients) && item.ingredients.length > 0
                  ? item.ingredients
                  : ['Lean Protein', 'Complex Carbs', 'Fresh Vegetables'];

                const instructions = Array.isArray(item.instructions) && item.instructions.length > 0
                  ? item.instructions
                  : ['Prep fresh ingredients.', 'Cook until tender.', 'Season and serve warm.'];

                return (
                  <div
                    key={item.id || idx}
                    className={`bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-4 transition-all ${
                      isSwapping ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                          {item.meal}
                        </span>
                        {item.prepTime && (
                          <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            {item.prepTime}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {item.calories} <span className="text-xs text-slate-300 font-normal">kcal</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white leading-snug">
                        {item.title}
                      </h4>

                      <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t-2 border-slate-800">
                        <div className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-xs font-black uppercase tracking-wider text-orange-400">Protein</span>
                          <span className="text-sm font-black text-white font-mono mt-0.5">{item.protein || Math.round((item.calories * 0.35) / 4)}g</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-xs font-black uppercase tracking-wider text-sky-400">Carbs</span>
                          <span className="text-sm font-black text-white font-mono mt-0.5">{item.carbs || Math.round((item.calories * 0.45) / 4)}g</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Fats</span>
                          <span className="text-sm font-black text-white font-mono mt-0.5">{item.fats || Math.round((item.calories * 0.20) / 9)}g</span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t-2 border-slate-800 space-y-3 text-sm text-slate-200 animate-slide-up">
                        <div className="space-y-1.5">
                          <span className="text-xs font-black text-white uppercase tracking-wider block">
                            Ingredients
                          </span>
                          <ul className="space-y-1.5 pl-1">
                            {ingredients.map((ing, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xs font-black text-white uppercase tracking-wider block">
                            Preparation Steps
                          </span>
                          <ol className="space-y-2 pl-1">
                            {instructions.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 pt-2 border-t-2 border-slate-800">
                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                        className="min-h-[48px] flex-1 px-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press"
                      >
                        <BookOpen className="w-4 h-4 text-slate-300" />
                        <span>{isExpanded ? 'Hide Recipe' : 'View Recipe'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwapSingleMeal(item)}
                        disabled={isSwapping}
                        className="min-h-[48px] px-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 text-slate-200 text-xs font-black transition-all flex items-center gap-1.5 active-press"
                        title="Swap for different recipe"
                      >
                        {isSwapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-orange-400" />}
                        <span>Swap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogPlanMeal(item)}
                        className="min-h-[48px] px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black transition-all flex items-center gap-1.5 active-press shadow-md shadow-orange-600/25"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Log Meal</span>
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
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              {t('eaten')} ({meals.length} items)
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
                className="text-xs font-extrabold text-rose-400 hover:text-rose-300 transition-colors min-h-[44px] px-2 py-1"
              >
                Clear Log
              </button>
            )}
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-10 px-5 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900 shadow-xl space-y-2">
              <p className="text-sm font-bold text-slate-300">{t('noMealsYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-md"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-black text-white truncate">{meal.name}</p>
                    <span className="text-xs text-slate-300 font-bold block mt-1">{meal.time || 'Logged'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {meal.calories} <span className="text-xs text-slate-400">kcal</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMeals((prev) => prev.filter((m) => m.id !== meal.id));
                        showToast(`Removed "${meal.name}"`);
                      }}
                      className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      aria-label="Remove meal"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl space-y-3.5">
            <span className="text-xs font-black text-white uppercase tracking-wider block">
              + Quick Manual Food Entry
            </span>
            <form onSubmit={handleQuickAdd} className="grid grid-cols-12 gap-2.5">
              <input
                type="text"
                value={quickMealName}
                onChange={(e) => setQuickMealName(e.target.value)}
                placeholder="What did you eat?"
                className="col-span-7 min-h-[52px] px-4 text-sm rounded-2xl border-2 border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-amber-400 font-bold"
              />
              <input
                type="number"
                min="1"
                max="5000"
                value={quickMealCals}
                onChange={(e) => setQuickMealCals(e.target.value)}
                placeholder="Calories"
                className="col-span-3 min-h-[52px] px-2 text-sm rounded-2xl border-2 border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-amber-400 font-black text-center font-mono"
              />
              <button
                type="submit"
                className="col-span-2 min-h-[52px] min-w-[52px] rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-base font-black active-press flex items-center justify-center shadow-md"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
