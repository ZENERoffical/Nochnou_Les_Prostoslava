import { useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, RotateCw, Trophy } from 'lucide-react';
import { AchievementsModal } from './components/AchievementsModal';
import { CutsceneOverlay } from './components/CutsceneOverlay';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { SpeechBubblesOverlay } from './components/SpeechBubblesOverlay';
import { TitleOverlay } from './components/TitleOverlay';
import { loadAchievements } from './game/achievements';
import { ForestGameEngine } from './game/ForestGameEngine';
import { getAchievementText, getUiText, loadSettings } from './game/localization';
import {
  AchievementId,
  AchievementProgressState,
  FloatingPickupText,
  GameMode,
  GameSettings,
  HudSnapshot,
  PvzPlantType,
  SpeechBubbleState,
} from './types/game';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  mode: 'story_act1',
  settings: loadSettings(),
  mushrooms: 0,
  targetMushrooms: 40,
  bestMushrooms: 0,
  elapsedSeconds: 0,
  hardcoreTimeLeft: null,
  stamina: 100,
  battery: 100,
  hasBatteryLimit: true,
  flashlightOn: true,
  flashlightStuns: 0,
  nearestChaserDist: 999,
  distanceToGate: null,
  ronerSpawned: false,
  sashaSpawned: false,
  killerName: null,
  killerId: null,
  activeMushroomsOnMap: 7,
  speedBoostActive: false,
  eventBanner: null,
  cutsceneSubtitle: null,
  act2Stage: 'conveyor',
  noodlesSeasoned: 0,
  noodlesPacked: 0,
  noodlesTarget: 20,
  packetsInHand: 0,
  boxesFound: 0,
  mushroomStock: 40,
  hasCorridorKey: false,
  corridorProgress: 0,
  interactPrompt: null,
  isHidingInLocker: false,
  lightsFlickering: false,
  factoryAlarmActive: false,
  windowBreachProgress: 0,
  fnafMivinasTotal: 0,
  fnafBatch: 1,
  bestFnafMivinas: 0,
  clonesKilled: 0,
  sniperWave: 1,
  sniperHp: 3,
  sniperMaxHp: 3,
  sniperCooldownRatio: 0,
  bestSniperKills: 0,
  act3Night: 1,
  act3MaxNights: 30,
  act3IsNight: false,
  act3DayProgress: 0,
  act3PhaseSecondsLeft: 60,
  act3FireFuel: 80,
  act3LogsInHand: 0,
  act3MetalInHand: 0,
  act3CrusherMetal: 0,
  act3BaseLevel: 1,
  act3NextUpgradeCost: 4,
  act3BedCooldownNights: 0,
  act3BossHp: 0,
  act3BossMaxHp: 14,
  act3RonerWaveAlive: 0,
  act3HasSniper: false,
  act3Hp: 3,
  act3MaxHp: 3,
  act3RiddleModalOpen: false,
  act4Stage: 'walk_to_house',
  act4Kills: 0,
  act4Wave: 1,
  act4MaxWaves: 7,
  act4WaveEnemiesLeft: 0,
  act4ActiveWeapon: 'pistol',
  act4UnlockedWeapons: ['pistol'],
  act4HasTurrets: false,
  act4BossHp: 0,
  act4BossMaxHp: 11488,
  act4Hp: 5,
  act4MaxHp: 5,
  parkourCheckpoint: 0,
  parkourTotalCheckpoints: 4,
  parkourProgress: 0,
  pvzEnergy: 150,
  pvzWave: 1,
  pvzMaxWaves: 4,
  pvzSelectedPlant: 'peashooter',
  pvzHoveredRow: null,
  pvzHoveredCol: null,
  pvzEnemiesRemaining: 0,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ForestGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [bubbles, setBubbles] = useState<SpeechBubbleState[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingPickupText[]>([]);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [achievements, setAchievements] = useState<AchievementProgressState>(
    () => loadAchievements()
  );
  const [toastQueue, setToastQueue] = useState<AchievementId[]>([]);
  const [riddleInput, setRiddleInput] = useState('');
  const [riddleError, setRiddleError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new ForestGameEngine(container, {
      onHudUpdate: (nextHud) => setHud(nextHud),
      onBubblesUpdate: (nextBubbles) => setBubbles(nextBubbles),
      onFloatingTextsUpdate: (nextTexts) => setFloatingTexts(nextTexts),
      onAchievementsChange: (nextState, newlyUnlocked) => {
        setAchievements(nextState);
        if (newlyUnlocked.length > 0) {
          setToastQueue((prev) => [...prev, ...newlyUnlocked]);
        }
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const orientationBlocked = hud.settings.mobileMode && isPortrait;

  useEffect(() => {
    engineRef.current?.setOrientationBlocked(orientationBlocked);
  }, [orientationBlocked]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [hud.settings.mobileMode, hud.phase]);

  useEffect(() => {
    if (hud.act3RiddleModalOpen) {
      setRiddleInput('');
      setRiddleError(false);
    }
  }, [hud.act3RiddleModalOpen]);

  useEffect(() => {
    if (toastQueue.length === 0) return;
    const timer = window.setTimeout(() => {
      setToastQueue((prev) => prev.slice(1));
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [toastQueue]);

  const handleSelectMode = useCallback((mode: GameMode) => {
    engineRef.current?.setMode(mode);
  }, []);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    engineRef.current?.setSettings(next);
  }, []);

  const handleStart = useCallback((mode?: GameMode) => {
    engineRef.current?.startGame(mode);
  }, []);

  const handleSkipCutscene = useCallback(() => {
    engineRef.current?.skipCutscene();
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleExitToMenu = useCallback(() => {
    engineRef.current?.returnToMenu();
  }, []);

  const handleToggleFlashlight = useCallback(() => {
    engineRef.current?.toggleFlashlight();
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleVirtualMove = useCallback((dx: number, dz: number) => {
    engineRef.current?.setVirtualMove(dx, dz);
  }, []);

  const handleVirtualJump = useCallback(() => {
    engineRef.current?.triggerJump();
  }, []);

  const handleVirtualSprint = useCallback((sprint: boolean) => {
    engineRef.current?.setVirtualSprint(sprint);
  }, []);

  const handleInteract = useCallback(() => {
    if (hud.mode === 'sniper_minigame') {
      engineRef.current?.fireSniperShot();
    } else if (hud.mode === 'story_act3' || hud.mode === 'act3_survival') {
      engineRef.current?.interactAct3Park();
    } else if (hud.mode === 'story_act4') {
      engineRef.current?.interactAct4Village();
    } else if (hud.mode === 'plants_vs_roners') {
      engineRef.current?.interactPvz();
    } else {
      engineRef.current?.interactFactory();
    }
  }, [hud.mode]);

  const handleSelectAct4Weapon = useCallback(
    (weapon: HudSnapshot['act4ActiveWeapon']) => {
      engineRef.current?.selectAct4Weapon(weapon);
    },
    []
  );

  const handleUnlockAct4Turrets = useCallback(() => {
    engineRef.current?.unlockAct4Turrets();
  }, []);

  const handleSelectPvzPlant = useCallback((kind: PvzPlantType) => {
    engineRef.current?.selectPvzPlant(kind);
  }, []);

  const handleSubmitRiddle = useCallback(() => {
    const ok = engineRef.current?.submitAct3Riddle(riddleInput);
    if (ok) {
      setRiddleError(false);
    } else {
      setRiddleError(true);
    }
  }, [riddleInput]);

  const handleCloseRiddle = useCallback(() => {
    engineRef.current?.closeAct3Riddle();
  }, []);

  const isCutscene =
    hud.phase === 'intro_cutscene' ||
    hud.phase === 'outro_cutscene' ||
    hud.phase === 'act2_teaser' ||
    hud.phase === 'act2_intro_cutscene' ||
    hud.phase === 'act2_door_cutscene' ||
    hud.phase === 'act2_outro_cutscene' ||
    hud.phase === 'act3_secret' ||
    hud.phase === 'act3_intro_cutscene' ||
    hud.phase === 'act3_outro_cutscene' ||
    hud.phase === 'act4_intro_cutscene' ||
    hud.phase === 'act4_outro_cutscene';

  const isGameplayView =
    hud.phase === 'playing' || hud.phase === 'caught' || hud.phase === 'paused';

  const activeToastId = toastQueue[0] ?? null;
  const activeToastInfo = activeToastId
    ? getAchievementText(activeToastId, hud.settings.language)
    : null;
  const uiText = getUiText(hud.settings.language);

  const mountClass =
    hud.settings.mobileMode && isGameplayView
      ? 'fixed inset-x-2 sm:inset-x-10 top-1.5 bottom-28 z-0 rounded-xl overflow-hidden border border-emerald-400/25 shadow-inner'
      : hud.settings.mobileMode
        ? 'fixed inset-2 z-0 rounded-xl overflow-hidden border border-white/10'
        : 'fixed inset-0 z-0';

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#071018]">
      {/* Isolated WebGL canvas mount — shrinks cleanly in Mobile Device Mode so buttons fit */}
      <div ref={mountRef} className={mountClass} />

      {/* Achievement Unlock Notification Banner */}
      {activeToastInfo && (
        <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-[#0b1812]/96 px-4 py-2.5 shadow-2xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/50 bg-amber-500/20 text-amber-300 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              {uiText.achievementUnlockedLabel}
            </div>
            <div className="text-sm font-black text-white leading-tight">
              {activeToastInfo.title}
            </div>
          </div>
        </div>
      )}

      {hud.phase === 'title' && (
        <TitleOverlay
          mode={hud.mode}
          settings={hud.settings}
          bestMushrooms={hud.bestMushrooms}
          bestFnafMivinas={hud.bestFnafMivinas}
          bestSniperKills={hud.bestSniperKills}
          unlockedAchievements={achievements.unlockedIds.length}
          muted={muted}
          onSelectMode={handleSelectMode}
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAchievements={() => setAchievementsOpen(true)}
          onStart={() => handleStart(hud.mode)}
        />
      )}

      {isCutscene && (
        <>
          <SpeechBubblesOverlay
            bubbles={bubbles}
            floatingTexts={floatingTexts}
            frameClassName={mountClass}
          />
          <CutsceneOverlay
            subtitle={hud.cutsceneSubtitle}
            language={hud.settings.language}
            mode={hud.mode}
            isSecretAct2={hud.phase === 'act2_teaser'}
            isSecretAct3={hud.phase === 'act3_secret'}
            onSkip={handleSkipCutscene}
            onExitToMenu={handleExitToMenu}
          />
        </>
      )}

      {isGameplayView && (
        <>
          <SpeechBubblesOverlay
            bubbles={bubbles}
            floatingTexts={floatingTexts}
            frameClassName={mountClass}
          />
          <GameHud
            hud={hud}
            muted={muted}
            onToggleMute={handleToggleMute}
            onToggleFlashlight={handleToggleFlashlight}
            onPause={handleTogglePause}
            onExitToMenu={handleExitToMenu}
            onVirtualMove={handleVirtualMove}
            onVirtualJump={handleVirtualJump}
            onVirtualSprint={handleVirtualSprint}
            onInteract={handleInteract}
            onSelectAct4Weapon={handleSelectAct4Weapon}
            onUnlockAct4Turrets={handleUnlockAct4Turrets}
            onSelectPvzPlant={handleSelectPvzPlant}
          />
        </>
      )}

      <GameOverModal
        hud={hud}
        onRestart={handleStart}
        onResume={handleTogglePause}
        onExitToMenu={handleExitToMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        open={settingsOpen}
        settings={hud.settings}
        onChange={handleSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />

      <AchievementsModal
        open={achievementsOpen}
        language={hud.settings.language}
        state={achievements}
        onClose={() => setAchievementsOpen(false)}
      />

      {/* Act 3 Corner Riddle Modal (P + P = 28) */}
      {hud.act3RiddleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              handleCloseRiddle();
            } else if (e.key === 'Enter') {
              e.stopPropagation();
              handleSubmitRiddle();
            } else {
              e.stopPropagation();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border-2 border-amber-400/75 bg-[#0a1319] p-5 text-center shadow-2xl">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-300">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-amber-300">
              {uiText.act3RiddleTitle}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-200">
              {uiText.act3RiddlePrompt}
            </p>
            <input
              type="text"
              autoFocus
              value={riddleInput}
              onChange={(e) => {
                setRiddleInput(e.target.value);
                setRiddleError(false);
              }}
              placeholder={uiText.act3RiddlePlaceholder}
              className="mt-3 w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-center text-base font-black text-white focus:border-amber-400 focus:outline-none"
            />
            {riddleError && (
              <div className="mt-2 text-xs font-bold text-rose-400">
                {uiText.act3RiddleWrong}
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCloseRiddle}
                className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 py-2.5 text-xs font-extrabold text-slate-200 cursor-pointer"
              >
                {uiText.act3RiddleCancel}
              </button>
              <button
                type="button"
                onClick={handleSubmitRiddle}
                className="rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
              >
                {uiText.act3RiddleSubmit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Device Mode Portrait Orientation Lock */}
      {orientationBlocked && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#060c11]/98 p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-400/60 bg-cyan-500/20 text-cyan-300 animate-pulse">
            <RotateCw className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black tracking-wide text-cyan-300">
            {uiText.portraitBlockTitle}
          </h2>
          <p className="mt-2 max-w-xs text-sm font-medium text-slate-300">
            {uiText.portraitBlockDesc}
          </p>
        </div>
      )}
    </main>
  );
}

