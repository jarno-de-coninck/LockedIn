import React from 'react';
import { X, RefreshCw, Loader2, Check, Clock, Utensils, ChefHat } from 'lucide-react';

export default function RecipeModal({
  isOpen,
  onClose,
  meal,
  onLogMeal,
  onSwapMeal,
  isSwapping = false,
}) {
  if (!isOpen || !meal) return null;

  const ingredients = Array.isArray(meal.ingredients) && meal.ingredients.length > 0
    ? meal.ingredients
    : [
        'Lean Protein (Chicken / Eggs / Fish / Tofu)',
        'Complex Carbs (Rice / Sweet Potato / Oats)',
        'Fresh Vegetables or Salad Greens',
        'Healthy Fats (Olive Oil / Avocado)',
      ];

  const instructions = Array.isArray(meal.instructions) && meal.instructions.length > 0
    ? meal.instructions
    : [
        'Measure and prep all fresh ingredients.',
        'Cook protein over medium heat until tender.',
        'Assemble ingredients and season to taste.',
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3.5 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col max-h-[78vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 flex items-start justify-between border-b border-slate-100 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 uppercase tracking-wider">
                {meal.meal || 'Meal'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {meal.prepTime || '15 mins'}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 leading-snug">
              {meal.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Macro Row */}
        <div className="px-4 py-2 bg-slate-50 text-[11px] font-semibold text-slate-600 flex items-center justify-between border-b border-slate-100 shrink-0">
          <span className="text-orange-600 font-bold">{meal.calories} kcal</span>
          <span>P: {meal.protein || Math.round(meal.calories * 0.08)}g</span>
          <span>C: {meal.carbs || Math.round(meal.calories * 0.09)}g</span>
          <span>F: {meal.fats || Math.round(meal.calories * 0.03)}g</span>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3.5 flex-1 overflow-y-auto text-xs text-slate-700">
          {/* Ingredients */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
              <Utensils className="w-3 h-3 text-orange-500" />
              <span>Ingredients</span>
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-600 pl-1 text-[11px]">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="leading-relaxed">{ing}</li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
              <ChefHat className="w-3 h-3 text-orange-500" />
              <span>Preparation Steps</span>
            </h4>
            <ol className="space-y-1.5 list-decimal list-inside text-slate-600 pl-1 text-[11px]">
              {instructions.map((step, idx) => (
                <li key={idx} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0">
          {onSwapMeal && (
            <button
              type="button"
              onClick={() => onSwapMeal(meal)}
              disabled={isSwapping}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold active-press flex items-center justify-center gap-1.5 transition-colors"
            >
              {isSwapping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-orange-500" />}
              <span>Swap</span>
            </button>
          )}

          {onLogMeal && (
            <button
              type="button"
              onClick={() => {
                onLogMeal(meal);
                onClose();
              }}
              className={`py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press flex items-center justify-center gap-1.5 transition-colors ${
                onSwapMeal ? 'col-span-1' : 'col-span-2'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Log Meal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
