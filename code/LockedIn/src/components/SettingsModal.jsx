import React, { useState } from 'react';
import {
  X,
  Check,
  Bot,
  Sparkles,
  Server,
  Key,
  Globe,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getGroqApiKey } from '../services/groq';
import { useLanguage, LANGUAGES } from '../services/i18n';

export default function SettingsModal({ isOpen, onClose }) {
  const { language, setLanguage, t } = useLanguage();
  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem('lockedin_custom_groq_key') || ''
  );
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState(null);
  const [toastMsg, setToastMsg] = useState(false);

  if (!isOpen) return null;

  const currentGroqKey = apiKeyInput.trim() || getGroqApiKey();
  const isKeyActive = Boolean(currentGroqKey);

  const handleTestConnection = async () => {
    setTestingGroq(true);
    setGroqTestResult(null);

    const key = apiKeyInput.trim() || getGroqApiKey();
    if (!key) {
      setGroqTestResult({
        success: false,
        message: 'No Groq API key entered. Running in offline rule-based mode.',
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
          message: 'Connected to Groq Cloud (openai/gpt-oss-20b)',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setGroqTestResult({
          success: false,
          message: err.error?.message || 'Invalid API key or network error',
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

  const handleSave = (e) => {
    e?.preventDefault();
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-slide-up">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-base font-black text-white">
                App & AI Settings
              </h3>
              <p className="text-xs text-slate-400 font-medium">Configure AI connection and language</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>AI Engine Connection</span>
              </span>
              {!isKeyActive && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-500/15 text-amber-300 border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Offline (No Key)
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Groq API Key (Optional & 100% Free)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full min-h-[48px] px-3.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingGroq}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors active-press disabled:opacity-50"
                >
                  {testingGroq ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Server className="w-4 h-4 text-orange-400" />
                  )}
                  <span>Test Connection</span>
                </button>
                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput('');
                      localStorage.removeItem('lockedin_custom_groq_key');
                      setGroqTestResult(null);
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-bold"
                  >
                    Clear Key
                  </button>
                )}
              </div>

              {groqTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium animate-slide-up ${
                    groqTestResult.success
                      ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-200 border-rose-500/40'
                  }`}
                >
                  {groqTestResult.message}
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                A Groq API key enables live intelligence with the openai/gpt-oss-20b model. Without a key, LockedIn operates completely offline using built-in athletic splits and meal algorithms.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>Language Selection</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => {
                const isSelected = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    className={`min-h-[50px] p-3 rounded-xl border text-left transition-all active-press flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 font-semibold'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{l.flag}</span>
                      <span className="text-xs sm:text-sm">{l.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-bold active-press transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[48px] px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-orange-500/25 active-press transition-colors"
          >
            {toastMsg ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Close</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
