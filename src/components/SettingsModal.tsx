import React from 'react';
import {
  CloudFog,
  Crosshair,
  Flame,
  Globe,
  HeartHandshake,
  Monitor,
  Settings,
  ShieldAlert,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react';
import { getUiText } from '../game/localization';
import { GameLanguage, GameSettings, GraphicsQuality } from '../types/game';

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
  const [showPrequelNotice, setShowPrequelNotice] = React.useState(false);

  if (!open) return null;

  const t = getUiText(settings.language);

  const setLang = (language: GameLanguage) => {
    onChange({ ...settings, language });
  };

  const setGraphics = (graphicsQuality: GraphicsQuality) => {
    onChange({ ...settings, graphicsQuality });
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

  const toggleBool = (
    key: 'hardcoreMode' | 'voidMode' | 'mobileMode' | 'autoAim'
  ) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-3 sm:p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        } else {
          e.stopPropagation();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border-2 border-emerald-400/45 bg-[#0a1319] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
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

        <div className="mt-3.5 flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {/* Language Switch (RU / EN / PL) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              <Globe className="h-4 w-4" />
              <span>{t.langLabel}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`rounded-lg border px-2 py-2 text-xs font-black transition-all cursor-pointer ${
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
                className={`rounded-lg border px-2 py-2 text-xs font-black transition-all cursor-pointer ${
                  settings.language === 'en'
                    ? 'border-sky-400 bg-sky-500/25 text-sky-200'
                    : 'border-white/10 bg-black/30 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t.langEn}
              </button>
              <button
                type="button"
                onClick={() => setLang('pl')}
                className={`rounded-lg border px-2 py-2 text-xs font-black transition-all cursor-pointer ${
                  settings.language === 'pl'
                    ? 'border-rose-400 bg-rose-500/25 text-rose-200'
                    : 'border-white/10 bg-black/30 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t.langPl}
              </button>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-300">
              <Monitor className="h-4 w-4" />
              <span>{t.graphicsLabel}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setGraphics(q)}
                  className={`rounded-lg border px-2 py-2 text-xs font-black transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'border-sky-400 bg-sky-500/25 text-sky-200'
                      : 'border-white/10 bg-black/30 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {q === 'low'
                    ? t.graphicsLow
                    : q === 'medium'
                      ? t.graphicsMedium
                      : t.graphicsHigh}
                </button>
              ))}
            </div>
          </div>

          {/* Hardcore Mode Toggle */}
          <button
            type="button"
            onClick={() => toggleBool('hardcoreMode')}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer hover:bg-white/10 ${
              settings.hardcoreMode
                ? 'border-rose-500/75 bg-rose-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <Flame className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <div className="text-sm font-black text-white">{t.hardcoreLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.hardcoreDesc}
                </div>
              </div>
            </div>
            <div
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                settings.hardcoreMode ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-slate-950 shadow transition-transform ${
                  settings.hardcoreMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Void Mode Toggle */}
          <button
            type="button"
            onClick={() => toggleBool('voidMode')}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer hover:bg-white/10 ${
              settings.voidMode
                ? 'border-purple-400/70 bg-purple-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <CloudFog className="h-5 w-5 shrink-0 text-purple-300 mt-0.5" />
              <div>
                <div className="text-sm font-black text-white">{t.voidLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.voidDesc}
                </div>
              </div>
            </div>
            <div
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                settings.voidMode ? 'bg-purple-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-slate-950 shadow transition-transform ${
                  settings.voidMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Mobile Device Mode Toggle */}
          <button
            type="button"
            onClick={() => toggleBool('mobileMode')}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer hover:bg-white/10 ${
              settings.mobileMode
                ? 'border-cyan-400/70 bg-cyan-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 shrink-0 text-cyan-300 mt-0.5" />
              <div>
                <div className="text-sm font-black text-white">{t.mobileModeLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.mobileModeDesc}
                </div>
              </div>
            </div>
            <div
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                settings.mobileMode ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-slate-950 shadow transition-transform ${
                  settings.mobileMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Auto-Aim Toggle */}
          <button
            type="button"
            onClick={() => toggleBool('autoAim')}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer hover:bg-white/10 ${
              settings.autoAim
                ? 'border-lime-400/70 bg-lime-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <Crosshair className="h-5 w-5 shrink-0 text-lime-300 mt-0.5" />
              <div>
                <div className="text-sm font-black text-white">{t.autoAimLabel}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.autoAimDesc}
                </div>
              </div>
            </div>
            <div
              className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                settings.autoAim ? 'bg-lime-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-slate-950 shadow transition-transform ${
                  settings.autoAim ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Censorship Toggle */}
          <button
            type="button"
            onClick={toggleCensorship}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
              settings.familyMode
                ? 'opacity-80 cursor-not-allowed'
                : 'cursor-pointer hover:bg-white/10'
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
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer hover:bg-white/10 ${
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

          {/* Prequel Character Swap Teaser Button (???) */}
          <button
            type="button"
            onClick={() => setShowPrequelNotice((prev) => !prev)}
            className="flex flex-col gap-2 rounded-xl border border-fuchsia-400/45 bg-fuchsia-500/10 p-3 text-left transition-all cursor-pointer hover:bg-fuchsia-500/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <UserRound className="h-5 w-5 shrink-0 text-fuchsia-300 mt-0.5" />
                <div>
                  <div className="text-sm font-black tracking-wider text-fuchsia-200">
                    {t.prequelBtnTitle}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                    {t.prequelBtnDesc}
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded-md border border-fuchsia-400/50 bg-fuchsia-500/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-fuchsia-100">
                {t.prequelSoonBadge}
              </span>
            </div>
            {showPrequelNotice && (
              <div className="rounded-lg border border-fuchsia-400/35 bg-black/45 px-2.5 py-1.5 text-xs font-bold text-fuchsia-200">
                {t.prequelSoonNotice}
              </div>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 transition-colors cursor-pointer"
        >
          {t.closeSettings}
        </button>
      </div>
    </div>
  );
};

