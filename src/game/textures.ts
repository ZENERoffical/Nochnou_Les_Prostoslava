import * as THREE from 'three';

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createForestGroundTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rich deep moss/forest floor base
  ctx.fillStyle = '#2d4a26';
  ctx.fillRect(0, 0, size, size);

  // Subtle organic patches
  let seed = 913;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 26;
    const shade = rand();
    ctx.fillStyle =
      shade < 0.35
        ? 'rgba(36, 61, 28, 0.45)'
        : shade < 0.72
          ? 'rgba(58, 92, 40, 0.35)'
          : 'rgba(72, 62, 38, 0.28)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pine needles & grass speckles
  for (let i = 0; i < 1600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 3 + rand() * 6;
    const ang = rand() * Math.PI;
    ctx.strokeStyle =
      rand() > 0.45 ? 'rgba(92, 134, 58, 0.45)' : 'rgba(42, 34, 24, 0.4)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }

  return finalizeColorTexture(canvas, anisotropy, 28, 28);
}

export function createBarkTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4c3626';
  ctx.fillRect(0, 0, 256, 256);

  let seed = 441;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 120; i++) {
    const x = rand() * 256;
    const w = 2 + rand() * 7;
    ctx.fillStyle = rand() > 0.5 ? '#352418' : '#634834';
    ctx.fillRect(x, 0, w, 256);
  }
  return finalizeColorTexture(canvas, anisotropy, 1, 2);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(6, 12, 8, 0.65)');
  grad.addColorStop(0.55, 'rgba(6, 12, 8, 0.3)');
  grad.addColorStop(1, 'rgba(6, 12, 8, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createNikitysShirtTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark charcoal hoodie body
  ctx.fillStyle = '#1b1d24';
  ctx.fillRect(0, 0, 256, 256);

  // Neon lime collar accent at top
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(46, 0, 164, 24);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(58, 12, 140, 16);

  // Glowing cyan-blue spirit deer emblem (matching nikitys6666 image 1)
  const grad = ctx.createRadialGradient(128, 134, 12, 128, 134, 96);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(0.45, '#0284c7');
  grad.addColorStop(1, '#1b1d24');
  ctx.fillStyle = grad;
  ctx.fillRect(36, 46, 184, 174);

  // Stylized glowing spirit deer head & antlers
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  // Left antler
  ctx.beginPath();
  ctx.moveTo(112, 114);
  ctx.lineTo(94, 82);
  ctx.lineTo(74, 68);
  ctx.moveTo(94, 82);
  ctx.lineTo(106, 62);
  ctx.stroke();
  // Right antler
  ctx.beginPath();
  ctx.moveTo(144, 114);
  ctx.lineTo(162, 82);
  ctx.lineTo(182, 68);
  ctx.moveTo(162, 82);
  ctx.lineTo(150, 62);
  ctx.stroke();

  // Spirit deer face
  ctx.fillStyle = '#f0f9ff';
  ctx.beginPath();
  ctx.moveTo(128, 178);
  ctx.lineTo(104, 124);
  ctx.lineTo(128, 110);
  ctx.lineTo(152, 124);
  ctx.closePath();
  ctx.fill();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createNikitysFaceTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // White futuristic visor upper half
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 256, 138);
  // Subtle visor reflection
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(24, 24, 208, 90);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(36, 36, 184, 66);

  // Black respirator mask lower half
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 134, 256, 122);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(88, 150, 80, 90);

  // Glowing lime-green respirator cheek vents
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(54, 186, 20, 0, Math.PI * 2);
  ctx.arc(202, 186, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(54, 186, 9, 0, Math.PI * 2);
  ctx.arc(202, 186, 9, 0, Math.PI * 2);
  ctx.fill();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createRonerFaceTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Pale Roblox head
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  // Purple round shades (matching RONER_552)
  ctx.strokeStyle = '#3b0764';
  ctx.lineWidth = 8;
  ctx.fillStyle = '#581c87';
  // Left lens
  ctx.beginPath();
  ctx.roundRect(36, 82, 76, 56, 18);
  ctx.fill();
  ctx.stroke();
  // Right lens
  ctx.beginPath();
  ctx.roundRect(144, 82, 76, 56, 18);
  ctx.fill();
  ctx.stroke();
  // Bridge
  ctx.fillStyle = '#3b0764';
  ctx.fillRect(112, 98, 32, 10);
  // Lens glare
  ctx.fillStyle = 'rgba(233, 213, 255, 0.55)';
  ctx.fillRect(48, 92, 20, 12);
  ctx.fillRect(156, 92, 20, 12);

  // Classic Roblox smile
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(128, 152, 42, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createRonerTorsoTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Open black jacket sides
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 256, 256);

  // Light blue t-shirt center
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(68, 0, 120, 256);

  // Dark silhouette graphic on shirt
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.arc(128, 118, 34, 0, Math.PI * 2);
  ctx.fill();

  // White lanyard strap + badge card
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(84, 0);
  ctx.lineTo(128, 122);
  ctx.lineTo(172, 0);
  ctx.stroke();

  // ID badge card
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(108, 122, 40, 56);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(114, 134, 28, 14);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(114, 154, 28, 6);

  return finalizeColorTexture(canvas, anisotropy);
}

export function createSashaFaceTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 256, 256);

  // Eyes peeking under brim
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.ellipse(86, 116, 10, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(170, 116, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Classic Roblox smile
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(128, 150, 42, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createSashaTorsoTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Black-to-electric-blue flame gradient hoodie (matching sasha55k_XL)
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#09090b');
  grad.addColorStop(0.35, '#0f172a');
  grad.addColorStop(0.68, '#1d4ed8');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Flame licks rising from bottom
  ctx.fillStyle = '#60a5fa';
  for (let i = 0; i < 8; i++) {
    const x = i * 34;
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.quadraticCurveTo(x + 16, 140 + (i % 2) * 35, x + 32, 256);
    ctx.fill();
  }

  // Crossbody black strap
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(226, 230);
  ctx.stroke();

  // Cute cat pouch bag at bottom right
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(178, 194, 34, 0, Math.PI * 2);
  ctx.fill();
  // White bongo-cat face patch
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(178, 184, 24, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(169, 182, 3.5, 0, Math.PI * 2);
  ctx.arc(187, 182, 3.5, 0, Math.PI * 2);
  ctx.fill();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createCamoPantsTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1e2923';
  ctx.fillRect(0, 0, 128, 128);
  let s = 31;
  const r = () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = r() > 0.5 ? '#111814' : '#2d3f35';
    ctx.fillRect(r() * 124, r() * 124, 6 + r() * 10, 6 + r() * 10);
  }
  return finalizeColorTexture(canvas, anisotropy);
}

export function createProstophilyaFaceTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Tan mushroom stem base
  ctx.fillStyle = '#deb07e';
  ctx.fillRect(0, 0, 256, 256);

  // Bushy white-grey eyebrows
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.ellipse(84, 72, 34, 13, -0.15, 0, Math.PI * 2);
  ctx.ellipse(172, 72, 34, 13, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Bright blue eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(86, 102, 24, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(170, 102, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(88, 104, 13, 0, Math.PI * 2);
  ctx.arc(168, 104, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(88, 104, 6, 0, Math.PI * 2);
  ctx.arc(168, 104, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(93, 98, 4, 0, Math.PI * 2);
  ctx.arc(173, 98, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bulbous nose
  ctx.fillStyle = '#d49a66';
  ctx.beginPath();
  ctx.ellipse(128, 134, 26, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy grey-white mustache & beard
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(128, 198, 72, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.ellipse(90, 162, 42, 20, -0.2, 0, Math.PI * 2);
  ctx.ellipse(166, 162, 42, 20, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Open mouth
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.ellipse(128, 178, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  return finalizeColorTexture(canvas, anisotropy);
}

export function createNameTagSprite(
  label: string,
  accentColor = '#ffffff'
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Soft dark pill backing for crisp readability over sunlit forest
  const metrics = ctx.measureText(label);
  const pillW = Math.min(480, metrics.width + 52);
  ctx.fillStyle = 'rgba(10, 16, 14, 0.72)';
  ctx.beginPath();
  ctx.roundRect((512 - pillW) / 2, 18, pillW, 76, 16);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(label, 256, 56);
  ctx.fillStyle = accentColor;
  ctx.fillText(label, 256, 56);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.3, 0.5, 1);
  return sprite;
}
