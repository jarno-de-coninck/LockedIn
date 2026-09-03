import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  TrendingUp,
  Flame,
  Dumbbell,
  Clock,
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  Trophy,
} from 'lucide-react';
import { askNutritionistCoach } from '../services/groq';

const SUGGESTED_QUESTIONS = [
  '🎾 Best pre-match tennis fuel and lateral agility drills?',
  '🥊 MMA conditioning protocol for 5-round stamina',
  '🏃‍♂️ How to increase running VO2 max with intervals?',
  '🏋️‍♂️ Optimal protein timing & volume for hypertrophy',
  '⚡ Fast 300 kcal high-protein recovery snack',
];

export default function AiCoachTab({
  goal,
  meals,
  workouts = [],
  activeSport = 'weightlifting',
  trainingGoal = 'Strength & Muscle',
}) {
  const totalConsumed = meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalBurned = workouts.reduce((acc, w) => acc + (Number(w.caloriesBurned) || 0), 0);
  const netCalories = totalConsumed - totalBurned;
  const remainingBudget = goal - netCalories;
  const isOver = netCalories > goal;

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'coach',
      text: `👋 Hey! I'm **Coach Lock**, your personal Athletic Performance Director & Sports Nutritionist.

Synced with your live stats:
• Sport Focus: **${activeSport.toUpperCase()}** (${trainingGoal})
• Food Consumed: **${totalConsumed} kcal** (${meals.length} meals)
• Exercise Burned: **${totalBurned} kcal** (${workouts.length} workouts)
• Net Balance: **${netCalories} kcal** (Remaining: **${remainingBudget} kcal**)

Ask me anything about sport drills, strength programming, endurance intervals, or macro fueling!`,
      time: 'Just now',
    },
  ]);

  const handleAsk = async (queryText = null) => {
    const q = (queryText || question).trim();
    if (!q || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await askNutritionistCoach({
        question: q,
        context: {
          goal,
          totalConsumed,
          totalBurned,
          remainingCalories: remainingBudget,
          meals,
          workouts,
          sport: activeSport,
          trainingGoal,
        },
      });

      const coachMessage = {
        id: Date.now() + 1,
        sender: 'coach',
        text: response.reply,
        isMock: response.isMock,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch (err) {
      console.error('AI Coach error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'coach',
          text: `⚠️ Based on your profile, keep focusing on progressive overload in your ${activeSport} training and hit 1.6-2.2g of protein per kg of bodyweight!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            const heading = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="font-extrabold text-slate-900 text-xs mt-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{heading}</span>
              </h4>
            );
          }

          if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatBoldAndItalics(bulletContent),
                  }}
                />
              </div>
            );
          }

          if (/^\d+\.\s/.test(trimmed)) {
            return (
              <div key={idx} className="ml-1 font-medium">
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatBoldAndItalics(trimmed),
                  }}
                />
              </div>
            );
          }

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{
                __html: formatBoldAndItalics(trimmed),
              }}
            />
          );
        })}
      </div>
    );
  };

  const formatBoldAndItalics = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-600">$1</em>');
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. Live Athletic & Nutrition HUD */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Coach Lock</h2>
              <p className="text-[11px] text-slate-500">
                Athletic Performance & Nutritionist
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synced</span>
          </div>
        </div>

        {/* 4 Mini Stats Grid */}
        <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <span className="text-[9px] font-medium text-slate-400 block uppercase">Sport</span>
            <span className="text-xs font-extrabold text-slate-800 capitalize truncate block">
              {activeSport}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-medium text-slate-400 block uppercase">Food</span>
            <span className="text-xs font-extrabold text-slate-800">{totalConsumed}</span>
          </div>
          <div>
            <span className="text-[9px] font-medium text-slate-400 block uppercase">Burned</span>
            <span className="text-xs font-extrabold text-emerald-600">-{totalBurned}</span>
          </div>
          <div>
            <span className="text-[9px] font-medium text-slate-400 block uppercase">Net Left</span>
            <span className={`text-xs font-extrabold ${isOver ? 'text-rose-600' : 'text-orange-600'}`}>
              {remainingBudget}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Suggested Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" /> Sport & Nutrition Prompts
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(q)}
              className="tap-target text-left py-1.5 px-3 rounded-xl bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-700 text-xs font-medium transition-all active-press flex items-center gap-1 shadow-2xs"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-orange-400 opacity-60 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Messages Thread */}
      <div className="space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-4 shadow-sm border transition-all ${
                  isUser
                    ? 'bg-orange-500 text-white border-orange-500 rounded-br-xs'
                    : 'bg-white text-slate-800 border-slate-200 rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">Coach Lock</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                )}

                {isUser ? (
                  <p className="text-xs font-semibold leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}

                {isUser && (
                  <span className="text-[10px] text-orange-200 block text-right mt-1">
                    {msg.time}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-start space-y-1">
            <div className="bg-white rounded-2xl rounded-bl-xs p-4 border border-slate-200 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              <span className="text-xs font-medium text-slate-500">
                Coach Lock is calculating athletic strategy...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Fixed Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="sticky bottom-16 pt-2 pb-1 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent"
      >
        <div className="relative flex items-center shadow-lg rounded-2xl bg-white border border-slate-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all p-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about tennis drills, MMA gas tank, running intervals..."
            className="w-full tap-target px-3.5 py-2.5 text-xs bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="tap-target w-9 h-9 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors active-press shadow-xs shrink-0 mr-0.5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
