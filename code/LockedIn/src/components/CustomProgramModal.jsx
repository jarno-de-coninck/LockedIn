import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Edit3,
  Loader2,
  Check,
  Plus,
  Trash2,
  Trophy,
  Dumbbell,
  ArrowRight,
} from 'lucide-react';
import { generateWeeklyScheduleFromPrompt } from '../services/groq';

const INSPIRATION_PROMPTS = [
  '4-Day Upper / Lower Hypertrophy & Strength Split',
  '3-Day Push / Pull / Legs (PPL) with 1 day of Agility',
  '5-Day Athletic Performance with speed drills & lifting',
  '4-Day MMA Conditioning, Heavy Bag & Wrestling Stamina',
  '4-Day Runner Engine: Intervals, Tempo, Hill Sprints & Long Run',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CustomProgramModal({
  isOpen,
  onClose,
  trainingSchedule,
  setTrainingSchedule,
  activeSport = 'weightlifting',
}) {
  const [builderMode, setBuilderMode] = useState('prompt'); // 'prompt' | 'manual'
  const [daysPerWeek, setDaysPerWeek] = useState(trainingSchedule?.daysPerWeek || 4);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Manual Editor State
  const [manualTitle, setManualTitle] = useState(
    trainingSchedule?.programTitle || 'My Custom 7-Day Split'
  );
  const [manualDays, setManualDays] = useState(() => {
    if (trainingSchedule?.schedule && trainingSchedule.schedule.length === 7) {
      return JSON.parse(JSON.stringify(trainingSchedule.schedule));
    }
    return DAYS.map((d) => ({
      day: d,
      title: d === 'Sunday' ? 'Rest & Recovery' : `${d} Training Session`,
      type: d === 'Sunday' ? 'Rest' : 'Strength',
      duration: d === 'Sunday' ? '0m' : '45m',
      focus: d === 'Sunday' ? 'Recovery & Mobility' : 'Compound movements',
      exercises: d === 'Sunday' ? [] : [
        { name: 'Primary Lift', sets: '3 sets', reps: '10 reps', notes: 'RPE 8' },
        { name: 'Secondary Movement', sets: '3 sets', reps: '12 reps', notes: 'Form focus' },
      ],
    }));
  });

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleGenerateFromPrompt = async (preset = null) => {
    const textToUse = preset || promptText;
    if (!textToUse.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await generateWeeklyScheduleFromPrompt({
        promptText: textToUse,
        defaultSport: activeSport,
        daysPerWeek,
      });

      if (res && res.schedule) {
        setTrainingSchedule(res.schedule);
        showToast(`Generated ${daysPerWeek}-day split!`);
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      console.warn('Program generator error:', err);
      showToast('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManual = () => {
    const updated = {
      programTitle: manualTitle.trim() || 'Custom Split',
      sport: activeSport,
      goal: 'Customized Training',
      daysPerWeek: manualDays.filter((d) => d.type !== 'Rest').length,
      level: 'Intermediate',
      schedule: manualDays,
    };

    setTrainingSchedule(updated);
    showToast('Saved custom program!');
    setTimeout(() => onClose(), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Custom Split Builder</h3>
              <p className="text-[11px] text-slate-400 font-bold">Prompt AI or build manually</p>
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

        {/* Builder Mode Toggle */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setBuilderMode('prompt')}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                builderMode === 'prompt' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prompt AI</span>
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('manual')}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                builderMode === 'manual' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual Editor</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {builderMode === 'prompt' ? (
            <div className="space-y-4">
              {/* Workout Frequency Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                    Workout Frequency
                  </span>
                  <span className="text-[10px] font-black text-orange-300 bg-orange-500/20 px-2.5 py-0.5 rounded-md border border-orange-500/30">
                    {daysPerWeek} Training Days / Wk
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-2 rounded-xl border text-center transition-all ${
                        daysPerWeek === num
                          ? 'bg-orange-500 text-white border-orange-400 font-black shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white font-bold'
                      }`}
                    >
                      <span className="text-xs font-black block">{num}</span>
                      <span className="text-[9px] font-bold block uppercase opacity-75">Days</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Describe Your Split
                </label>
                <textarea
                  rows={3}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g., 4-day split with 2 heavy upper/lower lifting days + 2 agility & sprint sessions"
                  className="w-full p-3 text-xs rounded-2xl border border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateFromPrompt()}
                disabled={!promptText.trim() || isGenerating}
                className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/25"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'Architecting Split...' : 'Generate 7-Day Program'}</span>
              </button>

              {/* Suggestions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  1-Tap Inspiration
                </span>
                <div className="space-y-1.5">
                  {INSPIRATION_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGenerateFromPrompt(p)}
                      disabled={isGenerating}
                      className="w-full text-left p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all active-press flex items-center justify-between"
                    >
                      <span className="pr-2">{p}</span>
                      <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Program Title
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div className="space-y-2">
                {manualDays.map((d, dIdx) => (
                  <div key={d.day} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{d.day}</span>
                      <select
                        value={d.type}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualDays((prev) =>
                            prev.map((item, idx) =>
                              idx === dIdx ? { ...item, type: val, duration: val === 'Rest' ? '0m' : '45m' } : item
                            )
                          );
                        }}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-none"
                      >
                        <option value="Strength">Strength</option>
                        <option value="Agility">Agility</option>
                        <option value="Conditioning">Conditioning</option>
                        <option value="Rest">Rest</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={d.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualDays((prev) =>
                          prev.map((item, idx) => (idx === dIdx ? { ...item, title: val } : item))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white font-bold"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveManual}
                className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active-press transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Custom Program</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
