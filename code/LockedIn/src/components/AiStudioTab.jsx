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
import { useLanguage } from '../services/i18n';

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
  const { t } = useLanguage();
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
      text: `👋 Hey! I'm **Coach Lock**, your personal Olympic Athletic Director & Sports Nutritionist. Ask me about drills, pre-match fueling, or macro splits!`,
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
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h5 key={idx} className="font-black text-orange-400 mt-2 mb-1 text-xs uppercase tracking-wider">
                {line.replace('### ', '')}
              </h5>
            );
          }
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const rawContent = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-slate-200">
                <span className="text-orange-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBold(rawContent) }} />
              </div>
            );
          }
          return (
            <p key={idx} className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
          );
        })}
      </div>
    );
  };

  const formatBold = (str) => {
    if (!str) return '';
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-orange-300">$1</em>');
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in w-full">
      {/* 1. STUDIO SWITCHER */}
      <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-2xl grid grid-cols-3 gap-1 shadow-lg">
        <button
          type="button"
          onClick={() => setAiMode('diet')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
            aiMode === 'diet'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>{t('dietMode')}</span>
        </button>

        <button
          type="button"
          onClick={() => setAiMode('training')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
            aiMode === 'training'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>{t('trainingMode')}</span>
        </button>

        <button
          type="button"
          onClick={() => setAiMode('coach')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
            aiMode === 'coach'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-white" />
          <span>{t('coachMode')}</span>
        </button>
      </div>

      {/* Show connection warning & key input ONLY when NOT connected */}
      {aiStatus && !aiStatus.connected && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-3xl p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-200 block">
                  AI Engine Offline — Using Fallback
                </span>
                <span className="text-[11px] text-amber-400/80 font-medium block">
                  Enter your Groq API key to activate live Coach Lock.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => checkAiAvailability()}
              disabled={isCheckingAi}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-black active-press transition-colors"
            >
              {isCheckingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Retry'}
            </button>
          </div>

          <form onSubmit={handleSaveInlineKey} className="flex gap-2 pt-1">
            <input
              type="password"
              value={inlineKey}
              onChange={(e) => setInlineKey(e.target.value)}
              placeholder="Paste your gsk_... key here"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-amber-500/30 bg-slate-950 text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isCheckingAi}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shrink-0 active-press transition-colors flex items-center gap-1 shadow-md"
            >
              {isCheckingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Connect'}
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODE 1: DIET PLAN ARCHITECT
          ========================================================================= */}
      {aiMode === 'diet' && (
        <div className="space-y-4 animate-slide-up">
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  {t('dietMode')}
                </span>
                <h3 className="text-xs font-black text-white mt-0.5">
                  Calibrated for {goal} kcal target
                </h3>
              </div>
              <span className="text-xs font-black text-orange-400 bg-orange-500/15 px-3 py-1 rounded-full border border-orange-500/30">
                {goal} kcal
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {DIET_PRESETS.map((p) => {
                const isSel = selectedDietPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedDietPreset(p.id)}
                    className={`text-left p-3 rounded-2xl border transition-all active-press ${
                      isSel
                        ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                        : 'bg-slate-950/70 hover:bg-slate-800/60 text-slate-300 border-slate-800'
                    }`}
                  >
                    <p className="text-xs font-black">{p.label}</p>
                    <p className={`text-[10px] mt-1 font-medium ${isSel ? 'text-orange-100' : 'text-slate-400'}`}>
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
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-orange-500/25"
            >
              {isGeneratingDiet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating 4-Meal Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('generateDietBtn')} ({selectedDietPreset})</span>
                </>
              )}
            </button>

            {dietNote && (
              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5 text-orange-400" />
                <span>{dietNote}</span>
              </p>
            )}
          </div>

          {/* Generated Diet Preview */}
          {dietPlan && dietPlan.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Active 4-Meal Plan
                </span>
                <span className="text-xs font-black text-orange-400">
                  {dietPlan.reduce((a, m) => a + (Number(m.calories) || 0), 0)} / {goal} kcal
                </span>
              </div>

              <div className="space-y-2">
                {dietPlan.map((m, idx) => (
                  <div key={idx} className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800/80 shadow-md flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 uppercase">
                        {m.meal}
                      </span>
                      <p className="text-xs font-black text-white mt-1">{m.title}</p>
                    </div>
                    <span className="text-xs font-black text-orange-400">{m.calories} kcal</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('diet')}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 border border-slate-800 shadow-md"
              >
                <span>{t('openInDiet')}</span>
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
        <div className="space-y-4 animate-slide-up">
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-lg space-y-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              {t('trainingMode')}
            </span>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTrainingModeType('schedule')}
                className={`py-2 text-xs font-black rounded-xl transition-all ${
                  trainingModeType === 'schedule' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                7-Day Roadmap
              </button>
              <button
                type="button"
                onClick={() => setTrainingModeType('session')}
                className={`py-2 text-xs font-black rounded-xl transition-all ${
                  trainingModeType === 'session' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                Single Session
              </button>
            </div>

            {/* Sport Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Sport</label>
              <div className="grid grid-cols-5 gap-1.5">
                {SPORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSport(s.id)}
                    className={`py-2.5 rounded-2xl border text-center transition-all ${
                      activeSport === s.id
                        ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-lg block">{s.icon}</span>
                    <span className="text-[10px] font-black block mt-0.5 truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Focus</label>
              <div className="grid grid-cols-2 gap-2">
                {TRAINING_GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setTrainingGoal(g.label)}
                    className={`py-2.5 px-3 rounded-2xl border text-left transition-all ${
                      trainingGoal === g.label
                        ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black block">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Frequency Selector */}
            {trainingModeType === 'schedule' && (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Workout Frequency
                  </label>
                  <span className="text-[10px] font-black text-orange-300 bg-orange-500/20 px-2.5 py-0.5 rounded-md border border-orange-500/30">
                    {scheduleDays} Training Days / Week
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setScheduleDays(days)}
                      className={`py-2 rounded-2xl border text-center transition-all ${
                        scheduleDays === days
                          ? 'bg-orange-500 text-white border-orange-400 font-black shadow-md'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white font-bold'
                      }`}
                    >
                      <span className="text-xs font-black block">{days}</span>
                      <span className="text-[9px] font-bold block uppercase opacity-75">Days</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateTraining}
              disabled={isGeneratingTraining}
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-orange-500/25"
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
              <p className="text-xs text-slate-400 text-center">{trainingNote}</p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: CONVERSATIONAL AI COACH (COACH LOCK)
          ========================================================================= */}
      {aiMode === 'coach' && (
        <div className="space-y-4 animate-slide-up">
          {/* Quick Context Pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-white">{t('coachActive')}</span>
            </div>
            <span className="text-xs font-black text-orange-400">
              ⚡ {remainingCalories} {t('kcalLeft')}
            </span>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5">
            {COACH_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskCoach(q)}
                className="py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold transition-all active-press flex items-center gap-1 shadow-sm"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="space-y-3 pt-1">
            {coachMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[92%] rounded-3xl p-4 shadow-md border ${
                      isUser
                        ? 'bg-orange-500 text-white border-orange-400'
                        : 'bg-slate-900 text-slate-200 border-slate-800'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Coach Lock</span>
                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                      </div>
                    )}

                    {isUser ? (
                      <p className="text-xs font-bold">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>
                </div>
              );
            })}

            {isCoachThinking && (
              <div className="flex items-start">
                <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-md flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Analyzing athletic telemetry...</span>
                </div>
              </div>
            )}
          </div>

          {/* Integrated Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskCoach();
            }}
            className="sticky bottom-16 pt-2"
          >
            <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-900 border border-slate-800 p-1">
              <input
                type="text"
                value={coachQuestion}
                onChange={(e) => setCoachQuestion(e.target.value)}
                placeholder={t('askCoachPlaceholder')}
                className="w-full px-3.5 py-2.5 text-xs bg-transparent text-white focus:outline-none placeholder:text-slate-500 font-bold"
              />
              <button
                type="submit"
                disabled={!coachQuestion.trim() || isCoachThinking}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 text-white transition-colors shrink-0 active-press shadow-md shadow-orange-500/20"
              >
                {isCoachThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
