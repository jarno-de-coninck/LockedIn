import React, { useState } from 'react';
import { Search, Plus, X, Dumbbell, Activity, Check } from 'lucide-react';

const EXERCISE_DATABASE = [
  // Chest
  { id: 'bp', name: 'Barbell Bench Press', category: 'Chest', icon: '🏋️‍♂️', defaultWeight: '70 kg', defaultReps: '8' },
  { id: 'idb', name: 'Incline Dumbbell Press', category: 'Chest', icon: '🏋️‍♂️', defaultWeight: '26 kg', defaultReps: '10' },
  { id: 'dips', name: 'Chest Dips', category: 'Chest', icon: '💪', defaultWeight: 'Bodyweight', defaultReps: '12' },
  { id: 'flyes', name: 'Cable Chest Flyes', category: 'Chest', icon: '⚡', defaultWeight: '15 kg', defaultReps: '12' },
  { id: 'pushups', name: 'Push-Ups', category: 'Chest', icon: '💪', defaultWeight: 'Bodyweight', defaultReps: '20' },

  // Back
  { id: 'dl', name: 'Barbell Deadlift', category: 'Back', icon: '🏋️‍♂️', defaultWeight: '110 kg', defaultReps: '5' },
  { id: 'pullup', name: 'Pull-Ups / Chin-Ups', category: 'Back', icon: '💪', defaultWeight: 'Bodyweight', defaultReps: '8' },
  { id: 'latpd', name: 'Lat Pulldown', category: 'Back', icon: '⚡', defaultWeight: '60 kg', defaultReps: '10' },
  { id: 'bor', name: 'Barbell Bent-Over Row', category: 'Back', icon: '🏋️‍♂️', defaultWeight: '65 kg', defaultReps: '8' },
  { id: 'cable_row', name: 'Seated Cable Row', category: 'Back', icon: '⚡', defaultWeight: '55 kg', defaultReps: '12' },

  // Legs & Glutes
  { id: 'squat', name: 'Barbell Back Squat', category: 'Legs', icon: '🏋️‍♂️', defaultWeight: '90 kg', defaultReps: '6' },
  { id: 'front_squat', name: 'Front Squat', category: 'Legs', icon: '🏋️‍♂️', defaultWeight: '70 kg', defaultReps: '8' },
  { id: 'leg_press', name: 'Leg Press', category: 'Legs', icon: '⚡', defaultWeight: '180 kg', defaultReps: '10' },
  { id: 'rdl', name: 'Romanian Deadlift (RDL)', category: 'Legs', icon: '🏋️‍♂️', defaultWeight: '75 kg', defaultReps: '10' },
  { id: 'bss', name: 'Bulgarian Split Squat', category: 'Legs', icon: '🦵', defaultWeight: '18 kg', defaultReps: '10' },
  { id: 'leg_ext', name: 'Leg Extensions', category: 'Legs', icon: '⚡', defaultWeight: '50 kg', defaultReps: '12' },
  { id: 'calves', name: 'Standing Calf Raises', category: 'Legs', icon: '🦵', defaultWeight: '60 kg', defaultReps: '15' },

  // Shoulders & Arms
  { id: 'ohp', name: 'Overhead Barbell Press', category: 'Shoulders', icon: '🏋️‍♂️', defaultWeight: '45 kg', defaultReps: '8' },
  { id: 'db_shoulder', name: 'Dumbbell Shoulder Press', category: 'Shoulders', icon: '🏋️‍♂️', defaultWeight: '22 kg', defaultReps: '10' },
  { id: 'lat_raise', name: 'Dumbbell Lateral Raise', category: 'Shoulders', icon: '⚡', defaultWeight: '10 kg', defaultReps: '15' },
  { id: 'bicep_curl', name: 'Dumbbell Bicep Curls', category: 'Arms', icon: '💪', defaultWeight: '14 kg', defaultReps: '10' },
  { id: 'tricep_push', name: 'Triceps Cable Pushdown', category: 'Arms', icon: '⚡', defaultWeight: '30 kg', defaultReps: '12' },

  // Sport Specific
  { id: 'ten_hex', name: 'Hexagon Agility Ball Toss Drill', category: 'Tennis', icon: '🎾', defaultWeight: 'Bodyweight', defaultReps: '30s work' },
  { id: 'ten_rot', name: 'Med Ball Rotational Forehand Slams', category: 'Tennis', icon: '🎾', defaultWeight: '6 kg', defaultReps: '10 reps/side' },
  { id: 'run_800', name: '800m Lactate Threshold Intervals', category: 'Running', icon: '🏃‍♂️', defaultWeight: 'Pace: 4:00/km', defaultReps: '800m' },
  { id: 'mma_bag', name: 'Heavy Bag 5x3min Combos', category: 'MMA', icon: '🥊', defaultWeight: 'Heavy Bag', defaultReps: '3 min round' },
];

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Tennis', 'Running', 'MMA'];

export default function ExerciseLibraryModal({
  isOpen,
  onClose,
  onSelectExercise,
  activeSport = 'tennis',
}) {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExercises = EXERCISE_DATABASE.filter((ex) => {
    const matchesCat = selectedCategory === 'All' || ex.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85dvh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">Exercise Library</h3>
              <p className="text-[10px] text-slate-400">Add movements to active session</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of Exercises */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No exercises match your search.
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  onSelectExercise(ex);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200/60 transition-all flex items-center justify-between active-press"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-sm shrink-0">{ex.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{ex.name}</p>
                    <span className="text-[9px] text-slate-400 block">{ex.category} • {ex.defaultWeight}</span>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-orange-500 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
