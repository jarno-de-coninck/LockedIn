import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Bot,
  Loader2,
  Calendar,
  Send,
  Zap,
  ArrowRight,
  Check,
  Info,
} from 'lucide-react';
import {
  generateDietPlan,
  generateSportWorkout,
  generateWeeklySchedule,
  askNutritionistCoach,
} from '../services/groq';

const DIET_PRESETS = [
  { id: 'High Protein', label: 'High Protein', desc: 'Lean proteins & muscle recovery' },
  { id: 'Keto / Low Carb', label: 'Keto / Low Carb', desc: 'Healthy fats & low carb' },
  { id: 'Balanced', label: 'Balanced', desc: 'Complex carbs, protein & fats' },
  { id: 'Plant-Based', label: 'Plant-Based', desc: 'Whole food plant proteins' },
];

const SPORTS = [
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'weightlifting', name: 'Weightlifting', icon: '🏋️‍♂️' },
  { id: 'running', name: 'Running', icon: '🏃‍♂️' },
  { id: 'mma', name: 'MMA', icon: '🥊' },
  { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
];

const TRAINING_GOALS = [
  { id: 'strength', label: 'Strength & Muscle' },
  { id: 'endurance', label: 'Endurance & Stamina' },
  { id: 'agility', label: 'Speed & Agility' },
  { id: 'conditioning', label: 'Conditioning' },
];

const COACH_PROMPTS = [
  '🎾 Pre-match tennis fuel and lateral agility drills',
  '🥊 MMA conditioning for 5-round stamina',
  '🏃‍♂️ How to increase running VO2 max with intervals',
  '🏋️‍♂️ Optimal protein timing & volume for muscle',
];

export default function AiStudioTab({
  goal,
  meals,
  setMeals,
  dietPlan,
  setDietPlan,
  workouts,
  setWorkouts,
  trainingSchedule,
  setTrainingSchedule,
  activeSport,
  setActiveSport,
  trainingGoal,
  setTrainingGoal,
  setActiveTab,
}) {
  const [aiMode, setAiMode] = useState('diet'); // 'diet' | 'training' | 'coach'

  // Diet Mode State
  const [selectedDietPreset, setSelectedDietPreset] = useState('High Protein');
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  const [dietNote, setDietNote] = useState('');

  // Training Mode State
  const [trainingModeType, setTrainingModeType] = useState('schedule');
  const [sessionDuration, setSessionDuration] = useState(45);
  const [sessionLevel, setSessionLevel] = useState('Intermediate');
  const [scheduleDays, setScheduleDays] = useState(4);
  const [isGeneratingTraining, setIsGeneratingTraining] = useState(false);
  const [trainingNote, setTrainingNote] = useState('');
  const [generatedSession, setGeneratedSession] = useState(null);

  // Coach Chat State
  const [coachQuestion, setCoachQuestion] = useState('');
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [coachMessages, setCoachMessages] = useState([
    {
      id: 1,
      sender: 'coach',
      text: `👋 Hey! I'm **Coach Lock**, your personal AI Athletic Director & Sports Nutritionist. Ask me about drills, pre-match fueling, or macro splits!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const totalConsumed = meals.reduce((a, m) => a + (Number(m.calories) || 0), 0);
  const totalBurned = workouts.reduce((a, w) => a + (Number(w.caloriesBurned) || 0), 0);
  const remainingCalories = goal - (totalConsumed - totalBurned);

  // AI Status & Inline Key State
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [inlineKey, setInlineKey] = useState(
    localStorage.getItem('lockedin_custom_groq_key') || ''
  );
  const [aiStatus, setAiStatus] = useState(null);
  const [isCheckingAi, setIsCheckingAi] = useState(false);

  const checkAiAvailability = async (keyToTest = null) => {
    setIsCheckingAi(true);
    const key =
      keyToTest !== null
        ? keyToTest.trim()
        : localStorage.getItem('lockedin_custom_groq_key') ||
          import.meta.env.VITE_GROQ_API_KEY ||
          '';

    if (!key) {
      setAiStatus({
        connected: false,
        message: 'No Groq API key set. Enter your key below to connect.',
      });
      setIsCheckingAi(false);
      return;
    }

    const t0 = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      const latency = Date.now() - t0;
      if (res.ok) {
        setAiStatus({
          connected: true,
          message: `Live AI Online (openai/gpt-oss-20b • ${latency}ms)`,
          latency,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setAiStatus({
          connected: false,
          message: `Key rejected (${res.status}): ${err.error?.message || 'Invalid API Key'}`,
        });
      }
    } catch (e) {
      setAiStatus({
        connected: false,
        message: `Network error reaching Groq: ${e.message}`,
      });
    } finally {
      setIsCheckingAi(false);
    }
  };

  useEffect(() => {
    checkAiAvailability();
  }, []);

  const handleSaveInlineKey = async (e) => {
    e.preventDefault();
    if (!inlineKey.trim()) return;
    localStorage.setItem('lockedin_custom_groq_key', inlineKey.trim());
    localStorage.setItem('lockedin_ai_provider', 'groq');
    await checkAiAvailability(inlineKey.trim());
    setShowKeyConfig(false);
  };

  // 1. Generate Diet Plan
  const handleGenerateDiet = async () => {
    if (isGeneratingDiet) return;
    setIsGeneratingDiet(true);
    setDietNote('');

    try {
      const res = await generateDietPlan({
        goal,
        dietType: selectedDietPreset,
      });

      if (res && res.plan) {
        setDietPlan(res.plan);
        setDietNote(res.isMock ? 'Generated with local culinary database' : `Generated via ${res.modelName || 'AI'}`);
      }
    } catch (err) {
      console.warn('Diet generation error:', err);
      setDietNote('Error generating plan. Please try again.');
    } finally {
      setIsGeneratingDiet(false);
    }
  };

  // 2. Generate Training Plan
  const handleGenerateTraining = async () => {
    if (isGeneratingTraining) return;
    setIsGeneratingTraining(true);
    setTrainingNote('');
    setGeneratedSession(null);

    try {
      if (trainingModeType === 'schedule') {
        const res = await generateWeeklySchedule({
          sport: activeSport,
          goal: trainingGoal,
          daysPerWeek: scheduleDays,
          level: sessionLevel,
        });
        if (res && res.schedule) {
          setTrainingSchedule(res.schedule);
          setTrainingNote(`7-day schedule generated for ${activeSport.toUpperCase()}!`);
        }
      } else {
        const res = await generateSportWorkout({
          sport: activeSport,
          goal: trainingGoal,
          duration: sessionDuration,
          level: sessionLevel,
        });
        if (res && res.workout) {
          setGeneratedSession(res.workout);
          setTrainingNote(`Custom session generated for ${activeSport.toUpperCase()}!`);
        }
      }
    } catch (err) {
      console.warn('Training architect error:', err);
      setTrainingNote('Error generating training. Please try again.');
    } finally {
      setIsGeneratingTraining(false);
    }
  };

  // 3. Ask Coach Lock
  const handleAskCoach = async (query = null) => {
    const q = (query || coachQuestion).trim();
    if (!q || isCoachThinking) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCoachMessages((prev) => [...prev, userMsg]);
    setCoachQuestion('');
    setIsCoachThinking(true);

    try {
      const res = await askNutritionistCoach({
        question: q,
        context: {
          goal,
          totalConsumed,
          totalBurned,
          remainingCalories,
          meals,
          workouts,
          sport: activeSport,
          trainingGoal,
        },
      });

      setCoachMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'coach',
          text: res.reply || 'Could not generate advice.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.source,
          modelName: res.modelName,
        },
      ]);
    } catch (err) {
      console.warn('Coach Lock error:', err);
    } finally {
      setIsCoachThinking(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h5 key={idx} className="font-extrabold text-slate-900 mt-2 mb-1 text-xs">
                {line.replace('### ', '')}
              </h5>
            );
          }
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const rawContent = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-orange-500 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBold(rawContent) }} />
              </div>
            );
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
          );
        })}
      </div>
    );
  };

  const formatBold = (str) => {
    if (!str) return '';
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {/* 1. STUDIO SWITCHER */}
      <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setAiMode('diet')}
          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
            aiMode === 'diet'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Diet</span>
        </button>

        <button
          type="button"
          onClick={() => setAiMode('training')}
          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
            aiMode === 'training'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Training</span>
        </button>

        <button
          type="button"
          onClick={() => setAiMode('coach')}
          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${
            aiMode === 'coach'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-orange-500" />
          <span>Coach Lock</span>
        </button>
      </div>

      {/* 1.5 LIVE AI ENGINE STATUS & KEY BAR */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                aiStatus?.connected
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">Coach Lock AI</span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-orange-100 text-orange-700">
                  openai/gpt-oss-20b
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    aiStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{aiStatus ? aiStatus.message : 'Checking AI status...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => checkAiAvailability()}
              disabled={isCheckingAi}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold active-press transition-all"
              title="Test connection"
            >
              {isCheckingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ping'}
            </button>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold active-press transition-all"
            >
              {showKeyConfig ? 'Close' : 'Enter Key'}
            </button>
          </div>
        </div>

        {/* Inline Key Input when expanded or when not connected */}
        {(showKeyConfig || (aiStatus && !aiStatus.connected)) && (
          <form
            onSubmit={handleSaveInlineKey}
            className="pt-2 border-t border-slate-100 space-y-1.5 animate-scale-up"
          >
            <label className="text-[10px] font-bold text-slate-600 block">
              Enter / Update Groq API Key
            </label>
            <div className="flex gap-1.5">
              <input
                type="password"
                value={inlineKey}
                onChange={(e) => setInlineKey(e.target.value)}
                placeholder="gsk_..."
                className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isCheckingAi}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0 hover:bg-slate-800 active-press transition-all flex items-center gap-1"
              >
                {isCheckingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save & Connect'}
              </button>
            </div>
            <p className="text-[9px] text-slate-400">
              Your key is stored privately in your phone's browser and connects directly to Groq Cloud.
            </p>
          </form>
        )}
      </div>

      {/* =========================================================================
          MODE 1: DIET PLAN ARCHITECT
          ========================================================================= */}
      {aiMode === 'diet' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Diet Architect
                </span>
                <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">
                  Calibrated for {goal} kcal target
                </h3>
              </div>
              <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                {goal} kcal
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {DIET_PRESETS.map((p) => {
                const isSel = selectedDietPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedDietPreset(p.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all active-press ${
                      isSel
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/60'
                    }`}
                  >
                    <p className="text-xs font-bold">{p.label}</p>
                    <p className={`text-[9px] mt-0.5 ${isSel ? 'text-slate-300' : 'text-slate-400'}`}>
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleGenerateDiet}
              disabled={isGeneratingDiet}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
            >
              {isGeneratingDiet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating 4-Meal Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {selectedDietPreset} Plan</span>
                </>
              )}
            </button>

            {dietNote && (
              <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                <Info className="w-3 h-3 text-orange-500" />
                <span>{dietNote}</span>
              </p>
            )}
          </div>

          {/* Generated Diet Preview */}
          {dietPlan && dietPlan.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active 4-Meal Plan
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {dietPlan.reduce((a, m) => a + (Number(m.calories) || 0), 0)} / {goal} kcal
                </span>
              </div>

              <div className="space-y-1.5">
                {dietPlan.map((m, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {m.meal}
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-1">{m.title}</p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">{m.calories} kcal</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('diet')}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open in Diet Tab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE 2: TRAINING & SCHEDULE ARCHITECT
          ========================================================================= */}
      {aiMode === 'training' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Training Architect
            </span>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTrainingModeType('schedule')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trainingModeType === 'schedule' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                7-Day Roadmap
              </button>
              <button
                type="button"
                onClick={() => setTrainingModeType('session')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trainingModeType === 'session' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Single Session
              </button>
            </div>

            {/* Sport Chips */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sport</label>
              <div className="grid grid-cols-5 gap-1">
                {SPORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSport(s.id)}
                    className={`py-2 rounded-xl border text-center transition-all ${
                      activeSport === s.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200/60'
                    }`}
                  >
                    <span className="text-base block">{s.icon}</span>
                    <span className="text-[9px] font-bold block mt-0.5 truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Chips */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus</label>
              <div className="grid grid-cols-2 gap-1">
                {TRAINING_GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setTrainingGoal(g.label)}
                    className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                      trainingGoal === g.label
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200/60'
                    }`}
                  >
                    <span className="text-xs font-bold block">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Frequency Selector */}
            {trainingModeType === 'schedule' && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Workout Frequency
                  </label>
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    {scheduleDays} Training Days / Week
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setScheduleDays(days)}
                      className={`py-2 rounded-xl border text-center transition-all ${
                        scheduleDays === days
                          ? 'bg-slate-900 text-white border-slate-900 font-black shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <span className="text-xs font-black block">{days}</span>
                      <span className="text-[8px] font-semibold block uppercase opacity-75">Days</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateTraining}
              disabled={isGeneratingTraining}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
            >
              {isGeneratingTraining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Architecting Training...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {activeSport.toUpperCase()} {trainingModeType === 'schedule' ? '7-Day Plan' : 'Workout'}</span>
                </>
              )}
            </button>

            {trainingNote && (
              <p className="text-[10px] text-slate-400 text-center">{trainingNote}</p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: CONVERSATIONAL AI COACH (COACH LOCK)
          ========================================================================= */}
      {aiMode === 'coach' && (
        <div className="space-y-3.5 animate-slide-up">
          {/* Quick Context Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-white">Coach Lock Active</span>
            </div>
            <span className="text-[10px] font-bold text-orange-400">
              ⚡ {remainingCalories} kcal left
            </span>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-1">
            {COACH_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskCoach(q)}
                className="py-1 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium transition-all active-press flex items-center gap-1 shadow-2xs"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="space-y-2.5 pt-1">
            {coachMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[92%] rounded-2xl p-3.5 shadow-2xs border ${
                      isUser
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-800 border-slate-200/80'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-extrabold text-slate-900 uppercase">Coach Lock</span>
                        <span className="text-[9px] text-slate-400">{msg.time}</span>
                      </div>
                    )}

                    {isUser ? (
                      <p className="text-xs font-semibold">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>
                </div>
              );
            })}

            {isCoachThinking && (
              <div className="flex items-start">
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  <span className="text-xs text-slate-500">Analyzing performance data...</span>
                </div>
              </div>
            )}
          </div>

          {/* Clean Integrated Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskCoach();
            }}
            className="sticky bottom-16 pt-2"
          >
            <div className="relative flex items-center shadow-lg rounded-2xl bg-white border border-slate-200/80 p-1">
              <input
                type="text"
                value={coachQuestion}
                onChange={(e) => setCoachQuestion(e.target.value)}
                placeholder="Ask about drills, macro splits, recovery..."
                className="w-full px-3.5 py-2 text-xs bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={!coachQuestion.trim() || isCoachThinking}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white transition-colors shrink-0 active-press"
              >
                {isCoachThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
