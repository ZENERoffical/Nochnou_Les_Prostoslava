import React from 'react';
import { Globe, Settings, ShieldAlert, HeartHandshake, X } from 'lucide-react';
import { getUiText } from '../game/localization';
import { GameLanguage, GameSettings } from '../types/game';

interface SettingsModalProps {
  open: boolean;
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  settings,
  onChange,
  onClose,
}) => {
  if (!open) return null;

  const t = getUiText(settings.language);

  const setLang = (language: GameLanguage) => {
    onChange({ ...settings, language });
  };

  const toggleCensorship = () => {
    if (settings.familyMode) return;
    onChange({ ...settings, censorship: !settings.censorship });
  };

  const toggleFamilyMode = () => {
    const nextFamily = !settings.familyMode;
    onChange({
      ...settings,
      familyMode: nextFamily,
      censorship: nextFamily ? true : settings.censorship,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        } else {
          e.stopPropagation();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-emerald-400/45 bg-[#0a1319] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-lg font-black tracking-wide text-white">
            <Settings className="h-5 w-5 text-emerald-400" />
            <span>{t.settingsTitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {/* Language Switch */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              <Globe className="h-4 w-4" />
              <span>{t.langLabel}</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-all cursor-pointer ${
                  settings.language === 'ru'
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-white/10 bg-black/30 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t.langRu}
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition-all cursor-pointer ${
                  settings.language === 'en'
                    ? 'border-sky-400 bg-sky-500/25 text-sky-200'
                    : 'border-white/10 bg-black/30 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t.langEn}
              </button>
            </div>
          </div>

          {/* Censorship Toggle */}
          <button
            type="button"
            onClick={toggleCensorship}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all ${
              settings.familyMode ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'
            } ${
              settings.censorship || settings.familyMode
                ? 'border-amber-400/55 bg-amber-500/15'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-300 mt-0.5" />
              <div>
                <div className="text-sm font-black text-white">{t.censorLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.censorDesc}
                </div>
              </div>
            </div>
            <div
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                settings.censorship || settings.familyMode
                  ? 'bg-amber-400'
                  : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-slate-950 shadow transition-transform ${
                  settings.censorship || settings.familyMode
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Family Mode Toggle */}
          <button
            type="button"
            onClick={toggleFamilyMode}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer hover:bg-white/10 ${
              settings.familyMode
                ? 'border-emerald-400/60 bg-emerald-500/15'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <HeartHandshake className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
              <div>
                <div className="text-sm font-black text-white">{t.familyLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.familyDesc}
                </div>
              </div>
            </div>
            <div
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                settings.familyMode ? 'bg-emerald-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-slate-950 shadow transition-transform ${
                  settings.familyMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 transition-colors cursor-pointer"
        >
          {t.closeSettings}
        </button>
      </div>
    </div>
  );
};
