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
  '3-Day Push / Pull / Legs (PPL) with 1 day of Tennis Footwork',
  '5-Day Bodybuilding Split with Chest & Arms specialization',
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
  if (!isOpen) return null;

  const [builderMode, setBuilderMode] = useState('prompt'); // 'prompt' | 'manual'
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
      });

      if (res && res.schedule) {
        setTrainingSchedule(res.schedule);
        showToast('Generated 7-day program!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85dvh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">Custom Split Builder</h3>
              <p className="text-[10px] text-slate-400">Prompt AI or build manually</p>
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

        {/* Builder Mode Toggle */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setBuilderMode('prompt')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                builderMode === 'prompt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Prompt AI</span>
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('manual')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                builderMode === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual Editor</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {builderMode === 'prompt' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Describe Your Split
                </label>
                <textarea
                  rows={3}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g., 4-day split with 2 heavy upper/lower lifting days + 2 agility & sprint sessions"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateFromPrompt()}
                disabled={!promptText.trim() || isGenerating}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGenerating ? 'Architecting Split...' : 'Generate 7-Day Program'}</span>
              </button>

              {/* Suggestions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  1-Tap Inspiration
                </span>
                <div className="space-y-1">
                  {INSPIRATION_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGenerateFromPrompt(p)}
                      disabled={isGenerating}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200/60 text-slate-700 text-xs font-medium transition-all active-press flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{p}</span>
                      <ArrowRight className="w-3 h-3 text-orange-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Program Name
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Day List */}
              <div className="space-y-2">
                {manualDays.map((d, dIdx) => (
                  <div key={d.day} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">{d.day}</span>
                      <select
                        value={d.type}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualDays((prev) =>
                            prev.map((item, idx) =>
                              idx === dIdx ? { ...item, type: val } : item
                            )
                          );
                        }}
                        className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5"
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
                          prev.map((item, idx) =>
                            idx === dIdx ? { ...item, title: val } : item
                          )
                        );
                      }}
                      placeholder="Session Title"
                      className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveManual}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active-press transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Program Split</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
