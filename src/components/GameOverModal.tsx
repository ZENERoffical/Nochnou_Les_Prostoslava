import React from 'react';
import {
  CheckCircle2,
  Crosshair,
  Eye,
  Factory,
  Flame,
  Home,
  Play,
  RotateCcw,
  Settings,
  Skull,
  Sparkles,
  Trees,
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
  onOpenSettings: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  onRestart,
  onResume,
  onExitToMenu,
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
            {hud.mode === 'fnaf_epta' ? (
              <>
                {t.fnafTotalLabel}:{' '}
                <span className="font-bold text-amber-300 tabular-nums">
                  {hud.fnafMivinasTotal}
                </span>
              </>
            ) : hud.mode === 'story_act3' ? (
              <>
                {t.act3NightLabel}:{' '}
                <span className="font-bold text-pink-300 tabular-nums">
                  {hud.act3Night}/{hud.act3MaxNights}
                </span>
              </>
            ) : hud.mode === 'story_act4' ? (
              <>
                {t.act4WaveLabel}:{' '}
                <span className="font-bold text-purple-300 tabular-nums">
                  {hud.act4Wave}/{hud.act4MaxWaves} · {hud.act4Kills} {t.statKills}
                </span>
              </>
            ) : hud.mode === 'sniper_minigame' ? (
              <>
                {t.sniperClonesLabel}:{' '}
                <span className="font-bold text-lime-300 tabular-nums">
                  {hud.clonesKilled}
                </span>
              </>
            ) : (
              <>
                {t.collectedLabel}{' '}
                <span className="font-bold text-amber-300 tabular-nums">
                  {hud.mushrooms}
                  {hud.targetMushrooms ? `/${hud.targetMushrooms}` : ''}
                </span>
              </>
            )}
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
    const isAct2Victory = hud.mode === 'story_act2';
    const isAct3Victory = hud.mode === 'story_act3';
    const isAct4Victory = hud.mode === 'story_act4';
    const act2Quote = getCutsceneLine('act2_outro_0', hud.settings).display;
    const act3Quote = getCutsceneLine('act3_outro_2', hud.settings).display;
    const act4Quote = getCutsceneLine('act4_outro_0', hud.settings).display;

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/78 p-4">
        <div className="w-full max-w-md rounded-2xl border-2 border-emerald-400 bg-[#0b1812] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-wider text-emerald-300">
            {isAct4Victory
              ? t.act4VictoryTitle
              : isAct3Victory
                ? t.act3VictoryTitle
                : isAct2Victory
                  ? t.act2VictoryTitle
                  : t.victoryTitle}
          </h2>
          <p className="mt-1 text-sm font-bold text-amber-200">
            {isAct4Victory
              ? t.act4VictorySub
              : isAct3Victory
                ? t.act3VictorySub
                : isAct2Victory
                  ? t.act2VictorySub
                  : t.victorySub}
          </p>

          <div className="mt-3 rounded-xl border border-emerald-400/35 bg-[#12261b] px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {isAct4Victory
                ? t.act4VictorySaid
                : isAct3Victory
                  ? t.act3VictorySaid
                  : isAct2Victory
                    ? t.act2VictorySaid
                    : t.victorySaidPrefix}
            </div>
            <div className="mt-1 text-base font-black text-white">
              «
              {isAct4Victory
                ? act4Quote
                : isAct3Victory
                  ? act3Quote
                  : isAct2Victory
                    ? act2Quote
                    : outroQuote}
              »
            </div>
          </div>

          {!isAct2Victory && !isAct3Victory && !isAct4Victory && (
            <div className="mt-4 rounded-xl border border-sky-400/45 bg-[#101924] p-4">
              <div className="flex items-center justify-center gap-2 text-sky-300 font-black text-lg">
                <Factory className="h-5 w-5" />
                {t.act2CardTitle}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {t.act2CardSub}
              </div>
              <button
                type="button"
                onClick={() => onRestart('story_act2')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 hover:bg-sky-300 active:scale-95 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                {t.act2EnterBtn}
              </button>
            </div>
          )}

          {isAct2Victory && (
            <div className="mt-4 rounded-xl border border-pink-400/45 bg-[#1b1020] p-4">
              <div className="flex items-center justify-center gap-2 text-pink-300 font-black text-lg">
                <Trees className="h-5 w-5" />
                {t.act3CardTitle}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {t.act3CardSub}
              </div>
              <button
                type="button"
                onClick={() => onRestart('story_act3')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-400 hover:bg-pink-300 active:scale-95 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                {t.act3EnterBtn}
              </button>
            </div>
          )}

          {isAct3Victory && (
            <div className="mt-4 rounded-xl border border-purple-400/45 bg-[#1a1026] p-4">
              <div className="flex items-center justify-center gap-2 text-purple-300 font-black text-lg">
                <Sparkles className="h-5 w-5" />
                {t.act4CardTitle}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {t.act4CardSub}
              </div>
              <button
                type="button"
                onClick={() => onRestart('story_act4')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-400 hover:bg-purple-300 active:scale-95 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                {t.act4EnterBtn}
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#0f1f17] p-3 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {isAct4Victory
                  ? t.statWave
                  : isAct3Victory
                    ? t.statNights
                    : isAct2Victory
                      ? t.statPacked
                      : t.statMushrooms}
              </div>
              <div className="text-lg font-black tabular-nums text-emerald-300">
                {isAct4Victory
                  ? `${hud.act4Wave}/${hud.act4MaxWaves}`
                  : isAct3Victory
                    ? `${hud.act3Night}/${hud.act3MaxNights}`
                    : isAct2Victory
                      ? `${hud.noodlesPacked}/20`
                      : hud.mushrooms}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {isAct4Victory
                  ? t.statKills
                  : isAct3Victory
                    ? t.statBaseLv
                    : isAct2Victory
                      ? t.statBoxes
                      : t.statTime}
              </div>
              <div className="text-lg font-black tabular-nums text-white">
                {isAct4Victory
                  ? hud.act4Kills
                  : isAct3Victory
                    ? `Lv.${hud.act3BaseLevel}`
                    : isAct2Victory
                      ? hud.boxesFound
                      : `${hud.elapsedSeconds}${hud.settings.language === 'en' ? 's' : 'с'}`}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">
                {isAct2Victory || isAct3Victory || isAct4Victory ? t.statTime : t.statScared}
              </div>
              <div className="text-lg font-black tabular-nums text-sky-300">
                {isAct2Victory || isAct3Victory || isAct4Victory
                  ? `${hud.elapsedSeconds}${hud.settings.language === 'en' ? 's' : 'с'}`
                  : hud.flashlightStuns}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() =>
                onRestart(
                  isAct4Victory
                    ? 'story_act4'
                    : isAct3Victory
                      ? 'story_act3'
                      : isAct2Victory
                        ? 'story_act2'
                        : 'story_act1'
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 px-6 py-3.5 text-base font-black text-slate-950 shadow-lg transition-all cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
              {isAct4Victory
                ? t.replayAct4
                : isAct3Victory
                  ? t.replayAct3
                  : isAct2Victory
                    ? t.replayAct2
                    : t.replayAct1}
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

  const isFnaf = hud.mode === 'fnaf_epta';
  const isSniper = hud.mode === 'sniper_minigame';
  const isAct3 = hud.mode === 'story_act3';
  const isAct4 = hud.mode === 'story_act4';

  const altMode: GameMode = isFnaf
    ? 'sniper_minigame'
    : isSniper
      ? 'fnaf_epta'
      : hud.mode === 'first_person'
        ? 'hardcore_third_person'
        : 'first_person';

  const modeLabelText =
    hud.mode === 'story_act1'
      ? t.modeStory
      : hud.mode === 'story_act2'
        ? t.modeStory2
        : isAct3
          ? t.modeStory3
          : isAct4
            ? t.modeStory4
            : isFnaf
              ? t.modeFnafTitle
              : isSniper
                ? t.modeSniperTitle
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
                {isAct4
                  ? t.statKills
                  : isAct3
                    ? t.statNights
                    : isFnaf
                      ? t.statMivinas
                      : isSniper
                        ? t.statClones
                        : t.statMushrooms}
              </div>
              <div className="text-lg font-black tabular-nums text-emerald-300">
                {isAct4
                  ? hud.act4Kills
                  : isAct3
                    ? `${hud.act3Night}/${hud.act3MaxNights}`
                    : isFnaf
                      ? hud.fnafMivinasTotal
                      : isSniper
                        ? hud.clonesKilled
                        : hud.mushrooms}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-0.5">
                <Trophy className="h-3 w-3 text-amber-400" /> {t.statBest}
              </div>
              <div className="text-lg font-black tabular-nums text-amber-300">
                {isFnaf
                  ? hud.bestFnafMivinas
                  : isSniper
                    ? hud.bestSniperKills
                    : hud.bestMushrooms}
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
                {isAct4
                  ? t.statWave
                  : isAct3
                    ? t.statBaseLv
                    : isSniper
                      ? t.sniperWaveLabel
                      : t.statScared}
              </div>
              <div className="text-lg font-black tabular-nums text-sky-300">
                {isAct4
                  ? `${hud.act4Wave}/${hud.act4MaxWaves}`
                  : isAct3
                    ? `Lv.${hud.act3BaseLevel}`
                    : isSniper
                      ? `#${hud.sniperWave}`
                      : hud.flashlightStuns}
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
            ) : altMode === 'sniper_minigame' ? (
              <>
                <Crosshair className="h-4 w-4 text-lime-300" />
                {t.modeSniperTitle}
              </>
            ) : altMode === 'fnaf_epta' ? (
              <>
                <Factory className="h-4 w-4 text-orange-300" />
                {t.modeFnafTitle}
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
