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
  getCaughtScreamLine,
  getCutsceneLine,
  getKrysaRetreatLine,
  getStandardChaserPhrases,
  loadSettings,
  pickRandomChaserPhrase,
  saveSettings,
} from './localization';
import {
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
const STORY_TARGET_MUSHROOMS = 40;

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

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onBubblesUpdate: (bubbles: SpeechBubbleState[]) => void;
  onFloatingTextsUpdate: (texts: FloatingPickupText[]) => void;
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
  private isStoryWorldBuilt = true;
  private memeTexture: THREE.Texture | null = null;

  // Story Gates, Factory Building & Batteries
  private startGate: GateRig | null = null;
  private factoryGate: GateRig | null = null;
  private factoryBuilding: MivinaFactoryRig | null = null;
  private batteries: BatteryItem[] = [];
  private nextBatteryId = 1;

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

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.12, 180);

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
    this.isStoryWorldBuilt = true;
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

    this.setupTitleShowcase();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.pushHud(true);
    this.startLoop();
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

  private ensureWorldForMode(mode: GameMode): void {
    const wantsStory = mode === 'story_act1';
    if (wantsStory === this.isStoryWorldBuilt) return;

    this.scene.remove(this.forestObjs.worldGroup);
    for (const d of this.forestObjs.disposables) {
      d.dispose();
    }

    this.isStoryWorldBuilt = wantsStory;
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
    } else {
      this.removeStoryGates();
    }
  }

  public setMode(mode: GameMode): void {
    this.mode = mode;
    this.fog.density = mode === 'hardcore_third_person' ? 0.062 : 0.052;
    this.camera.fov = mode === 'hardcore_third_person' ? 58 : 70;
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

    if (this.phase === 'act2_teaser') {
      const key = this.isSecretPreviewOnly ? 'act2_secret' : 'act2_teaser';
      const line = getCutsceneLine(key, normalized);
      this.cutsceneSubtitle = {
        speaker:
          normalized.language === 'en'
            ? this.isSecretPreviewOnly
              ? 'SECRET · «MIVINA CORPORATION»'
              : 'MIVINA CORPORATION · ACT 2 (SOON)'
            : this.isSecretPreviewOnly
              ? 'СЕКРЕТ · «МИВИНА КОРПОРЕЙШЕН»'
              : 'МИВИНА КОРПОРЕЙШЕН · АКТ 2 (СКОРО)',
        text: line.display,
        tone: this.isSecretPreviewOnly ? 'enemy' : 'nikita',
      };
    }

    this.pushHud(true);
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
    this.floatingTexts = [];
    this.killerId = null;
    this.killerName = null;
    this.caughtTimer = 0;
    this.cameraShake = 0;
    this.hitstopTimer = 0;

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

    this.ensureWorldForMode(this.mode);
    this.setupTitleShowcase();
    this.clock.getDelta();
    this.callbacks.onBubblesUpdate([]);
    this.callbacks.onFloatingTextsUpdate([]);
    this.pushHud(true);
  }

  private setupTitleShowcase(): void {
    this.phase = 'title';
    this.fog.density = this.mode === 'hardcore_third_person' ? 0.062 : 0.052;
    this.flashlightOn = true;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
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
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = true;

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
    this.fog.density = activeMode === 'hardcore_third_person' ? 0.062 : 0.052;
    this.camera.fov = activeMode === 'hardcore_third_person' ? 58 : 70;
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
    this.floatingTexts = [];
    this.heldKeys.clear();

    if (activeMode === 'story_act1') {
      this.beginIntroCutscene();
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
    }
  }

  public startAct2SecretPreview(): void {
    this.audio.unlock();
    this.mode = 'story_act1';
    this.ensureWorldForMode('story_act1');
    this.beginAct2Teaser(true);
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
    this.phase = 'victory';
    this.isSecretPreviewOnly = false;
    this.cutsceneSubtitle = null;
    this.playerBubbleText = null;
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
    const isFP = this.mode === 'first_person' || this.mode === 'story_act1';
    const isPlaying = this.phase === 'playing';

    if (this.phase === 'title') {
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
      const flashOn = this.cutsceneStage >= 2;
      this.flashlightSpot.visible = flashOn;
      this.flashlightSpot.intensity = flashOn ? 75 : 0;
      this.tpFlashlight.beamCone.visible = flashOn;
      this.tpFlashlight.lensMat.emissiveIntensity = flashOn ? 3.5 : 0.1;
      this.flashlightSpot.position.set(this.playerX, this.playerY + 1.5, this.playerZ - 0.5);
      this.flashlightTarget.position.set(0, groundHeightAt(0, -7) + 1.6, -7.5);
      return;
    }

    const activeOn = this.flashlightOn && (isPlaying || this.phase === 'paused');
    this.flashlightSpot.visible = activeOn;
    this.flashlightSpot.intensity = isFP ? 58 : 52;
    this.fpFlashlight.beamCone.visible = activeOn && isFP && isPlaying;
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
      this.fpFlashlight.group.position.copy(this.camera.position).add(_vec3);
      this.fpFlashlight.group.quaternion.copy(this.camera.quaternion);
      this.fpFlashlight.group.rotateY(0.05);
      this.fpFlashlight.group.rotateX(0.02);

      this.camera.getWorldDirection(_beamDir);
      _beamOrigin.copy(this.camera.position).addScaledVector(_beamDir, 0.3);
      this.flashlightSpot.position.copy(_beamOrigin);
      this.flashlightTarget.position.copy(_beamOrigin).addScaledVector(_beamDir, 12);
    } else {
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

  private updatePlaying(dt: number, elapsed: number): void {
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

  private triggerCaught(killer: ChaserEntity): void {
    this.phase = 'caught';
    this.caughtTimer = 2.35;
    this.hitstopTimer = 0.07;
    this.cameraShake = 0.65;
    this.killerId = killer.id;
    this.killerName = killer.name;
    this.heldKeys.clear();
    this.playerRig.root.visible = true;
    this.fpFlashlight.group.visible = false;
    this.tpFlashlight.group.visible = false;

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    const scream = getCaughtScreamLine(this.settings);
    killer.currentBubbleText = scream.display;
    killer.bubbleTimer = 3.0;
    killer.isScream = true;

    this.audio.playCaughtScream(scream.speech);
    this.pushHud(true);
  }

  private updateCaught(dt: number, elapsed: number): void {
    this.caughtTimer -= dt;
    animateRobloxCharacter(this.playerRig, 0, dt, elapsed, false, true, false);

    for (const c of this.chasers) {
      if (!c.active) continue;
      if (c.id === this.killerId) {
        const jumpY = Math.abs(Math.sin(elapsed * 14)) * 0.45;
        const cy = groundHeightAt(c.x, c.z);
        c.rig.root.position.set(c.x, cy + jumpY, c.z);
        c.rig.leftArm.rotation.x = -2.6;
        c.rig.rightArm.rotation.x = -2.6;
      } else {
        animateRobloxCharacter(c.rig, 0, dt, elapsed, false, false, true);
      }
    }

    if (this.caughtTimer <= 0) {
      this.phase = 'gameover';
      this.pushHud(true);
    }
  }

  private updateCamera(dt: number, elapsed: number): void {
    if (this.phase === 'title') {
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
      const killer = this.chasers.find((c) => c.id === this.killerId);
      const focusX = killer ? (killer.x + this.playerX) * 0.5 : this.playerX;
      const focusZ = killer ? (killer.z + this.playerZ) * 0.5 : this.playerZ;
      const focusY = groundHeightAt(focusX, focusZ);

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

    const isFP = this.mode === 'first_person' || this.mode === 'story_act1';
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
    const ffAttr = this.forestObjs.fireflies.geometry.attributes
      .position as THREE.BufferAttribute;
    for (let i = 0; i < ffAttr.count; i++) {
      const y = ffAttr.getY(i);
      ffAttr.setY(i, y + Math.sin(elapsed * 1.8 + i) * 0.004);
    }
    ffAttr.needsUpdate = true;

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
      _projVec.set(pos.x, pos.y + 3.45, pos.z);
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
    for (const c of this.chasers) {
      if (!c.active) continue;
      const d = Math.hypot(c.x - this.playerX, c.z - this.playerZ);
      if (d < nearestDist) nearestDist = d;
    }

    const isStory = this.mode === 'story_act1';
    const endX = storyPathCenterX(STORY_END_Z);
    const gateDist = isStory
      ? Math.max(0, Math.round(Math.hypot(this.playerX - endX, this.playerZ - STORY_END_Z)))
      : null;

    this.callbacks.onHudUpdate({
      phase: this.phase,
      mode: this.mode,
      settings: this.settings,
      mushrooms: this.mushroomsCollected,
      targetMushrooms: isStory ? STORY_TARGET_MUSHROOMS : null,
      bestMushrooms: this.bestMushrooms,
      elapsedSeconds: Math.floor(this.elapsedPlaying),
      stamina: Math.round(this.stamina),
      battery: Math.round(this.battery),
      hasBatteryLimit: isStory,
      flashlightOn: this.flashlightOn,
      flashlightStuns: this.flashlightStuns,
      nearestChaserDist: Math.round(nearestDist * 10) / 10,
      distanceToGate: gateDist,
      ronerSpawned: this.chasers[0]?.active ?? false,
      sashaSpawned: this.chasers[1]?.active ?? false,
      killerName: this.killerName,
      killerId: this.killerId,
      activeMushroomsOnMap: this.mushrooms.length,
      speedBoostActive: this.speedBoostTimer > 0,
      eventBanner: this.eventBanner,
      cutsceneSubtitle: this.cutsceneSubtitle,
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

    if (e.code === 'Space' && !e.repeat) {
      if (this.phase === 'playing') {
        this.jumpBufferTimer = 0.14;
      } else if (
        this.phase === 'intro_cutscene' ||
        this.phase === 'outro_cutscene' ||
        this.phase === 'act2_teaser'
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
        this.phase === 'act2_teaser'
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
      } else if (this.phase === 'act2_teaser' && this.isSecretPreviewOnly) {
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

    const isFP = this.mode === 'first_person' || this.mode === 'story_act1';
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

    this.isDraggingCam = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.phase !== 'playing') return;
    const isFP = this.mode === 'first_person' || this.mode === 'story_act1';

    if (document.pointerLockElement === this.renderer.domElement) {
      this.camYaw -= e.movementX * 0.0026;
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
