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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
                {meal.meal || 'Meal'}
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {meal.prepTime || '15 mins'}
              </span>
            </div>
            <h3 className="text-xs font-black text-white leading-snug">
              {meal.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Full-Name Aesthetic Macro Grid */}
        <div className="px-4 py-3 bg-slate-950/80 grid grid-cols-4 gap-2 border-b border-slate-800 shrink-0 text-center">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight block">Calories</span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">{meal.calories}</span>
          </div>
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-tight block">Protein</span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">{meal.protein || Math.round((meal.calories * 0.35) / 4)}g</span>
          </div>
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-tight block">Carbs</span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">{meal.carbs || Math.round((meal.calories * 0.45) / 4)}g</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tight block">Fats</span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">{meal.fats || Math.round((meal.calories * 0.20) / 9)}g</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs text-slate-300">
          {/* Ingredients */}
          <div>
            <h4 className="font-black text-white uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-orange-400" />
              <span>Ingredients</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 pl-1 text-xs">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="leading-relaxed">{ing}</li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-black text-white uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-orange-400" />
              <span>Preparation Steps</span>
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-slate-300 pl-1 text-xs">
              {instructions.map((step, idx) => (
                <li key={idx} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-2 shrink-0">
          {onSwapMeal && (
            <button
              type="button"
              onClick={() => onSwapMeal(meal)}
              disabled={isSwapping}
              className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-black active-press flex items-center justify-center gap-2 transition-colors"
            >
              {isSwapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-orange-400" />}
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
              className={`py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/25 ${
                onSwapMeal ? 'col-span-1' : 'col-span-2'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('logMeal')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
