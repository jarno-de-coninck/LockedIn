import React, { useState } from 'react';
import {
  Trophy,
  Sparkles,
  Loader2,
  Calendar,
  Flame,
  CheckCircle2,
  PlusCircle,
  Play,
  Layers,
  Dumbbell,
  Clock,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Activity,
} from 'lucide-react';
import { generateSportWorkout, generateWeeklySchedule } from '../services/groq';

const SPORTS = [
  { id: 'tennis', name: 'Tennis', icon: '🎾', desc: 'Agility, serve power & court footwork' },
  { id: 'weightlifting', name: 'Weightlifting', icon: '🏋️‍♂️', desc: 'Compound strength, hypertrophy & power' },
  { id: 'running', name: 'Running', icon: '🏃‍♂️', desc: 'VO2 Max, intervals & cadence endurance' },
  { id: 'mma', name: 'MMA / Combat', icon: '🥊', desc: 'Striking, wrestling stamina & 5-round gas tank' },
  { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️', desc: 'Threshold power, cadence & hill climbs' },
];

const TRAINING_GOALS = [
  { id: 'strength', label: 'Strength & Muscle', desc: 'Max power & hypertrophy' },
  { id: 'endurance', label: 'Endurance & Stamina', desc: 'VO2 Max & aerobic engine' },
  { id: 'agility', label: 'Speed & Agility', desc: 'Footwork & rotational power' },
  { id: 'conditioning', label: 'Metabolic Conditioning', desc: 'Fat loss & high heart rate' },
  { id: 'technique', label: 'Sport Specific & Drills', desc: 'Technique & match prep' },
];

export default function TrainingArchitectTab({
  activeSport,
  setActiveSport,
  trainingGoal,
  setTrainingGoal,
  trainingSchedule,
  setTrainingSchedule,
  setWorkouts,
  setActiveTab,
}) {
  const [viewMode, setViewMode] = useState('workout'); // 'workout' | 'schedule'
  const [duration, setDuration] = useState(45);
  const [level, setLevel] = useState('Intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [completedScheduleDays, setCompletedScheduleDays] = useState(new Set());
  const [expandedDay, setExpandedDay] = useState(null);

  const selectedSportObj = SPORTS.find((s) => s.id === activeSport) || SPORTS[0];

  // 1. Generate Single Session
  const handleGenerateWorkout = async () => {
    setIsLoading(true);
    setStatusNote('');

    try {
      const result = await generateSportWorkout({
        sport: selectedSportObj.name,
        goal: trainingGoal,
        duration: Number(duration) || 45,
        level,
      });

      setGeneratedWorkout(result.workout);

      if (result.isMock) {
        setStatusNote(result.note || 'Generated with local athletic algorithms.');
      } else {
        setStatusNote('Powered by AI Athletic Director');
      }
    } catch (err) {
      console.error('Failed to generate workout:', err);
      setStatusNote('Using fallback training protocol.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Generate Weekly Schedule
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setStatusNote('');

    try {
      const result = await generateWeeklySchedule({
        sport: selectedSportObj.name,
        goal: trainingGoal,
        daysPerWeek: Number(daysPerWeek) || 4,
        level,
      });

      setTrainingSchedule(result.schedule);

      if (result.isMock) {
        setStatusNote(result.note || 'Built with localized sports periodization.');
      } else {
        setStatusNote('Periodized with AI Athletic Director');
      }
    } catch (err) {
      console.error('Failed to generate schedule:', err);
      setStatusNote('Using fallback training schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  // Log generated workout to tracker & workouts tab with full exercise sets
  const handleLogGeneratedWorkout = () => {
    if (!generatedWorkout) return;

    const newWorkout = {
      id: Date.now(),
      sport: selectedSportObj.name,
      icon: selectedSportObj.icon,
      title: generatedWorkout.title,
      duration: generatedWorkout.duration,
      caloriesBurned: generatedWorkout.estCalories,
      intensity: level === 'Advanced' ? 'High' : 'Moderate',
      exercises: generatedWorkout.exercises || [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setWorkouts((prev) => [newWorkout, ...prev]);

    setTimeout(() => {
      setActiveTab('workouts');
    }, 250);
  };

  const toggleScheduleDayDone = (dayName) => {
    setCompletedScheduleDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayName)) {
        next.delete(dayName);
      } else {
        next.add(dayName);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. Mode Switcher (Single Session vs 7-Day Schedule) */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setViewMode('workout')}
          className={`tap-target py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
            viewMode === 'workout'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Single Session AI</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('schedule')}
          className={`tap-target py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
            viewMode === 'schedule'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>7-Day Periodized Plan</span>
        </button>
      </div>

      {/* 2. Sport & Goal Selection HUD */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Sport & Athletic Goal
              </h2>
              <p className="text-[11px] text-slate-500">Tailor workouts to your exact discipline</p>
            </div>
          </div>
        </div>

        {/* Sport Picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Primary Sport
          </label>
          <div className="grid grid-cols-5 gap-1">
            {SPORTS.map((s) => {
              const isSelected = activeSport === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSport(s.id)}
                  className={`tap-target p-2 rounded-xl text-center border transition-all active-press ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-lg block leading-none">{s.icon}</span>
                  <span className="text-[9px] font-bold block mt-1 truncate">{s.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Training Goal Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Target Focus
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {TRAINING_GOALS.map((g) => {
              const isSelected = trainingGoal === g.label;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setTrainingGoal(g.label)}
                  className={`tap-target text-left p-2 rounded-xl border transition-all active-press ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{g.label}</p>
                  <p className={`text-[9px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {g.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameters row: Duration or Days/Week + Level */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          {viewMode === 'workout' ? (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Duration
              </label>
              <div className="flex gap-1">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      duration === mins
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Days / Week
              </label>
              <div className="flex gap-1">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      daysPerWeek === d
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Level
            </label>
            <div className="flex gap-1">
              {['Beg', 'Int', 'Adv'].map((lvl, idx) => {
                const fullLvl = ['Beginner', 'Intermediate', 'Advanced'][idx];
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(fullLvl)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      level === fullLvl
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Trigger Button */}
        <button
          type="button"
          onClick={viewMode === 'workout' ? handleGenerateWorkout : handleGenerateSchedule}
          disabled={isLoading}
          className="w-full tap-target py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 active-press transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {viewMode === 'workout' ? 'Architecting Sport Session...' : 'Building 7-Day Periodized Plan...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {viewMode === 'workout'
                  ? `Generate ${selectedSportObj.name} Session (${duration}m)`
                  : `Build ${daysPerWeek}-Day ${selectedSportObj.name} Schedule`}
              </span>
            </>
          )}
        </button>

        {statusNote && (
          <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3 text-orange-500" />
            <span>{statusNote}</span>
          </p>
        )}
      </div>

      {/* 3. Single Workout Display */}
      {viewMode === 'workout' && generatedWorkout && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 animate-slide-up">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{selectedSportObj.icon}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase">
                  {generatedWorkout.sport} • {generatedWorkout.duration} mins
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                {generatedWorkout.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                🎯 {generatedWorkout.focus}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-orange-600">
                ~{generatedWorkout.estCalories}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1">
                kcal burn
              </span>
            </div>
          </div>

          {/* Granular Exercises Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" /> Planned Exercises & Sets
            </span>
            <div className="space-y-2">
              {(generatedWorkout.exercises || []).map((ex, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-orange-50/50 border border-orange-100/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-900">{ex.name}</p>
                      {ex.notes && <p className="text-[10px] text-slate-500">{ex.notes}</p>}
                    </div>
                    <span className="text-[10px] font-bold text-orange-700 bg-white px-2 py-0.5 rounded-md border border-orange-200">
                      {ex.sets ? ex.sets.length : 3} sets
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(ex.sets || []).map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-semibold border border-orange-100"
                      >
                        Set {s.setNumber}: {s.weight ? `${s.weight} × ` : ''}{s.reps || '10'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Log Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogGeneratedWorkout}
              className="w-full tap-target py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              <span>Log Session to Today's Workouts (-{generatedWorkout.estCalories} kcal)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Weekly 7-Day Periodized Schedule Display */}
      {viewMode === 'schedule' && trainingSchedule && (
        <div className="space-y-2.5 animate-slide-up">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Weekly Periodization ({trainingSchedule.daysPerWeek || 4} Days Active)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-orange-600">
              {completedScheduleDays.size} / 7 Completed
            </span>
          </div>

          <div className="space-y-2">
            {(trainingSchedule.schedule || []).map((item, idx) => {
              const isDone = completedScheduleDays.has(item.day);
              const isRest = item.type === 'Rest';
              const isExpanded = expandedDay === item.day;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all p-3.5 shadow-2xs ${
                    isRest
                      ? 'bg-slate-50/80 border-slate-200 text-slate-600'
                      : isDone
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleScheduleDayDone(item.day)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors active-press shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-slate-300 hover:border-orange-400'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900">
                            {item.day}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              isRest
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>
                        <p className={`text-xs font-semibold mt-0.5 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {item.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.duration && item.duration !== '0m' && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {item.duration}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedDay(isExpanded ? null : item.day)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Day Details */}
                  {isExpanded && (
                    <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-xs text-slate-600 space-y-2 animate-fade-in">
                      <p>
                        <strong className="text-slate-800">Target Focus:</strong> {item.focus}
                      </p>

                      {/* Exercises list if present */}
                      {Array.isArray(item.exercises) && item.exercises.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Key Exercises & Protocols:
                          </span>
                          {item.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{ex.name}</span>
                              <span className="text-[10px] font-bold text-orange-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {ex.sets} × {ex.reps}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isRest && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Execute this protocol in live tracker:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('workouts');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-500 text-white font-bold text-xs active-press flex items-center gap-1 shadow-xs"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Start in Workout Tab</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
