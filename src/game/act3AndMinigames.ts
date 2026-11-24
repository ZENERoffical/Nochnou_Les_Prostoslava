import * as THREE from 'three';
import { createSniperRifleProp } from './factory';

export interface ArenaCoverBox {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
}

export interface SniperArenaObjects {
  worldGroup: THREE.Group;
  covers: ArenaCoverBox[];
  disposables: Array<{ dispose: () => void }>;
}

export interface MalinkaCityObjects {
  worldGroup: THREE.Group;
  neonSignMat: THREE.MeshStandardMaterial;
  lampLights: THREE.PointLight[];
  disposables: Array<{ dispose: () => void }>;
}

export interface SniperViewModelRig {
  group: THREE.Group;
  muzzleFlash: THREE.Mesh;
}

function makeAsphaltTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#181c23';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 2400; i++) {
    const x = (i * 73) % 512;
    const y = (i * 197) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Side road lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(28, 0, 12, 512);
  ctx.fillRect(472, 0, 12, 512);

  // Dashed center line
  ctx.fillStyle = '#facc15';
  for (let y = 16; y < 512; y += 96) {
    ctx.fillRect(249, y, 14, 52);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeConcreteYardTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#1f2933';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  for (let i = 0; i < 1600; i++) {
    const x = (i * 53) % 512;
    const y = (i * 149) % 512;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 3, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeBannerTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  textHex: string,
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
  ctx.fillStyle = textHex;
  ctx.font = 'bold 74px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, c.width / 2, 118);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, c.width / 2, 194);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeBuildingWindowsTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 512);

  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 5; col++) {
      const hash = (row * 17 + col * 31) % 7;
      if (hash <= 3) {
        ctx.fillStyle = hash === 0 ? '#f43f5e' : hash === 1 ? '#38bdf8' : '#fde047';
      } else {
        ctx.fillStyle = '#1e293b';
      }
      ctx.fillRect(18 + col * 46, 20 + row * 40, 28, 22);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function createRaspberryClusterMesh(radius = 0.85): THREE.Group {
  const grp = new THREE.Group();
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0x9f1239,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.1,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.55,
  });

  const rows = [
    { y: 0.52, count: 6, r: radius * 0.62, dr: radius * 0.28 },
    { y: 0.08, count: 8, r: radius * 0.78, dr: radius * 0.3 },
    { y: -0.36, count: 6, r: radius * 0.58, dr: radius * 0.27 },
    { y: -0.68, count: 3, r: radius * 0.28, dr: radius * 0.24 },
  ];
  for (const row of rows) {
    const geo = new THREE.SphereGeometry(row.dr, 10, 8);
    for (let i = 0; i < row.count; i++) {
      const ang = (i / row.count) * Math.PI * 2 + row.y;
      const drupe = new THREE.Mesh(geo, berryMat);
      drupe.position.set(Math.cos(ang) * row.r, row.y, Math.sin(ang) * row.r);
      grp.add(drupe);
    }
  }

  // Green calyx leaves on top
  const leafGeo = new THREE.ConeGeometry(radius * 0.35, radius * 0.9, 5);
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const a = (i / 4) * Math.PI * 2 + 0.4;
    leaf.position.set(Math.cos(a) * radius * 0.32, radius * 0.78, Math.sin(a) * radius * 0.32);
    leaf.rotation.z = -Math.cos(a) * 1.1;
    leaf.rotation.x = Math.sin(a) * 1.1;
    grp.add(leaf);
  }
  return grp;
}

export function createSniperFirstPersonViewModel(): SniperViewModelRig {
  const group = new THREE.Group();

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.72,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf1c27d,
    roughness: 0.58,
  });

  const rifle = createSniperRifleProp();
  rifle.position.set(0, 0, 0);
  group.add(rifle);

  // Right arm gripping rifle grip
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.36), sleeveMat);
  rightArm.position.set(0.08, -0.14, 0.34);
  rightArm.rotation.set(-0.22, -0.18, 0);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.11), skinMat);
  rightHand.position.set(0.01, -0.09, 0.18);

  // Left arm supporting barrel forend
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.42), sleeveMat);
  leftArm.position.set(-0.14, -0.13, -0.08);
  leftArm.rotation.set(-0.18, 0.34, 0);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.12), skinMat);
  leftHand.position.set(-0.02, -0.07, -0.26);

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.92,
    })
  );
  muzzleFlash.scale.set(1.1, 1.1, 2.2);
  muzzleFlash.position.set(0, 0.04, -0.96);
  muzzleFlash.visible = false;

  group.add(rightArm, rightHand, leftArm, leftHand, muzzleFlash);
  return { group, muzzleFlash };
}

export function buildMalinkaEntranceScene(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): MalinkaCityObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const lampLights: THREE.PointLight[] = [];

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x0b1a12,
    roughness: 0.94,
    metalness: 0.02,
  });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  worldGroup.add(grass);

  const roadTex = makeAsphaltTexture(anisotropy);
  disposables.push(roadTex);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.65,
    metalness: 0.08,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 220), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, -55);
  road.receiveShadow = true;
  worldGroup.add(road);

  // Sidewalks / curbs
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  for (const cx of [-7.4, 7.4]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 220), curbMat);
    curb.position.set(cx, 0.09, -55);
    worldGroup.add(curb);
  }

  // Grand Welcome Arch «ГОРОД МАЛИНКА» at z = -22
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.78,
    roughness: 0.34,
  });
  const neonSignMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.65,
    roughness: 0.25,
  });

  const gateZ = -22;
  for (const px of [-8.2, 8.2]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 8.8, 1.1), steelMat);
    pillar.position.set(px, 4.4, gateZ);
    pillar.castShadow = true;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 1.7), curbMat);
    base.position.set(px, 0.45, gateZ);

    const berry = createRaspberryClusterMesh(0.95);
    berry.position.set(px, 9.75, gateZ);
    worldGroup.add(pillar, base, berry);
  }

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.65, 1.0), steelMat);
  topBeam.position.set(0, 8.65, gateZ);
  const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.18, 1.06), neonSignMat);
  neonTrim.position.set(0, 8.2, gateZ);
  worldGroup.add(topBeam, neonTrim);

  const citySignTex = makeBannerTexture(
    'ГОРОД «МАЛИНКА»',
    'ДОБРО ПОЖАЛОВАТЬ · АКТ 3 (СКОРО)',
    '#2a0917',
    '#fda4af',
    '#f43f5e',
    anisotropy
  );
  disposables.push(citySignTex);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(13.6, 3.2, 0.35),
    new THREE.MeshStandardMaterial({
      map: citySignTex,
      emissiveMap: citySignTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    })
  );
  signBoard.position.set(0, 6.75, gateZ);
  worldGroup.add(signBoard);

  // Checkpoint guard booth & striped road barrier
  const booth = new THREE.Group();
  booth.position.set(-10.2, 0, -13.5);
  const boothBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.0, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72 })
  );
  boothBody.position.y = 1.5;
  const boothRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.28, 3.6), neonSignMat);
  boothRoof.position.y = 3.12;
  const boothGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.2),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  boothGlass.position.set(1.62, 1.9, 0);
  boothGlass.rotation.y = Math.PI / 2;
  booth.add(boothBody, boothRoof, boothGlass);
  worldGroup.add(booth);

  // Road barrier bar (raised at angle)
  const barPivot = new THREE.Group();
  barPivot.position.set(-6.8, 1.05, -13.5);
  barPivot.rotation.z = 0.22;
  const barMesh = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.16, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 })
  );
  barMesh.position.x = 3.6;
  barPivot.add(barMesh);
  worldGroup.add(barPivot);

  // Streetlamps along both sides of entrance highway
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
  for (let lz = -4; lz >= -68; lz -= 16) {
    for (const side of [-1, 1]) {
      const px = side * 8.4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 6.2, 8), poleMat);
      pole.position.set(px, 3.1, lz);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), poleMat);
      arm.position.set(px - side * 0.7, 6.1, lz);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.3), bulbMat);
      lamp.position.set(px - side * 1.25, 6.02, lz);
      worldGroup.add(pole, arm, lamp);
    }
  }

  // Calibrated Warm City Gate & Road PointLights
  const gateLight = new THREE.PointLight(0xf43f5e, 24, 34, 1.25);
  gateLight.position.set(0, 7.2, gateZ + 3.5);
  const roadLight1 = new THREE.PointLight(0xfde68a, 14, 28, 1.3);
  roadLight1.position.set(0, 6.2, -10);
  const roadLight2 = new THREE.PointLight(0x38bdf8, 14, 34, 1.3);
  roadLight2.position.set(0, 7.0, -44);
  worldGroup.add(gateLight, roadLight1, roadLight2);
  lampLights.push(gateLight, roadLight1, roadLight2);

  // Distant City Skyline apartment towers rising behind the entrance gate
  const winTex = makeBuildingWindowsTexture(anisotropy);
  disposables.push(winTex);
  const towerMat = new THREE.MeshStandardMaterial({
    map: winTex,
    emissiveMap: winTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.72,
    roughness: 0.75,
  });

  const skylineDefs: Array<{ x: number; z: number; w: number; h: number; d: number }> = [
    { x: -28, z: -62, w: 12, h: 28, d: 12 },
    { x: -16, z: -76, w: 10, h: 36, d: 10 },
    { x: 18, z: -70, w: 11, h: 32, d: 11 },
    { x: 30, z: -84, w: 13, h: 42, d: 13 },
    { x: -34, z: -96, w: 15, h: 46, d: 14 },
    { x: -8, z: -102, w: 12, h: 48, d: 12 },
    { x: 11, z: -110, w: 14, h: 52, d: 14 },
    { x: 38, z: -104, w: 12, h: 34, d: 12 },
  ];
  for (const b of skylineDefs) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), towerMat);
    tower.position.set(b.x, b.h / 2, b.z);
    worldGroup.add(tower);
  }

  // Roadside raspberry bushes
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });
  const berryDotMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const bushGeo = new THREE.DodecahedronGeometry(1.15, 0);
  const berryDotGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const bushCount = isSoftwareGl ? 10 : 18;
  for (let i = 0; i < bushCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const bz = -3 - i * 3.8;
    const bx = side * (9.5 + (i % 3) * 1.8);
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.set(bx, 0.85, bz);
    worldGroup.add(bush);
    for (let k = 0; k < 3; k++) {
      const dot = new THREE.Mesh(berryDotGeo, berryDotMat);
      dot.position.set(bx + (k - 1) * 0.45, 1.1 + (k % 2) * 0.35, bz + 0.85);
      worldGroup.add(dot);
    }
  }

  scene.add(worldGroup);

  return {
    worldGroup,
    neonSignMat,
    lampLights,
    disposables,
  };
}

export function buildSniperArenaScene(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): SniperArenaObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const covers: ArenaCoverBox[] = [];

  const groundTex = makeConcreteYardTexture(anisotropy);
  disposables.push(groundTex);

  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.86,
    metalness: 0.1,
  });
  const yardGround = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), groundMat);
  yardGround.rotation.x = -Math.PI / 2;
  yardGround.receiveShadow = true;
  worldGroup.add(yardGround);

  // Perimeter warehouse walls (radius ~39m octagon / square)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.82,
    metalness: 0.18,
  });
  const wallDist = 39.5;
  const wallSegs: Array<{ x: number; z: number; w: number; d: number }> = [
    { x: 0, z: -wallDist, w: wallDist * 2 + 2, d: 1.5 },
    { x: 0, z: wallDist, w: wallDist * 2 + 2, d: 1.5 },
    { x: -wallDist, z: 0, w: 1.5, d: wallDist * 2 + 2 },
    { x: wallDist, z: 0, w: 1.5, d: wallDist * 2 + 2 },
  ];
  for (const ws of wallSegs) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ws.w, 8.5, ws.d), wallMat);
    wall.position.set(ws.x, 4.25, ws.z);
    worldGroup.add(wall);
  }

  // Glowing banner on the North yard wall
  const arenaBannerTex = makeBannerTexture(
    'СНАЙПЕРКА ТЕПЕРЬ МОЯ!',
    'МИВИНА КОРПОРЕЙШЕН · ПОЛИГОН КЛОНОВ',
    '#0f172a',
    '#4ade80',
    '#22c55e',
    anisotropy
  );
  disposables.push(arenaBannerTex);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 4.2),
    new THREE.MeshBasicMaterial({ map: arenaBannerTex })
  );
  banner.position.set(0, 6.0, -wallDist + 0.9);
  worldGroup.add(banner);

  // Cover crates / containers around the yard (outside center spawn ring)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const containerMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    roughness: 0.55,
    metalness: 0.45,
  });
  const coverDefs: Array<{ x: number; z: number; w: number; h: number; d: number; metal?: boolean }> = [
    { x: -13, z: -12, w: 5.2, h: 2.6, d: 2.4, metal: true },
    { x: 14, z: -14, w: 5.2, h: 2.6, d: 2.4, metal: true },
    { x: -15, z: 12, w: 2.4, h: 2.6, d: 5.2, metal: true },
    { x: 15, z: 13, w: 2.4, h: 2.6, d: 5.2, metal: true },
    { x: -8, z: -22, w: 2.4, h: 1.8, d: 2.4 },
    { x: 9, z: -24, w: 2.6, h: 2.0, d: 2.4 },
    { x: 0, z: 18, w: 3.4, h: 1.9, d: 2.2 },
    { x: -24, z: -2, w: 2.6, h: 2.1, d: 2.8 },
    { x: 24, z: 1, w: 2.6, h: 2.1, d: 2.8 },
  ];
  for (const cd of coverDefs) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(cd.w, cd.h, cd.d),
      cd.metal ? containerMat : crateMat
    );
    box.position.set(cd.x, cd.h / 2, cd.z);
    if (!isSoftwareGl) box.castShadow = true;
    box.receiveShadow = true;
    worldGroup.add(box);
    covers.push({
      x: cd.x,
      z: cd.z,
      halfW: cd.w / 2,
      halfD: cd.d / 2,
    });
  }

  // 4 Floodlight towers in corners for moody sniper visibility
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  for (const [cx, cz] of [
    [-26, -26],
    [26, -26],
    [-26, 26],
    [26, 26],
  ]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 11, 8), towerMat);
    pole.position.set(cx, 5.5, cz);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.8), bulbMat);
    head.position.set(cx, 11.1, cz);
    head.lookAt(0, 0, 0);
    const pt = new THREE.PointLight(0xbae6fd, 24, 48, 1.25);
    pt.position.set(cx * 0.9, 10.2, cz * 0.9);
    worldGroup.add(pole, head, pt);
  }

  scene.add(worldGroup);

  return {
    worldGroup,
    covers,
    disposables,
  };
}
