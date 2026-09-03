import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Play,
  Plus,
  Trash2,
  Clock,
  Flame,
  Zap,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
  Timer,
  Check,
  ArrowRight,
  Minus,
  CheckCheck,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Edit3,
} from 'lucide-react';
import ExerciseLibraryModal from './ExerciseLibraryModal';
import CustomProgramModal from './CustomProgramModal';
import { useLanguage } from '../services/i18n';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATION_PRESETS = [30, 45, 60, 75, 90];

export default function WorkoutTab({
  workouts,
  setWorkouts,
  trainingSchedule,
  setTrainingSchedule,
  activeSport = 'tennis',
  trainingGoal = 'Strength & Muscle',
  onNavigateToAiStudio,
}) {
  const { t } = useLanguage();
  const todayName = DAYS_OF_WEEK[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [toastMsg, setToastMsg] = useState('');

  // Active Workout Session State
  const [activeSession, setActiveSession] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [customDurationMins, setCustomDurationMins] = useState(null);

  // Floating Rest Timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // Manual Workout Logger State (for past/completed workouts)
  const [showManualLogger, setShowManualLogger] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState('45');
  const [manualCalories, setManualCalories] = useState('');

  // Modals
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);

  // Active Stopwatch
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Active Rest Timer
  useEffect(() => {
    let restInterval = null;
    if (isResting && restSeconds > 0) {
      restInterval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            showToast('⏰ Rest Complete! Next set!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restInterval);
    }
    return () => clearInterval(restInterval);
  }, [isResting, restSeconds]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const formatStopwatch = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const parseNum = (val, fallback = 0) => {
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? fallback : num;
  };

  // 1. Launch Programmed Day Workout
  const handleStartScheduledWorkout = (dayPlan) => {
    const formattedExercises = (dayPlan.exercises || []).map((ex, idx) => {
      const parsedSetsCount = parseInt(ex.sets, 10) || 3;
      const defaultReps = ex.reps?.replace(/[^0-9]/g, '') || '10';
      const initialSets = [];
      for (let i = 1; i <= parsedSetsCount; i++) {
        initialSets.push({
          setNumber: i,
          weight: idx === 0 ? '60' : '20',
          reps: defaultReps,
          completed: false,
        });
      }
      return {
        id: `ex_${idx}_${Date.now()}`,
        name: ex.name,
        notes: ex.notes || '',
        sets: initialSets,
      };
    });

    setActiveSession({
      title: dayPlan.title || `${dayPlan.day} Workout`,
      day: dayPlan.day,
      type: dayPlan.type || 'Strength',
      exercises: formattedExercises,
    });
    setIsTimerRunning(true);
    setSessionSeconds(0);
    setCustomDurationMins(null);
    showToast(`Started ${dayPlan.day} workout!`);
  };

  // 2. Start Custom / Empty Workout
  const handleStartCustomWorkout = () => {
    setActiveSession({
      title: `Custom ${activeSport.toUpperCase()} Session`,
      day: todayName,
      type: 'Strength',
      exercises: [
        {
          id: `ex_0_${Date.now()}`,
          name: 'Primary Compound Exercise',
          notes: 'Log weight and reps',
          sets: [
            { setNumber: 1, weight: '60', reps: '10', completed: false },
            { setNumber: 2, weight: '60', reps: '10', completed: false },
            { setNumber: 3, weight: '60', reps: '10', completed: false },
          ],
        },
      ],
    });
    setIsTimerRunning(true);
    setSessionSeconds(0);
    setCustomDurationMins(null);
    showToast('Started workout session');
  };

  // 3. Set Management
  const handleToggleSet = (exId, setNumber) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const nextSets = ex.sets.map((s) => {
          if (s.setNumber === setNumber) {
            const nextVal = !s.completed;
            if (nextVal) {
              setRestSeconds(90);
              setIsResting(true);
            }
            return { ...s, completed: nextVal };
          }
          return s;
        });
        return { ...ex, sets: nextSets };
      });
      return { ...prev, exercises: updated };
    });
  };

  const handleCompleteAllSets = (exId) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const nextSets = ex.sets.map((s) => ({ ...s, completed: true }));
        return { ...ex, sets: nextSets };
      });
      return { ...prev, exercises: updated };
    });
    showToast('All sets checked!');
  };

  const handleAdjustWeight = (exId, setNumber, delta) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const currentSet = ex.sets.find((s) => s.setNumber === setNumber);
        const currentWeight = parseNum(currentSet?.weight, 20);
        const newWeight = Math.max(0, currentWeight + delta);

        const nextSets = ex.sets.map((s) => {
          if (s.setNumber === setNumber) {
            return { ...s, weight: String(newWeight) };
          }
          if (s.setNumber > setNumber && !s.completed && parseNum(s.weight) === currentWeight) {
            return { ...s, weight: String(newWeight) };
          }
          return s;
        });
        return { ...ex, sets: nextSets };
      });
      return { ...prev, exercises: updated };
    });
  };

  const handleAdjustReps = (exId, setNumber, delta) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const currentSet = ex.sets.find((s) => s.setNumber === setNumber);
        const currentReps = parseNum(currentSet?.reps, 10);
        const newReps = Math.max(1, currentReps + delta);

        const nextSets = ex.sets.map((s) => {
          if (s.setNumber === setNumber) {
            return { ...s, reps: String(newReps) };
          }
          if (s.setNumber > setNumber && !s.completed && parseNum(s.reps) === currentReps) {
            return { ...s, reps: String(newReps) };
          }
          return s;
        });
        return { ...ex, sets: nextSets };
      });
      return { ...prev, exercises: updated };
    });
  };

  const handleDirectInput = (exId, setNumber, field, value) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const nextSets = ex.sets.map((s) => {
          if (s.setNumber === setNumber) {
            return { ...s, [field]: value };
          }
          return s;
        });
        return { ...ex, sets: nextSets };
      });
      return { ...prev, exercises: updated };
    });
  };

  const handleAddSet = (exId) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet = {
          setNumber: ex.sets.length + 1,
          weight: last ? last.weight : '20',
          reps: last ? last.reps : '10',
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, exercises: updated };
    });
  };

  const handleRemoveSet = (exId, setNumber) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const updated = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const filtered = ex.sets.filter((s) => s.setNumber !== setNumber);
        return { ...ex, sets: filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 })) };
      });
      return { ...prev, exercises: updated };
    });
    showToast(`Removed set #${setNumber}`);
  };

  const handleSelectExerciseFromModal = (exItem) => {
    if (!activeSession) return;
    const newEx = {
      id: `ex_${Date.now()}`,
      name: exItem.name,
      category: exItem.category || 'General',
      notes: '',
      sets: [
        { setNumber: 1, weight: parseNum(exItem.defaultWeight, 30).toString(), reps: parseNum(exItem.defaultReps, 10).toString(), completed: false },
        { setNumber: 2, weight: parseNum(exItem.defaultWeight, 30).toString(), reps: parseNum(exItem.defaultReps, 10).toString(), completed: false },
        { setNumber: 3, weight: parseNum(exItem.defaultWeight, 30).toString(), reps: parseNum(exItem.defaultReps, 10).toString(), completed: false },
      ],
    };
    setActiveSession((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newEx],
    }));
    showToast(`Added ${exItem.name}`);
  };

  const handleRemoveExercise = (exId) => {
    setActiveSession((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== exId),
    }));
  };

  // 4. Finish Workout with Manual / Auto Duration
  const effectiveDurationMins = customDurationMins !== null
    ? customDurationMins
    : Math.max(1, Math.round(sessionSeconds / 60));

  const handleFinishWorkout = () => {
    if (!activeSession) return;

    const durationMins = effectiveDurationMins;
    const totalSets = activeSession.exercises.reduce(
      (acc, ex) => acc + (ex.sets ? ex.sets.length : 0),
      0
    );
    const estBurn = Math.round(durationMins * 8.5) + (totalSets * 8);

    const newWorkout = {
      id: Date.now(),
      sport: activeSport,
      title: activeSession.title || 'Completed Workout',
      duration: durationMins,
      caloriesBurned: estBurn,
      intensity: 'High',
      exercises: activeSession.exercises,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setWorkouts((prev) => [newWorkout, ...prev]);
    setActiveSession(null);
    setIsTimerRunning(false);
    setSessionSeconds(0);
    setCustomDurationMins(null);
    showToast(`Workout Saved! ${durationMins}m (-${estBurn} kcal)`);
  };

  const handleDiscardWorkout = () => {
    if (window.confirm('Discard this workout? Data for this session will not be saved.')) {
      setActiveSession(null);
      setIsTimerRunning(false);
      setSessionSeconds(0);
      setCustomDurationMins(null);
      showToast('Workout discarded');
    }
  };

  // 5. Handle Direct Manual Past Workout Submission
  const handleSaveManualWorkout = (e) => {
    e.preventDefault();
    const title = manualTitle.trim() || `${activeSport.toUpperCase()} Session`;
    const mins = parseInt(manualDuration, 10) || 45;
    const cals = parseInt(manualCalories, 10) || Math.round(mins * 9);

    const newWorkout = {
      id: Date.now(),
      sport: activeSport,
      title,
      duration: mins,
      caloriesBurned: cals,
      intensity: 'Moderate',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setWorkouts((prev) => [newWorkout, ...prev]);
    setManualTitle('');
    setManualDuration('45');
    setManualCalories('');
    setShowManualLogger(false);
    showToast(`Logged ${title} (${mins}m • -${cals} kcal)`);
  };

  const currentDaySchedule = trainingSchedule?.schedule?.find((s) => s.day === selectedDay);
  const totalActiveSets = activeSession?.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) || 0;
  const completedActiveSets = activeSession?.exercises?.reduce(
    (a, e) => a + (e.sets?.filter((s) => s.completed).length || 0),
    0
  ) || 0;

  return (
    <div className="space-y-4 pb-28 animate-fade-in w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 animate-slide-up border border-orange-500/40 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-orange-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Exercise Library Modal */}
      <ExerciseLibraryModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSelectExercise={handleSelectExerciseFromModal}
        activeSport={activeSport}
      />

      {/* Custom Program Builder Modal */}
      <CustomProgramModal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        trainingSchedule={trainingSchedule}
        setTrainingSchedule={setTrainingSchedule}
        activeSport={activeSport}
      />

      {/* =========================================================================
          MODE 1: LIVE WORKOUT SESSION
          ========================================================================= */}
      {activeSession ? (
        <div className="space-y-3.5 animate-slide-up">
          {/* Sticky Session HUD Bar */}
          <div className="sticky top-0 z-20 -mx-3.5 -mt-3 sm:-mx-4 sm:-mt-4 px-4 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                  {completedActiveSets}/{totalActiveSets} {t('setsDone')}
                </span>
              </div>
              <h3 className="text-xs font-black truncate text-white">
                {activeSession.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                onClick={() => setCustomDurationMins((d) => (d || effectiveDurationMins) + 5)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-center font-mono text-xs font-black text-orange-400 cursor-pointer active-press transition-colors border border-slate-800"
                title="Tap to add +5m"
              >
                ⏱ {formatStopwatch(sessionSeconds)}
              </div>

              <button
                type="button"
                onClick={handleDiscardWorkout}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors border border-slate-800"
                title="Discard workout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Rest Countdown Bar */}
          {isResting && (
            <div className="p-3.5 rounded-3xl bg-slate-900 border border-orange-500/40 text-white flex items-center justify-between shadow-2xl animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Timer className="w-5 h-5 text-orange-400 animate-spin" />
                <div>
                  <p className="text-xs font-black text-white">{t('restCountdown')}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Breathe & recover</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black font-mono text-orange-400">
                  {restSeconds}s
                </span>
                <button
                  type="button"
                  onClick={() => setRestSeconds((s) => s + 30)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-slate-200"
                >
                  +30s
                </button>
                <button
                  type="button"
                  onClick={() => setIsResting(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-slate-400"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* List of Exercise Cards with 1-Tap Steppers */}
          <div className="space-y-3">
            {activeSession.exercises.map((ex, exIdx) => {
              const allDone = ex.sets.every((s) => s.completed);

              return (
                <div
                  key={ex.id}
                  className={`bg-slate-900/90 rounded-3xl p-4 shadow-lg border transition-all space-y-3 ${
                    allDone ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800/80'
                  }`}
                >
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-950 text-orange-400 text-xs font-black flex items-center justify-center shrink-0 border border-slate-800 shadow-xs">
                        {exIdx + 1}
                      </span>
                      <h4 className="text-sm font-black text-white truncate">
                        {ex.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCompleteAllSets(ex.id)}
                        className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-950/50 text-slate-300 hover:text-emerald-300 border border-slate-800 flex items-center gap-1.5 active-press"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>{t('allDone')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="w-8 h-8 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sets List with 1-Tap Steppers (Guaranteed Zero Overflow & Full Inside UI) */}
                  <div className="space-y-2.5">
                    {ex.sets.map((s) => (
                      <div
                        key={s.setNumber}
                        className={`p-3 rounded-2xl transition-all border space-y-2.5 ${
                          s.completed
                            ? 'bg-emerald-950/25 border-emerald-500/40 shadow-xs'
                            : 'bg-slate-950/80 border-slate-800/80'
                        }`}
                      >
                        {/* Row 1: Set Badge + Done Toggle & Delete (Inside Card Header) */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                              s.completed
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              SET {s.setNumber}
                            </span>
                            {s.completed && (
                              <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Done</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSet(ex.id, s.setNumber)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active-press ${
                                s.completed
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                                  : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{s.completed ? 'Completed' : 'Mark Done'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveSet(ex.id, s.setNumber)}
                              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors"
                              title="Delete set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Weight & Reps Steppers (Grid 2-cols: 100% Inside UI, Wide Steppers) */}
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          {/* Weight Stepper */}
                          <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleAdjustWeight(ex.id, s.setNumber, -2.5)}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center active-press shrink-0"
                            >
                              -
                            </button>

                            <div className="flex flex-col items-center justify-center px-1 min-w-0 flex-1">
                              <input
                                type="text"
                                value={s.weight}
                                onChange={(e) => handleDirectInput(ex.id, s.setNumber, 'weight', e.target.value)}
                                className="w-full text-center text-sm font-black text-white bg-transparent focus:outline-none font-mono"
                              />
                              <span className="text-[9px] font-black uppercase text-slate-400 -mt-0.5">kg</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAdjustWeight(ex.id, s.setNumber, 2.5)}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center active-press shrink-0"
                            >
                              +
                            </button>
                          </div>

                          {/* Reps Stepper */}
                          <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleAdjustReps(ex.id, s.setNumber, -1)}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center active-press shrink-0"
                            >
                              -
                            </button>

                            <div className="flex flex-col items-center justify-center px-1 min-w-0 flex-1">
                              <input
                                type="text"
                                value={s.reps}
                                onChange={(e) => handleDirectInput(ex.id, s.setNumber, 'reps', e.target.value)}
                                className="w-full text-center text-sm font-black text-white bg-transparent focus:outline-none font-mono"
                              />
                              <span className="text-[9px] font-black uppercase text-slate-400 -mt-0.5">reps</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAdjustReps(ex.id, s.setNumber, 1)}
                              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center active-press shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Set Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-black transition-all flex items-center justify-center gap-1 active-press"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addSet')}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Exercise Button */}
          <button
            type="button"
            onClick={() => setIsExerciseModalOpen(true)}
            className="w-full py-3.5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-black flex items-center justify-center gap-2 active-press transition-all shadow-lg"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>{t('addExercise')}</span>
          </button>

          {/* Manual Duration Adjustment Card */}
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                ⏱ {t('workoutDuration')}
              </span>
              <span className="text-xs font-black text-orange-400">
                {effectiveDurationMins} minutes
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomDurationMins(m)}
                  className={`py-2 text-xs font-black rounded-xl transition-all active-press ${
                    effectiveDurationMins === m
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold">{t('fineTune')}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(Math.max(5, effectiveDurationMins - 5))}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-slate-300 active-press"
                >
                  -5m
                </button>
                <span className="font-mono text-xs font-black text-white px-1">
                  {effectiveDurationMins} min
                </span>
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(effectiveDurationMins + 5)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-slate-300 active-press"
                >
                  +5m
                </button>
              </div>
            </div>
          </div>

          {/* Big Finish Workout Action */}
          <button
            type="button"
            onClick={handleFinishWorkout}
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white text-xs font-black shadow-xl shadow-orange-500/25 active-press flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>
              {t('finishWorkout')} ({effectiveDurationMins}m • {completedActiveSets}/{totalActiveSets} {t('setsDone')})
            </span>
          </button>
        </div>
      ) : (
        /* =========================================================================
           MODE 2: WORKOUT ROADMAP & HOME VIEW
           ========================================================================= */
        <div className="space-y-4">
          {/* 1. HERO ACTIVE PROGRAM CARD */}
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white">
                    {trainingSchedule?.programTitle || t('weeklyPlan')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-[10px] font-black text-orange-300">
                    {trainingSchedule?.daysPerWeek || 4}d/wk
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProgramModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-black active-press"
              >
                ✏️ {t('editPlan')}
              </button>
            </div>

            {/* Horizontal 7-Day Timeline Selector */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDay === day;
                const isToday = day === todayName;
                const sched = trainingSchedule?.schedule?.find((s) => s.day === day);
                const isRest = sched?.type === 'Rest';

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`py-2.5 px-1 rounded-2xl text-center transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md'
                        : isToday
                        ? 'bg-slate-950 border border-orange-500/40 text-orange-400'
                        : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800/60'
                    }`}
                  >
                    <span className="text-[11px] font-bold block uppercase opacity-85">
                      {day.slice(0, 3)}
                    </span>
                    <span className="text-sm font-black block mt-0.5">
                      {isRest ? '🛌' : '⚡'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELECTED DAY DRILL CARD (RULE OF ONE PRIMARY ACTION) */}
          {currentDaySchedule && (
            <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider block">
                    {selectedDay} • {currentDaySchedule.type || 'Workout'}
                  </span>
                  <h4 className="text-base font-black text-white mt-1 leading-snug">
                    {currentDaySchedule.title}
                  </h4>
                </div>
                {currentDaySchedule.duration && (
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-orange-400" /> {currentDaySchedule.duration}
                  </span>
                )}
              </div>

              {currentDaySchedule.focus && (
                <p className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 font-medium leading-relaxed">
                  {currentDaySchedule.focus}
                </p>
              )}

              {currentDaySchedule.exercises && currentDaySchedule.exercises.length > 0 && (
                <div className="space-y-2">
                  {currentDaySchedule.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-black text-white truncate">{ex.name}</p>
                        {ex.notes && <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{ex.notes}</p>}
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono shrink-0">
                        {ex.sets} • {ex.reps}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {currentDaySchedule.type !== 'Rest' ? (
                <button
                  type="button"
                  onClick={() => handleStartScheduledWorkout(currentDaySchedule)}
                  className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black active-press transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('startWorkout')} ({selectedDay})</span>
                </button>
              ) : (
                <div className="text-center py-4 text-xs font-bold text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                  {t('restDay')}
                </div>
              )}
            </div>
          )}

          {/* 3. QUICK START CUSTOM OR LOG PAST */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleStartCustomWorkout}
              className="py-3 px-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-black flex items-center justify-center gap-2 active-press transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>{t('customSession')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualLogger(!showManualLogger)}
              className="py-3 px-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-black flex items-center justify-center gap-2 active-press transition-all shadow-md"
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{t('logPastWorkout')}</span>
            </button>
          </div>

          {/* 4. MANUAL PAST WORKOUT ACCORDION FORM */}
          {showManualLogger && (
            <div className="bg-slate-900/95 rounded-3xl p-4 border border-slate-800 shadow-xl space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  {t('logPastWorkout')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualLogger(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualWorkout} className="space-y-3">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={`e.g. 1h ${activeSport.toUpperCase()} Match`}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500 font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500 font-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Calories Burned</label>
                    <input
                      type="number"
                      min="10"
                      max="3000"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      placeholder={`~${Math.round((parseInt(manualDuration, 10) || 45) * 8.5)} kcal`}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 focus:outline-none focus:border-orange-500 font-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {[20, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setManualDuration(String(mins));
                        setManualCalories(String(Math.round(mins * 9)));
                      }}
                      className="py-1 text-xs font-black rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Manual Workout</span>
                </button>
              </form>
            </div>
          )}

          {/* 5. WORKOUT HISTORY */}
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              {t('completedSessions')} ({workouts.length})
            </span>

            {workouts.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
                <p className="text-xs font-bold text-slate-400">{t('noWorkouts')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workouts.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h5 className="text-xs font-black text-white truncate">{w.title}</h5>
                        <span className="text-[11px] text-slate-400 font-bold">
                          {w.time} • {w.duration}m • -{w.caloriesBurned} kcal
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkouts((prev) => prev.filter((item) => item.id !== w.id));
                          showToast('Workout deleted');
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {w.exercises && w.exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {w.exercises.map((ex, eIdx) => (
                          <span
                            key={eIdx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800"
                          >
                            {ex.name} ({ex.sets?.length || 0}s)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
