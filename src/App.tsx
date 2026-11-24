import { useCallback, useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
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
    } else if (hud.mode === 'story_act3') {
      engineRef.current?.interactAct3Park();
    } else {
      engineRef.current?.interactFactory();
    }
  }, [hud.mode]);

  const isCutscene =
    hud.phase === 'intro_cutscene' ||
    hud.phase === 'outro_cutscene' ||
    hud.phase === 'act2_teaser' ||
    hud.phase === 'act2_intro_cutscene' ||
    hud.phase === 'act2_door_cutscene' ||
    hud.phase === 'act2_outro_cutscene' ||
    hud.phase === 'act3_secret' ||
    hud.phase === 'act3_intro_cutscene' ||
    hud.phase === 'act3_outro_cutscene';

  const activeToastId = toastQueue[0] ?? null;
  const activeToastInfo = activeToastId
    ? getAchievementText(activeToastId, hud.settings.language)
    : null;
  const uiText = getUiText(hud.settings.language);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#071018]">
      {/* Isolated WebGL canvas mount — never re-rendered by HUD state */}
      <div ref={mountRef} className="fixed inset-0 z-0" />

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
          <SpeechBubblesOverlay bubbles={bubbles} floatingTexts={floatingTexts} />
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

      {(hud.phase === 'playing' || hud.phase === 'caught' || hud.phase === 'paused') && (
        <>
          <SpeechBubblesOverlay bubbles={bubbles} floatingTexts={floatingTexts} />
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
    </main>
  );
}
