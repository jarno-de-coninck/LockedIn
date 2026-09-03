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
} from 'lucide-react';
import {
  getActiveProvider,
  getLocalAiEndpoint,
  getGroqApiKey,
  testLocalAiConnection,
  estimateMaintenanceWithAi,
} from '../services/groq';
import { useLanguage, LANGUAGES } from '../services/i18n';

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
  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem('lockedin_custom_groq_key') || ''
  );
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState(null);

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

    const startTime = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        setGroqTestResult({
          success: true,
          message: `Connected to Groq Cloud (openai/gpt-oss-20b • ${latency}ms latency)`,
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setGroqTestResult({
          success: false,
          message: `Groq error (${res.status}): ${data.error?.message || 'Invalid API Key'}`,
        });
      }
    } catch (err) {
      setGroqTestResult({
        success: false,
        message: `Network error reaching Groq: ${err.message}`,
      });
    } finally {
      setTestingGroq(false);
    }
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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-800 flex flex-col max-h-[90dvh] overflow-hidden animate-slide-up text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">{t('athleteProfile')}</h3>
              <p className="text-[11px] text-slate-400 font-bold">Biometrics & AI Engine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section: Language Switcher */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>{t('languageLabel')}</span>
            </span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`py-2 px-1 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                    language === l.code
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span className="uppercase text-[11px]">{l.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Biometrics */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              1. {t('biometrics')}
            </span>

            {/* Gender */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 text-xs font-black rounded-xl capitalize transition-all ${
                    gender === g
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t(g)}
                </button>
              ))}
            </div>

            {/* Height / Weight / Age */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">{t('height')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-black rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">cm</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">{t('weight')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-black rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">kg</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">{t('age')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-black rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">yr</span>
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('activityLevel')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'sedentary', label: 'Desk Job', desc: 'Little to none' },
                  { id: 'light', label: 'Light', desc: '1-2 days' },
                  { id: 'moderate', label: 'Moderate', desc: '3-5 days' },
                  { id: 'heavy', label: 'Intense', desc: '6-7 days' },
                  { id: 'athlete', label: 'Athlete', desc: '2x per day' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      activityLevel === item.id
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-black'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-black leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Maintenance & Calorie Goal */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black text-white">
                  {t('maintenanceCalc')}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[10px] font-black text-orange-300">
                Mifflin-St Jeor
              </span>
            </div>

            {/* Estimated Maintenance Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">
                  {t('tdeeLabel')}
                </span>
                <span className="text-base font-black text-white font-mono">
                  {calculatedMaintenance} <span className="text-xs font-normal text-slate-400">kcal/day</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAiEstimate}
                disabled={isAiEstimating}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 active-press disabled:opacity-50 transition-colors shadow-md shadow-orange-500/20"
              >
                {isAiEstimating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
                <span>{t('askCoachTdee')}</span>
              </button>
            </div>

            {/* 3 Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* Lose */}
              <button
                type="button"
                onClick={() => applyGoalType('lose')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  calorieGoalType === 'lose'
                    ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">{t('loseWeight')}</span>
                </div>
                <span className="text-sm font-black font-mono block mt-1">
                  {Math.round(calculatedMaintenance - 450)} <span className="text-[10px]">kcal</span>
                </span>
                <span className="text-[10px] font-bold block text-slate-400 mt-0.5">-450 kcal</span>
              </button>

              {/* Maintain */}
              <button
                type="button"
                onClick={() => applyGoalType('maintain')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  calorieGoalType === 'maintain'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">{t('maintainWeight')}</span>
                </div>
                <span className="text-sm font-black font-mono block mt-1">
                  {calculatedMaintenance} <span className="text-[10px]">kcal</span>
                </span>
                <span className="text-[10px] font-bold block text-slate-400 mt-0.5">0 kcal</span>
              </button>

              {/* Gain */}
              <button
                type="button"
                onClick={() => applyGoalType('gain')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  calorieGoalType === 'gain'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">{t('gainWeight')}</span>
                </div>
                <span className="text-sm font-black font-mono block mt-1">
                  {Math.round(calculatedMaintenance + 350)} <span className="text-[10px]">kcal</span>
                </span>
                <span className="text-[10px] font-bold block text-slate-400 mt-0.5">+350 kcal</span>
              </button>
            </div>

            {/* AI Result or Coach Tip */}
            {aiResult && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> Coach Lock Assessment
                  </span>
                  <span className="text-[11px] font-black text-slate-200">
                    🍗 ~{aiResult.proteinGrams}g protein
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{aiResult.advice}"
                </p>
              </div>
            )}

            {/* Active Calorie Goal Input */}
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-black text-slate-300">
                {t('selectedGoal')}
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  className="w-24 px-2 py-1.5 text-center text-xs font-black text-white bg-slate-950 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500 font-mono"
                />
                <span className="text-xs font-black text-orange-400">kcal</span>
              </div>
            </div>
          </div>

          {/* Section 3: AI Intelligence Engine */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                3. {t('aiEngine')}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  groqTestResult?.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    groqTestResult?.success ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {groqTestResult?.success ? t('aiOnline') : t('aiOffline')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Coach Lock Neural Engine</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        gpt-oss-20b
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Groq Cloud LPU Inference</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestGroq}
                  disabled={testingGroq}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black flex items-center gap-1 active-press transition-colors shadow-md shadow-orange-500/20"
                >
                  {testingGroq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ping AI'}
                </button>
              </div>

              {groqTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${
                    groqTestResult.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                  }`}
                >
                  {groqTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  )}
                  <span className="leading-tight">{groqTestResult.message}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    {t('groqKeyLabel')}
                  </label>
                  {getGroqApiKey() && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Key Active
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={getGroqApiKey() ? "Pre-configured demo key active" : "Paste your gsk_... key here"}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('saveProfileBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
