export type GamePhase =
  | 'title'
  | 'intro_cutscene'
  | 'playing'
  | 'paused'
  | 'caught'
  | 'gameover'
  | 'outro_cutscene'
  | 'act2_teaser'
  | 'victory';

export type GameMode = 'story_act1' | 'first_person' | 'hardcore_third_person';

export type GameLanguage = 'ru' | 'en';

export interface GameSettings {
  language: GameLanguage;
  censorship: boolean;
  familyMode: boolean;
}

export type ChaserId = 'roner' | 'sasha';
export type SpeakerId = 'nikita' | ChaserId;

export interface SpeechBubbleState {
  id: string;
  speaker: string;
  speakerId: SpeakerId;
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

export interface CutsceneSubtitle {
  speaker: string;
  text: string;
  tone: 'nikita' | 'enemy';
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  settings: GameSettings;
  mushrooms: number;
  targetMushrooms: number | null;
  bestMushrooms: number;
  elapsedSeconds: number;
  stamina: number; // 0..100
  battery: number; // 0..100
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
}
