import * as THREE from 'three';

export const FACTORY_HALF_W = 24.5;
export const FACTORY_HALF_D = 18.5;
export const CONVEYOR_Z = -1.5;
export const CONVEYOR_START_X = -10.2;
export const CONVEYOR_END_X = 7.4;
export const CONVEYOR_TOP_Y = 1.06;
export const PACKER_POS = new THREE.Vector3(10.6, 0, CONVEYOR_Z);

export const CORRIDOR_X = 12.0;
export const CORRIDOR_HALF_W = 3.0;
export const CORRIDOR_VESTIBULE_Z = -24.5;
export const CORRIDOR_END_Z = -210.5;
export const SNIPER_PICKUP_POS = new THREE.Vector3(CORRIDOR_X, 0, -207.0);

export interface FactoryObstacle {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  lockerId?: number;
  doorId?: number;
  disabled?: boolean;
}

export interface FactoryLocker {
  id: number;
  x: number;
  z: number;
  yaw: number; // Outward facing direction (+Z=0, +X=PI/2, -Z=PI, -X=-PI/2)
  exitX: number;
  exitZ: number;
  doorPivot: THREE.Group;
}

export interface FactoryWindow {
  id: number;
  x: number;
  y: number;
  z: number;
  inwardX: number;
  inwardZ: number;
  glassMesh: THREE.Mesh;
  beaconMat: THREE.MeshStandardMaterial;
}

export interface ConveyorSystemRig {
  group: THREE.Group;
  beltTexture: THREE.CanvasTexture;
  rollers: THREE.Mesh[];
  pressHead: THREE.Group;
  beaconMesh: THREE.Mesh;
  beaconMat: THREE.MeshStandardMaterial;
  beaconLight: THREE.PointLight;
  trayBricks: THREE.Group[];
  packedCratePacks: THREE.Group[];
  hopperMushrooms: THREE.Group;
}

export interface NoodleBrickRig {
  group: THREE.Group;
  sachetGroup: THREE.Group;
  highlightRing: THREE.Mesh;
}

export interface SeasoningBoxRig {
  group: THREE.Group;
  glowRing: THREE.Mesh;
  packetsGroup: THREE.Group;
}

export interface SachetHandRig {
  group: THREE.Group;
  packetMesh: THREE.Group;
}

export interface FactoryDoorRig {
  doorPivot: THREE.Group;
  padlock?: THREE.Group;
  lockBeaconMat?: THREE.MeshStandardMaterial;
}

export interface ExitLolDoorRig {
  leftDoor: THREE.Group;
  rightDoor: THREE.Group;
  light: THREE.PointLight;
}

export interface SniperPickupRig {
  group: THREE.Group;
  rifleGroup: THREE.Group;
  glowRing: THREE.Mesh;
}

export interface FactorySceneObjects {
  worldGroup: THREE.Group;
  conveyor: ConveyorSystemRig;
  obstacles: FactoryObstacle[];
  lockers: FactoryLocker[];
  windows: FactoryWindow[];
  corridorDoor1: FactoryDoorRig;
  corridorDoor2: FactoryDoorRig;
  exitLolDoor: ExitLolDoorRig;
  sniperPickup: SniperPickupRig;
  leftSlidingDoor: THREE.Mesh;
  rightSlidingDoor: THREE.Mesh;
  doorGlowLight: THREE.PointLight;
  lampLights: THREE.PointLight[];
  lampBaseIntensities: number[];
  bulbMat: THREE.MeshStandardMaterial;
  alarmLight: THREE.PointLight;
  disposables: Array<{ dispose: () => void }>;
}

function makeFloorTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#1f262e';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 600; i++) {
    const x = (i * 197) % 512;
    const y = (i * 313) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 10, 10);
  }

  ctx.strokeStyle = 'rgba(10, 14, 18, 0.55)';
  ctx.lineWidth = 4;
  for (let g = 0; g <= 512; g += 128) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 9);
  tex.anisotropy = anisotropy;
  return tex;
}

function makeBeltTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 10;
  for (let x = -64; x < 576; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x + 24, 64);
    ctx.lineTo(x, 116);
    ctx.stroke();
  }

  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 512, 6);
  ctx.fillRect(0, 122, 512, 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(7, 1);
  tex.anisotropy = anisotropy;
  return tex;
}

function makeSignTexture(
  title: string,
  subtitle: string,
  bg: string,
  fg: string,
  accent: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, 1004, 236);

  ctx.fillStyle = fg;
  ctx.font = '900 72px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 512, 102);

  ctx.fillStyle = accent;
  ctx.font = '800 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, 512, 182);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function makePacketTexture(anisotropy: number, isPackedMivina: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  if (isPackedMivina) {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(0.55, '#b91c1c');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(14, 18, 228, 28);
    ctx.fillRect(14, 210, 228, 28);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('МИВИНА', 128, 112);

    ctx.fillStyle = '#86efac';
    ctx.font = '800 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('ПРОСТОФИЛЯ', 128, 158);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#ea580c');
    grad.addColorStop(1, '#c2410c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 232, 232);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ПРИПРАВА', 128, 108);

    ctx.fillStyle = '#fef08a';
    ctx.font = '800 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('ГРИБНАЯ', 128, 152);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createNoodleBrickMesh(anisotropy: number): NoodleBrickRig {
  const group = new THREE.Group();

  const noodleMat = new THREE.MeshStandardMaterial({
    color: 0xf6c959,
    roughness: 0.72,
    metalness: 0.04,
  });
  const wavyMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    roughness: 0.65,
    metalness: 0.05,
  });
  const herbMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.85,
  });

  const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.44), noodleMat);
  baseBlock.position.y = 0.08;
  baseBlock.castShadow = true;
  group.add(baseBlock);

  for (let row = 0; row < 4; row++) {
    const ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.52, 7),
      wavyMat
    );
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, 0.16, -0.15 + row * 0.1);
    group.add(ridge);
  }

  for (let i = 0; i < 4; i++) {
    const fleck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.04), herbMat);
    fleck.position.set(-0.14 + i * 0.095, 0.185, (i % 2 === 0 ? 1 : -1) * 0.08);
    group.add(fleck);
  }

  const sachetTex = makePacketTexture(anisotropy, false);
  const sachetMat = new THREE.MeshStandardMaterial({
    map: sachetTex,
    roughness: 0.28,
    metalness: 0.55,
  });
  const crimpMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.3,
    metalness: 0.65,
  });

  const sachetGroup = new THREE.Group();
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.042, 0.22), sachetMat);
  const crimpL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.22), crimpMat);
  crimpL.position.x = -0.15;
  const crimpR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.22), crimpMat);
  crimpR.position.x = 0.15;
  sachetGroup.add(pouch, crimpL, crimpR);
  sachetGroup.position.set(0, 0.215, 0);
  sachetGroup.rotation.y = 0.14;
  sachetGroup.visible = false;
  group.add(sachetGroup);

  const highlightRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.39, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
  );
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.position.y = 0.015;
  highlightRing.visible = false;
  group.add(highlightRing);

  return { group, sachetGroup, highlightRing };
}

export function createSeasoningBoxMesh(anisotropy: number): SeasoningBoxRig {
  const group = new THREE.Group();

  const cardboardMat = new THREE.MeshStandardMaterial({
    color: 0xb4844c,
    roughness: 0.88,
    metalness: 0.04,
  });
  const labelTex = makeSignTexture(
    'ПРИПРАВА',
    'МИВИНА ПРОСТОФИЛЯ',
    '#7f1d1d',
    '#fef08a',
    '#f59e0b',
    anisotropy
  );
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    roughness: 0.65,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.58), cardboardMat);
  body.position.y = 0.26;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const labelF = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.28), labelMat);
  labelF.position.set(0, 0.27, 0.293);
  const labelB = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.28), labelMat);
  labelB.rotation.y = Math.PI;
  labelB.position.set(0, 0.27, -0.293);
  group.add(labelF, labelB);

  const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.56), cardboardMat);
  flapL.position.set(-0.46, 0.56, 0);
  flapL.rotation.z = 0.55;
  const flapR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.56), cardboardMat);
  flapR.position.set(0.46, 0.56, 0);
  flapR.rotation.z = -0.55;
  group.add(flapL, flapR);

  const packetsGroup = new THREE.Group();
  const sachetTex = makePacketTexture(anisotropy, false);
  const sachetMat = new THREE.MeshStandardMaterial({
    map: sachetTex,
    roughness: 0.25,
    metalness: 0.55,
  });
  for (let i = 0; i < 4; i++) {
    const pkt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.34), sachetMat);
    pkt.position.set(-0.18 + i * 0.12, 0.55, 0);
    pkt.rotation.z = (i - 1.5) * 0.08;
    packetsGroup.add(pkt);
  }
  group.add(packetsGroup);

  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.64, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
    })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.02;
  group.add(glowRing);

  return { group, glowRing, packetsGroup };
}

export function createPackedMivinaMesh(anisotropy: number): THREE.Group {
  const group = new THREE.Group();
  const tex = makePacketTexture(anisotropy, true);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.28,
    metalness: 0.42,
  });
  const crimpMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.32,
    metalness: 0.5,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.32), mat);
  body.castShadow = true;
  const crimpL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.32), crimpMat);
  crimpL.position.x = -0.23;
  const crimpR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.32), crimpMat);
  crimpR.position.x = 0.23;
  group.add(body, crimpL, crimpR);

  return group;
}

export function createSachetHandViewModel(anisotropy: number): SachetHandRig {
  const group = new THREE.Group();

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x1b1d24,
    roughness: 0.78,
    metalness: 0.05,
  });
  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x14532d,
    emissiveIntensity: 0.25,
    roughness: 0.68,
  });
  const handMat = new THREE.MeshStandardMaterial({
    color: 0xf1c7a5,
    roughness: 0.52,
    metalness: 0.02,
  });

  const arm = new THREE.Group();
  arm.rotation.set(0.28, 0.25, 0.16);

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.12), handMat);
  palm.position.set(0, -0.02, 0.04);
  arm.add(palm);

  const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.115, 0.045), cuffMat);
  cuff.position.set(0, -0.02, 0.12);
  arm.add(cuff);

  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.125, 0.36), sleeveMat);
  sleeve.position.set(0, -0.02, 0.32);
  arm.add(sleeve);

  group.add(arm);

  const packetMesh = new THREE.Group();
  const tex = makePacketTexture(anisotropy, false);
  const pktMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.25,
    metalness: 0.5,
  });
  const pktBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.032, 0.15), pktMat);
  const crimp = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.012, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.5, roughness: 0.3 })
  );
  packetMesh.add(pktBody, crimp);
  packetMesh.position.set(0.02, 0.04, -0.06);
  packetMesh.rotation.set(-0.22, 0.18, 0.06);
  group.add(packetMesh);

  return { group, packetMesh };
}

function createConveyorSystem(
  anisotropy: number,
  disposables: Array<{ dispose: () => void }>
): ConveyorSystemRig {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.42,
    metalness: 0.78,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.45,
    metalness: 0.35,
  });
  const rollerMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.26,
    metalness: 0.85,
  });
  const beltTexture = makeBeltTexture(anisotropy);
  disposables.push(beltTexture);

  const beltMat = new THREE.MeshStandardMaterial({
    map: beltTexture,
    roughness: 0.72,
    metalness: 0.08,
  });

  const beltLength = CONVEYOR_END_X - CONVEYOR_START_X;
  const beltCenterX = (CONVEYOR_START_X + CONVEYOR_END_X) * 0.5;

  const bed = new THREE.Mesh(new THREE.BoxGeometry(beltLength + 0.8, 0.18, 1.38), frameMat);
  bed.position.set(beltCenterX, 0.94, CONVEYOR_Z);
  bed.castShadow = true;
  bed.receiveShadow = true;
  group.add(bed);

  const beltSurface = new THREE.Mesh(new THREE.BoxGeometry(beltLength + 0.4, 0.04, 1.12), beltMat);
  beltSurface.position.set(beltCenterX, 1.04, CONVEYOR_Z);
  beltSurface.receiveShadow = true;
  group.add(beltSurface);

  for (const side of [-0.66, 0.66]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(beltLength + 0.5, 0.12, 0.06), railMat);
    rail.position.set(beltCenterX, 1.11, CONVEYOR_Z + side);
    group.add(rail);
  }

  for (let lx = CONVEYOR_START_X; lx <= CONVEYOR_END_X; lx += 3.5) {
    for (const side of [-0.56, 0.56]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.92, 0.12), frameMat);
      leg.position.set(lx, 0.46, CONVEYOR_Z + side);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  const rollers: THREE.Mesh[] = [];
  const rollerGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.18, 12);
  rollerGeo.rotateX(Math.PI / 2);
  for (let rx = CONVEYOR_START_X; rx <= CONVEYOR_END_X; rx += 2.2) {
    const roller = new THREE.Mesh(rollerGeo, rollerMat);
    roller.position.set(rx, 0.97, CONVEYOR_Z);
    group.add(roller);
    rollers.push(roller);
  }

  const hopperBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.55, 1.85), frameMat);
  hopperBase.position.set(CONVEYOR_START_X - 1.25, 0.78, CONVEYOR_Z);
  hopperBase.castShadow = true;
  group.add(hopperBase);

  const funnel = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 0.52, 1.05, 12),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.3 })
  );
  funnel.position.set(CONVEYOR_START_X - 1.25, 2.05, CONVEYOR_Z);
  group.add(funnel);

  const hopperSignTex = makeSignTexture(
    'БУНКЕР ГРИБОВ',
    'ПРОСТОФИЛЯ → ЛАПША',
    '#052e16',
    '#86efac',
    '#22c55e',
    anisotropy
  );
  disposables.push(hopperSignTex);
  const hopperSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.55),
    new THREE.MeshBasicMaterial({ map: hopperSignTex })
  );
  hopperSign.position.set(CONVEYOR_START_X - 1.25, 1.15, CONVEYOR_Z + 0.94);
  group.add(hopperSign);

  const hopperMushrooms = new THREE.Group();
  const capMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 });
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), capMat);
    cap.scale.set(1, 0.55, 1);
    cap.position.set(Math.cos(ang) * 0.42, 0.14, Math.sin(ang) * 0.42);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.18, 8), stemMat);
    stem.position.set(Math.cos(ang) * 0.42, 0.04, Math.sin(ang) * 0.42);
    hopperMushrooms.add(cap, stem);
  }
  hopperMushrooms.position.set(CONVEYOR_START_X - 1.25, 2.52, CONVEYOR_Z);
  group.add(hopperMushrooms);

  const packTable = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.0, 2.1), frameMat);
  packTable.position.set(PACKER_POS.x, 0.5, CONVEYOR_Z);
  packTable.castShadow = true;
  packTable.receiveShadow = true;
  group.add(packTable);

  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.72,
  });
  const trayFloor = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 1.55), trayMat);
  trayFloor.position.set(CONVEYOR_END_X + 1.15, 1.02, CONVEYOR_Z);
  group.add(trayFloor);

  for (const side of [-0.88, 0.88]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), railMat);
    col.position.set(PACKER_POS.x + 0.55, 2.1, CONVEYOR_Z + side);
    group.add(col);
  }
  const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 2.0), frameMat);
  crossbeam.position.set(PACKER_POS.x + 0.55, 3.15, CONVEYOR_Z);
  group.add(crossbeam);

  const packSignTex = makeSignTexture(
    'УПАКОВКА МИВИН',
    'НАЖМИ [E / ЛКМ] ЧТОБЫ ЗАПАКОВАТЬ',
    '#172554',
    '#fef08a',
    '#38bdf8',
    anisotropy
  );
  disposables.push(packSignTex);
  const packSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 0.52),
    new THREE.MeshBasicMaterial({ map: packSignTex })
  );
  packSign.position.set(PACKER_POS.x + 0.55, 3.58, CONVEYOR_Z + 0.05);
  group.add(packSign);

  const pressHead = new THREE.Group();
  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.1, 10),
    rollerMat
  );
  piston.position.y = 0.55;
  const sealPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.16, 1.05),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.6 })
  );
  pressHead.add(piston, sealPlate);
  pressHead.position.set(PACKER_POS.x + 0.55, 2.15, CONVEYOR_Z);
  group.add(pressHead);

  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });
  const beaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.26, 12), beaconMat);
  beaconMesh.position.set(PACKER_POS.x + 0.55, 3.98, CONVEYOR_Z);
  group.add(beaconMesh);

  const beaconLight = new THREE.PointLight(0xf59e0b, 4.5, 12, 1.4);
  beaconLight.position.set(PACKER_POS.x + 0.55, 3.7, CONVEYOR_Z);
  group.add(beaconLight);

  const trayBricks: THREE.Group[] = [];
  for (let i = 0; i < 20; i++) {
    const b = createNoodleBrickMesh(anisotropy);
    b.sachetGroup.visible = true;
    b.group.scale.setScalar(0.55);
    const col = i % 4;
    const row = Math.floor(i / 4) % 3;
    const layer = Math.floor(i / 12);
    b.group.position.set(
      CONVEYOR_END_X + 0.65 + col * 0.34,
      1.06 + layer * 0.14,
      CONVEYOR_Z - 0.42 + row * 0.42
    );
    b.group.visible = false;
    group.add(b.group);
    trayBricks.push(b.group);
  }

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x92623a, roughness: 0.85 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 1.35), crateMat);
  crate.position.set(PACKER_POS.x + 1.8, 1.22, CONVEYOR_Z);
  group.add(crate);

  const packedCratePacks: THREE.Group[] = [];
  for (let i = 0; i < 20; i++) {
    const pack = createPackedMivinaMesh(anisotropy);
    pack.scale.setScalar(0.72);
    const col = i % 4;
    const row = Math.floor(i / 4) % 3;
    const layer = Math.floor(i / 12);
    pack.position.set(
      PACKER_POS.x + 1.28 + col * 0.34,
      1.48 + layer * 0.13,
      CONVEYOR_Z - 0.36 + row * 0.36
    );
    pack.visible = false;
    group.add(pack);
    packedCratePacks.push(pack);
  }

  return {
    group,
    beltTexture,
    rollers,
    pressHead,
    beaconMesh,
    beaconMat,
    beaconLight,
    trayBricks,
    packedCratePacks,
    hopperMushrooms,
  };
}

function addWallSegment(
  parent: THREE.Group,
  obstacles: FactoryObstacle[],
  x: number,
  z: number,
  sizeX: number,
  sizeZ: number,
  mat: THREE.Material,
  height = 8.2,
  yCenter = 4.1,
  addCollider = true
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sizeX, height, sizeZ), mat);
  mesh.position.set(x, yCenter, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (addCollider) {
    obstacles.push({
      x,
      z,
      halfW: sizeX * 0.5,
      halfD: sizeZ * 0.5,
    });
  }
}

function createWindowAssembly(
  id: number,
  x: number,
  z: number,
  inwardX: number,
  inwardZ: number,
  wallMat: THREE.Material,
  frameMat: THREE.Material,
  parent: THREE.Group
): FactoryWindow {
  const winW = 4.0;
  const sillH = 1.45;
  const openH = 2.1; // y = 1.45 .. 3.55
  const topH = 8.2 - (sillH + openH);

  const winGroup = new THREE.Group();
  winGroup.position.set(x, 0, z);

  // Lower concrete sill wall + upper wall above window
  const sillWall = new THREE.Mesh(new THREE.BoxGeometry(winW, sillH, 0.8), wallMat);
  sillWall.position.set(0, sillH * 0.5, 0);
  const topWall = new THREE.Mesh(new THREE.BoxGeometry(winW, topH, 0.8), wallMat);
  topWall.position.set(0, sillH + openH + topH * 0.5, 0);
  winGroup.add(sillWall, topWall);

  // Steel window casing + crossbar mullions
  const sillPlate = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.15, 0.14, 1.0), frameMat);
  sillPlate.position.set(0, sillH, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.15, 0.16, 1.0), frameMat);
  lintel.position.set(0, sillH + openH, 0);
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.1, openH, 0.18), frameMat);
  mullionV.position.set(0, sillH + openH * 0.5, 0);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.1, 0.18), frameMat);
  mullionH.position.set(0, sillH + openH * 0.5, 0);
  winGroup.add(sillPlate, lintel, mullionV, mullionH);

  // Translucent window glass pane
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.28,
    transparent: true,
    opacity: 0.34,
    roughness: 0.15,
    metalness: 0.25,
    side: THREE.DoubleSide,
  });
  const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(winW - 0.15, openH - 0.12), glassMat);
  glassMesh.position.set(0, sillH + openH * 0.5, 0);
  winGroup.add(glassMesh);

  // Exterior night backdrop behind window so RONER silhouette pops in the moonlight
  const nightBackMat = new THREE.MeshBasicMaterial({ color: 0x071320, side: THREE.DoubleSide });
  const nightBack = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 5.2), nightBackMat);
  nightBack.position.set(-inwardX * 3.2, 2.5, -inwardZ * 3.2);
  winGroup.add(nightBack);

  // Red industrial alarm beacon mounted above window on the interior wall
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    emissive: 0x991b1b,
    emissiveIntensity: 0.2,
    roughness: 0.25,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.28, 12), beaconMat);
  beacon.position.set(inwardX * 0.45, sillH + openH + 0.48, inwardZ * 0.45);
  winGroup.add(beacon);

  parent.add(winGroup);

  return {
    id,
    x,
    y: sillH + openH * 0.5,
    z,
    inwardX,
    inwardZ,
    glassMesh,
    beaconMat,
  };
}

function createLockerProp(
  id: number,
  x: number,
  z: number,
  yaw: number,
  parent: THREE.Group,
  obstacles: FactoryObstacle[]
): FactoryLocker {
  const locker = new THREE.Group();
  locker.position.set(x, 0, z);
  locker.rotation.y = yaw;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.52,
    metalness: 0.62,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x090d14,
    roughness: 0.9,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.45,
    metalness: 0.58,
  });
  const badgeMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  // Back, left, right, top, bottom plates forming hollow closet interior (1.28 x 2.48 x 1.18)
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.48, 0.08), innerMat);
  back.position.set(0, 1.24, -0.55);
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.48, 1.18), metalMat);
  leftSide.position.set(-0.6, 1.24, 0);
  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.48, 1.18), metalMat);
  rightSide.position.set(0.6, 1.24, 0);
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 1.2), metalMat);
  topCap.position.set(0, 2.45, 0);
  const bottomCap = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.06, 1.18), innerMat);
  bottomCap.position.set(0, 0.03, 0);

  // Subtle green indicator strip on top header so closets are readable across dark rack rooms
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.08), badgeMat);
  strip.position.set(0, 2.52, 0.54);

  locker.add(back, leftSide, rightSide, topCap, bottomCap, strip);

  // Hinged louvered door with eye-level viewing slats!
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.56, 0, 0.55);

  const lowerPanel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.56, 0.06), doorMat);
  lowerPanel.position.set(0.56, 0.8, 0);
  const upperPanel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.38, 0.06), doorMat);
  upperPanel.position.set(0.56, 2.24, 0);
  const slatBar1 = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 0.06), doorMat);
  slatBar1.position.set(0.56, 1.72, 0);
  const slatBar2 = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 0.06), doorMat);
  slatBar2.position.set(0.56, 1.94, 0);
  const sideFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.06), doorMat);
  sideFrameL.position.set(0.05, 1.22, 0);
  const sideFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.06), doorMat);
  sideFrameR.position.set(1.07, 1.22, 0);
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.24, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.3 })
  );
  handle.position.set(0.96, 1.22, 0.06);

  doorPivot.add(
    lowerPanel,
    upperPanel,
    slatBar1,
    slatBar2,
    sideFrameL,
    sideFrameR,
    handle
  );
  // Idle slightly ajar (-0.42 rad) so player sees it's an interactive hiding closet
  doorPivot.rotation.y = -0.42;
  locker.add(doorPivot);

  parent.add(locker);

  const halfW = Math.abs(Math.cos(yaw)) * 0.68 + Math.abs(Math.sin(yaw)) * 0.62;
  const halfD = Math.abs(Math.sin(yaw)) * 0.68 + Math.abs(Math.cos(yaw)) * 0.62;
  obstacles.push({ x, z, halfW, halfD, lockerId: id });

  return {
    id,
    x,
    z,
    yaw,
    exitX: x + Math.sin(yaw) * 1.35,
    exitZ: z + Math.cos(yaw) * 1.35,
    doorPivot,
  };
}

function buildStorageRack(
  x: number,
  z: number,
  rotY: number,
  rackMat: THREE.Material,
  crateMat: THREE.Material,
  parent: THREE.Group,
  obstacles: FactoryObstacle[]
) {
  const rack = new THREE.Group();
  for (const px of [-1.45, 1.45]) {
    for (const pz of [-0.55, 0.55]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.8, 0.1), rackMat);
      post.position.set(px, 1.9, pz);
      rack.add(post);
    }
  }
  for (const sy of [0.85, 1.95, 3.05]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 1.26), rackMat);
    shelf.position.y = sy;
    rack.add(shelf);
    const boxA = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.66, 0.78), crateMat);
    boxA.position.set(-0.72, sy + 0.37, 0);
    const boxB = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.56, 0.72), crateMat);
    boxB.position.set(0.66, sy + 0.32, 0.04);
    rack.add(boxA, boxB);
  }
  rack.position.set(x, 0, z);
  rack.rotation.y = rotY;
  parent.add(rack);

  const c = Math.abs(Math.cos(rotY));
  const s = Math.abs(Math.sin(rotY));
  obstacles.push({
    x,
    z,
    halfW: c * 1.75 + s * 0.85,
    halfD: s * 1.75 + c * 0.85,
  });
}

/**
 * Procedural 8-part tactical sniper rifle pointing along -Z in local space.
 */
export function createSniperRifleProp(): THREE.Group {
  const rifle = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.78,
  });
  const oliveMat = new THREE.MeshStandardMaterial({
    color: 0x365314,
    roughness: 0.68,
    metalness: 0.14,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.25,
    metalness: 0.9,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: 0x16a34a,
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.3,
  });

  // Main olive chassis + buttstock
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.88), oliveMat);
  chassis.position.set(0, 0, 0.05);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.19, 0.42), oliveMat);
  stock.position.set(0, -0.02, 0.54);
  const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.06, 0.22), bodyMat);
  cheekRest.position.set(0, 0.09, 0.5);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.09), bodyMat);
  grip.position.set(0, -0.14, 0.26);
  grip.rotation.x = 0.28;
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.19, 0.14), bodyMat);
  mag.position.set(0, -0.14, -0.04);
  mag.rotation.x = -0.12;

  // Long precision barrel + muzzle brake
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 1.02, 10), steelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, -0.82);
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.13), bodyMat);
  muzzle.position.set(0, 0.04, -1.33);

  // Telescopic scope + glowing emerald objective lens
  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.48, 12), bodyMat);
  scopeTube.rotation.x = Math.PI / 2;
  scopeTube.position.set(0, 0.14, -0.04);
  const scopeBell = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.04, 0.12, 12), bodyMat);
  scopeBell.rotation.x = Math.PI / 2;
  scopeBell.position.set(0, 0.14, -0.31);
  const scopeLens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), lensMat);
  scopeLens.rotation.y = Math.PI;
  scopeLens.position.set(0, 0.14, -0.372);

  // Folded bipod legs
  const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), steelMat);
  bipodL.rotation.x = 0.6;
  bipodL.rotation.z = 0.28;
  bipodL.position.set(-0.08, -0.11, -0.45);
  const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), steelMat);
  bipodR.rotation.x = 0.6;
  bipodR.rotation.z = -0.28;
  bipodR.position.set(0.08, -0.11, -0.45);

  rifle.add(
    chassis,
    stock,
    cheekRest,
    grip,
    mag,
    barrel,
    muzzle,
    scopeTube,
    scopeBell,
    scopeLens,
    bipodL,
    bipodR
  );
  return rifle;
}

function createCorridorDoorAssembly(
  doorId: number,
  x: number,
  z: number,
  withPadlock: boolean,
  signTex: THREE.CanvasTexture,
  frameMat: THREE.Material,
  parent: THREE.Group,
  obstacles: FactoryObstacle[]
): FactoryDoorRig {
  const doorGroup = new THREE.Group();
  doorGroup.position.set(x, 0, z);

  const doorPanelMat = new THREE.MeshStandardMaterial({
    color: withPadlock ? 0x3f4756 : 0x334155,
    roughness: 0.45,
    metalness: 0.72,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.55,
    roughness: 0.25,
    metalness: 0.85,
  });

  // Door frame posts & lintel (3.4m wide doorway, 4.0m tall)
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 0.9), frameMat);
  postL.position.set(-1.72, 2.1, 0);
  const postR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 0.9), frameMat);
  postR.position.set(1.72, 2.1, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.28, 0.92), frameMat);
  lintel.position.set(0, 4.15, 0);
  doorGroup.add(postL, postR, lintel);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 0.85),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 4.78, 0.42);
  doorGroup.add(signMesh);

  // Hinged swinging door leaf
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.58, 0, 0);

  const leaf = new THREE.Mesh(new THREE.BoxGeometry(3.16, 4.0, 0.18), doorPanelMat);
  leaf.position.set(1.58, 2.0, 0);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.18, 0.24, 0.21),
    new THREE.MeshStandardMaterial({ color: withPadlock ? 0xf59e0b : 0x64748b, roughness: 0.4 })
  );
  stripe.position.set(1.58, 1.45, 0);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.26), goldMat);
  handle.position.set(2.9, 1.45, 0.14);
  doorPivot.add(leaf, stripe, handle);

  let padlock: THREE.Group | undefined;
  let lockBeaconMat: THREE.MeshStandardMaterial | undefined;
  if (withPadlock) {
    padlock = new THREE.Group();
    padlock.position.set(2.9, 1.32, 0.26);
    const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.16), goldMat);
    const shackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.04, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
    );
    shackle.position.set(0, 0.23, 0);
    padlock.add(lockBody, shackle);
    doorPivot.add(padlock);

    lockBeaconMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const statusLamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lockBeaconMat);
    statusLamp.position.set(0, 4.35, 0.48);
    doorGroup.add(statusLamp);
  }

  doorGroup.add(doorPivot);
  parent.add(doorGroup);

  obstacles.push({
    x,
    z,
    halfW: 1.75,
    halfD: 0.48,
    doorId,
    disabled: false,
  });

  return { doorPivot, padlock, lockBeaconMat };
}

export function buildFactoryEnvironment(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): FactorySceneObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const obstacles: FactoryObstacle[] = [];
  const lockers: FactoryLocker[] = [];
  const windows: FactoryWindow[] = [];

  const floorTex = makeFloorTexture(anisotropy);
  disposables.push(floorTex);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.84,
    metalness: 0.08,
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FACTORY_HALF_W * 2 + 2, FACTORY_HALF_D * 2 + 2),
    floorMat
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  worldGroup.add(floor);

  const stripeMat = new THREE.MeshBasicMaterial({
    color: 0xeab308,
    transparent: true,
    opacity: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const zoneBox = new THREE.Mesh(new THREE.PlaneGeometry(25.2, 4.2), stripeMat);
  zoneBox.rotation.x = -Math.PI / 2;
  zoneBox.position.set(0.2, 0.02, CONVEYOR_Z);
  worldGroup.add(zoneBox);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x26313d,
    roughness: 0.86,
    metalness: 0.12,
  });
  const partitionMat = new THREE.MeshStandardMaterial({
    color: 0x2d3a48,
    roughness: 0.82,
    metalness: 0.16,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x161d24,
    roughness: 0.9,
    metalness: 0.25,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.72,
  });

  // Outer Perimeter Walls + Ceiling
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.2, FACTORY_HALF_D * 2 + 1), wallMat);
  leftWall.position.set(-FACTORY_HALF_W, 4.1, 0);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.2, FACTORY_HALF_D * 2 + 1), wallMat);
  rightWall.position.set(FACTORY_HALF_W, 4.1, 0);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(FACTORY_HALF_W * 2 + 2, FACTORY_HALF_D * 2 + 2),
    roofMat
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 8.1;
  worldGroup.add(leftWall, rightWall, ceiling);

  // North Exterior Wall (z = -18.5): Window #2 at x=0.5 (-1.5..2.5) AND Locked Corridor Door #1 at x=12.0 (10.3..13.7)
  addWallSegment(worldGroup, obstacles, -13.0, -FACTORY_HALF_D, 23.0, 0.8, wallMat, 8.2, 4.1, true);
  addWallSegment(worldGroup, obstacles, 6.4, -FACTORY_HALF_D, 7.8, 0.8, wallMat, 8.2, 4.1, true);
  addWallSegment(worldGroup, obstacles, 19.1, -FACTORY_HALF_D, 10.8, 0.8, wallMat, 8.2, 4.1, true);
  addWallSegment(worldGroup, obstacles, CORRIDOR_X, -FACTORY_HALF_D, 3.6, 0.8, wallMat, 4.2, 6.1, false);
  const winNorth = createWindowAssembly(
    2,
    0.5,
    -FACTORY_HALF_D,
    0,
    1,
    wallMat,
    frameMat,
    worldGroup
  );

  // South Exterior Wall (z = +18.5) with Entrance Doors (x = -3.4..3.4) + Window #0 (x=-7.2) + Window #1 (x=7.2)
  addWallSegment(worldGroup, obstacles, -16.85, FACTORY_HALF_D, 15.3, 0.8, wallMat, 8.2, 4.1, false);
  addWallSegment(worldGroup, obstacles, -4.3, FACTORY_HALF_D, 1.8, 0.8, wallMat, 8.2, 4.1, false);
  addWallSegment(worldGroup, obstacles, 4.3, FACTORY_HALF_D, 1.8, 0.8, wallMat, 8.2, 4.1, false);
  addWallSegment(worldGroup, obstacles, 16.85, FACTORY_HALF_D, 15.3, 0.8, wallMat, 8.2, 4.1, false);
  addWallSegment(worldGroup, obstacles, 0, FACTORY_HALF_D, 7.0, 3.6, wallMat, 3.6, 6.4, false);

  const winSouthLeft = createWindowAssembly(
    0,
    -7.2,
    FACTORY_HALF_D,
    0,
    -1,
    wallMat,
    frameMat,
    worldGroup
  );
  const winSouthRight = createWindowAssembly(
    1,
    7.2,
    FACTORY_HALF_D,
    0,
    -1,
    wallMat,
    frameMat,
    worldGroup
  );
  windows.push(winSouthLeft, winSouthRight, winNorth);

  // Interior Partition Walls dividing Factory into Central Hall + 3 Storage Rack Rooms!
  // 1. West Partition (x = -13.2, z = -7.5 .. 18.5) with doorways at z=2..6.5 and z=11.5..15.5
  addWallSegment(worldGroup, obstacles, -13.2, -2.75, 0.6, 9.5, partitionMat);
  addWallSegment(worldGroup, obstacles, -13.2, 9.0, 0.6, 5.0, partitionMat);
  addWallSegment(worldGroup, obstacles, -13.2, 17.0, 0.6, 3.0, partitionMat);
  addWallSegment(worldGroup, obstacles, -13.2, 4.25, 0.6, 4.5, partitionMat, 4.0, 6.2, false);
  addWallSegment(worldGroup, obstacles, -13.2, 13.5, 0.6, 4.0, partitionMat, 4.0, 6.2, false);

  // 2. East Partition (x = 14.2, z = -7.5 .. 18.5) with doorways at z=-5.5..-0.5 and z=8..12.5
  addWallSegment(worldGroup, obstacles, 14.2, -6.5, 0.6, 2.0, partitionMat);
  addWallSegment(worldGroup, obstacles, 14.2, 3.75, 0.6, 8.5, partitionMat);
  addWallSegment(worldGroup, obstacles, 14.2, 15.5, 0.6, 6.0, partitionMat);
  addWallSegment(worldGroup, obstacles, 14.2, -3.0, 0.6, 5.0, partitionMat, 4.0, 6.2, false);
  addWallSegment(worldGroup, obstacles, 14.2, 10.25, 0.6, 4.5, partitionMat, 4.0, 6.2, false);

  // 3. North Partition (z = -7.5, x = -24.5 .. 24.5) with 4 wide archways into North Rack Wing
  addWallSegment(worldGroup, obstacles, -22.5, -7.5, 4.0, 0.6, partitionMat);
  addWallSegment(worldGroup, obstacles, -12.25, -7.5, 8.5, 0.6, partitionMat);
  addWallSegment(worldGroup, obstacles, 0.25, -7.5, 6.5, 0.6, partitionMat);
  addWallSegment(worldGroup, obstacles, 13.0, -7.5, 9.0, 0.6, partitionMat);
  addWallSegment(worldGroup, obstacles, 23.0, -7.5, 3.0, 0.6, partitionMat);
  for (const [ax, aw] of [
    [-18.5, 4.0],
    [-5.5, 5.0],
    [6.0, 5.0],
    [19.5, 4.0],
  ]) {
    addWallSegment(worldGroup, obstacles, ax, -7.5, aw, 0.6, partitionMat, 4.0, 6.2, false);
  }

  // Sliding Entrance Doors at z = +FACTORY_HALF_D
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.72,
  });
  const leftSlidingDoor = new THREE.Mesh(new THREE.BoxGeometry(3.3, 4.6, 0.26), doorMat);
  leftSlidingDoor.position.set(-1.95, 2.3, FACTORY_HALF_D - 0.1);
  const rightSlidingDoor = new THREE.Mesh(new THREE.BoxGeometry(3.3, 4.6, 0.26), doorMat);
  rightSlidingDoor.position.set(1.95, 2.3, FACTORY_HALF_D - 0.1);
  worldGroup.add(leftSlidingDoor, rightSlidingDoor);

  const doorGlowLight = new THREE.PointLight(0x38bdf8, 5, 14, 1.4);
  doorGlowLight.position.set(0, 3.4, FACTORY_HALF_D + 1.5);
  worldGroup.add(doorGlowLight);

  // Main «МИВИНА КОРПОРЕЙШЕН» Banner mounted above the central North Partition arch
  const factorySignTex = makeSignTexture(
    'МИВИНА КОРПОРЕЙШЕН',
    'ЦЕХ №1 · ПРОИЗВОДСТВО ГРИБНОЙ ЛАПШИ',
    '#111827',
    '#fef08a',
    '#ef4444',
    anisotropy
  );
  disposables.push(factorySignTex);
  const mainSign = new THREE.Mesh(
    new THREE.PlaneGeometry(13.0, 3.0),
    new THREE.MeshBasicMaterial({ map: factorySignTex })
  );
  mainSign.position.set(0.2, 5.7, -7.12);
  worldGroup.add(mainSign);

  // Room Signs over West & East Storage Doorways («СКЛАД СТЕЛЛАЖЕЙ»)
  const rackSignTex = makeSignTexture(
    'СКЛАД СТЕЛЛАЖЕЙ',
    'КОРОБКИ ПРИПРАВ И ШКАФЫ',
    '#0f172a',
    '#bae6fd',
    '#f59e0b',
    anisotropy
  );
  disposables.push(rackSignTex);
  const westSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.1),
    new THREE.MeshBasicMaterial({ map: rackSignTex })
  );
  westSign.rotation.y = Math.PI / 2;
  westSign.position.set(-12.86, 5.1, 4.25);
  const eastSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.1),
    new THREE.MeshBasicMaterial({ map: rackSignTex })
  );
  eastSign.rotation.y = -Math.PI / 2;
  eastSign.position.set(13.86, 5.1, -3.0);
  worldGroup.add(westSign, eastSign);

  // Overhead Steel Beams & Hanging Factory Lamps (5 PointLights total for wide room coverage)
  const lampLights: THREE.PointLight[] = [];
  const lampBaseIntensities: number[] = [];
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.35 });
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde68a,
    emissiveIntensity: 2.0,
  });

  for (const bz of [-13.0, -1.5, 10.5]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(FACTORY_HALF_W * 2, 0.32, 0.36), beamMat);
    beam.position.set(0, 7.6, bz);
    worldGroup.add(beam);

    for (const bx of [-18.5, -6.5, 6.5, 18.5]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), beamMat);
      cord.position.set(bx, 6.7, bz);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.42, 12, 1, true), shadeMat);
      shade.position.set(bx, 5.8, bz);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bulbMat);
      bulb.position.set(bx, 5.65, bz);
      worldGroup.add(cord, shade, bulb);
    }
  }

  const lightPlacements: Array<{ x: number; z: number; color: number; intensity: number; dist: number }> = [
    { x: -1.5, z: -1.5, color: 0xffe4b5, intensity: 17, dist: isSoftwareGl ? 19 : 23 },
    { x: -18.5, z: 3.5, color: 0xbfdbfe, intensity: 11, dist: isSoftwareGl ? 17 : 21 },
    { x: 19.0, z: 3.5, color: 0xbfdbfe, intensity: 11, dist: isSoftwareGl ? 17 : 21 },
    { x: 0.0, z: -13.0, color: 0xbfdbfe, intensity: 12, dist: isSoftwareGl ? 19 : 23 },
    { x: 0.0, z: 11.5, color: 0xffe4b5, intensity: 11, dist: isSoftwareGl ? 18 : 22 },
  ];
  for (const lp of lightPlacements) {
    const pt = new THREE.PointLight(lp.color, lp.intensity, lp.dist, 1.4);
    pt.position.set(lp.x, 5.4, lp.z);
    worldGroup.add(pt);
    lampLights.push(pt);
    lampBaseIntensities.push(lp.intensity);
  }

  // Shared Red Factory Alarm Light (repositioned above whichever window RONER breaches!)
  const alarmLight = new THREE.PointLight(0xef4444, 0, 22, 1.3);
  alarmLight.position.set(7.2, 4.5, FACTORY_HALF_D - 1.5);
  worldGroup.add(alarmLight);

  // Conveyor + Extruder + Packer collision box
  const conveyor = createConveyorSystem(anisotropy, disposables);
  worldGroup.add(conveyor.group);
  obstacles.push({
    x: -0.4,
    z: CONVEYOR_Z,
    halfW: 12.6,
    halfD: 1.25,
  });

  // Storage Racks («Стеллажи») filling the 3 storage wings!
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.72, roughness: 0.38 });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
  const vatMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.82, roughness: 0.25 });

  const rackSpots: Array<{ x: number; z: number; rotY: number }> = [
    // West Storage Wing (Room 1)
    { x: -21.0, z: -3.2, rotY: Math.PI / 2 },
    { x: -21.0, z: 4.5, rotY: Math.PI / 2 },
    { x: -21.0, z: 12.2, rotY: Math.PI / 2 },
    { x: -16.8, z: 11.8, rotY: 0 },
    // North Rack Wing (Room 2 — keep x=9.5..14.2 clear for Locked Corridor Door #1 at x=12)
    { x: -20.2, z: -15.2, rotY: 0 },
    { x: -13.2, z: -15.2, rotY: 0 },
    { x: -6.0, z: -14.8, rotY: 0 },
    { x: 6.2, z: -14.8, rotY: 0 },
    { x: 16.6, z: -15.2, rotY: 0 },
    { x: 21.4, z: -15.2, rotY: 0 },
    // East Spice & Rack Room (Room 3)
    { x: 21.4, z: -2.8, rotY: Math.PI / 2 },
    { x: 21.4, z: 4.8, rotY: Math.PI / 2 },
    { x: 21.4, z: 12.2, rotY: Math.PI / 2 },
    { x: 17.6, z: 15.2, rotY: 0 },
  ];

  for (const spot of rackSpots) {
    buildStorageRack(spot.x, spot.z, spot.rotY, rackMat, crateMat, worldGroup, obstacles);
  }

  // Stainless steel noodle boiling vats in North Wing aisles
  for (const vx of [-9.5, 8.5]) {
    const vat = new THREE.Group();
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.8, 16), vatMat);
    tank.position.y = 1.4;
    tank.castShadow = true;
    const lid = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 16), rackMat);
    lid.position.y = 3.05;
    vat.add(tank, lid);
    vat.position.set(vx, 0, -11.4);
    worldGroup.add(vat);
    obstacles.push({ x: vx, z: -11.4, halfW: 1.35, halfD: 1.35 });
  }

  // Wooden cargo pallets in Central Hall
  for (const px of [-6.0, 5.8]) {
    const pallet = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 1.8), crateMat);
    base.position.y = 0.11;
    const stack1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 1.2), crateMat);
    stack1.position.set(-0.15, 0.7, 0);
    const stack2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.85), crateMat);
    stack2.position.set(0.35, 1.55, 0.1);
    pallet.add(base, stack1, stack2);
    pallet.position.set(px, 0, 8.2);
    worldGroup.add(pallet);
    obstacles.push({ x: px, z: 8.2, halfW: 1.25, halfD: 1.08 });
  }

  // 6 Interactive Hiding Lockers («Шкафы») placed across the Central Hall & Storage Rooms
  const lockerDefs: Array<{ x: number; z: number; yaw: number }> = [
    { x: -12.2, z: -4.2, yaw: Math.PI / 2 },  // 1. Central Hall West (near hopper)
    { x: 13.2, z: 4.0, yaw: -Math.PI / 2 },   // 2. Central Hall East (near packer)
    { x: -14.2, z: -3.2, yaw: -Math.PI / 2 }, // 3. West Rack Room
    { x: -14.2, z: -8.6, yaw: Math.PI },      // 4. North Rack Wing West
    { x: 14.5, z: -8.6, yaw: Math.PI },       // 5. North Rack Wing East
    { x: 15.2, z: 4.0, yaw: Math.PI / 2 },    // 6. East Rack Room
    // 8 Corridor Hiding Closets («Шкафы в длинном коридоре») spaced along the 186m corridor
    { x: CORRIDOR_X - CORRIDOR_HALF_W + 0.72, z: -38.0, yaw: Math.PI / 2 },
    { x: CORRIDOR_X + CORRIDOR_HALF_W - 0.72, z: -59.0, yaw: -Math.PI / 2 },
    { x: CORRIDOR_X - CORRIDOR_HALF_W + 0.72, z: -80.0, yaw: Math.PI / 2 },
    { x: CORRIDOR_X + CORRIDOR_HALF_W - 0.72, z: -101.0, yaw: -Math.PI / 2 },
    { x: CORRIDOR_X - CORRIDOR_HALF_W + 0.72, z: -122.0, yaw: Math.PI / 2 },
    { x: CORRIDOR_X + CORRIDOR_HALF_W - 0.72, z: -143.0, yaw: -Math.PI / 2 },
    { x: CORRIDOR_X - CORRIDOR_HALF_W + 0.72, z: -164.0, yaw: Math.PI / 2 },
    { x: CORRIDOR_X + CORRIDOR_HALF_W - 0.72, z: -185.0, yaw: -Math.PI / 2 },
  ];
  lockerDefs.forEach((ld, idx) => {
    lockers.push(createLockerProp(idx + 1, ld.x, ld.z, ld.yaw, worldGroup, obstacles));
  });

  // --- LOCKED DOOR #1, VESTIBULE, SECOND DOOR #2 & 72-METER LONG CORRIDOR ---
  const door1SignTex = makeSignTexture(
    'СЕКРЕТНЫЙ КОРИДОР',
    'ЗАМОК · КЛЮЧ ЗА 20 МИВИН',
    '#1f160a',
    '#fde047',
    '#f59e0b',
    anisotropy
  );
  const door2SignTex = makeSignTexture(
    'ИЩО ОДНА ДВЕРЬ?!',
    'ПРОХОД В ДЛИННЫЙ КОРИДОР',
    '#111827',
    '#e2e8f0',
    '#ef4444',
    anisotropy
  );
  disposables.push(door1SignTex, door2SignTex);

  const corridorDoor1 = createCorridorDoorAssembly(
    1,
    CORRIDOR_X,
    -FACTORY_HALF_D,
    true,
    door1SignTex,
    frameMat,
    worldGroup,
    obstacles
  );
  const corridorDoor2 = createCorridorDoorAssembly(
    2,
    CORRIDOR_X,
    CORRIDOR_VESTIBULE_Z,
    false,
    door2SignTex,
    frameMat,
    worldGroup,
    obstacles
  );

  // Vestibule + Corridor Floor & Ceiling (z = -18.5 .. -210.5, width 6m around x=12)
  const corridorFloorTex = makeFloorTexture(anisotropy);
  corridorFloorTex.repeat.set(2, 54);
  disposables.push(corridorFloorTex);
  const corridorFloorMat = new THREE.MeshStandardMaterial({
    map: corridorFloorTex,
    roughness: 0.82,
    metalness: 0.1,
  });
  const corridorLen = Math.abs(CORRIDOR_END_Z - -FACTORY_HALF_D) + 2;
  const corridorMidZ = (-FACTORY_HALF_D + CORRIDOR_END_Z) * 0.5;
  const corridorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(CORRIDOR_HALF_W * 2 + 0.8, corridorLen),
    corridorFloorMat
  );
  corridorFloor.rotation.x = -Math.PI / 2;
  corridorFloor.position.set(CORRIDOR_X, 0.01, corridorMidZ);
  corridorFloor.receiveShadow = true;

  const corridorCeiling = new THREE.Mesh(
    new THREE.PlaneGeometry(CORRIDOR_HALF_W * 2 + 0.8, corridorLen),
    roofMat
  );
  corridorCeiling.rotation.x = Math.PI / 2;
  corridorCeiling.position.set(CORRIDOR_X, 4.5, corridorMidZ);
  worldGroup.add(corridorFloor, corridorCeiling);

  // Corridor Left & Right Walls + Vestibule Door #2 flanking wall stubs
  addWallSegment(
    worldGroup,
    obstacles,
    CORRIDOR_X - CORRIDOR_HALF_W - 0.35,
    corridorMidZ,
    0.7,
    corridorLen,
    wallMat,
    4.6,
    2.3,
    false
  );
  addWallSegment(
    worldGroup,
    obstacles,
    CORRIDOR_X + CORRIDOR_HALF_W + 0.35,
    corridorMidZ,
    0.7,
    corridorLen,
    wallMat,
    4.6,
    2.3,
    false
  );
  // Vestibule wall around Door #2 (x = 9..10.3 and 13.7..15)
  addWallSegment(worldGroup, obstacles, CORRIDOR_X - 2.35, CORRIDOR_VESTIBULE_Z, 1.3, 0.5, partitionMat, 4.6, 2.3, true);
  addWallSegment(worldGroup, obstacles, CORRIDOR_X + 2.35, CORRIDOR_VESTIBULE_Z, 1.3, 0.5, partitionMat, 4.6, 2.3, true);
  addWallSegment(worldGroup, obstacles, CORRIDOR_X, CORRIDOR_VESTIBULE_Z, 3.6, 0.5, partitionMat, 0.7, 4.25, false);

  // Structural ribs & ceiling bulbs along the ~186m corridor (shares bulbMat for Sanya flicker!)
  for (let cz = -29; cz >= -205; cz -= 11) {
    const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.5, 0.32), frameMat);
    ribL.position.set(CORRIDOR_X - CORRIDOR_HALF_W + 0.08, 2.25, cz);
    const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.5, 0.32), frameMat);
    ribR.position.set(CORRIDOR_X + CORRIDOR_HALF_W - 0.08, 2.25, cz);
    const ribTop = new THREE.Mesh(new THREE.BoxGeometry(CORRIDOR_HALF_W * 2, 0.24, 0.32), frameMat);
    ribTop.position.set(CORRIDOR_X, 4.38, cz);
    const fix = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.26), shadeMat);
    fix.position.set(CORRIDOR_X, 4.22, cz);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.16), bulbMat);
    bulb.position.set(CORRIDOR_X, 4.15, cz);
    worldGroup.add(ribL, ribR, ribTop, fix, bulb);
  }

  // 4 Corridor PointLights integrated with lampLights so they flicker when blindfolded Sanya approaches
  for (const cz of [-48, -96, -144, -192]) {
    const cpt = new THREE.PointLight(0xbfdbfe, 12, 44, 1.25);
    cpt.position.set(CORRIDOR_X, 3.9, cz);
    worldGroup.add(cpt);
    lampLights.push(cpt);
    lampBaseIntensities.push(12);
  }

  // Corridor End Wall + "ВЫХОД ЛОЛ" Exit Door at z = -96.5
  addWallSegment(worldGroup, obstacles, CORRIDOR_X - 2.35, CORRIDOR_END_Z, 1.4, 0.8, wallMat, 4.6, 2.3, true);
  addWallSegment(worldGroup, obstacles, CORRIDOR_X + 2.35, CORRIDOR_END_Z, 1.4, 0.8, wallMat, 4.6, 2.3, true);
  addWallSegment(worldGroup, obstacles, CORRIDOR_X, CORRIDOR_END_Z, 3.5, 0.8, wallMat, 0.8, 4.25, false);

  const exitLolTex = makeSignTexture(
    'ВЫХОД ЛОЛ',
    'ПОБЕГ С ЗАВОДА · СНАЙПЕРСКАЯ ВИНТОВКА',
    '#052e16',
    '#86efac',
    '#22c55e',
    anisotropy
  );
  disposables.push(exitLolTex);

  const exitGroup = new THREE.Group();
  exitGroup.position.set(CORRIDOR_X, 0, CORRIDOR_END_Z);
  const exitHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.95),
    new THREE.MeshBasicMaterial({ map: exitLolTex })
  );
  exitHeader.position.set(0, 3.95, 0.45);
  exitGroup.add(exitHeader);

  const exitDoorMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    emissive: 0x052e16,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.5,
  });
  const exitLeftDoor = new THREE.Group();
  exitLeftDoor.position.set(-1.6, 0, 0);
  const exitLeftLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.4, 0.2), exitDoorMat);
  exitLeftLeaf.position.set(0.8, 1.7, 0);
  exitLeftDoor.add(exitLeftLeaf);

  const exitRightDoor = new THREE.Group();
  exitRightDoor.position.set(1.6, 0, 0);
  const exitRightLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.4, 0.2), exitDoorMat);
  exitRightLeaf.position.set(-0.8, 1.7, 0);
  exitRightDoor.add(exitRightLeaf);

  // Bright emerald glow outside the exit door
  const exitGlowWall = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshBasicMaterial({ color: 0x4ade80 })
  );
  exitGlowWall.position.set(0, 1.8, -1.6);
  const exitLight = new THREE.PointLight(0x4ade80, 12, 24, 1.3);
  exitLight.position.set(0, 3.2, 2.5);
  exitGroup.add(exitLeftDoor, exitRightDoor, exitGlowWall, exitLight);
  worldGroup.add(exitGroup);

  // Sniper Rifle Pickup Pedestal right in front of "ВЫХОД ЛОЛ"
  const sniperGroup = new THREE.Group();
  sniperGroup.position.copy(SNIPER_PICKUP_POS);
  const pedCrate = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.82, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.78, metalness: 0.12 })
  );
  pedCrate.position.y = 0.41;
  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.2, 28),
    new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.04;
  const rifleGroup = createSniperRifleProp();
  rifleGroup.position.set(0, 1.15, 0);
  rifleGroup.rotation.y = Math.PI / 4;
  sniperGroup.add(pedCrate, glowRing, rifleGroup);
  worldGroup.add(sniperGroup);
  obstacles.push({
    x: SNIPER_PICKUP_POS.x,
    z: SNIPER_PICKUP_POS.z,
    halfW: 0.72,
    halfD: 0.48,
  });

  scene.add(worldGroup);

  return {
    worldGroup,
    conveyor,
    obstacles,
    lockers,
    windows,
    corridorDoor1,
    corridorDoor2,
    exitLolDoor: { leftDoor: exitLeftDoor, rightDoor: exitRightDoor, light: exitLight },
    sniperPickup: { group: sniperGroup, rifleGroup, glowRing },
    leftSlidingDoor,
    rightSlidingDoor,
    doorGlowLight,
    lampLights,
    lampBaseIntensities,
    bulbMat,
    alarmLight,
    disposables,
  };
}
