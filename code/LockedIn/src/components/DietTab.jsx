import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Sparkles,
  Check,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import RecipeModal from './RecipeModal';
import { regenerateSingleMeal, generateCustomMealFromPrompt } from '../services/groq';
import { useLanguage } from '../services/i18n';

const MEAL_THEMES = {
  Breakfast: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  Lunch: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  Dinner: { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  Snack: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

const CRAVING_SUGGESTIONS = [
  '🥑 Salmon & Avocado Bowl with Lemon Rice',
  '🥞 Fluffy Banana Whey Protein Pancakes',
  '🍗 Chipotle Grilled Chicken & Sweet Potato',
  '🥩 Sirloin Steak, Asparagus & Garlic Mash',
  '🍳 Spinach, Feta & Egg White Scramble',
];

export default function DietTab({
  goal,
  dietPlan = [],
  setDietPlan,
  meals = [],
  setMeals,
  setActiveTab,
  onNavigateToAiStudio,
}) {
  const { t } = useLanguage();
  const [dietView, setDietView] = useState('to_eat'); // 'to_eat' | 'eaten'
  const [selectedRecipeMeal, setSelectedRecipeMeal] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [regeneratingMealId, setRegeneratingMealId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Custom Craving Recipe Generator State
  const [showCravingBuilder, setShowCravingBuilder] = useState(false);
  const [cravingInput, setCravingInput] = useState('');
  const [cravingSlot, setCravingSlot] = useState('Lunch');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  // Quick Manual Add
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
    setTimeout(() => setToastMsg(''), 2500);
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
      showToast('Swap failed.');
    } finally {
      setRegeneratingMealId(null);
    }
  };

  const handleGenerateFromCraving = async (presetText = null) => {
    const query = (presetText || cravingInput).trim();
    if (!query || isGeneratingCustom) return;

    setIsGeneratingCustom(true);
    const targetCals = Math.min(800, Math.max(250, Math.round(remainingKcal > 300 ? remainingKcal / 2 : goal / 4)));

    try {
      const res = await generateCustomMealFromPrompt({
        promptText: query,
        mealSlot: cravingSlot,
        targetCalories: targetCals,
        dietType: 'High Protein',
      });

      if (res && res.meal) {
        setDietPlan((prev) => {
          const filtered = prev.filter((p) => p.meal !== cravingSlot);
          return [...filtered, res.meal];
        });
        setExpandedCardId(res.meal.id);
        setCravingInput('');
        setShowCravingBuilder(false);
        showToast(`Architected: ${res.meal.title}!`);
      }
    } catch (err) {
      console.warn('Craving generation error:', err);
      showToast('Recipe generation failed. Please try again.');
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
        onLogMeal={handleLogPlanMeal}
        onSwapMeal={handleSwapSingleMeal}
        isSwapping={regeneratingMealId === selectedRecipeMeal?.id}
      />

      {/* 1. NUTRITION HUD & 2-TAB SWITCHER */}
      <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-black tracking-wider text-slate-400 block">
                {t('dailyIntake')}
              </span>
              <h2 className="text-base font-black text-white">
                {totalFoodConsumed} <span className="text-xs text-slate-400 font-bold">/ {goal} kcal</span>
              </h2>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-950 text-orange-400 border border-slate-800">
            {remainingKcal} {t('kcalLeft')}
          </span>
        </div>

        {/* 2-Segment Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setDietView('to_eat')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
              dietView === 'to_eat'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>{t('toEat')} ({pendingPlanMeals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDietView('eaten')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
              dietView === 'eaten'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('eaten')} ({meals.length})</span>
          </button>
        </div>
      </div>

      {/* 2. SUGGEST / CRAVING RECIPE ARCHITECT */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800/80 shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCravingBuilder(!showCravingBuilder)}
          className="w-full p-4 flex items-center justify-between text-left active-press transition-colors hover:bg-slate-800/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">{t('suggestMeals')}</h3>
              <p className="text-[11px] text-slate-400 font-bold">{t('customCraving')}</p>
            </div>
          </div>
          {showCravingBuilder ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showCravingBuilder && (
          <div className="p-4 pt-0 border-t border-slate-800 space-y-3 animate-slide-up">
            {/* Slot Selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {t('targetSlot')}
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setCravingSlot(slot)}
                    className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                      cravingSlot === slot
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="space-y-1.5">
              <div className="relative flex items-center rounded-2xl border border-slate-800 bg-slate-950 p-1">
                <input
                  type="text"
                  value={cravingInput}
                  onChange={(e) => setCravingInput(e.target.value)}
                  placeholder="e.g. Salmon, sweet potato and avocado..."
                  className="w-full px-3 py-2 text-xs bg-transparent text-white focus:outline-none placeholder:text-slate-500 font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateFromCraving()}
                  disabled={!cravingInput.trim() || isGeneratingCustom}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 text-white text-xs font-black transition-all shrink-0 active-press flex items-center gap-1 shadow-md shadow-orange-500/20"
                >
                  {isGeneratingCustom ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('architectBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 1-Tap Suggestions */}
            <div className="space-y-1 pt-1">
              <div className="space-y-1">
                {CRAVING_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleGenerateFromCraving(item)}
                    disabled={isGeneratingCustom}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-300 text-xs font-bold transition-all active-press flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{item}</span>
                    <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: WHAT YOU STILL NEED TO EAT
          ========================================================================= */}
      {dietView === 'to_eat' && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {t('dailyTarget')} ({goal} kcal)
            </span>
            {onNavigateToAiStudio && (
              <button
                type="button"
                onClick={onNavigateToAiStudio}
                className="text-xs font-black text-orange-400 hover:text-orange-300 flex items-center gap-1 active-press"
              >
                <Sparkles className="w-3 h-3" />
                <span>{dietPlan?.length > 0 ? 'Full Plan' : 'Generate'}</span>
              </button>
            )}
          </div>

          {dietPlan.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 shadow-lg space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <p className="text-xs font-black text-white">No active meal plan</p>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto font-medium">
                Suggest ingredients above or architect a complete 4-meal plan in AI Studio!
              </p>
              {onNavigateToAiStudio && (
                <button
                  type="button"
                  onClick={onNavigateToAiStudio}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all shadow-md shadow-orange-500/25"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate in AI Studio</span>
                </button>
              )}
            </div>
          ) : pendingPlanMeals.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 animate-fade-in">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <h4 className="text-xs font-black text-emerald-200">{t('allMealsLogged')}</h4>
              <p className="text-xs text-emerald-400/80 font-bold">Check the Eaten tab to review your day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPlanMeals.map((item, idx) => {
                const theme = MEAL_THEMES[item.meal] || { badge: 'bg-slate-800 text-slate-300 border-slate-700' };
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
                    className={`bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3 transition-all ${
                      isSwapping ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Header: Slot + Calories */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${theme.badge}`}>
                          {item.meal}
                        </span>
                        {item.prepTime && (
                          <span className="text-[11px] text-slate-400 font-bold">
                            ⏱ {item.prepTime}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-orange-400">
                        {item.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                      </span>
                    </div>

                    {/* Food Title */}
                    <div>
                      <h4 className="text-sm font-black text-white leading-snug">
                        {item.title}
                      </h4>

                      {/* Fixed 3-Column Macro Grid - Guaranteed 100% Horizontal & Vertical Alignment */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
                        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-orange-500/10 border border-orange-500/25 text-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Protein</span>
                          <span className="text-xs font-black text-white font-mono mt-0.5">{item.protein || Math.round((item.calories * 0.35) / 4)}g</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-sky-500/10 border border-sky-500/25 text-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Carbs</span>
                          <span className="text-xs font-black text-white font-mono mt-0.5">{item.carbs || Math.round((item.calories * 0.45) / 4)}g</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Fats</span>
                          <span className="text-xs font-black text-white font-mono mt-0.5">{item.fats || Math.round((item.calories * 0.20) / 9)}g</span>
                        </div>
                      </div>
                    </div>

                    {/* INLINE RECIPE ACCORDION */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs text-slate-300 animate-slide-up">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Ingredients
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-slate-300 text-xs pl-1">
                            {ingredients.map((ing, iIdx) => (
                              <li key={iIdx}>{ing}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Preparation Steps
                          </span>
                          <ol className="space-y-1.5 list-decimal list-inside text-slate-300 text-xs pl-1">
                            {instructions.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-black transition-all flex items-center justify-center gap-1 active-press"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isExpanded ? t('hideRecipe') : t('viewRecipe')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwapSingleMeal(item)}
                        disabled={isSwapping}
                        className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-black transition-all flex items-center gap-1 active-press"
                        title="Regenerate single meal"
                      >
                        {isSwapping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-orange-400" />}
                        <span>{t('swapMeal')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogPlanMeal(item)}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-all flex items-center gap-1 active-press shadow-md shadow-orange-500/20"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t('logMeal')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: WHAT'S ALREADY EATEN
          ========================================================================= */}
      {dietView === 'eaten' && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {t('eaten')} ({meals.length})
            </span>
            {meals.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all logged meals?')) {
                    setMeals([]);
                    showToast('Cleared log');
                  }
                }}
                className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors"
              >
                {t('clearAll')}
              </button>
            )}
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 shadow-lg space-y-1.5">
              <p className="text-xs font-bold text-slate-400">{t('noMealsYet')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-black text-white truncate">{meal.name}</p>
                    <span className="text-[11px] text-slate-400 font-bold block mt-0.5">{meal.time || 'Logged'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-orange-400">
                      {meal.calories} <span className="text-[10px] text-slate-500">kcal</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMeals((prev) => prev.filter((m) => m.id !== meal.id));
                        showToast(`Removed "${meal.name}"`);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Custom Food Add */}
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              + {t('customFoodEntry')}
            </span>
            <form onSubmit={handleQuickAdd} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={quickMealName}
                onChange={(e) => setQuickMealName(e.target.value)}
                placeholder="Food title"
                className="col-span-7 px-3 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500 font-bold"
              />
              <input
                type="number"
                min="1"
                max="5000"
                value={quickMealCals}
                onChange={(e) => setQuickMealCals(e.target.value)}
                placeholder="kcal"
                className="col-span-3 px-3 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500 font-black text-center"
              />
              <button
                type="submit"
                className="col-span-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press flex items-center justify-center shadow-md shadow-orange-500/20"
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
