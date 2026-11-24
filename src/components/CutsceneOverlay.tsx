import React from 'react';
import { FastForward, Home } from 'lucide-react';
import { getUiText } from '../game/localization';
import { CutsceneSubtitle, GameLanguage, GameMode } from '../types/game';

interface CutsceneOverlayProps {
  subtitle: CutsceneSubtitle | null;
  language: GameLanguage;
  mode?: GameMode;
  isSecretAct2?: boolean;
  isSecretAct3?: boolean;
  onSkip: () => void;
  onExitToMenu: () => void;
}

export const CutsceneOverlay: React.FC<CutsceneOverlayProps> = ({
  subtitle,
  language,
  mode = 'story_act1',
  isSecretAct2 = false,
  isSecretAct3 = false,
  onSkip,
  onExitToMenu,
}) => {
  const t = getUiText(language);
  const isAnySecret = isSecretAct2 || isSecretAct3;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between">
      {/* Top cinematic bar */}
      <div className="flex items-center justify-between bg-black/90 px-5 py-3 border-b border-white/10">
        <div className="text-xs font-black uppercase tracking-widest text-amber-300">
          {isSecretAct3
            ? t.cutsceneAct3Secret
            : isSecretAct2
              ? t.cutsceneSecret
              : mode === 'story_act4'
                ? t.cutsceneAct4
                : mode === 'story_act3'
                  ? t.cutsceneAct3
                  : mode === 'story_act2'
                    ? t.cutsceneAct2
                    : t.cutsceneAct1}
        </div>
        <div className="flex items-center gap-2">
          {!isAnySecret && (
            <button
              type="button"
              onClick={onSkip}
              className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-extrabold text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{t.skipBtn}</span>
              <FastForward className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onExitToMenu}
            aria-label={t.menuBtn}
            title={t.menuBtn}
            className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-extrabold text-amber-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{isAnySecret ? t.menuBtn : t.menuShort}</span>
          </button>
        </div>
      </div>

      {/* Bottom dialogue bar */}
      <div className="bg-black/92 px-5 py-5 border-t border-white/10">
        <div className="mx-auto max-w-2xl text-center">
          {subtitle ? (
            <>
              <div
                className={`text-xs font-black uppercase tracking-wider ${
                  subtitle.tone === 'nikita' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {subtitle.speaker}
              </div>
              <div className="mt-1 text-lg sm:text-xl font-black text-white leading-snug">
                «{subtitle.text}»
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">...</div>
          )}
          <div className="mt-2 text-[11px] font-medium text-slate-400">
            {isAnySecret ? t.secretHint : t.skipHint}
          </div>
        </div>
      </div>
    </div>
  );
};
