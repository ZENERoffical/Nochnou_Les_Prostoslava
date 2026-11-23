import React from 'react';
import {
  BookOpen,
  Eye,
  Flame,
  Lock,
  Play,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getUiText } from '../game/localization';
import { GameMode, GameSettings } from '../types/game';

interface TitleOverlayProps {
  mode: GameMode;
  settings: GameSettings;
  bestMushrooms: number;
  muted: boolean;
  onSelectMode: (mode: GameMode) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onStart: () => void;
  onOpenAct2Secret: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  mode,
  settings,
  bestMushrooms,
  muted,
  onSelectMode,
  onToggleMute,
  onOpenSettings,
  onStart,
  onOpenAct2Secret,
}) => {
  const t = getUiText(settings.language);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar: Settings + Bespoke Inline SVG Title Lockup + Mute Button */}
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t.settingsBtn}
          title={t.settingsBtn}
          className="pointer-events-auto flex h-11 items-center gap-1.5 rounded-xl border border-white/20 bg-[#0b141a]/92 px-3 text-xs font-extrabold text-white hover:bg-[#152430] transition-colors cursor-pointer"
        >
          <Settings className="h-4 w-4 text-emerald-300" />
          <span className="hidden sm:inline">{t.settingsBtn}</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <svg
            viewBox="0 0 640 124"
            className="w-[min(86vw,560px)] h-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]"
            role="img"
            aria-label={`${t.titleTop}: ${t.titleBottom}`}
          >
            <defs>
              <linearGradient id="titleGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="55%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <text
              x="320"
              y="46"
              textAnchor="middle"
              fill="#ecfdf5"
              stroke="#052e16"
              strokeWidth="8"
              paintOrder="stroke"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="36"
              letterSpacing="3"
            >
              {t.titleTop}
            </text>
            <text
              x="320"
              y="102"
              textAnchor="middle"
              fill="url(#titleGold)"
              stroke="#1e1b18"
              strokeWidth="10"
              paintOrder="stroke"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="54"
              letterSpacing="2"
            >
              {t.titleBottom}
            </text>
          </svg>
          <div className="mt-1 rounded-lg border border-emerald-400/30 bg-[#071117]/88 px-3.5 py-1 text-xs sm:text-sm font-extrabold tracking-wide text-emerald-200 shadow-lg">
            {t.titleSubtitle}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? t.unmuteLabel : t.muteLabel}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-[#0b141a]/92 text-white hover:bg-[#152430] transition-colors cursor-pointer"
        >
          {muted ? (
            <VolumeX className="h-5 w-5 text-rose-400" />
          ) : (
            <Volume2 className="h-5 w-5 text-emerald-300" />
          )}
        </button>
      </div>

      {/* Bottom Launch Panel (leaves center 3D scene completely unobstructed) */}
      <div className="mx-auto flex flex-col items-center gap-2.5 w-full max-w-2xl">
        <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-emerald-400/35 bg-[#0a1319]/94 p-4 shadow-2xl w-full">
          {/* Mode Switcher: Story Act 1 + Act 2 Teaser + Freeplay Modes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onSelectMode('story_act1')}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'story_act1'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-inner'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>{t.modeStory}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAct2Secret}
              title={t.modeAct2Tooltip}
              className="group flex flex-col items-center justify-center rounded-xl border border-amber-400/25 bg-black/40 hover:bg-amber-500/15 hover:border-amber-400/55 px-2.5 py-2 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-amber-200/90">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400 group-hover:hidden" />
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300 hidden group-hover:block" />
                <span>{t.modeAct2Title}</span>
              </span>
              <span className="text-[9px] font-extrabold text-amber-300/75">
                {t.modeAct2Sub}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('first_person')}
              className={`flex flex-col items-center justify-center rounded-xl border px-2.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'first_person'
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-inner'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 shrink-0" />
                <span>{t.modeFP}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-300/80">
                {t.endless}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('hardcore_third_person')}
              className={`flex flex-col items-center justify-center rounded-xl border px-2.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'hardcore_third_person'
                  ? 'border-rose-400 bg-rose-500/25 text-rose-200 shadow-inner'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <span>{t.modeHardcore}</span>
              </span>
              <span className="text-[10px] font-bold text-rose-300/80">
                {t.endless}
              </span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <img
                src="/assets/aistudio/image_690f5407.png"
                alt={t.mushroomName}
                className="h-14 w-14 rounded-xl border-2 border-amber-400 object-cover"
              />
              <img
                src="/assets/aistudio/image_c7a46977.png"
                alt="Characters"
                className="h-14 w-24 rounded-xl border border-white/20 object-cover"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-bold text-emerald-300">
                nikitys6666 · {t.record}:{' '}
                <span className="tabular-nums text-amber-300">{bestMushrooms}</span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                {mode === 'story_act1'
                  ? t.descStory
                  : mode === 'first_person'
                    ? t.descFP
                    : t.descHardcore}
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-black text-slate-950 shadow-lg transition-all cursor-pointer shrink-0 w-full sm:w-auto active:scale-95 ${
                mode === 'hardcore_third_person'
                  ? 'bg-rose-400 hover:bg-rose-300'
                  : mode === 'story_act1'
                    ? 'bg-amber-400 hover:bg-amber-300'
                    : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              <Play className="h-5 w-5 fill-current" />
              {t.playBtn}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[#0a1319]/90 border border-white/10 px-4 py-1 text-xs font-semibold text-slate-300">
          {t.controlsTitle}
        </div>
      </div>
    </div>
  );
};
