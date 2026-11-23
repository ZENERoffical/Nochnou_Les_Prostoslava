import React from 'react';
import {
  CheckCircle2,
  Eye,
  Flame,
  Home,
  Lock,
  Play,
  RotateCcw,
  Settings,
  Skull,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  getCaughtScreamLine,
  getCutsceneLine,
  getUiText,
} from '../game/localization';
import { GameMode, HudSnapshot } from '../types/game';

interface GameOverModalProps {
  hud: HudSnapshot;
  onRestart: (mode?: GameMode) => void;
  onResume: () => void;
  onExitToMenu: () => void;
  onOpenAct2Secret: () => void;
  onOpenSettings: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  onRestart,
  onResume,
  onExitToMenu,
  onOpenAct2Secret,
  onOpenSettings,
}) => {
  const t = getUiText(hud.settings.language);
  const outroQuote = getCutsceneLine('outro_0', hud.settings).display;
  const screamQuote = getCaughtScreamLine(hud.settings).display;

  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/68 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-400/35 bg-[#0a1319] p-6 text-center shadow-2xl">
          <h2 className="text-2xl font-black tracking-wide text-white">
            {t.pauseTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {t.collectedLabel}{' '}
            <span className="font-bold text-amber-300 tabular-nums">
              {hud.mushrooms}
              {hud.targetMushrooms ? `/${hud.targetMushrooms}` : ''}
            </span>
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 font-black text-slate-950 transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              {t.resumeBtn}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-5 py-3 font-bold text-white transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4 text-emerald-300" />
              {t.settingsBtn}
            </button>
            <button
              type="button"
              onClick={() => onRestart()}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-5 py-3 font-bold text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              {t.restartBtn}
            </button>
            <button
              type="button"
              onClick={onExitToMenu}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 hover:bg-amber-500/25 px-5 py-3 font-bold text-amber-200 transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4" />
              {t.menuBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'victory') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/78 p-4">
        <div className="w-full max-w-md rounded-2xl border-2 border-emerald-400 bg-[#0b1812] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-wider text-emerald-300">
            {t.victoryTitle}
          </h2>
          <p className="mt-1 text-sm font-bold text-amber-200">
            {t.victorySub}
          </p>

          <div className="mt-3 rounded-xl border border-emerald-400/35 bg-[#12261b] px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {t.victorySaidPrefix}
            </div>
            <div className="mt-1 text-base font-black text-white">
              «{outroQuote}»
            </div>
          </div>

          {/* Act 2 Teaser Card */}
          <div className="mt-4 rounded-xl border border-amber-400/45 bg-[#1b1710] p-4">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-lg">
              <Lock className="h-5 w-5" />
              {t.act2CardTitle}
            </div>
            <div className="mt-1 text-xs text-slate-300">
              {t.act2CardSub}
            </div>
            <button
              type="button"
              onClick={onOpenAct2Secret}
              className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/20 hover:bg-amber-500/30 px-3.5 py-1.5 text-xs font-black text-amber-200 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.act2SecretBtn}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#0f1f17] p-3 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {t.statMushrooms}
              </div>
              <div className="text-lg font-black tabular-nums text-emerald-300">
                {hud.mushrooms}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {t.statTime}
              </div>
              <div className="text-lg font-black tabular-nums text-white">
                {hud.elapsedSeconds}
                {hud.settings.language === 'en' ? 's' : 'с'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {t.statScared}
              </div>
              <div className="text-lg font-black tabular-nums text-sky-300">
                {hud.flashlightStuns}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onRestart('story_act1')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 px-6 py-3.5 text-base font-black text-slate-950 shadow-lg transition-all cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
              {t.replayAct1}
            </button>
            <button
              type="button"
              onClick={() => onRestart('hardcore_third_person')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 hover:bg-rose-500/30 px-5 py-2.5 text-xs font-extrabold text-rose-200 transition-colors cursor-pointer"
            >
              <Flame className="h-4 w-4 text-rose-400" />
              {t.hardcoreEndlessBtn}
            </button>
            <button
              type="button"
              onClick={onExitToMenu}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-5 py-2.5 text-xs font-extrabold text-slate-200 transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4 text-amber-300" />
              {t.menuBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase !== 'gameover') return null;

  const altMode: GameMode =
    hud.mode === 'first_person' ? 'hardcore_third_person' : 'first_person';

  const modeLabelText =
    hud.mode === 'story_act1'
      ? t.modeStory
      : hud.mode === 'hardcore_third_person'
        ? t.hardcoreEndlessBtn
        : t.fpEndlessBtn;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/78 p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-red-500/75 bg-[#120d12] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/25 border border-red-500/50 text-red-400">
          <Skull className="h-8 w-8" />
        </div>

        <h2 className="text-3xl font-black tracking-wider text-red-500">
          {t.gameOverTitle}
        </h2>
        <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          {t.modeLabel} {modeLabelText}
        </div>

        <div className="mt-3 rounded-xl border border-yellow-400/45 bg-red-950/60 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-yellow-300">
            {hud.killerName ?? 'RONER_552'}{' '}
            {hud.settings.familyMode
              ? t.caughtFamilySuffix
              : t.caughtNormalSuffix}
          </div>
          <div className="mt-1 text-lg sm:text-xl font-black text-white">
            «{screamQuote}»
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#1a1520] p-3 text-left">
          <img
            src="/assets/aistudio/image_690f5407.png"
            alt={t.mushroomName}
            className="h-14 w-14 rounded-lg border border-amber-400/40 object-cover shrink-0"
          />
          <div className="grid grid-cols-4 gap-1.5 flex-1 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {t.statMushrooms}
              </div>
              <div className="text-lg font-black tabular-nums text-emerald-300">
                {hud.mushrooms}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-0.5">
                <Trophy className="h-3 w-3 text-amber-400" /> {t.statBest}
              </div>
              <div className="text-lg font-black tabular-nums text-amber-300">
                {hud.bestMushrooms}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {t.statTime}
              </div>
              <div className="text-lg font-black tabular-nums text-white">
                {hud.elapsedSeconds}
                {hud.settings.language === 'en' ? 's' : 'с'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {t.statScared}
              </div>
              <div className="text-lg font-black tabular-nums text-sky-300">
                {hud.flashlightStuns}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onRestart(hud.mode)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-6 py-3.5 text-base font-black text-slate-950 shadow-lg transition-all cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" />
            {t.playAgainBtn}
          </button>
          <button
            type="button"
            onClick={() => onRestart(altMode)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-5 py-2.5 text-xs font-extrabold text-slate-200 transition-colors cursor-pointer"
          >
            {altMode === 'hardcore_third_person' ? (
              <>
                <Flame className="h-4 w-4 text-rose-400" />
                {t.hardcoreEndlessBtn}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-emerald-300" />
                {t.fpEndlessBtn}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onExitToMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 hover:bg-amber-500/25 px-5 py-2.5 text-xs font-extrabold text-amber-200 transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            {t.menuBtn}
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {t.restartHint}
        </div>
      </div>
    </div>
  );
};
