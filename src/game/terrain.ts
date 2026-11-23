export const PLAY_RADIUS = 58;
export const FOREST_OUTER_RADIUS = 92;

// Story Act 1 winding path constants (long 1000m winding trail)
export const STORY_START_Z = 0;
export const STORY_END_Z = -1000;
export const STORY_PATH_HALF_WIDTH = 4.6;

export interface TreeData {
  x: number;
  z: number;
  y: number;
  scale: number;
  rotationY: number;
  trunkRadius: number;
  kind: 'pine' | 'birch';
  tintIndex: number;
}

export interface RockData {
  x: number;
  z: number;
  y: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationY: number;
  radius: number;
}

export interface ObstacleCircle {
  x: number;
  z: number;
  radius: number;
}

export interface ForestLayout {
  trees: TreeData[];
  rocks: RockData[];
  obstacles: ObstacleCircle[];
}

/**
 * Winding S-curve trail center X coordinate for Story Act 1.
 */
export function storyPathCenterX(z: number): number {
  const env = Math.min(1, Math.max(0, Math.abs(z) / 26));
  const endFade =
    z < STORY_END_Z + 26
      ? Math.max(0.15, (z - (STORY_END_Z - 16)) / 42)
      : 1;
  return (
    (Math.sin(z * 0.036) * 18.0 + Math.sin(z * 0.085) * 6.5) *
    env *
    Math.min(1, endFade)
  );
}

/**
 * Deterministic multi-octave terrain height so every prop, tree, mushroom,
 * and character sits flush on the forest floor with zero floating.
 */
export function groundHeightAt(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  const clearingFactor = Math.min(1, Math.max(0.22, dist / 24));
  const h1 = Math.sin(x * 0.055) * Math.cos(z * 0.055) * 1.15;
  const h2 = Math.sin(x * 0.13 + 1.4) * Math.sin(z * 0.11 - 0.8) * 0.45;
  const h3 = Math.cos((x + z) * 0.032) * 0.7;
  return (h1 + h2 + h3) * clearingFactor;
}

/**
 * Mulberry32 seeded PRNG for deterministic forest layout.
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateForestLayout(seed = 202607): ForestLayout {
  const rand = createSeededRandom(seed);
  const trees: TreeData[] = [];
  const rocks: RockData[] = [];
  const obstacles: ObstacleCircle[] = [];

  const isTooClose = (x: number, z: number, minGap: number): boolean => {
    if (Math.hypot(x, z) < 6.5) return true;
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const dx = x - o.x;
      const dz = z - o.z;
      const d = o.radius + minGap;
      if (dx * dx + dz * dz < d * d) return true;
    }
    return false;
  };

  for (let i = 0; i < 155; i++) {
    const angle = rand() * Math.PI * 2;
    const r = 7.5 + Math.sqrt(rand()) * (PLAY_RADIUS - 7.5);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (isTooClose(x, z, 2.4)) continue;

    const scale = 0.85 + rand() * 0.35;
    const trunkRadius = 0.42 * scale;
    const y = groundHeightAt(x, z);
    trees.push({
      x,
      z,
      y,
      scale,
      rotationY: rand() * Math.PI * 2,
      trunkRadius,
      kind: rand() > 0.25 ? 'pine' : 'birch',
      tintIndex: Math.floor(rand() * 5),
    });
    obstacles.push({ x, z, radius: trunkRadius + 0.35 });
  }

  for (let i = 0; i < 185; i++) {
    const angle = rand() * Math.PI * 2;
    const r =
      PLAY_RADIUS + 1.5 + rand() * (FOREST_OUTER_RADIUS - PLAY_RADIUS - 3);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (isTooClose(x, z, 1.9)) continue;

    const scale = 1.0 + rand() * 0.45;
    const trunkRadius = 0.45 * scale;
    const y = groundHeightAt(x, z);
    trees.push({
      x,
      z,
      y,
      scale,
      rotationY: rand() * Math.PI * 2,
      trunkRadius,
      kind: rand() > 0.15 ? 'pine' : 'birch',
      tintIndex: Math.floor(rand() * 5),
    });
    obstacles.push({ x, z, radius: trunkRadius + 0.3 });
  }

  for (let i = 0; i < 42; i++) {
    const angle = rand() * Math.PI * 2;
    const r = 9 + rand() * (PLAY_RADIUS - 10);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const rad = 0.7 + rand() * 0.9;
    if (isTooClose(x, z, rad + 1.2)) continue;

    const y = groundHeightAt(x, z);
    rocks.push({
      x,
      z,
      y,
      scaleX: rad * (0.9 + rand() * 0.4),
      scaleY: rad * (0.55 + rand() * 0.35),
      scaleZ: rad * (0.9 + rand() * 0.4),
      rotationY: rand() * Math.PI * 2,
      radius: rad * 0.85,
    });
    obstacles.push({ x, z, radius: rad * 0.9 });
  }

  return { trees, rocks, obstacles };
}

/**
 * Builds a dense dark forest framing the 1000m winding trail for Story Act 1.
 */
export function generateStoryForestLayout(seed = 909102): ForestLayout {
  const rand = createSeededRandom(seed);
  const trees: TreeData[] = [];
  const rocks: RockData[] = [];
  const obstacles: ObstacleCircle[] = [];

  const endX = storyPathCenterX(STORY_END_Z);
  const isBlocked = (x: number, z: number, minGap: number): boolean => {
    const cx = storyPathCenterX(z);
    if (Math.abs(x - cx) < STORY_PATH_HALF_WIDTH + minGap) return true;
    if (Math.abs(z - STORY_START_Z) < 8 && Math.abs(x) < 8) return true;
    // Keep clearing open around the Мивина Корпорейшен gate & factory building
    if (
      z < STORY_END_Z + 14 &&
      z > STORY_END_Z - 38 &&
      Math.abs(x - endX) < 18
    ) {
      return true;
    }
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (Math.abs(z - o.z) > 4.5) continue;
      const dx = x - o.x;
      const dz = z - o.z;
      const d = o.radius + minGap;
      if (dx * dx + dz * dz < d * d) return true;
    }
    return false;
  };

  // Line both edges of the 1000m winding path densely + outer woods
  for (let i = 0; i < 1450; i++) {
    const z = 18 - rand() * 1065; // from +18 to -1047
    const cx = storyPathCenterX(z);
    const side = rand() > 0.5 ? 1 : -1;
    const offset = STORY_PATH_HALF_WIDTH + 1.2 + Math.pow(rand(), 1.35) * 30;
    const x = cx + side * offset;

    if (isBlocked(x, z, 1.9)) continue;

    const scale = 0.88 + rand() * 0.48;
    const trunkRadius = 0.42 * scale;
    const y = groundHeightAt(x, z);
    trees.push({
      x,
      z,
      y,
      scale,
      rotationY: rand() * Math.PI * 2,
      trunkRadius,
      kind: rand() > 0.2 ? 'pine' : 'birch',
      tintIndex: Math.floor(rand() * 5),
    });
    obstacles.push({ x, z, radius: trunkRadius + 0.35 });
  }

  // Rocks along trail shoulders
  for (let i = 0; i < 200; i++) {
    const z = 10 - rand() * 1020;
    const cx = storyPathCenterX(z);
    const side = rand() > 0.5 ? 1 : -1;
    const x = cx + side * (STORY_PATH_HALF_WIDTH + 0.6 + rand() * 8);
    const rad = 0.65 + rand() * 0.85;
    if (isBlocked(x, z, rad + 0.6)) continue;

    const y = groundHeightAt(x, z);
    rocks.push({
      x,
      z,
      y,
      scaleX: rad * (0.9 + rand() * 0.35),
      scaleY: rad * (0.55 + rand() * 0.3),
      scaleZ: rad * (0.9 + rand() * 0.35),
      rotationY: rand() * Math.PI * 2,
      radius: rad * 0.85,
    });
    obstacles.push({ x, z, radius: rad * 0.9 });
  }

  return { trees, rocks, obstacles };
}
