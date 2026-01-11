import { useEffect } from 'react';
import * as THREE from 'three';
import { useProgressiveTextures, useArtworkTexture } from './useProgressiveTextures';

// ============= GALLERY DIMENSIONS =============

const GALLERY = {
  width: 30,
  depth: 40,
  height: 5,
  wallThickness: 0.25,
};

// Room definitions based on schematic (for reference)
// Room A (Ancient): x = -14 to -8, z = -19 to -10
// Room B (Central): x = -4 to 4, z = -19 to -10
// Room C (Medieval): x = 8 to 14, z = -19 to -10
// North Corridor: x = -14 to 14, z = -10 to -6
// Room D (Classical): x = -14 to -8, z = -6 to 6
// Grand Hall: x = -4 to 4, z = -6 to 10
// Room E (Modern): x = 8 to 14, z = -6 to 6
// South Corridor: x = -14 to 14, z = 10 to 14
// Lobby: x = -6 to 6, z = 14 to 19

// Color palette
const COLORS = {
  trim: '#d4cfc5',
  trimDark: '#b8b0a0',
  brass: '#b8860b',
  pedestalDark: '#3d3d3d',
  doorFrame: '#5c4033',
};

// Fallback colors for when textures haven't loaded yet
const FALLBACK_COLORS = {
  woodFloor: '#8B6914',
  darkWood: '#3D2914',
  plaster: '#f8f4eb',
  doorframe: '#5c4033',
  ceiling: '#faf8f5',
};

// ============= PROGRESSIVE TEXTURE TYPES =============

export interface ProgressiveTextures {
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
  progress: number;
  isLoading: boolean;
  essentialsLoaded: boolean;
  fallbackColors: typeof FALLBACK_COLORS;
}

// ============= FLOOR & CEILING =============

interface FloorProps {
  texture: THREE.Texture | null;
  fallbackColor?: string;
}

function Floor({ texture, fallbackColor = FALLBACK_COLORS.woodFloor }: FloorProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[GALLERY.width, GALLERY.depth]} />
      <meshStandardMaterial
        map={texture}
        color={texture ? '#ffffff' : fallbackColor}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  );
}

interface CeilingProps {
  texture?: {
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  };
  fallbackColor?: string;
}

function Ceiling({ texture, fallbackColor = FALLBACK_COLORS.ceiling }: CeilingProps) {
  const hasMap = texture?.map != null;
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, GALLERY.height, 0]}>
      <planeGeometry args={[GALLERY.width, GALLERY.depth]} />
      <meshStandardMaterial
        map={texture?.map}
        normalMap={texture?.normalMap}
        roughnessMap={texture?.roughnessMap}
        color={hasMap ? '#ffffff' : fallbackColor}
        roughness={hasMap ? 1 : 0.9}
        metalness={0}
      />
    </mesh>
  );
}

// ============= WALLS =============

interface WallTextures {
  map: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
}

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  texture?: WallTextures;
  fallbackColor?: string;
}

function Wall({ position, size, rotation = [0, 0, 0], texture, fallbackColor = FALLBACK_COLORS.plaster }: WallProps) {
  const hasMap = texture?.map != null;
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        map={texture?.map}
        normalMap={texture?.normalMap}
        roughnessMap={texture?.roughnessMap}
        color={hasMap ? '#ffffff' : fallbackColor}
        roughness={hasMap ? 1 : 0.85}
        metalness={0}
      />
    </mesh>
  );
}

// ============= DOORWAY / ARCHWAY =============

interface DoorwayProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  frameTexture?: {
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  };
}

function Doorway({ position, rotation = [0, 0, 0], width = 2.5, height = 3.5, frameTexture }: DoorwayProps) {
  const wallHeight = GALLERY.height;
  const thickness = GALLERY.wallThickness;
  const aboveHeight = wallHeight - height;
  const hasFrameMap = frameTexture?.map != null;

  return (
    <group position={position} rotation={rotation}>
      {/* Left pillar */}
      <Wall
        position={[-(width / 2 + thickness / 2), wallHeight / 2, 0]}
        size={[thickness, wallHeight, thickness * 2]}
      />
      {/* Right pillar */}
      <Wall
        position={[(width / 2 + thickness / 2), wallHeight / 2, 0]}
        size={[thickness, wallHeight, thickness * 2]}
      />
      {/* Top section above door */}
      <Wall
        position={[0, height + aboveHeight / 2, 0]}
        size={[width + thickness * 2, aboveHeight, thickness * 2]}
      />
      {/* Trim around doorway */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width + 0.2, 0.15, thickness * 2 + 0.1]} />
        <meshStandardMaterial
          map={frameTexture?.map}
          normalMap={frameTexture?.normalMap}
          roughnessMap={frameTexture?.roughnessMap}
          color={hasFrameMap ? '#ffffff' : COLORS.trim}
          roughness={hasFrameMap ? 1 : 0.5}
        />
      </mesh>
      {/* Side trims */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 0.05), height / 2, 0]}>
          <boxGeometry args={[0.1, height, thickness * 2 + 0.1]} />
          <meshStandardMaterial
            map={frameTexture?.map}
            normalMap={frameTexture?.normalMap}
            roughnessMap={frameTexture?.roughnessMap}
            color={hasFrameMap ? '#ffffff' : COLORS.trim}
            roughness={hasFrameMap ? 1 : 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============= ARCHWAY =============

interface ArchwayProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
}

function Archway({ position, rotation = [0, 0, 0], width = 3 }: ArchwayProps) {
  const archHeight = GALLERY.height - 1.5;
  const pillarWidth = 0.35;
  const depth = GALLERY.wallThickness * 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Pillars - clean white marble look */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 + pillarWidth / 2), archHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[pillarWidth, archHeight, depth]} />
          <meshStandardMaterial color="#f0ebe0" roughness={0.3} metalness={0.05} />
        </mesh>
      ))}

      {/* Simple arch top - just a header bar instead of curved segments */}
      <mesh position={[0, archHeight + 0.15, 0]} castShadow>
        <boxGeometry args={[width + pillarWidth * 2, 0.3, depth]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Decorative keystone */}
      <mesh position={[0, archHeight + 0.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.15, depth + 0.02]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.4} />
      </mesh>

      {/* Wall above arch */}
      <Wall
        position={[0, GALLERY.height - 0.5, 0]}
        size={[width + pillarWidth * 2 + 0.3, 1, depth]}
      />
    </group>
  );
}

// ============= FROSTED WINDOW =============

interface FrostedWindowProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}

function FrostedWindow({ position, rotation = [0, 0, 0], width = 2, height = 2.5 }: FrostedWindowProps) {
  const frameWidth = 0.1;

  return (
    <group position={position} rotation={rotation}>
      {/* Frosted glass */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[width - frameWidth * 2, height - frameWidth * 2]} />
        <meshStandardMaterial
          color="#d8e8f0"
          emissive="#c8d8e8"
          emissiveIntensity={0.3}
          roughness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Light coming through */}
      <pointLight position={[0, 0, 1]} intensity={0.6} color="#fff8f0" distance={8} decay={2} />

      {/* Frame */}
      {[
        { pos: [0, height / 2 - frameWidth / 2, 0.02] as [number, number, number], size: [width, frameWidth, 0.08] as [number, number, number] },
        { pos: [0, -height / 2 + frameWidth / 2, 0.02] as [number, number, number], size: [width, frameWidth, 0.08] as [number, number, number] },
        { pos: [-width / 2 + frameWidth / 2, 0, 0.02] as [number, number, number], size: [frameWidth, height, 0.08] as [number, number, number] },
        { pos: [width / 2 - frameWidth / 2, 0, 0.02] as [number, number, number], size: [frameWidth, height, 0.08] as [number, number, number] },
      ].map((frame, i) => (
        <mesh key={i} position={frame.pos}>
          <boxGeometry args={frame.size} />
          <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
        </mesh>
      ))}

      {/* Cross dividers */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[width - frameWidth * 2, 0.04, 0.06]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.04, height - frameWidth * 2, 0.06]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ============= SKYLIGHT =============

interface SkylightProps {
  position: [number, number, number];
  width?: number;
  length?: number;
}

function Skylight({ position, width = 2.5, length = 4 }: SkylightProps) {
  return (
    <group position={position}>
      {/* Sky/light panel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          color="#b8e0ff"
          emissive="#d0f0ff"
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* Sunlight beam */}
      <spotLight
        position={[0, 0, 0]}
        angle={0.5}
        penumbra={0.6}
        intensity={3.0}
        color="#fffaf0"
        distance={15}
      />

      {/* Frame */}
      {[
        { pos: [0, -0.08, -length / 2] as [number, number, number], size: [width + 0.2, 0.15, 0.15] as [number, number, number] },
        { pos: [0, -0.08, length / 2] as [number, number, number], size: [width + 0.2, 0.15, 0.15] as [number, number, number] },
        { pos: [-width / 2, -0.08, 0] as [number, number, number], size: [0.15, 0.15, length] as [number, number, number] },
        { pos: [width / 2, -0.08, 0] as [number, number, number], size: [0.15, 0.15, length] as [number, number, number] },
      ].map((frame, i) => (
        <mesh key={i} position={frame.pos}>
          <boxGeometry args={frame.size} />
          <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ============= WAINSCOTING =============

interface WainscotingProps {
  position: [number, number, number];
  width: number;
  rotation?: [number, number, number];
  texture: THREE.Texture | null;
  fallbackColor?: string;
}

function Wainscoting({ position, width, rotation = [0, 0, 0], texture, fallbackColor = FALLBACK_COLORS.darkWood }: WainscotingProps) {
  const height = 1.2;

  return (
    <mesh position={[position[0], height / 2, position[2]]} rotation={rotation}>
      <boxGeometry args={[width, height, 0.05]} />
      <meshStandardMaterial
        map={texture}
        color={texture ? '#ffffff' : fallbackColor}
        roughness={0.6}
        metalness={0.05}
      />
    </mesh>
  );
}

// ============= MUSEUM WALLS LAYOUT =============

interface MuseumWallsProps {
  textures: ProgressiveTextures;
}

function MuseumWalls({ textures }: MuseumWallsProps) {
  const { darkWood, wall, doorframe } = textures;
  const wallTexture = wall;
  const frameTexture = doorframe;
  const h = GALLERY.height;
  const t = GALLERY.wallThickness;

  // Doorway dimensions for calculating wall gaps
  const DOOR_WIDTH = 2.5;
  const ARCH_WIDTH_SMALL = 3;
  const ARCH_WIDTH_LARGE = 3.5;
  const ARCH_WIDTH_ENTRANCE = 4;

  return (
    <group>
      {/* ===== OUTER WALLS ===== */}

      {/* Back wall (solid - no doorways) */}
      <Wall position={[0, h / 2, -20]} size={[30, h, t]} texture={wallTexture} />

      {/* Front wall - left section (extends to entrance archway) */}
      <Wall position={[-8.5, h / 2, 20]} size={[13, h, t]} texture={wallTexture} />

      {/* Front wall - right section (extends to entrance archway) */}
      <Wall position={[8.5, h / 2, 20]} size={[13, h, t]} texture={wallTexture} />

      {/* Left outer wall (solid) */}
      <Wall position={[-15, h / 2, 0]} size={[t, h, 40]} texture={wallTexture} />

      {/* Right outer wall (solid) */}
      <Wall position={[15, h / 2, 0]} size={[t, h, 40]} texture={wallTexture} />

      {/* ===== ROOM A/B/C DIVIDER WALLS ===== */}

      {/* Wall between Room A and Room B (extends from back wall to corridor wall) */}
      <Wall position={[-6, h / 2, -15]} size={[t, h, 10]} texture={wallTexture} />

      {/* Wall between Room B and Room C (extends from back wall to corridor wall) */}
      <Wall position={[6, h / 2, -15]} size={[t, h, 10]} texture={wallTexture} />

      {/* ===== NORTH CORRIDOR BACK WALL (z=-10) - WITH DOORWAY GAPS ===== */}

      {/* Section 1: Far left (x=-15 to x=-12.25, left of Room A door) */}
      <Wall position={[-13.625, h / 2, -10]} size={[2.75, h, t]} texture={wallTexture} />

      {/* Section 2: Between Room A door and Room B arch (x=-9.75 to x=-1.5) */}
      <Wall position={[-5.625, h / 2, -10]} size={[8.25, h, t]} texture={wallTexture} />

      {/* Section 3: Between Room B arch and Room C door (x=1.5 to x=9.75) */}
      <Wall position={[5.625, h / 2, -10]} size={[8.25, h, t]} texture={wallTexture} />

      {/* Section 4: Far right (x=12.25 to x=15, right of Room C door) */}
      <Wall position={[13.625, h / 2, -10]} size={[2.75, h, t]} texture={wallTexture} />

      {/* ===== NORTH CORRIDOR FRONT WALL (z=-6) - WITH DOORWAY GAPS ===== */}

      {/* Section 1: Far left (x=-15 to x=-12.25, left of Room D door) */}
      <Wall position={[-13.625, h / 2, -6]} size={[2.75, h, t]} texture={wallTexture} />

      {/* Section 2: Between Room D door and Grand Hall arch (x=-9.75 to x=-1.75) */}
      <Wall position={[-5.75, h / 2, -6]} size={[8, h, t]} texture={wallTexture} />

      {/* Section 3: Between Grand Hall arch and Room E door (x=1.75 to x=9.75) */}
      <Wall position={[5.75, h / 2, -6]} size={[8, h, t]} texture={wallTexture} />

      {/* Section 4: Far right (x=12.25 to x=15, right of Room E door) */}
      <Wall position={[13.625, h / 2, -6]} size={[2.75, h, t]} texture={wallTexture} />

      {/* ===== VERTICAL DIVIDER WALLS (Room D/Grand Hall/Room E) ===== */}

      {/* Wall between Room D and Grand Hall (x=-6, from z=-6 to z=6) */}
      <Wall position={[-6, h / 2, 0]} size={[t, h, 12]} texture={wallTexture} />

      {/* Wall between Grand Hall and Room E (x=6, from z=-6 to z=6) */}
      <Wall position={[6, h / 2, 0]} size={[t, h, 12]} texture={wallTexture} />

      {/* ===== SOUTH SIDE WALLS (z=6) ===== */}

      {/* South side of Room D (solid wall) */}
      <Wall position={[-10.5, h / 2, 6]} size={[9, h, t]} texture={wallTexture} />

      {/* South side of Room E (solid wall) */}
      <Wall position={[10.5, h / 2, 6]} size={[9, h, t]} texture={wallTexture} />

      {/* ===== GRAND HALL SOUTH WALL (z=10) - WITH ARCHWAY GAP ===== */}

      {/* Left section (x=-6 to x=-1.5) */}
      <Wall position={[-3.75, h / 2, 10]} size={[4.5, h, t]} texture={wallTexture} />

      {/* Right section (x=1.5 to x=6) */}
      <Wall position={[3.75, h / 2, 10]} size={[4.5, h, t]} texture={wallTexture} />

      {/* ===== SOUTH CORRIDOR WALLS (z=10, outside Grand Hall) ===== */}

      {/* Left corridor wall (x=-15 to x=-6) */}
      <Wall position={[-10.5, h / 2, 10]} size={[9, h, t]} texture={wallTexture} />

      {/* Right corridor wall (x=6 to x=15) */}
      <Wall position={[10.5, h / 2, 10]} size={[9, h, t]} texture={wallTexture} />

      {/* ===== LOBBY SIDE WALLS - WITH DOORWAY GAPS ===== */}

      {/* Left lobby wall - section before doorway (z=10 to z=11) */}
      <Wall position={[-6, h / 2, 10.5]} size={[t, h, 1]} texture={wallTexture} />
      {/* Left lobby wall - section after doorway to front (z=13 to z=20) */}
      <Wall position={[-6, h / 2, 16.5]} size={[t, h, 7]} texture={wallTexture} />

      {/* Right lobby wall - section before doorway (z=10 to z=11) */}
      <Wall position={[6, h / 2, 10.5]} size={[t, h, 1]} texture={wallTexture} />
      {/* Right lobby wall - section after doorway to front (z=13 to z=20) */}
      <Wall position={[6, h / 2, 16.5]} size={[t, h, 7]} texture={wallTexture} />

      {/* ===== DOORWAYS & ARCHWAYS (just decorative frames) ===== */}

      {/* Room A doorway frame */}
      <Doorway position={[-11, 0, -10]} width={DOOR_WIDTH} frameTexture={frameTexture} />

      {/* Room B archway frame */}
      <Archway position={[0, 0, -10]} width={ARCH_WIDTH_SMALL} />

      {/* Room C doorway frame */}
      <Doorway position={[11, 0, -10]} width={DOOR_WIDTH} frameTexture={frameTexture} />

      {/* Room D doorway frame */}
      <Doorway position={[-11, 0, -6]} width={DOOR_WIDTH} frameTexture={frameTexture} />

      {/* Room E doorway frame */}
      <Doorway position={[11, 0, -6]} width={DOOR_WIDTH} frameTexture={frameTexture} />

      {/* Grand Hall north archway frame */}
      <Archway position={[0, 0, -6]} width={ARCH_WIDTH_LARGE} />

      {/* Grand Hall south archway frame */}
      <Archway position={[0, 0, 10]} width={ARCH_WIDTH_SMALL} />

      {/* Lobby to south corridor doorways */}
      <Doorway position={[-6, 0, 12]} rotation={[0, Math.PI / 2, 0]} width={2} frameTexture={frameTexture} />
      <Doorway position={[6, 0, 12]} rotation={[0, Math.PI / 2, 0]} width={2} frameTexture={frameTexture} />

      {/* Main entrance archway frame */}
      <Archway position={[0, 0, 20]} width={ARCH_WIDTH_ENTRANCE} />

      {/* ===== WAINSCOTING ===== */}

      {/* Back wall */}
      <Wainscoting position={[0, 0, -19.8]} width={29} texture={darkWood} />

      {/* Left wall */}
      <Wainscoting position={[-14.8, 0, 0]} width={39} rotation={[0, Math.PI / 2, 0]} texture={darkWood} />

      {/* Right wall */}
      <Wainscoting position={[14.8, 0, 0]} width={39} rotation={[0, -Math.PI / 2, 0]} texture={darkWood} />
    </group>
  );
}

// ============= WINDOWS =============

function MuseumWindows() {
  const windowHeight = 3;

  return (
    <group>
      {/* Left wall windows */}
      <FrostedWindow position={[-14.8, windowHeight, -15]} rotation={[0, Math.PI / 2, 0]} />
      <FrostedWindow position={[-14.8, windowHeight, -5]} rotation={[0, Math.PI / 2, 0]} />
      <FrostedWindow position={[-14.8, windowHeight, 5]} rotation={[0, Math.PI / 2, 0]} />
      <FrostedWindow position={[-14.8, windowHeight, 15]} rotation={[0, Math.PI / 2, 0]} />

      {/* Right wall windows */}
      <FrostedWindow position={[14.8, windowHeight, -15]} rotation={[0, -Math.PI / 2, 0]} />
      <FrostedWindow position={[14.8, windowHeight, -5]} rotation={[0, -Math.PI / 2, 0]} />
      <FrostedWindow position={[14.8, windowHeight, 5]} rotation={[0, -Math.PI / 2, 0]} />
      <FrostedWindow position={[14.8, windowHeight, 15]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Back wall windows */}
      <FrostedWindow position={[-10, windowHeight, -19.8]} />
      <FrostedWindow position={[10, windowHeight, -19.8]} />
    </group>
  );
}

// ============= WALL SCONCE =============

interface WallSconceProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function WallSconce({ position, rotation = [0, 0, 0] }: WallSconceProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Backplate */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.15, 0.25, 0.03]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Arm */}
      <mesh position={[0, -0.05, 0.12]}>
        <boxGeometry args={[0.04, 0.04, 0.2]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Lamp shade holder */}
      <mesh position={[0, 0, 0.22]}>
        <cylinderGeometry args={[0.03, 0.04, 0.08, 8]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glass shade */}
      <mesh position={[0, 0.08, 0.22]}>
        <cylinderGeometry args={[0.06, 0.1, 0.15, 8, 1, true]} />
        <meshStandardMaterial
          color="#fff8e0"
          transparent
          opacity={0.6}
          roughness={0.2}
          emissive="#fff0c0"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Light */}
      <pointLight
        position={[0, 0.1, 0.25]}
        intensity={0.5}
        color="#fff5e0"
        distance={6}
        decay={2}
      />
    </group>
  );
}

// ============= FRAMED ARTWORK =============

interface FramedArtworkProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  frameColor?: string;
  artworkIndex?: number;
  loadArtwork?: boolean; // Whether to load the artwork texture (for progressive loading)
}

function FramedArtwork({
  position,
  rotation = [0, 0, 0],
  width = 1.5,
  height = 1.2,
  frameColor = '#5c4033',
  artworkIndex = 0,
  loadArtwork = true,
}: FramedArtworkProps) {
  const frameThickness = 0.08;
  const frameDepth = 0.05;

  // Load the artwork texture lazily
  const texture = useArtworkTexture(artworkIndex, loadArtwork);

  return (
    <group position={position} rotation={rotation}>
      {/* Canvas/artwork with texture or placeholder */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width - frameThickness * 2, height - frameThickness * 2]} />
        <meshStandardMaterial
          map={texture}
          color={texture ? '#ffffff' : '#d4cfc5'}
          roughness={0.8}
        />
      </mesh>

      {/* Frame - top */}
      <mesh position={[0, height / 2 - frameThickness / 2, frameDepth / 2]}>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Frame - bottom */}
      <mesh position={[0, -height / 2 + frameThickness / 2, frameDepth / 2]}>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Frame - left */}
      <mesh position={[-width / 2 + frameThickness / 2, 0, frameDepth / 2]}>
        <boxGeometry args={[frameThickness, height - frameThickness * 2, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Frame - right */}
      <mesh position={[width / 2 - frameThickness / 2, 0, frameDepth / 2]}>
        <boxGeometry args={[frameThickness, height - frameThickness * 2, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Inner gold trim */}
      {[
        [0, height / 2 - frameThickness - 0.01, 0.025] as [number, number, number],
        [0, -height / 2 + frameThickness + 0.01, 0.025] as [number, number, number],
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[width - frameThickness * 2, 0.02, 0.02]} />
          <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ============= WALL ALCOVE =============

interface WallAlcoveProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
}

function WallAlcove({
  position,
  rotation = [0, 0, 0],
  width = 1.2,
  height = 1.5,
  depth = 0.3,
}: WallAlcoveProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Back of alcove */}
      <mesh position={[0, 0, -depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#e8e0d5" roughness={0.9} />
      </mesh>

      {/* Top of alcove */}
      <mesh position={[0, height / 2, -depth / 4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth / 2]} />
        <meshStandardMaterial color="#ddd5c8" roughness={0.9} />
      </mesh>

      {/* Bottom shelf */}
      <mesh position={[0, -height / 2 + 0.05, -depth / 4]}>
        <boxGeometry args={[width, 0.05, depth / 2]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width / 2, 0, -depth / 4]} rotation={[0, side * Math.PI / 2, 0]}>
          <planeGeometry args={[depth / 2, height]} />
          <meshStandardMaterial color="#e0d8cc" roughness={0.9} />
        </mesh>
      ))}

      {/* Decorative arch top */}
      <mesh position={[0, height / 2 + 0.08, 0.02]}>
        <boxGeometry args={[width + 0.15, 0.12, 0.04]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>

      {/* Spotlight */}
      <spotLight
        position={[0, height / 2 - 0.1, 0.1]}
        angle={0.6}
        penumbra={0.8}
        intensity={1.0}
        color="#fff8e0"
        distance={3}
        target-position={[0, -height / 2, -depth / 2]}
      />
    </group>
  );
}

// ============= BANNER/TAPESTRY =============

interface BannerProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
}

function Banner({
  position,
  rotation = [0, 0, 0],
  width = 0.8,
  height = 2.5,
  color = '#8B4513',
  accentColor = '#DAA520',
}: BannerProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Hanging rod */}
      <mesh position={[0, height / 2 + 0.05, 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, width + 0.2, 8]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Rod end caps */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 0.12), height / 2 + 0.05, 0.03]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Main banner fabric */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Center decorative stripe */}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[width * 0.15, height * 0.85]} />
        <meshStandardMaterial color={accentColor} roughness={0.7} />
      </mesh>

      {/* Top decorative band */}
      <mesh position={[0, height / 2 - 0.15, 0.025]}>
        <planeGeometry args={[width * 0.9, 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.7} />
      </mesh>

      {/* Bottom decorative band */}
      <mesh position={[0, -height / 2 + 0.15, 0.025]}>
        <planeGeometry args={[width * 0.9, 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.7} />
      </mesh>

      {/* Bottom fringe/tassels */}
      {[-0.25, 0, 0.25].map((offset, i) => (
        <mesh key={i} position={[offset * width, -height / 2 - 0.1, 0.02]}>
          <coneGeometry args={[0.04, 0.15, 4]} />
          <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ============= WALL PANEL =============

interface WallPanelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}

function WallPanel({
  position,
  rotation = [0, 0, 0],
  width = 2,
  height = 2.5,
}: WallPanelProps) {
  const borderWidth = 0.06;

  return (
    <group position={position} rotation={rotation}>
      {/* Outer raised border */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[width, height, 0.02]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.7} />
      </mesh>

      {/* Inner recessed panel */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[width - borderWidth * 4, height - borderWidth * 4, 0.015]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
      </mesh>

      {/* Decorative molding - top */}
      <mesh position={[0, height / 2 - borderWidth, 0.035]}>
        <boxGeometry args={[width - borderWidth * 2, borderWidth, 0.02]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>

      {/* Decorative molding - bottom */}
      <mesh position={[0, -height / 2 + borderWidth, 0.035]}>
        <boxGeometry args={[width - borderWidth * 2, borderWidth, 0.02]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>

      {/* Decorative molding - left */}
      <mesh position={[-width / 2 + borderWidth, 0, 0.035]}>
        <boxGeometry args={[borderWidth, height - borderWidth * 4, 0.02]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>

      {/* Decorative molding - right */}
      <mesh position={[width / 2 - borderWidth, 0, 0.035]}>
        <boxGeometry args={[borderWidth, height - borderWidth * 4, 0.02]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ============= WALL DECORATIONS =============

interface WallDecorationsProps {
  loadArtwork?: boolean;
}

function WallDecorations({ loadArtwork = true }: WallDecorationsProps) {
  const artworkHeight = 2.8;
  const sconceHeight = 2.5;
  const alcoveHeight = 2.2;
  const bannerHeight = 3.2;
  const panelHeight = 2.8;

  return (
    <group>
      {/* ===== WALL SCONCES ===== */}

      {/* Left wall sconces */}
      {[-16, -6, 4, 14].map((z, i) => (
        <WallSconce key={`left-sconce-${i}`} position={[-14.7, sconceHeight, z]} rotation={[0, Math.PI / 2, 0]} />
      ))}

      {/* Right wall sconces */}
      {[-16, -6, 4, 14].map((z, i) => (
        <WallSconce key={`right-sconce-${i}`} position={[14.7, sconceHeight, z]} rotation={[0, -Math.PI / 2, 0]} />
      ))}

      {/* Back wall sconces */}
      <WallSconce position={[-5, sconceHeight, -19.7]} rotation={[0, 0, 0]} />
      <WallSconce position={[5, sconceHeight, -19.7]} rotation={[0, 0, 0]} />

      {/* ===== FRAMED ARTWORK ===== */}

      {/* Back wall artwork - large piece (Mona Lisa) */}
      <FramedArtwork position={[0, artworkHeight, -19.7]} width={2.5} height={1.8} artworkIndex={0} loadArtwork={loadArtwork} />

      {/* Left wall artwork */}
      <FramedArtwork position={[-14.7, artworkHeight, -11]} rotation={[0, Math.PI / 2, 0]} width={1.8} height={1.4} artworkIndex={1} loadArtwork={loadArtwork} />
      <FramedArtwork position={[-14.7, artworkHeight, 0]} rotation={[0, Math.PI / 2, 0]} width={2} height={1.5} artworkIndex={2} loadArtwork={loadArtwork} />
      <FramedArtwork position={[-14.7, artworkHeight, 11]} rotation={[0, Math.PI / 2, 0]} width={1.6} height={1.3} artworkIndex={3} loadArtwork={loadArtwork} />

      {/* Right wall artwork */}
      <FramedArtwork position={[14.7, artworkHeight, -11]} rotation={[0, -Math.PI / 2, 0]} width={1.8} height={1.4} artworkIndex={4} loadArtwork={loadArtwork} />
      <FramedArtwork position={[14.7, artworkHeight, 0]} rotation={[0, -Math.PI / 2, 0]} width={2} height={1.5} artworkIndex={5} loadArtwork={loadArtwork} />
      <FramedArtwork position={[14.7, artworkHeight, 11]} rotation={[0, -Math.PI / 2, 0]} width={1.6} height={1.3} artworkIndex={6} loadArtwork={loadArtwork} />

      {/* Room divider wall artwork */}
      <FramedArtwork position={[-5.7, artworkHeight, -14]} rotation={[0, -Math.PI / 2, 0]} width={1.4} height={1.2} artworkIndex={2} loadArtwork={loadArtwork} />
      <FramedArtwork position={[5.7, artworkHeight, -14]} rotation={[0, Math.PI / 2, 0]} width={1.4} height={1.2} artworkIndex={5} loadArtwork={loadArtwork} />

      {/* Grand Hall side walls */}
      <FramedArtwork position={[-5.7, artworkHeight, 2]} rotation={[0, -Math.PI / 2, 0]} width={1.8} height={1.4} artworkIndex={3} loadArtwork={loadArtwork} />
      <FramedArtwork position={[5.7, artworkHeight, 2]} rotation={[0, Math.PI / 2, 0]} width={1.8} height={1.4} artworkIndex={4} loadArtwork={loadArtwork} />

      {/* ===== WALL ALCOVES ===== */}

      {/* Room A alcove */}
      <WallAlcove position={[-14.6, alcoveHeight, -17]} rotation={[0, Math.PI / 2, 0]} />

      {/* Room C alcove */}
      <WallAlcove position={[14.6, alcoveHeight, -17]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Room D alcove */}
      <WallAlcove position={[-14.6, alcoveHeight, 3]} rotation={[0, Math.PI / 2, 0]} />

      {/* Room E alcove */}
      <WallAlcove position={[14.6, alcoveHeight, 3]} rotation={[0, -Math.PI / 2, 0]} />

      {/* ===== BANNERS ===== */}

      {/* Grand Hall banners - archaeological theme colors */}
      <Banner position={[-5.7, bannerHeight, -2]} rotation={[0, -Math.PI / 2, 0]} color="#8B4513" accentColor="#DAA520" />
      <Banner position={[5.7, bannerHeight, -2]} rotation={[0, Math.PI / 2, 0]} color="#8B4513" accentColor="#DAA520" />

      {/* Lobby entrance banners */}
      <Banner position={[-5.7, bannerHeight, 15]} rotation={[0, -Math.PI / 2, 0]} color="#654321" accentColor="#C17F59" />
      <Banner position={[5.7, bannerHeight, 15]} rotation={[0, Math.PI / 2, 0]} color="#654321" accentColor="#C17F59" />

      {/* Back room accent banners */}
      <Banner position={[-5.7, bannerHeight, -16]} rotation={[0, -Math.PI / 2, 0]} width={0.6} height={2} color="#5C4033" accentColor="#B8860B" />
      <Banner position={[5.7, bannerHeight, -16]} rotation={[0, Math.PI / 2, 0]} width={0.6} height={2} color="#5C4033" accentColor="#B8860B" />

      {/* ===== WALL PANELS ===== */}

      {/* Back wall panels */}
      <WallPanel position={[-7, panelHeight, -19.7]} width={2.2} height={2.2} />
      <WallPanel position={[7, panelHeight, -19.7]} width={2.2} height={2.2} />

      {/* Grand Hall south wall panels */}
      <WallPanel position={[-3.5, panelHeight, 9.7]} width={1.8} height={2} />
      <WallPanel position={[3.5, panelHeight, 9.7]} width={1.8} height={2} />

      {/* Corridor wall panels */}
      <WallPanel position={[-9, panelHeight, 9.7]} width={2} height={2} />
      <WallPanel position={[9, panelHeight, 9.7]} width={2} height={2} />

      {/* Room D south wall panels */}
      <WallPanel position={[-10, panelHeight, 5.7]} width={2.2} height={2.2} />

      {/* Room E south wall panels */}
      <WallPanel position={[10, panelHeight, 5.7]} width={2.2} height={2.2} />
    </group>
  );
}

// ============= SKYLIGHTS =============

interface MuseumSkylightsProps {
  isMobile?: boolean;
}

function MuseumSkylights({ isMobile = false }: MuseumSkylightsProps) {
  // On mobile, only render 2 key skylights to reduce spotlights
  if (isMobile) {
    return (
      <group>
        {/* Grand Hall skylight only - most important */}
        <Skylight position={[0, GALLERY.height, 2]} width={3} length={5} />
        {/* Lobby skylight */}
        <Skylight position={[0, GALLERY.height, 16]} width={4} length={3} />
      </group>
    );
  }

  return (
    <group>
      {/* Room skylights */}
      <Skylight position={[-11, GALLERY.height, -14]} />
      <Skylight position={[0, GALLERY.height, -14]} />
      <Skylight position={[11, GALLERY.height, -14]} />

      {/* Grand Hall skylights */}
      <Skylight position={[0, GALLERY.height, 2]} width={3} length={5} />

      {/* Corridor skylights */}
      <Skylight position={[-8, GALLERY.height, -8]} width={2} length={2} />
      <Skylight position={[8, GALLERY.height, -8]} width={2} length={2} />

      {/* Lobby skylight */}
      <Skylight position={[0, GALLERY.height, 16]} width={4} length={3} />
    </group>
  );
}

// ============= LIGHTING =============

interface MuseumLightingProps {
  isMobile?: boolean;
}

function MuseumLighting({ isMobile = false }: MuseumLightingProps) {
  // Mobile: Simplified lighting - no shadows, fewer lights
  if (isMobile) {
    return (
      <>
        {/* Stronger ambient to compensate for fewer lights */}
        <ambientLight intensity={1.0} color="#fffcf5" />

        {/* Hemisphere light for natural lighting */}
        <hemisphereLight
          color="#fffff0"
          groundColor="#e8d4b8"
          intensity={0.8}
        />

        {/* Single directional light - NO shadows on mobile */}
        <directionalLight
          position={[10, GALLERY.height + 15, 5]}
          intensity={1.8}
          color="#fffaf0"
        />

        {/* Only 2 key point lights for room illumination */}
        <pointLight
          position={[0, GALLERY.height - 0.5, 2]}
          intensity={1.5}
          color="#fffaf0"
          distance={30}
        />
        <pointLight
          position={[0, GALLERY.height - 0.5, 16]}
          intensity={1.5}
          color="#fffaf0"
          distance={30}
        />
      </>
    );
  }

  // Desktop: Full lighting with shadows
  return (
    <>
      {/* Strong ambient for bright museum feel */}
      <ambientLight intensity={0.7} color="#fffcf5" />

      {/* Hemisphere light for natural sky/ground lighting */}
      <hemisphereLight
        color="#fffff0"
        groundColor="#e8d4b8"
        intensity={0.6}
      />

      {/* Main directional (bright sun) */}
      <directionalLight
        position={[10, GALLERY.height + 15, 5]}
        intensity={1.5}
        color="#fffaf0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Secondary sun from opposite side */}
      <directionalLight
        position={[-8, GALLERY.height + 10, -5]}
        intensity={0.8}
        color="#fff8e8"
      />

      {/* Room lighting - brighter */}
      {[
        [-11, -14], [0, -14], [11, -14],  // Back rooms
        [-11, 0], [0, 2], [11, 0],         // Middle rooms
        [0, 12], [0, 17],                   // Corridor & Lobby
      ].map(([x, z], i) => (
        <pointLight
          key={i}
          position={[x, GALLERY.height - 0.5, z]}
          intensity={1.2}
          color="#fffaf0"
          distance={20}
        />
      ))}

      {/* Corridor accent lights */}
      {[
        [-8, -8], [8, -8],
        [-8, 12], [8, 12],
      ].map(([x, z], i) => (
        <pointLight
          key={`accent-${i}`}
          position={[x, GALLERY.height - 0.3, z]}
          intensity={0.8}
          color="#fff5e0"
          distance={15}
        />
      ))}
    </>
  );
}

// ============= PEDESTAL =============

interface PedestalProps {
  position: [number, number, number];
  children?: React.ReactNode;
}

function PedestalComponent({ position, children }: PedestalProps) {
  return (
    <group position={position}>
      {/* Base - white marble look */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.16, 1.1]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Middle section */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.68, 0.9]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.15} metalness={0.1} />
      </mesh>

      {/* Top trim */}
      <mesh position={[0, 0.9, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.1, 1.0]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Display surface - glowing diffused light */}
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[0.85, 0.02, 0.85]} />
        <meshStandardMaterial
          color="#fff8f0"
          emissive="#fff5e6"
          emissiveIntensity={0.4}
          roughness={0.9}
        />
      </mesh>

      {/* Soft uplight from display surface */}
      <pointLight
        position={[0, 1.0, 0]}
        intensity={0.5}
        color="#fff5e6"
        distance={3}
        decay={2}
      />

      {/* Spotlight */}
      <spotLight
        position={[0, 4, 0]}
        angle={0.35}
        penumbra={0.7}
        intensity={2.0}
        color="#fff5e6"
        distance={8}
      />

      {/* Artifact placement - raised to account for model center origin */}
      <group position={[0, 1.6, 0]}>
        {children}
      </group>
    </group>
  );
}

// ============= MAIN GALLERY COMPONENT =============

interface ProceduralGalleryProps {
  isMobile?: boolean;
  onProgress?: (progress: number) => void;
  onEssentialsLoaded?: () => void;
}

export function ProceduralGallery({ isMobile = false, onProgress, onEssentialsLoaded }: ProceduralGalleryProps) {
  // Use progressive texture loading - no Suspense, no blocking
  const textures = useProgressiveTextures(isMobile);

  // Report progress to parent
  useEffect(() => {
    onProgress?.(textures.progress);
  }, [textures.progress, onProgress]);

  // Report when essentials are loaded
  useEffect(() => {
    if (textures.essentialsLoaded) {
      onEssentialsLoaded?.();
    }
  }, [textures.essentialsLoaded, onEssentialsLoaded]);

  // Only load artwork after main textures are loaded
  const loadArtwork = textures.progress >= 50;

  return (
    <group>
      {/* Light atmospheric fog - closer on mobile for better culling */}
      <fog attach="fog" args={['#fefcf8', isMobile ? 15 : 25, isMobile ? 50 : 80]} />

      {/* Sky backdrop - lower poly on mobile */}
      <mesh position={[0, 20, 0]}>
        <sphereGeometry args={[100, isMobile ? 16 : 32, isMobile ? 8 : 16]} />
        <meshBasicMaterial color="#d4e5f7" side={THREE.BackSide} />
      </mesh>

      {/* Floor */}
      <Floor texture={textures.woodFloor} />

      {/* Ceiling */}
      <Ceiling texture={textures.ceiling} />

      {/* Walls */}
      <MuseumWalls textures={textures} />

      {/* Windows */}
      <MuseumWindows />

      {/* Skylights - reduced on mobile */}
      <MuseumSkylights isMobile={isMobile} />

      {/* Wall decorations - pass loadArtwork to defer artwork loading */}
      <WallDecorations loadArtwork={loadArtwork} />

      {/* Lighting */}
      <MuseumLighting isMobile={isMobile} />
    </group>
  );
}

// ============= PEDESTAL COMPONENT EXPORT =============

export function Pedestal({ position, children }: { position: [number, number, number]; children?: React.ReactNode }) {
  return <PedestalComponent position={position}>{children}</PedestalComponent>;
}

// ============= PEDESTAL POSITIONS =============

export const PEDESTAL_POSITIONS: [number, number, number][] = [
  // Room A (Ancient) - 1 pedestal
  [-11, 0, -14],

  // Room B (Central) - 2 pedestals
  [-1.5, 0, -14],
  [1.5, 0, -14],

  // Room C (Medieval) - 1 pedestal
  [11, 0, -14],

  // North Corridor - 4 pedestals
  [-12, 0, -8],
  [-4, 0, -8],
  [4, 0, -8],
  [12, 0, -8],

  // Room D (Classical) - 1 pedestal
  [-11, 0, 0],

  // Grand Hall - 3 pedestals
  [-2, 0, 2],
  [2, 0, 2],
  [0, 0, 6],

  // Room E (Modern) - 1 pedestal
  [11, 0, 0],

  // South Corridor - 2 pedestals
  [-10, 0, 12],
  [10, 0, 12],

  // Entrance Lobby - 2 pedestals
  [-3, 0, 16],
  [3, 0, 16],
];

export const GALLERY_CONFIG = GALLERY;
