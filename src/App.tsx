import { useCallback, useEffect, useRef, useState } from 'react';
import { CutsceneOverlay } from './components/CutsceneOverlay';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { SpeechBubblesOverlay } from './components/SpeechBubblesOverlay';
import { TitleOverlay } from './components/TitleOverlay';
import { ForestGameEngine } from './game/ForestGameEngine';
import { loadSettings } from './game/localization';
import {
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
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ForestGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [bubbles, setBubbles] = useState<SpeechBubbleState[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingPickupText[]>([]);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new ForestGameEngine(container, {
      onHudUpdate: (nextHud) => setHud(nextHud),
      onBubblesUpdate: (nextBubbles) => setBubbles(nextBubbles),
      onFloatingTextsUpdate: (nextTexts) => setFloatingTexts(nextTexts),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

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

  const handleOpenAct2Secret = useCallback(() => {
    engineRef.current?.startAct2SecretPreview();
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
    engineRef.current?.interactFactory();
  }, []);

  const isCutscene =
    hud.phase === 'intro_cutscene' ||
    hud.phase === 'outro_cutscene' ||
    hud.phase === 'act2_teaser' ||
    hud.phase === 'act2_intro_cutscene' ||
    hud.phase === 'act2_door_cutscene' ||
    hud.phase === 'act2_outro_cutscene';

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#071018]">
      {/* Isolated WebGL canvas mount — never re-rendered by HUD state */}
      <div ref={mountRef} className="fixed inset-0 z-0" />

      {hud.phase === 'title' && (
        <TitleOverlay
          mode={hud.mode}
          settings={hud.settings}
          bestMushrooms={hud.bestMushrooms}
          muted={muted}
          onSelectMode={handleSelectMode}
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setSettingsOpen(true)}
          onStart={() => handleStart(hud.mode)}
          onOpenAct2Secret={handleOpenAct2Secret}
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
        onOpenAct2Secret={handleOpenAct2Secret}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        open={settingsOpen}
        settings={hud.settings}
        onChange={handleSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
