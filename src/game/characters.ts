import * as THREE from 'three';
import {
  createCamoPantsTexture,
  createContactShadowTexture,
  createNameTagSprite,
  createNikitysFaceTexture,
  createNikitysShirtTexture,
  createProstophilyaFaceTexture,
  createRonerFaceTexture,
  createRonerTorsoTexture,
  createSashaFaceTexture,
  createSashaTorsoTexture,
} from './textures';

export interface RobloxRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftWing?: THREE.Group;
  rightWing?: THREE.Group;
  blindfold?: THREE.Group;
  angryBrows?: THREE.Group;
  visor?: THREE.Group;
  lightningEyes?: THREE.Group;
  nameTag: THREE.Sprite;
  walkPhase: number;
}

function makeShadowPlane(shadowTex: THREE.Texture, radius = 0.85): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

function enableShadows(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}

function createBaseRobloxLimbs(
  torsoMat: THREE.Material | THREE.Material[],
  armMat: THREE.Material,
  handMat: THREE.Material,
  legMat: THREE.Material,
  shoeMat: THREE.Material,
  soleMat: THREE.Material
) {
  const bodyPivot = new THREE.Group();

  // Legs (0.76 tall, soles sit flush at y=0 inside bodyPivot)
  const makeLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.78, 0);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.62, 0.38), legMat);
    upper.position.y = -0.31;
    legPivot.add(upper);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.44), shoeMat);
    shoe.position.set(0, -0.69, 0.03);
    legPivot.add(shoe);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.04, 0.46), soleMat);
    sole.position.set(0, -0.76, 0.03);
    legPivot.add(sole);

    return legPivot;
  };

  const leftLeg = makeLeg(-0.21);
  const rightLeg = makeLeg(0.21);
  bodyPivot.add(leftLeg, rightLeg);

  // Torso (sits from y=0.78 to y=1.62)
  const torso = new THREE.Group();
  torso.position.set(0, 1.2, 0);
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.84, 0.44), torsoMat);
  torso.add(torsoMesh);
  bodyPivot.add(torso);

  // Arms (pivot at shoulder y=1.56)
  const makeArm = (xOffset: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 1.56, 0);

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.66, 0.36), armMat);
    sleeve.position.y = -0.3;
    armPivot.add(sleeve);

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.22, 0.32), handMat);
    hand.position.y = -0.72;
    armPivot.add(hand);

    return armPivot;
  };

  const leftArm = makeArm(-0.62);
  const rightArm = makeArm(0.62);
  bodyPivot.add(leftArm, rightArm);

  // Head pivot at neck y=1.62
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0);
  bodyPivot.add(head);

  return { bodyPivot, torso, leftArm, rightArm, leftLeg, rightLeg, head };
}

/**
 * Character 1 (Player): nikitys6666
 * - Fiery phoenix wings (layered red/orange/gold feathers)
 * - Green furry hood + ears + white visor + black respirator with glowing green cheek dots
 * - Dark hoodie with glowing cyan/white forest deer spirit graphic
 */
export function createNikitys6666(anisotropy: number): RobloxRig {
  const root = new THREE.Group();
  const shadowTex = createContactShadowTexture();
  root.add(makeShadowPlane(shadowTex, 0.92));

  const shirtTex = createNikitysShirtTexture(anisotropy);
  const faceTex = createNikitysFaceTexture(anisotropy);
  const pantsTex = createCamoPantsTexture(anisotropy);

  const blackCloth = new THREE.MeshStandardMaterial({
    color: 0x1b1d24,
    roughness: 0.78,
    metalness: 0.05,
  });
  const shirtFrontMat = new THREE.MeshStandardMaterial({
    map: shirtTex,
    roughness: 0.65,
    metalness: 0.08,
  });
  const torsoMats = [
    blackCloth,
    blackCloth,
    blackCloth,
    blackCloth,
    shirtFrontMat,
    blackCloth,
  ];
  const peachHand = new THREE.MeshStandardMaterial({
    color: 0xf1c7a5,
    roughness: 0.55,
    metalness: 0.02,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    map: pantsTex,
    roughness: 0.82,
    metalness: 0.05,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
    metalness: 0.1,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
    metalness: 0.05,
  });

  const { bodyPivot, torso, leftArm, rightArm, leftLeg, rightLeg, head } =
    createBaseRobloxLimbs(torsoMats, blackCloth, peachHand, pantsMat, shoeMat, soleMat);

  // Head cube with visor/mask front (+Z is forward for character)
  const headBaseMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.72,
    metalness: 0.05,
  });
  const faceFrontMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.3,
    metalness: 0.25,
  });
  const headCube = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 0.6), [
    headBaseMat,
    headBaseMat,
    headBaseMat,
    headBaseMat,
    faceFrontMat,
    headBaseMat,
  ]);
  head.add(headCube);

  // Green furry hood & animal ears
  const hoodGreen = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.75,
    metalness: 0.04,
  });
  const hoodDark = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.8,
    metalness: 0.04,
  });
  const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.68), hoodDark);
  hoodTop.position.set(0, 0.3, -0.02);
  head.add(hoodTop);

  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.56), hoodGreen);
  scarf.position.set(0, 0.42, 0.02);
  torso.add(scarf);

  const earGeo = new THREE.ConeGeometry(0.14, 0.28, 4);
  const earL = new THREE.Mesh(earGeo, hoodGreen);
  earL.position.set(-0.24, 0.48, 0.02);
  earL.rotation.z = 0.22;
  const earR = new THREE.Mesh(earGeo, hoodGreen);
  earR.position.set(0.24, 0.48, 0.02);
  earR.rotation.z = -0.22;
  head.add(earL, earR);

  // Fiery Phoenix Wings attached to torso back (-Z)
  const makeWing = (side: -1 | 1) => {
    const wing = new THREE.Group();
    wing.position.set(side * 0.24, 0.18, -0.26);

    const flameRed = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0x9a3412,
      emissiveIntensity: 0.35,
      roughness: 0.42,
      metalness: 0.15,
    });
    const flameGold = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.25,
    });

    const plumeOffsets = [
      { x: 0.42, y: 0.52, rot: 0.45, sx: 0.62, sy: 0.92, mat: flameRed },
      { x: 0.68, y: 0.28, rot: 0.78, sx: 0.55, sy: 0.85, mat: flameGold },
      { x: 0.52, y: -0.05, rot: 1.05, sx: 0.48, sy: 0.72, mat: flameRed },
      { x: 0.28, y: -0.28, rot: 1.25, sx: 0.4, sy: 0.55, mat: flameGold },
    ];
    for (const p of plumeOffsets) {
      const feather = new THREE.Mesh(
        new THREE.BoxGeometry(p.sx, p.sy, 0.09),
        p.mat
      );
      feather.position.set(side * p.x, p.y, -0.08);
      feather.rotation.z = -side * p.rot;
      feather.rotation.y = side * 0.22;
      wing.add(feather);
    }
    return wing;
  };

  const leftWing = makeWing(-1);
  const rightWing = makeWing(1);
  torso.add(leftWing, rightWing);

  enableShadows(bodyPivot);
  root.add(bodyPivot);

  const nameTag = createNameTagSprite('nikitys6666', '#86efac');
  nameTag.position.set(0, 2.75, 0);
  root.add(nameTag);

  return {
    root,
    bodyPivot,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftWing,
    rightWing,
    nameTag,
    walkPhase: 0,
  };
}

/**
 * Character 2 (Chaser 1): RONER_552
 * - Purple round sunglasses, classic smile, brown messy hair, white beanie with tiny blue-yellow pin
 * - Black open jacket over light blue shirt + white lanyard/badge
 * - Pale white arms, dark speckled pants, white sneakers
 */
export function createRoner552(anisotropy: number): RobloxRig {
  const root = new THREE.Group();
  root.add(makeShadowPlane(createContactShadowTexture(), 0.85));

  const torsoTex = createRonerTorsoTexture(anisotropy);
  const faceTex = createRonerFaceTexture(anisotropy);
  const pantsTex = createCamoPantsTexture(anisotropy);

  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.72,
    metalness: 0.06,
  });
  const torsoFrontMat = new THREE.MeshStandardMaterial({
    map: torsoTex,
    roughness: 0.6,
    metalness: 0.08,
  });
  const torsoMats = [
    jacketMat,
    jacketMat,
    jacketMat,
    jacketMat,
    torsoFrontMat,
    jacketMat,
  ];
  const paleSkin = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
    metalness: 0.02,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    map: pantsTex,
    roughness: 0.85,
    metalness: 0.04,
  });
  const whiteShoe = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.08,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.45,
    metalness: 0.05,
  });

  const { bodyPivot, torso, leftArm, rightArm, leftLeg, rightLeg, head } =
    createBaseRobloxLimbs(torsoMats, jacketMat, paleSkin, pantsMat, whiteShoe, soleMat);

  const faceFrontMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.38,
    metalness: 0.15,
  });
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.56, 0.56), [
    paleSkin,
    paleSkin,
    paleSkin,
    paleSkin,
    faceFrontMat,
    paleSkin,
  ]);
  head.add(headMesh);

  // Brown messy hair tuft + white beanie cap + tiny blue-yellow pin
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.78,
    metalness: 0.04,
  });
  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.34), hairMat);
  hairBack.position.set(0, 0.1, -0.14);
  const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.24), hairMat);
  hairBangs.position.set(0, 0.26, 0.18);
  hairBangs.rotation.z = 0.08;
  head.add(hairBack, hairBangs);

  const beanieMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.65,
    metalness: 0.04,
  });
  const beanie = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), beanieMat);
  beanie.position.set(0, 0.38, -0.02);
  head.add(beanie);

  const pinBlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 })
  );
  pinBlue.position.set(0.24, 0.5, 0.08);
  const pinYellow = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
  );
  pinYellow.position.set(0.24, 0.45, 0.08);
  head.add(pinBlue, pinYellow);

  // Angry furrowed eyebrows (toggled on in Act 2)
  const angryBrows = new THREE.Group();
  const browMat = new THREE.MeshStandardMaterial({ color: 0x3b1d0a, roughness: 0.65 });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.06), browMat);
  browL.position.set(-0.13, 0.16, 0.31);
  browL.rotation.z = -0.34;
  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.06), browMat);
  browR.position.set(0.13, 0.16, 0.31);
  browR.rotation.z = 0.34;
  angryBrows.add(browL, browR);
  angryBrows.visible = false;
  head.add(angryBrows);

  enableShadows(bodyPivot);
  root.add(bodyPivot);

  const nameTag = createNameTagSprite('RONER_552', '#fde047');
  nameTag.position.set(0, 2.75, 0);
  root.add(nameTag);

  return {
    root,
    bodyPivot,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    angryBrows,
    nameTag,
    walkPhase: 1.5,
  };
}

/**
 * Character 3 (Chaser 2): sasha55k_XL
 * - Black wide-brimmed hat with neon rainbow rim & dangling tassels
 * - White crystal/ice wings on back + rainbow headphones around neck
 * - Black-to-electric-blue flame gradient hoodie + cat bag + gold hip charm
 */
export function createSasha55kXL(anisotropy: number): RobloxRig {
  const root = new THREE.Group();
  root.add(makeShadowPlane(createContactShadowTexture(), 0.9));

  const torsoTex = createSashaTorsoTexture(anisotropy);
  const faceTex = createSashaFaceTexture(anisotropy);

  const darkHoodie = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
    metalness: 0.08,
  });
  const blueSleeve = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.55,
    metalness: 0.12,
  });
  const torsoFront = new THREE.MeshStandardMaterial({
    map: torsoTex,
    roughness: 0.55,
    metalness: 0.1,
  });
  const torsoMats = [
    darkHoodie,
    darkHoodie,
    darkHoodie,
    blueSleeve,
    torsoFront,
    darkHoodie,
  ];
  const paleSkin = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.45,
    metalness: 0.02,
  });
  const darkPants = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
    metalness: 0.05,
  });
  const darkShoe = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.45,
    metalness: 0.12,
  });

  const { bodyPivot, torso, leftArm, rightArm, leftLeg, rightLeg, head } =
    createBaseRobloxLimbs(
      torsoMats,
      blueSleeve,
      paleSkin,
      darkPants,
      darkShoe,
      darkPants
    );

  // Head + white hair
  const faceFront = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.45,
    metalness: 0.05,
  });
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.56, 0.56), [
    paleSkin,
    paleSkin,
    paleSkin,
    paleSkin,
    faceFront,
    paleSkin,
  ]);
  head.add(headMesh);

  const whiteHair = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.36, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 })
  );
  whiteHair.position.set(0, 0.1, -0.09);
  head.add(whiteHair);

  // Iconic wide-brimmed black hat with neon magenta/cyan rim + tassels
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.42,
    metalness: 0.25,
  });
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.82, 0.08, 12), hatMat);
  hatBrim.position.set(0, 0.32, 0);
  const hatCrown = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.42, 12), hatMat);
  hatCrown.position.set(0, 0.55, 0);
  const neonRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.028, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xa855f7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.4,
    })
  );
  neonRim.rotation.x = Math.PI / 2;
  neonRim.position.set(0, 0.3, 0);
  head.add(hatBrim, hatCrown, neonRim);

  // Dangling neon tassels on left/right of hat
  const tasselMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.7,
    roughness: 0.25,
  });
  for (const side of [-1, 1]) {
    const tassel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.05), tasselMat);
    tassel.position.set(side * 0.58, 0.08, 0.15);
    head.add(tassel);
  }

  // Rainbow-accented headphones around neck
  const neckPhones = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.07, 8, 18),
    new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.35,
    })
  );
  neckPhones.rotation.x = Math.PI / 2.2;
  neckPhones.position.set(0, 0.41, 0.04);
  torso.add(neckPhones);

  // Gold hip charm (sword/key)
  const goldCharm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.34, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.2,
      metalness: 0.88,
    })
  );
  goldCharm.position.set(0.46, -0.32, 0.14);
  goldCharm.rotation.z = -0.35;
  torso.add(goldCharm);

  // White crystal/ice wings on back
  const iceMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0xbae6fd,
    emissiveIntensity: 0.25,
    roughness: 0.22,
    metalness: 0.35,
  });
  const makeIceWing = (side: -1 | 1) => {
    const wing = new THREE.Group();
    wing.position.set(side * 0.22, 0.15, -0.25);
    const shard1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.06), iceMat);
    shard1.position.set(side * 0.38, 0.25, -0.06);
    shard1.rotation.z = side * 0.35;
    const shard2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.06), iceMat);
    shard2.position.set(side * 0.34, 0.0, -0.06);
    shard2.rotation.z = side * 0.05;
    const shard3 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.06), iceMat);
    shard3.position.set(side * 0.24, -0.22, -0.06);
    shard3.rotation.z = -side * 0.25;
    wing.add(shard1, shard2, shard3);
    return wing;
  };
  const leftWing = makeIceWing(-1);
  const rightWing = makeIceWing(1);
  torso.add(leftWing, rightWing);

  // Act 2 Blindfold (перевязанные глаза) + Angry furrowed eyebrows
  const blindfold = new THREE.Group();
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    roughness: 0.85,
    metalness: 0.05,
  });
  const wrapBand = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.17, 0.62), clothMat);
  wrapBand.position.set(0, 0.04, 0.0);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.12), clothMat);
  knot.position.set(0, 0.04, -0.33);
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.04), clothMat);
  tailL.position.set(-0.07, -0.09, -0.36);
  tailL.rotation.z = 0.25;
  const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.04), clothMat);
  tailR.position.set(0.07, -0.08, -0.36);
  tailR.rotation.z = -0.25;
  blindfold.add(wrapBand, knot, tailL, tailR);
  blindfold.visible = false;
  head.add(blindfold);

  const angryBrows = new THREE.Group();
  const browMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.06), browMat);
  browL.position.set(-0.13, 0.16, 0.31);
  browL.rotation.z = -0.36;
  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.06), browMat);
  browR.position.set(0.13, 0.16, 0.31);
  browR.rotation.z = 0.36;
  angryBrows.add(browL, browR);
  angryBrows.visible = false;
  head.add(angryBrows);

  // Act 4 Tactical Glowing White Visor (ONLY Sasha wears this!)
  const visor = new THREE.Group();
  const visorFrameMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.75,
    roughness: 0.25,
  });
  const visorGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf8fafc,
    emissiveIntensity: 1.65,
    metalness: 0.2,
    roughness: 0.08,
  });
  const visorLens = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.15, 0.12), visorGlassMat);
  visorLens.position.set(0, 0.04, 0.27);
  const visorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.19, 0.06), visorFrameMat);
  visorFrame.position.set(0, 0.04, 0.245);
  const visorStrap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.59), visorFrameMat);
  visorStrap.position.set(0, 0.04, 0.0);
  visor.add(visorStrap, visorFrame, visorLens);
  visor.visible = false;
  head.add(visor);

  // Act 4 Wave 7 Boss Sasha 67: Glowing Lightning Eyes & Crackling Bolts
  const lightningEyes = new THREE.Group();
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 3.2,
    roughness: 0.1,
  });
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.6,
    roughness: 0.15,
  });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), eyeGlowMat);
    eye.position.set(side * 0.13, 0.05, 0.305);
    lightningEyes.add(eye);

    const bolt1 = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.22, 0.04), boltMat);
    bolt1.position.set(side * 0.21, 0.11, 0.33);
    bolt1.rotation.z = side * -0.52;
    const bolt2 = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.18, 0.04), boltMat);
    bolt2.position.set(side * 0.29, 0.22, 0.33);
    bolt2.rotation.z = side * 0.42;
    lightningEyes.add(bolt1, bolt2);
  }
  lightningEyes.visible = false;
  head.add(lightningEyes);

  enableShadows(bodyPivot);
  root.add(bodyPivot);

  const nameTag = createNameTagSprite('sasha55k_XL', '#7dd3fc');
  nameTag.position.set(0, 2.95, 0);
  root.add(nameTag);

  return {
    root,
    bodyPivot,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftWing,
    rightWing,
    blindfold,
    angryBrows,
    visor,
    lightningEyes,
    nameTag,
    walkPhase: 3.1,
  };
}

export function animateRobloxCharacter(
  rig: RobloxRig,
  speedNorm: number,
  dt: number,
  elapsed: number,
  isAirborne: boolean,
  isDead: boolean,
  isChaser = false,
  isRetreating = false
): void {
  if (isDead) {
    // Tumble onto the ground dramatically
    rig.bodyPivot.rotation.x = THREE.MathUtils.damp(
      rig.bodyPivot.rotation.x,
      -Math.PI / 2,
      10,
      dt
    );
    rig.bodyPivot.position.y = THREE.MathUtils.damp(
      rig.bodyPivot.position.y,
      0.34,
      10,
      dt
    );
    rig.leftArm.rotation.x = -1.2;
    rig.rightArm.rotation.x = -1.5;
    return;
  }

  rig.bodyPivot.rotation.x = THREE.MathUtils.damp(rig.bodyPivot.rotation.x, 0, 12, dt);

  if (speedNorm > 0.05) {
    rig.walkPhase += dt * (7.5 + speedNorm * 6.5);
    const swing = Math.sin(rig.walkPhase) * Math.min(1.05, 0.55 + speedNorm * 0.45);
    const bob = Math.abs(Math.cos(rig.walkPhase)) * 0.09 * speedNorm;

    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;

    if (isRetreating) {
      // Arms shield face from the blinding flashlight beam!
      rig.leftArm.rotation.x = -2.2 + Math.sin(rig.walkPhase * 1.6) * 0.15;
      rig.rightArm.rotation.x = -2.35 - Math.sin(rig.walkPhase * 1.6) * 0.15;
    } else if (isChaser) {
      // Chasers reach forward menacingly while running!
      rig.leftArm.rotation.x = -1.15 + Math.sin(rig.walkPhase * 1.4) * 0.25;
      rig.rightArm.rotation.x = -1.15 - Math.sin(rig.walkPhase * 1.4) * 0.25;
    } else {
      rig.leftArm.rotation.x = -swing * 0.85;
      rig.rightArm.rotation.x = swing * 0.85;
    }

    rig.bodyPivot.position.y = isAirborne ? 0 : bob;
    rig.torso.rotation.z = Math.sin(rig.walkPhase) * 0.04 * speedNorm;
    rig.head.rotation.y = isRetreating
      ? Math.sin(elapsed * 16) * 0.22
      : Math.sin(rig.walkPhase * 0.5) * 0.06;
  } else {
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0, 10, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0, 10, dt);
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, 0, 10, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, 0, 10, dt);
    rig.bodyPivot.position.y = THREE.MathUtils.damp(rig.bodyPivot.position.y, 0, 10, dt);
    rig.torso.rotation.z = Math.sin(elapsed * 2) * 0.02;
    rig.head.rotation.y = Math.sin(elapsed * 1.4) * 0.08;
  }

  // Wing flap animation
  if (rig.leftWing && rig.rightWing) {
    const flapSpeed = speedNorm > 0.1 ? 8.5 : 3.2;
    const flapAmp = speedNorm > 0.1 ? 0.24 : 0.1;
    const flap = Math.sin(elapsed * flapSpeed) * flapAmp;
    rig.leftWing.rotation.y = 0.2 + flap;
    rig.rightWing.rotation.y = -0.2 - flap;
  }
}

export function animateRobloxSeated(
  rig: RobloxRig,
  elapsed: number,
  phaseOffset = 0
): void {
  rig.bodyPivot.rotation.x = 0;
  rig.bodyPivot.position.y = -0.26;
  rig.leftLeg.rotation.x = -1.35;
  rig.rightLeg.rotation.x = -1.35;
  // Gentle eating / sipping tea motion
  const sip = Math.sin(elapsed * 2.4 + phaseOffset);
  rig.rightArm.rotation.x = -0.78 - Math.max(0, sip) * 0.42;
  rig.leftArm.rotation.x = -0.58 - Math.max(0, -sip) * 0.25;
  rig.torso.rotation.z = Math.sin(elapsed * 1.4 + phaseOffset) * 0.03;
  rig.head.rotation.y = Math.sin(elapsed * 1.1 + phaseOffset) * 0.14;
  rig.head.rotation.x = Math.sin(elapsed * 2.2 + phaseOffset) * 0.05;
}

export interface FlashlightRig {
  group: THREE.Group;
  beamCone: THREE.Mesh;
  lensMat: THREE.MeshStandardMaterial;
}

/**
 * Composite 3D tactical flashlight (handle, flared bezel, glowing lens, volumetric beam cone)
 * Pointing toward -Z in local space so it aligns directly with camera/aim direction.
 * When withFirstPersonArm = true, attaches Nikita's Roblox sleeve, green cuff, and hand gripping the handle.
 */
export function createFlashlightProp(withFirstPersonArm = false): FlashlightRig {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.72,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.82,
    metalness: 0.12,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.4,
    roughness: 0.35,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xfef3c7,
    emissiveIntensity: 2.2,
    roughness: 0.15,
    metalness: 0.1,
  });

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.068, 0.25), gripMat);
  group.add(handle);

  // Flatter, squared-off tactical flashlight head (not conical/triangular)
  const headHousing = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.086, 0.11), bodyMat);
  headHousing.position.z = -0.17;
  group.add(headHousing);

  const bezelRim = new THREE.Mesh(new THREE.BoxGeometry(0.126, 0.094, 0.024), gripMat);
  bezelRim.position.z = -0.22;
  group.add(bezelRim);

  const switchBtn = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.038), accentMat);
  switchBtn.position.set(0, 0.042, -0.05);
  group.add(switchBtn);

  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.098, 0.068), lensMat);
  lens.rotation.y = Math.PI;
  lens.position.z = -0.233;
  group.add(lens);

  if (withFirstPersonArm) {
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

    const armPivot = new THREE.Group();
    // Arm reaches from bottom-right (+X, -Y, +Z) up to the flashlight grip
    armPivot.position.set(0.04, -0.03, 0.04);
    armPivot.rotation.set(0.32, -0.24, -0.18);

    // Roblox block fist gripping the flashlight handle
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.11, 0.12), handMat);
    palm.position.set(0.01, -0.005, 0.02);
    armPivot.add(palm);

    // Curled fingers wrapping over/under the handle
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.05, 0.09), handMat);
    fingers.position.set(-0.028, 0.028, -0.01);
    armPivot.add(fingers);

    // Thumb resting near the green power button
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.042, 0.075), handMat);
    thumb.position.set(-0.038, 0.052, -0.035);
    thumb.rotation.x = 0.25;
    armPivot.add(thumb);

    // Green hoodie cuff matching nikitys6666
    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.135, 0.055), cuffMat);
    cuff.position.set(0.01, -0.01, 0.105);
    armPivot.add(cuff);

    // Dark forearm sleeve extending back toward the camera shoulder
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.145, 0.36), sleeveMat);
    forearm.position.set(0.015, -0.018, 0.31);
    armPivot.add(forearm);

    group.add(armPivot);
  }

  // Forward-pointing (-Z) squared & slightly flattened volumetric beam frustum
  const coneGeo = new THREE.CylinderGeometry(0.068, 2.25, 13.5, 4, 1, true);
  coneGeo.rotateY(Math.PI / 4);
  coneGeo.translate(0, -6.75, 0);
  coneGeo.rotateX(Math.PI / 2); // +PI/2 maps -Y to -Z (strictly forward!)
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfef3c7,
    transparent: true,
    opacity: 0.075,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beamCone = new THREE.Mesh(coneGeo, coneMat);
  beamCone.scale.set(1.15, 0.72, 1);
  beamCone.position.z = -0.23;
  group.add(beamCone);

  return { group, beamCone, lensMat };
}

/**
 * Collectible Mushroom: "ПРОСТОФИЛЯ" (Image 2)
 * Composite 3D porcini mushroom with brown glossy cap, cream underside,
 * stout tan stem with gnome face, pointing hand/finger, grass tufts,
 * and optional floating meme card sprite using the uploaded image.
 */
export function createProstophilyaMushroom(
  anisotropy: number,
  memeTexture: THREE.Texture | null,
  isGolden = false
): THREE.Group {
  const group = new THREE.Group();

  // Soft radial contact shadow
  group.add(makeShadowPlane(createContactShadowTexture(), 0.78));

  // Glowing collector ring on ground so mushrooms read clearly in the dark night forest
  const ringMat = new THREE.MeshBasicMaterial({
    color: isGolden ? 0xfacc15 : 0x4ade80,
    transparent: true,
    opacity: isGolden ? 0.85 : 0.65,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 24), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  // Grass tufts & pebbles around base
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x3f8f29,
    roughness: 0.85,
  });
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 4), grassMat);
    blade.position.set(Math.cos(ang) * 0.38, 0.15, Math.sin(ang) * 0.38);
    blade.rotation.z = -Math.cos(ang) * 0.35;
    blade.rotation.x = Math.sin(ang) * 0.35;
    group.add(blade);
  }

  // Stem with Prostophilya face
  const faceTex = createProstophilyaFaceTexture(anisotropy);
  const stemMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    color: isGolden ? 0xfef08a : 0xffffff,
    emissive: isGolden ? 0x713f12 : 0x162419,
    emissiveIntensity: isGolden ? 0.45 : 0.28,
    roughness: 0.58,
    metalness: isGolden ? 0.25 : 0.02,
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.76, 16), stemMat);
  stem.position.y = 0.38;
  stem.rotation.y = -Math.PI / 2; // align front face toward +Z
  stem.castShadow = true;
  group.add(stem);

  // Pointing hand & finger extending toward viewer (+Z)
  const skinMat = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xfde047 : 0xf1c29b,
    roughness: 0.5,
  });
  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
  fist.position.set(-0.24, 0.28, 0.36);
  const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 4, 8), skinMat);
  finger.rotation.x = Math.PI / 2;
  finger.position.set(-0.24, 0.31, 0.52);
  group.add(fist, finger);

  // Cream underside gills
  const gillMat = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xfef9c3 : 0xf5e8c8,
    emissive: 0x262015,
    emissiveIntensity: 0.22,
    roughness: 0.7,
  });
  const gills = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.28, 0.14, 20), gillMat);
  gills.position.y = 0.77;
  group.add(gills);

  // Glossy brown porcini cap (golden metallic if rare Golden Простофиля!)
  const capMat = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xfacc15 : 0x6b3e1b,
    emissive: isGolden ? 0x854d0e : 0x2a1406,
    emissiveIntensity: isGolden ? 0.55 : 0.24,
    roughness: isGolden ? 0.2 : 0.32,
    metalness: isGolden ? 0.75 : 0.08,
  });
  const capPoints = [
    new THREE.Vector2(0.0, 0.42),
    new THREE.Vector2(0.32, 0.39),
    new THREE.Vector2(0.58, 0.24),
    new THREE.Vector2(0.7, 0.06),
    new THREE.Vector2(0.64, 0.0),
    new THREE.Vector2(0.0, 0.0),
  ];
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPoints, 20), capMat);
  cap.position.y = 0.8;
  cap.castShadow = true;
  group.add(cap);

  // Floating Простофиля meme billboard sprite above the cap using the user's real image!
  if (memeTexture) {
    const badgeMat = new THREE.SpriteMaterial({
      map: memeTexture,
      transparent: true,
      depthWrite: false,
    });
    const badge = new THREE.Sprite(badgeMat);
    badge.position.set(0, 1.72, 0);
    badge.scale.set(0.72, 0.62, 1);
    group.add(badge);
  }

  return group;
}

/**
 * Composite 3D Battery Pickup for recharging limited flashlight in Story Act 1.
 */
export function createBatteryProp(): THREE.Group {
  const group = new THREE.Group();

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.62, 20), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  const cellGroup = new THREE.Group();
  cellGroup.position.y = 0.55;
  cellGroup.rotation.z = 0.22;

  const darkShell = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.65,
  });
  const chargeBand = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 1.1,
    roughness: 0.25,
    metalness: 0.2,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.85,
  });

  const lowerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.38, 14),
    darkShell
  );
  lowerBody.position.y = -0.14;

  const midBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.24, 14),
    chargeBand
  );
  midBand.position.y = 0.14;

  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.08, 14),
    copperMat
  );
  topCap.position.y = 0.29;

  const terminal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.07, 12),
    copperMat
  );
  terminal.position.y = 0.36;

  cellGroup.add(lowerBody, midBand, topCap, terminal);
  group.add(cellGroup);

  return group;
}

export interface GateRig {
  group: THREE.Group;
  leftDoor: THREE.Group;
  rightDoor: THREE.Group;
  beaconLight: THREE.PointLight;
}

/**
 * Composite 3D Forest / Factory Gate with swinging doors, signboard, and beacon lantern.
 */
export function createGateProp(
  signText: string,
  isFactory: boolean
): GateRig {
  const group = new THREE.Group();

  const pillarMat = new THREE.MeshStandardMaterial({
    color: isFactory ? 0x3f3f46 : 0x4b3621,
    roughness: 0.78,
    metalness: isFactory ? 0.45 : 0.08,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: isFactory ? 0x27272a : 0x1e293b,
    roughness: 0.45,
    metalness: 0.7,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: isFactory ? 0xfacc15 : 0x4ade80,
    emissive: isFactory ? 0xca8a04 : 0x16a34a,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });

  // Left & Right Pillars
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 5.2, 0.95), pillarMat);
    pillar.position.set(side * 3.4, 2.6, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.35, 1.18), metalMat);
    cap.position.set(side * 3.4, 5.25, 0);
    group.add(cap);

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), accentMat);
    lantern.position.set(side * 3.4, 5.65, 0);
    group.add(lantern);
  }

  // Archway Crossbeam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.72, 0.75), pillarMat);
  beam.position.set(0, 4.95, 0);
  beam.castShadow = true;
  group.add(beam);

  // Signboard CanvasTexture
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isFactory ? '#1c1917' : '#14261c';
  ctx.fillRect(0, 0, 640, 144);
  ctx.strokeStyle = isFactory ? '#facc15' : '#4ade80';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 628, 132);
  ctx.fillStyle = isFactory ? '#fef08a' : '#dcfce7';
  const fontSize = signText.length > 16 ? 40 : 54;
  ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(signText, 320, 74);

  const signTex = new THREE.CanvasTexture(canvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  signTex.needsUpdate = true;

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 1.2, 0.2),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: isFactory ? 0x422006 : 0x052e16,
      emissiveIntensity: 0.55,
      roughness: 0.5,
    })
  );
  signMesh.position.set(0, 5.8, 0);
  group.add(signMesh);

  // Swinging Left & Right Gate Wings
  const makeWing = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 2.95, 0, 0);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.18, 0.14), metalMat);
    frame.position.set(-side * 1.42, 3.6, 0);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.22, 0.14), metalMat);
    bot.position.set(-side * 1.42, 0.35, 0);
    pivot.add(frame, bot);

    for (let b = 0; b < 5; b++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.35, 6), metalMat);
      bar.position.set(-side * (0.28 + b * 0.58), 1.98, 0);
      pivot.add(bar);
    }
    return pivot;
  };

  const leftDoor = makeWing(-1);
  const rightDoor = makeWing(1);
  group.add(leftDoor, rightDoor);

  const beaconLight = new THREE.PointLight(
    isFactory ? 0xfacc15 : 0x4ade80,
    isFactory ? 20 : 10,
    26,
    1.5
  );
  beaconLight.position.set(0, 4.4, 1.2);
  group.add(beaconLight);

  return { group, leftDoor, rightDoor, beaconLight };
}

export interface MivinaFactoryRig {
  group: THREE.Group;
  leftSlidingDoor: THREE.Mesh;
  rightSlidingDoor: THREE.Mesh;
  corridorLight: THREE.PointLight;
  bossEyes: THREE.Group;
}

/**
 * Factory entrance building "МИВИНА КОРПОРЕЙШЕН" placed just past STORY_END_Z.
 * Used as the Act 1 finish landmark AND the secret Act 2 entrance teaser!
 */
export function createMivinaFactoryEntrance(): MivinaFactoryRig {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.18,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.65,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.42,
    metalness: 0.72,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xb45309,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const innerFloorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.25,
  });

  // Concrete apron / loading pad in front of entrance
  const pad = new THREE.Mesh(new THREE.BoxGeometry(18, 0.32, 18), wallMat);
  pad.position.set(0, 0.16, 0);
  pad.receiveShadow = true;
  group.add(pad);

  // Left & Right front facade walls leaving a 4.6m wide central doorway
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 8.2, 1.2), wallMat);
  leftWall.position.set(-5.1, 4.1, 0);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 8.2, 1.2), wallMat);
  rightWall.position.set(5.1, 4.1, 0);
  const upperWall = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.2, 1.2), wallMat);
  upperWall.position.set(0, 6.1, 0);
  group.add(leftWall, rightWall, upperWall);

  // Interior lobby walls, roof, and floor extending along -Z (for Act 2 peek!)
  const lobbyLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.2, 14), wallMat);
  lobbyLeft.position.set(-7.5, 4.1, -7.2);
  const lobbyRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.2, 14), wallMat);
  lobbyRight.position.set(7.5, 4.1, -7.2);
  const lobbyBack = new THREE.Mesh(new THREE.BoxGeometry(15.8, 8.2, 0.9), darkMetalMat);
  lobbyBack.position.set(0, 4.1, -14.2);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.8, 15.6), darkMetalMat);
  roof.position.set(0, 8.5, -7.0);
  const lobbyFloor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.25, 14), innerFloorMat);
  lobbyFloor.position.set(0, 0.2, -7.2);
  group.add(lobbyLeft, lobbyRight, lobbyBack, roof, lobbyFloor);

  // Twin industrial smokestacks
  for (const sx of [-5.2, 5.2]) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.72, 5.2, 12),
      darkMetalMat
    );
    stack.position.set(sx, 11.2, -5.0);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.45, 12),
      hazardMat
    );
    ring.position.set(sx, 13.2, -5.0);
    group.add(stack, ring);
  }

  // Giant illuminated marquee sign: "МИВИНА КОРПОРЕЙШЕН"
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sctx = signCanvas.getContext('2d')!;
  sctx.fillStyle = '#7f1d1d';
  sctx.fillRect(0, 0, 1024, 256);
  sctx.strokeStyle = '#facc15';
  sctx.lineWidth = 14;
  sctx.strokeRect(10, 10, 1004, 236);

  // Stylized yellow-orange stripe header
  sctx.fillStyle = '#facc15';
  sctx.fillRect(28, 28, 968, 20);
  sctx.fillRect(28, 208, 968, 20);

  sctx.fillStyle = '#fef08a';
  sctx.font = '900 72px system-ui, sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('МИВИНА КОРПОРЕЙШЕН', 512, 112);

  sctx.fillStyle = '#ffffff';
  sctx.font = 'bold 34px system-ui, sans-serif';
  sctx.fillText('ГЛАВНЫЙ ЦЕХ №1 · ВХОД ДЛЯ ПЕРСОНАЛА', 512, 174);

  const marqueeTex = new THREE.CanvasTexture(signCanvas);
  marqueeTex.colorSpace = THREE.SRGBColorSpace;
  marqueeTex.needsUpdate = true;

  const marquee = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 2.7, 0.32),
    new THREE.MeshStandardMaterial({
      map: marqueeTex,
      emissive: 0x7c2d12,
      emissiveMap: marqueeTex,
      emissiveIntensity: 0.72,
      roughness: 0.4,
    })
  );
  marquee.position.set(0, 6.75, 0.65);
  group.add(marquee);

  // Small doorway header "ЦЕХ АКТ 2"
  const doorHeaderCanvas = document.createElement('canvas');
  doorHeaderCanvas.width = 512;
  doorHeaderCanvas.height = 96;
  const dctx = doorHeaderCanvas.getContext('2d')!;
  dctx.fillStyle = '#052e16';
  dctx.fillRect(0, 0, 512, 96);
  dctx.strokeStyle = '#4ade80';
  dctx.lineWidth = 6;
  dctx.strokeRect(4, 4, 504, 88);
  dctx.fillStyle = '#86efac';
  dctx.font = '900 42px system-ui, sans-serif';
  dctx.textAlign = 'center';
  dctx.textBaseline = 'middle';
  dctx.fillText('ВХОД В ЦЕХ · АКТ 2', 256, 50);

  const doorHeaderTex = new THREE.CanvasTexture(doorHeaderCanvas);
  doorHeaderTex.colorSpace = THREE.SRGBColorSpace;
  const doorHeader = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.72, 0.25),
    new THREE.MeshStandardMaterial({
      map: doorHeaderTex,
      emissive: 0x16a34a,
      emissiveIntensity: 0.5,
    })
  );
  doorHeader.position.set(0, 4.45, 0.68);
  group.add(doorHeader);

  // Sliding double security doors
  const leftSlidingDoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.0, 0.22), doorMat);
  leftSlidingDoor.position.set(-1.15, 2.0, 0.15);
  const rightSlidingDoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.0, 0.22), doorMat);
  rightSlidingDoor.position.set(1.15, 2.0, 0.15);

  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.26, 0.25), hazardMat);
  stripeL.position.y = -0.35;
  leftSlidingDoor.add(stripeL);
  const stripeR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.26, 0.25), hazardMat);
  stripeR.position.y = -0.35;
  rightSlidingDoor.add(stripeR);

  group.add(leftSlidingDoor, rightSlidingDoor);

  // Mivina crates inside the lobby (visible when doors slide open in Act 2 secret!)
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.65,
    metalness: 0.08,
  });
  const cratePositions = [
    [-3.4, 0.85, -4.5],
    [-3.6, 1.95, -4.6],
    [3.3, 0.85, -5.2],
    [3.8, 0.85, -7.8],
    [-2.8, 0.85, -9.2],
  ];
  for (const [cx, cy, cz] of cratePositions) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.3), crateMat);
    crate.position.set(cx, cy, cz);
    group.add(crate);
  }

  // Mysterious glowing red boss eyes waiting deep inside the Act 2 factory corridor
  const bossEyes = new THREE.Group();
  bossEyes.position.set(0, 2.35, -12.6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), eyeMat);
  eyeL.position.x = -0.32;
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), eyeMat);
  eyeR.position.x = 0.32;
  bossEyes.add(eyeL, eyeR);
  group.add(bossEyes);

  // Exterior marquee floodlight + flickering interior corridor light
  const facadeLight = new THREE.PointLight(0xfacc15, 22, 28, 1.4);
  facadeLight.position.set(0, 6.2, 4.2);
  group.add(facadeLight);

  const corridorLight = new THREE.PointLight(0x38bdf8, 24, 24, 1.4);
  corridorLight.position.set(0, 4.8, -6.5);
  group.add(corridorLight);

  return {
    group,
    leftSlidingDoor,
    rightSlidingDoor,
    corridorLight,
    bossEyes,
  };
}
