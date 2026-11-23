import * as THREE from 'three';
import {
  ForestLayout,
  groundHeightAt,
  STORY_END_Z,
  STORY_PATH_HALF_WIDTH,
  STORY_START_Z,
  storyPathCenterX,
} from './terrain';
import { createBarkTexture, createForestGroundTexture } from './textures';

export interface ForestSceneObjects {
  terrain: THREE.Mesh;
  grassMesh: THREE.InstancedMesh;
  fireflies: THREE.Points;
  worldGroup: THREE.Group;
  disposables: Array<{ dispose: () => void }>;
}

const PINE_TINTS = [0x1f5c2e, 0x266b34, 0x194b25, 0x2f7539, 0x225736];
const BIRCH_TINTS = [0x3d8a32, 0x569c36, 0x4a8f2e, 0x6ba638, 0x3a7d2c];

export function buildForestEnvironment(
  scene: THREE.Scene,
  layout: ForestLayout,
  anisotropy: number,
  isSoftwareGl: boolean,
  isStoryTrail = false
): ForestSceneObjects {
  const disposables: Array<{ dispose: () => void }> = [];
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // 1. Displaced Forest Terrain (wider & longer when in Story Act 1 1000m winding path!)
  const widthX = isStoryTrail ? 160 : 210;
  const lengthZ = isStoryTrail ? 1140 : 210;
  const centerZ = isStoryTrail ? -515 : 0;

  const terrainGeo = new THREE.PlaneGeometry(
    widthX,
    lengthZ,
    isStoryTrail ? 70 : 110,
    isStoryTrail ? 360 : 110
  );
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(0, 0, centerZ);

  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const groundTex = createForestGroundTexture(anisotropy);
  if (isStoryTrail) {
    groundTex.repeat.set(22, 160);
  }
  const terrainMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.92,
    metalness: 0.02,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = !isSoftwareGl;
  worldGroup.add(terrain);
  disposables.push(terrainGeo, groundTex, terrainMat);

  // 1b. Winding Dirt Trail Ribbon for Story Act 1
  if (isStoryTrail) {
    const segs = 640;
    const trailW = STORY_PATH_HALF_WIDTH * 1.45;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const z = STORY_START_Z + 6 - t * (Math.abs(STORY_END_Z) + 18);
      const cx = storyPathCenterX(z);
      const nextZ = z - 0.5;
      const nextCx = storyPathCenterX(nextZ);
      // Perpendicular normal in XZ
      const dx = nextCx - cx;
      const dz = nextZ - z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;

      const lx = cx - nx * trailW * 0.5;
      const lz = z - nz * trailW * 0.5;
      const rx = cx + nx * trailW * 0.5;
      const rz = z + nz * trailW * 0.5;

      positions.push(lx, groundHeightAt(lx, lz) + 0.04, lz);
      positions.push(rx, groundHeightAt(rx, rz) + 0.04, rz);

      if (i < segs) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    trailGeo.setIndex(indices);
    trailGeo.computeVertexNormals();

    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x4b3b2b,
      roughness: 0.95,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.receiveShadow = !isSoftwareGl;
    worldGroup.add(trailMesh);
    disposables.push(trailGeo, trailMat);
  }

  // 2. Instanced Composite Trees (Pine & Birch)
  const pineTrees = layout.trees.filter((t) => t.kind === 'pine');
  const birchTrees = layout.trees.filter((t) => t.kind === 'birch');
  const barkTex = createBarkTexture(anisotropy);
  disposables.push(barkTex);

  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();

  if (pineTrees.length > 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 3.2, 8);
    trunkGeo.translate(0, 1.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.9,
      metalness: 0.03,
    });
    const pineTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, pineTrees.length);
    pineTrunks.castShadow = !isSoftwareGl;
    pineTrunks.receiveShadow = !isSoftwareGl;

    const tier1Geo = new THREE.ConeGeometry(2.15, 3.4, 8);
    tier1Geo.translate(0, 3.6, 0);
    const tier2Geo = new THREE.ConeGeometry(1.65, 2.9, 8);
    tier2Geo.translate(0, 5.4, 0);
    const tier3Geo = new THREE.ConeGeometry(1.12, 2.4, 8);
    tier3Geo.translate(0, 7.0, 0);

    const pineLeafMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.02,
    });
    const tier1 = new THREE.InstancedMesh(tier1Geo, pineLeafMat, pineTrees.length);
    const tier2 = new THREE.InstancedMesh(tier2Geo, pineLeafMat, pineTrees.length);
    const tier3 = new THREE.InstancedMesh(tier3Geo, pineLeafMat, pineTrees.length);
    tier1.castShadow = !isSoftwareGl;
    tier2.castShadow = !isSoftwareGl;
    tier3.castShadow = !isSoftwareGl;

    for (let i = 0; i < pineTrees.length; i++) {
      const t = pineTrees[i];
      dummy.position.set(t.x, t.y - 0.15, t.z);
      dummy.rotation.set(0, t.rotationY, 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();

      pineTrunks.setMatrixAt(i, dummy.matrix);
      tier1.setMatrixAt(i, dummy.matrix);
      tier2.setMatrixAt(i, dummy.matrix);
      tier3.setMatrixAt(i, dummy.matrix);

      tmpColor.setHex(PINE_TINTS[t.tintIndex % PINE_TINTS.length]);
      tier1.setColorAt(i, tmpColor);
      tier2.setColorAt(i, tmpColor.clone().multiplyScalar(1.06));
      tier3.setColorAt(i, tmpColor.clone().multiplyScalar(1.12));
    }

    for (const im of [pineTrunks, tier1, tier2, tier3]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      worldGroup.add(im);
    }

    disposables.push(trunkGeo, trunkMat, tier1Geo, tier2Geo, tier3Geo, pineLeafMat);
  }

  if (birchTrees.length > 0) {
    const bTrunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 3.8, 8);
    bTrunkGeo.translate(0, 1.9, 0);
    const bTrunkMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.85,
      metalness: 0.02,
    });
    const birchTrunks = new THREE.InstancedMesh(
      bTrunkGeo,
      bTrunkMat,
      birchTrees.length
    );
    birchTrunks.castShadow = !isSoftwareGl;

    const crownGeo = new THREE.DodecahedronGeometry(1.75, 1);
    crownGeo.translate(0, 4.6, 0);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.02,
    });
    const birchCrowns = new THREE.InstancedMesh(crownGeo, crownMat, birchTrees.length);
    birchCrowns.castShadow = !isSoftwareGl;

    for (let i = 0; i < birchTrees.length; i++) {
      const t = birchTrees[i];
      dummy.position.set(t.x, t.y - 0.15, t.z);
      dummy.rotation.set(0, t.rotationY, 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      birchTrunks.setMatrixAt(i, dummy.matrix);
      birchCrowns.setMatrixAt(i, dummy.matrix);
      tmpColor.setHex(BIRCH_TINTS[t.tintIndex % BIRCH_TINTS.length]);
      birchCrowns.setColorAt(i, tmpColor);
    }

    birchTrunks.instanceMatrix.needsUpdate = true;
    birchCrowns.instanceMatrix.needsUpdate = true;
    if (birchCrowns.instanceColor) birchCrowns.instanceColor.needsUpdate = true;
    birchTrunks.computeBoundingSphere();
    birchCrowns.computeBoundingSphere();
    worldGroup.add(birchTrunks, birchCrowns);

    disposables.push(bTrunkGeo, bTrunkMat, crownGeo, crownMat);
  }

  // 3. Instanced Mossy Rocks
  if (layout.rocks.length > 0) {
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.9,
      metalness: 0.05,
    });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, layout.rocks.length);
    rockInst.castShadow = !isSoftwareGl;
    rockInst.receiveShadow = !isSoftwareGl;

    for (let i = 0; i < layout.rocks.length; i++) {
      const r = layout.rocks[i];
      dummy.position.set(r.x, r.y + r.scaleY * 0.35, r.z);
      dummy.rotation.set(0.2, r.rotationY, 0.1);
      dummy.scale.set(r.scaleX, r.scaleY, r.scaleZ);
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
      tmpColor.setHex(i % 2 === 0 ? 0x6b7280 : 0x526058);
      rockInst.setColorAt(i, tmpColor);
    }
    rockInst.instanceMatrix.needsUpdate = true;
    if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
    rockInst.computeBoundingSphere();
    worldGroup.add(rockInst);
    disposables.push(rockGeo, rockMat);
  }

  // 4. Instanced Forest Grass Tufts
  const grassCount = isStoryTrail ? 1400 : 460;
  const grassGeo = new THREE.ConeGeometry(0.11, 0.48, 4);
  grassGeo.translate(0, 0.24, 0);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
  });
  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  let seed = isStoryTrail ? 888 : 777;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < grassCount; i++) {
    let gx = 0;
    let gz = 0;
    if (isStoryTrail) {
      gz = 10 - rand() * 1025;
      const cx = storyPathCenterX(gz);
      const side = rand() > 0.5 ? 1 : -1;
      gx = cx + side * (STORY_PATH_HALF_WIDTH * 0.7 + rand() * 14);
    } else {
      const ang = rand() * Math.PI * 2;
      const rad = 2 + Math.sqrt(rand()) * 60;
      gx = Math.cos(ang) * rad;
      gz = Math.sin(ang) * rad;
    }
    const gy = groundHeightAt(gx, gz);
    dummy.position.set(gx, gy, gz);
    dummy.rotation.set(
      (rand() - 0.5) * 0.25,
      rand() * Math.PI * 2,
      (rand() - 0.5) * 0.25
    );
    const s = 0.75 + rand() * 0.7;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);
    tmpColor.setHex(rand() > 0.5 ? 0x4d7c0f : 0x3f6212);
    grassMesh.setColorAt(i, tmpColor);
  }
  grassMesh.instanceMatrix.needsUpdate = true;
  if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
  grassMesh.computeBoundingSphere();
  worldGroup.add(grassMesh);
  disposables.push(grassGeo, grassMat);

  // 5. Drifting Golden Forest Fireflies / Spores
  const fireflyCount = isStoryTrail ? 680 : 140;
  const ffPos = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    let x = 0;
    let z = 0;
    if (isStoryTrail) {
      z = 10 - rand() * 1020;
      x = storyPathCenterX(z) + (rand() - 0.5) * 26;
    } else {
      const ang = rand() * Math.PI * 2;
      const r = 3 + rand() * 56;
      x = Math.cos(ang) * r;
      z = Math.sin(ang) * r;
    }
    ffPos[i * 3] = x;
    ffPos[i * 3 + 1] = groundHeightAt(x, z) + 0.8 + rand() * 4.2;
    ffPos[i * 3 + 2] = z;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({
    color: 0xfde047,
    size: 0.16,
    transparent: true,
    opacity: 0.82,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  worldGroup.add(fireflies);
  disposables.push(ffGeo, ffMat);

  return { terrain, grassMesh, fireflies, worldGroup, disposables };
}
