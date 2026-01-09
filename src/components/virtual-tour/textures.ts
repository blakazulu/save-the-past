import * as THREE from 'three';

// Procedural texture generation using Canvas API
// These create realistic-looking textures without external image files

/**
 * Create a marble texture with veins
 */
export function createMarbleTexture(
  baseColor: string = '#e8e0d5',
  veinColor: string = '#a09080',
  size: number = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Add noise for natural variation
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Draw marble veins using bezier curves
  ctx.strokeStyle = veinColor;
  ctx.globalAlpha = 0.3;

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.lineWidth = Math.random() * 3 + 1;

    const startX = Math.random() * size;
    const startY = Math.random() * size;

    ctx.moveTo(startX, startY);

    // Create wandering vein path
    let x = startX;
    let y = startY;
    for (let j = 0; j < 5; j++) {
      const cp1x = x + (Math.random() - 0.5) * 200;
      const cp1y = y + (Math.random() - 0.5) * 200;
      const cp2x = x + (Math.random() - 0.5) * 200;
      const cp2y = y + (Math.random() - 0.5) * 200;
      x = x + (Math.random() - 0.5) * 300;
      y = y + (Math.random() - 0.5) * 300;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    ctx.stroke();

    // Add thinner secondary veins
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.15;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(startX + (Math.random() - 0.5) * 50, startY + (Math.random() - 0.5) * 50);
      ctx.bezierCurveTo(
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size
      );
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a dark marble texture (for floor contrast)
 */
export function createDarkMarbleTexture(size: number = 512): THREE.CanvasTexture {
  return createMarbleTexture('#6b5344', '#4a3828', size);
}

/**
 * Create a light marble texture
 */
export function createLightMarbleTexture(size: number = 512): THREE.CanvasTexture {
  return createMarbleTexture('#f0ebe0', '#c5b8a8', size);
}

/**
 * Create a wood grain texture
 */
export function createWoodTexture(
  baseColor: string = '#5c4033',
  grainColor: string = '#3d2817',
  size: number = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base wood color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Draw wood grain lines
  ctx.strokeStyle = grainColor;
  ctx.globalAlpha = 0.4;

  // Horizontal grain lines with slight curves
  for (let y = 0; y < size; y += 4 + Math.random() * 8) {
    ctx.beginPath();
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.moveTo(0, y);

    let currentY = y;
    for (let x = 0; x < size; x += 20) {
      currentY += (Math.random() - 0.5) * 4;
      ctx.lineTo(x, currentY);
    }
    ctx.stroke();
  }

  // Add knots
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 3; i++) {
    const knotX = Math.random() * size;
    const knotY = Math.random() * size;
    const knotSize = 10 + Math.random() * 20;

    ctx.beginPath();
    ctx.ellipse(knotX, knotY, knotSize, knotSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = grainColor;
    ctx.fill();

    // Rings around knot
    ctx.strokeStyle = grainColor;
    ctx.lineWidth = 1;
    for (let r = 1; r < 4; r++) {
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, knotSize + r * 8, (knotSize + r * 8) * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Add subtle noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a wood plank floor texture with realistic planks - rich brown tones
 */
export function createWoodFloorTexture(size: number = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Number of planks
  const plankCount = 6;
  const plankHeight = size / plankCount;
  const gapSize = 4;

  // Rich brown wood colors - realistic hardwood floor tones
  const woodColors = [
    '#6B4423', // dark walnut brown
    '#7B5233', // medium brown
    '#5D3A1A', // espresso
    '#8B5A2B', // saddle brown
    '#704020', // chocolate
    '#634832', // coffee
    '#7A4A28', // chestnut
    '#6E4530', // auburn brown
  ];

  // Draw each plank
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankHeight;
    const baseColor = woodColors[Math.floor(Math.random() * woodColors.length)];

    // Plank background with slight gradient for depth
    const plankGradient = ctx.createLinearGradient(0, y, 0, y + plankHeight);
    plankGradient.addColorStop(0, shadeColor(baseColor, 8));
    plankGradient.addColorStop(0.5, baseColor);
    plankGradient.addColorStop(1, shadeColor(baseColor, -5));
    ctx.fillStyle = plankGradient;
    ctx.fillRect(0, y + gapSize / 2, size, plankHeight - gapSize);

    // Add prominent wood grain lines
    const grainColor = shadeColor(baseColor, -25);
    const grainHighlight = shadeColor(baseColor, 15);

    // Main grain pattern - darker lines
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = grainColor;
    for (let gy = y + 8; gy < y + plankHeight - 8; gy += 4 + Math.random() * 5) {
      ctx.beginPath();
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.moveTo(0, gy);

      let currentY = gy;
      for (let x = 0; x < size; x += 8) {
        // Gentle wave for natural grain
        currentY += (Math.random() - 0.5) * 1.5;
        ctx.lineTo(x, currentY);
      }
      ctx.stroke();
    }

    // Highlight grain lines - lighter
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = grainHighlight;
    for (let gy = y + 10; gy < y + plankHeight - 10; gy += 8 + Math.random() * 10) {
      ctx.beginPath();
      ctx.lineWidth = 0.5 + Math.random() * 1;
      ctx.moveTo(0, gy);

      let currentY = gy;
      for (let x = 0; x < size; x += 10) {
        currentY += (Math.random() - 0.5) * 1;
        ctx.lineTo(x, currentY);
      }
      ctx.stroke();
    }

    // Add occasional knots
    if (Math.random() > 0.5) {
      ctx.globalAlpha = 0.6;
      const knotX = 80 + Math.random() * (size - 160);
      const knotY = y + plankHeight / 2 + (Math.random() - 0.5) * (plankHeight * 0.3);
      const knotSize = 10 + Math.random() * 18;

      // Dark knot center
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, knotSize * 0.6, knotSize * 0.4, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = shadeColor(baseColor, -45);
      ctx.fill();

      // Knot rings (growth rings around knot)
      ctx.strokeStyle = shadeColor(baseColor, -30);
      ctx.lineWidth = 1.5;
      for (let r = 1; r < 4; r++) {
        ctx.globalAlpha = 0.3 - r * 0.06;
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, knotSize * 0.6 + r * 8, knotSize * 0.4 + r * 5, Math.random() * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    // Plank gaps (dark grooves between planks)
    ctx.fillStyle = '#1a0f05';
    ctx.fillRect(0, y, size, gapSize / 2);
    ctx.fillRect(0, y + plankHeight - gapSize / 2, size, gapSize / 2);

    // Add vertical breaks in planks (staggered joints)
    const jointOffset = (i % 2) * (size / 2) + 50 + (Math.random() - 0.5) * 80;
    ctx.fillStyle = '#1a0f05';
    ctx.fillRect(jointOffset, y, gapSize, plankHeight);
    if (jointOffset + size / 2 < size) {
      ctx.fillRect(jointOffset + size / 2, y, gapSize, plankHeight);
    }
  }

  // Add subtle noise for wood texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Helper to lighten/darken colors
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Create dark wood wainscoting panel texture
 */
export function createWainscotingTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark wood base
  const baseColor = '#4a3728';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Vertical plank divisions
  const plankCount = 4;
  const plankWidth = size / plankCount;
  const gapSize = 4;

  for (let i = 0; i < plankCount; i++) {
    const x = i * plankWidth;

    // Slight color variation per plank
    const variation = (Math.random() - 0.5) * 20;
    ctx.fillStyle = shadeColor(baseColor, variation);
    ctx.fillRect(x + gapSize / 2, 0, plankWidth - gapSize, size);

    // Wood grain (vertical for wainscoting)
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = shadeColor(baseColor, -20);

    for (let gx = x + 8; gx < x + plankWidth - 8; gx += 4 + Math.random() * 8) {
      ctx.beginPath();
      ctx.lineWidth = 0.5 + Math.random() * 1;
      ctx.moveTo(gx, 0);

      let currentX = gx;
      for (let y = 0; y < size; y += 20) {
        currentX += (Math.random() - 0.5) * 3;
        ctx.lineTo(currentX, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Gap between planks
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(x, 0, gapSize / 2, size);
  }

  // Add noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a plaster/wall texture with subtle variation
 */
export function createWallTexture(
  baseColor: string = '#f5f0e6',
  size: number = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Add noise for plaster texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Add subtle brush strokes
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#c0b8a8';

  for (let i = 0; i < 100; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1 + Math.random() * 3;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = 20 + Math.random() * 40;
    const angle = Math.random() * Math.PI * 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a brass/metal texture with brushed effect
 */
export function createBrassTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Gradient base for metallic look
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#d4a84b');
  gradient.addColorStop(0.3, '#b8860b');
  gradient.addColorStop(0.6, '#c9a227');
  gradient.addColorStop(1, '#8b6914');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Brushed metal lines
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#fff';

  for (let i = 0; i < size; i += 2) {
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.moveTo(0, i + (Math.random() - 0.5) * 2);
    ctx.lineTo(size, i + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a ceiling texture with subtle coffers
 */
export function createCeilingTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base ceiling color
  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(0, 0, size, size);

  // Add subtle noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a velvet rope texture
 */
export function createVelvetTexture(size: number = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base velvet color
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(0, 0, size, size);

  // Add velvet texture (vertical fibers)
  ctx.globalAlpha = 0.15;
  for (let x = 0; x < size; x += 2) {
    ctx.strokeStyle = Math.random() > 0.5 ? '#6b0000' : '#ab2020';
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create floor tile grout texture
 */
export function createFloorTexture(
  lightColor: string = '#e8e0d5',
  darkColor: string = '#8b7355',
  tileSize: number = 128,
  gridSize: number = 4
): THREE.CanvasTexture {
  const size = tileSize * gridSize;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Draw checkered pattern with grout
  const groutWidth = 4;
  const groutColor = '#6b5344';

  // Fill with grout color first
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, size, size);

  // Draw tiles
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isLight = (row + col) % 2 === 0;
      const x = col * tileSize + groutWidth / 2;
      const y = row * tileSize + groutWidth / 2;
      const tileW = tileSize - groutWidth;
      const tileH = tileSize - groutWidth;

      // Base tile color
      ctx.fillStyle = isLight ? lightColor : darkColor;
      ctx.fillRect(x, y, tileW, tileH);

      // Add marble-like veins to each tile
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = isLight ? '#c5b8a8' : '#5a4030';
      ctx.lineWidth = 1;

      for (let v = 0; v < 3; v++) {
        ctx.beginPath();
        ctx.moveTo(x + Math.random() * tileW, y + Math.random() * tileH);
        ctx.bezierCurveTo(
          x + Math.random() * tileW, y + Math.random() * tileH,
          x + Math.random() * tileW, y + Math.random() * tileH,
          x + Math.random() * tileW, y + Math.random() * tileH
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Add noise to tile
      const tileImageData = ctx.getImageData(x, y, tileW, tileH);
      const data = tileImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(tileImageData, x, y);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a gold frame texture with ornate pattern
 */
export function createGoldFrameTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Gold gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#d4af37');
  gradient.addColorStop(0.25, '#f0d875');
  gradient.addColorStop(0.5, '#c9a227');
  gradient.addColorStop(0.75, '#f0d875');
  gradient.addColorStop(1, '#b8860b');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add carved pattern
  ctx.globalAlpha = 0.3;
  const patternSize = size / 8;

  for (let y = 0; y < size; y += patternSize) {
    for (let x = 0; x < size; x += patternSize) {
      // Draw small decorative element
      ctx.beginPath();
      ctx.arc(x + patternSize / 2, y + patternSize / 2, patternSize / 4, 0, Math.PI * 2);
      ctx.fillStyle = '#8b6914';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + patternSize / 2, y + patternSize / 2, patternSize / 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f0d875';
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Create a sky gradient texture with clouds
 */
export function createSkyTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Sky gradient (top to bottom: deep blue to light blue)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, size);
  skyGradient.addColorStop(0, '#4a90c2');
  skyGradient.addColorStop(0.3, '#87ceeb');
  skyGradient.addColorStop(0.7, '#b0e0f0');
  skyGradient.addColorStop(1, '#e8f4f8');

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, size, size);

  // Add fluffy clouds
  ctx.globalAlpha = 0.9;
  const cloudColors = ['#ffffff', '#f8f8ff', '#f0f8ff'];

  for (let i = 0; i < 8; i++) {
    const cloudX = Math.random() * size;
    const cloudY = size * 0.1 + Math.random() * size * 0.4;
    const cloudWidth = 60 + Math.random() * 120;

    ctx.fillStyle = cloudColors[Math.floor(Math.random() * cloudColors.length)];

    // Draw cloud as overlapping circles
    for (let j = 0; j < 6; j++) {
      const offsetX = (Math.random() - 0.5) * cloudWidth * 0.8;
      const offsetY = (Math.random() - 0.5) * 25;
      const radius = 20 + Math.random() * 35;
      ctx.beginPath();
      ctx.arc(cloudX + offsetX, cloudY + offsetY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Create a park landscape texture with trees, grass, and river
 */
export function createParkTexture(size: number = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Sky portion (upper 40%)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, size * 0.4);
  skyGradient.addColorStop(0, '#5a9fd4');
  skyGradient.addColorStop(1, '#87ceeb');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, size, size * 0.4);

  // Distant hills
  ctx.fillStyle = '#6b8e6b';
  ctx.beginPath();
  ctx.moveTo(0, size * 0.4);
  for (let x = 0; x <= size; x += 20) {
    const y = size * 0.38 + Math.sin(x * 0.015) * 15 + Math.sin(x * 0.008) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(size, size * 0.5);
  ctx.lineTo(0, size * 0.5);
  ctx.closePath();
  ctx.fill();

  // Grass field (lower 60%)
  const grassGradient = ctx.createLinearGradient(0, size * 0.4, 0, size);
  grassGradient.addColorStop(0, '#5a8f5a');
  grassGradient.addColorStop(0.3, '#4a7f4a');
  grassGradient.addColorStop(1, '#3a6f3a');
  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, size * 0.4, size, size * 0.6);

  // Add grass texture variation
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = size * 0.45 + Math.random() * size * 0.55;
    ctx.strokeStyle = Math.random() > 0.5 ? '#3d6b3d' : '#5fa05f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 5 - Math.random() * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // River winding through
  ctx.strokeStyle = '#4a8fb8';
  ctx.fillStyle = '#5aa0c8';
  ctx.lineWidth = 35;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(size * 0.7, size * 0.42);
  ctx.bezierCurveTo(
    size * 0.6, size * 0.5,
    size * 0.7, size * 0.65,
    size * 0.5, size * 0.75
  );
  ctx.bezierCurveTo(
    size * 0.35, size * 0.82,
    size * 0.4, size * 0.95,
    size * 0.3, size
  );
  ctx.stroke();

  // River highlights
  ctx.strokeStyle = '#7ac0e0';
  ctx.lineWidth = 8;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Trees - variety of sizes and positions
  const treePositions = [
    { x: 0.1, y: 0.45, scale: 1.2 },
    { x: 0.15, y: 0.55, scale: 0.9 },
    { x: 0.25, y: 0.48, scale: 1.4 },
    { x: 0.85, y: 0.46, scale: 1.3 },
    { x: 0.92, y: 0.52, scale: 1.0 },
    { x: 0.78, y: 0.58, scale: 0.8 },
    { x: 0.4, y: 0.43, scale: 1.1 },
    { x: 0.55, y: 0.44, scale: 0.95 },
    { x: 0.05, y: 0.68, scale: 1.5 },
    { x: 0.95, y: 0.72, scale: 1.6 },
  ];

  for (const tree of treePositions) {
    drawTree(ctx, tree.x * size, tree.y * size, tree.scale * 40);
  }

  // Add some flowers/wildflowers
  ctx.globalAlpha = 0.8;
  const flowerColors = ['#ff6b6b', '#ffd93d', '#ffffff', '#ff9ff3'];
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = size * 0.5 + Math.random() * size * 0.45;
    ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Helper function to draw a tree
function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  // Trunk
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x - scale * 0.15, y, scale * 0.3, scale * 0.8);

  // Foliage layers (overlapping circles for natural look)
  const foliageColors = ['#2d5a2d', '#3d6b3d', '#4a8a4a', '#3d7a3d'];

  for (let layer = 0; layer < 4; layer++) {
    ctx.fillStyle = foliageColors[layer];
    const layerY = y - scale * (0.3 + layer * 0.35);
    const layerRadius = scale * (0.8 - layer * 0.12);

    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * layerRadius * 0.8;
      const offsetY = (Math.random() - 0.5) * layerRadius * 0.5;
      ctx.beginPath();
      ctx.arc(x + offsetX, layerY + offsetY, layerRadius * (0.5 + Math.random() * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Cache for textures to avoid regenerating
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getCachedTexture(
  key: string,
  generator: () => THREE.CanvasTexture
): THREE.CanvasTexture {
  if (!textureCache.has(key)) {
    textureCache.set(key, generator());
  }
  return textureCache.get(key)!;
}
