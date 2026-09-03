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
    showToast(`Workout Saved! ${durationMins}m logged (-${estBurn} kcal)`);
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
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-slide-up border border-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
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
          <div className="sticky top-0 z-20 -mx-3.5 -mt-3 sm:-mx-4 sm:-mt-4 px-4 py-3 bg-slate-900 text-white shadow-md flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                  {completedActiveSets}/{totalActiveSets} Sets Done
                </span>
              </div>
              <h3 className="text-xs font-black truncate text-white">
                {activeSession.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                onClick={() => setCustomDurationMins((d) => (d || effectiveDurationMins) + 5)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-center font-mono text-xs font-black text-slate-200 cursor-pointer active-press transition-colors"
                title="Tap to adjust time (+5m)"
              >
                ⏱ {effectiveDurationMins}m
              </div>

              <button
                type="button"
                onClick={handleDiscardWorkout}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                title="Discard workout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Rest Countdown Bar */}
          {isResting && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-lg animate-fade-in border border-slate-700">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-400 animate-spin" />
                <div>
                  <p className="text-xs font-bold">Rest Countdown</p>
                  <p className="text-[9px] text-slate-400">Catch your breath for the next set</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-mono text-orange-400">
                  {restSeconds}s
                </span>
                <button
                  type="button"
                  onClick={() => setRestSeconds((s) => s + 30)}
                  className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-slate-200"
                >
                  +30s
                </button>
                <button
                  type="button"
                  onClick={() => setIsResting(false)}
                  className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-slate-300"
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
                  className={`bg-white rounded-2xl p-4 shadow-xs border transition-all ${
                    allDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'
                  }`}
                >
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {exIdx + 1}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {ex.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCompleteAllSets(ex.id)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-1 active-press"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All Done</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="w-6 h-6 rounded-lg text-slate-300 hover:text-rose-500 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sets List with 1-Tap Steppers */}
                  <div className="space-y-2">
                    {ex.sets.map((s) => (
                      <div
                        key={s.setNumber}
                        className={`p-1.5 rounded-xl transition-all flex items-center justify-between gap-1 w-full border ${
                          s.completed
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                            : 'bg-slate-50 text-slate-800 border-slate-100'
                        }`}
                      >
                        {/* Set Label */}
                        <span className="text-[11px] font-black text-slate-400 w-5 text-center shrink-0">
                          #{s.setNumber}
                        </span>

                        {/* Weight Stepper */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAdjustWeight(ex.id, s.setNumber, -2.5)}
                            className="w-5 h-6 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center active-press"
                          >
                            -
                          </button>

                          <div className="relative">
                            <input
                              type="text"
                              value={s.weight}
                              onChange={(e) => handleDirectInput(ex.id, s.setNumber, 'weight', e.target.value)}
                              className="w-11 text-center py-0.5 text-xs font-black rounded border border-slate-200 bg-white focus:outline-none"
                            />
                            <span className="text-[7px] font-bold text-slate-400 block text-center -mt-0.5">kg</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdjustWeight(ex.id, s.setNumber, 2.5)}
                            className="w-5 h-6 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center active-press"
                          >
                            +
                          </button>
                        </div>

                        {/* Reps Stepper */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAdjustReps(ex.id, s.setNumber, -1)}
                            className="w-5 h-6 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center active-press"
                          >
                            -
                          </button>

                          <div className="relative">
                            <input
                              type="text"
                              value={s.reps}
                              onChange={(e) => handleDirectInput(ex.id, s.setNumber, 'reps', e.target.value)}
                              className="w-9 text-center py-0.5 text-xs font-black rounded border border-slate-200 bg-white focus:outline-none"
                            />
                            <span className="text-[7px] font-bold text-slate-400 block text-center -mt-0.5">reps</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdjustReps(ex.id, s.setNumber, 1)}
                            className="w-5 h-6 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center active-press"
                          >
                            +
                          </button>
                        </div>

                        {/* Checkmark & Delete Set Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSet(ex.id, s.setNumber)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active-press ${
                              s.completed
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-transparent hover:border-slate-400'
                            }`}
                            title="Mark set done"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, s.setNumber)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors active-press"
                            title="Delete this set"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Set Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="w-full mt-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 active-press"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Exercise Floating Button */}
          <button
            type="button"
            onClick={() => setIsExerciseModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 text-slate-900 text-xs font-black flex items-center justify-center gap-2 active-press transition-all"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Add Exercise to Workout</span>
          </button>

          {/* =========================================================================
              MANUAL DURATION ADJUSTMENT CARD BEFORE FINISHING
              ========================================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ⏱ Workout Duration
              </span>
              <span className="text-xs font-extrabold text-orange-600">
                {effectiveDurationMins} minutes
              </span>
            </div>

            {/* Quick 1-Tap Duration Preset Chips */}
            <div className="grid grid-cols-5 gap-1">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomDurationMins(m)}
                  className={`py-1.5 text-xs font-bold rounded-xl transition-all active-press ${
                    effectiveDurationMins === m
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Custom Minutes Stepper */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Fine-tune duration</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(Math.max(5, effectiveDurationMins - 5))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active-press"
                >
                  -5m
                </button>
                <span className="font-mono text-xs font-bold text-slate-900 px-1">
                  {effectiveDurationMins} min
                </span>
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(effectiveDurationMins + 5)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active-press"
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/25 active-press flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Finish & Save ({effectiveDurationMins}m • {completedActiveSets}/{totalActiveSets} Sets)</span>
          </button>
        </div>
      ) : (
        /* =========================================================================
           MODE 2: WORKOUT ROADMAP & HOME VIEW
           ========================================================================= */
        <div className="space-y-3.5">
          {/* 1. HERO ACTIVE PROGRAM CARD */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <h3 className="text-xs font-black text-slate-900">
                    {trainingSchedule?.programTitle || 'Weekly Training Plan'}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[9px] font-extrabold text-orange-700">
                    {trainingSchedule?.daysPerWeek || (trainingSchedule?.schedule?.filter((s) => s.type !== 'Rest').length) || 4}d/wk
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProgramModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold active-press"
              >
                ✏️ Edit
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
                    className={`py-2 px-1 rounded-xl text-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : isToday
                        ? 'bg-orange-50 border border-orange-200 text-orange-700'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[9px] font-bold block uppercase opacity-80">
                      {day.slice(0, 3)}
                    </span>
                    <span className="text-[10px] font-black block mt-0.5">
                      {isRest ? '🛌' : '⚡'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELECTED DAY DRILL CARD */}
          {currentDaySchedule && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {selectedDay} • {currentDaySchedule.type || 'Workout'}
                  </span>
                  <h4 className="text-xs font-black text-slate-900 mt-0.5">
                    {currentDaySchedule.title}
                  </h4>
                </div>
                {currentDaySchedule.duration && (
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {currentDaySchedule.duration}
                  </span>
                )}
              </div>

              {currentDaySchedule.focus && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                  {currentDaySchedule.focus}
                </p>
              )}

              {currentDaySchedule.exercises && currentDaySchedule.exercises.length > 0 && (
                <div className="space-y-1.5">
                  {currentDaySchedule.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{ex.name}</p>
                        {ex.notes && <p className="text-[10px] text-slate-400 truncate">{ex.notes}</p>}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">
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
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start {selectedDay}'s Workout</span>
                </button>
              ) : (
                <div className="text-center py-2 text-xs font-bold text-slate-400">
                  Scheduled Rest & Recovery Day
                </div>
              )}
            </div>
          )}

          {/* 3. QUICK START EMPTY WORKOUT OR MANUAL PAST LOG */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleStartCustomWorkout}
              className="py-3 px-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 active-press transition-all"
            >
              <Plus className="w-4 h-4 text-orange-500" />
              <span>Start Custom</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualLogger(!showManualLogger)}
              className="py-3 px-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 active-press transition-all"
            >
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Log Past Workout</span>
            </button>
          </div>

          {/* 4. MANUAL PAST WORKOUT ACCORDION FORM */}
          {showManualLogger && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Log Finished Workout
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualLogger(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualWorkout} className="space-y-2.5">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={`e.g. 1h ${activeSport.toUpperCase()} Match or Leg Day`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Duration (mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Calories Burned</label>
                    <input
                      type="number"
                      min="10"
                      max="3000"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      placeholder={`~${Math.round((parseInt(manualDuration, 10) || 45) * 8.5)} kcal`}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {[20, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setManualDuration(String(mins));
                        setManualCalories(String(Math.round(mins * 9)));
                      }}
                      className="py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Manual Workout</span>
                </button>
              </form>
            </div>
          )}

          {/* 5. WORKOUT HISTORY */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed Sessions ({workouts.length})
            </span>

            {workouts.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs font-bold text-slate-700">No workouts recorded yet</p>
                <p className="text-[11px] text-slate-400">Start a session or log a past workout above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workouts.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-xl bg-slate-50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{w.title}</h5>
                        <span className="text-[10px] text-slate-400">
                          {w.time} • {w.duration}m • -{w.caloriesBurned} kcal
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkouts((prev) => prev.filter((item) => item.id !== w.id));
                          showToast('Workout deleted');
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {w.exercises && w.exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {w.exercises.map((ex, eIdx) => (
                          <span
                            key={eIdx}
                            className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200/60"
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
