import React from 'react';
import { X, RefreshCw, Loader2, Check, Clock, Utensils, ChefHat } from 'lucide-react';
import { useLanguage } from '../services/i18n';

export default function RecipeModal({
  isOpen,
  onClose,
  meal,
  onLogMeal,
  onSwapMeal,
  isSwapping = false,
}) {
  const { t } = useLanguage();
  if (!isOpen || !meal) return null;

  const ingredients = Array.isArray(meal.ingredients) && meal.ingredients.length > 0
    ? meal.ingredients
    : [
        'Lean Protein (Chicken, Eggs, Fish, or Tofu)',
        'Complex Carbs (Rice, Sweet Potato, or Oats)',
        'Fresh Vegetables or Salad Greens',
        'Healthy Fats (Olive Oil or Avocado)',
      ];

  const instructions = Array.isArray(meal.instructions) && meal.instructions.length > 0
    ? meal.instructions
    : [
        'Measure and prepare all fresh ingredients.',
        'Cook protein over medium heat until thoroughly cooked.',
        'Combine ingredients and season lightly with herbs and spices.',
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-slate-900 border-2 border-slate-700 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b-2 border-slate-800 shrink-0 bg-slate-950">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-950 text-orange-300 border border-orange-500/50 uppercase tracking-wider">
                {meal.meal || 'Meal'}
              </span>
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> {meal.prepTime || '15 mins'}
              </span>
            </div>
            <h3 id="recipe-title" className="text-base font-black text-white leading-snug">
              {meal.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recipe"
            className="min-w-[48px] min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shrink-0 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-5 py-3.5 bg-slate-950 grid grid-cols-4 gap-2.5 border-b-2 border-slate-800 shrink-0 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-800">
            <span className="text-xs font-black text-slate-300 uppercase block">Calories</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{meal.calories}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-800">
            <span className="text-xs font-black text-orange-400 uppercase block">Protein</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{meal.protein || Math.round((meal.calories * 0.35) / 4)}g</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-800">
            <span className="text-xs font-black text-sky-400 uppercase block">Carbs</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{meal.carbs || Math.round((meal.calories * 0.45) / 4)}g</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-800">
            <span className="text-xs font-black text-emerald-400 uppercase block">Fats</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{meal.fats || Math.round((meal.calories * 0.20) / 9)}g</span>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto text-sm text-slate-200">
          <div>
            <h4 className="font-black text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-400" />
              <span>Ingredients Needed</span>
            </h4>
            <ul className="space-y-2.5 pl-1">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-200 leading-relaxed font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>Preparation Instructions</span>
            </h4>
            <ol className="space-y-3 pl-1">
              {instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-200 leading-relaxed font-medium">
                  <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t-2 border-slate-800 grid grid-cols-2 gap-3 shrink-0">
          {onSwapMeal && (
            <button
              type="button"
              onClick={() => onSwapMeal(meal)}
              disabled={isSwapping}
              className="min-h-[52px] rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-slate-200 hover:text-white text-sm font-black active-press flex items-center justify-center gap-2 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              {isSwapping ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 text-orange-400" />}
              <span>{t('swapMeal')}</span>
            </button>
          )}

          {onLogMeal && (
            <button
              type="button"
              onClick={() => {
                onLogMeal(meal);
                onClose();
              }}
              className={`min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-black active-press flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-600/30 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none ${
                onSwapMeal ? 'col-span-1' : 'col-span-2'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{t('logMeal')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
