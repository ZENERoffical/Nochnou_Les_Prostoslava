import * as THREE from 'three';

export interface ParkBoxCollider {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  isFence?: boolean;
}

export interface ParkCircleCollider {
  x: number;
  z: number;
  radius: number;
}

export interface Act3ParkObjects {
  worldGroup: THREE.Group;
  campfireFlames: THREE.Group;
  campfireLight: THREE.PointLight;
  campfireGlowRing: THREE.Mesh;
  crusherLeftRoller: THREE.Mesh;
  crusherRightRoller: THREE.Mesh;
  crusherGaugeMat: THREE.MeshStandardMaterial;
  level2FenceGroup: THREE.Group;
  level3DefenseGroup: THREE.Group;
  level4BedGroup: THREE.Group;
  level5BedUpgradeGroup: THREE.Group;
  level6BedUpgradeGroup: THREE.Group;
  bedStatusMat: THREE.MeshStandardMaterial;
  bedCollider: ParkBoxCollider;
  campLampLights: THREE.PointLight[];
  parkLampLights: THREE.PointLight[];
  explosionSphere: THREE.Mesh;
  explosionRing: THREE.Mesh;
  explosionLight: THREE.PointLight;
  fenceColliders: ParkBoxCollider[];
  staticBoxColliders: ParkBoxCollider[];
  treeColliders: ParkCircleCollider[];
  disposables: Array<{ dispose: () => void }>;
}

export const ACT3_CAMPFIRE_POS = { x: 0, z: 0 };
export const ACT3_CRUSHER_POS = { x: -4.6, z: -1.8 };
export const ACT3_MAP_POS = { x: 4.6, z: -2.0 };
export const ACT3_BED_POS = { x: 4.4, z: 2.6 };
export const ACT3_RIDDLE_POS = { x: 35.0, z: -35.0 };
export const ACT3_PARK_RADIUS = 41.5;

function makeParkGrassTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#132a19';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i++) {
    const x = (i * 89) % 512;
    const y = (i * 193) % 512;
    ctx.fillStyle =
      i % 3 === 0
        ? 'rgba(74, 222, 128, 0.06)'
        : i % 3 === 1
          ? 'rgba(0, 0, 0, 0.16)'
          : 'rgba(22, 101, 52, 0.15)';
    ctx.fillRect(x, y, 3, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makePlazaStoneTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 5;
  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    const offset = row % 2 === 0 ? 0 : 32;
    for (let col = -1; col < 9; col++) {
      const x = col * 64 + offset;
      ctx.fillStyle = (row + col) % 3 === 0 ? '#3b495e' : '#2e3a4d';
      ctx.fillRect(x + 2, y + 2, 60, 60);
      ctx.strokeRect(x, y, 64, 64);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeMapBoardTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 364);

  // Park walkways
  ctx.fillStyle = '#475569';
  ctx.fillRect(236, 40, 40, 304);
  ctx.fillRect(46, 172, 420, 40);

  // Central plaza circle
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(256, 192, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Campfire marker
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(256, 192, 16, 0, Math.PI * 2);
  ctx.fill();

  // Crusher marker
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(195, 162, 22, 22);

  // Log & Metal icons around park
  ctx.fillStyle = '#a16207';
  for (const [lx, ly] of [
    [110, 95],
    [390, 95],
    [100, 290],
    [400, 290],
  ]) {
    ctx.fillRect(lx - 10, ly - 6, 20, 12);
  }
  ctx.fillStyle = '#60a5fa';
  for (const [mx, my] of [
    [120, 145],
    [385, 150],
    [130, 240],
    [380, 245],
  ]) {
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('ПАРК «МАЛИНКА»', 256, 52);

  ctx.fillStyle = '#f43f5e';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('▲ ДЕРЕВНЯ «ДЖОДЖО»', 256, 86);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('КОСТЁР = БРЕВНА · ДРОБИЛКА = МЕТАЛЛ', 256, 352);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeSignTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  fgHex: string,
  borderHex: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, c.width - 20, c.height - 20);

  ctx.textAlign = 'center';
  ctx.fillStyle = fgHex;
  ctx.font = 'bold 74px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, c.width / 2, 122);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, c.width / 2, 198);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeWindowsTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 512);

  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 5; col++) {
      const hash = (row * 19 + col * 29) % 7;
      ctx.fillStyle =
        hash === 0
          ? '#fb7185'
          : hash === 1
            ? '#38bdf8'
            : hash <= 3
              ? '#fde047'
              : '#1e293b';
      ctx.fillRect(18 + col * 46, 20 + row * 40, 28, 22);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

export function createAct3LogMesh(): THREE.Group {
  const g = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xe7b97b,
    roughness: 0.72,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.27, 1.55, 8),
    barkMat
  );
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.27;

  const endCap1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8),
    coreMat
  );
  endCap1.rotation.z = Math.PI / 2;
  endCap1.position.set(0.78, 0.27, 0);

  const endCap2 = endCap1.clone();
  endCap2.position.x = -0.78;

  // Small side branch stub
  const stub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.34, 6),
    barkMat
  );
  stub.position.set(0.18, 0.44, 0.14);
  stub.rotation.set(0.5, 0, -0.45);

  g.add(body, endCap1, endCap2, stub);
  return g;
}

export function createAct3MetalMesh(): THREE.Group {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.82,
    roughness: 0.28,
    emissive: 0x1e293b,
    emissiveIntensity: 0.35,
  });
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.75,
    metalness: 0.65,
    roughness: 0.25,
  });

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.68), steelMat);
  plate.position.y = 0.12;

  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.22), steelMat);
  beam.position.set(0.05, 0.28, 0.08);
  beam.rotation.y = 0.4;

  const gear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.12, 8),
    boltMat
  );
  gear.position.set(-0.22, 0.26, -0.14);

  g.add(plate, beam, gear);
  return g;
}

export function buildAct3ParkScene(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): Act3ParkObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const campLampLights: THREE.PointLight[] = [];
  const parkLampLights: THREE.PointLight[] = [];
  const fenceColliders: ParkBoxCollider[] = [];
  const staticBoxColliders: ParkBoxCollider[] = [];
  const treeColliders: ParkCircleCollider[] = [];

  // Continuous extended terrain grass (no floating square box!)
  const grassTex = makeParkGrassTexture(anisotropy);
  disposables.push(grassTex);
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.94,
    metalness: 0.02,
  });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  worldGroup.add(grass);

  // Central paved circular plaza
  const stoneTex = makePlazaStoneTexture(anisotropy);
  disposables.push(stoneTex);
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.78,
    metalness: 0.08,
  });
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(10.6, 10.9, 0.1, 32),
    stoneMat
  );
  plaza.position.y = 0.05;
  plaza.receiveShadow = true;
  worldGroup.add(plaza);

  // Intersecting Park Walkways (North->JoJo, South->Factory, East/West park)
  const pathNS = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 130), stoneMat);
  pathNS.position.set(0, 0.03, -4);
  pathNS.receiveShadow = true;
  const pathEW = new THREE.Mesh(new THREE.BoxGeometry(88, 0.06, 4.6), stoneMat);
  pathEW.position.set(0, 0.03, 0);
  pathEW.receiveShadow = true;
  worldGroup.add(pathNS, pathEW);

  // =========================================================================
  // LEVEL 1 BASE: CAMPFIRE + METAL CRUSHER + PARK MAP BOARD
  // =========================================================================

  // 1) Campfire at (0, 0, 0)
  const campfireGroup = new THREE.Group();
  const stoneRingMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.28, 0),
      stoneRingMat
    );
    rock.position.set(Math.cos(a) * 1.1, 0.22, Math.sin(a) * 1.1);
    rock.rotation.set(a, a * 0.5, 0);
    campfireGroup.add(rock);
  }
  const charredWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 1.45, 7),
      charredWoodMat
    );
    log.position.set(0, 0.22, 0);
    log.rotation.z = Math.PI / 2 - 0.18;
    log.rotation.y = (i / 4) * Math.PI;
    campfireGroup.add(log);
  }

  const campfireFlames = new THREE.Group();
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.88,
  });
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.95,
  });
  const mainCone = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.75, 7), outerFlameMat);
  mainCone.position.y = 1.02;
  const coreCone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.2, 6), innerFlameMat);
  coreCone.position.y = 0.82;
  const sideFlame1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.95, 6), outerFlameMat);
  sideFlame1.position.set(0.3, 0.65, 0.18);
  sideFlame1.rotation.z = -0.22;
  const sideFlame2 = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.9, 6), outerFlameMat);
  sideFlame2.position.set(-0.28, 0.62, -0.2);
  sideFlame2.rotation.z = 0.24;
  campfireFlames.add(mainCone, coreCone, sideFlame1, sideFlame2);
  campfireGroup.add(campfireFlames);

  const campfireGlowRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.65, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.38,
    })
  );
  campfireGlowRing.rotation.x = -Math.PI / 2;
  campfireGlowRing.position.y = 0.12;
  campfireGroup.add(campfireGlowRing);

  const campfireLight = new THREE.PointLight(0xff8c32, 24, 24, 1.35);
  campfireLight.position.set(0, 1.9, 0);
  campfireGroup.add(campfireLight);
  worldGroup.add(campfireGroup);
  staticBoxColliders.push({ x: 0, z: 0, halfW: 0.95, halfD: 0.95 });

  // 2) Metal Crusher («Дробилка») at (-4.6, 0, -1.8)
  const crusherGroup = new THREE.Group();
  crusherGroup.position.set(ACT3_CRUSHER_POS.x, 0, ACT3_CRUSHER_POS.z);
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.72,
    roughness: 0.36,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.5,
  });
  const crusherGaugeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });

  const crusherBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.05, 1.85), ironMat);
  crusherBase.position.y = 0.525;
  const hopper = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.75, 1.55), hazardMat);
  hopper.position.y = 1.42;
  const hopperHole = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.25, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.9 })
  );
  hopperHole.position.y = 1.72;

  const rollerMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  });
  const crusherLeftRoller = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1.08, 8),
    rollerMat
  );
  crusherLeftRoller.rotation.x = Math.PI / 2;
  crusherLeftRoller.position.set(-0.34, 1.62, 0);

  const crusherRightRoller = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1.08, 8),
    rollerMat
  );
  crusherRightRoller.rotation.x = Math.PI / 2;
  crusherRightRoller.position.set(0.34, 1.62, 0);

  const gaugePanel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.12), crusherGaugeMat);
  gaugePanel.position.set(0, 0.65, 0.96);

  crusherGroup.add(
    crusherBase,
    hopper,
    hopperHole,
    crusherLeftRoller,
    crusherRightRoller,
    gaugePanel
  );
  worldGroup.add(crusherGroup);
  staticBoxColliders.push({
    x: ACT3_CRUSHER_POS.x,
    z: ACT3_CRUSHER_POS.z,
    halfW: 1.25,
    halfD: 1.0,
  });

  // 3) Park Map Board («Карта») at (4.6, 0, -2.0)
  const mapGroup = new THREE.Group();
  mapGroup.position.set(ACT3_MAP_POS.x, 0, ACT3_MAP_POS.z);
  mapGroup.rotation.y = -0.35;
  const woodPostMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  for (const px of [-0.95, 0.95]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.5, 0.18), woodPostMat);
    post.position.set(px, 1.25, 0);
    mapGroup.add(post);
  }
  const mapBoardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.72, 0.16), woodPostMat);
  mapBoardFrame.position.set(0, 1.75, 0);
  const mapTex = makeMapBoardTexture(anisotropy);
  disposables.push(mapTex);
  const mapFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.12, 1.52),
    new THREE.MeshBasicMaterial({ map: mapTex })
  );
  mapFace.position.set(0, 1.75, 0.09);
  const mapRoof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.18, 0.45), ironMat);
  mapRoof.position.set(0, 2.66, 0);
  mapGroup.add(mapBoardFrame, mapFace, mapRoof);
  worldGroup.add(mapGroup);
  staticBoxColliders.push({
    x: ACT3_MAP_POS.x,
    z: ACT3_MAP_POS.z,
    halfW: 1.2,
    halfD: 0.45,
  });

  // =========================================================================
  // LEVEL 2 BASE: SMALL PERIMETER FENCE (with 4 gated openings at N/S/E/W)
  // =========================================================================
  const level2FenceGroup = new THREE.Group();
  level2FenceGroup.visible = false;

  const fenceWoodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.82 });
  const fenceSteelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.65,
    roughness: 0.4,
  });

  const fenceSegDefs: Array<{ x: number; z: number; w: number; d: number }> = [
    // North segments (opening x in [-2.1, 2.1])
    { x: -5.1, z: -7.8, w: 5.8, d: 0.42 },
    { x: 5.1, z: -7.8, w: 5.8, d: 0.42 },
    // South segments
    { x: -5.1, z: 7.8, w: 5.8, d: 0.42 },
    { x: 5.1, z: 7.8, w: 5.8, d: 0.42 },
    // West segments (opening z in [-2.1, 2.1])
    { x: -7.8, z: -5.1, w: 0.42, d: 5.8 },
    { x: -7.8, z: 5.1, w: 0.42, d: 5.8 },
    // East segments
    { x: 7.8, z: -5.1, w: 0.42, d: 5.8 },
    { x: 7.8, z: 5.1, w: 0.42, d: 5.8 },
  ];

  for (const fs of fenceSegDefs) {
    const segGroup = new THREE.Group();
    segGroup.position.set(fs.x, 0, fs.z);

    // Horizontal rails + base plank
    const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(fs.w, 0.5, fs.d), fenceWoodMat);
    lowerRail.position.y = 0.45;
    const upperRail = new THREE.Mesh(
      new THREE.BoxGeometry(fs.w, 0.35, fs.d * 0.85),
      fenceWoodMat
    );
    upperRail.position.y = 1.25;

    // Vertical posts along segment
    const isHoriz = fs.w > fs.d;
    const span = isHoriz ? fs.w : fs.d;
    const postCount = 4;
    for (let i = 0; i < postCount; i++) {
      const offset = -span / 2 + 0.25 + ((span - 0.5) * i) / (postCount - 1);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.65, 0.28), fenceSteelMat);
      post.position.set(isHoriz ? offset : 0, 0.825, isHoriz ? 0 : offset);
      segGroup.add(post);
    }

    segGroup.add(lowerRail, upperRail);
    level2FenceGroup.add(segGroup);
    fenceColliders.push({
      x: fs.x,
      z: fs.z,
      halfW: fs.w / 2,
      halfD: fs.d / 2,
      isFence: true,
    });
  }
  worldGroup.add(level2FenceGroup);

  // =========================================================================
  // LEVEL 3 BASE: BARBED WIRE + 4 CAMP FLOODLIGHT LAMPS
  // =========================================================================
  const level3DefenseGroup = new THREE.Group();
  level3DefenseGroup.visible = false;

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.88,
    roughness: 0.24,
  });
  const wireRingGeo = new THREE.TorusGeometry(0.32, 0.035, 6, 12);

  for (const fs of fenceSegDefs) {
    const isHoriz = fs.w > fs.d;
    const span = isHoriz ? fs.w : fs.d;
    const coils = 8;
    for (let i = 0; i < coils; i++) {
      const offset = -span / 2 + 0.3 + ((span - 0.6) * i) / (coils - 1);
      const ring = new THREE.Mesh(wireRingGeo, wireMat);
      ring.position.set(
        fs.x + (isHoriz ? offset : 0),
        1.78,
        fs.z + (isHoriz ? 0 : offset)
      );
      ring.rotation.y = isHoriz ? 0.3 : Math.PI / 2 + 0.3;
      ring.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.28;
      level3DefenseGroup.add(ring);
    }
  }

  // 4 Floodlight Lamps at camp corners
  const floodPoleMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.78,
    roughness: 0.32,
  });
  const floodBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  for (const [lx, lz] of [
    [-6.6, -6.6],
    [6.6, -6.6],
    [-6.6, 6.6],
    [6.6, 6.6],
  ]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.8, 8), floodPoleMat);
    pole.position.set(lx, 2.4, lz);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 0.45), floodBulbMat);
    head.position.set(lx, 4.85, lz);
    head.lookAt(0, 0, 0);
    const pt = new THREE.PointLight(0xfef08a, 14, 22, 1.3);
    pt.position.set(lx * 0.9, 4.4, lz * 0.9);
    level3DefenseGroup.add(pole, head, pt);
    campLampLights.push(pt);
  }
  worldGroup.add(level3DefenseGroup);

  // =========================================================================
  // LEVEL 4 BASE: CAMP BED («Кровать» — skip 1 night, 1-night cooldown)
  // =========================================================================
  const level4BedGroup = new THREE.Group();
  level4BedGroup.position.set(ACT3_BED_POS.x, 0, ACT3_BED_POS.z);
  level4BedGroup.rotation.y = -0.4;
  level4BedGroup.visible = false;

  const bedWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.88 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.86 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.9 });
  const bedStatusMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });

  // Bed posts & frame
  for (const [px, pz, h] of [
    [-0.78, -1.22, 1.05],
    [0.78, -1.22, 1.05],
    [-0.78, 1.22, 0.72],
    [0.78, 1.22, 0.72],
  ] as Array<[number, number, number]>) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), bedWoodMat);
    leg.position.set(px, h / 2, pz);
    level4BedGroup.add(leg);
  }
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.65, 0.14), bedWoodMat);
  headboard.position.set(0, 0.74, -1.22);
  const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.36, 0.14), bedWoodMat);
  footboard.position.set(0, 0.52, 1.22);
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.18, 2.48), bedWoodMat);
  bedBase.position.set(0, 0.38, 0);

  // Mattress, Blanket & Pillow
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.24, 2.3), mattressMat);
  mattress.position.set(0, 0.59, 0);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.27, 1.56), blanketMat);
  blanket.position.set(0, 0.61, 0.34);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.16, 0.52), pillowMat);
  pillow.position.set(0, 0.77, -0.78);
  pillow.rotation.x = 0.14;

  // Bedside lamp post with ready/recharging status crystal
  const lampStand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), bedWoodMat);
  lampStand.position.set(-1.12, 0.275, -0.85);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.19, 0.28, 8),
    bedStatusMat
  );
  lampShade.position.set(-1.12, 0.72, -0.85);

  level4BedGroup.add(
    headboard,
    footboard,
    bedBase,
    mattress,
    blanket,
    pillow,
    lampStand,
    lampShade
  );

  // LEVEL 5 UPGRADE: Reinforced Canopy Frame, Warm Quilt & Extra Pillow (skip 2 days)
  const level5BedUpgradeGroup = new THREE.Group();
  level5BedUpgradeGroup.visible = false;
  const lv5IronMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.78,
    roughness: 0.28,
  });
  const lv5CanopyMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.9,
  });
  const lv5QuiltMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    roughness: 0.92,
  });
  for (const [px, pz] of [
    [-0.78, -1.22],
    [0.78, -1.22],
    [-0.78, 1.22],
    [0.78, 1.22],
  ] as Array<[number, number]>) {
    const extPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.45, 8), lv5IronMat);
    extPost.position.set(px, 1.45, pz);
    level5BedUpgradeGroup.add(extPost);
  }
  const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.12, 2.66), lv5CanopyMat);
  canopyRoof.position.set(0, 2.2, 0);
  const lv5Quilt = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 1.48), lv5QuiltMat);
  lv5Quilt.position.set(0, 0.77, 0.36);
  const lv5ExtraPillow = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.14, 0.44), pillowMat);
  lv5ExtraPillow.position.set(0, 0.89, -0.82);
  lv5ExtraPillow.rotation.x = 0.22;
  level5BedUpgradeGroup.add(canopyRoof, lv5Quilt, lv5ExtraPillow);
  level4BedGroup.add(level5BedUpgradeGroup);

  // LEVEL 6 UPGRADE: Royal Gold Finials, Velvet Trim & Warm Hanging Lantern (skip 3 days)
  const level6BedUpgradeGroup = new THREE.Group();
  level6BedUpgradeGroup.visible = false;
  const lv6GoldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.2,
  });
  const lv6RoyalMat = new THREE.MeshStandardMaterial({
    color: 0x6d28d9,
    roughness: 0.82,
  });
  const lv6LanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (const [px, pz] of [
    [-0.78, -1.22],
    [0.78, -1.22],
    [-0.78, 1.22],
    [0.78, 1.22],
  ] as Array<[number, number]>) {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), lv6GoldMat);
    finial.position.set(px, 2.34, pz);
    level6BedUpgradeGroup.add(finial);
  }
  const goldTrimFront = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.12, 0.08), lv6GoldMat);
  goldTrimFront.position.set(0, 2.22, 1.33);
  const goldTrimBack = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.12, 0.08), lv6GoldMat);
  goldTrimBack.position.set(0, 2.22, -1.33);
  const royalOverlay = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 1.26), lv6RoyalMat);
  royalOverlay.position.set(0, 0.82, 0.42);
  const canopyLantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lv6LanternMat);
  canopyLantern.position.set(0, 2.02, 0.15);
  const bedWarmLight = new THREE.PointLight(0xfde68a, 4.5, 9, 1.5);
  bedWarmLight.position.set(0, 1.9, 0.15);
  level6BedUpgradeGroup.add(
    goldTrimFront,
    goldTrimBack,
    royalOverlay,
    canopyLantern,
    bedWarmLight
  );
  level4BedGroup.add(level6BedUpgradeGroup);

  worldGroup.add(level4BedGroup);

  const bedCollider: ParkBoxCollider = {
    x: ACT3_BED_POS.x,
    z: ACT3_BED_POS.z,
    halfW: 1.05,
    halfD: 1.35,
  };

  // =========================================================================
  // PARK PROPS: BENCHES, STREETLAMPS, TREES, RAILINGS, CITY SKYLINE
  // =========================================================================
  const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 });
  const benchLegMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
  const benchSpots: Array<{ x: number; z: number; rotY: number }> = [
    { x: -4.2, z: -15.5, rotY: Math.PI / 2 },
    { x: 4.2, z: -24.0, rotY: -Math.PI / 2 },
    { x: -16.5, z: 3.6, rotY: 0 },
    { x: 18.0, z: -3.6, rotY: Math.PI },
    { x: 4.2, z: 16.5, rotY: -Math.PI / 2 },
  ];
  for (const bs of benchSpots) {
    const bench = new THREE.Group();
    bench.position.set(bs.x, 0, bs.z);
    bench.rotation.y = bs.rotY;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.72), benchWoodMat);
    seat.position.y = 0.55;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.1), benchWoodMat);
    back.position.set(0, 0.9, -0.32);
    for (const lx of [-0.9, 0.9]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.65), benchLegMat);
      leg.position.set(lx, 0.275, 0);
      bench.add(leg);
    }
    bench.add(seat, back);
    worldGroup.add(bench);
    staticBoxColliders.push({ x: bs.x, z: bs.z, halfW: 0.9, halfD: 0.9 });
  }

  // Park wrought-iron lanterns
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
  const lanternCoords: Array<[number, number]> = [
    [-3.6, -12.0],
    [3.6, -28.0],
    [-3.6, 14.0],
    [-16.0, -3.4],
    [16.0, 3.4],
  ];
  for (const [lx, lz] of lanternCoords) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 4.4, 8), benchLegMat);
    post.position.set(lx, 2.2, lz);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), lampBulbMat);
    globe.position.set(lx, 4.55, lz);
    const pt = new THREE.PointLight(0xfde68a, 8, 18, 1.4);
    pt.position.set(lx, 4.35, lz);
    worldGroup.add(post, globe, pt);
    parkLampLights.push(pt);
  }

  // Park trees arranged outside central camp & clear of walkways
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.92 });
  const crownMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
  const crownMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
  const treeCount = isSoftwareGl ? 24 : 36;
  for (let i = 0; i < treeCount; i++) {
    const ang = i * 2.39996;
    const rad = 14.5 + ((i * 19) % 24);
    const tx = Math.cos(ang) * rad;
    const tz = Math.sin(ang) * rad;
    // Keep walkways and corner riddle sign clean
    if (Math.abs(tx) < 4.5 || Math.abs(tz) < 4.5) continue;
    if (Math.hypot(tx - ACT3_RIDDLE_POS.x, tz - ACT3_RIDDLE_POS.z) < 4.5) continue;

    const tree = new THREE.Group();
    tree.position.set(tx, 0, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 3.2, 7), trunkMat);
    trunk.position.y = 1.6;
    const crown = new THREE.Mesh(
      i % 2 === 0 ? new THREE.DodecahedronGeometry(2.1, 0) : new THREE.ConeGeometry(2.0, 4.4, 7),
      i % 2 === 0 ? crownMat1 : crownMat2
    );
    crown.position.y = i % 2 === 0 ? 4.3 : 4.7;
    tree.add(trunk, crown);
    worldGroup.add(tree);
    treeColliders.push({ x: tx, z: tz, radius: 0.65 });
  }

  // Park wrought-iron perimeter fence at r = 42.5 (leave N/S road gates open visually)
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.5 });
  const perimWalls: Array<{ x: number; z: number; w: number; d: number }> = [
    { x: -23.5, z: -42.5, w: 39, d: 0.5 },
    { x: 23.5, z: -42.5, w: 39, d: 0.5 },
    { x: -23.5, z: 42.5, w: 39, d: 0.5 },
    { x: 23.5, z: 42.5, w: 39, d: 0.5 },
    { x: -42.5, z: 0, w: 0.5, d: 85 },
    { x: 42.5, z: 0, w: 0.5, d: 85 },
  ];
  for (const pw of perimWalls) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(pw.w, 1.35, pw.d), railMat);
    bar.position.set(pw.x, 0.675, pw.z);
    worldGroup.add(bar);
  }

  // Distant Malinka City Skyline apartment towers surrounding the park
  const winTex = makeWindowsTexture(anisotropy);
  disposables.push(winTex);
  const towerMat = new THREE.MeshStandardMaterial({
    map: winTex,
    emissiveMap: winTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.65,
    roughness: 0.75,
  });
  const towers: Array<{ x: number; z: number; w: number; h: number; d: number }> = [
    { x: -58, z: -56, w: 14, h: 36, d: 14 },
    { x: -62, z: -12, w: 13, h: 42, d: 13 },
    { x: -56, z: 38, w: 15, h: 30, d: 15 },
    { x: 58, z: -52, w: 14, h: 40, d: 14 },
    { x: 62, z: 10, w: 13, h: 46, d: 13 },
    { x: 56, z: 42, w: 14, h: 34, d: 14 },
    { x: -26, z: -68, w: 12, h: 38, d: 12 },
    { x: 26, z: -68, w: 12, h: 44, d: 12 },
  ];
  for (const tw of towers) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(tw.w, tw.h, tw.d), towerMat);
    mesh.position.set(tw.x, tw.h / 2, tw.z);
    worldGroup.add(mesh);
  }

  // South Background: Factory exit silhouette at z = +54 (intro cutscene origin)
  const factoryExitTex = makeSignTexture(
    'МИВИНА КОРПОРЕЙШЕН',
    'ВЫХОД С ЗАВОДА → ПАРК «МАЛИНКА»',
    '#111827',
    '#4ade80',
    '#22c55e',
    anisotropy
  );
  disposables.push(factoryExitTex);
  const factoryWall = new THREE.Mesh(
    new THREE.BoxGeometry(16, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  factoryWall.position.set(0, 4, 56);
  const factorySign = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 2.6),
    new THREE.MeshBasicMaterial({ map: factoryExitTex })
  );
  factorySign.position.set(0, 6.2, 52.9);
  factorySign.rotation.y = Math.PI;
  worldGroup.add(factoryWall, factorySign);

  // North Exit Gate: Деревня «ДжоДжо» at z = -50 + Chained Iron Barrier at z = -42.5!
  const chainGateGroup = new THREE.Group();
  chainGateGroup.position.set(0, 0, -42.5);
  const gatePillarMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.45,
    roughness: 0.65,
  });
  const gateIronMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.78,
    roughness: 0.35,
  });
  const chainMetalMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.92,
    roughness: 0.24,
  });
  const padlockBrassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.22,
    emissive: 0x78350f,
    emissiveIntensity: 0.25,
  });

  // Heavy gate stone/iron pillars flanking the 8m north opening
  for (const px of [-4.15, 4.15]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.1, 0.65), gatePillarMat);
    post.position.set(px, 1.55, 0);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.25, 0.82), gateIronMat);
    cap.position.set(px, 3.18, 0);
    chainGateGroup.add(post, cap);
  }

  // Left & Right wrought-iron gate leaves
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.set(side * 1.95, 0, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.14, 0.14), gateIronMat);
    topBar.position.y = 2.45;
    const midBar = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.14, 0.14), gateIronMat);
    midBar.position.y = 1.35;
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.16, 0.16), gateIronMat);
    botBar.position.y = 0.28;
    leaf.add(topBar, midBar, botBar);

    for (let b = 0; b < 8; b++) {
      const bx = -1.75 + (b * 3.5) / 7;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.55, 6), gateIronMat);
      rod.position.set(bx, 1.38, 0);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.28, 4), gateIronMat);
      spike.position.set(bx, 2.75, 0);
      leaf.add(rod, spike);
    }
    chainGateGroup.add(leaf);
  }

  // 3D Interlocking Steel Chains criss-crossed tightly across the closed gate
  const linkGeo = new THREE.TorusGeometry(0.14, 0.036, 6, 12);
  const drawChainSpan = (
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    links: number
  ) => {
    const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
    const angleZ = Math.atan2(dir.y, dir.x);
    for (let i = 0; i <= links; i++) {
      const t = i / links;
      const link = new THREE.Mesh(linkGeo, chainMetalMat);
      link.position.set(
        THREE.MathUtils.lerp(x1, x2, t),
        THREE.MathUtils.lerp(y1, y2, t) - Math.sin(t * Math.PI) * 0.16,
        THREE.MathUtils.lerp(z1, z2, t)
      );
      link.rotation.z = angleZ;
      link.rotation.x = i % 2 === 0 ? 0.15 : Math.PI / 2 - 0.15;
      chainGateGroup.add(link);
    }
  };
  drawChainSpan(-3.7, 2.2, 0.18, 3.7, 0.85, 0.18, 28);
  drawChainSpan(-3.7, 0.85, 0.2, 3.7, 2.2, 0.2, 28);
  drawChainSpan(-2.1, 1.48, 0.24, 2.1, 1.48, 0.24, 18);

  // Heavy Brass Padlock in the center of the crossed chains
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.54, 0.22), padlockBrassMat);
  lockBody.position.set(0, 1.24, 0.3);
  const lockShackle = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.045, 8, 14, Math.PI),
    chainMetalMat
  );
  lockShackle.position.set(0, 1.52, 0.3);
  const lockKeyhole = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.18, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x090d14 })
  );
  lockKeyhole.position.set(0, 1.22, 0.42);
  chainGateGroup.add(lockBody, lockShackle, lockKeyhole);

  // Chained warning plaque on the gate
  const chainSignTex = makeSignTexture(
    'ПРОХОД ЗАКРЫТ',
    'ЦЕПЬ · ДЕРЕВНЯ «ДЖОДЖО» ЗАБЛОКИРОВАНА',
    '#450a0a',
    '#fca5a5',
    '#ef4444',
    anisotropy
  );
  disposables.push(chainSignTex);
  const chainSignMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.82, 0.08),
    new THREE.MeshBasicMaterial({ map: chainSignTex })
  );
  chainSignMesh.position.set(0, 2.12, 0.24);
  chainGateGroup.add(chainSignMesh);

  worldGroup.add(chainGateGroup);
  staticBoxColliders.push({ x: 0, z: -42.5, halfW: 4.2, halfD: 0.65 });

  const jojoGateGroup = new THREE.Group();
  jojoGateGroup.position.set(0, 0, -50);
  const jojoPostMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.85 });
  for (const px of [-4.4, 4.4]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 6.2, 0.65), jojoPostMat);
    pillar.position.set(px, 3.1, 0);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lampBulbMat);
    lantern.position.set(px, 6.5, 0);
    jojoGateGroup.add(pillar, lantern);
  }
  const jojoSignTex = makeSignTexture(
    'ДЕРЕВНЯ «ДЖОДЖО»',
    'СЛЕДУЮЩАЯ ОСТАНОВКА · ВПЕРЁД!',
    '#2e1065',
    '#facc15',
    '#c084fc',
    anisotropy
  );
  disposables.push(jojoSignTex);
  const jojoSignBoard = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 2.35, 0.35),
    new THREE.MeshBasicMaterial({ map: jojoSignTex })
  );
  jojoSignBoard.position.set(0, 5.2, 0);
  const jojoLight = new THREE.PointLight(0xe879f9, 18, 28, 1.3);
  jojoLight.position.set(0, 5.4, 2.5);
  jojoGateGroup.add(jojoSignBoard, jojoLight);
  worldGroup.add(jojoGateGroup);

  // Explosion Fireball & Shockwave Ring (hidden until Night 30 outro)
  const explosionSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 14),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9,
    })
  );
  explosionSphere.visible = false;
  explosionSphere.position.set(0, 1.5, -7.5);

  const explosionRing = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.5, 28),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    })
  );
  explosionRing.rotation.x = -Math.PI / 2;
  explosionRing.visible = false;
  explosionRing.position.set(0, 0.35, -7.5);

  const explosionLight = new THREE.PointLight(0xffedd5, 0, 55, 1.1);
  explosionLight.position.set(0, 4.5, -7.5);
  worldGroup.add(explosionSphere, explosionRing, explosionLight);

  // Corner Riddle Signboard: P+P=? (Jacque Fresco Riddle)
  const riddleGroup = new THREE.Group();
  riddleGroup.position.set(ACT3_RIDDLE_POS.x, 0, ACT3_RIDDLE_POS.z);
  riddleGroup.rotation.y = -Math.PI * 0.75;
  const riddlePostMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.86 });
  for (const px of [-1.05, 1.05]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 2.7, 8), riddlePostMat);
    post.position.set(px, 1.35, 0);
    riddleGroup.add(post);
  }
  const riddleTex = makeSignTexture(
    'P + P = ?',
    'ЗАГАДКА ЖАКА ФРЕСКО · [E]',
    '#1f1608',
    '#fde047',
    '#f59e0b',
    anisotropy
  );
  disposables.push(riddleTex);
  const riddleBack = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.35, 0.14), riddlePostMat);
  riddleBack.position.set(0, 2.05, -0.04);
  const riddleFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 1.18),
    new THREE.MeshBasicMaterial({ map: riddleTex })
  );
  riddleFace.position.set(0, 2.05, 0.04);
  const riddleRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.4, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    })
  );
  riddleRing.rotation.x = -Math.PI / 2;
  riddleRing.position.y = 0.04;
  const riddleLight = new THREE.PointLight(0xfacc15, 6.5, 12, 1.5);
  riddleLight.position.set(0, 2.75, 0.65);
  riddleGroup.add(riddleBack, riddleFace, riddleRing, riddleLight);
  worldGroup.add(riddleGroup);
  staticBoxColliders.push({ x: ACT3_RIDDLE_POS.x, z: ACT3_RIDDLE_POS.z, halfW: 0.9, halfD: 0.9 });

  scene.add(worldGroup);

  return {
    worldGroup,
    campfireFlames,
    campfireLight,
    campfireGlowRing,
    crusherLeftRoller,
    crusherRightRoller,
    crusherGaugeMat,
    level2FenceGroup,
    level3DefenseGroup,
    level4BedGroup,
    level5BedUpgradeGroup,
    level6BedUpgradeGroup,
    bedStatusMat,
    bedCollider,
    campLampLights,
    parkLampLights,
    explosionSphere,
    explosionRing,
    explosionLight,
    fenceColliders,
    staticBoxColliders,
    treeColliders,
    disposables,
  };
}
