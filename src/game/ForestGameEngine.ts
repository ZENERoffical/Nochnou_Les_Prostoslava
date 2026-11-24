import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameAudio } from './audio';
import {
  animateRobloxCharacter,
  createBatteryProp,
  createFlashlightProp,
  createGateProp,
  createMivinaFactoryEntrance,
  createNikitys6666,
  createProstophilyaMushroom,
  createRoner552,
  createSasha55kXL,
  FlashlightRig,
  GateRig,
  MivinaFactoryRig,
  RobloxRig,
} from './characters';
import { buildForestEnvironment, ForestSceneObjects } from './forest';
import {
  ForestLayout,
  generateForestLayout,
  generateStoryForestLayout,
  groundHeightAt,
  ObstacleCircle,
  PLAY_RADIUS,
  STORY_END_Z,
  STORY_PATH_HALF_WIDTH,
  STORY_START_Z,
  storyPathCenterX,
} from './terrain';
import {
  buildFactoryEnvironment,
  CONVEYOR_END_X,
  CONVEYOR_START_X,
  CONVEYOR_TOP_Y,
  CONVEYOR_Z,
  CORRIDOR_END_Z,
  CORRIDOR_HALF_W,
  CORRIDOR_VESTIBULE_Z,
  CORRIDOR_X,
  createNoodleBrickMesh,
  createSachetHandViewModel,
  createSeasoningBoxMesh,
  createSniperRifleProp,
  FACTORY_HALF_D,
  FACTORY_HALF_W,
  FactoryLocker,
  FactorySceneObjects,
  FactoryWindow,
  NoodleBrickRig,
  PACKER_POS,
  SachetHandRig,
  SeasoningBoxRig,
  SNIPER_PICKUP_POS,
} from './factory';
import {
  getCaughtScreamLine,
  getCutsceneLine,
  getKrysaRetreatLine,
  getStandardChaserPhrases,
  loadSettings,
  pickRandomChaserPhrase,
  saveSettings,
} from './localization';
import {
  buildMalinkaEntranceScene,
  buildSniperArenaScene,
  createSniperFirstPersonViewModel,
  MalinkaCityObjects,
  SniperArenaObjects,
  SniperViewModelRig,
} from './act3AndMinigames';
import {
  ACT3_BED_POS,
  ACT3_CAMPFIRE_POS,
  ACT3_CRUSHER_POS,
  ACT3_MAP_POS,
  ACT3_PARK_RADIUS,
  Act3ParkObjects,
  buildAct3ParkScene,
  createAct3LogMesh,
  createAct3MetalMesh,
} from './act3Park';
import {
  evaluateStatAchievements,
  loadAchievements,
  unlockSingleAchievement,
} from './achievements';
import {
  AchievementId,
  AchievementProgressState,
  ChaserId,
  CutsceneSubtitle,
  FloatingPickupText,
  GameMode,
  GamePhase,
  GameSettings,
  HudSnapshot,
  SpeechBubbleState,
} from '../types/game';

const BEST_SCORE_KEY = 'prostophilya_best_mushrooms_v1';
const BEST_SNIPER_KEY = 'prostophilya_best_sniper_v1';
const BEST_FNAF_KEY = 'prostophilya_best_fnaf_v1';
const STORY_TARGET_MUSHROOMS = 40;
const ACT2_TARGET_MIVINAS = 20;
const ACT3_MAX_NIGHTS = 30;
const ACT3_DAY_DURATION = 60.0; // 1 min day
const ACT3_NIGHT_DURATION = 60.0; // 1 min night
const ACT3_CYCLE_SECONDS = ACT3_DAY_DURATION + ACT3_NIGHT_DURATION; // 120s per day+night
const ACT3_LV2_METAL_COST = 4;
const ACT3_LV3_METAL_COST = 6;
const ACT3_LV4_METAL_COST = 8;
const ACT3_LV5_METAL_COST = 10;
const ACT3_LV6_METAL_COST = 12;
const ACT3_BOSS_MAX_HP = 14;

const SEASONING_BOX_SPOTS: Array<{ x: number; z: number }> = [
  // Central Hall starter box
  { x: -1.5, z: 10.5 },
  // West Storage Rack Room
  { x: -17.2, z: -1.2 },
  { x: -17.0, z: 6.2 },
  { x: -22.5, z: 8.2 },
  // North Storage Rack Wing
  { x: -16.5, z: -12.0 },
  { x: -1.0, z: -14.0 },
  { x: 16.5, z: -12.0 },
  // East Spice & Rack Room
  { x: 17.6, z: -1.0 },
  { x: 17.6, z: 8.0 },
];

const SANYA_PATROL_ROUTE: Array<{ x: number; z: number }> = [
  { x: -17.8, z: -12.0 },
  { x: -17.8, z: 4.0 },
  { x: -5.5, z: 4.5 },
  { x: 5.5, z: 4.5 },
  { x: 17.5, z: 4.0 },
  { x: 17.5, z: -12.0 },
  { x: 0.0, z: -11.5 },
];

type ActiveWorldType =
  | 'story_forest'
  | 'arena_forest'
  | 'factory'
  | 'sniper_arena'
  | 'malinka_city'
  | 'act3_park';

// Pre-allocated math helpers for zero-GC per-frame loop
const _vec3 = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _avoidVec = new THREE.Vector3();
const _beamOrigin = new THREE.Vector3();
const _beamDir = new THREE.Vector3();

interface MushroomItem {
  id: number;
  x: number;
  z: number;
  y: number;
  isGolden: boolean;
  mesh: THREE.Group;
  phase: number;
}

interface BatteryItem {
  id: number;
  x: number;
  z: number;
  y: number;
  mesh: THREE.Group;
  phase: number;
}

interface ChaserEntity {
  id: ChaserId;
  name: string;
  rig: RobloxRig;
  x: number;
  z: number;
  yaw: number;
  active: boolean;
  baseSpeed: number;
  tauntTimer: number;
  currentBubbleText: string | null;
  bubbleTimer: number;
  isScream: boolean;
  flankAngleOffset: number;
  pitch: number;
  lightExposure: number;
  retreatTimer: number;
  retreatCooldown: number;
  stalkPauseTimer: number;
}

interface BurstParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface ConveyorBrick {
  id: number;
  x: number;
  seasoned: boolean;
  rig: NoodleBrickRig;
}

interface SeasoningBoxEntity {
  id: number;
  x: number;
  z: number;
  available: boolean;
  respawnTimer: number;
  rig: SeasoningBoxRig;
}

interface SniperCloneEntity {
  id: ChaserId;
  name: string;
  rig: RobloxRig;
  x: number;
  z: number;
  yaw: number;
  active: boolean;
  deadTimer: number;
  speed: number;
  pitch: number;
  tauntTimer: number;
  currentBubbleText: string | null;
  bubbleTimer: number;
}

interface ParkCollectible {
  id: number;
  kind: 'log' | 'metal';
  x: number;
  z: number;
  available: boolean;
  respawnTimer: number;
  mesh: THREE.Group;
  phase: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onBubblesUpdate: (bubbles: SpeechBubbleState[]) => void;
  onFloatingTextsUpdate: (texts: FloatingPickupText[]) => void;
  onAchievementsChange?: (
    state: AchievementProgressState,
    newlyUnlocked: AchievementId[]
  ) => void;
}

export class ForestGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private moonLight: THREE.DirectionalLight;
  private fog: THREE.FogExp2;
  private isSoftwareGl: boolean;
  private anisotropy: number;

  // Flashlight rigs & SpotLight
  private flashlightSpot: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private fpFlashlight: FlashlightRig;
  private tpFlashlight: FlashlightRig;

  private audio = new GameAudio();
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  private layout: ForestLayout;
  private forestObjs: ForestSceneObjects;
  private factoryObjs: FactorySceneObjects | null = null;
  private sniperArenaObjs: SniperArenaObjects | null = null;
  private malinkaObjs: MalinkaCityObjects | null = null;
  private act3ParkObjs: Act3ParkObjects | null = null;
  private activeWorldType: ActiveWorldType = 'story_forest';
  private memeTexture: THREE.Texture | null = null;

  // Story Gates, Factory Building & Batteries
  private startGate: GateRig | null = null;
  private factoryGate: GateRig | null = null;
  private factoryBuilding: MivinaFactoryRig | null = null;
  private batteries: BatteryItem[] = [];
  private nextBatteryId = 1;

  // Act 2 Factory & FNAF Epta gameplay entities & state
  private sachetHand: SachetHandRig;
  private fpSniper: SniperViewModelRig;
  private conveyorBricks: ConveyorBrick[] = [];
  private nextBrickId = 1;
  private brickSpawnTimer = 0;
  private bricksDeliveredToTray = 0;
  private seasoningBoxes: SeasoningBoxEntity[] = [];
  private carriedAct1Mushrooms = 40;
  private act2Stage: 'conveyor' | 'packaging' | 'corridor_key' | 'corridor' = 'conveyor';
  private noodlesSeasoned = 0;
  private noodlesPacked = 0;
  private packetsInHand = 0;
  private boxesFound = 0;
  private mushroomStock = 40;
  private hasCorridorKey = false;
  private corridorDoor1Open = false;
  private corridorDoor2Open = false;
  private interactPrompt: string | null = null;
  private hoveredBoxId: number | null = null;
  private hoveredBrickId: number | null = null;
  private hoveredPacker = false;
  private hoveredLockerId: number | null = null;
  private hoveredDoor1 = false;
  private hoveredSniper = false;
  private isHidingInLocker = false;
  private hiddenLockerId: number | null = null;
  private preHideX = 0;
  private preHideZ = 0;
  private lockerCenterCamYaw = 0;
  private pressAnimTimer = 0;
  private sachetPlaceAnim = 0;
  private sniperShotFired = false;
  private nikitaSniperRifle: THREE.Group;
  private sniperTracers: THREE.Mesh[] = [];
  private tracerLife = 0;

  // Minigames & Achievements state
  private achievements: AchievementProgressState = loadAchievements();
  private fnafMivinasTotal = 0;
  private fnafBatch = 1;
  private bestFnafMivinas = 0;
  private sniperClones: SniperCloneEntity[] = [];
  private clonesKilled = 0;
  private bestSniperKills = 0;
  private sniperWave = 1;
  private sniperHp = 3;
  private readonly sniperMaxHp = 3;
  private sniperInvulnTimer = 0;
  private sniperFireCooldown = 0;
  private sniperRecoil = 0;
  private sniperMuzzleTimer = 0;
  private sniperRespawnTick = 0;

  // Act 3 Malinka Central Park Survival State
  private act3Logs: ParkCollectible[] = [];
  private act3Metals: ParkCollectible[] = [];
  private act3RonerArmy: SniperCloneEntity[] = [];
  private act3Night = 1;
  private act3DayClock = 0;
  private act3FireFuel = 78;
  private act3LogsInHand = 0;
  private act3MetalInHand = 0;
  private act3CrusherMetal = 0;
  private act3BaseLevel: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  private act3BedCooldownNights = 0;
  private act3BossHp = 0;
  private act3HasSniper = false;
  private act3Hp = 3;
  private readonly act3MaxHp = 3;
  private act3InvulnTimer = 0;
  private act3CrusherSpinTimer = 0;
  private act3ExplosionTimer = 0;
  private act3NearStation: 'campfire' | 'crusher' | 'map' | 'bed' | 'log' | 'metal' | null = null;
  private act3NearItemId: number | null = null;
  private act3NightRonerStates: Array<{
    flank: 'behind' | 'right' | 'left';
    lightExposure: number;
    retreatTimer: number;
    respawnTimer: number;
  }> = [
    { flank: 'behind', lightExposure: 0, retreatTimer: 0, respawnTimer: 0.8 },
    { flank: 'right', lightExposure: 0, retreatTimer: 0, respawnTimer: 2.0 },
    { flank: 'left', lightExposure: 0, retreatTimer: 0, respawnTimer: 3.2 },
  ];

  // Act 2 Horror AI (Rare & Mutually Exclusive: Blindfolded Sanya + Window-Breaching RONER)
  private sanyaState: 'dormant' | 'flicker_warning' | 'hunting' | 'leaving' = 'dormant';
  private sanyaTimer = 22.0;
  private sanyaWaypointIdx = 0;
  private sanyaFlickerSoundTimer = 0;
  private sanyaTauntTimer = 0;
  private blindfoldNoticeTimer = 0;
  private ronerState: 'dormant' | 'climbing' | 'breaking' | 'retreating' | 'chasing_inside' = 'dormant';
  private ronerTimer = 34.0;
  private ronerTargetWindowIdx = 1;
  private windowBreachProgress = 0;
  private windowBangTimer = 0;
  private alarmSoundTimer = 0;

  private playerRig: RobloxRig;
  private playerBubbleText: string | null = null;
  private chasers: ChaserEntity[] = [];
  private mushrooms: MushroomItem[] = [];
  private nextMushroomId = 1;
  private particlePool: BurstParticle[] = [];
  private floatingTexts: Array<{
    id: number;
    text: string;
    worldX: number;
    worldY: number;
    worldZ: number;
    life: number;
    maxLife: number;
    isGold: boolean;
  }> = [];
  private nextFloatId = 1;

  // Player & mode state
  private phase: GamePhase = 'title';
  private mode: GameMode = 'story_act1';
  private settings: GameSettings = loadSettings();
  private flashlightOn = true;
  private battery = 100;
  private flashlightStuns = 0;
  private playerX = 0;
  private playerZ = 0;
  private playerY = 0;
  private playerVy = 0;
  private playerYaw = Math.PI;
  private isGrounded = true;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private stamina = 100;
  private speedBoostTimer = 0;
  private footstepAccum = 0;

  // Cutscene state
  private cutsceneTimer = 0;
  private cutsceneStage = -1;
  private cutsceneSubtitle: CutsceneSubtitle | null = null;
  private isSecretPreviewOnly = false;

  // Camera state
  private camYaw = 0;
  private camPitch = 0.04;
  private camDist = 8.6;
  private isDraggingCam = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private cameraShake = 0;
  private hitstopTimer = 0;

  // Match stats
  private mushroomsCollected = 0;
  private bestMushrooms = 0;
  private elapsedPlaying = 0;
  private caughtTimer = 0;
  private killerId: ChaserId | null = null;
  private killerName: string | null = null;
  private eventBanner: string | null = null;
  private eventBannerTimer = 0;
  private lastHudPush = 0;

  // Input state
  private heldKeys = new Set<string>();
  private virtualMoveX = 0;
  private virtualMoveZ = 0;
  private virtualSprint = false;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    try {
      const saved = localStorage.getItem(BEST_SCORE_KEY);
      if (saved) this.bestMushrooms = Math.max(0, parseInt(saved, 10) || 0);
      const savedSniper = localStorage.getItem(BEST_SNIPER_KEY);
      if (savedSniper) this.bestSniperKills = Math.max(0, parseInt(savedSniper, 10) || 0);
      const savedFnaf = localStorage.getItem(BEST_FNAF_KEY);
      if (savedFnaf) this.bestFnafMivinas = Math.max(0, parseInt(savedFnaf, 10) || 0);
    } catch {
      this.bestMushrooms = 0;
    }

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    const nightHorizon = 0x071018;
    this.scene.background = new THREE.Color(nightHorizon);
    this.fog = new THREE.FogExp2(nightHorizon, 0.052);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.12, 260);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.24;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0x1e3a5f, 0x08120b, 0.36);
    this.scene.add(hemi);

    this.moonLight = new THREE.DirectionalLight(0x8cb8e8, 0.48);
    this.moonLight.position.set(22, 34, 18);
    this.moonLight.castShadow = !this.isSoftwareGl;
    this.moonLight.shadow.mapSize.set(1024, 1024);
    this.moonLight.shadow.camera.near = 2;
    this.moonLight.shadow.camera.far = 95;
    const d = 28;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.0005;
    this.moonLight.shadow.normalBias = 0.02;
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    const rimLight = new THREE.DirectionalLight(0x34d399, 0.18);
    rimLight.position.set(-20, 14, -22);
    this.scene.add(rimLight);

    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      '/assets/aistudio/image_690f5407.png',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.memeTexture = tex;
        this.rebuildMushroomsWithTexture();
      },
      undefined,
      () => {}
    );

    // Build initial Story Act 1 forest & gates
    this.activeWorldType = 'story_forest';
    this.layout = generateStoryForestLayout(909102);
    this.forestObjs = buildForestEnvironment(
      this.scene,
      this.layout,
      this.anisotropy,
      this.isSoftwareGl,
      true
    );
    this.buildStoryGates();

    this.playerRig = createNikitys6666(this.anisotropy);
    this.scene.add(this.playerRig.root);

    this.flashlightSpot = new THREE.SpotLight(
      0xfff6dc,
      58,
      48,
      Math.PI / 5.8,
      0.54,
      1.1
    );
    this.flashlightSpot.castShadow = !this.isSoftwareGl;
    this.flashlightSpot.shadow.mapSize.set(1024, 1024);
    this.flashlightSpot.shadow.camera.near = 0.4;
    this.flashlightSpot.shadow.camera.far = 48;
    this.flashlightSpot.shadow.bias = -0.0004;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightSpot, this.flashlightTarget);
    this.flashlightSpot.target = this.flashlightTarget;

    // 1st-person viewmodel: Nikita's arm & hand gripping the tactical flashlight
    this.fpFlashlight = createFlashlightProp(true);
    this.fpFlashlight.group.visible = false;
    this.scene.add(this.fpFlashlight.group);

    // 1st-person left hand holding seasoning packet in Act 2
    this.sachetHand = createSachetHandViewModel(this.anisotropy);
    this.sachetHand.group.visible = false;
    this.scene.add(this.sachetHand.group);

    // 1st-person sniper rifle viewmodel for «Снайперка теперь моя!»
    this.fpSniper = createSniperFirstPersonViewModel();
    this.fpSniper.group.visible = false;
    this.scene.add(this.fpSniper.group);

    this.tpFlashlight = createFlashlightProp(false);
    this.tpFlashlight.group.position.set(0, -0.76, 0.04);
    this.tpFlashlight.group.rotation.x = -Math.PI / 2;
    this.playerRig.rightArm.add(this.tpFlashlight.group);

    const ronerRig = createRoner552(this.anisotropy);
    const sashaRig = createSasha55kXL(this.anisotropy);
    this.scene.add(ronerRig.root, sashaRig.root);

    this.chasers = [
      {
        id: 'roner',
        name: 'RONER_552',
        rig: ronerRig,
        x: 14,
        z: -16,
        yaw: 0,
        active: false,
        baseSpeed: 7.45,
        tauntTimer: 4.5,
        currentBubbleText: null,
        bubbleTimer: 0,
        isScream: false,
        flankAngleOffset: 0.28,
        pitch: 0.96,
        lightExposure: 0,
        retreatTimer: 0,
        retreatCooldown: 0,
        stalkPauseTimer: 0,
      },
      {
        id: 'sasha',
        name: 'sasha55k_XL',
        rig: sashaRig,
        x: -16,
        z: -14,
        yaw: 0,
        active: false,
        baseSpeed: 7.85,
        tauntTimer: 6.0,
        currentBubbleText: null,
        bubbleTimer: 0,
        isScream: false,
        flankAngleOffset: -0.32,
        pitch: 1.15,
        lightExposure: 0,
        retreatTimer: 0,
        retreatCooldown: 0,
        stalkPauseTimer: 0,
      },
    ];

    const pGeo = new THREE.SphereGeometry(0.11, 6, 6);
    for (let i = 0; i < 36; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particlePool.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.6 });
    }

    // Nikita's 3rd-person sniper rifle for the Act 2 climax cutscene (points +Z in playerRig local space)
    this.nikitaSniperRifle = createSniperRifleProp();
    this.nikitaSniperRifle.position.set(0.28, 1.36, 0.34);
    this.nikitaSniperRifle.rotation.y = Math.PI;
    this.nikitaSniperRifle.visible = false;
    this.playerRig.root.add(this.nikitaSniperRifle);

    // Pre-allocated sniper tracer beams for zero-GC 360 headshot visual
    const tracerGeo = new THREE.BoxGeometry(0.07, 0.07, 1);
    for (let i = 0; i < 2; i++) {
      const tracerMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xfef08a : 0x4ade80,
        transparent: true,
        opacity: 0.95,
      });
      const beam = new THREE.Mesh(tracerGeo, tracerMat);
      beam.visible = false;
      this.scene.add(beam);
      this.sniperTracers.push(beam);
    }

    // Pre-allocated pool of 10 clone enemies for «Снайперка теперь моя!» (zero-GC respawn)
    for (let i = 0; i < 10; i++) {
      const isRoner = i % 2 === 0;
      const rig = isRoner
        ? createRoner552(this.anisotropy)
        : createSasha55kXL(this.anisotropy);
      if (rig.angryBrows) rig.angryBrows.visible = true;
      rig.root.visible = false;
      this.scene.add(rig.root);
      this.sniperClones.push({
        id: isRoner ? 'roner' : 'sasha',
        name: isRoner ? `RONER_CLONE_${Math.floor(i / 2) + 1}` : `sasha_CLONE_${Math.floor(i / 2) + 1}`,
        rig,
        x: 0,
        z: -24,
        yaw: 0,
        active: false,
        deadTimer: 0,
        speed: 5.2,
        pitch: isRoner ? 0.96 : 1.15,
        tauntTimer: 2 + i * 0.6,
        currentBubbleText: null,
        bubbleTimer: 0,
      });
    }

    // Pre-allocated pool of 8 RONER clones for Act 3 Night 30 & Outro Army explosion
    for (let i = 0; i < 8; i++) {
      const rig = createRoner552(this.anisotropy);
      if (rig.angryBrows) rig.angryBrows.visible = true;
      rig.root.visible = false;
      this.scene.add(rig.root);
      this.act3RonerArmy.push({
        id: 'roner',
        name: `RONER_${i + 1}`,
        rig,
        x: 0,
        z: -22,
        yaw: 0,
        active: false,
        deadTimer: 0,
        speed: 4.8 + (i % 3) * 0.35,
        pitch: 0.95 + (i % 3) * 0.04,
        tauntTimer: 1.5 + i * 0.7,
        currentBubbleText: null,
        bubbleTimer: 0,
      });
    }

    this.setupTitleShowcase();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.callbacks.onAchievementsChange?.({ ...this.achievements, unlockedIds: [...this.achievements.unlockedIds] }, []);
    this.pushHud(true);
    this.startLoop();
  }

  private emitAchievementResult(newlyUnlocked: AchievementId[]): void {
    if (newlyUnlocked.length > 0) {
      this.audio.playAchievementUnlock();
    }
    this.callbacks.onAchievementsChange?.(
      {
        ...this.achievements,
        unlockedIds: [...this.achievements.unlockedIds],
      },
      newlyUnlocked
    );
  }

  public getAchievementsState(): AchievementProgressState {
    return {
      ...this.achievements,
      unlockedIds: [...this.achievements.unlockedIds],
    };
  }

  private buildStoryGates(): void {
    this.removeStoryGates();
    this.startGate = createGateProp('ЛЕСНЫЕ ВОРОТА', false);
    this.startGate.group.position.set(0, groundHeightAt(0, 2), 2);
    this.scene.add(this.startGate.group);

    const endX = storyPathCenterX(STORY_END_Z);
    this.factoryGate = createGateProp('МИВИНА КОРПОРЕЙШЕН', true);
    this.factoryGate.group.position.set(
      endX,
      groundHeightAt(endX, STORY_END_Z),
      STORY_END_Z
    );
    this.scene.add(this.factoryGate.group);

    this.factoryBuilding = createMivinaFactoryEntrance();
    this.factoryBuilding.group.position.set(
      endX,
      groundHeightAt(endX, STORY_END_Z - 13.5),
      STORY_END_Z - 13.5
    );
    this.scene.add(this.factoryBuilding.group);
  }

  private removeStoryGates(): void {
    if (this.startGate) {
      this.scene.remove(this.startGate.group);
      this.startGate = null;
    }
    if (this.factoryGate) {
      this.scene.remove(this.factoryGate.group);
      this.factoryGate = null;
    }
    if (this.factoryBuilding) {
      this.scene.remove(this.factoryBuilding.group);
      this.factoryBuilding = null;
    }
  }

  private disposeObjectResources(root: THREE.Object3D): void {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material) {
          m.material.dispose();
        }
      }
    });
  }

  private clearFactoryDynamicEntities(): void {
    for (const b of this.conveyorBricks) {
      this.scene.remove(b.rig.group);
      this.disposeObjectResources(b.rig.group);
    }
    this.conveyorBricks = [];

    for (const box of this.seasoningBoxes) {
      this.scene.remove(box.rig.group);
      this.disposeObjectResources(box.rig.group);
    }
    this.seasoningBoxes = [];
  }

  private clearAct3Collectibles(): void {
    for (const item of this.act3Logs) {
      this.scene.remove(item.mesh);
      this.disposeObjectResources(item.mesh);
    }
    this.act3Logs = [];
    for (const item of this.act3Metals) {
      this.scene.remove(item.mesh);
      this.disposeObjectResources(item.mesh);
    }
    this.act3Metals = [];
  }

  private setActiveWorld(targetWorld: ActiveWorldType, hardcoreFog = false): void {
    if (targetWorld === this.activeWorldType) return;

    // Teardown previous world completely to keep WebGL memory clean
    if (this.activeWorldType === 'factory') {
      this.clearFactoryDynamicEntities();
      if (this.factoryObjs) {
        this.scene.remove(this.factoryObjs.worldGroup);
        for (const d of this.factoryObjs.disposables) {
          d.dispose();
        }
        this.disposeObjectResources(this.factoryObjs.worldGroup);
        this.factoryObjs = null;
      }
    } else if (this.activeWorldType === 'sniper_arena') {
      if (this.sniperArenaObjs) {
        this.scene.remove(this.sniperArenaObjs.worldGroup);
        for (const d of this.sniperArenaObjs.disposables) {
          d.dispose();
        }
        this.disposeObjectResources(this.sniperArenaObjs.worldGroup);
        this.sniperArenaObjs = null;
      }
    } else if (this.activeWorldType === 'malinka_city') {
      if (this.malinkaObjs) {
        this.scene.remove(this.malinkaObjs.worldGroup);
        for (const d of this.malinkaObjs.disposables) {
          d.dispose();
        }
        this.disposeObjectResources(this.malinkaObjs.worldGroup);
        this.malinkaObjs = null;
      }
    } else if (this.activeWorldType === 'act3_park') {
      this.clearAct3Collectibles();
      if (this.act3ParkObjs) {
        this.scene.remove(this.act3ParkObjs.worldGroup);
        for (const d of this.act3ParkObjs.disposables) {
          d.dispose();
        }
        this.disposeObjectResources(this.act3ParkObjs.worldGroup);
        this.act3ParkObjs = null;
      }
    } else {
      this.clearMushrooms();
      this.clearBatteries();
      this.removeStoryGates();
      this.scene.remove(this.forestObjs.worldGroup);
      for (const d of this.forestObjs.disposables) {
        d.dispose();
      }
      this.disposeObjectResources(this.forestObjs.worldGroup);
    }

    this.activeWorldType = targetWorld;

    if (targetWorld === 'factory') {
      const factoryBg = 0x0b1016;
      this.scene.background = new THREE.Color(factoryBg);
      this.fog.color.setHex(factoryBg);
      this.fog.density = 0.022;
      this.moonLight.intensity = 0.25;
      this.factoryObjs = buildFactoryEnvironment(
        this.scene,
        this.anisotropy,
        this.isSoftwareGl
      );
    } else if (targetWorld === 'sniper_arena') {
      const yardBg = 0x080e16;
      this.scene.background = new THREE.Color(yardBg);
      this.fog.color.setHex(yardBg);
      this.fog.density = 0.016;
      this.moonLight.intensity = 0.45;
      this.sniperArenaObjs = buildSniperArenaScene(
        this.scene,
        this.anisotropy,
        this.isSoftwareGl
      );
    } else if (targetWorld === 'malinka_city') {
      const cityBg = 0x0d0916;
      this.scene.background = new THREE.Color(cityBg);
      this.fog.color.setHex(cityBg);
      this.fog.density = 0.011;
      this.moonLight.intensity = 0.55;
      this.malinkaObjs = buildMalinkaEntranceScene(
        this.scene,
        this.anisotropy,
        this.isSoftwareGl
      );
    } else if (targetWorld === 'act3_park') {
      const parkBg = 0x0d1522;
      this.scene.background = new THREE.Color(parkBg);
      this.fog.color.setHex(parkBg);
      this.fog.density = 0.014;
      this.moonLight.intensity = 0.52;
      this.act3ParkObjs = buildAct3ParkScene(
        this.scene,
        this.anisotropy,
        this.isSoftwareGl
      );
    } else {
      const nightHorizon = 0x071018;
      this.scene.background = new THREE.Color(nightHorizon);
      this.fog.color.setHex(nightHorizon);
      this.fog.density = hardcoreFog ? 0.062 : 0.052;
      this.moonLight.intensity = 0.48;

      const wantsStory = targetWorld === 'story_forest';
      this.layout = wantsStory
        ? generateStoryForestLayout(909102)
        : generateForestLayout(202607);
      this.forestObjs = buildForestEnvironment(
        this.scene,
        this.layout,
        this.anisotropy,
        this.isSoftwareGl,
        wantsStory
      );

      if (wantsStory) {
        this.buildStoryGates();
      }
    }
  }

  private ensureWorldForMode(mode: GameMode): void {
    const targetWorld: ActiveWorldType =
      mode === 'story_act3'
        ? 'act3_park'
        : mode === 'story_act2' || mode === 'fnaf_epta'
          ? 'factory'
          : mode === 'sniper_minigame'
            ? 'sniper_arena'
            : mode === 'story_act1'
              ? 'story_forest'
              : 'arena_forest';
    this.setActiveWorld(targetWorld, mode === 'hardcore_third_person');
  }

  public setMode(mode: GameMode): void {
    this.mode = mode;
    if (mode === 'story_act3') {
      this.fog.density = 0.014;
      this.camera.fov = 72;
    } else if (mode === 'story_act2' || mode === 'fnaf_epta') {
      this.fog.density = 0.022;
      this.camera.fov = 72;
    } else if (mode === 'sniper_minigame') {
      this.fog.density = 0.016;
      this.camera.fov = 70;
    } else {
      this.fog.density = mode === 'hardcore_third_person' ? 0.062 : 0.052;
      this.camera.fov = mode === 'hardcore_third_person' ? 58 : 70;
    }
    this.camera.updateProjectionMatrix();
    if (this.phase === 'title') {
      this.ensureWorldForMode(mode);
      this.setupTitleShowcase();
    }
    this.pushHud(true);
  }

  public setSettings(next: GameSettings): void {
    const normalized: GameSettings = {
      language: next.language === 'en' ? 'en' : 'ru',
      familyMode: Boolean(next.familyMode),
      censorship: next.familyMode ? true : Boolean(next.censorship),
    };
    this.settings = normalized;
    saveSettings(normalized);
    const isEn = normalized.language === 'en';

    if (this.phase === 'act2_teaser') {
      const key = this.isSecretPreviewOnly ? 'act2_secret' : 'act2_teaser';
      const line = getCutsceneLine(key, normalized);
      this.cutsceneSubtitle = {
        speaker: isEn
          ? this.isSecretPreviewOnly
            ? 'SECRET · «MIVINA CORPORATION»'
            : 'MIVINA CORPORATION · ACT 2'
          : this.isSecretPreviewOnly
            ? 'СЕКРЕТ · «МИВИНА КОРПОРЕЙШЕН»'
            : 'МИВИНА КОРПОРЕЙШЕН · АКТ 2',
        text: line.display,
        tone: this.isSecretPreviewOnly ? 'enemy' : 'nikita',
      };
    } else if (this.phase === 'act2_intro_cutscene') {
      const key =
        this.cutsceneStage <= 0
          ? 'act2_intro_0'
          : this.cutsceneStage === 1
            ? 'act2_intro_1'
            : this.cutsceneStage === 2
              ? 'act2_intro_2a'
              : this.cutsceneStage === 3
                ? 'act2_intro_2b'
                : 'act2_intro_2c';
      const line = getCutsceneLine(key, normalized);
      const isRonerLine = this.cutsceneStage >= 2;
      this.cutsceneSubtitle = {
        speaker: isRonerLine
          ? 'RONER_552'
          : isEn
            ? 'nikitys6666 (Nikita)'
            : 'nikitys6666 (Никита)',
        text: line.display,
        tone: isRonerLine ? 'enemy' : 'nikita',
      };
    } else if (this.phase === 'act2_door_cutscene') {
      const key = this.cutsceneStage <= 0 ? 'act2_door_0' : 'act2_door_1';
      const line = getCutsceneLine(key, normalized);
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
    } else if (this.phase === 'act2_outro_cutscene') {
      const key = this.cutsceneStage <= 2 ? 'act2_final_0' : 'act2_outro_0';
      const line = getCutsceneLine(key, normalized);
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
    } else if (this.phase === 'act3_secret') {
      const line = getCutsceneLine('act3_secret', normalized);
      this.cutsceneSubtitle = {
        speaker: isEn
          ? 'SECRET · ACT 3 «MALINKA»'
          : 'СЕКРЕТ · АКТ 3 «МАЛИНКА»',
        text: line.display,
        tone: 'nikita',
      };
    } else if (this.phase === 'act3_intro_cutscene') {
      const line = getCutsceneLine('act3_intro_0', normalized);
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
    } else if (this.phase === 'act3_outro_cutscene') {
      const key =
        this.cutsceneStage <= 0
          ? 'act3_outro_0'
          : this.cutsceneStage === 1
            ? 'act3_outro_1'
            : 'act3_outro_2';
      const isArmy = this.cutsceneStage === 1;
      const line = getCutsceneLine(key, normalized);
      this.cutsceneSubtitle = {
        speaker: isArmy
          ? isEn
            ? 'RONER Army'
            : 'Армия Roner'
          : isEn
            ? 'nikitys6666 (Nikita)'
            : 'nikitys6666 (Никита)',
        text: line.display,
        tone: isArmy ? 'enemy' : 'nikita',
      };
    }

    this.pushHud(true);
  }

  private syncAct2EnemyAppearance(): void {
    const isFactoryMode = this.mode === 'story_act2' || this.mode === 'fnaf_epta';
    const isAct3 = this.mode === 'story_act3';
    const roner = this.chasers[0];
    const sasha = this.chasers[1];
    if (roner?.rig.angryBrows) {
      roner.rig.angryBrows.visible = isFactoryMode || isAct3;
    }
    if (sasha?.rig.angryBrows) {
      sasha.rig.angryBrows.visible = isFactoryMode || isAct3;
    }
    if (sasha?.rig.blindfold) {
      sasha.rig.blindfold.visible = isFactoryMode;
    }
    if (sasha) {
      sasha.rig.root.scale.setScalar(isAct3 ? 2.0 : 1.0);
    }
  }

  public toggleFlashlight(): void {
    if (this.phase !== 'playing') return;
    this.audio.unlock();
    if (!this.flashlightOn && this.mode === 'story_act1' && this.battery <= 0) {
      this.eventBanner =
        this.settings.language === 'en'
          ? 'Battery empty! Find a battery on the trail!'
          : 'Батарея разряжена! Подбери батарейку на дорожке!';
      this.eventBannerTimer = 2.4;
      this.audio.playFlashlightClick(false);
      this.pushHud(true);
      return;
    }
    this.flashlightOn = !this.flashlightOn;
    this.audio.playFlashlightClick(this.flashlightOn);
    this.pushHud(true);
  }

  public returnToMenu(): void {
    this.audio.unlock();
    this.heldKeys.clear();
    this.virtualMoveX = 0;
    this.virtualMoveZ = 0;
    this.virtualSprint = false;
    this.isDraggingCam = false;
    this.eventBanner = null;
    this.eventBannerTimer = 0;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.interactPrompt = null;
    this.floatingTexts = [];
    this.killerId = null;
    this.killerName = null;
    this.caughtTimer = 0;
    this.cameraShake = 0;
    this.hitstopTimer = 0;
    this.sachetHand.group.visible = false;
    this.fpSniper.group.visible = false;
    this.fpSniper.muzzleFlash.visible = false;
    this.nikitaSniperRifle.visible = false;
    this.sniperShotFired = false;
    this.sniperInvulnTimer = 0;
    this.sniperFireCooldown = 0;
    this.sniperRecoil = 0;
    this.sniperMuzzleTimer = 0;
    this.tracerLife = 0;
    for (const tr of this.sniperTracers) tr.visible = false;
    this.hasCorridorKey = false;
    this.corridorDoor1Open = false;
    this.corridorDoor2Open = false;
    this.hoveredDoor1 = false;
    this.hoveredSniper = false;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.hoveredLockerId = null;
    this.sanyaState = 'dormant';
    this.ronerState = 'dormant';
    this.windowBreachProgress = 0;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    for (const c of this.chasers) {
      c.lightExposure = 0;
      c.retreatTimer = 0;
      c.retreatCooldown = 0;
      c.stalkPauseTimer = 0;
      c.isScream = false;
      c.currentBubbleText = null;
      c.bubbleTimer = 0;
      c.rig.bodyPivot.rotation.x = 0;
      c.rig.bodyPivot.position.y = 0;
      c.rig.leftArm.rotation.x = 0;
      c.rig.rightArm.rotation.x = 0;
    }

    for (const sc of this.sniperClones) {
      sc.active = false;
      sc.rig.root.visible = false;
      sc.currentBubbleText = null;
      sc.bubbleTimer = 0;
    }

    this.ensureWorldForMode(this.mode);
    this.syncAct2EnemyAppearance();
    this.setupTitleShowcase();
    this.clock.getDelta();
    this.callbacks.onBubblesUpdate([]);
    this.callbacks.onFloatingTextsUpdate([]);
    this.pushHud(true);
  }

  private setupTitleShowcase(): void {
    this.phase = 'title';
    this.flashlightOn = true;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.interactPrompt = null;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.sanyaState = 'dormant';
    this.ronerState = 'dormant';
    this.windowBreachProgress = 0;
    this.fpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.fpSniper.group.visible = false;
    this.fpSniper.muzzleFlash.visible = false;
    this.nikitaSniperRifle.visible = false;
    this.tpFlashlight.group.visible = true;
    for (const sc of this.sniperClones) {
      sc.active = false;
      sc.rig.root.visible = false;
      sc.currentBubbleText = null;
    }
    for (const rc of this.act3RonerArmy) {
      rc.active = false;
      rc.rig.root.visible = false;
      rc.currentBubbleText = null;
    }

    if (this.mode === 'story_act3' && this.act3ParkObjs) {
      this.fog.density = 0.014;
      this.playerX = -2.2;
      this.playerZ = 3.2;
      this.playerY = 0;
      this.playerYaw = 0.45;
      this.playerRig.root.visible = true;
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = this.playerYaw;
      this.playerRig.bodyPivot.rotation.x = 0;
      this.playerRig.bodyPivot.position.y = 0;
      this.playerRig.rightArm.rotation.x = -0.35;

      this.act3ParkObjs.campfireFlames.visible = true;
      this.act3ParkObjs.campfireFlames.scale.setScalar(1.0);
      this.act3ParkObjs.campfireLight.intensity = 24;
      this.act3ParkObjs.level2FenceGroup.visible = false;
      this.act3ParkObjs.level3DefenseGroup.visible = false;
      this.act3ParkObjs.explosionSphere.visible = false;
      this.act3ParkObjs.explosionRing.visible = false;
      this.act3ParkObjs.explosionLight.intensity = 0;

      // Giant Sasha (2x scale!) lurking behind the park campfire
      this.chasers[0].active = false;
      this.chasers[0].rig.root.visible = false;

      this.chasers[1].active = true;
      this.chasers[1].x = 2.8;
      this.chasers[1].z = -12.5;
      this.chasers[1].rig.root.visible = true;
      this.chasers[1].rig.root.scale.setScalar(2.0);
      this.chasers[1].rig.root.position.set(2.8, 0, -12.5);
      this.chasers[1].rig.root.rotation.y = -0.25;
      this.chasers[1].currentBubbleText = null;
      this.chasers[1].isScream = false;
      return;
    }

    this.syncAct2EnemyAppearance();

    if (this.mode === 'sniper_minigame' && this.sniperArenaObjs) {
      this.fog.density = 0.016;
      this.playerX = 0;
      this.playerZ = 2.5;
      this.playerY = 0;
      this.playerYaw = Math.PI;
      this.playerRig.root.visible = true;
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = this.playerYaw;
      this.playerRig.bodyPivot.rotation.x = 0;
      this.playerRig.bodyPivot.position.y = 0;
      this.playerRig.rightArm.rotation.x = -1.25;
      this.playerRig.leftArm.rotation.x = -1.15;
      this.tpFlashlight.group.visible = false;
      this.nikitaSniperRifle.visible = true;

      this.chasers[0].active = true;
      this.chasers[0].x = -4.2;
      this.chasers[0].z = -11.0;
      this.chasers[0].rig.root.visible = true;
      this.chasers[0].rig.root.position.set(-4.2, 0, -11.0);
      this.chasers[0].rig.root.rotation.y = 0.35;
      this.chasers[0].currentBubbleText = null;
      this.chasers[0].isScream = false;

      this.chasers[1].active = true;
      this.chasers[1].x = 4.4;
      this.chasers[1].z = -12.0;
      this.chasers[1].rig.root.visible = true;
      this.chasers[1].rig.root.position.set(4.4, 0, -12.0);
      this.chasers[1].rig.root.rotation.y = -0.35;
      this.chasers[1].currentBubbleText = null;
      this.chasers[1].isScream = false;
      return;
    }

    if ((this.mode === 'story_act2' || this.mode === 'fnaf_epta') && this.factoryObjs) {
      this.fog.density = 0.022;
      this.playerX = -2.0;
      this.playerZ = 3.8;
      this.playerY = 0;
      this.playerYaw = Math.PI;
      this.playerRig.root.visible = true;
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = this.playerYaw;
      this.playerRig.bodyPivot.rotation.x = 0;
      this.playerRig.bodyPivot.position.y = 0;
      this.playerRig.rightArm.rotation.x = -0.35;

      this.factoryObjs.leftSlidingDoor.position.x = -1.95;
      this.factoryObjs.rightSlidingDoor.position.x = 1.95;
      this.factoryObjs.alarmLight.intensity = 0;
      for (const w of this.factoryObjs.windows) {
        w.glassMesh.visible = true;
        w.beaconMat.emissiveIntensity = 0.2;
      }
      for (const l of this.factoryObjs.lockers) {
        l.doorPivot.rotation.y = -0.42;
      }

      this.chasers[0].active = true;
      this.chasers[0].x = -1.6;
      this.chasers[0].z = 11.4;
      this.chasers[0].rig.root.visible = true;
      this.chasers[0].rig.root.position.set(-1.6, 0, 11.4);
      this.chasers[0].rig.root.rotation.y = Math.PI;
      this.chasers[0].currentBubbleText = null;
      this.chasers[0].isScream = false;

      this.chasers[1].active = true;
      this.chasers[1].x = 1.6;
      this.chasers[1].z = 11.6;
      this.chasers[1].rig.root.visible = true;
      this.chasers[1].rig.root.position.set(1.6, 0, 11.6);
      this.chasers[1].rig.root.rotation.y = Math.PI;
      this.chasers[1].currentBubbleText = null;
      this.chasers[1].isScream = false;

      this.clearFactoryDynamicEntities();
      for (const x of [-6.5, -1.5, 3.5]) {
        const rig = createNoodleBrickMesh(this.anisotropy);
        rig.sachetGroup.visible = x > 0;
        rig.group.position.set(x, CONVEYOR_TOP_Y, CONVEYOR_Z);
        this.scene.add(rig.group);
        this.conveyorBricks.push({
          id: this.nextBrickId++,
          x,
          seasoned: x > 0,
          rig,
        });
      }
      return;
    }

    this.fog.density = this.mode === 'hardcore_third_person' ? 0.062 : 0.052;
    this.playerX = 0;
    this.playerZ = -2;
    this.playerY = groundHeightAt(0, -2);
    this.playerYaw = 0.15;
    this.playerRig.root.visible = true;
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;
    this.playerRig.rightArm.rotation.x = 0;

    if (this.startGate) {
      this.startGate.leftDoor.rotation.y = -1.2;
      this.startGate.rightDoor.rotation.y = 1.2;
    }
    if (this.factoryGate) {
      this.factoryGate.leftDoor.rotation.y = 0;
      this.factoryGate.rightDoor.rotation.y = 0;
    }
    if (this.factoryBuilding) {
      this.factoryBuilding.leftSlidingDoor.position.x = -1.15;
      this.factoryBuilding.rightSlidingDoor.position.x = 1.15;
    }

    this.chasers[0].active = true;
    this.chasers[0].x = -3.4;
    this.chasers[0].z = -9.5;
    this.chasers[0].rig.root.visible = true;
    this.chasers[0].rig.root.position.set(
      -3.4,
      groundHeightAt(-3.4, -9.5),
      -9.5
    );
    this.chasers[0].rig.root.rotation.y = 0.45;
    this.chasers[0].currentBubbleText = null;
    this.chasers[0].isScream = false;

    this.chasers[1].active = true;
    this.chasers[1].x = 3.6;
    this.chasers[1].z = -10.2;
    this.chasers[1].rig.root.visible = true;
    this.chasers[1].rig.root.position.set(
      3.6,
      groundHeightAt(3.6, -10.2),
      -10.2
    );
    this.chasers[1].rig.root.rotation.y = -0.48;
    this.chasers[1].currentBubbleText = null;
    this.chasers[1].isScream = false;

    this.clearMushrooms();
    this.clearBatteries();
    this.spawnMushroomAt(1.9, -0.6, false);
    for (let i = 0; i < 6; i++) {
      this.spawnArenaMushroom(false);
    }
  }

  public startGame(selectedMode?: GameMode): void {
    const activeMode = selectedMode ?? this.mode;
    this.mode = activeMode;
    if (activeMode === 'story_act3') {
      this.fog.density = 0.014;
      this.camera.fov = 72;
    } else if (activeMode === 'story_act2' || activeMode === 'fnaf_epta') {
      this.fog.density = 0.022;
      this.camera.fov = 72;
    } else if (activeMode === 'sniper_minigame') {
      this.fog.density = 0.016;
      this.camera.fov = 70;
    } else {
      this.fog.density = activeMode === 'hardcore_third_person' ? 0.062 : 0.052;
      this.camera.fov = activeMode === 'hardcore_third_person' ? 58 : 70;
    }
    this.camera.updateProjectionMatrix();
    this.ensureWorldForMode(activeMode);

    this.audio.unlock();
    this.mushroomsCollected = 0;
    this.flashlightStuns = 0;
    this.flashlightOn = true;
    this.battery = 100;
    this.elapsedPlaying = 0;
    this.stamina = 100;
    this.speedBoostTimer = 0;
    this.killerId = null;
    this.killerName = null;
    this.caughtTimer = 0;
    this.cameraShake = 0;
    this.hitstopTimer = 0;
    this.playerBubbleText = null;
    this.cutsceneSubtitle = null;
    this.interactPrompt = null;
    this.floatingTexts = [];
    this.heldKeys.clear();

    if (activeMode === 'story_act1') {
      this.beginIntroCutscene();
      return;
    }

    if (activeMode === 'story_act2') {
      this.startAct2IntroCutscene();
      return;
    }

    if (activeMode === 'story_act3') {
      this.startAct3IntroCutscene();
      return;
    }

    if (activeMode === 'fnaf_epta') {
      this.startFnafEptaMode();
      return;
    }

    if (activeMode === 'sniper_minigame') {
      this.startSniperMinigame();
      return;
    }

    this.beginActivePlay(false);
  }

  private beginIntroCutscene(): void {
    this.phase = 'intro_cutscene';
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.flashlightOn = false;
    this.playerRig.root.visible = true;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = true;
    this.playerX = 0;
    this.playerZ = 5.2;
    this.playerY = groundHeightAt(0, 5.2);
    this.playerYaw = Math.PI; // facing -Z into the forest
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;

    if (this.startGate) {
      this.startGate.leftDoor.rotation.y = 0;
      this.startGate.rightDoor.rotation.y = 0;
    }
    if (this.factoryGate) {
      this.factoryGate.leftDoor.rotation.y = 0;
      this.factoryGate.rightDoor.rotation.y = 0;
    }

    // Stage RONER_552 and sasha55k_XL hidden in trees at z=-11 until stage 1
    this.chasers[0].active = true;
    this.chasers[0].x = -3.8;
    this.chasers[0].z = -11.5;
    this.chasers[0].rig.root.visible = false;
    this.chasers[0].currentBubbleText = null;
    this.chasers[0].isScream = false;

    this.chasers[1].active = true;
    this.chasers[1].x = 3.8;
    this.chasers[1].z = -11.5;
    this.chasers[1].rig.root.visible = false;
    this.chasers[1].currentBubbleText = null;
    this.chasers[1].isScream = false;

    this.fog.density = 0.032;
    this.populateStoryTrailCollectibles();
    this.pushHud(true);
  }

  public skipCutscene(): void {
    if (this.phase === 'intro_cutscene') {
      this.beginActivePlay(true);
    } else if (this.phase === 'outro_cutscene') {
      this.beginAct2Teaser(false);
    } else if (this.phase === 'act2_teaser') {
      if (this.isSecretPreviewOnly) {
        this.returnToMenu();
      } else {
        this.finishStoryVictory();
      }
    } else if (this.phase === 'act2_intro_cutscene') {
      this.beginFactoryPlaying();
    } else if (this.phase === 'act2_door_cutscene') {
      this.finishAct2DoorCutscene();
    } else if (this.phase === 'act2_outro_cutscene') {
      this.finishAct2Victory();
    } else if (this.phase === 'act3_intro_cutscene') {
      this.beginAct3Playing();
    } else if (this.phase === 'act3_outro_cutscene') {
      this.finishAct3Victory();
    } else if (this.phase === 'act3_secret') {
      this.returnToMenu();
    }
  }

  public startAct2SecretPreview(): void {
    this.audio.unlock();
    this.mode = 'story_act1';
    this.ensureWorldForMode('story_act1');
    this.beginAct2Teaser(true);
  }

  public startAct3MalinkaSecret(): void {
    this.audio.unlock();
    this.heldKeys.clear();
    this.interactPrompt = null;
    this.playerBubbleText = null;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.setActiveWorld('malinka_city');
    this.phase = 'act3_secret';
    this.camera.fov = 66;
    this.camera.updateProjectionMatrix();

    this.playerRig.root.visible = false;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.fpSniper.group.visible = false;
    this.nikitaSniperRifle.visible = false;
    this.flashlightSpot.visible = false;

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
    }
    for (const sc of this.sniperClones) {
      sc.active = false;
      sc.rig.root.visible = false;
      sc.currentBubbleText = null;
    }

    const isEn = this.settings.language === 'en';
    const line = getCutsceneLine('act3_secret', this.settings);
    this.cutsceneSubtitle = {
      speaker: isEn ? 'SECRET · ACT 3 «MALINKA»' : 'СЕКРЕТ · АКТ 3 «МАЛИНКА»',
      text: line.display,
      tone: 'nikita',
    };
    this.audio.playDialogueLine(line.speech, 1.04, line.hasCensorBeep);

    const unlocked = unlockSingleAchievement(this.achievements, 'secret_malinka');
    this.emitAchievementResult(unlocked);

    this.callbacks.onBubblesUpdate([]);
    this.pushHud(true);
  }

  private beginActivePlay(fromCutscene: boolean): void {
    const isStory = this.mode === 'story_act1';
    const isFP = this.mode === 'first_person' || isStory;

    this.phase = 'playing';
    this.fog.density = this.mode === 'hardcore_third_person' ? 0.062 : 0.052;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.flashlightOn = true;
    this.battery = 100;

    if (isStory) {
      this.playerX = 0;
      this.playerZ = -1.8;
      this.playerY = groundHeightAt(0, -1.8);
      this.playerYaw = Math.PI;
      this.camYaw = 0; // looking toward -Z down the winding trail
      this.camPitch = 0.02;
      if (this.startGate) {
        this.startGate.leftDoor.rotation.y = -1.45;
        this.startGate.rightDoor.rotation.y = 1.45;
      }
      if (!fromCutscene) {
        this.populateStoryTrailCollectibles();
      }
      this.eventBanner =
        this.settings.language === 'en'
          ? 'ACT 1 (1000m): Collect 40 mushrooms & reach Mivina Corporation!'
          : 'АКТ 1 (1000м): Собери 40 грибов и добеги до «Мивина Корпорейшен»!';
      this.eventBannerTimer = 4.8;
    } else {
      this.playerX = 0;
      this.playerZ = 0;
      this.playerY = groundHeightAt(0, 0);
      this.playerYaw = Math.PI;
      this.camYaw = 0;
      this.camPitch = isFP ? 0.02 : 0.36;
      this.clearMushrooms();
      this.clearBatteries();
      for (let i = 0; i < 9; i++) {
        this.spawnArenaMushroom(i === 8);
      }
      this.eventBanner =
        this.settings.language === 'en'
          ? this.mode === 'hardcore_third_person'
            ? 'HARDCORE 3RD (Endless): Chasers are angrier, survive as long as you can!'
            : '1ST PERSON (Endless): Flash enemies [F] & beat your high score!'
          : this.mode === 'hardcore_third_person'
            ? 'ХАРДКОР 3-е (Бесконечный): враги злее, держись как можно дольше!'
            : '1-е лицо (Бесконечный): свети фонариком [F] на врагов и бей рекорд!';
      this.eventBannerTimer = 4.2;
    }

    this.playerVy = 0;
    this.isGrounded = true;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.visible = !isFP;
    this.fpFlashlight.group.visible = isFP;
    this.tpFlashlight.group.visible = !isFP;

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
      c.bubbleTimer = 0;
      c.isScream = false;
      c.lightExposure = 0;
      c.retreatTimer = 0;
      c.retreatCooldown = 0;
      c.stalkPauseTimer = 0;
      c.rig.bodyPivot.rotation.x = 0;
      c.rig.bodyPivot.position.y = 0;
    }

    this.pushHud(true);
    this.callbacks.onBubblesUpdate([]);
  }

  private populateStoryTrailCollectibles(): void {
    this.clearMushrooms();
    this.clearBatteries();

    // Place 96 Простофиля mushrooms along the 1000m winding trail
    const mushCount = 96;
    const span = Math.abs(STORY_END_Z) - 24;
    for (let i = 0; i < mushCount; i++) {
      const t = (i + 0.4) / mushCount;
      const z = -8 - t * span;
      const cx = storyPathCenterX(z);
      const jitterX = (i % 2 === 0 ? 1 : -1) * (1.0 + ((i * 37) % 10) * 0.25);
      const x = cx + jitterX;
      const isGolden = i % 10 === 5;
      this.spawnMushroomAt(x, z, isGolden);
    }

    // Place 16 Batteries along the 1000m winding path (scarce supply — conserve flashlight!)
    const batCount = 16;
    const batSpan = Math.abs(STORY_END_Z) - 40;
    for (let i = 0; i < batCount; i++) {
      const t = (i + 0.5) / batCount;
      const z = -22 - t * batSpan;
      const cx = storyPathCenterX(z);
      const side = i % 2 === 0 ? -1.9 : 1.9;
      this.spawnBatteryAt(cx + side, z);
    }
  }

  private clearBatteries(): void {
    for (const b of this.batteries) {
      this.scene.remove(b.mesh);
    }
    this.batteries = [];
  }

  private spawnBatteryAt(x: number, z: number): void {
    const y = groundHeightAt(x, z);
    const mesh = createBatteryProp();
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.batteries.push({
      id: this.nextBatteryId++,
      x,
      z,
      y,
      mesh,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private startOutroCutscene(): void {
    this.phase = 'outro_cutscene';
    this.fog.density = 0.028;
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.heldKeys.clear();
    this.flashlightOn = false;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;
    this.playerRig.root.visible = true;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    const endX = storyPathCenterX(STORY_END_Z);
    this.playerX = endX;
    this.playerZ = STORY_END_Z + 5.5;
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerYaw = Math.PI; // running toward -Z through factory gate

    // Position chasers just behind Nikita at the factory approach
    this.chasers[0].active = true;
    this.chasers[0].x = endX - 2.1;
    this.chasers[0].z = STORY_END_Z + 12.5;
    this.chasers[0].rig.root.visible = true;
    this.chasers[0].currentBubbleText = null;
    this.chasers[0].isScream = false;

    this.chasers[1].active = true;
    this.chasers[1].x = endX + 2.1;
    this.chasers[1].z = STORY_END_Z + 13.0;
    this.chasers[1].rig.root.visible = true;
    this.chasers[1].currentBubbleText = null;
    this.chasers[1].isScream = false;

    this.pushHud(true);
  }

  private beginAct2Teaser(secretOnly = false): void {
    this.phase = 'act2_teaser';
    this.isSecretPreviewOnly = secretOnly;
    this.fog.density = 0.026;
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.flashlightOn = false;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;
    // In secret preview mode, do not show Nikita having reached/completed Act 1
    this.playerRig.root.visible = !secretOnly;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    const endX = storyPathCenterX(STORY_END_Z);
    this.playerX = endX;
    this.playerZ = STORY_END_Z - 4.5;
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerYaw = Math.PI;
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.playerBubbleText = null;

    if (this.factoryGate) {
      this.factoryGate.leftDoor.rotation.y = -1.48;
      this.factoryGate.rightDoor.rotation.y = 1.48;
    }
    if (this.factoryBuilding) {
      // Doors slightly ajar (приоткрытые двери)
      this.factoryBuilding.leftSlidingDoor.position.x = -1.68;
      this.factoryBuilding.rightSlidingDoor.position.x = 1.68;
    }

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
    }

    this.pushHud(true);
  }

  private finishStoryVictory(): void {
    this.carriedAct1Mushrooms = Math.max(40, this.mushroomsCollected);
    this.phase = 'victory';
    this.isSecretPreviewOnly = false;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    const unlocked = unlockSingleAchievement(this.achievements, 'act1_clear');
    this.emitAchievementResult(unlocked);
    this.audio.playVictoryFanfare();
    this.pushHud(true);
  }

  private resetFactoryDoors(): void {
    this.hasCorridorKey = false;
    this.corridorDoor1Open = false;
    this.corridorDoor2Open = false;
    this.hoveredDoor1 = false;
    this.hoveredSniper = false;
    this.sniperShotFired = false;
    this.tracerLife = 0;
    this.nikitaSniperRifle.visible = false;
    for (const tr of this.sniperTracers) tr.visible = false;
    if (!this.factoryObjs) return;

    this.factoryObjs.corridorDoor1.doorPivot.rotation.y = 0;
    if (this.factoryObjs.corridorDoor1.padlock) {
      this.factoryObjs.corridorDoor1.padlock.visible = true;
    }
    if (this.factoryObjs.corridorDoor1.lockBeaconMat) {
      this.factoryObjs.corridorDoor1.lockBeaconMat.color.setHex(0xef4444);
      this.factoryObjs.corridorDoor1.lockBeaconMat.emissive.setHex(0xdc2626);
    }
    this.factoryObjs.corridorDoor2.doorPivot.rotation.y = 0;
    this.factoryObjs.exitLolDoor.leftDoor.rotation.y = 0;
    this.factoryObjs.exitLolDoor.rightDoor.rotation.y = 0;
    this.factoryObjs.sniperPickup.rifleGroup.visible = true;
    for (const ob of this.factoryObjs.obstacles) {
      if (ob.doorId !== undefined) ob.disabled = false;
    }
  }

  private startAct2IntroCutscene(): void {
    this.phase = 'act2_intro_cutscene';
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.act2Stage = 'conveyor';
    this.noodlesSeasoned = 0;
    this.noodlesPacked = 0;
    this.packetsInHand = 0;
    this.boxesFound = 0;
    this.mushroomStock = Math.max(40, this.carriedAct1Mushrooms);
    this.bricksDeliveredToTray = 0;
    this.pressAnimTimer = 0;
    this.sachetPlaceAnim = 0;
    this.brickSpawnTimer = 0.3;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.hoveredLockerId = null;
    this.sanyaState = 'dormant';
    this.sanyaTimer = 22.0;
    this.ronerState = 'dormant';
    this.ronerTimer = 34.0;
    this.windowBreachProgress = 0;
    this.syncAct2EnemyAppearance();

    this.clearFactoryDynamicEntities();
    if (this.factoryObjs) {
      for (const tb of this.factoryObjs.conveyor.trayBricks) tb.visible = false;
      for (const pk of this.factoryObjs.conveyor.packedCratePacks) pk.visible = false;
      this.factoryObjs.conveyor.pressHead.position.y = 2.15;
      this.factoryObjs.alarmLight.intensity = 0;
      for (const w of this.factoryObjs.windows) {
        w.glassMesh.visible = true;
        w.beaconMat.emissiveIntensity = 0.2;
      }
      for (const l of this.factoryObjs.lockers) {
        l.doorPivot.rotation.y = -0.42;
      }
      this.resetFactoryDoors();
    }

    this.flashlightOn = false;
    this.fpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.tpFlashlight.group.visible = true;
    this.playerRig.root.visible = true;
    this.playerX = 0;
    this.playerZ = FACTORY_HALF_D - 1.5;
    this.playerY = 0;
    this.playerYaw = Math.PI;
    this.playerRig.root.position.set(0, 0, this.playerZ);
    this.playerRig.root.rotation.y = Math.PI;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
      c.isScream = false;
    }

    this.pushHud(true);
  }

  private updateAct2IntroCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const isEn = this.settings.language === 'en';
    const roner = this.chasers[0];

    if (this.factoryObjs) {
      this.factoryObjs.conveyor.beltTexture.offset.x -= dt * 0.58;
      for (const r of this.factoryObjs.conveyor.rollers) {
        r.rotation.z -= dt * 6.5;
      }
      this.factoryObjs.conveyor.hopperMushrooms.position.y =
        2.52 + Math.sin(elapsed * 3.0) * 0.04;

      const doorOpen = THREE.MathUtils.clamp(t / 1.4, 0, 1);
      const slideBack = t > 4.0 ? THREE.MathUtils.clamp((t - 4.0) / 1.2, 0, 1) : 0;
      const offset = 1.95 + (doorOpen - slideBack * 0.85) * 1.1;
      this.factoryObjs.leftSlidingDoor.position.x = -offset;
      this.factoryObjs.rightSlidingDoor.position.x = offset;
    }

    // Stage 0 (0 - 3.8s): Nikita enters factory & sighs relief
    if (t < 3.8) {
      if (this.cutsceneStage !== 0) {
        this.cutsceneStage = 0;
        const line = getCutsceneLine('act2_intro_0', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDialogueLine(line.speech, 1.04, line.hasCensorBeep);
        this.pushHud(true);
      }
      const walkAlpha = Math.min(1, t / 3.0);
      this.playerX = 0;
      this.playerZ = THREE.MathUtils.lerp(FACTORY_HALF_D - 1.5, 9.8, walkAlpha);
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = Math.PI;
      animateRobloxCharacter(
        this.playerRig,
        walkAlpha < 1 ? 0.95 : 0,
        dt,
        elapsed,
        false,
        false,
        false
      );
    }
    // Stage 1 (3.8 - 7.8s): Conveyor showcase + Nikita cheers
    else if (t < 7.8) {
      if (this.cutsceneStage !== 1) {
        this.cutsceneStage = 1;
        const line = getCutsceneLine('act2_intro_1', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDialogueLine(line.speech, 1.12, line.hasCensorBeep);
        this.pushHud(true);
      }
      const walkAlpha = Math.min(1, (t - 3.8) / 2.8);
      this.playerX = THREE.MathUtils.lerp(0, 1.5, walkAlpha);
      this.playerZ = THREE.MathUtils.lerp(9.8, 3.2, walkAlpha);
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = Math.PI;
      animateRobloxCharacter(
        this.playerRig,
        walkAlpha < 1 ? 0.85 : 0,
        dt,
        elapsed,
        false,
        false,
        false
      );
    }
    // Stage 2a (7.8 - 10.4s): RONER pops up outside Window #1 (x=7.2, z=FACTORY_HALF_D)
    else if (t < 10.4) {
      if (this.cutsceneStage !== 2) {
        this.cutsceneStage = 2;
        this.playerBubbleText = null;
        roner.active = true;
        roner.rig.root.visible = true;
        roner.x = 7.2;
        roner.z = FACTORY_HALF_D + 0.85;
        roner.rig.root.rotation.y = Math.PI;
        const line = getCutsceneLine('act2_intro_2a', this.settings);
        roner.currentBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: 'RONER_552',
          text: line.display,
          tone: 'enemy',
        };
        this.audio.playChaserEmerge();
        this.audio.playDialogueLine(line.speech, 0.96, line.hasCensorBeep);
        this.pushHud(true);
      }
      const pop = Math.min(1, (t - 7.8) / 0.9);
      const ry = THREE.MathUtils.lerp(-0.4, 1.08, pop);
      roner.rig.root.position.set(roner.x, ry, roner.z);
      animateRobloxCharacter(roner.rig, 0, dt, elapsed, false, false, true);
      roner.rig.leftArm.rotation.x = -1.3;
      roner.rig.rightArm.rotation.x = -1.3;

      this.playerRig.root.rotation.y = Math.atan2(7.2 - this.playerX, FACTORY_HALF_D - this.playerZ);
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    }
    // Stage 2b (10.4 - 12.9s): RONER second line
    else if (t < 12.9) {
      if (this.cutsceneStage !== 3) {
        this.cutsceneStage = 3;
        const line = getCutsceneLine('act2_intro_2b', this.settings);
        roner.currentBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: 'RONER_552',
          text: line.display,
          tone: 'enemy',
        };
        this.audio.playDialogueLine(line.speech, 0.94, line.hasCensorBeep);
        this.pushHud(true);
      }
      roner.rig.root.position.set(7.2, 1.08 + Math.sin(elapsed * 8) * 0.04, FACTORY_HALF_D + 0.85);
      animateRobloxCharacter(roner.rig, 0.2, dt, elapsed, false, false, true);
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    }
    // Stage 2c (12.9 - 15.8s): RONER third threat line
    else if (t < 15.8) {
      if (this.cutsceneStage !== 4) {
        this.cutsceneStage = 4;
        const line = getCutsceneLine('act2_intro_2c', this.settings);
        roner.currentBubbleText = line.display;
        roner.isScream = true;
        this.cutsceneSubtitle = {
          speaker: 'RONER_552',
          text: line.display,
          tone: 'enemy',
        };
        this.audio.playDialogueLine(line.speech, 0.92, line.hasCensorBeep);
        this.pushHud(true);
      }
      roner.rig.root.position.set(7.2, 1.08 + Math.sin(elapsed * 12) * 0.05, FACTORY_HALF_D + 0.85);
      animateRobloxCharacter(roner.rig, 0.3, dt, elapsed, false, false, true);
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    }
    // Stage 3 (15.8 - 19.2s): Nikita shines flashlight in RONER's face -> RONER leaves!
    else if (t < 19.2) {
      if (this.cutsceneStage !== 5) {
        this.cutsceneStage = 5;
        this.flashlightOn = true;
        const krysa = getKrysaRetreatLine(this.settings);
        roner.currentBubbleText = krysa.display;
        roner.isScream = false;
        this.cutsceneSubtitle = {
          speaker: 'RONER_552',
          text: krysa.display,
          tone: 'enemy',
        };
        this.audio.playFlashlightClick(true);
        this.audio.playKrysaRetreat(roner.pitch, krysa.speech, krysa.hasCensorBeep);
        this.cameraShake = 0.22;
        this.pushHud(true);
      }
      const retreatAlpha = Math.min(1, (t - 15.8) / 2.2);
      this.playerRig.root.rotation.y = Math.atan2(7.2 - this.playerX, FACTORY_HALF_D - this.playerZ);
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
      this.playerRig.rightArm.rotation.x = -1.55;

      roner.x = THREE.MathUtils.lerp(7.2, 12.0, retreatAlpha);
      roner.rig.root.position.set(roner.x, THREE.MathUtils.lerp(1.08, -0.8, retreatAlpha), FACTORY_HALF_D + 1.1);
      animateRobloxCharacter(roner.rig, 1.1, dt, elapsed, false, false, true, true);
    } else {
      this.beginFactoryPlaying();
    }
  }

  private beginFactoryPlaying(): void {
    this.phase = 'playing';
    this.fog.density = 0.022;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.flashlightOn = true;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.hoveredLockerId = null;
    this.sanyaState = 'dormant';
    this.sanyaTimer = 22.0;
    this.sanyaWaypointIdx = 0;
    this.ronerState = 'dormant';
    this.ronerTimer = 34.0;
    this.windowBreachProgress = 0;
    this.syncAct2EnemyAppearance();

    this.playerX = 0;
    this.playerZ = 4.5;
    this.playerY = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.playerYaw = Math.PI;
    this.camYaw = 0;
    this.camPitch = 0.06;

    this.playerRig.root.visible = false;
    this.fpFlashlight.group.visible = true;
    this.tpFlashlight.group.visible = false;
    this.sachetHand.group.visible = this.packetsInHand > 0;

    if (this.factoryObjs) {
      this.factoryObjs.leftSlidingDoor.position.x = -1.95;
      this.factoryObjs.rightSlidingDoor.position.x = 1.95;
      this.factoryObjs.alarmLight.intensity = 0;
      for (const w of this.factoryObjs.windows) {
        w.glassMesh.visible = true;
        w.beaconMat.emissiveIntensity = 0.2;
      }
      for (const l of this.factoryObjs.lockers) {
        l.doorPivot.rotation.y = -0.42;
      }
      this.resetFactoryDoors();
    }

    this.clearFactoryDynamicEntities();
    // Spawn discoverable Seasoning Boxes across the central hall & storage rack rooms
    for (let i = 0; i < SEASONING_BOX_SPOTS.length; i++) {
      const spot = SEASONING_BOX_SPOTS[i];
      const rig = createSeasoningBoxMesh(this.anisotropy);
      rig.group.position.set(spot.x, 0, spot.z);
      this.scene.add(rig.group);
      this.seasoningBoxes.push({
        id: i + 1,
        x: spot.x,
        z: spot.z,
        available: true,
        respawnTimer: 0,
        rig,
      });
    }

    // Spawn 2 initial noodle bricks on the conveyor belt right away
    for (const startX of [CONVEYOR_START_X + 1.2, CONVEYOR_START_X + 5.8]) {
      const rig = createNoodleBrickMesh(this.anisotropy);
      rig.group.position.set(startX, CONVEYOR_TOP_Y, CONVEYOR_Z);
      this.scene.add(rig.group);
      this.conveyorBricks.push({
        id: this.nextBrickId++,
        x: startX,
        seasoned: false,
        rig,
      });
    }
    this.brickSpawnTimer = 2.0;

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
      c.bubbleTimer = 0;
      c.isScream = false;
      c.lightExposure = 0;
      c.retreatTimer = 0;
      c.retreatCooldown = 0;
      c.stalkPauseTimer = 0;
    }

    this.eventBanner =
      this.settings.language === 'en'
        ? 'ACT 2: Check rack rooms for Seasoning [E], hide in closets [E] if lights flicker, flash [F] RONER at windows!'
        : 'АКТ 2: Ищи приправы на стеллажах [E], прячься в шкаф [E] когда мигает свет, свети [F] в окна от RONER!';
    this.eventBannerTimer = 6.2;
    this.pushHud(true);
    this.callbacks.onBubblesUpdate([]);
  }

  private startFnafEptaMode(): void {
    this.act2Stage = 'conveyor';
    this.noodlesSeasoned = 0;
    this.noodlesPacked = 0;
    this.packetsInHand = 0;
    this.boxesFound = 0;
    this.mushroomStock = 40;
    this.bricksDeliveredToTray = 0;
    this.pressAnimTimer = 0;
    this.sachetPlaceAnim = 0;
    this.hasCorridorKey = false;
    this.fnafMivinasTotal = 0;
    this.fnafBatch = 1;

    this.beginFactoryPlaying();

    this.brickSpawnTimer = 1.0;
    this.sanyaTimer = 15.0;
    this.ronerTimer = 24.0;
    this.eventBanner =
      this.settings.language === 'en'
        ? 'FNAF EPTA (Endless Act 2): Pack batches of 20 Mivinas, hide [E] from Sasha & flash [F] RONER!'
        : 'ФНАФ ЕПТА (Бесконечный Акт 2): Делай партии по 20 мивин! Шкаф [E] от Сани, фонарик [F] в окно от RONER!';
    this.eventBannerTimer = 6.5;
    this.pushHud(true);
  }

  private startAct2DoorCutscene(): void {
    this.phase = 'act2_door_cutscene';
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.heldKeys.clear();
    this.interactPrompt = null;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.sanyaState = 'dormant';
    this.ronerState = 'dormant';
    this.windowBreachProgress = 0;
    this.flashlightOn = false;
    this.fpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.tpFlashlight.group.visible = true;
    this.nikitaSniperRifle.visible = false;
    this.playerRig.root.visible = true;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
      c.isScream = false;
    }

    if (this.factoryObjs) {
      this.factoryObjs.alarmLight.intensity = 0;
      for (let i = 0; i < this.factoryObjs.lampLights.length; i++) {
        this.factoryObjs.lampLights[i].intensity =
          this.factoryObjs.lampBaseIntensities[i];
      }
      this.factoryObjs.bulbMat.emissiveIntensity = 2.0;
      if (this.factoryObjs.corridorDoor1.padlock) {
        this.factoryObjs.corridorDoor1.padlock.visible = false;
      }
      if (this.factoryObjs.corridorDoor1.lockBeaconMat) {
        this.factoryObjs.corridorDoor1.lockBeaconMat.color.setHex(0x22c55e);
        this.factoryObjs.corridorDoor1.lockBeaconMat.emissive.setHex(0x16a34a);
      }
      for (const ob of this.factoryObjs.obstacles) {
        if (ob.doorId === 1) ob.disabled = true;
      }
    }

    this.corridorDoor1Open = true;
    this.audio.playKeyUnlock();
    this.audio.playDoorCreak();

    this.playerX = CORRIDOR_X;
    this.playerZ = -FACTORY_HALF_D + 1.4;
    this.playerY = 0;
    this.playerYaw = Math.PI;
    this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.pushHud(true);
  }

  private updateAct2DoorCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const isEn = this.settings.language === 'en';

    if (this.factoryObjs) {
      const open1 = THREE.MathUtils.clamp(t / 1.1, 0, 1);
      this.factoryObjs.corridorDoor1.doorPivot.rotation.y = 1.55 * open1;
    }

    // Stage 0 (0..3.6s): Nikita opens Door #1, sees Door #2!
    if (t < 3.6) {
      if (this.cutsceneStage !== 0) {
        this.cutsceneStage = 0;
        const line = getCutsceneLine('act2_door_0', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDialogueLine(line.speech, 1.05, line.hasCensorBeep);
        this.pushHud(true);
      }
      const walkA = Math.min(1, t / 2.2);
      this.playerX = CORRIDOR_X;
      this.playerZ = THREE.MathUtils.lerp(-FACTORY_HALF_D + 1.4, -21.4, walkA);
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = Math.PI;
      animateRobloxCharacter(
        this.playerRig,
        walkA < 1 ? 0.85 : 0,
        dt,
        elapsed,
        false,
        false,
        false
      );
    }
    // Stage 1 (3.6..8.2s): Nikita opens Door #2 and beholds the LONG corridor!
    else if (t < 8.2) {
      if (this.cutsceneStage !== 1) {
        this.cutsceneStage = 1;
        this.corridorDoor2Open = true;
        if (this.factoryObjs) {
          for (const ob of this.factoryObjs.obstacles) {
            if (ob.doorId === 2) ob.disabled = true;
          }
        }
        this.audio.playDoorCreak();
        const line = getCutsceneLine('act2_door_1', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDialogueLine(line.speech, 1.02, line.hasCensorBeep);
        this.pushHud(true);
      }
      if (this.factoryObjs) {
        const open2 = THREE.MathUtils.clamp((t - 3.6) / 1.1, 0, 1);
        this.factoryObjs.corridorDoor2.doorPivot.rotation.y = 1.55 * open2;
      }
      const walkB = Math.min(1, (t - 3.6) / 1.6);
      this.playerX = CORRIDOR_X;
      this.playerZ = THREE.MathUtils.lerp(-21.4, -24.2, walkB);
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = Math.PI;
      animateRobloxCharacter(
        this.playerRig,
        walkB < 1 ? 0.75 : 0,
        dt,
        elapsed,
        false,
        false,
        false
      );
    } else {
      this.finishAct2DoorCutscene();
    }
  }

  private finishAct2DoorCutscene(): void {
    this.phase = 'playing';
    this.act2Stage = 'corridor';
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.corridorDoor1Open = true;
    this.corridorDoor2Open = true;
    this.flashlightOn = true;
    this.sanyaState = 'dormant';
    this.sanyaTimer = 6.5;
    this.ronerState = 'dormant';
    this.ronerTimer = 999;

    if (this.factoryObjs) {
      this.factoryObjs.corridorDoor1.doorPivot.rotation.y = 1.55;
      this.factoryObjs.corridorDoor2.doorPivot.rotation.y = 1.55;
      if (this.factoryObjs.corridorDoor1.padlock) {
        this.factoryObjs.corridorDoor1.padlock.visible = false;
      }
      for (const ob of this.factoryObjs.obstacles) {
        if (ob.doorId === 1 || ob.doorId === 2) ob.disabled = true;
      }
    }

    this.playerX = CORRIDOR_X;
    this.playerZ = -25.8;
    this.playerY = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.camYaw = 0;
    this.camPitch = 0.04;
    this.playerYaw = Math.PI;
    this.playerRig.root.visible = false;
    this.fpFlashlight.group.visible = true;
    this.tpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;

    const isEn = this.settings.language === 'en';
    this.eventBanner = isEn
      ? 'Walk down the long corridor to «Exit LOL»! Hide in closets [E] when lights flicker!'
      : 'Иди по длинному коридору к «Выход лол»! Прячься в шкаф [E] когда мигает свет!';
    this.eventBannerTimer = 6.0;
    this.pushHud(true);
    this.callbacks.onBubblesUpdate([]);
  }

  private startAct2OutroCutscene(): void {
    this.phase = 'act2_outro_cutscene';
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.sniperShotFired = false;
    this.tracerLife = 0;
    for (const tr of this.sniperTracers) tr.visible = false;
    this.heldKeys.clear();
    this.interactPrompt = null;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.sanyaState = 'dormant';
    this.ronerState = 'dormant';
    this.windowBreachProgress = 0;
    this.flashlightOn = false;
    this.fpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.tpFlashlight.group.visible = false;
    this.playerRig.root.visible = true;
    this.playerRig.bodyPivot.rotation.x = 0;
    this.playerRig.bodyPivot.position.y = 0;
    this.nikitaSniperRifle.visible = true;

    if (this.factoryObjs) {
      this.factoryObjs.sniperPickup.rifleGroup.visible = false;
      this.factoryObjs.exitLolDoor.leftDoor.rotation.y = 0;
      this.factoryObjs.exitLolDoor.rightDoor.rotation.y = 0;
      this.factoryObjs.alarmLight.intensity = 0;
      for (let i = 0; i < this.factoryObjs.lampLights.length; i++) {
        this.factoryObjs.lampLights[i].intensity =
          this.factoryObjs.lampBaseIntensities[i];
      }
      this.factoryObjs.bulbMat.emissiveIntensity = 2.0;
      for (const w of this.factoryObjs.windows) {
        w.beaconMat.emissiveIntensity = 0.2;
      }
      for (const l of this.factoryObjs.lockers) {
        l.doorPivot.rotation.y = -0.42;
      }
    }

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    // Place Nikita in front of "ВЫХОД ЛОЛ" facing down the corridor (+Z) toward RONER & Sanya
    const outroPlayerZ = CORRIDOR_END_Z + 4.5;
    const enemyStartZ = CORRIDOR_END_Z + 24.0;
    this.playerX = CORRIDOR_X;
    this.playerZ = outroPlayerZ;
    this.playerY = 0;
    this.playerYaw = 0;
    this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;

    for (const c of this.chasers) {
      c.active = true;
      c.rig.root.visible = true;
      c.rig.bodyPivot.rotation.x = 0;
      c.rig.bodyPivot.position.y = 0;
      c.x = c.id === 'roner' ? CORRIDOR_X - 1.15 : CORRIDOR_X + 1.15;
      c.z = enemyStartZ;
      c.rig.root.position.set(c.x, 0, c.z);
      c.rig.root.rotation.y = Math.PI;
      c.isScream = false;
      c.currentBubbleText = null;
    }

    this.pushHud(true);
  }

  private updateAct2OutroCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const isEn = this.settings.language === 'en';
    const roner = this.chasers[0];
    const sasha = this.chasers[1];
    const outroPlayerZ = CORRIDOR_END_Z + 4.5;
    const enemyStartZ = CORRIDOR_END_Z + 24.0;
    const enemyMidZ = CORRIDOR_END_Z + 13.0;
    const exitRunZ = CORRIDOR_END_Z - 3.0;

    // Stage 0 (0..2.7s): Nikita grabs Sniper Rifle -> "ну все им Pizda >:)"
    if (t < 2.7) {
      if (this.cutsceneStage !== 0) {
        this.cutsceneStage = 0;
        this.audio.playBoxPickup();
        const line = getCutsceneLine('act2_final_0', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDialogueLine(line.speech, 1.06, line.hasCensorBeep);
        this.pushHud(true);
      }
      this.playerY = 0;
      this.playerYaw = 0;
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = 0;
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
      this.playerRig.rightArm.rotation.x = -1.25;
      this.playerRig.leftArm.rotation.x = -1.15;
      for (const c of this.chasers) {
        animateRobloxCharacter(c.rig, 0.3, dt, elapsed, false, false, true);
      }
    }
    // Stage 1 (2.7..5.1s): RONER & Sanya approach down the corridor
    else if (t < 5.1) {
      if (this.cutsceneStage !== 1) {
        this.cutsceneStage = 1;
        this.playerBubbleText = null;
        roner.currentBubbleText = isEn ? 'COME HERE!!' : 'НУ ВСЁ, ПОПАЛСЯ!!';
        sasha.currentBubbleText = isEn ? 'GIVE MIVINA!!' : 'ДАЙ МИВИНУ!!';
        this.audio.playChaserEmerge();
      }
      const walkAlpha = Math.min(1, (t - 2.7) / 2.2);
      const enemyZ = THREE.MathUtils.lerp(enemyStartZ, enemyMidZ, walkAlpha);
      for (const c of this.chasers) {
        c.z = enemyZ;
        c.rig.root.position.set(c.x, 0, c.z);
        c.rig.root.rotation.y = Math.PI;
        animateRobloxCharacter(c.rig, 1.15, dt, elapsed, false, false, true);
      }
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
      this.playerRig.rightArm.rotation.x = -1.28;
      this.playerRig.leftArm.rotation.x = -1.15;
    }
    // Stage 2 (5.1..7.6s): 360° JUMP SPIN + DOUBLE SNIPER HEADSHOT!
    else if (t < 7.6) {
      if (this.cutsceneStage !== 2) {
        this.cutsceneStage = 2;
        roner.currentBubbleText = null;
        sasha.currentBubbleText = null;
      }
      const spinAlpha = THREE.MathUtils.clamp((t - 5.1) / 1.45, 0, 1);
      this.playerY = Math.sin(spinAlpha * Math.PI) * 2.55;
      this.playerYaw = spinAlpha * Math.PI * 2;
      this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
      this.playerRig.root.rotation.y = this.playerYaw;
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, true, false, false);
      this.playerRig.rightArm.rotation.x = -1.35;
      this.playerRig.leftArm.rotation.x = -1.25;

      if (t >= 5.9 && !this.sniperShotFired) {
        this.sniperShotFired = true;
        this.audio.playSniperShot();
        this.cameraShake = 0.55;
        this.hitstopTimer = 0.05;
        this.tracerLife = 0.6;

        const muzzleOrigin = _vec3.set(
          this.playerX,
          this.playerY + 1.45,
          this.playerZ + 0.8
        );
        const targets = [roner, sasha];
        for (let i = 0; i < targets.length; i++) {
          const tgt = targets[i];
          tgt.currentBubbleText = 'X_X · HEADSHOT!';
          tgt.isScream = false;
          this.emitParticles(tgt.x, 1.85, tgt.z, 'gold');
          this.floatingTexts.push({
            id: this.nextFloatId++,
            text: '360° HEADSHOT!',
            worldX: tgt.x,
            worldY: 2.75,
            worldZ: tgt.z,
            life: 1.5,
            maxLife: 1.5,
            isGold: true,
          });
          const beam = this.sniperTracers[i];
          if (beam) {
            const headPos = _vec3b.set(tgt.x, 2.05, tgt.z);
            const dist = muzzleOrigin.distanceTo(headPos);
            beam.position.copy(muzzleOrigin).lerp(headPos, 0.5);
            beam.scale.set(1, 1, dist);
            beam.lookAt(headPos);
            beam.visible = true;
          }
        }
      }

      for (const c of this.chasers) {
        animateRobloxCharacter(
          c.rig,
          0,
          dt,
          elapsed,
          false,
          this.sniperShotFired,
          true
        );
      }
    }
    // Stage 3 (7.6..10.9s): "Выход лол" opens, Nikita cheers & runs out!
    else if (t < 10.9) {
      if (this.cutsceneStage !== 3) {
        this.cutsceneStage = 3;
        const line = getCutsceneLine('act2_outro_0', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDoorCreak();
        this.audio.playDialogueLine(line.speech, 1.1, line.hasCensorBeep);
        this.pushHud(true);
      }
      if (this.factoryObjs) {
        const doorOpen = THREE.MathUtils.clamp((t - 7.6) / 0.9, 0, 1);
        this.factoryObjs.exitLolDoor.leftDoor.rotation.y = -1.5 * doorOpen;
        this.factoryObjs.exitLolDoor.rightDoor.rotation.y = 1.5 * doorOpen;
      }
      const runAlpha = THREE.MathUtils.clamp((t - 8.1) / 2.6, 0, 1);
      this.playerY = 0;
      this.playerYaw = Math.PI;
      this.playerZ = THREE.MathUtils.lerp(outroPlayerZ, exitRunZ, runAlpha);
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = this.playerYaw;
      animateRobloxCharacter(this.playerRig, 1.35, dt, elapsed, false, false, false);
      this.playerRig.rightArm.rotation.x = -1.1;

      for (const c of this.chasers) {
        animateRobloxCharacter(c.rig, 0, dt, elapsed, false, true, true);
      }
    } else {
      this.finishAct2Victory();
    }
  }

  private finishAct2Victory(): void {
    this.phase = 'victory';
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.interactPrompt = null;
    this.nikitaSniperRifle.visible = false;
    for (const tr of this.sniperTracers) tr.visible = false;
    const unlocked = unlockSingleAchievement(this.achievements, 'act2_clear');
    this.emitAchievementResult(unlocked);
    this.audio.playVictoryFanfare();
    this.pushHud(true);
  }

  public togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.heldKeys.clear();
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
      this.pushHud(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.clock.getDelta();
      this.pushHud(true);
    }
  }

  public setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  public setVirtualMove(dx: number, dz: number): void {
    this.virtualMoveX = dx;
    this.virtualMoveZ = dz;
  }

  public setVirtualSprint(sprint: boolean): void {
    this.virtualSprint = sprint;
  }

  public triggerJump(): void {
    this.audio.unlock();
    this.jumpBufferTimer = 0.14;
  }

  private clearMushrooms(): void {
    for (const m of this.mushrooms) {
      this.scene.remove(m.mesh);
    }
    this.mushrooms = [];
  }

  private rebuildMushroomsWithTexture(): void {
    const oldList = [...this.mushrooms];
    this.clearMushrooms();
    for (const old of oldList) {
      this.spawnMushroomAt(old.x, old.z, old.isGolden);
    }
  }

  private spawnMushroomAt(x: number, z: number, isGolden: boolean): void {
    const y = groundHeightAt(x, z);
    const mesh = createProstophilyaMushroom(this.anisotropy, this.memeTexture, isGolden);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.mushrooms.push({
      id: this.nextMushroomId++,
      x,
      z,
      y,
      isGolden,
      mesh,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private spawnArenaMushroom(allowGolden = true): void {
    for (let attempt = 0; attempt < 30; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 6 + Math.sqrt(Math.random()) * (PLAY_RADIUS - 10);
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      if (Math.hypot(x - this.playerX, z - this.playerZ) < 6) continue;
      let blocked = false;
      for (const o of this.layout.obstacles) {
        if (Math.hypot(x - o.x, z - o.z) < o.radius + 1.2) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      for (const m of this.mushrooms) {
        if (Math.hypot(x - m.x, z - m.z) < 5.5) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      const isGolden = allowGolden && Math.random() < 0.16;
      this.spawnMushroomAt(x, z, isGolden);
      return;
    }
  }

  private spawnChaserFromForest(chaser: ChaserEntity, angleOffset: number): void {
    let sx = 0;
    let sz = 0;

    if (this.mode === 'story_act1') {
      // Always spawn ahead of the player out in the dense fog along the winding trail
      sz = Math.max(
        STORY_END_Z + 12,
        this.playerZ - (24 + Math.random() * 10)
      );
      sx = storyPathCenterX(sz) + (angleOffset > 0 ? 2.4 : -2.4);
    } else {
      // Always spawn in front of where the player/camera is looking!
      const forwardAng = this.camYaw + Math.PI;
      const spawnDist = 23 + Math.random() * 5;
      const baseAng = forwardAng + angleOffset * 0.65;
      sx = THREE.MathUtils.clamp(
        this.playerX + Math.sin(baseAng) * spawnDist,
        -PLAY_RADIUS + 3,
        PLAY_RADIUS - 3
      );
      sz = THREE.MathUtils.clamp(
        this.playerZ + Math.cos(baseAng) * spawnDist,
        -PLAY_RADIUS + 3,
        PLAY_RADIUS - 3
      );
    }

    chaser.active = true;
    chaser.x = sx;
    chaser.z = sz;
    chaser.yaw = Math.atan2(this.playerX - sx, this.playerZ - sz);
    chaser.lightExposure = 0;
    chaser.retreatTimer = 0;
    chaser.retreatCooldown = 0;
    chaser.stalkPauseTimer = 0;
    chaser.rig.root.visible = true;
    chaser.rig.root.position.set(sx, groundHeightAt(sx, sz), sz);
    chaser.rig.root.rotation.y = chaser.yaw;
    const standardPhrases = getStandardChaserPhrases(this.settings);
    const initialPhrase =
      chaser.id === 'roner' ? standardPhrases[0] : standardPhrases[1];
    chaser.currentBubbleText = initialPhrase.display;
    chaser.bubbleTimer = 2.8;
    chaser.tauntTimer = 4.6 + Math.random() * 2.4;
    chaser.isScream = false;

    this.audio.playChaserEmerge();
    this.audio.playTaunt(initialPhrase.speech, chaser.pitch, true);
    this.eventBanner =
      this.settings.language === 'en'
        ? `${chaser.name} emerged from the fog ahead!`
        : `${chaser.name} вышел из тумана спереди!`;
    this.eventBannerTimer = 2.6;
  }

  private emitParticles(
    x: number,
    y: number,
    z: number,
    colorMode: 'gold' | 'green' | 'battery'
  ): void {
    let spawned = 0;
    for (const p of this.particlePool) {
      if (p.life > 0) continue;
      p.life = 0.65;
      p.maxLife = 0.65;
      const ang = Math.random() * Math.PI * 2;
      const spd = 2.2 + Math.random() * 3.5;
      p.vx = Math.cos(ang) * spd;
      p.vy = 2.8 + Math.random() * 3.8;
      p.vz = Math.sin(ang) * spd;
      p.mesh.position.set(x, y + 0.6, z);
      p.mesh.scale.setScalar(1);
      const col =
        colorMode === 'gold'
          ? 0xfacc15
          : colorMode === 'battery'
            ? 0x38bdf8
            : spawned % 2 === 0
              ? 0x4ade80
              : 0xd97706;
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(col);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
      p.mesh.visible = true;
      spawned++;
      if (spawned >= 14) break;
    }
  }

  private resolveObstacleCollision(
    x: number,
    z: number,
    actorRadius: number
  ): { x: number; z: number } {
    let nx = x;
    let nz = z;

    for (let i = 0; i < this.layout.obstacles.length; i++) {
      const o: ObstacleCircle = this.layout.obstacles[i];
      const dx = nx - o.x;
      const dz = nz - o.z;
      const minD = o.radius + actorRadius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minD * minD) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = minD - dist;
        nx += (dx / dist) * push;
        nz += (dz / dist) * push;
      }
    }

    if (this.mode === 'story_act1') {
      nz = THREE.MathUtils.clamp(nz, STORY_END_Z - 1.5, STORY_START_Z + 0.5);
      const cx = storyPathCenterX(nz);
      const maxOffset = STORY_PATH_HALF_WIDTH + 4.5;
      nx = THREE.MathUtils.clamp(nx, cx - maxOffset, cx + maxOffset);
    } else {
      const r = Math.hypot(nx, nz);
      if (r > PLAY_RADIUS - 1.5) {
        const clampScale = (PLAY_RADIUS - 1.5) / r;
        nx *= clampScale;
        nz *= clampScale;
      }
    }

    return { x: nx, z: nz };
  }

  private updateIntroCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const isEn = this.settings.language === 'en';

    // Swing start gate open smoothly
    if (this.startGate) {
      const openAmt = Math.min(1, t / 1.8);
      this.startGate.leftDoor.rotation.y = -1.45 * openAmt;
      this.startGate.rightDoor.rotation.y = 1.45 * openAmt;
    }

    // Stage 0 (0 - 4.8s): Nikita walks inside the gate & speaks about Mivina (extended so voice finishes)
    if (t < 4.8) {
      if (this.cutsceneStage !== 0) {
        this.cutsceneStage = 0;
        const line = getCutsceneLine('intro_0', this.settings);
        this.playerBubbleText = line.display;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playDialogueLine(line.speech, 1.02, line.hasCensorBeep);
        this.pushHud(true);
      }
      const walkAlpha = Math.min(1, t / 3.0);
      this.playerZ = THREE.MathUtils.lerp(5.2, -1.6, walkAlpha);
      this.playerY = groundHeightAt(this.playerX, this.playerZ);
      this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
      animateRobloxCharacter(
        this.playerRig,
        walkAlpha < 1 ? 0.85 : 0,
        dt,
        elapsed,
        false,
        false,
        false
      );
    }
    // Stage 1 (4.8 - 9.6s): Chasers 2 & 3 emerge and threaten Nikita (extended for full voiceover)
    else if (t < 9.6) {
      if (this.cutsceneStage !== 1) {
        this.cutsceneStage = 1;
        this.playerBubbleText = null;
        this.chasers[0].rig.root.visible = true;
        this.chasers[1].rig.root.visible = true;
        const line = getCutsceneLine('intro_1', this.settings);
        const sideLine = getCutsceneLine('intro_1_b', this.settings);
        this.chasers[0].currentBubbleText = line.display;
        this.chasers[1].currentBubbleText = sideLine.display;
        this.cutsceneSubtitle = {
          speaker: 'RONER_552 & sasha55k_XL',
          text: line.display,
          tone: 'enemy',
        };
        this.audio.playChaserEmerge();
        this.audio.playDialogueLine(line.speech, 0.94, line.hasCensorBeep);
        this.pushHud(true);
      }

      const stepAlpha = Math.min(1, (t - 4.8) / 2.4);
      this.chasers[0].x = THREE.MathUtils.lerp(-4.0, -1.7, stepAlpha);
      this.chasers[0].z = THREE.MathUtils.lerp(-11.5, -6.5, stepAlpha);
      this.chasers[1].x = THREE.MathUtils.lerp(4.0, 1.7, stepAlpha);
      this.chasers[1].z = THREE.MathUtils.lerp(-11.5, -6.7, stepAlpha);

      for (const c of this.chasers) {
        const cy = groundHeightAt(c.x, c.z);
        c.rig.root.position.set(c.x, cy, c.z);
        c.rig.root.rotation.y = Math.atan2(this.playerX - c.x, this.playerZ - c.z);
        animateRobloxCharacter(
          c.rig,
          stepAlpha < 1 ? 0.9 : 0,
          dt,
          elapsed,
          false,
          false,
          true
        );
      }
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    }
    // Stage 2 (9.6 - 12.8s): Nikita shouts & shines flashlight in their faces!
    else if (t < 12.8) {
      if (this.cutsceneStage !== 2) {
        this.cutsceneStage = 2;
        this.chasers[0].currentBubbleText = null;
        this.chasers[1].currentBubbleText = null;
        const line = getCutsceneLine('intro_2', this.settings);
        this.playerBubbleText = line.display;
        this.flashlightOn = true;
        this.cutsceneSubtitle = {
          speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
          text: line.display,
          tone: 'nikita',
        };
        this.audio.playFlashlightClick(true);
        this.audio.playDialogueLine(line.speech, 1.2, line.hasCensorBeep);
        this.cameraShake = 0.25;
        this.pushHud(true);
      }
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
      // Aim flashlight straight into their faces!
      this.playerRig.rightArm.rotation.x = -1.55;
      for (const c of this.chasers) {
        animateRobloxCharacter(c.rig, 0.4, dt, elapsed, false, false, true, true);
      }
    }
    // Stage 3 (12.8 - 16.5s): Enemies recoil & yell (extended for full voiceover)
    else if (t < 16.5) {
      if (this.cutsceneStage !== 3) {
        this.cutsceneStage = 3;
        this.playerBubbleText = null;
        const line = getCutsceneLine('intro_3', this.settings);
        this.chasers[0].currentBubbleText = line.display;
        this.chasers[1].currentBubbleText = line.display;
        this.chasers[0].isScream = true;
        this.chasers[1].isScream = true;
        this.cutsceneSubtitle = {
          speaker: 'RONER_552 & sasha55k_XL',
          text: line.display,
          tone: 'enemy',
        };
        this.audio.playDialogueLine(line.speech, 0.96, line.hasCensorBeep);
        this.pushHud(true);
      }
      const backAlpha = Math.min(1, (t - 12.8) / 2.4);
      this.chasers[0].z = THREE.MathUtils.lerp(-6.5, -15.5, backAlpha);
      this.chasers[1].z = THREE.MathUtils.lerp(-6.7, -16.5, backAlpha);
      for (const c of this.chasers) {
        const cy = groundHeightAt(c.x, c.z);
        c.rig.root.position.set(c.x, cy, c.z);
        animateRobloxCharacter(c.rig, 1.1, dt, elapsed, false, false, true, true);
      }
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    } else {
      this.beginActivePlay(true);
    }
  }

  private updateOutroCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const endX = storyPathCenterX(STORY_END_Z);
    const isEn = this.settings.language === 'en';

    if (this.factoryGate) {
      const openAmt = Math.min(1, t / 1.1);
      this.factoryGate.leftDoor.rotation.y = -1.48 * openAmt;
      this.factoryGate.rightDoor.rotation.y = 1.48 * openAmt;
    }

    if (this.cutsceneStage !== 0) {
      this.cutsceneStage = 0;
      const line = getCutsceneLine('outro_0', this.settings);
      this.playerBubbleText = line.display;
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
      this.audio.playDialogueLine(line.speech, 1.16, line.hasCensorBeep);
      this.pushHud(true);
    }

    const runAlpha = Math.min(1, t / 3.8);
    this.playerX = endX;
    this.playerZ = THREE.MathUtils.lerp(STORY_END_Z + 5.5, STORY_END_Z - 8.5, runAlpha);
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    // Once past gate, glance back triumphantly!
    this.playerYaw = runAlpha > 0.72 ? 0 : Math.PI;
    this.playerRig.root.rotation.y = this.playerYaw;
    animateRobloxCharacter(
      this.playerRig,
      runAlpha < 0.85 ? 1.25 : 0,
      dt,
      elapsed,
      false,
      false,
      false
    );

    // Chasers stall outside the factory gate
    for (const c of this.chasers) {
      const zTarget = STORY_END_Z + 4.5;
      c.z = THREE.MathUtils.lerp(c.z, zTarget, Math.min(1, dt * 1.4));
      const cy = groundHeightAt(c.x, c.z);
      c.rig.root.position.set(c.x, cy, c.z);
      c.rig.root.rotation.y = Math.atan2(this.playerX - c.x, this.playerZ - c.z);
      animateRobloxCharacter(c.rig, 0.2, dt, elapsed, false, false, true);
    }

    if (t >= 6.8) {
      this.beginAct2Teaser(false);
    }
  }

  private updateAct2Teaser(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const endX = storyPathCenterX(STORY_END_Z);
    const isEn = this.settings.language === 'en';

    if (this.isSecretPreviewOnly) {
      // Secret view: simply showcases Мивина Корпорейшен with slightly ajar doors (no Act 1 completion)
      if (this.cutsceneStage !== 0) {
        this.cutsceneStage = 0;
        const line = getCutsceneLine('act2_secret', this.settings);
        this.cutsceneSubtitle = {
          speaker: isEn
            ? 'SECRET · «MIVINA CORPORATION»'
            : 'СЕКРЕТ · «МИВИНА КОРПОРЕЙШЕН»',
          text: line.display,
          tone: 'enemy',
        };
        this.audio.playDialogueLine(line.speech, 1.0);
        this.pushHud(true);
      }
      if (this.factoryBuilding) {
        // Keep doors slightly ajar with gentle eerie flicker spilling through the gap
        this.factoryBuilding.leftSlidingDoor.position.x = -1.68;
        this.factoryBuilding.rightSlidingDoor.position.x = 1.68;
        this.factoryBuilding.corridorLight.intensity =
          18 + Math.sin(elapsed * 18) * 7 + (Math.sin(elapsed * 6) > 0.65 ? 10 : 0);
        this.factoryBuilding.bossEyes.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.12);
      }
      return;
    }

    // Legitimate Act 1 completion teaser after beating all 1000m + 40 mushrooms
    if (this.cutsceneStage !== 0) {
      this.cutsceneStage = 0;
      const line = getCutsceneLine('act2_teaser', this.settings);
      this.playerBubbleText = isEn
        ? 'Whoa... the doors are ajar!'
        : 'Ого... двери приоткрыты!';
      this.cutsceneSubtitle = {
        speaker: isEn
          ? 'MIVINA CORPORATION · ACT 2 (SOON)'
          : 'МИВИНА КОРПОРЕЙШЕН · АКТ 2 (СКОРО)',
        text: line.display,
        tone: 'nikita',
      };
      this.audio.playChaserEmerge();
      this.audio.playDialogueLine(line.speech, 1.04);
      this.pushHud(true);
    }

    const walkAlpha = Math.min(1, t / 2.8);
    this.playerX = endX;
    this.playerZ = THREE.MathUtils.lerp(STORY_END_Z - 4.5, STORY_END_Z - 8.2, walkAlpha);
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerYaw = Math.PI;
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    animateRobloxCharacter(
      this.playerRig,
      walkAlpha < 1 ? 0.75 : 0,
      dt,
      elapsed,
      false,
      false,
      false
    );

    if (this.factoryBuilding) {
      this.factoryBuilding.leftSlidingDoor.position.x = -1.68;
      this.factoryBuilding.rightSlidingDoor.position.x = 1.68;
      this.factoryBuilding.corridorLight.intensity =
        18 + Math.sin(elapsed * 20) * 8;
      this.factoryBuilding.bossEyes.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.12);
    }

    if (t >= 5.6) {
      this.finishStoryVictory();
    }
  }

  private updateFlashlightRig(elapsed: number, hasMove: boolean): void {
    const isFactoryMode = this.mode === 'story_act2' || this.mode === 'fnaf_epta';
    const isSniperMode = this.mode === 'sniper_minigame';
    const isAct3Sniper = this.mode === 'story_act3' && this.act3HasSniper && this.phase === 'playing';
    const isFP =
      this.mode === 'first_person' ||
      this.mode === 'story_act1' ||
      this.mode === 'story_act3' ||
      isFactoryMode ||
      isSniperMode;
    const isPlaying = this.phase === 'playing';

    if (
      this.phase === 'act3_secret' ||
      this.phase === 'act3_intro_cutscene' ||
      this.phase === 'act3_outro_cutscene'
    ) {
      this.flashlightSpot.visible = false;
      this.fpFlashlight.group.visible = false;
      this.tpFlashlight.group.visible = false;
      this.sachetHand.group.visible = false;
      this.fpSniper.group.visible = false;
      this.fpSniper.muzzleFlash.visible = false;
      return;
    }

    if (this.phase === 'title') {
      this.fpSniper.group.visible = false;
      this.fpSniper.muzzleFlash.visible = false;
      if (isSniperMode || this.mode === 'story_act3') {
        this.flashlightSpot.visible = true;
        this.flashlightSpot.intensity = 22;
        this.flashlightSpot.position.set(0, 8, 6);
        this.flashlightTarget.position.set(0, 1, -8);
        this.tpFlashlight.group.visible = this.mode === 'story_act3';
        return;
      }
      this.flashlightSpot.visible = true;
      this.flashlightSpot.intensity = 34;
      this.flashlightSpot.position.set(
        this.playerX + Math.sin(this.playerYaw) * 0.45,
        this.playerY + 1.35,
        this.playerZ + Math.cos(this.playerYaw) * 0.45
      );
      this.flashlightTarget.position.set(
        this.playerX + Math.sin(this.playerYaw) * 9,
        this.playerY + 0.9,
        this.playerZ + Math.cos(this.playerYaw) * 9
      );
      this.tpFlashlight.beamCone.visible = true;
      this.tpFlashlight.lensMat.emissiveIntensity = 2.2;
      return;
    }

    if (this.phase === 'intro_cutscene') {
      this.fpSniper.group.visible = false;
      const flashOn = this.cutsceneStage >= 2;
      this.flashlightSpot.visible = flashOn;
      this.flashlightSpot.intensity = flashOn ? 75 : 0;
      this.tpFlashlight.beamCone.visible = flashOn;
      this.tpFlashlight.lensMat.emissiveIntensity = flashOn ? 3.5 : 0.1;
      this.flashlightSpot.position.set(this.playerX, this.playerY + 1.5, this.playerZ - 0.5);
      this.flashlightTarget.position.set(0, groundHeightAt(0, -7) + 1.6, -7.5);
      return;
    }

    if (this.phase === 'act2_intro_cutscene') {
      this.fpSniper.group.visible = false;
      const flashOn = this.cutsceneStage >= 5;
      this.flashlightSpot.visible = flashOn;
      this.flashlightSpot.intensity = flashOn ? 78 : 0;
      this.tpFlashlight.beamCone.visible = flashOn;
      this.tpFlashlight.lensMat.emissiveIntensity = flashOn ? 3.5 : 0.1;
      this.flashlightSpot.position.set(this.playerX + 0.3, 1.55, this.playerZ + 0.5);
      this.flashlightTarget.position.set(7.2, 2.2, FACTORY_HALF_D + 0.8);
      return;
    }

    if ((isSniperMode || isAct3Sniper) && isPlaying) {
      this.fpFlashlight.group.visible = false;
      this.tpFlashlight.group.visible = false;
      this.sachetHand.group.visible = false;

      const swayX = hasMove
        ? Math.sin(elapsed * 9) * 0.015
        : Math.sin(elapsed * 1.8) * 0.004;
      const swayY = hasMove
        ? Math.abs(Math.cos(elapsed * 9)) * 0.014
        : Math.cos(elapsed * 1.6) * 0.004;
      const kick = this.sniperRecoil;
      _vec3.set(0.28 + swayX, -0.25 - swayY + kick * 0.035, -0.5 + kick * 0.12);
      _vec3.applyQuaternion(this.camera.quaternion);
      this.fpSniper.group.visible = true;
      this.fpSniper.group.position.copy(this.camera.position).add(_vec3);
      this.fpSniper.group.quaternion.copy(this.camera.quaternion);
      this.fpSniper.group.rotateY(0.03);
      this.fpSniper.group.rotateX(kick * 0.14);
      this.fpSniper.muzzleFlash.visible = this.sniperMuzzleTimer > 0;

      this.flashlightSpot.visible = this.flashlightOn;
      this.flashlightSpot.intensity = 34;
      this.camera.getWorldDirection(_beamDir);
      _beamOrigin.copy(this.camera.position).addScaledVector(_beamDir, 0.3);
      this.flashlightSpot.position.copy(_beamOrigin);
      this.flashlightTarget.position.copy(_beamOrigin).addScaledVector(_beamDir, 18);
      return;
    }

    this.fpSniper.group.visible = false;
    this.fpSniper.muzzleFlash.visible = false;

    const activeOn = this.flashlightOn && (isPlaying || this.phase === 'paused');
    this.flashlightSpot.visible = activeOn;
    this.flashlightSpot.intensity = isFP ? 58 : 52;
    this.fpFlashlight.beamCone.visible = activeOn && isFP && isPlaying && !this.isHidingInLocker;
    this.tpFlashlight.beamCone.visible = activeOn && !isFP;
    this.fpFlashlight.lensMat.emissiveIntensity = activeOn ? 2.4 : 0.1;
    this.tpFlashlight.lensMat.emissiveIntensity = activeOn ? 2.4 : 0.1;

    if (isFP && isPlaying) {
      const swayX = hasMove
        ? Math.sin(elapsed * 9) * 0.018
        : Math.sin(elapsed * 1.8) * 0.004;
      const swayY = hasMove
        ? Math.abs(Math.cos(elapsed * 9)) * 0.018
        : Math.cos(elapsed * 1.6) * 0.004;
      _vec3.set(0.32 + swayX, -0.24 - swayY, -0.49);
      _vec3.applyQuaternion(this.camera.quaternion);
      this.fpFlashlight.group.visible = !this.isHidingInLocker;
      this.fpFlashlight.group.position.copy(this.camera.position).add(_vec3);
      this.fpFlashlight.group.quaternion.copy(this.camera.quaternion);
      this.fpFlashlight.group.rotateY(0.05);
      this.fpFlashlight.group.rotateX(0.02);

      // Update left-hand seasoning packet viewmodel in Act 2 / FNAF Epta
      if (isFactoryMode && this.packetsInHand > 0 && !this.isHidingInLocker) {
        this.sachetHand.group.visible = true;
        const thrustZ = this.sachetPlaceAnim > 0 ? Math.sin((this.sachetPlaceAnim / 0.28) * Math.PI) * 0.24 : 0;
        _vec3b.set(-0.34 - swayX, -0.26 - swayY, -0.48 - thrustZ);
        _vec3b.applyQuaternion(this.camera.quaternion);
        this.sachetHand.group.position.copy(this.camera.position).add(_vec3b);
        this.sachetHand.group.quaternion.copy(this.camera.quaternion);
        this.sachetHand.group.rotateY(-0.08);
        this.sachetHand.group.rotateX(this.sachetPlaceAnim > 0 ? -0.35 : 0.05);
      } else {
        this.sachetHand.group.visible = false;
      }

      this.camera.getWorldDirection(_beamDir);
      _beamOrigin.copy(this.camera.position).addScaledVector(_beamDir, 0.3);
      this.flashlightSpot.position.copy(_beamOrigin);
      this.flashlightTarget.position.copy(_beamOrigin).addScaledVector(_beamDir, 12);
    } else {
      this.sachetHand.group.visible = false;
      const fx = Math.sin(this.playerYaw);
      const fz = Math.cos(this.playerYaw);
      _beamOrigin.set(
        this.playerX + fx * 0.55,
        this.playerY + 1.35,
        this.playerZ + fz * 0.55
      );
      _beamDir.set(fx, -0.08, fz).normalize();
      this.flashlightSpot.position.copy(_beamOrigin);
      this.flashlightTarget.position.copy(_beamOrigin).addScaledVector(_beamDir, 12);
    }
  }

  private getFactoryRegion(
    x: number,
    z: number
  ): 'center' | 'west' | 'north' | 'east' | 'corridor' {
    if (z < -FACTORY_HALF_D) return 'corridor';
    if (z <= -7.5) return 'north';
    if (x < -13.2) return 'west';
    if (x > 14.2) return 'east';
    return 'center';
  }

  private getFactoryNavTarget(
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number
  ): { x: number; z: number } {
    const rFrom = this.getFactoryRegion(fromX, fromZ);
    const rTo = this.getFactoryRegion(toX, toZ);
    if (rFrom === rTo) return { x: toX, z: toZ };

    if (rFrom === 'corridor') {
      return { x: CORRIDOR_X, z: -FACTORY_HALF_D + 1.0 };
    }
    if (rTo === 'corridor') {
      if (rFrom === 'north') return { x: CORRIDOR_X, z: -FACTORY_HALF_D - 1.2 };
      if (rFrom === 'east') return { x: 19.5, z: -7.5 };
      if (rFrom === 'west') return { x: -18.5, z: -7.5 };
      return { x: 6.0, z: -7.5 };
    }

    if (rFrom === 'west') {
      if (rTo === 'north') return { x: -18.5, z: -7.5 };
      return fromZ > 9.0 ? { x: -13.2, z: 13.5 } : { x: -13.2, z: 4.25 };
    }
    if (rFrom === 'east') {
      if (rTo === 'north') return { x: 19.5, z: -7.5 };
      return fromZ > 4.0 ? { x: 14.2, z: 10.25 } : { x: 14.2, z: -3.0 };
    }
    if (rFrom === 'north') {
      if (rTo === 'west') return { x: -18.5, z: -7.5 };
      if (rTo === 'east') return { x: 19.5, z: -7.5 };
      return fromX < 0.25 ? { x: -5.5, z: -7.5 } : { x: 6.0, z: -7.5 };
    }
    // rFrom === 'center'
    if (rTo === 'west') {
      return fromZ > 9.0 ? { x: -13.2, z: 13.5 } : { x: -13.2, z: 4.25 };
    }
    if (rTo === 'east') {
      return fromZ > 4.0 ? { x: 14.2, z: 10.25 } : { x: 14.2, z: -3.0 };
    }
    // rTo === 'north'
    return toX < 0.25 ? { x: -5.5, z: -7.5 } : { x: 6.0, z: -7.5 };
  }

  private hasFactoryLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
    const r1 = this.getFactoryRegion(x1, z1);
    const r2 = this.getFactoryRegion(x2, z2);
    return r1 === r2;
  }

  private resolveFactoryCollision(
    x: number,
    z: number,
    actorRadius: number,
    ignoreLockerId: number | null = null
  ): { x: number; z: number } {
    let nz = THREE.MathUtils.clamp(
      z,
      CORRIDOR_END_Z + 0.55 + actorRadius,
      FACTORY_HALF_D - 0.9 - actorRadius
    );
    let nx =
      nz < -FACTORY_HALF_D
        ? THREE.MathUtils.clamp(
            x,
            CORRIDOR_X - CORRIDOR_HALF_W + 0.35 + actorRadius,
            CORRIDOR_X + CORRIDOR_HALF_W - 0.35 - actorRadius
          )
        : THREE.MathUtils.clamp(
            x,
            -FACTORY_HALF_W + 0.9 + actorRadius,
            FACTORY_HALF_W - 0.9 - actorRadius
          );

    if (this.factoryObjs) {
      for (const ob of this.factoryObjs.obstacles) {
        if (ob.disabled) continue;
        if (ignoreLockerId !== null && ob.lockerId === ignoreLockerId) continue;
        const dx = nx - ob.x;
        const dz = nz - ob.z;
        const limitX = ob.halfW + actorRadius;
        const limitZ = ob.halfD + actorRadius;
        if (Math.abs(dx) < limitX && Math.abs(dz) < limitZ) {
          const overlapX = limitX - Math.abs(dx);
          const overlapZ = limitZ - Math.abs(dz);
          if (overlapX < overlapZ) {
            nx += dx >= 0 ? overlapX : -overlapX;
          } else {
            nz += dz >= 0 ? overlapZ : -overlapZ;
          }
        }
      }
    }

    return { x: nx, z: nz };
  }

  public interactFactory(): void {
    if (
      this.phase !== 'playing' ||
      (this.mode !== 'story_act2' && this.mode !== 'fnaf_epta')
    ) {
      return;
    }
    this.audio.unlock();
    const isFnaf = this.mode === 'fnaf_epta';
    const isEn = this.settings.language === 'en';

    // 0) Exit Closet if currently hiding inside one
    if (this.isHidingInLocker && this.hiddenLockerId !== null && this.factoryObjs) {
      const locker = this.factoryObjs.lockers.find((l) => l.id === this.hiddenLockerId);
      this.isHidingInLocker = false;
      this.hiddenLockerId = null;
      if (locker) {
        locker.doorPivot.rotation.y = -0.42;
        const resolved = this.resolveFactoryCollision(
          locker.exitX,
          locker.exitZ,
          0.55,
          locker.id
        );
        this.playerX = resolved.x;
        this.playerZ = resolved.z;
      } else {
        this.playerX = this.preHideX;
        this.playerZ = this.preHideZ;
      }
      this.audio.playLockerToggle(false);
      this.pushHud(true);
      return;
    }

    // 1) Pick up Sniper Rifle at "Выход лол"
    if (!isFnaf && this.hoveredSniper && this.act2Stage === 'corridor') {
      this.startAct2OutroCutscene();
      return;
    }

    // 2) Unlock Padlocked Corridor Door #1
    if (this.hoveredDoor1 && !this.corridorDoor1Open) {
      if (isFnaf) {
        this.audio.playBrickReturn();
        this.eventBanner = isEn
          ? 'In «FNAF Epta», keep crafting endless batches of 20 Mivinas!'
          : 'В «Фнаф Епта» делай бесконечные партии мивины в этом цехе!';
        this.eventBannerTimer = 3.2;
        this.pushHud(true);
      } else if (this.hasCorridorKey) {
        this.startAct2DoorCutscene();
      } else {
        this.audio.playBrickReturn();
        this.eventBanner = isEn
          ? 'Locked! Pack 20 Mivinas at the Press to get the Key!'
          : 'Дверь на замке! Упакуй 20 мивин на прессе, чтобы получить ключ!';
        this.eventBannerTimer = 3.2;
        this.pushHud(true);
      }
      return;
    }

    // 3) Enter Hovered Closet («Шкаф»)
    if (this.hoveredLockerId !== null && this.factoryObjs) {
      const locker = this.factoryObjs.lockers.find((l) => l.id === this.hoveredLockerId);
      if (locker) {
        this.preHideX = this.playerX;
        this.preHideZ = this.playerZ;
        this.isHidingInLocker = true;
        this.hiddenLockerId = locker.id;
        this.playerX = locker.x;
        this.playerZ = locker.z;
        this.playerY = 0;
        this.playerVy = 0;
        this.lockerCenterCamYaw = Math.atan2(
          -Math.sin(locker.yaw),
          -Math.cos(locker.yaw)
        );
        this.camYaw = this.lockerCenterCamYaw;
        this.camPitch = 0.04;
        locker.doorPivot.rotation.y = 0.0; // Shut door cleanly so player peeks through slats!
        this.audio.playLockerToggle(true);
        this.pushHud(true);
        return;
      }
    }

    if (this.hoveredPacker && this.act2Stage === 'packaging') {
      if (this.pressAnimTimer > 0.08) return;
      this.pressAnimTimer = 0.55;
      const prevPacked = this.noodlesPacked;
      this.noodlesPacked = Math.min(ACT2_TARGET_MIVINAS, this.noodlesPacked + 4);
      const added = this.noodlesPacked - prevPacked;

      if (isFnaf && added > 0) {
        this.fnafMivinasTotal += added;
        if (this.fnafMivinasTotal > this.bestFnafMivinas) {
          this.bestFnafMivinas = this.fnafMivinasTotal;
          try {
            localStorage.setItem(BEST_FNAF_KEY, String(this.bestFnafMivinas));
          } catch {}
        }
        this.achievements.totalFnafMivinas += added;
        const unlocked = evaluateStatAchievements(this.achievements);
        this.emitAchievementResult(unlocked);
      }

      if (this.factoryObjs) {
        for (let i = 0; i < this.factoryObjs.conveyor.packedCratePacks.length; i++) {
          this.factoryObjs.conveyor.packedCratePacks[i].visible = i < this.noodlesPacked;
        }
      }
      this.cameraShake = 0.22;
      this.audio.playPackStamp();
      this.emitParticles(PACKER_POS.x + 0.55, 1.35, CONVEYOR_Z, 'gold');
      this.floatingTexts.push({
        id: this.nextFloatId++,
        text: isEn
          ? `+4 PACKED (${this.noodlesPacked}/20)`
          : `+4 УПАКОВАНО (${this.noodlesPacked}/20)`,
        worldX: PACKER_POS.x + 0.55,
        worldY: 2.2,
        worldZ: CONVEYOR_Z,
        life: 1.2,
        maxLife: 1.2,
        isGold: true,
      });

      if (this.noodlesPacked >= ACT2_TARGET_MIVINAS) {
        if (isFnaf) {
          this.fnafBatch++;
          this.act2Stage = 'conveyor';
          this.noodlesSeasoned = 0;
          this.noodlesPacked = 0;
          this.bricksDeliveredToTray = 0;
          this.mushroomStock += 40;
          this.brickSpawnTimer = 0.6;
          if (this.factoryObjs) {
            for (const tb of this.factoryObjs.conveyor.trayBricks) tb.visible = false;
            for (const pk of this.factoryObjs.conveyor.packedCratePacks) pk.visible = false;
          }
          for (const b of this.conveyorBricks) {
            this.scene.remove(b.rig.group);
            this.disposeObjectResources(b.rig.group);
          }
          this.conveyorBricks = [];
          this.audio.playVictoryFanfare();
          this.floatingTexts.push({
            id: this.nextFloatId++,
            text: isEn ? `BATCH #${this.fnafBatch - 1} +20!` : `ПАРТИЯ +20 МИВИН!`,
            worldX: PACKER_POS.x + 0.55,
            worldY: 2.9,
            worldZ: CONVEYOR_Z,
            life: 2.0,
            maxLife: 2.0,
            isGold: true,
          });
          this.eventBanner = isEn
            ? `+20 Mivinas packed! Total: ${this.fnafMivinasTotal}. Starting Batch #${this.fnafBatch}!`
            : `+20 мивин упаковано! Всего: ${this.fnafMivinasTotal}. Начинается партия #${this.fnafBatch}!`;
          this.eventBannerTimer = 5.5;
        } else {
          this.hasCorridorKey = true;
          this.act2Stage = 'corridor_key';
          this.audio.playKeyUnlock();
          this.floatingTexts.push({
            id: this.nextFloatId++,
            text: isEn ? '+CORRIDOR KEY!' : '+КЛЮЧ ОТ ДВЕРИ!',
            worldX: PACKER_POS.x + 0.55,
            worldY: 2.9,
            worldZ: CONVEYOR_Z,
            life: 2.2,
            maxLife: 2.2,
            isGold: true,
          });
          this.eventBanner = isEn
            ? 'KEY EARNED! Go to the padlocked door in the North wing!'
            : 'КЛЮЧ ПОЛУЧЕН! Иди к двери с замком в северном цехе!';
          this.eventBannerTimer = 6.5;
        }
      }
      this.pushHud(true);
      return;
    }

    if (this.hoveredBoxId !== null) {
      const box = this.seasoningBoxes.find(
        (b) => b.id === this.hoveredBoxId && b.available
      );
      if (box) {
        const gainPackets = isFnaf ? 6 : 5;
        const maxPackets = isFnaf ? 12 : 10;
        box.available = false;
        box.respawnTimer = isFnaf ? 11.0 : 14.0;
        box.rig.group.visible = false;
        this.packetsInHand = Math.min(maxPackets, this.packetsInHand + gainPackets);
        this.boxesFound++;
        this.audio.playBoxPickup();
        this.emitParticles(box.x, 0.4, box.z, 'gold');
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text: isEn
            ? `+${gainPackets} SEASONING PACKETS`
            : `+${gainPackets} ПАКЕТИКОВ ПРИПРАВЫ`,
          worldX: box.x,
          worldY: 1.4,
          worldZ: box.z,
          life: 1.15,
          maxLife: 1.15,
          isGold: true,
        });
        this.pushHud(true);
        return;
      }
    }

    if (this.hoveredBrickId !== null && this.packetsInHand > 0) {
      const brick = this.conveyorBricks.find(
        (b) => b.id === this.hoveredBrickId && !b.seasoned
      );
      if (brick) {
        brick.seasoned = true;
        brick.rig.sachetGroup.visible = true;
        brick.rig.highlightRing.visible = false;
        this.packetsInHand = Math.max(0, this.packetsInHand - 1);
        this.noodlesSeasoned++;
        this.mushroomStock = Math.max(0, this.mushroomStock - 2);
        this.sachetPlaceAnim = 0.28;
        this.audio.playPlaceSachet();
        this.emitParticles(brick.x, CONVEYOR_TOP_Y + 0.1, CONVEYOR_Z, 'green');
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text:
            this.settings.language === 'en'
              ? `+1 SEASONED (${this.noodlesSeasoned}/20)`
              : `+1 ПРИПРАВА (${this.noodlesSeasoned}/20)`,
          worldX: brick.x,
          worldY: CONVEYOR_TOP_Y + 0.85,
          worldZ: CONVEYOR_Z,
          life: 1.0,
          maxLife: 1.0,
          isGold: false,
        });
        this.pushHud(true);
      }
    }
  }

  private updateFactoryPlaying(dt: number, elapsed: number): void {
    this.elapsedPlaying += dt;
    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer -= dt;
      if (this.eventBannerTimer <= 0) this.eventBanner = null;
    }
    if (this.sachetPlaceAnim > 0) {
      this.sachetPlaceAnim = Math.max(0, this.sachetPlaceAnim - dt);
    }
    if (this.blindfoldNoticeTimer > 0) {
      this.blindfoldNoticeTimer = Math.max(0, this.blindfoldNoticeTimer - dt);
    }

    const isEn = this.settings.language === 'en';

    // Player movement (frozen inside closet when hiding)
    if (!this.isHidingInLocker) {
      let inX = this.virtualMoveX;
      let inZ = this.virtualMoveZ;
      if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inZ -= 1;
      if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inZ += 1;
      if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inX -= 1;
      if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inX += 1;
      if (this.heldKeys.has('KeyQ')) this.camYaw += dt * 2.1;

      const inputLen = Math.hypot(inX, inZ);
      const hasMove = inputLen > 0.05;
      if (hasMove) {
        inX /= Math.max(1, inputLen);
        inZ /= Math.max(1, inputLen);
      }

      const wantsSprint =
        (this.heldKeys.has('ShiftLeft') ||
          this.heldKeys.has('ShiftRight') ||
          this.virtualSprint) &&
        hasMove;
      const isSprinting = wantsSprint && this.stamina > 2;
      if (isSprinting) {
        this.stamina = Math.max(0, this.stamina - dt * 22);
      } else {
        this.stamina = Math.min(100, this.stamina + dt * (hasMove ? 16 : 26));
      }

      const moveSpeed = isSprinting ? 10.6 : 7.2;
      if (hasMove) {
        const sinY = Math.sin(this.camYaw);
        const cosY = Math.cos(this.camYaw);
        const worldDx = inX * cosY + inZ * sinY;
        const worldDz = -inX * sinY + inZ * cosY;

        this.playerX += worldDx * moveSpeed * dt;
        this.playerZ += worldDz * moveSpeed * dt;
        const resolved = this.resolveFactoryCollision(this.playerX, this.playerZ, 0.55);
        this.playerX = resolved.x;
        this.playerZ = resolved.z;

        if (this.isGrounded) {
          this.footstepAccum += dt * (isSprinting ? 2.8 : 2.0);
          if (this.footstepAccum >= 1) {
            this.footstepAccum = 0;
            this.audio.playFootstep(isSprinting);
          }
        }
      }
      this.playerYaw = this.camYaw + Math.PI;

      if (this.isGrounded) this.coyoteTimer = 0.12;
      else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      if (this.jumpBufferTimer > 0) this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        this.playerVy = 8.0;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.audio.playJump();
      }

      if (!this.isGrounded || this.playerY > 0.01) {
        this.playerVy -= 22.5 * dt;
        this.playerY += this.playerVy * dt;
        if (this.playerY <= 0) {
          this.playerY = 0;
          this.playerVy = 0;
          this.isGrounded = true;
        }
      } else {
        this.playerY = 0;
      }
    } else {
      this.stamina = Math.min(100, this.stamina + dt * 28);
      this.playerY = 0;
    }

    // Conveyor animation + Heat-Sealer Press animation
    if (this.factoryObjs) {
      const conv = this.factoryObjs.conveyor;
      conv.beltTexture.offset.x -= dt * 0.58;
      for (const r of conv.rollers) {
        r.rotation.z -= dt * 6.5;
      }
      conv.hopperMushrooms.position.y = 2.52 + Math.sin(elapsed * 3.2) * 0.04;

      if (this.pressAnimTimer > 0) {
        this.pressAnimTimer = Math.max(0, this.pressAnimTimer - dt);
        const slam = Math.sin((this.pressAnimTimer / 0.55) * Math.PI);
        conv.pressHead.position.y = 2.15 - slam * 0.78;
      } else {
        conv.pressHead.position.y = 2.15;
      }

      if (this.act2Stage === 'packaging') {
        const pulse = 1.6 + Math.sin(elapsed * 9) * 0.9;
        conv.beaconMat.color.setHex(0x22c55e);
        conv.beaconMat.emissive.setHex(0x16a34a);
        conv.beaconMat.emissiveIntensity = pulse;
        conv.beaconLight.color.setHex(0x4ade80);
        conv.beaconLight.intensity = 6.5 + Math.sin(elapsed * 9) * 2.5;
      } else {
        conv.beaconMat.color.setHex(0xf59e0b);
        conv.beaconMat.emissive.setHex(0xd97706);
        conv.beaconMat.emissiveIntensity = 1.2;
        conv.beaconLight.color.setHex(0xf59e0b);
        conv.beaconLight.intensity = 4.0;
      }
    }

    // Spawn unseasoned noodle cubes onto conveyor until 20 total are seasoned
    let unseasonedOnBelt = 0;
    let closestToStart = 99;
    for (const b of this.conveyorBricks) {
      if (!b.seasoned) unseasonedOnBelt++;
      const dStart = b.x - CONVEYOR_START_X;
      if (dStart < closestToStart) closestToStart = dStart;
    }

    this.brickSpawnTimer -= dt;
    if (
      this.act2Stage === 'conveyor' &&
      this.brickSpawnTimer <= 0 &&
      this.noodlesSeasoned + unseasonedOnBelt < ACT2_TARGET_MIVINAS &&
      this.conveyorBricks.length < 5 &&
      closestToStart > 2.8
    ) {
      const rig = createNoodleBrickMesh(this.anisotropy);
      rig.group.position.set(CONVEYOR_START_X, CONVEYOR_TOP_Y, CONVEYOR_Z);
      this.scene.add(rig.group);
      this.conveyorBricks.push({
        id: this.nextBrickId++,
        x: CONVEYOR_START_X,
        seasoned: false,
        rig,
      });
      this.brickSpawnTimer = this.mode === 'fnaf_epta' ? 1.25 : 1.75;
    }

    // Move noodle bricks along the conveyor
    for (let i = this.conveyorBricks.length - 1; i >= 0; i--) {
      const b = this.conveyorBricks[i];
      const spd = b.seasoned ? 3.8 : this.mode === 'fnaf_epta' ? 1.85 : 1.48;
      b.x += spd * dt;
      b.rig.group.position.set(b.x, CONVEYOR_TOP_Y, CONVEYOR_Z);
      b.rig.highlightRing.visible = false;

      if (b.x >= CONVEYOR_END_X) {
        if (b.seasoned) {
          this.scene.remove(b.rig.group);
          this.disposeObjectResources(b.rig.group);
          this.conveyorBricks.splice(i, 1);

          this.bricksDeliveredToTray++;
          if (
            this.factoryObjs &&
            this.bricksDeliveredToTray <= this.factoryObjs.conveyor.trayBricks.length
          ) {
            this.factoryObjs.conveyor.trayBricks[
              this.bricksDeliveredToTray - 1
            ].visible = true;
          }
          this.audio.playTrayDrop();

          if (
            this.noodlesSeasoned >= ACT2_TARGET_MIVINAS &&
            this.bricksDeliveredToTray >= ACT2_TARGET_MIVINAS &&
            this.act2Stage === 'conveyor'
          ) {
            this.act2Stage = 'packaging';
            this.eventBanner = isEn
              ? 'All 20 noodles seasoned! Go to the Packaging Press and press [E / Click]!'
              : 'Все 20 кубиков с приправой! Иди к Упаковщику справа и нажми [E / ЛКМ]!';
            this.eventBannerTimer = 6.0;
          }
        } else {
          b.x = CONVEYOR_START_X;
          b.rig.group.position.x = CONVEYOR_START_X;
          this.audio.playBrickReturn();
        }
      }
    }

    // Seasoning boxes animation & respawn
    for (const box of this.seasoningBoxes) {
      if (!box.available) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.available = true;
          box.rig.group.visible = true;
        }
      } else {
        box.rig.glowRing.scale.setScalar(1 + Math.sin(elapsed * 4 + box.id) * 0.08);
        box.rig.packetsGroup.position.y = Math.sin(elapsed * 2.5 + box.id) * 0.03;
      }
    }

    // Animate Sniper Rifle pickup pedestal in the corridor
    if (this.factoryObjs?.sniperPickup.rifleGroup.visible) {
      this.factoryObjs.sniperPickup.rifleGroup.rotation.y += dt * 1.4;
      this.factoryObjs.sniperPickup.rifleGroup.position.y =
        1.15 + Math.sin(elapsed * 2.8) * 0.08;
      this.factoryObjs.sniperPickup.glowRing.scale.setScalar(
        1 + Math.sin(elapsed * 4.5) * 0.1
      );
    }

    // Auto-trigger finale if player walks right up to Sniper Rifle / "Выход лол"
    if (
      this.act2Stage === 'corridor' &&
      !this.isHidingInLocker &&
      this.playerZ <= CORRIDOR_END_Z + 2.5
    ) {
      this.startAct2OutroCutscene();
      return;
    }

    // Determine targeted interactive object in camera look direction
    this.camera.getWorldDirection(_beamDir);
    _beamOrigin.copy(this.camera.position);

    this.hoveredBoxId = null;
    this.hoveredBrickId = null;
    this.hoveredPacker = false;
    this.hoveredLockerId = null;
    this.hoveredDoor1 = false;
    this.hoveredSniper = false;
    this.interactPrompt = null;

    if (this.isHidingInLocker) {
      this.interactPrompt = isEn
        ? '[E / Click] Exit Closet'
        : '[E / ЛКМ] Выйти из шкафа';
    } else {
      // 0) Check Sniper Rifle / "Выход лол" at the end of the corridor
      if (this.act2Stage === 'corridor') {
        _vec3b.set(
          SNIPER_PICKUP_POS.x - _beamOrigin.x,
          1.15 - _beamOrigin.y,
          SNIPER_PICKUP_POS.z - _beamOrigin.z
        );
        const sniperDist = _vec3b.length();
        if (sniperDist < 4.5 && sniperDist > 0.1) {
          _vec3b.divideScalar(sniperDist);
          if (_vec3b.dot(_beamDir) > 0.35 || sniperDist < 2.6) {
            this.hoveredSniper = true;
            this.interactPrompt = isEn
              ? '[E / Click] Grab Sniper Rifle («Exit LOL»)'
              : '[E / ЛКМ] Взять снайперскую винтовку («Выход лол»)';
          }
        }
      }

      // 0b) Check Locked Corridor Door #1 in North wing
      if (!this.interactPrompt && !this.corridorDoor1Open) {
        _vec3b.set(
          CORRIDOR_X - _beamOrigin.x,
          1.5 - _beamOrigin.y,
          -FACTORY_HALF_D - _beamOrigin.z
        );
        const doorDist = _vec3b.length();
        if (doorDist < 4.4 && doorDist > 0.1) {
          _vec3b.divideScalar(doorDist);
          if (_vec3b.dot(_beamDir) > 0.38 || doorDist < 2.6) {
            this.hoveredDoor1 = true;
            this.interactPrompt = this.hasCorridorKey
              ? isEn
                ? '[E / Click] Unlock Door with Key'
                : '[E / ЛКМ] Открыть дверь ключом'
              : isEn
                ? 'Locked! Pack 20 Mivinas for the Key'
                : 'Заперто на замок! Нужен ключ за 20 мивин';
          }
        }
      }

      // 1) Check Packaging Press if in Stage 2
      if (!this.interactPrompt && this.act2Stage === 'packaging') {
        _vec3b.set(PACKER_POS.x + 0.4 - _beamOrigin.x, 1.3 - _beamOrigin.y, CONVEYOR_Z - _beamOrigin.z);
        const dist = _vec3b.length();
        if (dist < 4.5 && dist > 0.1) {
          _vec3b.divideScalar(dist);
          const dot = _vec3b.dot(_beamDir);
          if (dot > 0.32 || dist < 2.8) {
            this.hoveredPacker = true;
            this.interactPrompt = isEn
              ? `[E / Click] Pack Mivinas (${this.noodlesPacked}/20)`
              : `[E / ЛКМ] Запаковать мивину (${this.noodlesPacked}/20)`;
          }
        }
      }

      // 2) Check nearby Hiding Closet («Шкаф»)
      if (!this.interactPrompt && this.factoryObjs) {
        let bestLockerScore = -999;
        for (const locker of this.factoryObjs.lockers) {
          _vec3b.set(locker.x - _beamOrigin.x, 1.3 - _beamOrigin.y, locker.z - _beamOrigin.z);
          const dist = _vec3b.length();
          if (dist < 3.4 && dist > 0.1) {
            _vec3b.divideScalar(dist);
            const dot = _vec3b.dot(_beamDir);
            if (dot > 0.48 || dist < 1.95) {
              const score = dot * 2 - dist * 0.25;
              if (score > bestLockerScore) {
                bestLockerScore = score;
                this.hoveredLockerId = locker.id;
              }
            }
          }
        }
        if (this.hoveredLockerId !== null) {
          this.interactPrompt = isEn
            ? '[E / Click] Hide in Closet'
            : '[E / ЛКМ] Спрятаться в шкаф';
        }
      }

      // 3) Check nearest Seasoning Box in front of player
      if (!this.interactPrompt) {
        let bestBoxScore = -999;
        for (const box of this.seasoningBoxes) {
          if (!box.available) continue;
          _vec3b.set(box.x - _beamOrigin.x, 0.35 - _beamOrigin.y, box.z - _beamOrigin.z);
          const dist = _vec3b.length();
          if (dist < 3.4 && dist > 0.1) {
            _vec3b.divideScalar(dist);
            const dot = _vec3b.dot(_beamDir);
            if (dot > 0.42 || dist < 1.9) {
              const score = dot * 2 - dist * 0.25;
              if (score > bestBoxScore) {
                bestBoxScore = score;
                this.hoveredBoxId = box.id;
              }
            }
          }
        }
        if (this.hoveredBoxId !== null) {
          this.interactPrompt = isEn
            ? '[E / Click] Grab Seasoning Box (+5 packets)'
            : '[E / ЛКМ] Взять коробок приправ (+5 пакетиков)';
        }
      }

      // 4) Check nearest unseasoned Noodle Brick on conveyor
      if (!this.interactPrompt && this.act2Stage === 'conveyor') {
        let bestBrickScore = -999;
        let targetBrick: ConveyorBrick | null = null;
        for (const brick of this.conveyorBricks) {
          if (brick.seasoned) continue;
          _vec3b.set(brick.x - _beamOrigin.x, CONVEYOR_TOP_Y + 0.12 - _beamOrigin.y, CONVEYOR_Z - _beamOrigin.z);
          const dist = _vec3b.length();
          if (dist < 3.6 && dist > 0.1) {
            _vec3b.divideScalar(dist);
            const dot = _vec3b.dot(_beamDir);
            if (dot > 0.42 || dist < 2.1) {
              const score = dot * 2 - dist * 0.25;
              if (score > bestBrickScore) {
                bestBrickScore = score;
                targetBrick = brick;
              }
            }
          }
        }
        if (targetBrick) {
          targetBrick.rig.highlightRing.visible = true;
          if (this.packetsInHand > 0) {
            this.hoveredBrickId = targetBrick.id;
            this.interactPrompt = isEn
              ? `[E / Click] Put Seasoning Packet (${this.noodlesSeasoned}/20)`
              : `[E / ЛКМ] Положить пакетик приправы (${this.noodlesSeasoned}/20)`;
          } else {
            this.interactPrompt = isEn
              ? 'No packets! Find a Seasoning Box in rack rooms'
              : 'Нет пакетиков! Ищи коробок приправ в комнатах со стеллажами';
          }
        }
      }
    }

    // --- ENEMY 1: Blindfolded Angry Sasha (Mutually Exclusive with RONER + Rare Spawns) ---
    const sasha = this.chasers[1];
    const inCorridor = this.act2Stage === 'corridor';
    if (sasha) {
      if (sasha.bubbleTimer > 0) {
        sasha.bubbleTimer -= dt;
        if (sasha.bubbleTimer <= 0) sasha.currentBubbleText = null;
      }

      if (this.sanyaState === 'dormant') {
        sasha.active = false;
        sasha.rig.root.visible = false;
        // Strict mutual exclusion: Sanya cannot appear if RONER is active!
        if (this.ronerState === 'dormant') {
          this.sanyaTimer -= dt;
          if (this.sanyaTimer <= 0) {
            this.sanyaState = 'flicker_warning';
            this.sanyaTimer = 4.6;
            this.sanyaFlickerSoundTimer = 0;
            this.audio.playLightFlicker();
          }
        }
      } else if (this.sanyaState === 'flicker_warning') {
        this.sanyaTimer -= dt;
        this.sanyaFlickerSoundTimer -= dt;
        if (this.sanyaFlickerSoundTimer <= 0) {
          this.sanyaFlickerSoundTimer = 0.85;
          this.audio.playLightFlicker();
        }
        if (this.sanyaTimer <= 0) {
          this.sanyaState = 'hunting';
          this.sanyaTimer = inCorridor ? 9.5 : 10.5;
          this.sanyaWaypointIdx = 1;
          this.sanyaTauntTimer = 0.6;
          sasha.active = true;
          if (inCorridor) {
            sasha.x = CORRIDOR_X;
            sasha.z = THREE.MathUtils.clamp(
              this.playerZ > -175 ? this.playerZ - 26 : this.playerZ + 24,
              CORRIDOR_END_Z + 6.5,
              -27
            );
          } else {
            sasha.x = -18.0;
            sasha.z = -12.0;
          }
          sasha.yaw = 0;
          sasha.rig.root.visible = true;
          sasha.rig.root.position.set(sasha.x, 0, sasha.z);
          this.audio.playChaserEmerge();
        }
      } else if (this.sanyaState === 'hunting') {
        this.sanyaTimer -= dt;
        this.sanyaTauntTimer -= dt;
        if (this.sanyaTauntTimer <= 0) {
          this.sanyaTauntTimer = 3.8;
          const phrase = pickRandomChaserPhrase(this.settings);
          sasha.currentBubbleText = phrase.display;
          sasha.bubbleTimer = 2.4;
          this.audio.playTaunt(phrase.speech, sasha.pitch, false);
        }

        // Notify if player shines flashlight on blindfolded Sanya (ineffective!)
        if (this.flashlightOn && !this.isHidingInLocker && this.blindfoldNoticeTimer <= 0) {
          _vec3b.set(sasha.x - _beamOrigin.x, 1.35 - _beamOrigin.y, sasha.z - _beamOrigin.z);
          const beamDist = _vec3b.length();
          if (beamDist < 14 && beamDist > 0.1) {
            _vec3b.divideScalar(beamDist);
            if (_vec3b.dot(_beamDir) > 0.86) {
              this.blindfoldNoticeTimer = 3.5;
              this.eventBanner = isEn
                ? 'Sasha is blindfolded! Flashlight will NOT stop him — HIDE IN A CLOSET [E]!'
                : 'У Сани перевязаны глаза — фонарик НЕ поможет! ПРЯЧЬСЯ В ШКАФ [E]!';
              this.eventBannerTimer = 3.2;
            }
          }
        }

        const distToPlayer = Math.hypot(this.playerX - sasha.x, this.playerZ - sasha.z);
        const canSensePlayer =
          !this.isHidingInLocker &&
          distToPlayer < (inCorridor ? 26.0 : 10.5) &&
          this.hasFactoryLineOfSight(sasha.x, sasha.z, this.playerX, this.playerZ);

        let goalX: number;
        let goalZ: number;
        let moveSpd: number;
        if (canSensePlayer) {
          goalX = this.playerX;
          goalZ = this.playerZ;
          moveSpd = inCorridor ? 6.9 : 7.7;
        } else if (inCorridor) {
          // Walk past the corridor closet while player hides
          goalX = CORRIDOR_X;
          goalZ = sasha.z > this.playerZ ? -26.5 : CORRIDOR_END_Z + 6.5;
          moveSpd = 6.2;
        } else {
          const wp = SANYA_PATROL_ROUTE[this.sanyaWaypointIdx % SANYA_PATROL_ROUTE.length];
          if (Math.hypot(wp.x - sasha.x, wp.z - sasha.z) < 1.6) {
            this.sanyaWaypointIdx = (this.sanyaWaypointIdx + 1) % SANYA_PATROL_ROUTE.length;
          }
          const nextWp = SANYA_PATROL_ROUTE[this.sanyaWaypointIdx];
          const nav = this.getFactoryNavTarget(sasha.x, sasha.z, nextWp.x, nextWp.z);
          goalX = nav.x;
          goalZ = nav.z;
          moveSpd = 5.8;
        }

        const dx = goalX - sasha.x;
        const dz = goalZ - sasha.z;
        const len = Math.hypot(dx, dz) || 1;
        sasha.x += (dx / len) * moveSpd * dt;
        sasha.z += (dz / len) * moveSpd * dt;
        const res = this.resolveFactoryCollision(sasha.x, sasha.z, 0.52);
        sasha.x = res.x;
        sasha.z = res.z;
        sasha.yaw = Math.atan2(dx, dz);
        sasha.rig.root.position.set(sasha.x, 0, sasha.z);
        sasha.rig.root.rotation.y = sasha.yaw;
        animateRobloxCharacter(sasha.rig, 1.15, dt, elapsed, false, false, true, false);
        // Blindfolded pose: reaches blindly outward
        sasha.rig.leftArm.rotation.x = -1.45 + Math.sin(elapsed * 6) * 0.15;
        sasha.rig.rightArm.rotation.x = -1.45 - Math.sin(elapsed * 6) * 0.15;

        if (!this.isHidingInLocker && Math.hypot(this.playerX - sasha.x, this.playerZ - sasha.z) < 1.45) {
          this.triggerCaught(sasha);
          return;
        }

        if (this.sanyaTimer <= 0) {
          this.sanyaState = 'leaving';
          this.sanyaTimer = inCorridor ? 2.5 : 4.5;
        }
      } else if (this.sanyaState === 'leaving') {
        this.sanyaTimer -= dt;
        const leaveX = inCorridor ? CORRIDOR_X : -21.0;
        const leaveZ = inCorridor ? -25.5 : -14.5;
        const nav = this.getFactoryNavTarget(sasha.x, sasha.z, leaveX, leaveZ);
        const dx = nav.x - sasha.x;
        const dz = nav.z - sasha.z;
        const len = Math.hypot(dx, dz) || 1;
        sasha.x += (dx / len) * 6.8 * dt;
        sasha.z += (dz / len) * 6.8 * dt;
        const res = this.resolveFactoryCollision(sasha.x, sasha.z, 0.5);
        sasha.x = res.x;
        sasha.z = res.z;
        sasha.rig.root.position.set(sasha.x, 0, sasha.z);
        sasha.rig.root.rotation.y = Math.atan2(dx, dz);
        animateRobloxCharacter(sasha.rig, 1.1, dt, elapsed, false, false, true, false);

        if (this.sanyaTimer <= 0 || Math.hypot(sasha.x - leaveX, sasha.z - leaveZ) < 2.2) {
          sasha.active = false;
          sasha.rig.root.visible = false;
          this.sanyaState = 'dormant';
          const isFnaf = this.mode === 'fnaf_epta';
          this.sanyaTimer = inCorridor
            ? 15.0 + Math.random() * 5.0
            : isFnaf
              ? Math.max(12.0, 22.0 - this.fnafBatch * 1.5) + Math.random() * 5.0
              : 34.0 + Math.random() * 10.0;
          this.ronerTimer = Math.max(
            this.ronerTimer,
            isFnaf ? 12.0 + Math.random() * 5.0 : 18.0 + Math.random() * 6.0
          );
        }
      }
    }

    // Update Ceiling Lamps Flicker Visuals when Sanya approaches or hunts!
    if (this.factoryObjs) {
      const lightsFlickering =
        this.sanyaState === 'flicker_warning' || this.sanyaState === 'hunting';
      if (lightsFlickering) {
        const wave = Math.sin(elapsed * 29) * Math.sin(elapsed * 13);
        const mult = wave > 0.25 ? 0.12 : wave < -0.35 ? 1.25 : 0.45;
        for (let i = 0; i < this.factoryObjs.lampLights.length; i++) {
          this.factoryObjs.lampLights[i].intensity =
            this.factoryObjs.lampBaseIntensities[i] * mult;
        }
        this.factoryObjs.bulbMat.emissiveIntensity = mult * 1.9;
      } else {
        for (let i = 0; i < this.factoryObjs.lampLights.length; i++) {
          this.factoryObjs.lampLights[i].intensity =
            this.factoryObjs.lampBaseIntensities[i];
        }
        this.factoryObjs.bulbMat.emissiveIntensity = 2.0;
      }
    }

    // --- ENEMY 2: Angry RONER Window Breach + Red Factory Alarm (Mutually Exclusive with Sanya + Rare) ---
    const roner = this.chasers[0];
    if (roner && this.factoryObjs && this.factoryObjs.windows.length > 0) {
      if (roner.bubbleTimer > 0) {
        roner.bubbleTimer -= dt;
        if (roner.bubbleTimer <= 0) roner.currentBubbleText = null;
      }

      const wins = this.factoryObjs.windows;
      const activeWin: FactoryWindow =
        wins[this.ronerTargetWindowIdx % wins.length];

      if (this.ronerState === 'dormant') {
        roner.active = false;
        roner.rig.root.visible = false;
        this.windowBreachProgress = 0;
        // Strict mutual exclusion: RONER cannot appear if Sanya is active or player is in corridor!
        if (this.sanyaState === 'dormant' && !inCorridor) {
          this.ronerTimer -= dt;
          if (this.ronerTimer <= 0) {
            const winIdx = this.playerZ < -7.5 ? 2 : Math.random() < 0.5 ? 0 : 1;
            this.ronerTargetWindowIdx = winIdx;
            const wTarget = wins[winIdx];
            wTarget.glassMesh.visible = true;
            this.ronerState = 'climbing';
            this.ronerTimer = 1.4;
            this.windowBreachProgress = 0;
            this.windowBangTimer = 0.6;
            this.alarmSoundTimer = 0;

            roner.active = true;
            roner.lightExposure = 0;
            roner.isScream = true;
            roner.x = wTarget.x - wTarget.inwardX * 0.9;
            roner.z = wTarget.z - wTarget.inwardZ * 0.9;
            roner.rig.root.visible = true;
            roner.rig.root.position.set(roner.x, 0, roner.z);
            roner.rig.root.rotation.y = Math.atan2(wTarget.inwardX, wTarget.inwardZ);

            const phrase = pickRandomChaserPhrase(this.settings);
            roner.currentBubbleText = phrase.display;
            roner.bubbleTimer = 2.6;
            this.audio.playFactoryAlarmTick();
            this.audio.playTaunt(phrase.speech, roner.pitch, false);
          }
        }
      } else if (this.ronerState === 'climbing' || this.ronerState === 'breaking') {
        // Sound red factory alarm periodically
        this.alarmSoundTimer -= dt;
        if (this.alarmSoundTimer <= 0) {
          this.alarmSoundTimer = 0.95;
          this.audio.playFactoryAlarmTick();
        }

        if (this.ronerState === 'climbing') {
          this.ronerTimer -= dt;
          const climbAlpha = THREE.MathUtils.clamp(1 - this.ronerTimer / 1.4, 0, 1);
          roner.rig.root.position.set(
            activeWin.x - activeWin.inwardX * 0.85,
            THREE.MathUtils.lerp(0.0, 1.12, climbAlpha),
            activeWin.z - activeWin.inwardZ * 0.85
          );
          animateRobloxCharacter(roner.rig, 0.7, dt, elapsed, false, false, true);
          if (this.ronerTimer <= 0) {
            this.ronerState = 'breaking';
          }
        } else {
          // Breaking window glass!
          this.windowBreachProgress = Math.min(100, this.windowBreachProgress + dt * 10.5);
          this.windowBangTimer -= dt;
          if (this.windowBangTimer <= 0) {
            this.windowBangTimer = 1.15;
            this.audio.playWindowBang(false);
            this.cameraShake = Math.max(this.cameraShake, 0.14);
          }

          roner.rig.root.position.set(
            activeWin.x - activeWin.inwardX * 0.85,
            1.12 + Math.abs(Math.sin(elapsed * 9)) * 0.08,
            activeWin.z - activeWin.inwardZ * 0.85
          );
          animateRobloxCharacter(roner.rig, 0.3, dt, elapsed, false, false, true);
          roner.rig.leftArm.rotation.x = -1.6 + Math.sin(elapsed * 14) * 0.6;
          roner.rig.rightArm.rotation.x = -1.6 - Math.sin(elapsed * 14) * 0.6;

          if (this.windowBreachProgress >= 100) {
            // Window shatters! RONER leaps inside and sprints to kill Nikita!
            activeWin.glassMesh.visible = false;
            this.audio.playWindowBang(true);
            this.cameraShake = 0.35;
            this.ronerState = 'chasing_inside';
            roner.x = activeWin.x + activeWin.inwardX * 1.45;
            roner.z = activeWin.z + activeWin.inwardZ * 1.45;
            roner.rig.root.position.set(roner.x, 0, roner.z);
            const scream = getCaughtScreamLine(this.settings);
            roner.currentBubbleText = scream.display;
            roner.bubbleTimer = 3.0;
            this.audio.playTaunt(scream.speech, roner.pitch, true);
          }
        }

        // Player shines [F] flashlight directly on RONER in the window to repel him!
        if (this.flashlightOn && !this.isHidingInLocker) {
          _vec3b.set(
            roner.x - _beamOrigin.x,
            activeWin.y - _beamOrigin.y,
            roner.z - _beamOrigin.z
          );
          const beamDist = _vec3b.length();
          if (beamDist < 32 && beamDist > 0.1) {
            _vec3b.divideScalar(beamDist);
            if (_vec3b.dot(_beamDir) > Math.cos(Math.PI / 4.8)) {
              roner.lightExposure += dt;
              if (roner.lightExposure >= 0.22) {
                roner.lightExposure = 0;
                this.ronerState = 'retreating';
                this.ronerTimer = 1.6;
                this.windowBreachProgress = 0;
                const krysa = getKrysaRetreatLine(this.settings);
                roner.currentBubbleText = krysa.display;
                roner.bubbleTimer = 2.4;
                roner.isScream = false;
                this.flashlightStuns++;
                this.audio.playKrysaRetreat(roner.pitch, krysa.speech, krysa.hasCensorBeep);
              }
            }
          }
        }
      } else if (this.ronerState === 'retreating') {
        this.ronerTimer -= dt;
        const alpha = THREE.MathUtils.clamp(1 - this.ronerTimer / 1.6, 0, 1);
        roner.rig.root.position.set(
          activeWin.x - activeWin.inwardX * (0.85 + alpha * 3.2),
          THREE.MathUtils.lerp(1.12, -0.6, alpha),
          activeWin.z - activeWin.inwardZ * (0.85 + alpha * 3.2)
        );
        animateRobloxCharacter(roner.rig, 1.2, dt, elapsed, false, false, true, true);
        if (this.ronerTimer <= 0) {
          roner.active = false;
          roner.rig.root.visible = false;
          this.ronerState = 'dormant';
          const isFnaf = this.mode === 'fnaf_epta';
          this.ronerTimer = isFnaf
            ? Math.max(13.0, 24.0 - this.fnafBatch * 1.5) + Math.random() * 5.0
            : 36.0 + Math.random() * 10.0;
          this.sanyaTimer = Math.max(
            this.sanyaTimer,
            isFnaf ? 12.0 + Math.random() * 5.0 : 18.0 + Math.random() * 6.0
          );
        }
      } else if (this.ronerState === 'chasing_inside') {
        const nav = this.getFactoryNavTarget(roner.x, roner.z, this.playerX, this.playerZ);
        const dx = nav.x - roner.x;
        const dz = nav.z - roner.z;
        const dist = Math.hypot(dx, dz) || 1;
        roner.x += (dx / dist) * 8.6 * dt;
        roner.z += (dz / dist) * 8.6 * dt;
        const res = this.resolveFactoryCollision(roner.x, roner.z, 0.5);
        roner.x = res.x;
        roner.z = res.z;
        roner.rig.root.position.set(roner.x, 0, roner.z);
        roner.rig.root.rotation.y = Math.atan2(dx, dz);
        animateRobloxCharacter(roner.rig, 1.35, dt, elapsed, false, false, true, false);

        if (Math.hypot(this.playerX - roner.x, this.playerZ - roner.z) < 1.48) {
          if (this.isHidingInLocker) {
            this.isHidingInLocker = false;
            this.hiddenLockerId = null;
          }
          this.triggerCaught(roner);
          return;
        }
      }

      // Red Factory Alarm Lights pulse whenever RONER climbs, breaks, or breaches a window!
      const alarmActive =
        this.ronerState === 'climbing' ||
        this.ronerState === 'breaking' ||
        this.ronerState === 'chasing_inside';
      if (alarmActive) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 16);
        this.factoryObjs.alarmLight.position.set(
          activeWin.x + activeWin.inwardX * 1.4,
          4.2,
          activeWin.z + activeWin.inwardZ * 1.4
        );
        this.factoryObjs.alarmLight.intensity = 10 + pulse * 18;
        for (let i = 0; i < wins.length; i++) {
          wins[i].beaconMat.emissiveIntensity =
            i === this.ronerTargetWindowIdx ? 1.2 + pulse * 3.0 : 0.6 + pulse * 1.2;
        }
      } else {
        this.factoryObjs.alarmLight.intensity = 0;
        for (const w of wins) {
          w.beaconMat.emissiveIntensity = 0.2;
        }
      }
    }
  }

  private updatePlaying(dt: number, elapsed: number): void {
    if (this.mode === 'story_act2' || this.mode === 'fnaf_epta') {
      this.updateFactoryPlaying(dt, elapsed);
      return;
    }

    if (this.mode === 'story_act3') {
      this.updateAct3Playing(dt, elapsed);
      return;
    }

    if (this.mode === 'sniper_minigame') {
      this.updateSniperMinigame(dt, elapsed);
      return;
    }

    this.elapsedPlaying += dt;
    const isStory = this.mode === 'story_act1';
    const isHardcore = this.mode === 'hardcore_third_person';
    const isFP = this.mode === 'first_person' || isStory;

    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer -= dt;
      if (this.eventBannerTimer <= 0) this.eventBanner = null;
    }

    // Faster limited battery drain in Story Act 1 (~24 seconds per 100% battery)
    if (isStory && this.flashlightOn) {
      this.battery = Math.max(0, this.battery - dt * 4.2);
      if (this.battery <= 0) {
        this.flashlightOn = false;
        this.audio.playFlashlightClick(false);
        this.eventBanner =
          this.settings.language === 'en'
            ? 'Battery died! Grab a new battery on the road!'
            : 'Батарейка села! Ищи новую батарейку на дорожке!';
        this.eventBannerTimer = 3.0;
      }
    }

    // Chaser emergence timing (slightly gentler for longer matches)
    const ronerDelay = isHardcore ? 4.5 : isStory ? 5.0 : 7.5;
    const ronerMush = isHardcore ? 1 : 2;
    const sashaDelay = isHardcore ? 12.5 : isStory ? 15.0 : 20.0;
    const sashaMush = isHardcore ? 3 : isStory ? 7 : 5;

    if (!this.chasers[0].active && (this.elapsedPlaying > ronerDelay || this.mushroomsCollected >= ronerMush)) {
      this.spawnChaserFromForest(this.chasers[0], 0.45);
    }
    if (!this.chasers[1].active && (this.elapsedPlaying > sashaDelay || this.mushroomsCollected >= sashaMush)) {
      this.spawnChaserFromForest(this.chasers[1], -0.45);
    }

    let inX = this.virtualMoveX;
    let inZ = this.virtualMoveZ;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inZ -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inZ += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inX += 1;

    if (this.heldKeys.has('KeyQ')) this.camYaw += dt * 2.1;
    if (this.heldKeys.has('KeyE')) this.camYaw -= dt * 2.1;

    const inputLen = Math.hypot(inX, inZ);
    const hasMove = inputLen > 0.05;
    if (hasMove) {
      inX /= Math.max(1, inputLen);
      inZ /= Math.max(1, inputLen);
    }

    const wantsSprint =
      (this.heldKeys.has('ShiftLeft') ||
        this.heldKeys.has('ShiftRight') ||
        this.virtualSprint) &&
      hasMove;
    const isSprinting = wantsSprint && this.stamina > 2;

    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 26);
    } else {
      this.stamina = Math.min(100, this.stamina + dt * (hasMove ? 14 : 24));
    }

    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
    const boostMult = this.speedBoostTimer > 0 ? 1.28 : 1.0;
    const baseSpeed = isSprinting ? 11.4 : 7.6;
    const moveSpeed = baseSpeed * boostMult;

    if (hasMove) {
      const sinY = Math.sin(this.camYaw);
      const cosY = Math.cos(this.camYaw);
      const worldDx = inX * cosY + inZ * sinY;
      const worldDz = -inX * sinY + inZ * cosY;

      this.playerX += worldDx * moveSpeed * dt;
      this.playerZ += worldDz * moveSpeed * dt;

      const resolved = this.resolveObstacleCollision(this.playerX, this.playerZ, 0.52);
      this.playerX = resolved.x;
      this.playerZ = resolved.z;

      if (isFP) {
        this.playerYaw = this.camYaw + Math.PI;
      } else {
        const targetYaw = Math.atan2(worldDx, worldDz);
        let diff = targetYaw - this.playerYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.playerYaw += diff * Math.min(1, dt * 14);
      }

      if (this.isGrounded) {
        this.footstepAccum += dt * (isSprinting ? 2.9 : 2.0);
        if (this.footstepAccum >= 1) {
          this.footstepAccum = 0;
          this.audio.playFootstep(isSprinting);
        }
      }
    } else if (isFP) {
      this.playerYaw = this.camYaw + Math.PI;
    }

    if (this.isGrounded) this.coyoteTimer = 0.12;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    if (this.jumpBufferTimer > 0) this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVy = 8.4;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.audio.playJump();
    }

    const groundY = groundHeightAt(this.playerX, this.playerZ);
    if (!this.isGrounded || this.playerY > groundY + 0.01) {
      this.playerVy -= 22.5 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= groundY) {
        this.playerY = groundY;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerY = groundY;
    }

    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    if (!isFP) {
      animateRobloxCharacter(
        this.playerRig,
        hasMove ? (isSprinting ? 1.35 : 0.9) : 0,
        dt,
        elapsed,
        !this.isGrounded,
        false,
        false
      );
      this.playerRig.rightArm.rotation.x = -1.22;
    }

    // Mushrooms animation & pickup check
    for (let i = this.mushrooms.length - 1; i >= 0; i--) {
      const m = this.mushrooms[i];
      m.phase += dt * 2.8;
      m.mesh.position.y = m.y + Math.sin(m.phase) * 0.08;
      m.mesh.rotation.y = Math.sin(m.phase * 0.5) * 0.25;

      const dist = Math.hypot(m.x - this.playerX, m.z - this.playerZ);
      if (dist < 1.65 && Math.abs(this.playerY - m.y) < 2.2) {
        const gained = m.isGolden ? 3 : 1;
        this.mushroomsCollected += gained;
        if (this.mushroomsCollected > this.bestMushrooms) {
          this.bestMushrooms = this.mushroomsCollected;
          try {
            localStorage.setItem(BEST_SCORE_KEY, String(this.bestMushrooms));
          } catch {}
        }
        this.achievements.totalMushrooms += gained;
        const unlocked = evaluateStatAchievements(this.achievements);
        this.emitAchievementResult(unlocked);

        this.stamina = Math.min(100, this.stamina + (m.isGolden ? 45 : 22));
        if (m.isGolden) {
          this.speedBoostTimer = 4.0;
        }
        this.emitParticles(m.x, m.y, m.z, m.isGolden ? 'gold' : 'green');
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text:
            this.settings.language === 'en'
              ? m.isGolden
                ? '+3 GOLD PROSTOPHILYA!'
                : '+1 PROSTOPHILYA'
              : m.isGolden
                ? '+3 ГОЛДА ПРОСТОФИЛЯ!'
                : '+1 ПРОСТОФИЛЯ',
          worldX: m.x,
          worldY: m.y + 1.8,
          worldZ: m.z,
          life: 1.15,
          maxLife: 1.15,
          isGold: m.isGolden,
        });
        this.audio.playPickup(m.isGolden);

        this.scene.remove(m.mesh);
        this.mushrooms.splice(i, 1);
        if (!isStory) {
          this.spawnArenaMushroom(true);
        } else if (this.mushroomsCollected >= STORY_TARGET_MUSHROOMS) {
          this.eventBanner =
            this.settings.language === 'en'
              ? '40 mushrooms collected! Run to Mivina Corporation!'
              : '40 грибов собрано! Беги к заводу «Мивина Корпорейшен»!';
          this.eventBannerTimer = 4.5;
        }
      }
    }

    // Battery animation & pickup check in Story Act 1
    if (isStory) {
      for (let i = this.batteries.length - 1; i >= 0; i--) {
        const b = this.batteries[i];
        b.phase += dt * 3.0;
        b.mesh.rotation.y += dt * 1.8;
        b.mesh.position.y = b.y + Math.sin(b.phase) * 0.08;

        const dist = Math.hypot(b.x - this.playerX, b.z - this.playerZ);
        if (dist < 1.65 && Math.abs(this.playerY - b.y) < 2.2) {
          const wasEmpty = this.battery <= 0;
          this.battery = Math.min(100, this.battery + 25);
          if (wasEmpty) this.flashlightOn = true;

          this.emitParticles(b.x, b.y, b.z, 'battery');
          this.floatingTexts.push({
            id: this.nextFloatId++,
            text: this.settings.language === 'en' ? '+25% BATTERY' : '+25% БАТАРЕЯ',
            worldX: b.x,
            worldY: b.y + 1.6,
            worldZ: b.z,
            life: 1.1,
            maxLife: 1.1,
            isGold: false,
          });
          this.audio.playBatteryPickup();
          this.scene.remove(b.mesh);
          this.batteries.splice(i, 1);
        }
      }

      // Check Factory Gate arrival at the end of the winding trail
      const endX = storyPathCenterX(STORY_END_Z);
      const gateDist = Math.hypot(this.playerX - endX, this.playerZ - STORY_END_Z);
      if (this.factoryGate && this.mushroomsCollected >= STORY_TARGET_MUSHROOMS) {
        // Visually open factory gate slightly as player nears it with 40+ mushrooms
        const openRatio = THREE.MathUtils.clamp(1 - gateDist / 20, 0, 1);
        this.factoryGate.leftDoor.rotation.y = -1.35 * openRatio;
        this.factoryGate.rightDoor.rotation.y = 1.35 * openRatio;
      }
      if (gateDist < 4.5) {
        if (this.mushroomsCollected >= STORY_TARGET_MUSHROOMS) {
          this.startOutroCutscene();
          return;
        } else {
          const left = STORY_TARGET_MUSHROOMS - this.mushroomsCollected;
          this.eventBanner =
            this.settings.language === 'en'
              ? `Need 40 mushrooms for Mivina! Left: ${left}`
              : `Для мивины нужно 40 грибов! Осталось: ${left}`;
          this.eventBannerTimer = 2.0;
        }
      }
    }

    // Beam cone detection
    if (isFP) {
      this.camera.getWorldDirection(_beamDir);
      _beamOrigin.copy(this.camera.position);
    } else {
      const fx = Math.sin(this.playerYaw);
      const fz = Math.cos(this.playerYaw);
      _beamOrigin.set(this.playerX, this.playerY + 1.35, this.playerZ);
      _beamDir.set(fx, -0.05, fz).normalize();
    }

    const coneCos = Math.cos(Math.PI / 6.0);
    const requiredExposure = isHardcore ? 0.34 : 0.14;
    const difficultyRamp =
      (isHardcore ? 1.1 : 0) +
      Math.min(1.85, this.mushroomsCollected * 0.036 + this.elapsedPlaying * 0.0065);

    for (const c of this.chasers) {
      if (!c.active) continue;

      // On the 1000m road, if an enemy falls far behind the player, re-ambush ahead in the fog!
      if (isStory && c.retreatTimer <= 0 && c.z - this.playerZ > 42 && this.playerZ > STORY_END_Z + 40) {
        const aheadZ = Math.max(STORY_END_Z + 12, this.playerZ - (24 + Math.random() * 8));
        c.z = aheadZ;
        c.x = storyPathCenterX(aheadZ) + (c.flankAngleOffset > 0 ? 2.4 : -2.4);
        c.rig.root.position.set(c.x, groundHeightAt(c.x, c.z), c.z);
        const ambushPhrase = pickRandomChaserPhrase(this.settings);
        c.currentBubbleText = ambushPhrase.display;
        c.bubbleTimer = 2.6;
        c.isScream = false;
        this.audio.playTaunt(ambushPhrase.speech, c.pitch, true);
      }

      if (c.retreatCooldown > 0) c.retreatCooldown -= dt;
      if (c.bubbleTimer > 0) {
        c.bubbleTimer -= dt;
        if (c.bubbleTimer <= 0) c.currentBubbleText = null;
      }

      const cy = groundHeightAt(c.x, c.z);

      if (this.flashlightOn && c.retreatTimer <= 0 && c.retreatCooldown <= 0) {
        _vec3b.set(c.x - _beamOrigin.x, cy + 1.35 - _beamOrigin.y, c.z - _beamOrigin.z);
        const beamDist = _vec3b.length();
        if (beamDist < 22 && beamDist > 0.1) {
          _vec3b.divideScalar(beamDist);
          const dot = _vec3b.dot(_beamDir);
          if (dot > coneCos) {
            c.lightExposure += dt;
            if (c.lightExposure >= requiredExposure) {
              c.lightExposure = 0;
              c.retreatTimer = isHardcore ? 1.85 : 3.2;
              c.retreatCooldown = isHardcore ? 3.8 : 4.5;
              c.stalkPauseTimer = isHardcore ? 0.8 : 2.4;
              const krysa = getKrysaRetreatLine(this.settings);
              c.currentBubbleText = krysa.display;
              c.bubbleTimer = 2.7;
              c.isScream = false;
              this.flashlightStuns++;
              this.audio.playKrysaRetreat(
                c.pitch,
                krysa.speech,
                krysa.hasCensorBeep
              );
            }
          } else {
            c.lightExposure = Math.max(0, c.lightExposure - dt * 1.5);
          }
        } else {
          c.lightExposure = Math.max(0, c.lightExposure - dt * 1.5);
        }
      } else {
        c.lightExposure = 0;
      }

      const dx = this.playerX - c.x;
      const dz = this.playerZ - c.z;
      const dist = Math.hypot(dx, dz) || 0.001;

      if (c.retreatTimer > 0) {
        c.retreatTimer -= dt;
        const awayAngle = Math.atan2(-dx, -dz);
        _vec3.set(Math.sin(awayAngle), 0, Math.cos(awayAngle));
        const retreatSpeed = 9.8;
        c.x += _vec3.x * retreatSpeed * dt;
        c.z += _vec3.z * retreatSpeed * dt;
        const resolved = this.resolveObstacleCollision(c.x, c.z, 0.5);
        c.x = resolved.x;
        c.z = resolved.z;

        const newCy = groundHeightAt(c.x, c.z);
        c.rig.root.position.set(c.x, newCy, c.z);

        const lookBackYaw = Math.atan2(dx, dz);
        c.yaw += (lookBackYaw - c.yaw) * Math.min(1, dt * 8);
        c.rig.root.rotation.y = c.yaw;
        animateRobloxCharacter(c.rig, 1.25, dt, elapsed, false, false, true, true);
        continue;
      }

      if (c.stalkPauseTimer > 0) {
        c.stalkPauseTimer -= dt;
        animateRobloxCharacter(c.rig, 0, dt, elapsed, false, false, true, false);
        continue;
      }

      const flankWeight = Math.min(1, Math.max(0, (dist - 4.5) / 10));
      const baseAngle = Math.atan2(dx, dz) + c.flankAngleOffset * flankWeight;
      _vec3.set(Math.sin(baseAngle), 0, Math.cos(baseAngle));

      _avoidVec.set(0, 0, 0);
      for (let k = 0; k < this.layout.obstacles.length; k++) {
        const o = this.layout.obstacles[k];
        const ox = c.x - o.x;
        const oz = c.z - o.z;
        const od = Math.hypot(ox, oz);
        const senseR = o.radius + 1.8;
        if (od < senseR && od > 0.001) {
          const push = (senseR - od) / senseR;
          _avoidVec.x += (ox / od) * push * 1.45;
          _avoidVec.z += (oz / od) * push * 1.45;
        }
      }
      _vec3.add(_avoidVec).normalize();

      const chaserSpeed = c.baseSpeed + difficultyRamp;
      c.x += _vec3.x * chaserSpeed * dt;
      c.z += _vec3.z * chaserSpeed * dt;

      const resolved = this.resolveObstacleCollision(c.x, c.z, 0.5);
      c.x = resolved.x;
      c.z = resolved.z;

      const newCy = groundHeightAt(c.x, c.z);
      c.rig.root.position.set(c.x, newCy, c.z);

      const targetYaw = Math.atan2(dx, dz);
      let diff = targetYaw - c.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      c.yaw += diff * Math.min(1, dt * 10);
      c.rig.root.rotation.y = c.yaw;

      animateRobloxCharacter(c.rig, 1.15, dt, elapsed, false, false, true, false);

      c.tauntTimer -= dt;
      if (c.tauntTimer <= 0) {
        const phrase = pickRandomChaserPhrase(this.settings);
        c.currentBubbleText = phrase.display;
        c.bubbleTimer = 2.4;
        c.tauntTimer = 4.6 + Math.random() * 2.6;
        this.audio.playTaunt(phrase.speech, c.pitch, false);
      }

      const newDist = Math.hypot(this.playerX - c.x, this.playerZ - c.z);
      if (newDist < 1.32 && this.playerY - newCy < 1.35) {
        this.triggerCaught(c);
        break;
      }
    }
  }

  // =========================================================================
  // ACT 3: 30 NIGHTS IN MALINKA CENTRAL PARK
  // =========================================================================

  private startAct3IntroCutscene(): void {
    this.phase = 'act3_intro_cutscene';
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.flashlightOn = false;
    this.act3Night = 1;
    this.act3DayClock = 0;
    this.act3FireFuel = 78;
    this.act3LogsInHand = 0;
    this.act3MetalInHand = 0;
    this.act3CrusherMetal = 0;
    this.act3BaseLevel = 1;
    this.act3BedCooldownNights = 0;
    this.act3BossHp = 0;
    this.act3HasSniper = false;
    this.act3Hp = this.act3MaxHp;
    this.act3InvulnTimer = 0;
    this.act3ExplosionTimer = 0;

    this.playerX = 0;
    this.playerZ = 34.0;
    this.playerY = 0;
    this.playerYaw = Math.PI;
    this.playerRig.root.visible = true;
    this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;
    this.fpSniper.group.visible = false;
    this.nikitaSniperRifle.visible = false;

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
    }
    for (const rc of this.act3RonerArmy) {
      rc.active = false;
      rc.rig.root.visible = false;
      rc.currentBubbleText = null;
    }

    if (this.act3ParkObjs) {
      this.act3ParkObjs.campfireFlames.visible = false;
      this.act3ParkObjs.campfireLight.intensity = 2;
      this.act3ParkObjs.level2FenceGroup.visible = false;
      this.act3ParkObjs.level3DefenseGroup.visible = false;
      this.act3ParkObjs.level4BedGroup.visible = false;
      this.act3ParkObjs.level5BedUpgradeGroup.visible = false;
      this.act3ParkObjs.level6BedUpgradeGroup.visible = false;
      this.act3ParkObjs.explosionSphere.visible = false;
      this.act3ParkObjs.explosionRing.visible = false;
      this.act3ParkObjs.explosionLight.intensity = 0;
    }

    this.pushHud(true);
  }

  private updateAct3IntroCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const isEn = this.settings.language === 'en';

    // Stage 0: Nikita escapes factory & sprints into Malinka Central Park (0..2.2s)
    if (this.cutsceneStage < 0 && t >= 0.05) {
      this.cutsceneStage = 0;
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: isEn
          ? 'Escaping Mivina Factory → Central Park «Malinka»...'
          : 'Убегаю с завода в Центральный парк «Малинка»...',
        tone: 'nikita',
      };
      this.pushHud(true);
    }

    if (t < 2.2) {
      const alpha = Math.min(1, t / 2.1);
      this.playerX = Math.sin(t * 2.5) * 0.45;
      this.playerZ = THREE.MathUtils.lerp(34.0, 2.8, alpha);
      this.playerYaw = Math.PI;
      this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
      this.playerRig.root.rotation.y = this.playerYaw;
      animateRobloxCharacter(this.playerRig, 1.35, dt, elapsed, false, false, false);
    } else {
      this.playerX = 0;
      this.playerZ = 2.6;
      this.playerYaw = Math.PI;
      this.playerRig.root.position.set(0, 0, 2.6);
      this.playerRig.root.rotation.y = Math.PI;
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    }

    // Stage 1 (2.2s): Nikita places campfire, delivers line & lights the fire!
    if (this.cutsceneStage < 1 && t >= 2.2) {
      this.cutsceneStage = 1;
      const line = getCutsceneLine('act3_intro_0', this.settings);
      this.playerBubbleText = line.display;
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
      this.audio.playDialogueLine(line.speech, 1.04, line.hasCensorBeep);
      this.pushHud(true);
    }

    // Stage 2 (4.6s): Ignites campfire!
    if (this.cutsceneStage < 2 && t >= 4.6) {
      this.cutsceneStage = 2;
      if (this.act3ParkObjs) {
        this.act3ParkObjs.campfireFlames.visible = true;
        this.act3ParkObjs.campfireFlames.scale.setScalar(1.0);
        this.act3ParkObjs.campfireLight.intensity = 26;
      }
      this.audio.playFireLight();
      this.emitParticles(0, 1.0, 0, 'gold');
    }

    if (t >= 6.8) {
      this.beginAct3Playing();
    }
  }

  private populateAct3Collectibles(): void {
    this.clearAct3Collectibles();
    let nextId = 1;

    const logSpots: Array<[number, number]> = [
      [-14, -14],
      [14, -15],
      [-22, -6],
      [23, -8],
      [-18, 12],
      [19, 14],
      [-10, -26],
      [12, -28],
      [-28, 18],
      [28, -22],
      [-26, -24],
      [26, 22],
    ];
    for (let i = 0; i < logSpots.length; i++) {
      const [x, z] = logSpots[i];
      const mesh = createAct3LogMesh();
      mesh.position.set(x, 0, z);
      mesh.rotation.y = i * 0.9;
      this.scene.add(mesh);
      this.act3Logs.push({
        id: nextId++,
        kind: 'log',
        x,
        z,
        available: true,
        respawnTimer: 0,
        mesh,
        phase: i * 0.7,
      });
    }

    const metalSpots: Array<[number, number]> = [
      [-12, 9],
      [13, 8],
      [-20, -18],
      [20, -19],
      [-30, -2],
      [30, 3],
      [-15, 25],
      [16, 24],
      [0, -32],
      [0, 26],
    ];
    for (let i = 0; i < metalSpots.length; i++) {
      const [x, z] = metalSpots[i];
      const mesh = createAct3MetalMesh();
      mesh.position.set(x, 0, z);
      mesh.rotation.y = i * 1.1;
      this.scene.add(mesh);
      this.act3Metals.push({
        id: nextId++,
        kind: 'metal',
        x,
        z,
        available: true,
        respawnTimer: 0,
        mesh,
        phase: i * 0.85,
      });
    }
  }

  private beginAct3Playing(): void {
    this.phase = 'playing';
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.flashlightOn = true;
    this.act3Night = 1;
    this.act3DayClock = 0;
    this.act3FireFuel = 80;
    this.act3LogsInHand = 0;
    this.act3MetalInHand = 0;
    this.act3CrusherMetal = 0;
    this.act3BaseLevel = 1;
    this.act3BedCooldownNights = 0;
    this.act3BossHp = 0;
    this.act3HasSniper = false;
    this.act3Hp = this.act3MaxHp;
    this.act3InvulnTimer = 0;
    this.act3CrusherSpinTimer = 0;

    this.playerX = 0;
    this.playerZ = 3.2;
    this.playerY = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.playerYaw = Math.PI;
    this.camYaw = 0;
    this.camPitch = 0.02;

    this.playerRig.root.visible = false;
    this.fpFlashlight.group.visible = true;
    this.tpFlashlight.group.visible = false;
    this.fpSniper.group.visible = false;
    this.nikitaSniperRifle.visible = false;
    this.sachetHand.group.visible = false;

    if (this.act3ParkObjs) {
      this.act3ParkObjs.campfireFlames.visible = true;
      this.act3ParkObjs.campfireFlames.scale.setScalar(1.0);
      this.act3ParkObjs.campfireLight.intensity = 24;
      this.act3ParkObjs.level2FenceGroup.visible = false;
      this.act3ParkObjs.level3DefenseGroup.visible = false;
      this.act3ParkObjs.level4BedGroup.visible = false;
      this.act3ParkObjs.level5BedUpgradeGroup.visible = false;
      this.act3ParkObjs.level6BedUpgradeGroup.visible = false;
      this.act3ParkObjs.bedStatusMat.color.setHex(0x22c55e);
      this.act3ParkObjs.bedStatusMat.emissive.setHex(0x16a34a);
      this.act3ParkObjs.explosionSphere.visible = false;
      this.act3ParkObjs.explosionRing.visible = false;
      this.act3ParkObjs.explosionLight.intensity = 0;
    }

    this.populateAct3Collectibles();

    // Giant Sasha (2x scale!) only appears if the campfire goes out (or Night 30 Boss Finale)
    this.chasers[0].active = false;
    this.chasers[0].rig.root.visible = false;

    const sasha = this.chasers[1];
    sasha.active = false;
    sasha.x = 0;
    sasha.z = -31;
    sasha.yaw = 0;
    sasha.rig.root.visible = false;
    sasha.rig.root.scale.setScalar(2.0);
    sasha.rig.root.position.set(sasha.x, 0, sasha.z);
    sasha.rig.angryBrows && (sasha.rig.angryBrows.visible = true);
    sasha.rig.blindfold && (sasha.rig.blindfold.visible = false);
    sasha.currentBubbleText = null;
    sasha.bubbleTimer = 0;
    sasha.tauntTimer = 4.0;
    sasha.lightExposure = 0;
    sasha.retreatTimer = 0;
    sasha.retreatCooldown = 0;

    for (const rc of this.act3RonerArmy) {
      rc.active = false;
      rc.rig.root.visible = false;
      rc.currentBubbleText = null;
    }
    const initDelays = [0.8, 2.0, 3.2];
    for (let i = 0; i < this.act3NightRonerStates.length; i++) {
      this.act3NightRonerStates[i].lightExposure = 0;
      this.act3NightRonerStates[i].retreatTimer = 0;
      this.act3NightRonerStates[i].respawnTimer = initDelays[i];
    }

    this.eventBanner =
      this.settings.language === 'en'
        ? 'ACT 3: Day 1m / Night 1m! Keep Campfire lit so Giant Sasha stays away, crush metal [E]!'
        : 'АКТ 3: День 1 мин / Ночь 1 мин! Не дай костру потухнуть, иначе выйдет Большой Саня!';
    this.eventBannerTimer = 5.5;
    this.pushHud(true);
  }

  private resolveAct3Collision(
    x: number,
    z: number,
    actorRadius: number,
    blockByFence: boolean
  ): { x: number; z: number; hitFence: boolean } {
    let nx = THREE.MathUtils.clamp(
      x,
      -ACT3_PARK_RADIUS + actorRadius,
      ACT3_PARK_RADIUS - actorRadius
    );
    let nz = THREE.MathUtils.clamp(
      z,
      -ACT3_PARK_RADIUS + actorRadius,
      ACT3_PARK_RADIUS - actorRadius
    );
    let hitFence = false;

    if (this.act3ParkObjs) {
      for (const box of this.act3ParkObjs.staticBoxColliders) {
        const dx = nx - box.x;
        const dz = nz - box.z;
        const limX = box.halfW + actorRadius;
        const limZ = box.halfD + actorRadius;
        if (Math.abs(dx) < limX && Math.abs(dz) < limZ) {
          const ovX = limX - Math.abs(dx);
          const ovZ = limZ - Math.abs(dz);
          if (ovX < ovZ) nx += dx >= 0 ? ovX : -ovX;
          else nz += dz >= 0 ? ovZ : -ovZ;
        }
      }

      if (this.act3BaseLevel >= 4) {
        const bed = this.act3ParkObjs.bedCollider;
        const dx = nx - bed.x;
        const dz = nz - bed.z;
        const limX = bed.halfW + actorRadius;
        const limZ = bed.halfD + actorRadius;
        if (Math.abs(dx) < limX && Math.abs(dz) < limZ) {
          const ovX = limX - Math.abs(dx);
          const ovZ = limZ - Math.abs(dz);
          if (ovX < ovZ) nx += dx >= 0 ? ovX : -ovX;
          else nz += dz >= 0 ? ovZ : -ovZ;
        }
      }

      if (blockByFence && this.act3BaseLevel >= 2) {
        for (const fence of this.act3ParkObjs.fenceColliders) {
          const dx = nx - fence.x;
          const dz = nz - fence.z;
          const limX = fence.halfW + actorRadius;
          const limZ = fence.halfD + actorRadius;
          if (Math.abs(dx) < limX && Math.abs(dz) < limZ) {
            hitFence = true;
            const ovX = limX - Math.abs(dx);
            const ovZ = limZ - Math.abs(dz);
            if (ovX < ovZ) nx += dx >= 0 ? ovX : -ovX;
            else nz += dz >= 0 ? ovZ : -ovZ;
          }
        }
      }

      for (const tree of this.act3ParkObjs.treeColliders) {
        const dx = nx - tree.x;
        const dz = nz - tree.z;
        const d = Math.hypot(dx, dz) || 0.001;
        const minD = tree.radius + actorRadius;
        if (d < minD) {
          nx = tree.x + (dx / d) * minD;
          nz = tree.z + (dz / d) * minD;
        }
      }
    }

    return { x: nx, z: nz, hitFence };
  }

  public interactAct3Park(): void {
    if (this.phase !== 'playing' || this.mode !== 'story_act3') return;
    if (this.act3HasSniper) {
      this.fireSniperShot();
      return;
    }

    this.audio.unlock();
    const isEn = this.settings.language === 'en';

    if (this.act3NearStation === 'campfire') {
      if (this.act3LogsInHand <= 0) {
        this.eventBanner = isEn
          ? 'Bring wooden logs from around the park to fuel the campfire!'
          : 'Принеси бревна из парка, чтобы разжечь костёр посильнее!';
        this.eventBannerTimer = 2.4;
        this.pushHud(true);
        return;
      }
      const logsUsed = this.act3LogsInHand;
      this.act3LogsInHand = 0;
      this.act3FireFuel = Math.min(100, this.act3FireFuel + logsUsed * 32);
      this.audio.playFireLight();
      this.emitParticles(ACT3_CAMPFIRE_POS.x, 1.0, ACT3_CAMPFIRE_POS.z, 'gold');
      this.floatingTexts.push({
        id: this.nextFloatId++,
        text: `+${logsUsed * 32}% 🔥`,
        worldX: ACT3_CAMPFIRE_POS.x,
        worldY: 2.2,
        worldZ: ACT3_CAMPFIRE_POS.z,
        life: 1.1,
        maxLife: 1.1,
        isGold: true,
      });
      this.pushHud(true);
      return;
    }

    if (this.act3NearStation === 'crusher') {
      if (this.act3BaseLevel >= 6) {
        this.eventBanner = isEn
          ? 'Base is already MAX Level 6 (Royal Bed skips 3 days)!'
          : 'База уже на МАКС. 6 уровне (Королевская кровать: скип 3 дня)!';
        this.eventBannerTimer = 2.4;
        this.pushHud(true);
        return;
      }
      const nextCost =
        this.act3BaseLevel === 1
          ? ACT3_LV2_METAL_COST
          : this.act3BaseLevel === 2
            ? ACT3_LV3_METAL_COST
            : this.act3BaseLevel === 3
              ? ACT3_LV4_METAL_COST
              : this.act3BaseLevel === 4
                ? ACT3_LV5_METAL_COST
                : ACT3_LV6_METAL_COST;
      if (this.act3MetalInHand <= 0) {
        this.eventBanner = isEn
          ? `Collect scrap metal in the park! (${this.act3CrusherMetal}/${nextCost})`
          : `Собери металл в парке и кинь в дробилку! (${this.act3CrusherMetal}/${nextCost})`;
        this.eventBannerTimer = 2.6;
        this.pushHud(true);
        return;
      }

      const added = this.act3MetalInHand;
      this.act3MetalInHand = 0;
      this.act3CrusherMetal += added;
      this.act3CrusherSpinTimer = 1.1;
      this.audio.playCrusherGrind();
      this.emitParticles(ACT3_CRUSHER_POS.x, 1.7, ACT3_CRUSHER_POS.z, 'battery');
      this.floatingTexts.push({
        id: this.nextFloatId++,
        text: `+${added} ⚙️`,
        worldX: ACT3_CRUSHER_POS.x,
        worldY: 2.3,
        worldZ: ACT3_CRUSHER_POS.z,
        life: 1.0,
        maxLife: 1.0,
        isGold: false,
      });

      if (this.act3CrusherMetal >= nextCost) {
        this.act3CrusherMetal -= nextCost;
        this.act3BaseLevel = (this.act3BaseLevel + 1) as 2 | 3 | 4 | 5 | 6;
        if (this.act3ParkObjs) {
          this.act3ParkObjs.level2FenceGroup.visible = this.act3BaseLevel >= 2;
          this.act3ParkObjs.level3DefenseGroup.visible = this.act3BaseLevel >= 3;
          this.act3ParkObjs.level4BedGroup.visible = this.act3BaseLevel >= 4;
          this.act3ParkObjs.level5BedUpgradeGroup.visible = this.act3BaseLevel >= 5;
          this.act3ParkObjs.level6BedUpgradeGroup.visible = this.act3BaseLevel >= 6;
        }
        this.audio.playBaseUpgrade();
        this.emitParticles(
          this.act3BaseLevel >= 4 ? ACT3_BED_POS.x : 0,
          2.0,
          this.act3BaseLevel >= 4 ? ACT3_BED_POS.z : 0,
          'gold'
        );
        if (this.act3BaseLevel === 2) {
          this.eventBanner = isEn
            ? 'BASE LEVEL 2! Perimeter Fence built!'
            : 'БАЗА 2 УРОВЕНЬ! Построен небольшой забор!';
        } else if (this.act3BaseLevel === 3) {
          this.eventBanner = isEn
            ? 'BASE LEVEL 3! Barbed Wire & Floodlight Lamps installed!'
            : 'БАЗА 3 УРОВЕНЬ! Колючая проволока и лампы включены!';
        } else if (this.act3BaseLevel === 4) {
          this.eventBanner = isEn
            ? 'BASE LEVEL 4! Camp Bed built (Sleep to skip 1 night · 1-night CD)!'
            : 'БАЗА 4 УРОВЕНЬ! Поставлена кровать (скип 1 ночи · КД 1 ночь)!';
        } else if (this.act3BaseLevel === 5) {
          this.eventBanner = isEn
            ? 'BASE LEVEL 5! Bed upgraded with Canopy (skips 2 days · 1-night CD)!'
            : 'БАЗА 5 УРОВЕНЬ! Кровать улучшена (скипает 2 дня · КД 1 ночь)!';
        } else {
          this.eventBanner = isEn
            ? 'BASE LEVEL 6! Royal Bed unlocked (skips 3 days · 1-night CD)!'
            : 'БАЗА 6 УРОВЕНЬ! Королевская кровать (скипает 3 дня · КД 1 ночь)!';
        }
        this.eventBannerTimer = 4.5;
      }
      this.pushHud(true);
      return;
    }

    if (this.act3NearStation === 'bed' && this.act3BaseLevel >= 4) {
      if (this.act3BedCooldownNights > 0) {
        this.eventBanner = isEn
          ? 'Bed is on cooldown — survive 1 full night to recharge!'
          : 'Кровать перезаряжается — проживи 1 ночь до следующего сна!';
        this.eventBannerTimer = 2.6;
        this.pushHud(true);
        return;
      }
      if (this.act3Night < ACT3_MAX_NIGHTS) {
        const skipDays =
          this.act3BaseLevel >= 6 ? 3 : this.act3BaseLevel === 5 ? 2 : 1;
        const actualSkip = Math.max(
          1,
          Math.min(skipDays, ACT3_MAX_NIGHTS - this.act3Night)
        );
        this.audio.playBedSleep();
        this.emitParticles(ACT3_BED_POS.x, 1.3, ACT3_BED_POS.z, 'gold');
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text:
            actualSkip === 1
              ? isEn
                ? '💤 -1 NIGHT'
                : '💤 -1 НОЧЬ'
              : isEn
                ? `💤 -${actualSkip} DAYS`
                : `💤 -${actualSkip} ДНЯ`,
          worldX: ACT3_BED_POS.x,
          worldY: 2.1,
          worldZ: ACT3_BED_POS.z,
          life: 1.6,
          maxLife: 1.6,
          isGold: true,
        });

        this.act3Night = Math.min(ACT3_MAX_NIGHTS, this.act3Night + actualSkip);
        this.act3DayClock = 0;
        this.act3BedCooldownNights = 1;

        for (let i = 0; i < this.act3NightRonerStates.length; i++) {
          const rc = this.act3RonerArmy[i];
          const st = this.act3NightRonerStates[i];
          if (rc && rc.active) {
            rc.active = false;
            rc.rig.root.visible = false;
            rc.currentBubbleText = null;
          }
          st.lightExposure = 0;
          st.retreatTimer = 0;
        }

        if (this.act3Night === ACT3_MAX_NIGHTS) {
          this.triggerAct3Night30Climax();
        } else {
          const sasha = this.chasers[1];
          if (this.act3FireFuel <= 0) {
            this.act3FireFuel = 25;
            if (sasha.active) {
              sasha.active = false;
              sasha.rig.root.visible = false;
              sasha.lightExposure = 0;
              sasha.retreatTimer = 0;
            }
          }
          this.eventBanner = isEn
            ? `Slept in Bed! Skipped ${actualSkip} ${actualSkip === 1 ? 'night' : 'days'} → Day ${this.act3Night}/30 (Bed CD: 1 night).`
            : `Поспали в кровати! Пропущено ${actualSkip} ${actualSkip === 1 ? 'ночь' : 'дня'} → День ${this.act3Night}/30 (КД кровати: 1 ночь).`;
          this.eventBannerTimer = 4.2;
        }
        this.pushHud(true);
      }
      return;
    }

    if (this.act3NearStation === 'map') {
      this.audio.playFlashlightClick(true);
      this.eventBanner = isEn
        ? 'Park Map: Logs -> Campfire | Metal -> Crusher (Lv.4–6 Bed) | North -> JoJo Village!'
        : 'Карта парка: Бревна → Костёр | Металл → Дробилка (4–6 ур. Кровать) | Север → «ДжоДжо»!';
      this.eventBannerTimer = 3.6;
      this.pushHud(true);
      return;
    }

    if (this.act3NearStation === 'log' && this.act3NearItemId !== null) {
      const item = this.act3Logs.find((l) => l.id === this.act3NearItemId && l.available);
      if (item && this.act3LogsInHand < 3) {
        item.available = false;
        item.respawnTimer = 11.0;
        item.mesh.visible = false;
        this.act3LogsInHand += 1;
        this.audio.playBoxPickup();
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text: isEn ? '+1 LOG' : '+1 БРЕВНО',
          worldX: item.x,
          worldY: 1.2,
          worldZ: item.z,
          life: 0.9,
          maxLife: 0.9,
          isGold: false,
        });
        this.pushHud(true);
      }
      return;
    }

    if (this.act3NearStation === 'metal' && this.act3NearItemId !== null) {
      const item = this.act3Metals.find((m) => m.id === this.act3NearItemId && m.available);
      if (item && this.act3MetalInHand < 3) {
        item.available = false;
        item.respawnTimer = 12.0;
        item.mesh.visible = false;
        this.act3MetalInHand += 1;
        this.audio.playBatteryPickup();
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text: isEn ? '+1 METAL' : '+1 МЕТАЛЛ',
          worldX: item.x,
          worldY: 1.2,
          worldZ: item.z,
          life: 0.9,
          maxLife: 0.9,
          isGold: true,
        });
        this.pushHud(true);
      }
    }
  }

  private spawnAct3FlankRoner(slotIdx: number): void {
    const rc = this.act3RonerArmy[slotIdx];
    const st = this.act3NightRonerStates[slotIdx];
    if (!rc || !st) return;

    const sinY = Math.sin(this.camYaw);
    const cosY = Math.cos(this.camYaw);
    let dirX = sinY;
    let dirZ = cosY;
    if (st.flank === 'right') {
      dirX = cosY;
      dirZ = -sinY;
    } else if (st.flank === 'left') {
      dirX = -cosY;
      dirZ = sinY;
    }

    const spawnDist = 20 + Math.random() * 5;
    let sx = THREE.MathUtils.clamp(
      this.playerX + dirX * spawnDist,
      -ACT3_PARK_RADIUS + 2.5,
      ACT3_PARK_RADIUS - 2.5
    );
    let sz = THREE.MathUtils.clamp(
      this.playerZ + dirZ * spawnDist,
      -ACT3_PARK_RADIUS + 2.5,
      ACT3_PARK_RADIUS - 2.5
    );

    if (this.act3BaseLevel >= 2 && Math.hypot(sx, sz) < 10.5) {
      const d = Math.hypot(sx, sz) || 1;
      sx = (sx / d) * 12.0;
      sz = (sz / d) * 12.0;
    }

    rc.x = sx;
    rc.z = sz;
    rc.active = true;
    rc.deadTimer = 0;
    rc.speed = 3.75 + Math.min(1.15, this.act3Night * 0.04);
    rc.rig.root.visible = true;
    rc.rig.root.position.set(rc.x, 0, rc.z);
    rc.rig.bodyPivot.rotation.x = 0;
    rc.rig.bodyPivot.position.y = 0;
    rc.currentBubbleText = null;
    rc.bubbleTimer = 0;
    rc.tauntTimer = 2.0 + slotIdx * 1.1;
    st.lightExposure = 0;
    st.retreatTimer = 0;
  }

  private triggerAct3Night30Climax(): void {
    this.act3HasSniper = true;
    this.act3BossHp = ACT3_BOSS_MAX_HP;
    this.sniperFireCooldown = 0;
    this.sniperRecoil = 0;
    this.sniperMuzzleTimer = 0;
    this.audio.playNightHorn();

    for (const st of this.act3NightRonerStates) {
      st.lightExposure = 0;
      st.retreatTimer = 0;
      st.respawnTimer = 0;
    }

    const sasha = this.chasers[1];
    sasha.active = true;
    sasha.x = 0;
    sasha.z = -24;
    sasha.rig.root.visible = true;
    sasha.rig.root.scale.setScalar(2.0);
    sasha.currentBubbleText =
      this.settings.language === 'en' ? 'NIGHT 30!! BOSS SASHA!!' : 'НОЧЬ 30!! БОСС САНЯ!!';
    sasha.bubbleTimer = 3.0;

    // Spawn 8 RONER wave clones around the outer park!
    for (let i = 0; i < this.act3RonerArmy.length; i++) {
      const rc = this.act3RonerArmy[i];
      const ang = (i / this.act3RonerArmy.length) * Math.PI * 2;
      const dist = 23 + (i % 2) * 5;
      rc.x = Math.cos(ang) * dist;
      rc.z = Math.sin(ang) * dist;
      rc.active = true;
      rc.deadTimer = 0;
      rc.speed = 4.6 + (i % 3) * 0.4;
      rc.rig.root.visible = true;
      rc.rig.root.position.set(rc.x, 0, rc.z);
      rc.rig.bodyPivot.rotation.x = 0;
      rc.rig.bodyPivot.position.y = 0;
      rc.currentBubbleText = null;
      rc.bubbleTimer = 0;
    }

    this.eventBanner =
      this.settings.language === 'en'
        ? 'NIGHT 30! Equipped Sniper Rifle — defeat Boss Giant Sasha & the RONER Army [LMB / E]!'
        : '30-Я НОЧЬ! Получена снайперка — побей Босса Саню и волну RONER [ЛКМ / E]!';
    this.eventBannerTimer = 6.5;
    this.pushHud(true);
  }

  private updateAct3Playing(dt: number, elapsed: number): void {
    this.elapsedPlaying += dt;
    const isEn = this.settings.language === 'en';

    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer -= dt;
      if (this.eventBannerTimer <= 0) this.eventBanner = null;
    }
    if (this.act3InvulnTimer > 0) this.act3InvulnTimer = Math.max(0, this.act3InvulnTimer - dt);
    if (this.act3CrusherSpinTimer > 0) this.act3CrusherSpinTimer = Math.max(0, this.act3CrusherSpinTimer - dt);
    if (this.sniperFireCooldown > 0) this.sniperFireCooldown = Math.max(0, this.sniperFireCooldown - dt);
    if (this.sniperRecoil > 0) this.sniperRecoil = Math.max(0, this.sniperRecoil - dt * 5.2);
    if (this.sniperMuzzleTimer > 0) this.sniperMuzzleTimer = Math.max(0, this.sniperMuzzleTimer - dt);
    if (this.cameraShake > 0.005) {
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 9, dt);
    }

    // 30-Night Cycle progression (Day = 1 min, Night = 1 min; Night 30 stays until Boss + RONER wave defeated)
    const prevIsNight =
      this.act3Night >= ACT3_MAX_NIGHTS || this.act3DayClock >= ACT3_DAY_DURATION;
    if (this.act3Night < ACT3_MAX_NIGHTS) {
      this.act3DayClock += dt;
      if (this.act3DayClock >= ACT3_CYCLE_SECONDS) {
        this.act3DayClock -= ACT3_CYCLE_SECONDS;
        this.act3Night += 1;
        this.act3BedCooldownNights = Math.max(0, this.act3BedCooldownNights - 1);
        if (this.act3Night === ACT3_MAX_NIGHTS) {
          this.triggerAct3Night30Climax();
        } else {
          this.floatingTexts.push({
            id: this.nextFloatId++,
            text: isEn ? `DAY ${this.act3Night}/30` : `ДЕНЬ ${this.act3Night}/30`,
            worldX: this.playerX,
            worldY: 2.6,
            worldZ: this.playerZ - 2.5,
            life: 1.8,
            maxLife: 1.8,
            isGold: false,
          });
        }
      }
    }

    const isNight =
      this.act3Night >= ACT3_MAX_NIGHTS || this.act3DayClock >= ACT3_DAY_DURATION;
    if (!prevIsNight && isNight && this.act3Night < ACT3_MAX_NIGHTS) {
      this.audio.playNightHorn();
      this.floatingTexts.push({
        id: this.nextFloatId++,
        text: isEn ? `NIGHT ${this.act3Night}/30` : `НОЧЬ ${this.act3Night}/30`,
        worldX: this.playerX,
        worldY: 2.6,
        worldZ: this.playerZ - 2.5,
        life: 1.8,
        maxLife: 1.8,
        isGold: true,
      });
      const nightDelays = [0.7, 1.9, 3.1];
      for (let i = 0; i < this.act3NightRonerStates.length; i++) {
        this.act3NightRonerStates[i].lightExposure = 0;
        this.act3NightRonerStates[i].retreatTimer = 0;
        this.act3NightRonerStates[i].respawnTimer = nightDelays[i];
      }
      if (!this.eventBanner) {
        this.eventBanner = isEn
          ? 'NIGHTFALL! RONERs stalk from behind, left & right — shine Flashlight [F] to scare them!'
          : 'НАСТУПИЛА НОЧЬ! RONER идут сзади, справа и слева — отгоняй фонариком [F]!';
        this.eventBannerTimer = 4.8;
      }
    } else if (prevIsNight && !isNight && this.act3Night < ACT3_MAX_NIGHTS) {
      for (let i = 0; i < this.act3NightRonerStates.length; i++) {
        const rc = this.act3RonerArmy[i];
        const st = this.act3NightRonerStates[i];
        if (rc && rc.active) {
          this.emitParticles(rc.x, 1.4, rc.z, 'gold');
          rc.active = false;
          rc.rig.root.visible = false;
          rc.currentBubbleText = null;
        }
        st.lightExposure = 0;
        st.retreatTimer = 0;
      }
    }

    // Atmosphere shifts smoothly between dusk/day and tense crimson/dark Night
    if (this.act3Night >= ACT3_MAX_NIGHTS) {
      this.scene.background = new THREE.Color(0x190910);
      this.fog.color.setHex(0x190910);
      this.fog.density = 0.015;
      this.moonLight.intensity = 0.58;
    } else if (isNight) {
      this.scene.background = new THREE.Color(0x070d16);
      this.fog.color.setHex(0x070d16);
      this.fog.density = 0.019;
      this.moonLight.intensity = 0.34;
    } else {
      this.scene.background = new THREE.Color(0x162235);
      this.fog.color.setHex(0x162235);
      this.fog.density = 0.011;
      this.moonLight.intensity = 0.85;
    }

    // Campfire fuel drain & visual flicker (tuned for 1 min day / 1 min night)
    const drainRate = isNight ? 2.3 : 1.15;
    this.act3FireFuel = Math.max(0, this.act3FireFuel - dt * drainRate);
    if (this.act3ParkObjs) {
      const fuelRatio = this.act3FireFuel / 100;
      const flicker = 0.92 + Math.sin(elapsed * 16) * 0.08;
      this.act3ParkObjs.campfireFlames.visible = this.act3FireFuel > 1;
      this.act3ParkObjs.campfireFlames.scale.setScalar(
        THREE.MathUtils.clamp(0.42 + fuelRatio * 0.88, 0.3, 1.3) * flicker
      );
      this.act3ParkObjs.campfireLight.intensity =
        this.act3FireFuel > 1 ? (6 + fuelRatio * 28) * flicker : 1.5;
      this.act3ParkObjs.campfireGlowRing.scale.setScalar(0.85 + fuelRatio * 0.45);

      // Spin crusher rollers when feeding metal
      const spinSpeed = this.act3CrusherSpinTimer > 0 ? 9.5 : 0.65;
      this.act3ParkObjs.crusherLeftRoller.rotation.y += dt * spinSpeed;
      this.act3ParkObjs.crusherRightRoller.rotation.y -= dt * spinSpeed;

      if (this.act3BaseLevel >= 4) {
        if (this.act3BedCooldownNights > 0) {
          this.act3ParkObjs.bedStatusMat.color.setHex(0xf43f5e);
          this.act3ParkObjs.bedStatusMat.emissive.setHex(0x9f1239);
        } else {
          this.act3ParkObjs.bedStatusMat.color.setHex(0x22c55e);
          this.act3ParkObjs.bedStatusMat.emissive.setHex(0x16a34a);
        }
      }
    }

    // Player movement
    let inX = this.virtualMoveX;
    let inZ = this.virtualMoveZ;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inZ -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inZ += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inX += 1;
    if (this.heldKeys.has('KeyQ')) this.camYaw += dt * 2.1;

    const inputLen = Math.hypot(inX, inZ);
    const hasMove = inputLen > 0.05;
    if (hasMove) {
      inX /= Math.max(1, inputLen);
      inZ /= Math.max(1, inputLen);
    }

    const wantsSprint =
      (this.heldKeys.has('ShiftLeft') ||
        this.heldKeys.has('ShiftRight') ||
        this.virtualSprint) &&
      hasMove;
    const isSprinting = wantsSprint && this.stamina > 2;
    const insideCamp = Math.hypot(this.playerX, this.playerZ) < 8.5;
    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 22);
    } else {
      const regenBonus = this.act3BaseLevel >= 3 && insideCamp ? 14 : 0;
      this.stamina = Math.min(100, this.stamina + dt * ((hasMove ? 18 : 28) + regenBonus));
    }

    const moveSpeed = isSprinting ? 12.2 : 8.4;
    if (hasMove) {
      const sinY = Math.sin(this.camYaw);
      const cosY = Math.cos(this.camYaw);
      const worldDx = inX * cosY + inZ * sinY;
      const worldDz = -inX * sinY + inZ * cosY;

      this.playerX += worldDx * moveSpeed * dt;
      this.playerZ += worldDz * moveSpeed * dt;
      // Nikita can step smoothly into/out of camp, but collides with props/trees & fence panels
      const res = this.resolveAct3Collision(this.playerX, this.playerZ, 0.5, true);
      this.playerX = res.x;
      this.playerZ = res.z;

      if (this.isGrounded) {
        this.footstepAccum += dt * (isSprinting ? 2.8 : 2.0);
        if (this.footstepAccum >= 1) {
          this.footstepAccum = 0;
          this.audio.playFootstep(isSprinting);
        }
      }
    }
    this.playerYaw = this.camYaw + Math.PI;

    // Jump physics
    if (this.isGrounded) this.coyoteTimer = 0.12;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVy = 8.4;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.audio.playJump();
    }
    if (!this.isGrounded || this.playerY > 0.01) {
      this.playerVy -= 22.5 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerY = 0;
    }

    // Collectibles respawn & auto/hover prompts (disabled focus once Night 30 Sniper active, though auto-pickup still works)
    this.act3NearStation = null;
    this.act3NearItemId = null;
    let prompt: string | null = null;

    for (const log of this.act3Logs) {
      if (!log.available) {
        log.respawnTimer -= dt;
        if (log.respawnTimer <= 0) {
          log.available = true;
          log.mesh.visible = true;
        }
        continue;
      }
      log.phase += dt * 2.2;
      log.mesh.position.y = Math.sin(log.phase) * 0.04;
      const d = Math.hypot(log.x - this.playerX, log.z - this.playerZ);
      if (d < 1.45 && this.act3LogsInHand < 3) {
        log.available = false;
        log.respawnTimer = 11.0;
        log.mesh.visible = false;
        this.act3LogsInHand += 1;
        this.audio.playBoxPickup();
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text: isEn ? '+1 LOG' : '+1 БРЕВНО',
          worldX: log.x,
          worldY: 1.2,
          worldZ: log.z,
          life: 0.9,
          maxLife: 0.9,
          isGold: false,
        });
      } else if (d < 2.6 && !this.act3HasSniper && this.act3LogsInHand < 3) {
        this.act3NearStation = 'log';
        this.act3NearItemId = log.id;
        prompt = isEn ? '[E / Click] Pick up Log' : '[E / ЛКМ] Взять бревно';
      }
    }

    for (const metal of this.act3Metals) {
      if (!metal.available) {
        metal.respawnTimer -= dt;
        if (metal.respawnTimer <= 0) {
          metal.available = true;
          metal.mesh.visible = true;
        }
        continue;
      }
      metal.phase += dt * 2.6;
      metal.mesh.position.y = Math.sin(metal.phase) * 0.05;
      const d = Math.hypot(metal.x - this.playerX, metal.z - this.playerZ);
      if (d < 1.45 && this.act3MetalInHand < 3) {
        metal.available = false;
        metal.respawnTimer = 12.0;
        metal.mesh.visible = false;
        this.act3MetalInHand += 1;
        this.audio.playBatteryPickup();
        this.floatingTexts.push({
          id: this.nextFloatId++,
          text: isEn ? '+1 METAL' : '+1 МЕТАЛЛ',
          worldX: metal.x,
          worldY: 1.2,
          worldZ: metal.z,
          life: 0.9,
          maxLife: 0.9,
          isGold: true,
        });
      } else if (d < 2.6 && !this.act3HasSniper && this.act3MetalInHand < 3) {
        this.act3NearStation = 'metal';
        this.act3NearItemId = metal.id;
        prompt = isEn ? '[E / Click] Pick up Metal' : '[E / ЛКМ] Взять металл';
      }
    }

    if (!this.act3HasSniper) {
      const distFire = Math.hypot(
        this.playerX - ACT3_CAMPFIRE_POS.x,
        this.playerZ - ACT3_CAMPFIRE_POS.z
      );
      const distCrusher = Math.hypot(
        this.playerX - ACT3_CRUSHER_POS.x,
        this.playerZ - ACT3_CRUSHER_POS.z
      );
      const distMap = Math.hypot(
        this.playerX - ACT3_MAP_POS.x,
        this.playerZ - ACT3_MAP_POS.z
      );
      const distBed = Math.hypot(
        this.playerX - ACT3_BED_POS.x,
        this.playerZ - ACT3_BED_POS.z
      );

      if (distFire < 3.4) {
        this.act3NearStation = 'campfire';
        prompt =
          this.act3LogsInHand > 0
            ? isEn
              ? `[E / Click] Throw ${this.act3LogsInHand} Log(s) in Campfire`
              : `[E / ЛКМ] Бросить бревна (${this.act3LogsInHand}) в костёр`
            : isEn
              ? 'Campfire (Bring logs from park)'
              : 'Костёр (принеси бревна из парка)';
      } else if (distCrusher < 3.2) {
        this.act3NearStation = 'crusher';
        const cost =
          this.act3BaseLevel === 1
            ? ACT3_LV2_METAL_COST
            : this.act3BaseLevel === 2
              ? ACT3_LV3_METAL_COST
              : this.act3BaseLevel === 3
                ? ACT3_LV4_METAL_COST
                : this.act3BaseLevel === 4
                  ? ACT3_LV5_METAL_COST
                  : this.act3BaseLevel === 5
                    ? ACT3_LV6_METAL_COST
                    : 0;
        prompt =
          this.act3BaseLevel >= 6
            ? isEn
              ? 'Crusher · Base MAX Level 6'
              : 'Дробилка · База МАКС 6 ур.'
            : this.act3MetalInHand > 0
              ? isEn
                ? `[E / Click] Crush Metal (${this.act3CrusherMetal}/${cost} → Lv.${this.act3BaseLevel + 1})`
                : `[E / ЛКМ] Кинуть металл (${this.act3CrusherMetal}/${cost} → Ур.${this.act3BaseLevel + 1})`
              : isEn
                ? `Crusher (${this.act3CrusherMetal}/${cost} Metal → Lv.${this.act3BaseLevel + 1})`
                : `Дробилка (${this.act3CrusherMetal}/${cost} металла → Ур.${this.act3BaseLevel + 1})`;
      } else if (this.act3BaseLevel >= 4 && distBed < 3.0) {
        this.act3NearStation = 'bed';
        const skipLabel =
          this.act3BaseLevel >= 6
            ? isEn
              ? 'skip 3 days'
              : 'скип 3 дня'
            : this.act3BaseLevel === 5
              ? isEn
                ? 'skip 2 days'
                : 'скип 2 дня'
              : isEn
                ? 'skip 1 night'
                : 'скип 1 ночи';
        prompt =
          this.act3BedCooldownNights > 0
            ? isEn
              ? 'Bed recharging (1 night cooldown)'
              : 'Кровать на перезарядке (осталась 1 ночь)'
            : isEn
              ? `[E / Click] Sleep in Bed (${skipLabel})`
              : `[E / ЛКМ] Поспать в кровати (${skipLabel})`;
      } else if (distMap < 2.8) {
        this.act3NearStation = 'map';
        prompt = isEn ? '[E / Click] Read Park Map' : '[E / ЛКМ] Посмотреть карту парка';
      } else if (this.playerZ < -37.2 && Math.abs(this.playerX) < 5.2) {
        prompt = isEn
          ? 'Passage to «JoJo» Village is chained shut!'
          : 'Проход в деревню «ДжоДжо» закрыт на цепь!';
      }
    }
    this.interactPrompt = prompt;

    // Giant Sasha (2x scale!) ONLY spawns when campfire goes out (Nights 1..29), or on Night 30 Boss fight
    const sasha = this.chasers[1];
    if (this.act3Night < ACT3_MAX_NIGHTS) {
      if (this.act3FireFuel <= 0) {
        if (!sasha.active) {
          const spawnAng = Math.atan2(this.playerZ, this.playerX) + Math.PI;
          sasha.x = THREE.MathUtils.clamp(Math.cos(spawnAng) * 28, -33, 33);
          sasha.z = THREE.MathUtils.clamp(Math.sin(spawnAng) * 28, -33, 33);
          sasha.active = true;
          sasha.rig.root.visible = true;
          sasha.rig.root.scale.setScalar(2.0);
          sasha.rig.root.position.set(sasha.x, 0, sasha.z);
          sasha.tauntTimer = 1.6;
          this.audio.playNightHorn();
          this.eventBanner = isEn
            ? 'CAMPFIRE WENT OUT! Giant Sasha appeared — shine flashlight & relight fire!'
            : 'КОСТЁР ПОТУХ! Появился Большой Саня — свети фонариком и разожги костёр!';
          this.eventBannerTimer = 4.5;
          this.pushHud(true);
        }
      } else if (sasha.active) {
        this.emitParticles(sasha.x, 2.0, sasha.z, 'gold');
        sasha.active = false;
        sasha.rig.root.visible = false;
        sasha.currentBubbleText = null;
        this.eventBanner = isEn
          ? 'Campfire lit! Giant Sasha vanished back into the dark!'
          : 'Костёр горит! Большой Саня отступил в темноту!';
        this.eventBannerTimer = 3.2;
        this.pushHud(true);
      }
    }

    if (sasha.active && (this.act3Night < ACT3_MAX_NIGHTS || this.act3BossHp > 0)) {
      if (sasha.bubbleTimer > 0) {
        sasha.bubbleTimer -= dt;
        if (sasha.bubbleTimer <= 0) sasha.currentBubbleText = null;
      }

      const dx = this.playerX - sasha.x;
      const dz = this.playerZ - sasha.z;
      const distToPlayer = Math.hypot(dx, dz) || 1;
      const distToCamp = Math.hypot(sasha.x, sasha.z);

      let speed =
        this.act3Night >= ACT3_MAX_NIGHTS
          ? 5.6
          : isNight
            ? 5.3 + Math.min(1.8, this.act3Night * 0.05)
            : 4.3;

      // Level 3 Barbed Wire + Floodlight slows him near perimeter
      if (this.act3BaseLevel >= 3 && distToCamp < 10.5 && this.act3Night < ACT3_MAX_NIGHTS) {
        speed *= 0.52;
      }

      let moveX = dx / distToPlayer;
      let moveZ = dz / distToPlayer;
      let facingOverride: number | null = null;

      // Shining flashlight on Giant Sasha makes him step back slightly!
      if (this.flashlightOn && !this.act3HasSniper && distToPlayer < 18) {
        this.camera.getWorldDirection(_beamDir);
        _vec3.set(sasha.x - this.playerX, 0, sasha.z - this.playerZ).normalize();
        if (_beamDir.dot(_vec3) > 0.72) {
          facingOverride = Math.atan2(dx, dz);
          if (distToPlayer < 13.5) {
            moveX = -dx / distToPlayer;
            moveZ = -dz / distToPlayer;
            speed = 3.1;
          } else {
            speed *= 0.25;
          }
        }
      }

      sasha.x += moveX * speed * dt;
      sasha.z += moveZ * speed * dt;
      const res = this.resolveAct3Collision(
        sasha.x,
        sasha.z,
        0.95,
        this.act3Night < ACT3_MAX_NIGHTS
      );
      sasha.x = res.x;
      sasha.z = res.z;
      sasha.yaw = facingOverride ?? Math.atan2(moveX, moveZ);
      sasha.rig.root.position.set(sasha.x, 0, sasha.z);
      sasha.rig.root.rotation.y = sasha.yaw;
      animateRobloxCharacter(sasha.rig, 1.1, dt, elapsed, false, false, true, false);

      sasha.tauntTimer -= dt;
      if (sasha.tauntTimer <= 0) {
        sasha.tauntTimer = 5.5 + Math.random() * 4.0;
        const phrase = pickRandomChaserPhrase(this.settings);
        sasha.currentBubbleText = phrase.display;
        sasha.bubbleTimer = 2.2;
        if (distToPlayer < 26) {
          this.audio.playTaunt(phrase.speech, 0.78, false);
        }
      }

      if (distToPlayer < 2.05 && this.playerY < 1.6 && this.act3InvulnTimer <= 0) {
        this.act3Hp = Math.max(0, this.act3Hp - 1);
        this.act3InvulnTimer = 1.6;
        this.cameraShake = 0.58;
        this.audio.playPlayerHit();
        if (this.act3Hp <= 0) {
          this.triggerCaught(sasha);
          return;
        }
        // Knock Giant Sasha back slightly on hit
        sasha.x -= (dx / distToPlayer) * 4.5;
        sasha.z -= (dz / distToPlayer) * 4.5;
        this.pushHud(true);
      }
    }

    // Nights 1..29: Nocturnal RONER flankers coming from behind, right, and left (afraid of flashlight!)
    if (this.act3Night < ACT3_MAX_NIGHTS && isNight) {
      for (let i = 0; i < this.act3NightRonerStates.length; i++) {
        const rc = this.act3RonerArmy[i];
        const st = this.act3NightRonerStates[i];
        if (!rc) continue;

        if (!rc.active) {
          st.respawnTimer -= dt;
          if (st.respawnTimer <= 0) {
            this.spawnAct3FlankRoner(i);
          }
          continue;
        }

        if (rc.bubbleTimer > 0) {
          rc.bubbleTimer -= dt;
          if (rc.bubbleTimer <= 0) rc.currentBubbleText = null;
        }

        const dx = this.playerX - rc.x;
        const dz = this.playerZ - rc.z;
        const dist = Math.hypot(dx, dz) || 1;

        if (st.retreatTimer > 0) {
          st.retreatTimer -= dt;
          const runX = -dx / dist;
          const runZ = -dz / dist;
          rc.x += runX * 11.4 * dt;
          rc.z += runZ * 11.4 * dt;
          const res = this.resolveAct3Collision(rc.x, rc.z, 0.5, false);
          rc.x = res.x;
          rc.z = res.z;
          rc.yaw = Math.atan2(runX, runZ);
          rc.rig.root.position.set(rc.x, 0, rc.z);
          rc.rig.root.rotation.y = rc.yaw;
          animateRobloxCharacter(rc.rig, 1.35, dt, elapsed, false, false, true, false);
          if (st.retreatTimer <= 0) {
            rc.active = false;
            rc.rig.root.visible = false;
            rc.currentBubbleText = null;
            st.respawnTimer = 6.5 + Math.random() * 4.5;
          }
          continue;
        }

        let moveX = dx / dist;
        let moveZ = dz / dist;
        let speed = rc.speed;
        let facingOverride: number | null = null;

        // Level 3 barbed wire & floodlight slows them down near base
        if (this.act3BaseLevel >= 3 && Math.hypot(rc.x, rc.z) < 10.5) {
          speed *= 0.55;
        }

        // Afraid of the flashlight! Shining the beam makes them recoil & run away!
        if (this.flashlightOn && !this.act3HasSniper && dist < 17) {
          this.camera.getWorldDirection(_beamDir);
          _vec3.set(rc.x - this.playerX, 0, rc.z - this.playerZ).normalize();
          if (_beamDir.dot(_vec3) > 0.7) {
            st.lightExposure += dt;
            facingOverride = Math.atan2(dx, dz);
            moveX = -dx / dist;
            moveZ = -dz / dist;
            speed = 2.6;
            if (st.lightExposure >= 0.32) {
              st.lightExposure = 0;
              st.retreatTimer = 2.4;
              this.flashlightStuns++;
              const krysa = getKrysaRetreatLine(this.settings);
              rc.currentBubbleText = krysa.display;
              rc.bubbleTimer = 2.1;
              this.audio.playKrysaRetreat(rc.pitch, krysa.speech, krysa.hasCensorBeep);
              continue;
            }
          } else {
            st.lightExposure = Math.max(0, st.lightExposure - dt * 1.4);
          }
        } else {
          st.lightExposure = Math.max(0, st.lightExposure - dt * 1.4);
        }

        rc.x += moveX * speed * dt;
        rc.z += moveZ * speed * dt;
        const res = this.resolveAct3Collision(rc.x, rc.z, 0.5, true);
        rc.x = res.x;
        rc.z = res.z;
        rc.yaw = facingOverride ?? Math.atan2(moveX, moveZ);
        rc.rig.root.position.set(rc.x, 0, rc.z);
        rc.rig.root.rotation.y = rc.yaw;
        animateRobloxCharacter(rc.rig, 1.1, dt, elapsed, false, false, true, false);

        rc.tauntTimer -= dt;
        if (rc.tauntTimer <= 0) {
          rc.tauntTimer = 6.5 + Math.random() * 4.5;
          const phrase = pickRandomChaserPhrase(this.settings);
          rc.currentBubbleText = phrase.display;
          rc.bubbleTimer = 2.0;
          if (dist < 22) {
            this.audio.playTaunt(phrase.speech, rc.pitch, false);
          }
        }

        if (dist < 1.55 && this.playerY < 1.35 && this.act3InvulnTimer <= 0) {
          this.act3Hp = Math.max(0, this.act3Hp - 1);
          this.act3InvulnTimer = 1.5;
          this.cameraShake = 0.52;
          this.audio.playPlayerHit();
          if (this.act3Hp <= 0) {
            this.triggerCaught(rc);
            return;
          }
          rc.x -= (dx / dist) * 4.0;
          rc.z -= (dz / dist) * 4.0;
          this.pushHud(true);
        }
      }
    }

    // Night 30 RONER Army Wave
    if (this.act3Night >= ACT3_MAX_NIGHTS) {
      let aliveRoner = 0;
      for (const rc of this.act3RonerArmy) {
        if (!rc.active) continue;
        if (rc.bubbleTimer > 0) {
          rc.bubbleTimer -= dt;
          if (rc.bubbleTimer <= 0) rc.currentBubbleText = null;
        }
        if (rc.deadTimer > 0) {
          rc.deadTimer -= dt;
          animateRobloxCharacter(rc.rig, 0, dt, elapsed, false, true, true);
          if (rc.deadTimer <= 0) {
            rc.active = false;
            rc.rig.root.visible = false;
          }
          continue;
        }
        aliveRoner++;
        const dx = this.playerX - rc.x;
        const dz = this.playerZ - rc.z;
        const dist = Math.hypot(dx, dz) || 1;
        rc.x += (dx / dist) * rc.speed * dt;
        rc.z += (dz / dist) * rc.speed * dt;
        const res = this.resolveAct3Collision(rc.x, rc.z, 0.5, false);
        rc.x = res.x;
        rc.z = res.z;
        rc.yaw = Math.atan2(dx, dz);
        rc.rig.root.position.set(rc.x, 0, rc.z);
        rc.rig.root.rotation.y = rc.yaw;
        animateRobloxCharacter(rc.rig, 1.15, dt, elapsed, false, false, true, false);

        if (dist < 1.55 && this.playerY < 1.35 && this.act3InvulnTimer <= 0) {
          this.act3Hp = Math.max(0, this.act3Hp - 1);
          this.act3InvulnTimer = 1.5;
          this.cameraShake = 0.52;
          this.audio.playPlayerHit();
          if (this.act3Hp <= 0) {
            this.triggerCaught(rc);
            return;
          }
          rc.x -= (dx / dist) * 3.5;
          rc.z -= (dz / dist) * 3.5;
          this.pushHud(true);
        }
      }

      if (this.act3BossHp <= 0 && aliveRoner === 0) {
        this.startAct3OutroCutscene();
      }
    }
  }

  private startAct3OutroCutscene(): void {
    this.phase = 'act3_outro_cutscene';
    this.cutsceneTimer = 0;
    this.cutsceneStage = -1;
    this.interactPrompt = null;
    this.playerBubbleText = null;
    this.flashlightOn = false;
    this.act3ExplosionTimer = 0;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;
    this.fpSniper.group.visible = false;
    this.fpSniper.muzzleFlash.visible = false;

    this.playerX = 0;
    this.playerZ = 1.8;
    this.playerY = 0;
    this.playerYaw = Math.PI;
    this.playerRig.root.visible = true;
    this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.nikitaSniperRifle.visible = true;

    // Giant Sasha defeated
    this.chasers[1].active = false;
    this.chasers[1].rig.root.visible = false;
    this.chasers[1].currentBubbleText = null;

    // Surviving/reformed RONER Army faces Nikita at z = -7.5
    for (let i = 0; i < this.act3RonerArmy.length; i++) {
      const rc = this.act3RonerArmy[i];
      const ang = -Math.PI / 2 + ((i - 3.5) / 4.2) * 0.9;
      rc.x = Math.cos(ang) * 7.8;
      rc.z = -7.5 + Math.sin(ang) * 2.4;
      rc.yaw = Math.atan2(this.playerX - rc.x, this.playerZ - rc.z);
      rc.active = true;
      rc.deadTimer = 0;
      rc.rig.root.visible = true;
      rc.rig.root.position.set(rc.x, 0, rc.z);
      rc.rig.root.rotation.y = rc.yaw;
      rc.rig.bodyPivot.rotation.x = 0;
      rc.rig.bodyPivot.position.y = 0;
      rc.currentBubbleText = null;
    }

    if (this.act3ParkObjs) {
      this.act3ParkObjs.explosionSphere.visible = false;
      this.act3ParkObjs.explosionRing.visible = false;
      this.act3ParkObjs.explosionLight.intensity = 0;
    }

    this.scene.background = new THREE.Color(0x0d1522);
    this.fog.color.setHex(0x0d1522);
    this.fog.density = 0.012;
    this.moonLight.intensity = 0.6;
    this.pushHud(true);
  }

  private updateAct3OutroCutscene(dt: number, elapsed: number): void {
    this.cutsceneTimer += dt;
    const t = this.cutsceneTimer;
    const isEn = this.settings.language === 'en';

    // Stage 0 (0..3.4s): Nikita -> "Господи помилуй ели выжыл"
    if (this.cutsceneStage < 0 && t >= 0.1) {
      this.cutsceneStage = 0;
      const line = getCutsceneLine('act3_outro_0', this.settings);
      this.playerBubbleText = line.display;
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
      this.audio.playDialogueLine(line.speech, 1.05, false);
      this.pushHud(true);
    }

    // Stage 1 (3.4..6.6s): Армия Roner -> "Ты читер,сраний аймер!!!!!!"
    if (this.cutsceneStage < 1 && t >= 3.4) {
      this.cutsceneStage = 1;
      this.playerBubbleText = null;
      const line = getCutsceneLine('act3_outro_1', this.settings);
      if (this.act3RonerArmy[3]) {
        this.act3RonerArmy[3].currentBubbleText = line.display;
        this.act3RonerArmy[3].bubbleTimer = 3.2;
      }
      this.cutsceneSubtitle = {
        speaker: isEn ? 'RONER Army' : 'Армия Roner',
        text: line.display,
        tone: 'enemy',
      };
      this.audio.playDialogueLine(line.speech, 0.94, line.hasCensorBeep);
      this.pushHud(true);
    }

    // Stage 2 (6.6..9.4s): (Взрыв) Армия ронеров уничтожена!
    if (this.cutsceneStage < 2 && t >= 6.6) {
      this.cutsceneStage = 2;
      this.act3ExplosionTimer = 0.001;
      this.cameraShake = 0.95;
      this.audio.playExplosion();
      this.emitParticles(0, 1.8, -7.5, 'gold');
      this.emitParticles(-3.2, 2.1, -8.0, 'gold');
      this.emitParticles(3.2, 2.1, -8.0, 'gold');
      this.cutsceneSubtitle = {
        speaker: isEn ? 'EXPLOSION!' : 'ВЗРЫВ!',
        text: isEn ? 'The RONER Army has been obliterated!' : 'Армия ронеров уничтожена!',
        tone: 'nikita',
      };
      for (const rc of this.act3RonerArmy) {
        rc.deadTimer = 2.0;
        rc.currentBubbleText = null;
      }
      this.pushHud(true);
    }

    if (this.act3ExplosionTimer > 0 && this.act3ParkObjs) {
      this.act3ExplosionTimer += dt;
      const e = this.act3ExplosionTimer;
      if (e < 2.2) {
        const s = 1 + e * 11.5;
        this.act3ParkObjs.explosionSphere.visible = true;
        this.act3ParkObjs.explosionSphere.scale.setScalar(s);
        (this.act3ParkObjs.explosionSphere.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 1 - e / 2.0);

        this.act3ParkObjs.explosionRing.visible = true;
        this.act3ParkObjs.explosionRing.scale.setScalar(1 + e * 16);
        (this.act3ParkObjs.explosionRing.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 1 - e / 1.8);

        this.act3ParkObjs.explosionLight.intensity = Math.max(0, 60 * (1 - e / 2.0));
      } else {
        this.act3ParkObjs.explosionSphere.visible = false;
        this.act3ParkObjs.explosionRing.visible = false;
        this.act3ParkObjs.explosionLight.intensity = 0;
      }
    }

    for (const rc of this.act3RonerArmy) {
      if (!rc.active) continue;
      if (this.cutsceneStage >= 2) {
        animateRobloxCharacter(rc.rig, 0, dt, elapsed, false, true, true);
        if (this.cutsceneTimer > 8.4) {
          rc.active = false;
          rc.rig.root.visible = false;
        }
      } else {
        animateRobloxCharacter(rc.rig, 0, dt, elapsed, false, false, true);
      }
    }

    // Stage 3 (9.4..13.8s): Nikita walks toward Деревня «ДжоДжо» & says "туда нам надо..."
    if (this.cutsceneStage < 3 && t >= 9.4) {
      this.cutsceneStage = 3;
      this.nikitaSniperRifle.visible = false;
      const line = getCutsceneLine('act3_outro_2', this.settings);
      this.playerBubbleText = line.display;
      this.cutsceneSubtitle = {
        speaker: isEn ? 'nikitys6666 (Nikita)' : 'nikitys6666 (Никита)',
        text: line.display,
        tone: 'nikita',
      };
      this.audio.playDialogueLine(line.speech, 1.04, false);
      this.pushHud(true);
    }

    if (this.cutsceneStage >= 3) {
      const walkAlpha = Math.min(1, (t - 9.4) / 4.0);
      this.playerX = 0;
      this.playerZ = THREE.MathUtils.lerp(1.8, -38.8, walkAlpha);
      this.playerYaw = Math.PI;
      this.playerRig.root.position.set(0, 0, this.playerZ);
      this.playerRig.root.rotation.y = Math.PI;
      animateRobloxCharacter(this.playerRig, 1.0, dt, elapsed, false, false, false);
    } else {
      animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
    }

    if (t >= 13.8) {
      this.finishAct3Victory();
    }
  }

  private finishAct3Victory(): void {
    this.phase = 'victory';
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.nikitaSniperRifle.visible = false;
    this.fpSniper.group.visible = false;
    if (this.act3ParkObjs) {
      this.act3ParkObjs.explosionSphere.visible = false;
      this.act3ParkObjs.explosionRing.visible = false;
      this.act3ParkObjs.explosionLight.intensity = 0;
    }
    for (const rc of this.act3RonerArmy) {
      rc.active = false;
      rc.rig.root.visible = false;
    }

    const unlocked = unlockSingleAchievement(this.achievements, 'act3_malinka');
    this.emitAchievementResult(unlocked);

    this.audio.playVictoryFanfare();
    this.pushHud(true);
  }

  private resolveSniperArenaCollision(
    x: number,
    z: number,
    radius: number
  ): { x: number; z: number } {
    let nx = THREE.MathUtils.clamp(x, -37.2 + radius, 37.2 - radius);
    let nz = THREE.MathUtils.clamp(z, -37.2 + radius, 37.2 - radius);
    if (this.sniperArenaObjs) {
      for (const cv of this.sniperArenaObjs.covers) {
        const dx = nx - cv.x;
        const dz = nz - cv.z;
        const limX = cv.halfW + radius;
        const limZ = cv.halfD + radius;
        if (Math.abs(dx) < limX && Math.abs(dz) < limZ) {
          const ovX = limX - Math.abs(dx);
          const ovZ = limZ - Math.abs(dz);
          if (ovX < ovZ) {
            nx += dx >= 0 ? ovX : -ovX;
          } else {
            nz += dz >= 0 ? ovZ : -ovZ;
          }
        }
      }
    }
    return { x: nx, z: nz };
  }

  private spawnSniperClone(clone: SniperCloneEntity): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 10;
    const rawX = THREE.MathUtils.clamp(Math.cos(angle) * dist, -35.5, 35.5);
    const rawZ = THREE.MathUtils.clamp(Math.sin(angle) * dist, -35.5, 35.5);
    const pos = this.resolveSniperArenaCollision(rawX, rawZ, 0.55);
    clone.x = pos.x;
    clone.z = pos.z;
    clone.active = true;
    clone.deadTimer = 0;
    clone.speed = Math.min(8.8, 4.9 + (this.sniperWave - 1) * 0.42 + Math.random() * 0.65);
    clone.tauntTimer = 1.5 + Math.random() * 4.0;
    clone.currentBubbleText = null;
    clone.bubbleTimer = 0;
    clone.rig.root.visible = true;
    clone.rig.root.position.set(clone.x, 0, clone.z);
    clone.rig.bodyPivot.rotation.x = 0;
    clone.rig.bodyPivot.position.y = 0;
  }

  private startSniperMinigame(): void {
    this.phase = 'playing';
    this.fog.density = 0.016;
    this.clonesKilled = 0;
    this.sniperWave = 1;
    this.sniperHp = this.sniperMaxHp;
    this.sniperInvulnTimer = 0;
    this.sniperFireCooldown = 0;
    this.sniperRecoil = 0;
    this.sniperMuzzleTimer = 0;
    this.sniperRespawnTick = 0;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
    this.flashlightOn = true;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;

    this.playerX = 0;
    this.playerZ = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.playerYaw = Math.PI;
    this.camYaw = 0;
    this.camPitch = 0.02;

    this.playerRig.root.visible = false;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.nikitaSniperRifle.visible = false;
    this.fpSniper.group.visible = true;
    this.fpSniper.muzzleFlash.visible = false;

    for (const c of this.chasers) {
      c.active = false;
      c.rig.root.visible = false;
      c.currentBubbleText = null;
    }

    for (let i = 0; i < this.sniperClones.length; i++) {
      const sc = this.sniperClones[i];
      if (i < 5) {
        this.spawnSniperClone(sc);
      } else {
        sc.active = false;
        sc.rig.root.visible = false;
        sc.currentBubbleText = null;
      }
    }

    this.eventBanner =
      this.settings.language === 'en'
        ? 'THE SNIPER IS MINE! Blast waves of RONER & Sasha clones [LMB / E]!'
        : 'СНАЙПЕРКА ТЕПЕРЬ МОЯ! Отстреливай волны клонов Сани и RONER [ЛКМ / E]!';
    this.eventBannerTimer = 5.5;
    this.pushHud(true);
    this.callbacks.onBubblesUpdate([]);
  }

  public fireSniperShot(): void {
    const isAct3Sniper = this.mode === 'story_act3' && this.act3HasSniper;
    if (this.phase !== 'playing' || (this.mode !== 'sniper_minigame' && !isAct3Sniper)) return;
    if (this.sniperFireCooldown > 0) return;

    this.audio.unlock();
    this.sniperFireCooldown = 0.42;
    this.sniperRecoil = 1.0;
    this.sniperMuzzleTimer = 0.08;
    this.cameraShake = 0.24;
    this.audio.playSniperShot();

    this.camera.getWorldDirection(_beamDir);
    _beamOrigin.copy(this.camera.position);

    let bestClone: SniperCloneEntity | null = null;
    let hitBoss = false;
    let bossHeadshot = false;
    let bestDist = 140;

    const pool = isAct3Sniper ? this.act3RonerArmy : this.sniperClones;
    for (const sc of pool) {
      if (!sc.active || sc.deadTimer > 0) continue;
      for (const hitY of [2.05, 1.3]) {
        _vec3.set(sc.x - _beamOrigin.x, hitY - _beamOrigin.y, sc.z - _beamOrigin.z);
        const along = _vec3.dot(_beamDir);
        if (along <= 0.5 || along > bestDist) continue;
        _vec3b.copy(_beamOrigin).addScaledVector(_beamDir, along);
        const perp = Math.hypot(_vec3b.x - sc.x, _vec3b.y - hitY, _vec3b.z - sc.z);
        if (perp <= (hitY > 1.8 ? 0.85 : 0.92)) {
          bestDist = along;
          bestClone = sc;
          hitBoss = false;
          break;
        }
      }
    }

    // Check Giant Boss Sasha (2x scale) during Act 3 Night 30!
    const boss = this.chasers[1];
    if (isAct3Sniper && this.act3BossHp > 0 && boss && boss.active) {
      for (const hitY of [4.1, 2.5]) {
        _vec3.set(boss.x - _beamOrigin.x, hitY - _beamOrigin.y, boss.z - _beamOrigin.z);
        const along = _vec3.dot(_beamDir);
        if (along <= 0.5 || along > bestDist) continue;
        _vec3b.copy(_beamOrigin).addScaledVector(_beamDir, along);
        const perp = Math.hypot(_vec3b.x - boss.x, _vec3b.y - hitY, _vec3b.z - boss.z);
        if (perp <= 1.75) {
          bestDist = along;
          bestClone = null;
          hitBoss = true;
          bossHeadshot = hitY > 3.5;
          break;
        }
      }
    }

    const muzzlePos = _vec3.set(0.24, -0.14, -1.15).applyQuaternion(this.camera.quaternion).add(this.camera.position);
    const beam = this.sniperTracers[0];
    if (beam) {
      const targetPos = hitBoss
        ? _vec3b.set(boss.x, 3.6, boss.z)
        : bestClone
          ? _vec3b.set(bestClone.x, 1.9, bestClone.z)
          : _vec3b.copy(_beamOrigin).addScaledVector(_beamDir, 60);
      const dist = muzzlePos.distanceTo(targetPos);
      beam.position.copy(muzzlePos).lerp(targetPos, 0.5);
      beam.scale.set(1, 1, dist);
      beam.lookAt(targetPos);
      beam.visible = true;
      this.tracerLife = 0.28;
    }

    if (hitBoss && boss) {
      const dmg = bossHeadshot ? 2 : 1;
      this.act3BossHp = Math.max(0, this.act3BossHp - dmg);
      this.emitParticles(boss.x, 3.6, boss.z, 'gold');
      this.floatingTexts.push({
        id: this.nextFloatId++,
        text: bossHeadshot ? `-${dmg} HEADSHOT!` : `-${dmg} BOSS`,
        worldX: boss.x,
        worldY: 5.1,
        worldZ: boss.z,
        life: 1.0,
        maxLife: 1.0,
        isGold: true,
      });
      // Knock Boss Sasha back
      const bdx = boss.x - this.playerX;
      const bdz = boss.z - this.playerZ;
      const bdist = Math.hypot(bdx, bdz) || 1;
      boss.x += (bdx / bdist) * 2.2;
      boss.z += (bdz / bdist) * 2.2;
      if (this.act3BossHp <= 0) {
        boss.active = false;
        boss.rig.root.visible = false;
        boss.currentBubbleText = null;
        this.emitParticles(boss.x, 3.0, boss.z, 'gold');
      }
    } else if (bestClone) {
      bestClone.deadTimer = 0.9;
      bestClone.currentBubbleText = 'X_X HEADSHOT!';
      bestClone.bubbleTimer = 0.9;

      if (!isAct3Sniper) {
        this.clonesKilled++;
        if (this.clonesKilled > this.bestSniperKills) {
          this.bestSniperKills = this.clonesKilled;
          try {
            localStorage.setItem(BEST_SNIPER_KEY, String(this.bestSniperKills));
          } catch {}
        }
        this.sniperWave = 1 + Math.floor(this.clonesKilled / 10);

        this.achievements.totalClonesKilled += 1;
        const unlocked = evaluateStatAchievements(this.achievements);
        this.emitAchievementResult(unlocked);
      }

      this.emitParticles(bestClone.x, 1.9, bestClone.z, 'gold');
      this.floatingTexts.push({
        id: this.nextFloatId++,
        text: isAct3Sniper ? 'RONER DOWN!' : '+1 CLONE',
        worldX: bestClone.x,
        worldY: 2.75,
        worldZ: bestClone.z,
        life: 1.0,
        maxLife: 1.0,
        isGold: true,
      });
    }
    this.pushHud(true);
  }

  private updateSniperMinigame(dt: number, elapsed: number): void {
    this.elapsedPlaying += dt;
    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer -= dt;
      if (this.eventBannerTimer <= 0) this.eventBanner = null;
    }
    if (this.sniperFireCooldown > 0) {
      this.sniperFireCooldown = Math.max(0, this.sniperFireCooldown - dt);
    }
    if (this.sniperRecoil > 0) {
      this.sniperRecoil = Math.max(0, this.sniperRecoil - dt * 5.2);
    }
    if (this.sniperMuzzleTimer > 0) {
      this.sniperMuzzleTimer = Math.max(0, this.sniperMuzzleTimer - dt);
    }
    if (this.sniperInvulnTimer > 0) {
      this.sniperInvulnTimer = Math.max(0, this.sniperInvulnTimer - dt);
    }
    if (this.cameraShake > 0.005) {
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 9, dt);
    }

    let inX = this.virtualMoveX;
    let inZ = this.virtualMoveZ;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inZ -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inZ += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inX += 1;
    if (this.heldKeys.has('KeyQ')) this.camYaw += dt * 2.1;

    const inputLen = Math.hypot(inX, inZ);
    const hasMove = inputLen > 0.05;
    if (hasMove) {
      inX /= Math.max(1, inputLen);
      inZ /= Math.max(1, inputLen);
    }

    const wantsSprint =
      (this.heldKeys.has('ShiftLeft') ||
        this.heldKeys.has('ShiftRight') ||
        this.virtualSprint) &&
      hasMove;
    const isSprinting = wantsSprint && this.stamina > 2;
    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 20);
    } else {
      this.stamina = Math.min(100, this.stamina + dt * (hasMove ? 18 : 28));
    }

    const moveSpeed = isSprinting ? 12.0 : 8.4;
    if (hasMove) {
      const sinY = Math.sin(this.camYaw);
      const cosY = Math.cos(this.camYaw);
      const worldDx = inX * cosY + inZ * sinY;
      const worldDz = -inX * sinY + inZ * cosY;

      this.playerX += worldDx * moveSpeed * dt;
      this.playerZ += worldDz * moveSpeed * dt;
      const res = this.resolveSniperArenaCollision(this.playerX, this.playerZ, 0.55);
      this.playerX = res.x;
      this.playerZ = res.z;

      if (this.isGrounded) {
        this.footstepAccum += dt * (isSprinting ? 2.8 : 2.0);
        if (this.footstepAccum >= 1) {
          this.footstepAccum = 0;
          this.audio.playFootstep(isSprinting);
        }
      }
    }
    this.playerYaw = this.camYaw + Math.PI;

    if (this.isGrounded) this.coyoteTimer = 0.12;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVy = 8.4;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.audio.playJump();
    }
    if (!this.isGrounded || this.playerY > 0.01) {
      this.playerVy -= 22.5 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerY = 0;
    }

    // Ensure wave target count of clones remain active
    const desiredActive = Math.min(this.sniperClones.length, 4 + this.sniperWave);
    let currentActive = 0;
    for (const sc of this.sniperClones) {
      if (sc.active) currentActive++;
    }
    this.sniperRespawnTick -= dt;
    if (currentActive < desiredActive && this.sniperRespawnTick <= 0) {
      const slot = this.sniperClones.find((sc) => !sc.active);
      if (slot) {
        this.spawnSniperClone(slot);
        this.sniperRespawnTick = 0.35;
      }
    }

    for (const sc of this.sniperClones) {
      if (!sc.active) continue;
      if (sc.bubbleTimer > 0) {
        sc.bubbleTimer -= dt;
        if (sc.bubbleTimer <= 0) sc.currentBubbleText = null;
      }

      if (sc.deadTimer > 0) {
        sc.deadTimer -= dt;
        animateRobloxCharacter(sc.rig, 0, dt, elapsed, false, true, true);
        if (sc.deadTimer <= 0) {
          sc.active = false;
          sc.rig.root.visible = false;
        }
        continue;
      }

      const dx = this.playerX - sc.x;
      const dz = this.playerZ - sc.z;
      const dist = Math.hypot(dx, dz) || 1;
      sc.x += (dx / dist) * sc.speed * dt;
      sc.z += (dz / dist) * sc.speed * dt;
      const res = this.resolveSniperArenaCollision(sc.x, sc.z, 0.5);
      sc.x = res.x;
      sc.z = res.z;
      sc.yaw = Math.atan2(dx, dz);
      sc.rig.root.position.set(sc.x, 0, sc.z);
      sc.rig.root.rotation.y = sc.yaw;
      animateRobloxCharacter(sc.rig, 1.15, dt, elapsed, false, false, true, false);

      sc.tauntTimer -= dt;
      if (sc.tauntTimer <= 0) {
        sc.tauntTimer = 5.0 + Math.random() * 4.5;
        const phrase = pickRandomChaserPhrase(this.settings);
        sc.currentBubbleText = phrase.display;
        sc.bubbleTimer = 2.0;
        if (dist < 22) {
          this.audio.playTaunt(phrase.speech, sc.pitch, false);
        }
      }

      if (dist < 1.5 && this.playerY < 1.35 && this.sniperInvulnTimer <= 0) {
        this.sniperHp = Math.max(0, this.sniperHp - 1);
        this.sniperInvulnTimer = 1.4;
        this.cameraShake = 0.52;
        this.audio.playPlayerHit();
        if (this.sniperHp <= 0) {
          this.triggerCaught(sc);
          return;
        }
        // Knock clone back slightly on hit
        sc.x -= (dx / dist) * 3.2;
        sc.z -= (dz / dist) * 3.2;
        this.pushHud(true);
      }
    }
  }

  private triggerCaught(killer: ChaserEntity | SniperCloneEntity): void {
    this.phase = 'caught';
    this.caughtTimer = 2.35;
    this.hitstopTimer = 0.07;
    this.cameraShake = 0.65;
    this.killerId = killer.id;
    this.killerName = killer.name;
    this.isHidingInLocker = false;
    this.hiddenLockerId = null;
    this.heldKeys.clear();
    this.playerRig.root.visible = true;
    this.fpFlashlight.group.visible = false;
    this.sachetHand.group.visible = false;
    this.fpSniper.group.visible = false;
    this.fpSniper.muzzleFlash.visible = false;
    this.tpFlashlight.group.visible = false;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    const scream = getCaughtScreamLine(this.settings);
    killer.currentBubbleText = scream.display;
    killer.bubbleTimer = 3.0;
    if ('isScream' in killer) {
      killer.isScream = true;
    }

    this.audio.playCaughtScream(scream.speech);
    this.pushHud(true);
  }

  private updateCaught(dt: number, elapsed: number): void {
    this.caughtTimer -= dt;
    animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, true, false);
    const flatGround =
      this.activeWorldType === 'factory' ||
      this.activeWorldType === 'sniper_arena' ||
      this.activeWorldType === 'act3_park';

    for (const c of this.chasers) {
      if (!c.active) continue;
      if (c.id === this.killerId) {
        const jumpY = Math.abs(Math.sin(elapsed * 14)) * 0.45;
        const cy = flatGround ? 0 : groundHeightAt(c.x, c.z);
        c.rig.root.position.set(c.x, cy + jumpY, c.z);
        c.rig.leftArm.rotation.x = -2.6;
        c.rig.rightArm.rotation.x = -2.6;
      } else {
        animateRobloxCharacter(c.rig, 0, dt, elapsed, false, false, true);
      }
    }

    if (this.mode === 'sniper_minigame') {
      for (const sc of this.sniperClones) {
        if (!sc.active || sc.deadTimer > 0) continue;
        if (sc.name === this.killerName) {
          const jumpY = Math.abs(Math.sin(elapsed * 14)) * 0.45;
          sc.rig.root.position.set(sc.x, jumpY, sc.z);
          sc.rig.leftArm.rotation.x = -2.6;
          sc.rig.rightArm.rotation.x = -2.6;
        } else {
          animateRobloxCharacter(sc.rig, 0, dt, elapsed, false, false, true);
        }
      }
    }

    if (this.mode === 'story_act3') {
      for (const rc of this.act3RonerArmy) {
        if (!rc.active || rc.deadTimer > 0) continue;
        if (rc.name === this.killerName) {
          const jumpY = Math.abs(Math.sin(elapsed * 14)) * 0.45;
          rc.rig.root.position.set(rc.x, jumpY, rc.z);
          rc.rig.leftArm.rotation.x = -2.6;
          rc.rig.rightArm.rotation.x = -2.6;
        } else {
          animateRobloxCharacter(rc.rig, 0, dt, elapsed, false, false, true);
        }
      }
    }

    if (this.caughtTimer <= 0) {
      this.phase = 'gameover';
      this.pushHud(true);
    }
  }

  private updateCamera(dt: number, elapsed: number): void {
    if (this.phase === 'title') {
      if (this.mode === 'story_act3') {
        const orbitAng = elapsed * 0.16;
        _camDesiredPos.set(
          Math.sin(orbitAng) * 10.5,
          4.4,
          Math.cos(orbitAng) * 10.5 + 1.5
        );
        this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4));
        _camLookTarget.set(0, 1.5, -2.5);
        this.camera.lookAt(_camLookTarget);
        return;
      }
      if (this.mode === 'story_act2' || this.mode === 'fnaf_epta') {
        const orbitAng = elapsed * 0.18;
        _camDesiredPos.set(
          Math.sin(orbitAng) * 8.5,
          3.8,
          Math.cos(orbitAng) * 6.5 + 2.5
        );
        this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4));
        _camLookTarget.set(0, 1.4, CONVEYOR_Z);
        this.camera.lookAt(_camLookTarget);
        return;
      }
      if (this.mode === 'sniper_minigame') {
        const orbitAng = elapsed * 0.2;
        _camDesiredPos.set(
          Math.sin(orbitAng) * 11.2,
          4.2,
          Math.cos(orbitAng) * 11.2 - 1.5
        );
        this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4));
        _camLookTarget.set(0, 1.5, -2.5);
        this.camera.lookAt(_camLookTarget);
        return;
      }
      const orbitAng = elapsed * 0.22;
      _camDesiredPos.set(
        Math.sin(orbitAng) * 8.2,
        this.playerY + 3.2,
        Math.cos(orbitAng) * 8.2 - 2.0
      );
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4));
      _camLookTarget.set(0, this.playerY + 1.5, -3.2);
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'act3_secret') {
      _camDesiredPos.set(Math.sin(elapsed * 0.25) * 3.8, 4.8, 3.0);
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 3.2));
      _camLookTarget.set(0, 5.4, -26.0);
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'act3_intro_cutscene') {
      if (this.cutsceneStage <= 0) {
        _camDesiredPos.set(5.2, 3.1, this.playerZ - 7.5);
        _camLookTarget.set(this.playerX, 1.4, this.playerZ);
      } else {
        _camDesiredPos.set(4.5, 2.7, 5.8);
        _camLookTarget.set(0, 1.25, 0);
      }
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4.5));
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (
      this.phase === 'act3_outro_cutscene' ||
      (this.phase === 'victory' && this.mode === 'story_act3')
    ) {
      if (this.cutsceneStage <= 0) {
        _camDesiredPos.set(3.8, 2.6, 5.6);
        _camLookTarget.set(this.playerX, 1.45, this.playerZ);
      } else if (this.cutsceneStage <= 2) {
        _camDesiredPos.set(2.8, 4.2, 5.5);
        _camLookTarget.set(0, 1.7, -7.5);
      } else {
        _camDesiredPos.set(4.0, 2.8, this.playerZ + 6.5);
        _camLookTarget.set(0, 2.6, -45.5);
      }
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4.2));
      if (this.cameraShake > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
      }
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'act2_intro_cutscene') {
      if (this.cutsceneStage <= 0) {
        _camDesiredPos.set(4.5, 2.5, 11.4);
        _camLookTarget.set(this.playerX, 1.45, this.playerZ);
      } else if (this.cutsceneStage === 1) {
        _camDesiredPos.set(-3.2, 3.1, 6.2);
        _camLookTarget.set(0.5, 1.35, CONVEYOR_Z);
      } else if (this.cutsceneStage <= 4) {
        _camDesiredPos.set(4.2, 2.35, 12.2);
        _camLookTarget.set(7.2, 2.2, FACTORY_HALF_D + 0.4);
      } else {
        _camDesiredPos.set(-1.5, 2.4, 8.8);
        _camLookTarget.set(6.5, 2.1, FACTORY_HALF_D);
      }
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4.2));
      if (this.cameraShake > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
      }
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'act2_door_cutscene') {
      if (this.cutsceneStage <= 0) {
        _camDesiredPos.set(CORRIDOR_X - 1.6, 2.35, -16.2);
        _camLookTarget.set(CORRIDOR_X, 1.65, CORRIDOR_VESTIBULE_Z);
      } else {
        _camDesiredPos.set(CORRIDOR_X - 1.35, 2.35, -21.2);
        _camLookTarget.set(CORRIDOR_X, 1.75, -95.0);
      }
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4.5));
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'act2_outro_cutscene' || (this.phase === 'victory' && this.mode === 'story_act2')) {
      if (this.cutsceneStage <= 1) {
        _camDesiredPos.set(CORRIDOR_X - 2.2, 2.5, CORRIDOR_END_Z + 9.3);
        _camLookTarget.set(CORRIDOR_X, 1.55, CORRIDOR_END_Z + 17.0);
      } else if (this.cutsceneStage === 2) {
        _camDesiredPos.set(CORRIDOR_X - 2.35, 2.7, CORRIDOR_END_Z + 2.1);
        _camLookTarget.set(CORRIDOR_X, 1.9, CORRIDOR_END_Z + 11.5);
      } else {
        _camDesiredPos.set(CORRIDOR_X + 2.1, 2.55, CORRIDOR_END_Z + 8.3);
        _camLookTarget.set(CORRIDOR_X, 1.65, CORRIDOR_END_Z);
      }
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4.6));
      if (this.cameraShake > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
      }
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'intro_cutscene') {
      if (this.cutsceneStage <= 0) {
        _camDesiredPos.set(3.8, this.playerY + 2.6, this.playerZ - 5.2);
        _camLookTarget.set(0, this.playerY + 1.5, this.playerZ);
      } else if (this.cutsceneStage === 1) {
        _camDesiredPos.set(3.2, this.playerY + 2.5, -2.5);
        _camLookTarget.set(0, this.playerY + 1.4, -7.2);
      } else {
        _camDesiredPos.set(-3.8, this.playerY + 2.4, -3.5);
        _camLookTarget.set(0, this.playerY + 1.5, -8.5);
      }
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4.5));
      if (this.cameraShake > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
      }
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'outro_cutscene') {
      const endX = storyPathCenterX(STORY_END_Z);
      _camDesiredPos.set(endX + 5.6, this.playerY + 3.2, STORY_END_Z - 14.5);
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 4));
      _camLookTarget.set(endX, this.playerY + 1.6, this.playerZ);
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'act2_teaser' || this.phase === 'victory') {
      const endX = storyPathCenterX(STORY_END_Z);
      _camDesiredPos.set(
        endX + Math.sin(elapsed * 0.35) * 1.8,
        this.playerY + 3.0,
        STORY_END_Z - 3.6
      );
      this.camera.position.lerp(_camDesiredPos, Math.min(1, dt * 3.2));
      _camLookTarget.set(endX, this.playerY + 3.4, STORY_END_Z - 15.5);
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.phase === 'caught' || this.phase === 'gameover') {
      const killerChaser = this.chasers.find((c) => c.id === this.killerId);
      const killerClone =
        this.sniperClones.find((sc) => sc.name === this.killerName && sc.active) ??
        this.act3RonerArmy.find((rc) => rc.name === this.killerName && rc.active);
      const killer = killerClone ?? killerChaser;
      const focusX = killer ? (killer.x + this.playerX) * 0.5 : this.playerX;
      const focusZ = killer ? (killer.z + this.playerZ) * 0.5 : this.playerZ;
      const flatGround =
        this.activeWorldType === 'factory' ||
        this.activeWorldType === 'sniper_arena' ||
        this.activeWorldType === 'act3_park';
      const focusY = flatGround ? 0 : groundHeightAt(focusX, focusZ);

      _camDesiredPos.set(
        focusX + Math.sin(this.camYaw) * 5.2,
        focusY + 2.4,
        focusZ + Math.cos(this.camYaw) * 5.2
      );
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _camDesiredPos.x,
        7,
        dt
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _camDesiredPos.y,
        7,
        dt
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _camDesiredPos.z,
        7,
        dt
      );

      if (this.cameraShake > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
      }

      _camLookTarget.set(focusX, focusY + 1.4, focusZ);
      this.camera.lookAt(_camLookTarget);
      return;
    }

    const isFP =
      this.mode === 'first_person' ||
      this.mode === 'story_act1' ||
      this.mode === 'story_act2' ||
      this.mode === 'story_act3' ||
      this.mode === 'fnaf_epta' ||
      this.mode === 'sniper_minigame';
    if (isFP) {
      const eyeY = this.playerY + 1.85;
      this.camera.position.set(this.playerX, eyeY, this.playerZ);

      const lookDist = 10;
      const cosP = Math.cos(this.camPitch);
      _camLookTarget.set(
        this.playerX - Math.sin(this.camYaw) * cosP * lookDist,
        eyeY - Math.sin(this.camPitch) * lookDist,
        this.playerZ - Math.cos(this.camYaw) * cosP * lookDist
      );
      this.camera.lookAt(_camLookTarget);
    } else {
      const horizDist = Math.cos(this.camPitch) * this.camDist;
      const vertDist = Math.sin(this.camPitch) * this.camDist + 1.6;
      _camDesiredPos.set(
        this.playerX + Math.sin(this.camYaw) * horizDist,
        this.playerY + vertDist,
        this.playerZ + Math.cos(this.camYaw) * horizDist
      );

      const minGround = groundHeightAt(_camDesiredPos.x, _camDesiredPos.z) + 1.1;
      if (_camDesiredPos.y < minGround) _camDesiredPos.y = minGround;

      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _camDesiredPos.x,
        10,
        dt
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _camDesiredPos.y,
        10,
        dt
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _camDesiredPos.z,
        10,
        dt
      );

      _camLookTarget.set(this.playerX, this.playerY + 1.55, this.playerZ);
      this.camera.lookAt(_camLookTarget);
    }

    this.moonLight.position.set(this.playerX + 22, this.playerY + 34, this.playerZ + 18);
    this.moonLight.target.position.set(this.playerX, this.playerY, this.playerZ);
    this.moonLight.target.updateMatrixWorld();
  }

  private updateParticlesAndProjections(dt: number, elapsed: number): void {
    if (
      this.activeWorldType === 'story_forest' ||
      this.activeWorldType === 'arena_forest'
    ) {
      const ffAttr = this.forestObjs.fireflies.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < ffAttr.count; i++) {
        const y = ffAttr.getY(i);
        ffAttr.setY(i, y + Math.sin(elapsed * 1.8 + i) * 0.004);
      }
      ffAttr.needsUpdate = true;
    }

    if (this.tracerLife > 0) {
      this.tracerLife -= dt;
      if (this.tracerLife <= 0) {
        for (const tr of this.sniperTracers) tr.visible = false;
      } else {
        const op = THREE.MathUtils.clamp(this.tracerLife / 0.6, 0, 1);
        for (const tr of this.sniperTracers) {
          (tr.material as THREE.MeshBasicMaterial).opacity = op;
        }
      }
    }

    for (const p of this.particlePool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 12 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const ratio = p.life / p.maxLife;
      p.mesh.scale.setScalar(ratio);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = ratio;
    }

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const bubbles: SpeechBubbleState[] = [];

    // Project Nikita's bubble during cutscenes
    if (this.playerBubbleText && this.playerRig.root.visible) {
      const pos = this.playerRig.root.position;
      _projVec.set(pos.x, pos.y + 3.3, pos.z);
      _projVec.project(this.camera);
      if (_projVec.z <= 1) {
        bubbles.push({
          id: `nikita-${this.playerBubbleText}`,
          speaker: 'nikitys6666',
          speakerId: 'nikita',
          text: this.playerBubbleText,
          screenX: THREE.MathUtils.clamp(((_projVec.x + 1) / 2) * w, 130, w - 130),
          screenY: THREE.MathUtils.clamp(((-_projVec.y + 1) / 2) * h, 72, h - 120),
          visible: true,
          isScream: this.playerBubbleText.includes('!'),
          scale: 1,
        });
      }
    }

    for (const c of this.chasers) {
      if (!c.active || !c.rig.root.visible || !c.currentBubbleText) continue;
      const pos = c.rig.root.position;
      _projVec.set(pos.x, pos.y + 3.45 * c.rig.root.scale.y, pos.z);
      _projVec.project(this.camera);

      if (_projVec.z > 1) continue;

      const sx = ((_projVec.x + 1) / 2) * w;
      const sy = ((-_projVec.y + 1) / 2) * h;

      const clampedX = THREE.MathUtils.clamp(sx, 110, w - 110);
      const clampedY = THREE.MathUtils.clamp(sy, 72, h - 85);
      const dist = _vec3.set(pos.x, pos.y, pos.z).distanceTo(this.camera.position);

      bubbles.push({
        id: `${c.id}-${c.currentBubbleText}`,
        speaker: c.name,
        speakerId: c.id,
        text: c.currentBubbleText,
        screenX: clampedX,
        screenY: clampedY,
        visible: true,
        isScream: c.isScream,
        scale: c.isScream ? 1.15 : THREE.MathUtils.clamp(1.15 - dist * 0.015, 0.78, 1.08),
      });
    }

    if (this.mode === 'sniper_minigame' || this.mode === 'story_act3') {
      const pool = this.mode === 'story_act3' ? this.act3RonerArmy : this.sniperClones;
      for (const sc of pool) {
        if (!sc.active || !sc.rig.root.visible || !sc.currentBubbleText) continue;
        const pos = sc.rig.root.position;
        _projVec.set(pos.x, pos.y + 3.45, pos.z);
        _projVec.project(this.camera);
        if (_projVec.z > 1) continue;
        const sx = ((_projVec.x + 1) / 2) * w;
        const sy = ((-_projVec.y + 1) / 2) * h;
        const dist = _vec3.set(pos.x, pos.y, pos.z).distanceTo(this.camera.position);
        bubbles.push({
          id: `${sc.name}-${sc.currentBubbleText}`,
          speaker: sc.name,
          speakerId: sc.id,
          text: sc.currentBubbleText,
          screenX: THREE.MathUtils.clamp(sx, 110, w - 110),
          screenY: THREE.MathUtils.clamp(sy, 72, h - 85),
          visible: true,
          isScream: false,
          scale: THREE.MathUtils.clamp(1.15 - dist * 0.015, 0.78, 1.08),
        });
      }
    }
    this.callbacks.onBubblesUpdate(bubbles);

    const projectedFloats: FloatingPickupText[] = [];
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.life -= dt;
      f.worldY += dt * 1.4;
      if (f.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      _projVec.set(f.worldX, f.worldY, f.worldZ).project(this.camera);
      if (_projVec.z <= 1) {
        projectedFloats.push({
          id: f.id,
          text: f.text,
          screenX: ((_projVec.x + 1) / 2) * w,
          screenY: ((-_projVec.y + 1) / 2) * h,
          isGold: f.isGold,
          alpha: Math.min(1, (f.life / f.maxLife) * 1.6),
        });
      }
    }
    this.callbacks.onFloatingTextsUpdate(projectedFloats);
  }

  private pushHud(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastHudPush < 90) return;
    this.lastHudPush = now;

    let nearestDist = 999;
    let act3RonerWaveAlive = 0;
    if (this.mode === 'sniper_minigame') {
      for (const sc of this.sniperClones) {
        if (!sc.active || sc.deadTimer > 0) continue;
        const d = Math.hypot(sc.x - this.playerX, sc.z - this.playerZ);
        if (d < nearestDist) nearestDist = d;
      }
    } else {
      for (const c of this.chasers) {
        if (!c.active) continue;
        const d = Math.hypot(c.x - this.playerX, c.z - this.playerZ);
        if (d < nearestDist) nearestDist = d;
      }
      if (this.mode === 'story_act3') {
        for (let idx = 0; idx < this.act3RonerArmy.length; idx++) {
          const rc = this.act3RonerArmy[idx];
          if (!rc.active || rc.deadTimer > 0) continue;
          const isRetreating =
            this.act3Night < ACT3_MAX_NIGHTS &&
            (this.act3NightRonerStates[idx]?.retreatTimer ?? 0) > 0;
          if (isRetreating) continue;
          act3RonerWaveAlive++;
          const d = Math.hypot(rc.x - this.playerX, rc.z - this.playerZ);
          if (d < nearestDist) nearestDist = d;
        }
      }
    }

    const isStory = this.mode === 'story_act1';
    const isAct2 = this.mode === 'story_act2';
    const isAct3 = this.mode === 'story_act3';
    const isFnaf = this.mode === 'fnaf_epta';
    const isFactoryMode = isAct2 || isFnaf;
    const endX = storyPathCenterX(STORY_END_Z);
    const gateDist = isStory
      ? Math.max(0, Math.round(Math.hypot(this.playerX - endX, this.playerZ - STORY_END_Z)))
      : null;

    const act3NextUpgradeCost =
      this.act3BaseLevel === 1
        ? ACT3_LV2_METAL_COST
        : this.act3BaseLevel === 2
          ? ACT3_LV3_METAL_COST
          : this.act3BaseLevel === 3
            ? ACT3_LV4_METAL_COST
            : this.act3BaseLevel === 4
              ? ACT3_LV5_METAL_COST
              : this.act3BaseLevel === 5
                ? ACT3_LV6_METAL_COST
                : 0;

    this.callbacks.onHudUpdate({
      phase: this.phase,
      mode: this.mode,
      settings: this.settings,
      mushrooms: isFactoryMode ? this.noodlesSeasoned : this.mushroomsCollected,
      targetMushrooms: isStory
        ? STORY_TARGET_MUSHROOMS
        : isFactoryMode
          ? ACT2_TARGET_MIVINAS
          : null,
      bestMushrooms: this.bestMushrooms,
      elapsedSeconds: Math.floor(this.elapsedPlaying),
      stamina: Math.round(this.stamina),
      battery: Math.round(this.battery),
      hasBatteryLimit: isStory,
      flashlightOn: this.flashlightOn,
      flashlightStuns: this.flashlightStuns,
      nearestChaserDist: Math.round(nearestDist * 10) / 10,
      distanceToGate: gateDist,
      ronerSpawned: isAct3 ? act3RonerWaveAlive > 0 : (this.chasers[0]?.active ?? false),
      sashaSpawned: this.chasers[1]?.active ?? false,
      killerName: this.killerName,
      killerId: this.killerId,
      activeMushroomsOnMap: this.mushrooms.length,
      speedBoostActive: this.speedBoostTimer > 0,
      eventBanner: this.eventBanner,
      cutsceneSubtitle: this.cutsceneSubtitle,
      act2Stage: this.act2Stage,
      noodlesSeasoned: this.noodlesSeasoned,
      noodlesPacked: this.noodlesPacked,
      noodlesTarget: ACT2_TARGET_MIVINAS,
      packetsInHand: this.packetsInHand,
      boxesFound: this.boxesFound,
      mushroomStock: this.mushroomStock,
      hasCorridorKey: this.hasCorridorKey,
      corridorProgress:
        isAct2 && this.act2Stage === 'corridor'
          ? Math.round(
              THREE.MathUtils.clamp(
                ((-24.5 - this.playerZ) / (-24.5 - SNIPER_PICKUP_POS.z)) * 100,
                0,
                100
              )
            )
          : 0,
      interactPrompt: this.interactPrompt,
      isHidingInLocker: this.isHidingInLocker,
      lightsFlickering:
        isFactoryMode &&
        (this.sanyaState === 'flicker_warning' || this.sanyaState === 'hunting'),
      factoryAlarmActive:
        isFactoryMode &&
        (this.ronerState === 'climbing' ||
          this.ronerState === 'breaking' ||
          this.ronerState === 'chasing_inside'),
      windowBreachProgress: Math.round(this.windowBreachProgress),
      act3Night: this.act3Night,
      act3MaxNights: ACT3_MAX_NIGHTS,
      act3IsNight:
        isAct3 && (this.act3Night >= ACT3_MAX_NIGHTS || this.act3DayClock >= ACT3_DAY_DURATION),
      act3DayProgress:
        this.act3Night >= ACT3_MAX_NIGHTS
          ? 100
          : Math.round((this.act3DayClock / ACT3_CYCLE_SECONDS) * 100),
      act3PhaseSecondsLeft:
        this.act3Night >= ACT3_MAX_NIGHTS
          ? 0
          : this.act3DayClock < ACT3_DAY_DURATION
            ? Math.max(0, Math.ceil(ACT3_DAY_DURATION - this.act3DayClock))
            : Math.max(0, Math.ceil(ACT3_CYCLE_SECONDS - this.act3DayClock)),
      act3FireFuel: Math.round(this.act3FireFuel),
      act3LogsInHand: this.act3LogsInHand,
      act3MetalInHand: this.act3MetalInHand,
      act3CrusherMetal: this.act3CrusherMetal,
      act3BaseLevel: this.act3BaseLevel,
      act3NextUpgradeCost,
      act3BedCooldownNights: this.act3BedCooldownNights,
      act3BossHp: this.act3BossHp,
      act3BossMaxHp: ACT3_BOSS_MAX_HP,
      act3RonerWaveAlive,
      act3HasSniper: this.act3HasSniper,
      act3Hp: this.act3Hp,
      act3MaxHp: this.act3MaxHp,
      fnafMivinasTotal: this.fnafMivinasTotal,
      fnafBatch: this.fnafBatch,
      bestFnafMivinas: this.bestFnafMivinas,
      clonesKilled: this.clonesKilled,
      sniperWave: this.sniperWave,
      sniperHp: this.sniperHp,
      sniperMaxHp: this.sniperMaxHp,
      sniperCooldownRatio: THREE.MathUtils.clamp(this.sniperFireCooldown / 0.42, 0, 1),
      bestSniperKills: this.bestSniperKills,
    });
  }

  private startLoop(): void {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.disposed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = this.clock.elapsedTime;

      const hasMove =
        this.heldKeys.has('KeyW') ||
        this.heldKeys.has('KeyS') ||
        this.heldKeys.has('KeyA') ||
        this.heldKeys.has('KeyD') ||
        Math.hypot(this.virtualMoveX, this.virtualMoveZ) > 0.05;

      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else if (this.phase === 'intro_cutscene') {
        this.updateIntroCutscene(dt, elapsed);
      } else if (this.phase === 'outro_cutscene') {
        this.updateOutroCutscene(dt, elapsed);
      } else if (this.phase === 'act2_teaser') {
        this.updateAct2Teaser(dt, elapsed);
      } else if (this.phase === 'act2_intro_cutscene') {
        this.updateAct2IntroCutscene(dt, elapsed);
      } else if (this.phase === 'act2_door_cutscene') {
        this.updateAct2DoorCutscene(dt, elapsed);
      } else if (this.phase === 'act2_outro_cutscene') {
        this.updateAct2OutroCutscene(dt, elapsed);
      } else if (this.phase === 'act3_intro_cutscene') {
        this.updateAct3IntroCutscene(dt, elapsed);
      } else if (this.phase === 'act3_outro_cutscene') {
        this.updateAct3OutroCutscene(dt, elapsed);
      } else if (this.phase === 'act3_secret' && this.malinkaObjs) {
        this.malinkaObjs.neonSignMat.emissiveIntensity = 1.45 + Math.sin(elapsed * 3.0) * 0.35;
      } else if (this.phase === 'playing') {
        this.updatePlaying(dt, elapsed);
      } else if (this.phase === 'caught') {
        this.updateCaught(dt, elapsed);
      } else if (this.phase === 'title') {
        animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, false, false);
        for (const c of this.chasers) {
          animateRobloxCharacter(c.rig, 0, dt, elapsed, false, false, false);
        }
        for (const m of this.mushrooms) {
          m.phase += dt * 2.5;
          m.mesh.position.y = m.y + Math.sin(m.phase) * 0.07;
        }
        if ((this.mode === 'story_act2' || this.mode === 'fnaf_epta') && this.factoryObjs) {
          this.factoryObjs.conveyor.beltTexture.offset.x -= dt * 0.58;
          for (const r of this.factoryObjs.conveyor.rollers) {
            r.rotation.z -= dt * 6.5;
          }
          for (const b of this.conveyorBricks) {
            b.x += 1.48 * dt;
            if (b.x > CONVEYOR_END_X) b.x = CONVEYOR_START_X;
            b.rig.group.position.x = b.x;
          }
        }
      }

      this.updateCamera(dt, elapsed);
      this.updateFlashlightRig(elapsed, hasMove);
      this.updateParticlesAndProjections(dt, elapsed);
      this.pushHud(false);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (
      ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
        e.code
      )
    ) {
      e.preventDefault();
    }
    this.audio.unlock();
    this.heldKeys.add(e.code);

    if (e.code === 'KeyF' && !e.repeat && this.phase === 'playing') {
      this.toggleFlashlight();
    }

    if (e.code === 'KeyE' && !e.repeat && this.phase === 'playing') {
      if (this.mode === 'story_act2' || this.mode === 'fnaf_epta') {
        this.interactFactory();
      } else if (this.mode === 'story_act3') {
        this.interactAct3Park();
      } else if (this.mode === 'sniper_minigame') {
        this.fireSniperShot();
      }
    }

    if (e.code === 'Space' && !e.repeat) {
      if (this.phase === 'playing') {
        this.jumpBufferTimer = 0.14;
      } else if (
        this.phase === 'intro_cutscene' ||
        this.phase === 'outro_cutscene' ||
        this.phase === 'act2_teaser' ||
        this.phase === 'act2_intro_cutscene' ||
        this.phase === 'act2_door_cutscene' ||
        this.phase === 'act2_outro_cutscene' ||
        this.phase === 'act3_intro_cutscene' ||
        this.phase === 'act3_outro_cutscene' ||
        this.phase === 'act3_secret'
      ) {
        this.skipCutscene();
      } else if (
        this.phase === 'title' ||
        this.phase === 'gameover' ||
        this.phase === 'victory'
      ) {
        this.startGame();
      }
    }
    if (e.code === 'Enter' && !e.repeat) {
      if (
        this.phase === 'intro_cutscene' ||
        this.phase === 'outro_cutscene' ||
        this.phase === 'act2_teaser' ||
        this.phase === 'act2_intro_cutscene' ||
        this.phase === 'act2_door_cutscene' ||
        this.phase === 'act2_outro_cutscene' ||
        this.phase === 'act3_intro_cutscene' ||
        this.phase === 'act3_outro_cutscene' ||
        this.phase === 'act3_secret'
      ) {
        this.skipCutscene();
      } else if (
        this.phase === 'title' ||
        this.phase === 'gameover' ||
        this.phase === 'victory'
      ) {
        this.startGame();
      }
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
      if (this.phase === 'playing' || this.phase === 'paused') {
        this.togglePause();
      } else if (
        this.phase === 'act3_secret' ||
        (this.phase === 'act2_teaser' && this.isSecretPreviewOnly)
      ) {
        this.returnToMenu();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private onWindowBlur = () => {
    this.heldKeys.clear();
    this.isDraggingCam = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    this.audio.unlock();
    if (this.phase !== 'playing') return;

    if (e.button === 2) {
      this.toggleFlashlight();
      return;
    }

    const isFP =
      this.mode === 'first_person' ||
      this.mode === 'story_act1' ||
      this.mode === 'story_act2' ||
      this.mode === 'story_act3' ||
      this.mode === 'fnaf_epta' ||
      this.mode === 'sniper_minigame';
    if (
      isFP &&
      e.pointerType === 'mouse' &&
      document.pointerLockElement !== this.renderer.domElement
    ) {
      try {
        const res = this.renderer.domElement.requestPointerLock?.() as unknown as
          | Promise<void>
          | undefined;
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch {}
    }

    if (e.button === 0) {
      if (this.mode === 'story_act2' || this.mode === 'fnaf_epta') {
        this.interactFactory();
      } else if (this.mode === 'story_act3') {
        this.interactAct3Park();
      } else if (this.mode === 'sniper_minigame') {
        this.fireSniperShot();
      }
    }

    this.isDraggingCam = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.phase !== 'playing') return;
    const isFP =
      this.mode === 'first_person' ||
      this.mode === 'story_act1' ||
      this.mode === 'story_act2' ||
      this.mode === 'story_act3' ||
      this.mode === 'fnaf_epta' ||
      this.mode === 'sniper_minigame';

    if (document.pointerLockElement === this.renderer.domElement) {
      this.camYaw -= e.movementX * 0.0026;
      if (this.isHidingInLocker) {
        this.camYaw = THREE.MathUtils.clamp(
          this.camYaw,
          this.lockerCenterCamYaw - 0.55,
          this.lockerCenterCamYaw + 0.55
        );
      }
      const minP = isFP ? -0.65 : 0.18;
      const maxP = isFP ? 0.65 : 0.72;
      this.camPitch = THREE.MathUtils.clamp(
        this.camPitch + e.movementY * 0.0022,
        minP,
        maxP
      );
      return;
    }

    if (!this.isDraggingCam) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.camYaw -= dx * 0.0065;
    if (this.isHidingInLocker) {
      this.camYaw = THREE.MathUtils.clamp(
        this.camYaw,
        this.lockerCenterCamYaw - 0.55,
        this.lockerCenterCamYaw + 0.55
      );
    }
    const minP = isFP ? -0.65 : 0.18;
    const maxP = isFP ? 0.65 : 0.72;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.004, minP, maxP);
  };

  private onPointerUp = () => {
    this.isDraggingCam = false;
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('resize', this.onResize);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('resize', this.onResize);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    this.audio.dispose();

    for (const d of this.forestObjs.disposables) {
      d.dispose();
    }
    if (this.factoryObjs) {
      for (const d of this.factoryObjs.disposables) {
        d.dispose();
      }
    }
    if (this.sniperArenaObjs) {
      for (const d of this.sniperArenaObjs.disposables) {
        d.dispose();
      }
    }
    if (this.malinkaObjs) {
      for (const d of this.malinkaObjs.disposables) {
        d.dispose();
      }
    }
    if (this.act3ParkObjs) {
      for (const d of this.act3ParkObjs.disposables) {
        d.dispose();
      }
    }
    this.clearAct3Collectibles();
    this.clearFactoryDynamicEntities();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material) {
          m.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
