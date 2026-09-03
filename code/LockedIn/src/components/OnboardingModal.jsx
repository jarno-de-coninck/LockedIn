import React, { useState, useMemo } from 'react';
import {
  Flame,
  Check,
  Calculator,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useLanguage } from '../services/i18n';

const SPORTS = [
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'weightlifting', name: 'Weightlifting', icon: '🏋️‍♂️' },
  { id: 'running', name: 'Running', icon: '🏃‍♂️' },
  { id: 'mma', name: 'MMA', icon: '🥊' },
  { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
];

export default function OnboardingModal({ isOpen, onComplete, onSkip }) {
  const { t } = useLanguage();

  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('180');
  const [weight, setWeight] = useState('78');
  const [age, setAge] = useState('22');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [calorieGoalType, setCalorieGoalType] = useState('maintain');
  const [sport, setSport] = useState('tennis');

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

  // Target calories based on goal
  const computedTarget = useMemo(() => {
    if (calorieGoalType === 'lose') return Math.round(calculatedMaintenance - 450);
    if (calorieGoalType === 'gain') return Math.round(calculatedMaintenance + 350);
    return calculatedMaintenance;
  }, [calculatedMaintenance, calorieGoalType]);

  // BMI
  const heightInMeters = Number(height) / 100;
  const bmiValue =
    heightInMeters > 0 && Number(weight) > 0
      ? (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1)
      : '24.1';

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const profile = {
      gender,
      height: Number(height) || 180,
      weight: Number(weight) || 78,
      age: Number(age) || 22,
      activityLevel,
      calorieGoalType,
      estimatedMaintenance: calculatedMaintenance,
      bmi: bmiValue,
      goalCalories: computedTarget,
    };

    onComplete(profile, computedTarget, sport);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 text-center space-y-1">
          <div className="flex justify-center mb-1">
            <BrandLogo size="md" showText={true} textDark={false} />
          </div>
          <h2 className="text-base font-black text-white">Athlete Biometric Registration</h2>
          <p className="text-xs text-slate-400 font-medium">
            Enter your real data so your calories and training are 100% accurate.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 1. Sport Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              1. Your Primary Sport
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {SPORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSport(s.id)}
                  className={`py-2 rounded-2xl border text-center transition-all ${
                    sport === s.id
                      ? 'bg-orange-500 text-white border-orange-400 shadow-md font-black'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base block">{s.icon}</span>
                  <span className="text-[9px] font-bold block mt-0.5 truncate">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Physical Biometrics */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              2. Physical Biometrics
            </label>

            {/* Gender */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-1.5 text-xs font-black rounded-xl capitalize transition-all ${
                    gender === g
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Height / Weight / Age */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Height</span>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-black rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">cm</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Weight</span>
                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-black rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">kg</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Age</span>
                <div className="relative">
                  <input
                    type="number"
                    min="12"
                    max="100"
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
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                Weekly Training Level
              </span>
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
                    <span className="block text-xs font-black">{item.label}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Goal Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                3. Your Calorie Target
              </span>
              <span className="text-[10px] font-black text-orange-400">
                TDEE: {calculatedMaintenance} kcal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setCalorieGoalType('lose')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  calorieGoalType === 'lose'
                    ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">Lose</span>
                </div>
                <span className="text-sm font-black font-mono block mt-1">
                  {Math.round(calculatedMaintenance - 450)} <span className="text-[10px]">kcal</span>
                </span>
                <span className="text-[9px] font-bold block text-slate-400 mt-0.5">-450 kcal</span>
              </button>

              <button
                type="button"
                onClick={() => setCalorieGoalType('maintain')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  calorieGoalType === 'maintain'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">Maintain</span>
                </div>
                <span className="text-sm font-black font-mono block mt-1">
                  {calculatedMaintenance} <span className="text-[10px]">kcal</span>
                </span>
                <span className="text-[9px] font-bold block text-slate-400 mt-0.5">0 kcal</span>
              </button>

              <button
                type="button"
                onClick={() => setCalorieGoalType('gain')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  calorieGoalType === 'gain'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-black">Gain</span>
                </div>
                <span className="text-sm font-black font-mono block mt-1">
                  {Math.round(calculatedMaintenance + 350)} <span className="text-[10px]">kcal</span>
                </span>
                <span className="text-[9px] font-bold block text-slate-400 mt-0.5">+350 kcal</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-slate-400">
              <span>Calculated BMI: <strong className="text-white">{bmiValue}</strong></span>
              <span>Daily Target: <strong className="text-orange-400">{computedTarget} kcal</strong></span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25"
          >
            <span>Lock In My Profile</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip for now (use 78kg • 2,000 kcal standard)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
