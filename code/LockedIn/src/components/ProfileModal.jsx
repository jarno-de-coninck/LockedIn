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
} from 'lucide-react';
import {
  getActiveProvider,
  getLocalAiEndpoint,
  getGroqApiKey,
  testLocalAiConnection,
  estimateMaintenanceWithAi,
} from '../services/groq';

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
  if (!isOpen) return null;

  const [gender, setGender] = useState(userProfile?.gender || 'male');
  const [height, setHeight] = useState(userProfile?.height || 180);
  const [weight, setWeight] = useState(userProfile?.weight || 78);
  const [age, setAge] = useState(userProfile?.age || 22);
  const [activityLevel, setActivityLevel] = useState(userProfile?.activityLevel || 'moderate');
  const [calorieGoalType, setCalorieGoalType] = useState(userProfile?.calorieGoalType || 'maintain');
  const [tempGoal, setTempGoal] = useState(goal);
  const [toastMsg, setToastMsg] = useState(false);

  // AI Maintenance Assistant State
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // AI settings
  const [provider, setProvider] = useState(getActiveProvider());
  const [localEndpoint, setLocalEndpoint] = useState(
    localStorage.getItem('lockedin_local_ai_endpoint') || '/api/local-ai'
  );
  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem('lockedin_custom_groq_key') || ''
  );
  const [testingLocal, setTestingLocal] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Scientific Mifflin-St Jeor calculation
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

  // Dynamic target based on goal type
  const computedTarget = useMemo(() => {
    if (calorieGoalType === 'lose') return Math.round(calculatedMaintenance - 450);
    if (calorieGoalType === 'gain') return Math.round(calculatedMaintenance + 350);
    return calculatedMaintenance;
  }, [calculatedMaintenance, calorieGoalType]);

  // BMI Calculation
  const heightInMeters = Number(height) / 100;
  const bmiValue =
    heightInMeters > 0 && Number(weight) > 0
      ? (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1)
      : '24.1';

  const handleTestConnection = async () => {
    setTestingLocal(true);
    setTestResult(null);
    const res = await testLocalAiConnection(localEndpoint.trim());
    setTestResult(res);
    setTestingLocal(false);
  };

  const handleAiEstimate = async () => {
    setIsAiEstimating(true);
    try {
      const res = await estimateMaintenanceWithAi({
        gender,
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        activityLevel,
        goalType: calorieGoalType,
      });
      setAiResult(res);
      if (res?.targetCalories) {
        setTempGoal(res.targetCalories);
      }
    } catch (err) {
      console.warn('AI estimate error:', err);
    } finally {
      setIsAiEstimating(false);
    }
  };

  const applyGoalType = (type) => {
    setCalorieGoalType(type);
    let newTarget = calculatedMaintenance;
    if (type === 'lose') newTarget = Math.round(calculatedMaintenance - 450);
    else if (type === 'gain') newTarget = Math.round(calculatedMaintenance + 350);
    setTempGoal(newTarget);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const parsedHeight = Number(height) || 180;
    const parsedWeight = Number(weight) || 78;
    const parsedAge = Number(age) || 22;
    const parsedGoal = Number(tempGoal) || computedTarget;

    const updatedProfile = {
      gender,
      height: parsedHeight,
      weight: parsedWeight,
      age: parsedAge,
      activityLevel,
      calorieGoalType,
      estimatedMaintenance: calculatedMaintenance,
      bmi: bmiValue,
      goalCalories: parsedGoal,
    };

    setUserProfile(updatedProfile);
    setGoal(parsedGoal);

    // Save AI configs
    localStorage.setItem('lockedin_ai_provider', provider);
    localStorage.setItem('lockedin_local_ai_endpoint', localEndpoint.trim());
    if (apiKeyInput.trim()) {
      localStorage.setItem('lockedin_custom_groq_key', apiKeyInput.trim());
    } else {
      localStorage.removeItem('lockedin_custom_groq_key');
    }

    setToastMsg(true);
    setTimeout(() => {
      setToastMsg(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90dvh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">Athlete Profile & Biometrics</h3>
              <p className="text-[10px] text-slate-400">Calories, Goal & AI Settings</p>
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

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Section 1: Biometrics */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Physical Biometrics
            </span>

            {/* Gender */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    gender === g
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Height / Weight / Age */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Height</label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">cm</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Weight</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">kg</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Age</label>
                <div className="relative">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">yrs</span>
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                Weekly Training & Activity Level
              </label>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                {[
                  { id: 'sedentary', label: 'Desk Job', desc: 'Little to no exercise' },
                  { id: 'light', label: 'Light', desc: '1-2 gym days' },
                  { id: 'moderate', label: 'Moderate', desc: '3-5 gym days' },
                  { id: 'heavy', label: 'Intense', desc: '6-7 gym days' },
                  { id: 'athlete', label: 'Athlete', desc: '2x per day' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id)}
                    className={`p-1.5 rounded-xl border transition-all text-left ${
                      activityLevel === item.id
                        ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-2xs font-extrabold'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block leading-tight">{item.label}</span>
                    <span className="text-[8px] text-slate-400 font-normal block leading-tight">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: AI Maintenance & Goal Selection */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black tracking-tight text-white">
                  Maintenance & Calorie Goal
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[9px] font-extrabold text-orange-300">
                Mifflin-St Jeor
              </span>
            </div>

            {/* Estimated Maintenance Bar */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Your Estimated Maintenance (TDEE):
                </span>
                <span className="text-sm font-black text-white font-mono">
                  {calculatedMaintenance} <span className="text-xs font-normal text-slate-400">kcal/day</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAiEstimate}
                disabled={isAiEstimating}
                className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black flex items-center gap-1 active-press shadow-xs disabled:opacity-50"
              >
                {isAiEstimating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                <span>Ask Coach Lock</span>
              </button>
            </div>

            {/* Goal Strategy Options: Lose, Maintain, Gain */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                Choose Your Calorie Target:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {/* 1. Lose Weight */}
                <button
                  type="button"
                  onClick={() => applyGoalType('lose')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    calorieGoalType === 'lose'
                      ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-[11px] font-extrabold block">Lose Weight</span>
                  </div>
                  <span className="text-xs font-black font-mono block mt-0.5">
                    {Math.round(calculatedMaintenance - 450)} <span className="text-[8px] font-normal">kcal</span>
                  </span>
                  <span className={`text-[8px] block mt-0.5 leading-tight ${calorieGoalType === 'lose' ? 'text-orange-100' : 'text-slate-400'}`}>
                    -450 kcal deficit (Fat loss)
                  </span>
                </button>

                {/* 2. Maintain Weight */}
                <button
                  type="button"
                  onClick={() => applyGoalType('maintain')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    calorieGoalType === 'maintain'
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Minus className="w-3 h-3" />
                    <span className="text-[11px] font-extrabold block">Maintain</span>
                  </div>
                  <span className="text-xs font-black font-mono block mt-0.5">
                    {calculatedMaintenance} <span className="text-[8px] font-normal">kcal</span>
                  </span>
                  <span className={`text-[8px] block mt-0.5 leading-tight ${calorieGoalType === 'maintain' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    0 kcal (Recomposition)
                  </span>
                </button>

                {/* 3. Gain Weight */}
                <button
                  type="button"
                  onClick={() => applyGoalType('gain')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    calorieGoalType === 'gain'
                      ? 'bg-blue-500 text-white border-blue-400 shadow-xs'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[11px] font-extrabold block">Gain Weight</span>
                  </div>
                  <span className="text-xs font-black font-mono block mt-0.5">
                    {Math.round(calculatedMaintenance + 350)} <span className="text-[8px] font-normal">kcal</span>
                  </span>
                  <span className={`text-[8px] block mt-0.5 leading-tight ${calorieGoalType === 'gain' ? 'text-blue-100' : 'text-slate-400'}`}>
                    +350 kcal (Lean bulk)
                  </span>
                </button>
              </div>
            </div>

            {/* AI Result or Coach Tip */}
            {aiResult && (
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 space-y-1 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Coach Lock Assessment
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">
                    🍗 ~{aiResult.proteinGrams}g protein/day
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 italic leading-relaxed">
                  "{aiResult.advice}"
                </p>
              </div>
            )}

            {/* Active Calorie Goal Input */}
            <div className="pt-1 flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-slate-300">
                Selected Daily Target:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  className="w-20 px-2 py-1 text-center text-xs font-black text-white bg-white/10 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
                <span className="text-xs font-extrabold text-orange-400">kcal</span>
              </div>
            </div>
          </div>

          {/* Section 3: AI Connection Settings */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              3. AI Engine Provider
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setProvider('local')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  provider === 'local'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold block">💻 RTX GPU (Local)</span>
                <span className={`text-[9px] block ${provider === 'local' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Llama 3.2 on Laptop
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  provider === 'groq'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold block">⚡ Groq Cloud</span>
                <span className={`text-[9px] block ${provider === 'groq' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Ultra-fast Cloud AI
                </span>
              </button>
            </div>

            {/* Local Server Config */}
            {provider === 'local' && (
              <div className="space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">
                  AI Server Endpoint
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={localEndpoint}
                    onChange={(e) => setLocalEndpoint(e.target.value)}
                    placeholder="http://145.19.247.3:8080"
                    className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingLocal}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0 flex items-center gap-1 active-press"
                  >
                    {testingLocal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ping'}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                    testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    <span className="text-[11px] truncate">{testResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Save Profile & Calorie Target</span>
          </button>
        </form>
      </div>
    </div>
  );
}
