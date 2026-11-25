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
  | 'act4_intro_cutscene'
  | 'act4_outro_cutscene'
  | 'victory'
  | 'paused'
  | 'gameover';

export type GameMode =
  | 'story_act1'
  | 'story_act2'
  | 'story_act3'
  | 'story_act4'
  | 'first_person'
  | 'hardcore_third_person'
  | 'fnaf_epta'
  | 'sniper_minigame'
  | 'act3_survival'
  | 'parkour_minigame'
  | 'plants_vs_roners';

export type Act4WeaponId =
  | 'pistol'
  | 'uzi'
  | 'ak47'
  | 'sniper'
  | 'rpg'
  | 'flamethrower';

export type PvzPlantType =
  | 'sun'
  | 'peashooter'
  | 'repeater'
  | 'wallnut'
  | 'shovel';

export type ChaserId = 'roner' | 'sasha';

export type GameLanguage = 'ru' | 'en' | 'pl';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type StoryActMode = 'story_act1' | 'story_act2' | 'story_act3' | 'story_act4';

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
  | 'secret_malinka'
  | 'act4_shahediki'
  | 'act4_jojo'
  | 'act3_40_days'
  | 'act3_99_days'
  | 'parkour_clear'
  | 'pvz_gardener'
  | 'hardcore_all_acts';

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
  hardcoreActsCleared: StoryActMode[];
}

export interface GameSettings {
  language: GameLanguage;
  censorship: boolean;
  familyMode: boolean;
  hardcoreMode: boolean;
  voidMode: boolean;
  graphicsQuality: GraphicsQuality;
  mobileMode: boolean;
  autoAim: boolean;
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

export type HeroPartOwner = 'nikita' | 'roner' | 'sasha';

export interface CharacterCustomization {
  head: HeroPartOwner;
  hat: HeroPartOwner | 'none';
  torso: HeroPartOwner;
  wings: HeroPartOwner;
  legs: HeroPartOwner;
}

export interface PartyMember {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  alive: boolean;
  customization: CharacterCustomization;
  x?: number;
  y?: number;
  z?: number;
  yaw?: number;
  speedNorm?: number;
  isAirborne?: boolean;
  isDead?: boolean;
  flashlightOn?: boolean;
  activeWeapon?: Act4WeaponId;
}

export interface PartyRoomState {
  code: string;
  hostId: string;
  mode: GameMode;
  hardcoreMode: boolean;
  voidMode: boolean;
  status: 'lobby' | 'playing';
  seed: number;
  members: PartyMember[];
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  settings: GameSettings;
  mushrooms: number;
  targetMushrooms: number | null;
  bestMushrooms: number;
  elapsedSeconds: number;
  hardcoreTimeLeft: number | null;
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
  act3MaxNights: number | null;
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
  act3RiddleModalOpen: boolean;
  // Act 4 JoJo Village defense HUD state
  act4Stage: 'walk_to_house' | 'battle';
  act4Kills: number;
  act4Wave: number;
  act4MaxWaves: number;
  act4WaveEnemiesLeft: number;
  act4ActiveWeapon: Act4WeaponId;
  act4UnlockedWeapons: Act4WeaponId[];
  act4HasTurrets: boolean;
  act4BossHp: number;
  act4BossMaxHp: number;
  act4Hp: number;
  act4MaxHp: number;
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
  // Parkour minigame HUD state
  parkourCheckpoint: number;
  parkourTotalCheckpoints: number;
  parkourProgress: number;
  // Plants vs Roner's HUD state
  pvzEnergy: number;
  pvzWave: number;
  pvzMaxWaves: number;
  pvzSelectedPlant: PvzPlantType;
  pvzHoveredRow: number | null;
  pvzHoveredCol: number | null;
  pvzEnemiesRemaining: number;
  // Multiplayer state
  partyCode: string | null;
  isPartyHost: boolean;
  partyMembers: PartyMember[];
  multiplayerDownedTimer: number | null;
}
