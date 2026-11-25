import * as THREE from 'three';
import { PvzPlantType } from '../types/game';

export const PVZ_ROWS = 5;
export const PVZ_COLS = 8;
export const PVZ_TILE_SIZE = 3.0;
export const PVZ_GRID_START_X = -10.5;
export const PVZ_GRID_START_Z = -6.0;
export const PVZ_HOUSE_DEFENSE_X = -13.5;
export const PVZ_SPAWN_X = 16.5;

export interface PvzTileRef {
  row: number;
  col: number;
  x: number;
  z: number;
  tileMesh: THREE.Mesh;
}

export interface PvzArenaObjects {
  worldGroup: THREE.Group;
  tiles: PvzTileRef[];
  hoverRing: THREE.Mesh;
  hoverRingMat: THREE.MeshBasicMaterial;
  disposables: Array<{ dispose: () => void }>;
}

export interface PvzPlantRig {
  group: THREE.Group;
  headPivot: THREE.Group;
  muzzleOffsetZ: number;
}

export function pvzTileWorldPos(row: number, col: number): { x: number; z: number } {
  return {
    x: PVZ_GRID_START_X + col * PVZ_TILE_SIZE,
    z: PVZ_GRID_START_Z + row * PVZ_TILE_SIZE,
  };
}

function makeLawnTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(74, 222, 128, 0.08)' : 'rgba(5, 46, 22, 0.25)';
    ctx.fillRect((i * 47) % 256, (i * 93) % 256, 4, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 10);
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

function makeHouseSignTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('РОСТЕНИЯ ПРОТИВ RONER\'S', 256, 56);
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('НЕ ПУСТИ КЛОНОВ В ДОМ!', 256, 94);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

export function buildPvzArenaScene(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): PvzArenaObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const grassTex = makeLawnTexture(anisotropy);
  const signTex = makeHouseSignTexture(anisotropy);
  disposables.push(grassTex, signTex);

  // Extended surrounding ground so there's no floating island void
  const outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    new THREE.MeshStandardMaterial({ color: 0x0b2214, roughness: 0.95 })
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.02;
  outerGround.receiveShadow = true;
  worldGroup.add(outerGround);

  const yardFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 30),
    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.88 })
  );
  yardFloor.rotation.x = -Math.PI / 2;
  yardFloor.receiveShadow = true;
  worldGroup.add(yardFloor);

  // 5x8 Checkerboard Planting Tiles
  const tiles: PvzTileRef[] = [];
  const lightTileMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.82,
  });
  const darkTileMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
  });

  for (let row = 0; row < PVZ_ROWS; row++) {
    for (let col = 0; col < PVZ_COLS; col++) {
      const pos = pvzTileWorldPos(row, col);
      const isEven = (row + col) % 2 === 0;
      const tileMesh = new THREE.Mesh(
        new THREE.BoxGeometry(PVZ_TILE_SIZE - 0.16, 0.08, PVZ_TILE_SIZE - 0.16),
        isEven ? lightTileMat : darkTileMat
      );
      tileMesh.position.set(pos.x, 0.02, pos.z);
      tileMesh.receiveShadow = true;
      worldGroup.add(tileMesh);
      tiles.push({ row, col, x: pos.x, z: pos.z, tileMesh });
    }
  }

  // Defense Line Marker & Nikita's House on West Side (x < -13.5)
  const defenseLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.08, PVZ_ROWS * PVZ_TILE_SIZE + 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.9,
    })
  );
  defenseLine.position.set(PVZ_HOUSE_DEFENSE_X, 0.05, 0);
  worldGroup.add(defenseLine);

  const houseGroup = new THREE.Group();
  houseGroup.position.set(-18.5, 0, 0);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.78 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.65 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5.2, 18.0), wallMat);
  body.position.y = 2.6;
  body.castShadow = !isSoftwareGl;
  body.receiveShadow = true;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(10.8, 3.4, 4), roofMat);
  roof.position.y = 6.8;
  roof.rotation.y = Math.PI / 4;
  const porch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 16.0), woodMat);
  porch.position.set(3.8, 0.15, 0);
  const houseSign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.0, 2.75),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  houseSign.position.set(3.32, 4.1, 0);
  houseSign.rotation.y = Math.PI / 2;
  houseGroup.add(body, roof, porch, houseSign);
  worldGroup.add(houseGroup);

  // Zombie spawn asphalt road on East side
  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.0, 24.0),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
  );
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(17.5, 0.015, 0);
  worldGroup.add(roadMesh);

  // Fence borders North/South
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  for (const fz of [-10.0, 10.0]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(36, 0.9, 0.35), fenceMat);
    rail.position.set(2, 0.45, fz);
    worldGroup.add(rail);
  }

  // Aim Tile Hover Ring
  const hoverRingMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const hoverRing = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.32, 4), hoverRingMat);
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.rotation.z = Math.PI / 4;
  hoverRing.position.set(0, 0.09, 0);
  hoverRing.visible = false;
  worldGroup.add(hoverRing);

  // Overhead warm/cool lighting
  const gardenLight = new THREE.PointLight(0xfef3c7, 28, 48, 1.1);
  gardenLight.position.set(2, 11, 0);
  worldGroup.add(gardenLight);

  scene.add(worldGroup);
  return {
    worldGroup,
    tiles,
    hoverRing,
    hoverRingMat,
    disposables,
  };
}

export function createPvzPlantRig(kind: Exclude<PvzPlantType, 'shovel'>): PvzPlantRig {
  const group = new THREE.Group();
  const headPivot = new THREE.Group();

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.72 });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.72,
    roughness: 0.32,
  });

  // Base leaves / pot common anchor
  const basePot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.48, 0.36, 10), potMat);
  basePot.position.y = 0.18;
  group.add(basePot);

  if (kind === 'sun') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.85, 8), leafMat);
    stem.position.y = 0.65;
    headPivot.position.set(0, 1.22, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
    });
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12), coreMat);
    head.rotation.z = Math.PI / 2;
    headPivot.add(head);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.22), petalMat);
      petal.position.set(0, Math.cos(a) * 0.54, Math.sin(a) * 0.54);
      petal.rotation.x = a;
      headPivot.add(petal);
    }
    group.add(stem, headPivot);
    return { group, headPivot, muzzleOffsetZ: 0 };
  }

  if (kind === 'wallnut') {
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.65,
      metalness: 0.18,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.45, 1.55), armorMat);
    body.position.y = 0.92;
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.24, 1.62), steelMat);
    band.position.y = 1.02;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const sz of [-0.35, 0.35]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat);
      eye.position.set(0.73, 1.25, sz);
      group.add(eye);
    }
    group.add(body, band, headPivot);
    return { group, headPivot, muzzleOffsetZ: 0 };
  }

  // Pea-Turret / Twin Repeater Turret facing +X toward incoming RONERs
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.72, 8), steelMat);
  stem.position.y = 0.65;
  headPivot.position.set(0, 1.15, 0);

  const headMat = new THREE.MeshStandardMaterial({
    color: kind === 'repeater' ? 0x0ea5e9 : 0x22c55e,
    roughness: 0.35,
    metalness: 0.35,
  });
  const headBulb = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), headMat);
  headPivot.add(headBulb);

  if (kind === 'peashooter') {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.75, 10), leafMat);
    barrel.rotation.z = -Math.PI / 2;
    barrel.position.set(0.55, 0, 0);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.14, 10), steelMat);
    tip.rotation.z = -Math.PI / 2;
    tip.position.set(0.92, 0, 0);
    headPivot.add(barrel, tip);
  } else {
    for (const bz of [-0.18, 0.18]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.88, 10), steelMat);
      barrel.rotation.z = -Math.PI / 2;
      barrel.position.set(0.58, 0, bz);
      headPivot.add(barrel);
    }
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 0.85), steelMat);
    helm.position.set(-0.05, 0.36, 0);
    headPivot.add(helm);
  }

  group.add(stem, headPivot);
  return { group, headPivot, muzzleOffsetZ: 0.95 };
}

export function createPvzBoltMesh(isHeavy: boolean): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(isHeavy ? 0.22 : 0.18, 8, 8),
    new THREE.MeshBasicMaterial({
      color: isHeavy ? 0x38bdf8 : 0x4ade80,
    })
  );
}
