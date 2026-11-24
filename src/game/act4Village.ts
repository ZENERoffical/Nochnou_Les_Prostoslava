import * as THREE from 'three';

export type Act4WeaponId =
  | 'pistol'
  | 'uzi'
  | 'ak47'
  | 'sniper'
  | 'rpg'
  | 'flamethrower';

export interface VillageBoxCollider {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
}

export interface VillageCircleCollider {
  x: number;
  z: number;
  radius: number;
}

export interface Act4TurretRig {
  group: THREE.Group;
  headPivot: THREE.Group;
  muzzleFlash: THREE.Mesh;
  tracer: THREE.Mesh;
  cooldown: number;
  flashTimer: number;
  tracerTimer: number;
}

export interface Act4WeaponViewModels {
  group: THREE.Group;
  models: Record<Act4WeaponId, THREE.Group>;
  muzzleFlash: THREE.Mesh;
  flameJet: THREE.Mesh;
}

export interface Act4VillageObjects {
  worldGroup: THREE.Group;
  giornoGroup: THREE.Group;
  giornoMat: THREE.MeshBasicMaterial;
  sashaShopGlow: THREE.Mesh;
  ronerShopGlow: THREE.Mesh;
  turrets: Act4TurretRig[];
  tableGroup: THREE.Group;
  explosionSphere: THREE.Mesh;
  explosionLight: THREE.PointLight;
  rocketMesh: THREE.Group;
  boxColliders: VillageBoxCollider[];
  treeColliders: VillageCircleCollider[];
  disposables: Array<{ dispose: () => void }>;
}

export const ACT4_ARENA_HALF_W = 36;
export const ACT4_START_Z = 30;
export const ACT4_HOUSE_POS = { x: 0, z: -18 };
export const ACT4_SASHA_POS = { x: -4.4, z: -12.6 };
export const ACT4_RONER_POS = { x: 4.4, z: -12.6 };
export const ACT4_TABLE_POS = { x: 0, z: -7.5 };

function makeCobbleRoadTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#3b332b';
  ctx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 16; row++) {
    const y = row * 32;
    const off = (row % 2) * 18;
    for (let col = -1; col < 14; col++) {
      const x = col * 40 + off;
      const tone = (row * 7 + col * 11) % 3;
      ctx.fillStyle = tone === 0 ? '#57534e' : tone === 1 ? '#44403c' : '#655e56';
      ctx.fillRect(x + 2, y + 2, 35, 27);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 14);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeVillageGrassTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#1b3620';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i++) {
    const x = (i * 83) % 512;
    const y = (i * 179) % 512;
    ctx.fillStyle =
      i % 3 === 0
        ? 'rgba(134, 239, 172, 0.08)'
        : i % 3 === 1
          ? 'rgba(0, 0, 0, 0.16)'
          : 'rgba(21, 128, 61, 0.16)';
    ctx.fillRect(x, y, 3, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeVillageSignTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 192;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#2e1065';
  ctx.fillRect(0, 0, 768, 192);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 752, 176);

  ctx.fillStyle = '#fde047';
  ctx.font = '900 58px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ДЕРЕВНЯ «ДЖОДЖО»', 384, 78);

  ctx.fillStyle = '#f9a8d4';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('JOJO VILLAGE · ОСТОРОЖНО: КЛОНЫ RONER', 384, 140);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeShopSignTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  accentHex: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 148);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accentHex;
  ctx.font = '900 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 256, 56);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, 256, 114);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

/**
 * Keys out near-white border background from the uploaded Giorno Giovanna PNG
 * via edge flood-fill so he stands crisply in the 3D village without a white box.
 */
function loadCutoutGiornoTexture(
  onReady: (tex: THREE.CanvasTexture) => void
): void {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const w = img.naturalWidth || 384;
    const h = img.naturalHeight || 640;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const visited = new Uint8Array(w * h);
    const stack: number[] = [];

    const isNearWhite = (idx: number) => {
      const p = idx * 4;
      return data[p] > 236 && data[p + 1] > 236 && data[p + 2] > 236;
    };

    for (let x = 0; x < w; x++) {
      stack.push(x, (h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      stack.push(y * w, y * w + (w - 1));
    }

    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited[idx]) continue;
      visited[idx] = 1;
      if (!isNearWhite(idx)) continue;
      data[idx * 4 + 3] = 0;
      const x = idx % w;
      const y = (idx - x) / w;
      if (x > 0) stack.push(idx - 1);
      if (x < w - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - w);
      if (y < h - 1) stack.push(idx + w);
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    onReady(tex);
  };
  img.src = '/assets/aistudio/image_7af21e97.png';
}

function createCottage(
  width: number,
  depth: number,
  wallColor: number,
  roofColor: number
): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.85,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.8,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    roughness: 0.7,
  });
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
    roughness: 0.25,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, 3.6, depth), wallMat);
  body.position.y = 1.8;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.78, 2.5, 4),
    roofMat
  );
  roof.position.y = 4.85;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.16), woodMat);
  door.position.set(0, 1.1, depth * 0.5 + 0.05);
  g.add(door);

  for (const sx of [-width * 0.28, width * 0.28]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.14), winMat);
    win.position.set(sx, 2.0, depth * 0.5 + 0.05);
    g.add(win);
  }

  return g;
}

function createAutoTurret(): Act4TurretRig {
  const group = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.65,
    roughness: 0.35,
  });
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.85,
    roughness: 0.22,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.1,
    roughness: 0.2,
  });

  const tripod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.72, 1.1, 8),
    baseMat
  );
  tripod.position.y = 0.55;
  tripod.castShadow = true;
  group.add(tripod);

  const headPivot = new THREE.Group();
  headPivot.position.y = 1.28;
  group.add(headPivot);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 0.85), baseMat);
  headPivot.add(housing);

  const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), accentMat);
  sensor.position.set(0, 0.3, 0.22);
  headPivot.add(sensor);

  for (const bx of [-0.18, 0.18]) {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8),
      barrelMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(bx, 0, 0.72);
    headPivot.add(barrel);
  }

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.95,
  });
  const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), flashMat);
  muzzleFlash.position.set(0, 0, 1.32);
  muzzleFlash.visible = false;
  headPivot.add(muzzleFlash);

  const tracerMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });
  const tracer = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1), tracerMat);
  tracer.visible = false;

  return {
    group,
    headPivot,
    muzzleFlash,
    tracer,
    cooldown: 0,
    flashTimer: 0,
    tracerTimer: 0,
  };
}

function createMivinaBowlMesh(): THREE.Group {
  const g = new THREE.Group();
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xfef2f2,
    roughness: 0.35,
  });
  const noodleMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.55,
  });
  const brothMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.25,
  });
  const chopMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.75,
  });

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.14, 0.18, 12),
    bowlMat
  );
  bowl.position.y = 0.09;
  g.add(bowl);

  const broth = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 12), brothMat);
  broth.position.y = 0.16;
  g.add(broth);

  const noodles = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), noodleMat);
  noodles.scale.set(1.1, 0.45, 1.1);
  noodles.position.y = 0.18;
  g.add(noodles);

  for (const side of [-1, 1]) {
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.38), chopMat);
    stick.position.set(0.06 + side * 0.03, 0.22, 0.04);
    stick.rotation.y = side * 0.12;
    stick.rotation.x = -0.25;
    g.add(stick);
  }
  return g;
}

function createTeacupMesh(): THREE.Group {
  const g = new THREE.Group();
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.3,
  });
  const teaMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.2,
  });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.14, 10), cupMat);
  cup.position.y = 0.07;
  const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 10), teaMat);
  tea.position.y = 0.13;
  g.add(cup, tea);
  return g;
}

export function buildAct4VillageScene(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): Act4VillageObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const boxColliders: VillageBoxCollider[] = [];
  const treeColliders: VillageCircleCollider[] = [];

  // Ground
  const grassTex = makeVillageGrassTexture(anisotropy);
  disposables.push(grassTex);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.92,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = !isSoftwareGl;
  worldGroup.add(ground);

  // Cobblestone village lane
  const roadTex = makeCobbleRoadTexture(anisotropy);
  disposables.push(roadTex);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.85,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 76), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 4);
  road.receiveShadow = !isSoftwareGl;
  worldGroup.add(road);

  // Central Defense Courtyard Cobble Pad in front of the house
  const yardPad = new THREE.Mesh(new THREE.CircleGeometry(12.5, 28), roadMat);
  yardPad.rotation.x = -Math.PI / 2;
  yardPad.position.set(0, 0.025, -10);
  worldGroup.add(yardPad);

  // Welcome Arch at Village Entrance (z = 22)
  const archWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  for (const sx of [-4.6, 4.6]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.75, 5.4, 0.75), archWoodMat);
    post.position.set(sx, 2.7, 22);
    post.castShadow = !isSoftwareGl;
    worldGroup.add(post);
    boxColliders.push({ x: sx, z: 22, halfW: 0.45, halfD: 0.45 });
  }
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.65, 0.8), archWoodMat);
  archBeam.position.set(0, 5.2, 22);
  worldGroup.add(archBeam);

  const villageSignTex = makeVillageSignTexture(anisotropy);
  disposables.push(villageSignTex);
  const villageSign = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 1.85, 0.25),
    new THREE.MeshStandardMaterial({
      map: villageSignTex,
      emissive: 0x581c87,
      emissiveMap: villageSignTex,
      emissiveIntensity: 0.7,
      roughness: 0.4,
    })
  );
  villageSign.position.set(0, 6.2, 22);
  worldGroup.add(villageSign);

  // Main Defense House ("домик") at ACT4_HOUSE_POS (z = -18)
  const mainHouse = createCottage(10.5, 6.8, 0xe7d3b1, 0x991b1b);
  mainHouse.position.set(ACT4_HOUSE_POS.x, 0, ACT4_HOUSE_POS.z);
  worldGroup.add(mainHouse);
  boxColliders.push({
    x: ACT4_HOUSE_POS.x,
    z: ACT4_HOUSE_POS.z,
    halfW: 5.4,
    halfD: 3.6,
  });

  // Wooden Porch Deck in front of Main House
  const porchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const porch = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.28, 3.2), porchMat);
  porch.position.set(0, 0.14, -13.2);
  worldGroup.add(porch);

  // Sasha & Roner Shop Kiosks on Porch Flanks
  const sashaSignTex = makeShopSignTexture(
    'САНЯ · ПУШКИ',
    '10-50 КИЛОВ · ОРУЖИЕ',
    '#0f172a',
    '#38bdf8',
    anisotropy
  );
  const ronerSignTex = makeShopSignTexture(
    'RONER · АПГРЕЙДЫ',
    '100 КИЛОВ · ПУЛЕМЕТЫ',
    '#1c1917',
    '#facc15',
    anisotropy
  );
  disposables.push(sashaSignTex, ronerSignTex);

  const sashaSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.95, 0.16),
    new THREE.MeshStandardMaterial({
      map: sashaSignTex,
      emissive: 0x0ea5e9,
      emissiveMap: sashaSignTex,
      emissiveIntensity: 0.45,
    })
  );
  sashaSign.position.set(ACT4_SASHA_POS.x, 3.4, ACT4_SASHA_POS.z - 1.3);
  worldGroup.add(sashaSign);

  const ronerSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.95, 0.16),
    new THREE.MeshStandardMaterial({
      map: ronerSignTex,
      emissive: 0xeab308,
      emissiveMap: ronerSignTex,
      emissiveIntensity: 0.45,
    })
  );
  ronerSign.position.set(ACT4_RONER_POS.x, 3.4, ACT4_RONER_POS.z - 1.3);
  worldGroup.add(ronerSign);

  const sashaShopGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.25, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    })
  );
  sashaShopGlow.rotation.x = -Math.PI / 2;
  sashaShopGlow.position.set(ACT4_SASHA_POS.x, 0.3, ACT4_SASHA_POS.z);
  worldGroup.add(sashaShopGlow);

  const ronerShopGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.25, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    })
  );
  ronerShopGlow.rotation.x = -Math.PI / 2;
  ronerShopGlow.position.set(ACT4_RONER_POS.x, 0.3, ACT4_RONER_POS.z);
  worldGroup.add(ronerShopGlow);

  // Two Auto-Turrets (hidden until 100 kills upgrade bought from Roner!)
  const turrets: Act4TurretRig[] = [];
  const turretCoords = [
    { x: -6.4, z: -12.2 },
    { x: 6.4, z: -12.2 },
  ];
  for (const tc of turretCoords) {
    const tRig = createAutoTurret();
    tRig.group.position.set(tc.x, 0, tc.z);
    tRig.group.visible = false;
    worldGroup.add(tRig.group);
    worldGroup.add(tRig.tracer);
    turrets.push(tRig);
  }

  // Side village cottages framing the lane
  const sideHouses = [
    { x: -14.5, z: 10, w: 6.2, d: 5.2, col: 0xd6d3d1, roof: 0x7c2d12, rotY: Math.PI / 2 },
    { x: 14.5, z: 10, w: 6.2, d: 5.2, col: 0xfde68a, roof: 0x1e3a8a, rotY: -Math.PI / 2 },
    { x: -16.0, z: -4, w: 6.6, d: 5.5, col: 0xfecdd3, roof: 0x881337, rotY: Math.PI / 2.2 },
    { x: 16.0, z: -4, w: 6.6, d: 5.5, col: 0xbfdbfe, roof: 0x312e81, rotY: -Math.PI / 2.2 },
  ];
  for (const h of sideHouses) {
    const cottage = createCottage(h.w, h.d, h.col, h.roof);
    cottage.position.set(h.x, 0, h.z);
    cottage.rotation.y = h.rotY;
    worldGroup.add(cottage);
    boxColliders.push({ x: h.x, z: h.z, halfW: 3.4, halfD: 3.4 });
  }

  // Warm Village Street Lamps
  const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfbbf24,
    emissiveIntensity: 1.8,
  });
  const lampPositions = [
    { x: -5.4, z: 15 },
    { x: 5.4, z: 15 },
    { x: -5.4, z: 1 },
    { x: 5.4, z: 1 },
    { x: -6.0, z: -10.5 },
    { x: 6.0, z: -10.5 },
  ];
  for (let i = 0; i < lampPositions.length; i++) {
    const lp = lampPositions[i];
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 4.2, 8), lampPostMat);
    pole.position.set(lp.x, 2.1, lp.z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), bulbMat);
    bulb.position.set(lp.x, 4.3, lp.z);
    worldGroup.add(pole, bulb);
    if (!isSoftwareGl || i % 2 === 0) {
      const pLight = new THREE.PointLight(0xfde68a, 16, 22, 1.4);
      pLight.position.set(lp.x, 4.1, lp.z);
      worldGroup.add(pLight);
    }
  }

  // Village Perimeter Trees (especially dense forest where Giorno gets dragged!)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 });
  for (let i = 0; i < 48; i++) {
    const ang = (i / 48) * Math.PI * 2;
    const rad = 32 + (i % 3) * 4.5;
    const tx = Math.cos(ang) * rad;
    const tz = Math.sin(ang) * rad;
    // Leave front entrance south road clear around x in [-6..6], z > 24
    if (tz > 22 && Math.abs(tx) < 7) continue;

    const scale = 0.9 + (i % 4) * 0.22;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 3.6, 7), trunkMat);
    trunk.position.y = 1.8;
    const crown1 = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.8, 7), foliageMat);
    crown1.position.y = 4.4;
    const crown2 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.0, 7), foliageMat);
    crown2.position.y = 6.2;
    tree.add(trunk, crown1, crown2);
    tree.position.set(tx, 0, tz);
    tree.scale.setScalar(scale);
    worldGroup.add(tree);
    treeColliders.push({ x: tx, z: tz, radius: 0.9 * scale });
  }

  // Giorno Giovanna Cutout Standee using user-uploaded image (/assets/aistudio/image_7af21e97.png)
  const giornoGroup = new THREE.Group();
  const giornoMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.25,
    side: THREE.DoubleSide,
  });
  const giornoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 2.9), giornoMat);
  giornoMesh.position.y = 1.45;
  giornoGroup.add(giornoMesh);
  giornoGroup.position.set(0.4, 0, 14);
  giornoGroup.visible = false;
  worldGroup.add(giornoGroup);

  loadCutoutGiornoTexture((tex) => {
    disposables.push(tex);
    giornoMat.map = tex;
    giornoMat.needsUpdate = true;
  });

  // Finale Tea & Mivina Table Group (hidden until act4_outro_cutscene!)
  const tableGroup = new THREE.Group();
  tableGroup.position.set(ACT4_TABLE_POS.x, 0, ACT4_TABLE_POS.z);

  const tableWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 });
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.14, 18), tableWoodMat);
  tableTop.position.y = 0.88;
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 0.85, 10), tableWoodMat);
  tableLeg.position.y = 0.42;
  tableGroup.add(tableTop, tableLeg);

  // Teapot in center of table
  const potMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.35 });
  const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), potMat);
  teapot.position.set(0, 1.12, 0);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), potMat);
  lid.position.set(0, 1.34, 0);
  tableGroup.add(teapot, lid);

  // 3 Stools + 3 Mivina Bowls + 3 Teacups around the table
  const seatAngles = [0, (Math.PI * 2) / 3, -(Math.PI * 2) / 3];
  for (const ang of seatAngles) {
    const sx = Math.sin(ang) * 1.95;
    const sz = Math.cos(ang) * 1.95;
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 10), tableWoodMat);
    stoolTop.position.set(sx, 0.52, sz);
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.52, 8), tableWoodMat);
    stoolLeg.position.set(sx, 0.26, sz);
    tableGroup.add(stoolTop, stoolLeg);

    const bowl = createMivinaBowlMesh();
    bowl.position.set(Math.sin(ang) * 0.78, 0.95, Math.cos(ang) * 0.78);
    bowl.rotation.y = ang;
    tableGroup.add(bowl);

    const cup = createTeacupMesh();
    cup.position.set(Math.sin(ang + 0.36) * 0.72, 0.95, Math.cos(ang + 0.36) * 0.72);
    tableGroup.add(cup);
  }
  tableGroup.visible = false;
  worldGroup.add(tableGroup);

  // RPG Rocket Projectile + Explosion Sphere
  const rocketMesh = new THREE.Group();
  const rocketBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.52, 8),
    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.4 })
  );
  rocketBody.rotation.x = Math.PI / 2;
  const rocketTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.5 })
  );
  rocketTip.rotation.x = Math.PI / 2;
  rocketTip.position.z = 0.36;
  const rocketGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
  );
  rocketGlow.position.z = -0.28;
  rocketMesh.add(rocketBody, rocketTip, rocketGlow);
  rocketMesh.visible = false;
  worldGroup.add(rocketMesh);

  const explosionSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.78,
    })
  );
  explosionSphere.visible = false;
  worldGroup.add(explosionSphere);

  const explosionLight = new THREE.PointLight(0xf97316, 0, 26, 1.2);
  worldGroup.add(explosionLight);

  scene.add(worldGroup);

  return {
    worldGroup,
    giornoGroup,
    giornoMat,
    sashaShopGlow,
    ronerShopGlow,
    turrets,
    tableGroup,
    explosionSphere,
    explosionLight,
    rocketMesh,
    boxColliders,
    treeColliders,
    disposables,
  };
}

/**
 * First-person switchable weapon viewmodels for Act 4:
 * Pistol, Uzi, AK-47, Sniper, RPG (Grenade Launcher), and Flamethrower.
 */
export function createAct4WeaponsViewModel(): Act4WeaponViewModels {
  const group = new THREE.Group();

  const gunMetal = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.78,
    roughness: 0.28,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.65,
    roughness: 0.42,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.72,
  });
  const armyGreen = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.55,
    metalness: 0.25,
  });
  const tankRed = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.4,
    metalness: 0.35,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.8,
    roughness: 0.25,
  });

  // 1. Pistol
  const pistol = new THREE.Group();
  const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.34), gunMetal);
  pSlide.position.set(0, 0.03, -0.1);
  const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.16, 0.08), darkMetal);
  pGrip.position.set(0, -0.065, 0.02);
  pGrip.rotation.x = 0.22;
  pistol.add(pSlide, pGrip);

  // 2. Uzi
  const uzi = new THREE.Group();
  const uBody = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.32), darkMetal);
  uBody.position.set(0, 0.02, -0.1);
  const uBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), gunMetal);
  uBarrel.rotation.x = Math.PI / 2;
  uBarrel.position.set(0, 0.035, -0.32);
  const uMag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.24, 0.055), gunMetal);
  uMag.position.set(0, -0.11, -0.08);
  uzi.add(uBody, uBarrel, uMag);

  // 3. AK-47
  const ak47 = new THREE.Group();
  const akRec = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.44), gunMetal);
  akRec.position.set(0, 0.02, -0.12);
  const akStock = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.11, 0.25), woodMat);
  akStock.position.set(0, -0.01, 0.2);
  const akHandguard = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.078, 0.22), woodMat);
  akHandguard.position.set(0, 0.02, -0.38);
  const akBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.34, 8), darkMetal);
  akBarrel.rotation.x = Math.PI / 2;
  akBarrel.position.set(0, 0.035, -0.62);
  const akMag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.08), darkMetal);
  akMag.position.set(0, -0.11, -0.16);
  akMag.rotation.x = -0.26;
  ak47.add(akRec, akStock, akHandguard, akBarrel, akMag);

  // 4. Sniper
  const sniper = new THREE.Group();
  const sRec = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.56), armyGreen);
  sRec.position.set(0, 0, -0.14);
  const sBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 8), darkMetal);
  sBarrel.rotation.x = Math.PI / 2;
  sBarrel.position.set(0, 0.035, -0.7);
  const sScope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.34, 10), gunMetal);
  sScope.rotation.x = Math.PI / 2;
  sScope.position.set(0, 0.095, -0.18);
  sniper.add(sRec, sBarrel, sScope);

  // 5. Grenade Launcher / RPG
  const rpg = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.92, 12), armyGreen);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0.04, -0.24);
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.088, 0.14, 12), darkMetal);
  flare.rotation.x = Math.PI / 2;
  flare.position.set(0, 0.04, -0.72);
  const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.22, 10), tankRed);
  warhead.rotation.x = -Math.PI / 2;
  warhead.position.set(0, 0.04, -0.84);
  rpg.add(tube, flare, warhead);

  // 6. Flamethrower
  const flamethrower = new THREE.Group();
  const fBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.52), darkMetal);
  fBody.position.set(0, 0.01, -0.16);
  const fTank = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.32, 10), tankRed);
  fTank.rotation.x = Math.PI / 2;
  fTank.position.set(-0.075, -0.02, -0.12);
  const fNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.36, 10), brassMat);
  fNozzle.rotation.x = Math.PI / 2;
  fNozzle.position.set(0, 0.03, -0.56);
  const pilot = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfb923c })
  );
  pilot.position.set(0, 0.06, -0.75);
  flamethrower.add(fBody, fTank, fNozzle, pilot);

  const models: Record<Act4WeaponId, THREE.Group> = {
    pistol,
    uzi,
    ak47,
    sniper,
    rpg,
    flamethrower,
  };

  for (const key of Object.keys(models) as Act4WeaponId[]) {
    models[key].visible = key === 'pistol';
    group.add(models[key]);
  }

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.92 })
  );
  muzzleFlash.position.set(0, 0.04, -0.85);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);

  // Cone-shaped bright flame jet when firing Flamethrower
  const flameGeo = new THREE.ConeGeometry(0.45, 3.6, 10, 1, true);
  flameGeo.translate(0, 1.8, 0);
  flameGeo.rotateX(-Math.PI / 2);
  const flameJet = new THREE.Mesh(
    flameGeo,
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  flameJet.position.set(0, 0.03, -0.76);
  flameJet.visible = false;
  group.add(flameJet);

  return { group, models, muzzleFlash, flameJet };
}
