import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

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

// ============= TEXTURE LOADING =============

function useMuseumTextures() {
  // Load only essential textures to stay under WebGL limit
  const woodFloorTexture = useTexture('/textures/wood_floor_diff.jpg');
  const darkWoodTexture = useTexture('/textures/dark_wood_diff.jpg');

  // Configure texture repeating
  useMemo(() => {
    if (woodFloorTexture) {
      woodFloorTexture.wrapS = woodFloorTexture.wrapT = THREE.RepeatWrapping;
      woodFloorTexture.repeat.set(10, 12);
    }
    if (darkWoodTexture) {
      darkWoodTexture.wrapS = darkWoodTexture.wrapT = THREE.RepeatWrapping;
      darkWoodTexture.repeat.set(6, 1);
    }
  }, [woodFloorTexture, darkWoodTexture]);

  return {
    woodFloor: woodFloorTexture,
    darkWood: darkWoodTexture,
  };
}

// ============= FLOOR & CEILING =============

interface FloorProps {
  texture: THREE.Texture;
}

function Floor({ texture }: FloorProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[GALLERY.width, GALLERY.depth]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  );
}

function Ceiling() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, GALLERY.height, 0]}>
      <planeGeometry args={[GALLERY.width, GALLERY.depth]} />
      <meshStandardMaterial
        color="#faf8f5"
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

// ============= WALLS =============

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}

function Wall({ position, size, rotation = [0, 0, 0] }: WallProps) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#f8f4eb"
        roughness={0.9}
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
}

function Doorway({ position, rotation = [0, 0, 0], width = 2.5, height = 3.5 }: DoorwayProps) {
  const wallHeight = GALLERY.height;
  const thickness = GALLERY.wallThickness;
  const aboveHeight = wallHeight - height;

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
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
      {/* Side trims */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 0.05), height / 2, 0]}>
          <boxGeometry args={[0.1, height, thickness * 2 + 0.1]} />
          <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
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
      {/* Frosted glass - bright daylight */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[width - frameWidth * 2, height - frameWidth * 2]} />
        <meshStandardMaterial
          color="#f0f8ff"
          emissive="#e8f4ff"
          emissiveIntensity={0.8}
          roughness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Bright light coming through */}
      <pointLight position={[0, 0, 1]} intensity={1.5} color="#fffaf0" distance={12} decay={2} />

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
      {/* Sky/light panel - bright sunny sky */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          color="#b8e0ff"
          emissive="#d0f0ff"
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* Bright sunlight beam - no shadow to save texture units */}
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
  texture: THREE.Texture;
}

function Wainscoting({ position, width, rotation = [0, 0, 0], texture }: WainscotingProps) {
  const height = 1.2;

  return (
    <mesh position={[position[0], height / 2, position[2]]} rotation={rotation}>
      <boxGeometry args={[width, height, 0.05]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.6}
        metalness={0.05}
      />
    </mesh>
  );
}

// ============= MUSEUM WALLS LAYOUT =============

interface MuseumWallsProps {
  textures: ReturnType<typeof useMuseumTextures>;
}

function MuseumWalls({ textures }: MuseumWallsProps) {
  const { darkWood } = textures;
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
      <Wall position={[0, h / 2, -20]} size={[30, h, t]} />

      {/* Front wall - left section (left of entrance) */}
      <Wall position={[-11, h / 2, 20]} size={[8, h, t]} />

      {/* Front wall - right section (right of entrance) */}
      <Wall position={[11, h / 2, 20]} size={[8, h, t]} />

      {/* Left outer wall (solid) */}
      <Wall position={[-15, h / 2, 0]} size={[t, h, 40]} />

      {/* Right outer wall (solid) */}
      <Wall position={[15, h / 2, 0]} size={[t, h, 40]} />

      {/* ===== ROOM A/B/C DIVIDER WALLS ===== */}

      {/* Wall between Room A and Room B (extends from back wall to corridor wall) */}
      <Wall position={[-6, h / 2, -15]} size={[t, h, 10]} />

      {/* Wall between Room B and Room C (extends from back wall to corridor wall) */}
      <Wall position={[6, h / 2, -15]} size={[t, h, 10]} />

      {/* ===== NORTH CORRIDOR BACK WALL (z=-10) - WITH DOORWAY GAPS ===== */}

      {/* Section 1: Far left (x=-15 to x=-12.25, left of Room A door) */}
      <Wall position={[-13.625, h / 2, -10]} size={[2.75, h, t]} />

      {/* Section 2: Between Room A door and Room B arch (x=-9.75 to x=-1.5) */}
      <Wall position={[-5.625, h / 2, -10]} size={[8.25, h, t]} />

      {/* Section 3: Between Room B arch and Room C door (x=1.5 to x=9.75) */}
      <Wall position={[5.625, h / 2, -10]} size={[8.25, h, t]} />

      {/* Section 4: Far right (x=12.25 to x=15, right of Room C door) */}
      <Wall position={[13.625, h / 2, -10]} size={[2.75, h, t]} />

      {/* ===== NORTH CORRIDOR FRONT WALL (z=-6) - WITH DOORWAY GAPS ===== */}

      {/* Section 1: Far left (x=-15 to x=-12.25, left of Room D door) */}
      <Wall position={[-13.625, h / 2, -6]} size={[2.75, h, t]} />

      {/* Section 2: Between Room D door and Grand Hall arch (x=-9.75 to x=-1.75) */}
      <Wall position={[-5.75, h / 2, -6]} size={[8, h, t]} />

      {/* Section 3: Between Grand Hall arch and Room E door (x=1.75 to x=9.75) */}
      <Wall position={[5.75, h / 2, -6]} size={[8, h, t]} />

      {/* Section 4: Far right (x=12.25 to x=15, right of Room E door) */}
      <Wall position={[13.625, h / 2, -6]} size={[2.75, h, t]} />

      {/* ===== VERTICAL DIVIDER WALLS (Room D/Grand Hall/Room E) ===== */}

      {/* Wall between Room D and Grand Hall (x=-6, from z=-6 to z=6) */}
      <Wall position={[-6, h / 2, 0]} size={[t, h, 12]} />

      {/* Wall between Grand Hall and Room E (x=6, from z=-6 to z=6) */}
      <Wall position={[6, h / 2, 0]} size={[t, h, 12]} />

      {/* ===== SOUTH SIDE WALLS (z=6) ===== */}

      {/* South side of Room D (solid wall) */}
      <Wall position={[-10.5, h / 2, 6]} size={[9, h, t]} />

      {/* South side of Room E (solid wall) */}
      <Wall position={[10.5, h / 2, 6]} size={[9, h, t]} />

      {/* ===== GRAND HALL SOUTH WALL (z=10) - WITH ARCHWAY GAP ===== */}

      {/* Left section (x=-6 to x=-1.5) */}
      <Wall position={[-3.75, h / 2, 10]} size={[4.5, h, t]} />

      {/* Right section (x=1.5 to x=6) */}
      <Wall position={[3.75, h / 2, 10]} size={[4.5, h, t]} />

      {/* ===== SOUTH CORRIDOR WALLS (z=10, outside Grand Hall) ===== */}

      {/* Left corridor wall (x=-15 to x=-6) */}
      <Wall position={[-10.5, h / 2, 10]} size={[9, h, t]} />

      {/* Right corridor wall (x=6 to x=15) */}
      <Wall position={[10.5, h / 2, 10]} size={[9, h, t]} />

      {/* ===== LOBBY SIDE WALLS - WITH DOORWAY GAPS ===== */}

      {/* Left lobby wall - top section (z=13 to z=11, above door) */}
      <Wall position={[-6, h / 2, 14]} size={[t, h, 4]} />
      <Wall position={[-6, h / 2, 11]} size={[t, h, 2]} />

      {/* Right lobby wall - top section */}
      <Wall position={[6, h / 2, 14]} size={[t, h, 4]} />
      <Wall position={[6, h / 2, 11]} size={[t, h, 2]} />

      {/* ===== DOORWAYS & ARCHWAYS (just decorative frames) ===== */}

      {/* Room A doorway frame */}
      <Doorway position={[-11, 0, -10]} width={DOOR_WIDTH} />

      {/* Room B archway frame */}
      <Archway position={[0, 0, -10]} width={ARCH_WIDTH_SMALL} />

      {/* Room C doorway frame */}
      <Doorway position={[11, 0, -10]} width={DOOR_WIDTH} />

      {/* Room D doorway frame */}
      <Doorway position={[-11, 0, -6]} width={DOOR_WIDTH} />

      {/* Room E doorway frame */}
      <Doorway position={[11, 0, -6]} width={DOOR_WIDTH} />

      {/* Grand Hall north archway frame */}
      <Archway position={[0, 0, -6]} width={ARCH_WIDTH_LARGE} />

      {/* Grand Hall south archway frame */}
      <Archway position={[0, 0, 10]} width={ARCH_WIDTH_SMALL} />

      {/* Lobby to south corridor doorways */}
      <Doorway position={[-6, 0, 12]} rotation={[0, Math.PI / 2, 0]} width={2} />
      <Doorway position={[6, 0, 12]} rotation={[0, Math.PI / 2, 0]} width={2} />

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

// ============= SKYLIGHTS =============

function MuseumSkylights() {
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

function MuseumLighting() {
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

      {/* Display surface */}
      <mesh position={[0, 0.96, 0]} receiveShadow>
        <boxGeometry args={[0.85, 0.02, 0.85]} />
        <meshStandardMaterial color={COLORS.pedestalDark} roughness={0.1} metalness={0.3} />
      </mesh>

      {/* Spotlight - no shadow casting to save texture units */}
      <spotLight
        position={[0, 4, 0]}
        angle={0.35}
        penumbra={0.7}
        intensity={2.0}
        color="#fff5e6"
        distance={8}
      />

      {/* Artifact placement */}
      <group position={[0, 1.1, 0]}>
        {children}
      </group>
    </group>
  );
}

// ============= MAIN GALLERY COMPONENT =============

export function ProceduralGallery() {
  const textures = useMuseumTextures();

  return (
    <group>
      {/* Light atmospheric fog */}
      <fog attach="fog" args={['#fefcf8', 25, 80]} />

      {/* Sky backdrop */}
      <mesh position={[0, 20, 0]}>
        <sphereGeometry args={[100, 32, 16]} />
        <meshBasicMaterial color="#d4e5f7" side={THREE.BackSide} />
      </mesh>

      {/* Floor */}
      <Floor texture={textures.woodFloor} />

      {/* Ceiling */}
      <Ceiling />

      {/* Walls */}
      <MuseumWalls textures={textures} />

      {/* Windows */}
      <MuseumWindows />

      {/* Skylights */}
      <MuseumSkylights />

      {/* Lighting */}
      <MuseumLighting />
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
