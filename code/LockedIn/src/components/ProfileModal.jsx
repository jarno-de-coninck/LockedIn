import React, { useState, useMemo } from 'react';
import {
  User,
  X,
  Check,
  Activity,
  Flame,
  Scale,
  Ruler,
  TrendingDown,
  TrendingUp,
  Minus,
  Bot,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Heart,
  Dumbbell,
  Target,
  Loader2,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { estimateMaintenanceWithAi } from '../services/groq';
import { useLanguage } from '../services/i18n';

const CORE_SPORTS = [
  { id: 'weightlifting', label: 'Weightlifting', icon: '🏋️‍♂️' },
  { id: 'mma', label: 'MMA', icon: '🥊' },
  { id: 'cycling', label: 'Cycling', icon: '🚴‍♂️' },
  { id: 'other', label: 'Other Sport', icon: '✏️' },
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
  onOpenSettings,
  userProfile,
  setUserProfile,
  goal,
  setGoal,
  activeSport,
  setActiveSport,
  trainingGoal,
  setTrainingGoal,
}) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);

  const [gender, setGender] = useState(userProfile?.gender || 'male');
  const [height, setHeight] = useState(userProfile?.height || 180);
  const [weight, setWeight] = useState(userProfile?.weight || 78);
  const [age, setAge] = useState(userProfile?.age || 22);
  const [activityLevel, setActivityLevel] = useState(userProfile?.activityLevel || 'moderate');
  const [calorieGoalType, setCalorieGoalType] = useState(userProfile?.calorieGoalType || 'maintain');
  const [tempGoal, setTempGoal] = useState(goal);
  const [customSportInput, setCustomSportInput] = useState(
    ['weightlifting', 'mma', 'cycling'].includes((activeSport || '').toLowerCase())
      ? ''
      : activeSport || ''
  );
  const [toastMsg, setToastMsg] = useState(false);

  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

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

  const heightInMeters = Number(height) / 100;
  const bmiValue =
    heightInMeters > 0 && Number(weight) > 0
      ? (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1)
      : '24.1';

  if (!isOpen) return null;

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

    const effectiveSport =
      activeSport === 'other'
        ? customSportInput.trim() || 'Custom Training'
        : activeSport;
    if (effectiveSport) {
      setActiveSport(effectiveSport);
      try {
        localStorage.setItem('lockedin_active_sport', effectiveSport);
      } catch {}
    }

    setToastMsg(true);
    setTimeout(() => {
      setToastMsg(false);
      onClose();
    }, 500);
  };

  const steps = [
    { num: 1, title: 'Body Basics', desc: 'Height, weight, age' },
    { num: 2, title: 'Activity Level', desc: 'Daily exertion' },
    { num: 3, title: 'Calorie Target', desc: 'Goal & metabolism' },
    { num: 4, title: 'Sport & Style', desc: 'Your athletic focus' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-wizard-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-800 flex flex-col max-h-[92dvh] overflow-hidden animate-slide-up text-white">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="profile-wizard-title" className="text-base font-black text-white">
                Personal Athlete Profile
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Step {currentStep} of 4: {steps[currentStep - 1].title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup wizard"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-4 gap-1.5">
            {steps.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                aria-label={`Go to step ${s.num}: ${s.title}`}
                className={`py-2 px-1 rounded-xl text-center transition-all min-h-[44px] flex flex-col items-center justify-center active-press ${
                  currentStep === s.num
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20 border border-orange-400'
                    : currentStep > s.num
                    ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-600/40'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className="text-xs font-bold block">Step {s.num}</span>
                <span className="text-[10px] hidden sm:block opacity-80 truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs sm:text-sm">
                <p className="font-bold text-white">Your Body Metrics</p>
                <p className="text-orange-200/90 mt-0.5">Used to calculate your personal baseline metabolism and nutrition targets.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Biological Sex
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
                      className={`min-h-[48px] rounded-xl text-xs sm:text-sm font-bold border transition-all active-press capitalize ${
                        gender === g.id
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="240"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full min-h-[48px] px-3 text-sm font-bold rounded-xl border border-slate-700 bg-slate-950 text-white font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="35"
                    max="250"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full min-h-[48px] px-3 text-sm font-bold rounded-xl border border-slate-700 bg-slate-950 text-white font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full min-h-[48px] px-3 text-sm font-bold rounded-xl border border-slate-700 bg-slate-950 text-white font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Body Mass Index (BMI)</span>
                  <span className="text-lg font-black text-white font-mono">{bmiValue}</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  {Number(bmiValue) < 18.5 ? 'Underweight' : Number(bmiValue) < 25 ? 'Normal Range' : Number(bmiValue) < 30 ? 'Overweight' : 'High'}
                </span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs sm:text-sm">
                <p className="font-bold text-white">Weekly Activity Level</p>
                <p className="text-orange-200/90 mt-0.5">Estimates your total daily energy expenditure (TDEE).</p>
              </div>

              <div className="space-y-2">
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
                    className={`w-full min-h-[56px] p-3.5 rounded-xl border text-left transition-all active-press flex items-center justify-between ${
                      activityLevel === item.id
                        ? 'bg-orange-500/15 text-white border-orange-500/50 shadow-sm font-semibold'
                        : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold block">{item.label}</span>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">{item.desc}</span>
                    </div>
                    {activityLevel === item.id && (
                      <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs sm:text-sm">
                <p className="font-bold text-white">Daily Calorie Target</p>
                <p className="text-orange-200/90 mt-0.5">Your baseline maintenance is ~{calculatedMaintenance} kcal/day.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyGoalType('lose')}
                  className={`min-h-[84px] p-3.5 rounded-xl border text-left transition-all active-press ${
                    calorieGoalType === 'lose'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-bold">Lose Fat</span>
                  </div>
                  <span className="text-xl font-black font-mono block mt-1">
                    {Math.round(calculatedMaintenance - 450)} <span className="text-xs font-normal">kcal</span>
                  </span>
                  <span className="text-[11px] opacity-85 font-medium block mt-0.5">-450 kcal deficit</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoalType('maintain')}
                  className={`min-h-[84px] p-3.5 rounded-xl border text-left transition-all active-press ${
                    calorieGoalType === 'maintain'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Minus className="w-4 h-4" />
                    <span className="text-sm font-bold">Maintain</span>
                  </div>
                  <span className="text-xl font-black font-mono block mt-1">
                    {calculatedMaintenance} <span className="text-xs font-normal">kcal</span>
                  </span>
                  <span className="text-[11px] opacity-85 font-medium block mt-0.5">0 kcal balance</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyGoalType('gain')}
                  className={`min-h-[84px] p-3.5 rounded-xl border text-left transition-all active-press ${
                    calorieGoalType === 'gain'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-bold">Gain Muscle</span>
                  </div>
                  <span className="text-xl font-black font-mono block mt-1">
                    {Math.round(calculatedMaintenance + 350)} <span className="text-xs font-normal">kcal</span>
                  </span>
                  <span className="text-[11px] opacity-85 font-medium block mt-0.5">+350 kcal surplus</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">Custom Target Calories</span>
                  <button
                    type="button"
                    onClick={handleAiEstimate}
                    disabled={isAiEstimating}
                    className="min-h-[38px] px-3 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 active-press disabled:opacity-50 transition-colors"
                  >
                    {isAiEstimating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    <span>Ask Coach Lock AI</span>
                  </button>
                </div>
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  className="w-full min-h-[48px] px-3.5 text-lg font-bold font-mono rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />

                {aiResult && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/30 text-xs text-slate-200 space-y-1">
                    <p className="font-bold text-orange-400">Coach Lock Recommendation:</p>
                    <p>{aiResult.advice}</p>
                    {aiResult.recommendedProteinGrams && (
                      <p className="font-semibold text-emerald-400">Target Daily Protein: ~{aiResult.recommendedProteinGrams}g</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs sm:text-sm">
                <p className="font-bold text-white">Your Sport & Training Focus</p>
                <p className="text-orange-200/90 mt-0.5">Your workout recommendations will be personalized to this.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Primary Sport
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CORE_SPORTS.map((s) => {
                    const isSelected =
                      s.id === 'other'
                        ? !['weightlifting', 'mma', 'cycling'].includes((activeSport || '').toLowerCase())
                        : (activeSport || '').toLowerCase() === s.id;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (s.id === 'other') {
                            setActiveSport(customSportInput.trim() || 'other');
                          } else {
                            setActiveSport(s.id);
                          }
                        }}
                        className={`min-h-[50px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center active-press ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 font-bold'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 font-semibold'
                        }`}
                      >
                        <span className="text-lg block">{s.icon}</span>
                        <span className="text-xs mt-0.5 block truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {!['weightlifting', 'mma', 'cycling'].includes((activeSport || '').toLowerCase()) && (
                  <div className="pt-1 animate-slide-up">
                    <input
                      type="text"
                      value={customSportInput}
                      onChange={(e) => {
                        setCustomSportInput(e.target.value);
                        setActiveSport(e.target.value);
                      }}
                      placeholder="Type ANY sport (e.g. Swimming, Tennis, Football, Bouldering)..."
                      className="w-full min-h-[48px] px-3.5 text-sm font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Training Focus
                </label>
                <div className="space-y-2">
                  {TRAINING_GOALS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTrainingGoal(g.label)}
                      className={`w-full min-h-[52px] p-3 rounded-xl border text-left transition-all flex items-center justify-between active-press ${
                        trainingGoal === g.label
                          ? 'bg-orange-500/15 text-white border-orange-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold block">{g.label}</span>
                        <span className="text-xs text-slate-400 font-medium block mt-0.5">{g.desc}</span>
                      </div>
                      {trainingGoal === g.label && (
                        <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {onOpenSettings && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    <span>Need AI API keys or language settings?</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="text-orange-400 hover:text-orange-300 font-bold underline active-press shrink-0 ml-2"
                  >
                    Open Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 active-press transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="min-h-[48px] px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 active-press transition-colors shadow-md shadow-orange-500/25"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProfile}
                className="min-h-[48px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 active-press transition-colors shadow-md shadow-emerald-600/25"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{toastMsg ? 'Saved!' : 'Save Profile'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
