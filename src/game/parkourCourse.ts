import * as THREE from 'three';

export interface ParkourPlatform {
  x: number;
  z: number;
  w: number;
  d: number;
  topY: number;
  thickness: number;
  isMoving?: boolean;
  baseX?: number;
  baseZ?: number;
  moveAxis?: 'x' | 'z';
  moveAmp?: number;
  moveSpeed?: number;
  phase?: number;
  dx?: number;
  dz?: number;
  checkpointIdx?: number;
  isBounce?: boolean;
  isGoal?: boolean;
  mesh: THREE.Group;
}

export interface ParkourCheckpointBeacon {
  idx: number;
  ring: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
}

export interface ParkourCourseObjects {
  worldGroup: THREE.Group;
  platforms: ParkourPlatform[];
  checkpoints: Array<{ idx: number; x: number; y: number; z: number }>;
  beacons: ParkourCheckpointBeacon[];
  goalTrophy: THREE.Group;
  disposables: Array<{ dispose: () => void }>;
}

function makeCourseTileTexture(
  primary: string,
  border: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = border;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 240);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(28 + i * 54, 28, 34, 200);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  return tex;
}

export function buildParkourCourseScene(
  scene: THREE.Scene,
  anisotropy: number,
  isSoftwareGl: boolean
): ParkourCourseObjects {
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const normalTex = makeCourseTileTexture('#1e293b', '#38bdf8', anisotropy);
  const moveTex = makeCourseTileTexture('#312e81', '#a78bfa', anisotropy);
  const bounceTex = makeCourseTileTexture('#064e3b', '#34d399', anisotropy);
  const checkTex = makeCourseTileTexture('#78350f', '#fbbf24', anisotropy);
  const goalTex = makeCourseTileTexture('#713f12', '#fde047', anisotropy);
  disposables.push(normalTex, moveTex, bounceTex, checkTex, goalTex);

  const normalMat = new THREE.MeshStandardMaterial({
    map: normalTex,
    roughness: 0.52,
    metalness: 0.2,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.38,
    metalness: 0.55,
  });
  const moveMat = new THREE.MeshStandardMaterial({
    map: moveTex,
    roughness: 0.45,
    metalness: 0.25,
  });
  const bounceMat = new THREE.MeshStandardMaterial({
    map: bounceTex,
    emissive: 0x10b981,
    emissiveIntensity: 0.45,
    roughness: 0.3,
  });
  const checkMat = new THREE.MeshStandardMaterial({
    map: checkTex,
    roughness: 0.4,
    metalness: 0.35,
  });
  const goalMat = new THREE.MeshStandardMaterial({
    map: goalTex,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.4,
    roughness: 0.28,
    metalness: 0.55,
  });

  const platforms: ParkourPlatform[] = [];
  const checkpoints: Array<{ idx: number; x: number; y: number; z: number }> = [];
  const beacons: ParkourCheckpointBeacon[] = [];

  const specs: Array<{
    x: number;
    z: number;
    w: number;
    d: number;
    topY: number;
    thickness?: number;
    kind?: 'normal' | 'move' | 'bounce' | 'checkpoint' | 'goal';
    moveAxis?: 'x' | 'z';
    moveAmp?: number;
    moveSpeed?: number;
    phase?: number;
    checkpointIdx?: number;
  }> = [
    // Start Spawn Island (CP 0)
    { x: 0, z: 0, w: 8, d: 8, topY: 0, thickness: 1.2, kind: 'checkpoint', checkpointIdx: 0 },
    // Section 1: Intro jumps
    { x: 0, z: -7.5, w: 4.0, d: 4.0, topY: 0.8 },
    { x: -2.2, z: -13.0, w: 3.4, d: 3.4, topY: 1.6 },
    { x: 2.0, z: -18.5, w: 3.4, d: 3.4, topY: 2.4 },
    { x: 0, z: -24.5, w: 3.6, d: 3.6, topY: 3.2 },
    { x: 0, z: -31.5, w: 5.5, d: 5.5, topY: 3.8, kind: 'checkpoint', checkpointIdx: 1 },

    // Section 2: Moving Bridge + Narrow Beam
    {
      x: 0,
      z: -39.0,
      w: 3.8,
      d: 3.8,
      topY: 4.2,
      kind: 'move',
      moveAxis: 'x',
      moveAmp: 3.6,
      moveSpeed: 1.6,
      phase: 0,
    },
    { x: 0, z: -46.5, w: 1.5, d: 6.5, topY: 4.6 },
    {
      x: 0,
      z: -54.5,
      w: 3.6,
      d: 3.6,
      topY: 5.2,
      kind: 'move',
      moveAxis: 'x',
      moveAmp: 4.0,
      moveSpeed: 1.9,
      phase: Math.PI,
    },
    { x: 0, z: -62.5, w: 4.0, d: 4.0, topY: 5.6, kind: 'bounce' },
    // High bounce landing + Checkpoint 2
    { x: 0, z: -72.0, w: 6.0, d: 6.0, topY: 10.2, kind: 'checkpoint', checkpointIdx: 2 },

    // Section 3: Zigzag Pillars + Lateral Movers
    { x: -4.2, z: -79.5, w: 3.0, d: 3.0, topY: 10.8 },
    { x: 3.8, z: -85.5, w: 3.0, d: 3.0, topY: 11.4 },
    { x: -3.5, z: -91.5, w: 2.8, d: 2.8, topY: 12.1 },
    {
      x: 0,
      z: -99.0,
      w: 3.4,
      d: 3.4,
      topY: 12.5,
      kind: 'move',
      moveAxis: 'z',
      moveAmp: 2.8,
      moveSpeed: 1.85,
      phase: 0.7,
    },
    { x: 0, z: -107.0, w: 2.8, d: 2.8, topY: 13.1 },
    { x: 0, z: -114.5, w: 6.0, d: 6.0, topY: 13.6, kind: 'checkpoint', checkpointIdx: 3 },

    // Section 4: Balance Catwalks + Sky Bounce Finale
    { x: -3.6, z: -123.0, w: 1.4, d: 6.8, topY: 14.0 },
    { x: 3.2, z: -130.5, w: 1.4, d: 6.8, topY: 14.5 },
    {
      x: 0,
      z: -138.5,
      w: 3.5,
      d: 3.5,
      topY: 15.0,
      kind: 'move',
      moveAxis: 'x',
      moveAmp: 4.2,
      moveSpeed: 2.15,
      phase: 1.2,
    },
    { x: 0, z: -145.5, w: 3.8, d: 3.8, topY: 15.3, kind: 'bounce' },
    { x: 0, z: -155.5, w: 5.5, d: 5.5, topY: 20.0, kind: 'checkpoint', checkpointIdx: 4 },

    // Final Sprint & Goal Summit
    { x: -3.2, z: -163.0, w: 2.7, d: 2.7, topY: 20.6 },
    { x: 3.2, z: -169.0, w: 2.7, d: 2.7, topY: 21.3 },
    { x: 0, z: -175.5, w: 2.6, d: 2.6, topY: 22.0 },
    { x: 0, z: -183.5, w: 8.5, d: 8.5, topY: 22.6, thickness: 1.4, kind: 'goal' },
  ];

  for (const sp of specs) {
    const thickness = sp.thickness ?? 0.9;
    const grp = new THREE.Group();
    grp.position.set(sp.x, sp.topY - thickness * 0.5, sp.z);

    const topMat =
      sp.kind === 'move'
        ? moveMat
        : sp.kind === 'bounce'
          ? bounceMat
          : sp.kind === 'checkpoint'
            ? checkMat
            : sp.kind === 'goal'
              ? goalMat
              : normalMat;

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(sp.w, thickness, sp.d),
      topMat
    );
    deck.castShadow = !isSoftwareGl;
    deck.receiveShadow = true;
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(sp.w + 0.18, thickness * 0.42, sp.d + 0.18),
      trimMat
    );
    rim.position.y = -thickness * 0.2;
    const underCore = new THREE.Mesh(
      new THREE.BoxGeometry(sp.w * 0.65, thickness * 0.35, sp.d * 0.65),
      trimMat
    );
    underCore.position.y = -thickness * 0.58;
    grp.add(deck, rim, underCore);

    if (sp.kind === 'bounce') {
      const springRing = new THREE.Mesh(
        new THREE.TorusGeometry(Math.min(sp.w, sp.d) * 0.32, 0.12, 8, 20),
        bounceMat
      );
      springRing.rotation.x = Math.PI / 2;
      springRing.position.y = thickness * 0.52;
      grp.add(springRing);
    }

    if (sp.kind === 'checkpoint' && sp.checkpointIdx !== undefined) {
      checkpoints.push({
        idx: sp.checkpointIdx,
        x: sp.x,
        y: sp.topY,
        z: sp.z,
      });
      const ringMat = new THREE.MeshStandardMaterial({
        color: sp.checkpointIdx === 0 ? 0x22c55e : 0xfbbf24,
        emissive: sp.checkpointIdx === 0 ? 0x16a34a : 0xd97706,
        emissiveIntensity: 1.5,
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.45, 0.11, 8, 24),
        ringMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = thickness * 0.5 + 0.08;
      grp.add(ring);
      beacons.push({ idx: sp.checkpointIdx, ring, mat: ringMat });
    }

    worldGroup.add(grp);
    platforms.push({
      x: sp.x,
      z: sp.z,
      w: sp.w,
      d: sp.d,
      topY: sp.topY,
      thickness,
      isMoving: sp.kind === 'move',
      baseX: sp.x,
      baseZ: sp.z,
      moveAxis: sp.moveAxis,
      moveAmp: sp.moveAmp,
      moveSpeed: sp.moveSpeed,
      phase: sp.phase,
      dx: 0,
      dz: 0,
      checkpointIdx: sp.checkpointIdx,
      isBounce: sp.kind === 'bounce',
      isGoal: sp.kind === 'goal',
      mesh: grp,
    });
  }

  // Victory Arch + Giant Golden Mivina Trophy at Goal Platform
  const goalSpec = specs[specs.length - 1];
  const archGroup = new THREE.Group();
  archGroup.position.set(goalSpec.x, goalSpec.topY, goalSpec.z);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.75,
    metalness: 0.85,
    roughness: 0.2,
  });
  for (const sx of [-2.8, 2.8]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.6, 10), trimMat);
    col.position.set(sx, 2.3, -1.8);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), goldMat);
    orb.position.set(sx, 4.75, -1.8);
    archGroup.add(col, orb);
  }
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.55, 0.55), goldMat);
  archBeam.position.set(0, 4.4, -1.8);
  archGroup.add(archBeam);

  const goalTrophy = new THREE.Group();
  goalTrophy.position.set(goalSpec.x, goalSpec.topY + 1.5, goalSpec.z);
  const brick = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.0), goldMat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 8, 24), goldMat);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), bounceMat);
  gem.position.y = 1.0;
  goalTrophy.add(brick, ring, gem);

  const goalLight = new THREE.PointLight(0xfacc15, 22, 24, 1.3);
  goalLight.position.set(goalSpec.x, goalSpec.topY + 3.5, goalSpec.z);
  worldGroup.add(archGroup, goalTrophy, goalLight);

  // Decorative floating neon guide rings & low-horizon void floor
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    transparent: true,
    opacity: 0.55,
  });
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(3.5 + (i % 3), 26, 3.5 + (i % 2)),
      cloudMat
    );
    pillar.position.set(side * (12 + (i % 4) * 3.5), (i * 1.1) - 10, -i * 11.5);
    worldGroup.add(pillar);
  }

  scene.add(worldGroup);
  return {
    worldGroup,
    platforms,
    checkpoints,
    beacons,
    goalTrophy,
    disposables,
  };
}
