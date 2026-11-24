export type GamePhase =
  | 'title'
  | 'intro_cutscene'
  | 'playing'
  | 'caught'
  | 'outro_cutscene'
  | 'act2_teaser'
  | 'act2_intro_cutscene'
  | 'act2_door_cutscene'
  | 'act2_outro_cutscene'
  | 'act3_secret'
  | 'act3_intro_cutscene'
  | 'act3_outro_cutscene'
  | 'victory'
  | 'paused'
  | 'gameover';

export type GameMode =
  | 'story_act1'
  | 'story_act2'
  | 'story_act3'
  | 'first_person'
  | 'hardcore_third_person'
  | 'fnaf_epta'
  | 'sniper_minigame';

export type ChaserId = 'roner' | 'sasha';

export type GameLanguage = 'ru' | 'en';

export type AchievementId =
  | 'act1_clear'
  | 'act2_clear'
  | 'act3_malinka'
  | 'fnaf_50'
  | 'fnaf_100'
  | 'mush_50'
  | 'mush_100'
  | 'mush_200'
  | 'sniper_100'
  | 'secret_malinka';

export interface AchievementDef {
  id: AchievementId;
  statKey?: 'totalMushrooms' | 'totalFnafMivinas' | 'totalClonesKilled';
  target?: number;
  secret?: boolean;
}

export interface AchievementProgressState {
  unlockedIds: AchievementId[];
  totalMushrooms: number;
  totalFnafMivinas: number;
  totalClonesKilled: number;
}

export interface GameSettings {
  language: GameLanguage;
  censorship: boolean;
  familyMode: boolean;
}

export interface CutsceneSubtitle {
  speaker: string;
  text: string;
  tone: 'nikita' | 'enemy';
}

export interface SpeechBubbleState {
  id: string;
  speaker: string;
  speakerId: ChaserId | 'nikita';
  text: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  isScream: boolean;
  scale: number;
}

export interface FloatingPickupText {
  id: number;
  text: string;
  screenX: number;
  screenY: number;
  isGold: boolean;
  alpha: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  settings: GameSettings;
  mushrooms: number;
  targetMushrooms: number | null;
  bestMushrooms: number;
  elapsedSeconds: number;
  stamina: number;
  battery: number;
  hasBatteryLimit: boolean;
  flashlightOn: boolean;
  flashlightStuns: number;
  nearestChaserDist: number;
  distanceToGate: number | null;
  ronerSpawned: boolean;
  sashaSpawned: boolean;
  killerName: string | null;
  killerId: ChaserId | null;
  activeMushroomsOnMap: number;
  speedBoostActive: boolean;
  eventBanner: string | null;
  cutsceneSubtitle: CutsceneSubtitle | null;
  // Act 2 / FNAF Epta Factory HUD state
  act2Stage: 'conveyor' | 'packaging' | 'corridor_key' | 'corridor';
  noodlesSeasoned: number;
  noodlesPacked: number;
  noodlesTarget: number;
  packetsInHand: number;
  boxesFound: number;
  mushroomStock: number;
  hasCorridorKey: boolean;
  corridorProgress: number;
  interactPrompt: string | null;
  isHidingInLocker: boolean;
  lightsFlickering: boolean;
  factoryAlarmActive: boolean;
  windowBreachProgress: number;
  // Act 3 Malinka Park survival HUD state
  act3Night: number;
  act3MaxNights: number;
  act3IsNight: boolean;
  act3DayProgress: number;
  act3PhaseSecondsLeft: number;
  act3FireFuel: number;
  act3LogsInHand: number;
  act3MetalInHand: number;
  act3CrusherMetal: number;
  act3BaseLevel: 1 | 2 | 3 | 4 | 5 | 6;
  act3NextUpgradeCost: number;
  act3BedCooldownNights: number;
  act3BossHp: number;
  act3BossMaxHp: number;
  act3RonerWaveAlive: number;
  act3HasSniper: boolean;
  act3Hp: number;
  act3MaxHp: number;
  // Minigame stats
  fnafMivinasTotal: number;
  fnafBatch: number;
  bestFnafMivinas: number;
  clonesKilled: number;
  sniperWave: number;
  sniperHp: number;
  sniperMaxHp: number;
  sniperCooldownRatio: number;
  bestSniperKills: number;
}
