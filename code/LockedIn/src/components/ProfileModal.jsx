import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  getActiveProvider,
  getLocalAiEndpoint,
  getGroqApiKey,
  testLocalAiConnection,
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
  const [tempGoal, setTempGoal] = useState(goal);
  const [toastMsg, setToastMsg] = useState(false);

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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const parsedHeight = Number(height) || 180;
    const parsedWeight = Number(weight) || 78;
    const parsedGoal = Number(tempGoal) || 2000;

    const updatedProfile = {
      gender,
      height: parsedHeight,
      weight: parsedWeight,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85dvh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">Athlete Profile & Settings</h3>
              <p className="text-[10px] text-slate-400">Biometrics & AI Connection</p>
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
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* Biometrics */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Biometrics
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

            {/* Height / Weight / Goal */}
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
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Goal</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">kcal</span>
                </div>
              </div>
            </div>

            {/* Calculated BMI */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Calculated Body Mass Index (BMI):</span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {bmiValue}
              </span>
            </div>
          </div>

          {/* AI Engine Configuration */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              AI Engine Source
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
              <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">
                  AI Server Endpoint
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={localEndpoint}
                    onChange={(e) => setLocalEndpoint(e.target.value)}
                    placeholder="http://145.19.247.3:8080"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingLocal}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0 flex items-center gap-1 active-press"
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
            <span>Save Profile & Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
}
