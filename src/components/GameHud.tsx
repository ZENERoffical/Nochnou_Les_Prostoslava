import React, { useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Factory,
  Flashlight,
  Heart,
  Home,
  KeyRound,
  Pause,
  Shield,
  Trees,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { getUiText } from '../game/localization';
import { Act4WeaponId, HudSnapshot } from '../types/game';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onToggleFlashlight: () => void;
  onPause: () => void;
  onExitToMenu: () => void;
  onVirtualMove: (dx: number, dz: number) => void;
  onVirtualJump: () => void;
  onVirtualSprint: (sprint: boolean) => void;
  onInteract: () => void;
  onSelectAct4Weapon: (weapon: Act4WeaponId) => void;
  onUnlockAct4Turrets: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  onToggleMute,
  onToggleFlashlight,
  onPause,
  onExitToMenu,
  onVirtualMove,
  onVirtualJump,
  onVirtualSprint,
  onInteract,
  onSelectAct4Weapon,
  onUnlockAct4Turrets,
}) => {
  const [hintsOpen, setHintsOpen] = useState(true);
  const t = getUiText(hud.settings.language);
  const isDanger =
    hud.nearestChaserDist < 11.5 &&
    (hud.ronerSpawned ||
      hud.sashaSpawned ||
      hud.mode === 'sniper_minigame' ||
      hud.mode === 'story_act4');
  const isAct2 = hud.mode === 'story_act2';
  const isAct3 = hud.mode === 'story_act3';
  const isAct4 = hud.mode === 'story_act4';
  const isFnaf = hud.mode === 'fnaf_epta';
  const isFactoryMode = isAct2 || isFnaf;
  const isSniper = hud.mode === 'sniper_minigame';
  const showSniperCrosshair =
    isSniper ||
    (isAct3 && hud.act3HasSniper) ||
    (isAct4 && hud.act4Stage === 'battle');
  const isFP =
    hud.mode === 'first_person' ||
    hud.mode === 'story_act1' ||
    isFactoryMode ||
    isSniper ||
    isAct3 ||
    isAct4;
  const storyGoalMet =
    hud.targetMushrooms !== null && hud.mushrooms >= hud.targetMushrooms;

  const act4WeaponSlots: Array<{ id: Act4WeaponId; keyNum: number; req: number }> = [
    { id: 'pistol', keyNum: 1, req: 0 },
    { id: 'uzi', keyNum: 2, req: 10 },
    { id: 'ak47', keyNum: 3, req: 20 },
    { id: 'sniper', keyNum: 4, req: 30 },
    { id: 'rpg', keyNum: 5, req: 40 },
    { id: 'flamethrower', keyNum: 6, req: 50 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5">
      {/* Subtle First-Person Aim Reticle / Sniper Crosshair + Interact Prompt */}
      {isFP && hud.phase === 'playing' && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          {showSniperCrosshair ? (
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-lime-400/85" />
              <div className="absolute h-1.5 w-1.5 rounded-full bg-lime-300" />
              {hud.sniperCooldownRatio > 0.02 && (
                <div className="absolute -bottom-3 h-1 w-10 overflow-hidden rounded-full bg-black/75">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${Math.round((1 - hud.sniperCooldownRatio) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className={`h-2.5 w-2.5 rounded-full border ${
                hud.interactPrompt
                  ? 'border-amber-300 bg-amber-400 scale-125'
                  : hud.flashlightOn
                    ? 'border-amber-200/80 bg-amber-300/60'
                    : 'border-white/40 bg-white/25'
              }`}
            />
          )}
          {(isFactoryMode || isAct3 || isAct4) && hud.interactPrompt && (
            <div className="mt-4 whitespace-nowrap rounded-lg border border-amber-400/70 bg-[#0a1319]/92 px-3.5 py-1.5 text-xs sm:text-sm font-black text-amber-200 shadow-xl">
              {hud.interactPrompt}
            </div>
          )}
        </div>
      )}

      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Factory Board / Sniper Board / Mushroom Counter */}
        {isFactoryMode ? (
          <div
            className={`flex flex-col gap-1.5 rounded-xl border bg-[#0a1319]/92 px-3.5 py-2.5 shadow-lg max-w-md ${
              isFnaf ? 'border-orange-400/45' : 'border-sky-400/40'
            }`}
          >
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
              <Factory
                className={`h-3.5 w-3.5 ${isFnaf ? 'text-orange-300' : 'text-sky-300'}`}
              />
              <span className={isFnaf ? 'text-orange-200' : 'text-sky-200'}>
                {isFnaf ? t.fnafBadge : t.act2Badge}
              </span>
              <span className="text-slate-300/80 tabular-nums border-l border-white/15 pl-2">
                {formatTime(hud.elapsedSeconds)}
              </span>
              {isFnaf ? (
                <span className="ml-auto rounded border border-orange-400/50 bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-orange-200">
                  {t.fnafBatchLabel} #{hud.fnafBatch} · {t.fnafTotalLabel}: {hud.fnafMivinasTotal}
                </span>
              ) : (
                hud.hasCorridorKey && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded border border-amber-400/60 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                    <KeyRound className="h-3 w-3" />
                    {t.act2KeyBadge}
                  </span>
                )
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold tabular-nums">
              <span className="text-amber-300">
                {t.act2SeasonedLabel}: {hud.noodlesSeasoned}/{hud.noodlesTarget}
              </span>
              <span className="text-emerald-300">
                {t.act2PackedLabel}: {hud.noodlesPacked}/{hud.noodlesTarget}
              </span>
              <span className="text-orange-300">
                {t.act2PacketsLabel}: {hud.packetsInHand}
              </span>
              <span className="text-slate-300">
                {isFnaf
                  ? `${t.record}: ${hud.bestFnafMivinas}`
                  : `${t.act2MushroomsStock}: ${hud.mushroomStock}`}
              </span>
            </div>
            {isAct2 && hud.act2Stage === 'corridor' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 shrink-0">
                  {t.act2CorridorProgressLabel}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/60">
                  <div
                    className="h-full bg-emerald-400 transition-[width] duration-75"
                    style={{ width: `${hud.corridorProgress}%` }}
                  />
                </div>
                <span className="text-xs font-black tabular-nums text-emerald-200">
                  {hud.corridorProgress}%
                </span>
              </div>
            )}
            <div className="text-[11px] font-bold text-emerald-200/90">
              {isFnaf
                ? hud.act2Stage === 'packaging'
                  ? t.act2StagePackaging
                  : t.fnafStageLoop
                : hud.act2Stage === 'corridor'
                  ? t.act2StageCorridor
                  : hud.act2Stage === 'corridor_key'
                    ? t.act2StageCorridorKey
                    : hud.act2Stage === 'packaging'
                      ? t.act2StagePackaging
                      : t.act2StageConveyor}
            </div>
          </div>
        ) : isAct3 ? (
          <div className="flex flex-col gap-1.5 rounded-xl border border-pink-400/45 bg-[#0a1319]/92 px-3.5 py-2.5 shadow-lg max-w-md">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider">
              <Trees className="h-3.5 w-3.5 text-pink-300" />
              <span className="text-pink-200">{t.act3Badge}</span>
              <span className="text-slate-300/80 tabular-nums border-l border-white/15 pl-2">
                {formatTime(hud.elapsedSeconds)}
              </span>
              <span className="ml-auto flex items-center gap-1 rounded border border-amber-400/45 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-amber-200">
                {t.act3NightLabel} {hud.act3Night}/{hud.act3MaxNights} ·{' '}
                {hud.act3IsNight ? t.act3NightWord : t.act3DayWord}
                {hud.act3Night < hud.act3MaxNights && (
                  <span> · {formatTime(hud.act3PhaseSecondsLeft)}</span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="text-orange-300">{t.act3FireLabel}:</span>
                <div className="h-2 w-16 overflow-hidden rounded-full bg-black/70">
                  <div
                    className={`h-full transition-[width] duration-75 ${
                      hud.act3FireFuel > 35 ? 'bg-orange-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${hud.act3FireFuel}%` }}
                  />
                </div>
                <span className="text-orange-200">{hud.act3FireFuel}%</span>
              </div>

              <span className="text-amber-300">
                {t.act3LogsLabel}: {hud.act3LogsInHand}/3
              </span>
              <span className="text-sky-300">
                {t.act3MetalLabel}: {hud.act3MetalInHand}/3
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-extrabold tabular-nums">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-300">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  {t.act3BaseLevelLabel} {hud.act3BaseLevel}/6 ·{' '}
                  {hud.act3NextUpgradeCost > 0
                    ? `${hud.act3CrusherMetal}/${hud.act3NextUpgradeCost}`
                    : t.act3MaxedLabel}
                </span>
                {hud.act3BaseLevel >= 4 && hud.act3Night < hud.act3MaxNights && (
                  <span
                    className={
                      hud.act3BedCooldownNights > 0
                        ? 'text-rose-300'
                        : 'text-emerald-300'
                    }
                  >
                    ·{' '}
                    {hud.act3BedCooldownNights > 0
                      ? t.act3BedCooldownLabel
                      : `${t.act3BedReadyLabel} (-${
                          hud.act3BaseLevel >= 6 ? 3 : hud.act3BaseLevel === 5 ? 2 : 1
                        })`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: hud.act3MaxHp }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`h-3.5 w-3.5 ${
                      idx < hud.act3Hp
                        ? 'fill-rose-500 text-rose-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {hud.act3Night >= 30 && (
              <div className="mt-0.5 rounded-lg border border-rose-500/60 bg-rose-950/60 px-2.5 py-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-rose-200">
                  <span>{t.act3BossLabel}</span>
                  <span className="tabular-nums">
                    {hud.act3BossHp}/{hud.act3BossMaxHp} · {t.act3RonerWaveLabel}:{' '}
                    {hud.act3RonerWaveAlive}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/75">
                  <div
                    className="h-full bg-rose-500 transition-[width] duration-75"
                    style={{
                      width: `${Math.round(
                        (hud.act3BossHp / Math.max(1, hud.act3BossMaxHp)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] font-bold text-lime-300">
                  {t.act3Night30Objective}
                </div>
              </div>
            )}
          </div>
        ) : isAct4 ? (
          <div className="flex flex-col gap-1.5 rounded-xl border border-purple-400/45 bg-[#0a1319]/92 px-3.5 py-2.5 shadow-lg max-w-md">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider">
              <Crosshair className="h-3.5 w-3.5 text-purple-300" />
              <span className="text-purple-200">{t.act4Badge}</span>
              <span className="text-slate-300/80 tabular-nums border-l border-white/15 pl-2">
                {formatTime(hud.elapsedSeconds)}
              </span>
              <span className="ml-auto rounded border border-amber-400/45 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-amber-200">
                {t.act4WaveLabel} {hud.act4Wave}/{hud.act4MaxWaves}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold tabular-nums">
              <span className="text-emerald-300">
                {t.act4KillsLabel}: {hud.act4Kills}
              </span>
              <span className="text-orange-300">
                {t.act4EnemiesLeftLabel}: {hud.act4WaveEnemiesLeft}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: hud.act4MaxHp }).map((_, idx) => (
                  <Heart
                    key={idx}
                    className={`h-3.5 w-3.5 ${
                      idx < hud.act4Hp
                        ? 'fill-rose-500 text-rose-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {hud.act4Stage === 'walk_to_house' && (
              <div className="text-[11px] font-bold text-amber-200">
                {t.act4WalkHouseObjective}
              </div>
            )}

            {hud.act4Wave === 7 && hud.act4BossHp > 0 && (
              <div className="mt-0.5 rounded-lg border border-yellow-400/65 bg-purple-950/75 px-2.5 py-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-yellow-300">
                  <span>{t.act4Boss67Label}</span>
                  <span className="tabular-nums">
                    {hud.act4BossHp}/{hud.act4BossMaxHp} HP
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/75">
                  <div
                    className="h-full bg-yellow-400 transition-[width] duration-75"
                    style={{
                      width: `${Math.round(
                        (hud.act4BossHp / Math.max(1, hud.act4BossMaxHp)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : isSniper ? (
          <div className="flex flex-col gap-1.5 rounded-xl border border-lime-400/45 bg-[#0a1319]/92 px-3.5 py-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
              <Crosshair className="h-3.5 w-3.5 text-lime-300" />
              <span className="text-lime-200">{t.sniperBadge}</span>
              <span className="text-slate-300/80 tabular-nums border-l border-white/15 pl-2">
                {formatTime(hud.elapsedSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  {t.sniperClonesLabel}
                </div>
                <div className="text-2xl font-black tabular-nums text-white leading-none">
                  {hud.clonesKilled}
                </div>
              </div>
              <div className="border-l border-white/15 pl-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  {t.sniperWaveLabel}
                </div>
                <div className="text-xl font-black tabular-nums text-amber-300 leading-none">
                  #{hud.sniperWave}
                </div>
              </div>
              <div className="border-l border-white/15 pl-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  {t.record}
                </div>
                <div className="text-xl font-black tabular-nums text-lime-300 leading-none">
                  {hud.bestSniperKills}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold uppercase text-rose-300 mr-1">
                {t.sniperHpLabel}:
              </span>
              {Array.from({ length: hud.sniperMaxHp }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`h-4 w-4 ${
                    idx < hud.sniperHp
                      ? 'fill-rose-500 text-rose-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/35 bg-[#0a1319]/92 px-3.5 py-2.5 shadow-lg">
            <img
              src="/assets/aistudio/image_690f5407.png"
              alt={t.mushroomName}
              className="h-11 w-11 rounded-lg border border-amber-400/50 object-cover shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className="text-emerald-300/90">{t.mushroomName}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                    hud.mode === 'hardcore_third_person'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                      : hud.mode === 'story_act1'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-400/35'
                  }`}
                >
                  {hud.mode === 'hardcore_third_person'
                    ? t.badgeHardcore
                    : hud.mode === 'story_act1'
                      ? t.badgeStory
                      : t.badgeFP}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl font-black tabular-nums text-white leading-none">
                  {hud.mushrooms}
                  {hud.targetMushrooms !== null && (
                    <span className="text-sm font-bold text-amber-300">
                      /{hud.targetMushrooms}
                    </span>
                  )}
                </span>
                {hud.distanceToGate !== null ? (
                  <span
                    className={`flex items-center gap-1 text-xs font-extrabold tabular-nums ${
                      storyGoalMet ? 'text-emerald-300' : 'text-sky-300'
                    }`}
                  >
                    <Factory className="h-3.5 w-3.5" />
                    {t.factoryShort} {hud.distanceToGate}
                    {hud.settings.language === 'en' ? 'm' : 'м'}
                  </span>
                ) : (
                  <span className="text-xs font-semibold tabular-nums text-amber-300/90">
                    {t.record}: {hud.bestMushrooms}
                  </span>
                )}
                <span className="text-xs font-semibold tabular-nums text-slate-300/85 border-l border-white/15 pl-2">
                  {formatTime(hud.elapsedSeconds)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Center Event Banner */}
        {hud.eventBanner && (
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-amber-400/50 bg-[#131120]/94 px-4 py-2 text-sm font-extrabold text-amber-200 shadow-lg">
            <span>{hud.eventBanner}</span>
          </div>
        )}

        {/* Top-Right: Stamina + Battery (in Story), Flashlight Toggle, Mute & Pause */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-emerald-500/35 bg-[#0a1319]/92 px-3.5 py-2 shadow-lg min-w-[156px]">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1 text-emerald-300">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                {hud.speedBoostActive ? t.panther : t.stamina}
              </span>
              <span className="tabular-nums text-white">{hud.stamina}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/60">
              <div
                className={`h-full transition-[width] duration-75 ${
                  hud.speedBoostActive
                    ? 'bg-yellow-400'
                    : hud.stamina > 30
                      ? 'bg-emerald-400'
                      : 'bg-rose-500'
                }`}
                style={{ width: `${hud.stamina}%` }}
              />
            </div>

            {hud.hasBatteryLimit && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1 text-sky-300">
                    <BatteryCharging className="h-3.5 w-3.5 text-amber-300" />
                    {t.battery}
                  </span>
                  <span className="tabular-nums text-white">{hud.battery}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/60">
                  <div
                    className={`h-full transition-[width] duration-75 ${
                      hud.battery > 25 ? 'bg-sky-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${hud.battery}%` }}
                  />
                </div>
              </div>
            )}

            {isDanger && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-rose-400 tabular-nums">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {t.dangerNearby} {hud.nearestChaserDist}
                {hud.settings.language === 'en' ? 'm' : 'м'}
              </div>
            )}
          </div>

          {!isSniper && (
            <button
              type="button"
              onClick={onToggleFlashlight}
              aria-label="Flashlight"
              className={`pointer-events-auto flex h-11 px-3 items-center gap-1.5 rounded-xl border transition-colors cursor-pointer ${
                hud.flashlightOn
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                  : 'border-white/15 bg-[#0a1319]/92 text-slate-400 hover:bg-[#152430]'
              }`}
            >
              <Flashlight className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-extrabold">F</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t.unmuteLabel : t.muteLabel}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0a1319]/92 text-slate-100 hover:bg-[#152430] transition-colors cursor-pointer"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-rose-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-emerald-300" />
            )}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label={t.pauseTitle}
            title="Esc"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0a1319]/92 text-slate-100 hover:bg-[#152430] transition-colors cursor-pointer"
          >
            <Pause className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onExitToMenu}
            aria-label={t.menuBtn}
            title={t.menuBtn}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0a1319]/92 text-slate-100 hover:bg-[#152430] transition-colors cursor-pointer"
          >
            <Home className="h-5 w-5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Act 2 / FNAF Epta Closet Hiding Vignette & Warnings */}
      {isFactoryMode && hud.phase === 'playing' && hud.isHidingInLocker && (
        <div className="pointer-events-none fixed inset-0 z-10 border-x-[28px] sm:border-x-[56px] border-y-[18px] sm:border-y-[32px] border-[#05090e]/85" />
      )}

      {isFactoryMode && hud.phase === 'playing' && hud.factoryAlarmActive && (
        <div className="pointer-events-none fixed inset-0 z-10 border-[8px] border-red-600/65 bg-red-950/15" />
      )}

      {isFactoryMode &&
        hud.phase === 'playing' &&
        (hud.isHidingInLocker || hud.lightsFlickering || hud.factoryAlarmActive) && (
          <div className="pointer-events-none fixed top-28 sm:top-24 left-1/2 z-30 -translate-x-1/2 flex w-[92vw] max-w-lg flex-col items-center gap-2">
            {hud.factoryAlarmActive && (
              <div className="w-full rounded-xl border-2 border-red-500/85 bg-[#20090d]/94 px-4 py-2.5 shadow-2xl">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-red-200 text-center">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{t.act2AlarmWarning}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-300 shrink-0">
                    {t.act2WindowBreachLabel}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/70">
                    <div
                      className="h-full bg-red-500 transition-[width] duration-75"
                      style={{ width: `${hud.windowBreachProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-black tabular-nums text-red-200">
                    {hud.windowBreachProgress}%
                  </span>
                </div>
              </div>
            )}

            {hud.lightsFlickering && (
              <div className="w-full rounded-xl border-2 border-amber-400/80 bg-[#1e1506]/94 px-4 py-2 text-center shadow-xl">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{t.act2FlickerWarning}</span>
                </div>
              </div>
            )}

            {hud.isHidingInLocker && (
              <div className="rounded-lg border border-emerald-400/65 bg-[#091c15]/94 px-3.5 py-1.5 text-xs font-black tracking-wide text-emerald-200 shadow-lg">
                {t.act2HidingBadge}
              </div>
            )}
          </div>
        )}

      {/* Caught Dramatic Screen Vignette */}
      {hud.phase === 'caught' && (
        <div className="pointer-events-none fixed inset-0 border-[10px] border-red-600/80 bg-red-900/20" />
      )}

      {/* Bottom Controls Dock & Mobile Touch Controls */}
      <div className="flex items-end justify-between gap-3">
        <div className="pointer-events-auto flex sm:hidden items-center gap-1.5 bg-[#0a1319]/90 p-2 rounded-2xl border border-white/15">
          <div className="grid grid-cols-3 gap-1 w-28 h-28">
            <div />
            <button
              type="button"
              onPointerDown={() => onVirtualMove(0, -1)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="rounded-lg bg-white/10 active:bg-emerald-500/40 font-black text-white"
            >
              ▲
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => onVirtualMove(-1, 0)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="rounded-lg bg-white/10 active:bg-emerald-500/40 font-black text-white"
            >
              ◀
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => onVirtualMove(1, 0)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="rounded-lg bg-white/10 active:bg-emerald-500/40 font-black text-white"
            >
              ▶
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => onVirtualMove(0, 1)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="rounded-lg bg-white/10 active:bg-emerald-500/40 font-black text-white"
            >
              ▼
            </button>
            <div />
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-center mx-auto gap-1.5">
          {isAct4 && hud.act4Stage === 'battle' && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-purple-400/40 bg-[#0a1319]/94 p-1.5 shadow-xl">
              {act4WeaponSlots.map((slot) => {
                const unlocked =
                  hud.act4UnlockedWeapons.includes(slot.id) || hud.act4Kills >= slot.req;
                const active = hud.act4ActiveWeapon === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSelectAct4Weapon(slot.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-amber-300 bg-amber-400 text-slate-950 shadow'
                        : unlocked
                          ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                          : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <span className="mr-1 opacity-75">[{slot.keyNum}]</span>
                    {t.act4Weapons[slot.id]}
                    {!unlocked && slot.req > 0 && (
                      <span className="ml-1 text-[10px] text-amber-300/80">
                        ({slot.req})
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onUnlockAct4Turrets}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  hud.act4HasTurrets
                    ? 'border-cyan-300 bg-cyan-500/30 text-cyan-100'
                    : hud.act4Kills >= 100
                      ? 'border-yellow-300 bg-yellow-400 text-slate-950 animate-pulse'
                      : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                {hud.act4HasTurrets
                  ? t.act4TurretsActive
                  : hud.act4Kills >= 100
                    ? t.act4TurretsUnlockBtn
                    : t.act4TurretsLocked}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setHintsOpen((v) => !v)}
            className="pointer-events-auto mb-0.5 flex items-center gap-1 rounded-t-lg border border-b-0 border-white/15 bg-[#0a1319]/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            {hintsOpen ? (
              <>
                <ChevronDown className="h-3 w-3" /> {t.hideControls}
              </>
            ) : (
              <>
                <ChevronUp className="h-3 w-3" /> {t.showControls}
              </>
            )}
          </button>
          {hintsOpen && (
            <div className="rounded-xl border border-white/15 bg-[#0a1319]/92 px-4 py-1.5 text-xs font-medium text-slate-200 shadow-lg">
              {isAct4
                ? t.controlsHudAct4
                : isAct3
                  ? t.controlsHudAct3
                  : isFactoryMode
                    ? t.controlsHudAct2
                    : isSniper
                      ? t.controlsHudSniper
                      : t.controlsHud}
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex sm:hidden flex-col gap-2">
          {(isFactoryMode || isSniper || isAct3 || isAct4) && (
            <button
              type="button"
              onPointerDown={onInteract}
              className={`rounded-xl border px-4 py-2.5 text-xs font-black ${
                showSniperCrosshair
                  ? 'border-lime-300/65 bg-lime-500/35 text-lime-100'
                  : 'border-orange-300/55 bg-orange-500/35 text-orange-100'
              }`}
            >
              {showSniperCrosshair ? t.sniperTouchFire : t.act2TouchInteract}
            </button>
          )}
          {!isSniper && (
            <button
              type="button"
              onPointerDown={onToggleFlashlight}
              className="rounded-xl border border-amber-300/45 bg-amber-500/25 px-4 py-2.5 text-xs font-black text-amber-100"
            >
              {t.touchLight}
            </button>
          )}
          <button
            type="button"
            onPointerDown={() => onVirtualSprint(true)}
            onPointerUp={() => onVirtualSprint(false)}
            onPointerLeave={() => onVirtualSprint(false)}
            className="rounded-xl border border-sky-400/40 bg-sky-500/25 px-4 py-2.5 text-xs font-black text-sky-100 active:bg-sky-500/50"
          >
            {t.touchSprint}
          </button>
          <button
            type="button"
            onPointerDown={onVirtualJump}
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/25 px-4 py-2.5 text-xs font-black text-emerald-100 active:bg-emerald-500/50"
          >
            {t.touchJump}
          </button>
        </div>
      </div>
    </div>
  );
};
