import React, { useState, useMemo } from 'react';
import {
  User,
  X,
  Check,
  Activity,
  Flame,
  Scale,
  Ruler,
  Server,
  Cloud,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Calculator,
  TrendingDown,
  TrendingUp,
  Minus,
  Bot,
  Globe,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Heart,
  Dumbbell,
  Target,
} from 'lucide-react';
import {
  getActiveProvider,
  getLocalAiEndpoint,
  getGroqApiKey,
  testLocalAiConnection,
  estimateMaintenanceWithAi,
} from '../services/groq';
import { useLanguage, LANGUAGES } from '../services/i18n';

const SPORTS_LIST = [
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'running', label: 'Running', icon: '🏃' },
  { id: 'boxing', label: 'Boxing / MMA', icon: '🥊' },
  { id: 'weightlifting', label: 'Gym & Lifting', icon: '🏋️' },
  { id: 'swimming', label: 'Swimming', icon: '🏊' },
  { id: 'cycling', label: 'Cycling', icon: '🚴' },
];

const TRAINING_GOALS = [
  { id: 'strength', label: 'Strength & Muscle', desc: 'Heavy compounds and progressive overload' },
  { id: 'endurance', label: 'Endurance & Stamina', desc: 'Cardio capacity and stamina drills' },
  { id: 'fat_loss', label: 'Fat Loss & Tone', desc: 'High energy burn with lean muscle retention' },
  { id: 'athletic_power', label: 'Speed & Agility', desc: 'Explosive plyometrics and athletic movement' },
];

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  goal,
  setGoal,
  activeSport,
  setActiveSport,
  trainingGoal,
  setTrainingGoal,
}) {
  const { language, setLanguage, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);

  const [gender, setGender] = useState(userProfile?.gender || 'male');
  const [height, setHeight] = useState(userProfile?.height || 180);
  const [weight, setWeight] = useState(userProfile?.weight || 78);
  const [age, setAge] = useState(userProfile?.age || 22);
  const [activityLevel, setActivityLevel] = useState(userProfile?.activityLevel || 'moderate');
  const [calorieGoalType, setCalorieGoalType] = useState(userProfile?.calorieGoalType || 'maintain');
  const [tempGoal, setTempGoal] = useState(goal);
  const [toastMsg, setToastMsg] = useState(false);

  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem('lockedin_custom_groq_key') || ''
  );
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState(null);

  const calculatedMaintenance = useMemo(() => {
    const w = Number(weight) || 78;
    const h = Number(height) || 180;
    const a = Number(age) || 22;

    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'male') bmr += 5;
    else if (gender === 'female') bmr -= 161;
    else bmr -= 78;

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      heavy: 1.725,
      athlete: 1.9,
    };
    const multiplier = multipliers[activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
  }, [weight, height, age, gender, activityLevel]);

  const computedTarget = useMemo(() => {
    if (calorieGoalType === 'lose') return Math.round(calculatedMaintenance - 450);
    if (calorieGoalType === 'gain') return Math.round(calculatedMaintenance + 350);
    return calculatedMaintenance;
  }, [calculatedMaintenance, calorieGoalType]);

  const heightInMeters = Number(height) / 100;
  const bmiValue =
    heightInMeters > 0 && Number(weight) > 0
      ? (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1)
      : '24.1';

  if (!isOpen) return null;

  const handleTestGroq = async () => {
    setTestingGroq(true);
    setGroqTestResult(null);
    const key = apiKeyInput.trim() || getGroqApiKey();
    if (!key) {
      setGroqTestResult({
        success: false,
        message: 'No Groq API key detected. Using offline fallback engine.',
      });
      setTestingGroq(false);
      return;
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        setGroqTestResult({
          success: true,
          message: 'Groq Cloud Online (openai/gpt-oss-20b)',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setGroqTestResult({
          success: false,
          message: err.error?.message || 'Invalid API key',
        });
      }
    } catch (e) {
      setGroqTestResult({
        success: false,
        message: `Network error: ${e.message}`,
      });
    } finally {
      setTestingGroq(false);
    }
  };

  const handleAiEstimate = async () => {
    setIsAiEstimating(true);
    setAiResult(null);
    try {
      const res = await estimateMaintenanceWithAi({
        gender,
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        activityLevel,
        goalType: calorieGoalType,
      });
      if (res) {
        setAiResult(res);
        if (res.targetCalories) {
          setTempGoal(res.targetCalories);
        }
      }
    } catch (err) {
      console.warn('AI TDEE estimate error:', err);
    } finally {
      setIsAiEstimating(false);
    }
  };

  const applyGoalType = (type) => {
    setCalorieGoalType(type);
    if (type === 'lose') {
      setTempGoal(Math.round(calculatedMaintenance - 450));
    } else if (type === 'gain') {
      setTempGoal(Math.round(calculatedMaintenance + 350));
    } else {
      setTempGoal(calculatedMaintenance);
    }
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    const updated = {
      gender,
      height: Number(height),
      weight: Number(weight),
      age: Number(age),
      bmi: bmiValue,
      activityLevel,
      calorieGoalType,
      estimatedMaintenance: calculatedMaintenance,
      goalCalories: Number(tempGoal),
    };

    setUserProfile(updated);
    try {
      localStorage.setItem('lockedin_user_profile', JSON.stringify(updated));
    } catch {}

    setGoal(Number(tempGoal));

    localStorage.setItem('lockedin_ai_provider', 'groq');
    if (apiKeyInput.trim()) {
      localStorage.setItem('lockedin_custom_groq_key', apiKeyInput.trim());
    } else {
      localStorage.removeItem('lockedin_custom_groq_key');
    }

    setToastMsg(true);
    setTimeout(() => {
      setToastMsg(false);
      onClose();
    }, 500);
  };

  const steps = [
    { num: 1, title: 'Body & Language', desc: 'Height, weight, age' },
    { num: 2, title: 'Activity Level', desc: 'How active are you?' },
    { num: 3, title: 'Calorie Target', desc: 'Lose, maintain, gain' },
    { num: 4, title: 'Sport & Goals', desc: 'Your training focus' },
    { num: 5, title: 'AI Settings', desc: 'Connection & models' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-wizard-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-slate-700 flex flex-col max-h-[92dvh] overflow-hidden animate-slide-up text-white">
        <div className="p-4 sm:p-5 border-b-2 border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border-2 border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="profile-wizard-title" className="text-base font-black text-white">
                Athlete Profile Setup
              </h3>
              <p className="text-xs text-slate-300 font-bold">
                Step {currentStep} of 5: {steps[currentStep - 1].title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup wizard"
            className="min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 border-2 border-transparent hover:border-slate-700 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-5 gap-1.5">
            {steps.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                aria-label={`Go to step ${s.num}: ${s.title}`}
                className={`py-2 px-1 rounded-xl text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${
                  currentStep === s.num
                    ? 'bg-orange-600 text-white font-black shadow-md border border-orange-400'
                    : currentStep > s.num
                    ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600/60'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-black block">Step {s.num}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-orange-950/40 border-2 border-orange-500/40 text-orange-200 text-sm">
                <p className="font-extrabold text-white">Let&apos;s start with your body basics.</p>
                <p className="text-xs text-orange-200 mt-1">This helps calculate your daily metabolism accurately.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Preferred App Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`min-h-[50px] p-2.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 border-2 transition-all ${
                        language === l.code
                          ? 'bg-orange-600 text-white border-orange-400'
                          : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'Male' },
                    { id: 'female', label: 'Female' },
                    { id: 'other', label: 'Other' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      className={`min-h-[52px] rounded-2xl text-sm font-black border-2 transition-all capitalize ${
                        gender === g.id
                          ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                          : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-white uppercase block">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full min-h-[52px] px-4 text-base font-black rounded-2xl border-2 border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-white uppercase block">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full min-h-[52px] px-4 text-base font-black rounded-2xl border-2 border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-white uppercase block">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full min-h-[52px] px-4 text-base font-black rounded-2xl border-2 border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Calculated Body Mass Index (BMI)</span>
                  <span className="text-xl font-black text-white font-mono">{bmiValue}</span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">
                  {Number(bmiValue) < 18.5 ? 'Underweight' : Number(bmiValue) < 25 ? 'Normal Range' : Number(bmiValue) < 30 ? 'Overweight' : 'High'}
                </span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-orange-950/40 border-2 border-orange-500/40 text-orange-200 text-sm">
                <p className="font-extrabold text-white">How active are you in a normal week?</p>
                <p className="text-xs text-orange-200 mt-1">This adjusts your total daily energy expenditure (TDEE).</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'sedentary', label: 'Desk Job / Sedentary', desc: 'Little to no regular exercise each week.' },
                  { id: 'light', label: 'Light Exercise', desc: '1 to 2 light workouts or brisk walks per week.' },
                  { id: 'moderate', label: 'Moderate Training', desc: '3 to 5 workouts or athletic sports per week.' },
                  { id: 'heavy', label: 'Intense Training', desc: '6 to 7 heavy gym sessions or hard sport days.' },
                  { id: 'athlete', label: 'Competitive Athlete', desc: 'Intense training sessions twice per day.' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id)}
                    className={`w-full min-h-[64px] p-4 rounded-2xl border-2 text-left transition-all active-press flex items-center justify-between ${
                      activityLevel === item.id
                        ? 'bg-orange-950 text-white border-orange-400 shadow-md'
                        : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-base font-black block">{item.label}</span>
                      <span className="text-xs text-slate-300 font-bold block mt-0.5">{item.desc}</span>
                    </div>
                    {activityLevel === item.id && (
                      <CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-orange-950/40 border-2 border-orange-500/40 text-orange-200 text-sm">
                <p className="font-extrabold text-white">What is your primary weight or fitness goal?</p>
                <p className="text-xs text-orange-200 mt-1">Your baseline maintenance is estimated at ~{calculatedMaintenance} calories/day.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => applyGoalType('lose')}
                  className={`min-h-[96px] p-4 rounded-2xl border-2 text-left transition-all active-press ${
                    calorieGoalType === 'lose'
                      ? 'bg-orange-600 text-white border-orange-400 shadow-lg'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-base font-black">Lose Weight</span>
                  </div>
                  <span className="text-2xl font-black font-mono block mt-2">
                    {Math.round(calculatedMaintenance - 450)} <span className="text-xs font-normal">kcal</span>
                  </span>
                  <span className="text-xs text-orange-200 font-bold block mt-1">-450 kcal deficit</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoalType('maintain')}
                  className={`min-h-[96px] p-4 rounded-2xl border-2 text-left transition-all active-press ${
                    calorieGoalType === 'maintain'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Minus className="w-5 h-5" />
                    <span className="text-base font-black">Maintain Weight</span>
                  </div>
                  <span className="text-2xl font-black font-mono block mt-2">
                    {calculatedMaintenance} <span className="text-xs font-normal">kcal</span>
                  </span>
                  <span className="text-xs text-emerald-200 font-bold block mt-1">Exact balance</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoalType('gain')}
                  className={`min-h-[96px] p-4 rounded-2xl border-2 text-left transition-all active-press ${
                    calorieGoalType === 'gain'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-base font-black">Gain Muscle</span>
                  </div>
                  <span className="text-2xl font-black font-mono block mt-2">
                    {Math.round(calculatedMaintenance + 350)} <span className="text-xs font-normal">kcal</span>
                  </span>
                  <span className="text-xs text-blue-200 font-bold block mt-1">+350 kcal surplus</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-300">Custom Target Calorie Target</span>
                  <button
                    type="button"
                    onClick={handleAiEstimate}
                    disabled={isAiEstimating}
                    className="min-h-[44px] px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-2 active-press disabled:opacity-50"
                  >
                    {isAiEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    <span>Ask Coach Lock AI</span>
                  </button>
                </div>
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  className="w-full min-h-[52px] px-4 text-xl font-black font-mono rounded-2xl border-2 border-slate-700 bg-slate-900 text-white focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
                />

                {aiResult && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/40 text-xs text-slate-200 space-y-1">
                    <p className="font-black text-orange-400">Coach Lock Recommendation:</p>
                    <p>{aiResult.advice}</p>
                    {aiResult.recommendedProteinGrams && (
                      <p className="font-bold text-emerald-400">Target Daily Protein: ~{aiResult.recommendedProteinGrams}g</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-orange-950/40 border-2 border-orange-500/40 text-orange-200 text-sm">
                <p className="font-extrabold text-white">Pick your sport and primary training style.</p>
                <p className="text-xs text-orange-200 mt-1">Your workouts and drills will be generated around this.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Primary Sport
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPORTS_LIST.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSport(s.id)}
                      className={`min-h-[56px] p-2 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                        activeSport === s.id
                          ? 'bg-orange-600 text-white border-orange-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 font-bold'
                      }`}
                    >
                      <span className="text-xl block">{s.icon}</span>
                      <span className="text-xs mt-0.5 block truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Training Focus
                </label>
                <div className="space-y-2">
                  {TRAINING_GOALS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTrainingGoal(g.label)}
                      className={`w-full min-h-[58px] p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                        trainingGoal === g.label
                          ? 'bg-orange-950 text-white border-orange-400 shadow-md'
                          : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-black block">{g.label}</span>
                        <span className="text-xs text-slate-300 font-bold block mt-0.5">{g.desc}</span>
                      </div>
                      {trainingGoal === g.label && (
                        <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-orange-950/40 border-2 border-orange-500/40 text-orange-200 text-sm">
                <p className="font-extrabold text-white">AI Engine & Connection Settings</p>
                <p className="text-xs text-orange-200 mt-1">LockedIn works fully offline with local heuristics or online with Groq Cloud.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 space-y-3">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Optional Groq API Key (Free)
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full min-h-[52px] px-4 text-sm font-mono rounded-2xl border-2 border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestGroq}
                    disabled={testingGroq}
                    className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-2 active-press transition-colors border border-slate-600"
                  >
                    {testingGroq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                    <span>Test Connection</span>
                  </button>
                </div>

                {groqTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold ${
                      groqTestResult.success
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-500/40'
                        : 'bg-rose-950 text-rose-200 border-rose-500/40'
                    }`}
                  >
                    {groqTestResult.message}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800">
                <span className="text-xs font-black text-slate-300 uppercase block mb-1">Active AI Model</span>
                <span className="text-sm font-extrabold text-orange-400">openai/gpt-oss-20b (Groq LPU)</span>
                <p className="text-xs text-slate-400 mt-1">Zero configuration required if using the offline fallback engine.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t-2 border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="min-h-[52px] px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white text-sm font-black flex items-center gap-2 active-press transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="min-h-[52px] px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-black flex items-center gap-2 active-press transition-colors shadow-lg shadow-orange-600/30 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProfile}
                className="min-h-[52px] px-7 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black flex items-center gap-2 active-press transition-colors shadow-lg shadow-emerald-600/30 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Save Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
