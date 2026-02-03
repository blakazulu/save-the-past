import { useState, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { logger } from '@/lib/utils/logger';

// Texture paths
const TEXTURE_PATHS = {
  woodFloor: '/textures/wood_floor_diff.jpg',
  darkWood: '/textures/dark_wood_diff.jpg',
  plasterDiff: '/textures/plaster_diff.jpg',
  plasterNor: '/textures/plaster_nor.jpg',
  plasterRough: '/textures/plaster_rough.jpg',
  doorframeDiff: '/textures/doorframe_diff.jpg',
  doorframeNor: '/textures/doorframe_nor.jpg',
  doorframeRough: '/textures/doorframe_rough.jpg',
  ceilingDiff: '/textures/ceiling_diff.jpg',
  ceilingNor: '/textures/ceiling_nor.jpg',
  ceilingRough: '/textures/ceiling_rough.jpg',
};

// Artwork paths - loaded separately after main textures
export const ARTWORK_PATHS = [
  '/textures/artwork/mona_lisa.webp',
  '/textures/artwork/venus.webp',
  '/textures/artwork/classical1.webp',
  '/textures/artwork/classical2.webp',
  '/textures/artwork/classical3.webp',
  '/textures/artwork/renaissance1.webp',
  '/textures/artwork/renaissance2.webp',
];

// Fallback colors while textures load
const FALLBACK_COLORS = {
  woodFloor: '#8B6914',
  darkWood: '#3D2914',
  plaster: '#f8f4eb',
  doorframe: '#5c4033',
  ceiling: '#faf8f5',
};

// Mobile texture loading priorities
// Priority 1: Essential (loaded first)
// Priority 2: Important (loaded second)
// Priority 3: Enhancement (skipped on mobile)
const TEXTURE_PRIORITIES = {
  woodFloor: 1,      // Essential - floor is always visible
  darkWood: 2,       // Important - wainscoting
  plasterDiff: 1,    // Essential - walls
  plasterNor: 3,     // Enhancement - skip on mobile
  plasterRough: 3,   // Enhancement - skip on mobile
  doorframeDiff: 2,  // Important - door frames
  doorframeNor: 3,   // Enhancement - skip on mobile
  doorframeRough: 3, // Enhancement - skip on mobile
  ceilingDiff: 2,    // Important - ceiling
  ceilingNor: 3,     // Enhancement - skip on mobile
  ceilingRough: 3,   // Enhancement - skip on mobile
};

interface TextureState {
  texture: THREE.Texture | null;
  loaded: boolean;
}

interface ProgressiveTexturesResult {
  // Textures (null until loaded)
  woodFloor: THREE.Texture | null;
  darkWood: THREE.Texture | null;
  wall: {
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  };
  doorframe: {
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  };
  ceiling: {
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  };
  // Loading state
  progress: number; // 0-100
  isLoading: boolean;
  essentialsLoaded: boolean;
  // Fallback colors
  fallbackColors: typeof FALLBACK_COLORS;
}

// Singleton texture loader
const textureLoader = new THREE.TextureLoader();

// Cache loaded textures to avoid reloading
const textureCache = new Map<string, THREE.Texture>();

async function loadTexture(path: string): Promise<THREE.Texture> {
  // Check cache first
  const cached = textureCache.get(path);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    textureLoader.load(
      path,
      (texture) => {
        textureCache.set(path, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export function useProgressiveTextures(isMobile: boolean): ProgressiveTexturesResult {
  const [textures, setTextures] = useState<Record<string, TextureState>>(() => {
    const initial: Record<string, TextureState> = {};
    Object.keys(TEXTURE_PATHS).forEach((key) => {
      initial[key] = { texture: null, loaded: false };
    });
    return initial;
  });

  const [progress, setProgress] = useState(0);
  const [essentialsLoaded, setEssentialsLoaded] = useState(false);

  // Configure texture properties
  const configureTexture = useCallback((texture: THREE.Texture, key: string) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    // Set repeat values based on texture type
    switch (key) {
      case 'woodFloor':
        texture.repeat.set(10, 12);
        break;
      case 'darkWood':
        texture.repeat.set(6, 1);
        break;
      case 'plasterDiff':
      case 'plasterNor':
      case 'plasterRough':
        texture.repeat.set(4, 2);
        break;
      case 'doorframeDiff':
      case 'doorframeNor':
      case 'doorframeRough':
        texture.repeat.set(1, 2);
        break;
      case 'ceilingDiff':
      case 'ceilingNor':
      case 'ceilingRough':
        texture.repeat.set(8, 10);
        break;
    }

    // Mark texture as needing update after configuration changes
    texture.needsUpdate = true;

    return texture;
  }, []);

  // Load textures progressively
  useEffect(() => {
    let mounted = true;

    async function loadAllTextures() {
      const keys = Object.keys(TEXTURE_PATHS) as (keyof typeof TEXTURE_PATHS)[];

      // Filter textures based on mobile priority
      const texturesToLoad = isMobile
        ? keys.filter((key) => TEXTURE_PRIORITIES[key] <= 2)
        : keys;

      const totalTextures = texturesToLoad.length;
      let loadedCount = 0;
      let essentialSuccessCount = 0;
      let essentialAttemptCount = 0;
      const essentialKeys = texturesToLoad.filter((key) => TEXTURE_PRIORITIES[key] === 1);
      const totalEssentials = essentialKeys.length;

      // Sort by priority (load essential textures first)
      const sortedKeys = [...texturesToLoad].sort(
        (a, b) => TEXTURE_PRIORITIES[a] - TEXTURE_PRIORITIES[b]
      );

      // Load textures one by one (or in small batches) to show progress
      for (const key of sortedKeys) {
        if (!mounted) break;

        const isEssential = TEXTURE_PRIORITIES[key] === 1;

        try {
          const path = TEXTURE_PATHS[key];
          const texture = await loadTexture(path);

          if (!mounted) break;

          const configuredTexture = configureTexture(texture, key);

          setTextures((prev) => ({
            ...prev,
            [key]: { texture: configuredTexture, loaded: true },
          }));

          loadedCount++;
          setProgress(Math.round((loadedCount / totalTextures) * 100));

          // Track essential texture success
          if (isEssential) {
            essentialSuccessCount++;
            essentialAttemptCount++;
            // Mark essentials as loaded when all essential textures have loaded successfully
            if (essentialSuccessCount === totalEssentials) {
              setEssentialsLoaded(true);
            }
          }
        } catch (error) {
          logger.warn(`Failed to load texture: ${key}`, error);
          loadedCount++;
          setProgress(Math.round((loadedCount / totalTextures) * 100));

          // Track essential texture failures
          if (isEssential) {
            essentialAttemptCount++;
          }
        }
      }

      // After all attempts, mark essentials as "loaded" so scene can render
      // (even if some failed - we'll use fallback colors)
      if (mounted && essentialAttemptCount === totalEssentials && !essentialsLoaded) {
        setEssentialsLoaded(true);
      }
    }

    loadAllTextures();

    return () => {
      mounted = false;
    };
  }, [isMobile, configureTexture, essentialsLoaded]);

  // Memoize the result object
  const result = useMemo<ProgressiveTexturesResult>(() => ({
    woodFloor: textures.woodFloor?.texture ?? null,
    darkWood: textures.darkWood?.texture ?? null,
    wall: {
      map: textures.plasterDiff?.texture ?? null,
      normalMap: textures.plasterNor?.texture ?? null,
      roughnessMap: textures.plasterRough?.texture ?? null,
    },
    doorframe: {
      map: textures.doorframeDiff?.texture ?? null,
      normalMap: textures.doorframeNor?.texture ?? null,
      roughnessMap: textures.doorframeRough?.texture ?? null,
    },
    ceiling: {
      map: textures.ceilingDiff?.texture ?? null,
      normalMap: textures.ceilingNor?.texture ?? null,
      roughnessMap: textures.ceilingRough?.texture ?? null,
    },
    progress,
    isLoading: progress < 100,
    essentialsLoaded,
    fallbackColors: FALLBACK_COLORS,
  }), [textures, progress, essentialsLoaded]);

  return result;
}

// Hook for loading artwork textures (lower priority, loaded after scene)
export function useArtworkTexture(artworkIndex: number, enabled: boolean = true): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    const path = ARTWORK_PATHS[artworkIndex % ARTWORK_PATHS.length];

    loadTexture(path)
      .then((tex) => {
        if (mounted) {
          setTexture(tex);
        }
      })
      .catch((error) => {
        logger.warn(`Failed to load artwork: ${path}`, error);
      });

    return () => {
      mounted = false;
    };
  }, [artworkIndex, enabled]);

  return texture;
}
