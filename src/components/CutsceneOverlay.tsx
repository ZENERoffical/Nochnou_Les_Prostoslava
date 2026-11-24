import React from 'react';
import { FastForward, Home } from 'lucide-react';
import { getUiText } from '../game/localization';
import { CutsceneSubtitle, GameLanguage, GameMode } from '../types/game';

interface CutsceneOverlayProps {
  subtitle: CutsceneSubtitle | null;
  language: GameLanguage;
  mode?: GameMode;
  isSecretAct2?: boolean;
  onSkip: () => void;
  onExitToMenu: () => void;
}

export const CutsceneOverlay: React.FC<CutsceneOverlayProps> = ({
  subtitle,
  language,
  mode = 'story_act1',
  isSecretAct2 = false,
  onSkip,
  onExitToMenu,
}) => {
  const t = getUiText(language);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between">
      {/* Top cinematic bar */}
      <div className="flex items-center justify-between bg-black/90 px-5 py-3 border-b border-white/10">
        <div className="text-xs font-black uppercase tracking-widest text-amber-300">
          {isSecretAct2
            ? t.cutsceneSecret
            : mode === 'story_act2'
              ? t.cutsceneAct2
              : t.cutsceneAct1}
        </div>
        <div className="flex items-center gap-2">
          {!isSecretAct2 && (
            <button
              type="button"
              onClick={onSkip}
              className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-extrabold text-white transition-colors cursor-pointer"
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
            className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-extrabold text-amber-200 transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{isSecretAct2 ? t.menuBtn : t.menuShort}</span>
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
            {isSecretAct2 ? t.secretHint : t.skipHint}
          </div>
        </div>
      </div>
    </div>
  );
};
