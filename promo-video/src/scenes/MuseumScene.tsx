import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { loadFont } from "@remotion/google-fonts/Heebo";
import * as THREE from "three";

const { fontFamily: heeboFont } = loadFont();

// Detailed artifact for museum display
const MuseumArtifact: React.FC<{
  position: [number, number, number];
  rotationSpeed: number;
  type: "vase" | "bowl" | "figurine";
  frame: number;
}> = ({ position, rotationSpeed, type, frame }) => {
  const rotation = frame * rotationSpeed;

  const getArtifactGeometry = () => {
    switch (type) {
      case "vase": {
        const points: THREE.Vector2[] = [];
        points.push(new THREE.Vector2(0.0, -0.8));
        points.push(new THREE.Vector2(0.08, -0.75));
        points.push(new THREE.Vector2(0.2, -0.5));
        points.push(new THREE.Vector2(0.32, 0));
        points.push(new THREE.Vector2(0.28, 0.3));
        points.push(new THREE.Vector2(0.18, 0.5));
        points.push(new THREE.Vector2(0.12, 0.6));
        points.push(new THREE.Vector2(0.16, 0.65));
        return <latheGeometry args={[points, 32]} />;
      }
      case "bowl":
        return (
          <sphereGeometry
            args={[0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
        );
      case "figurine": {
        const points: THREE.Vector2[] = [];
        points.push(new THREE.Vector2(0.0, -0.4));
        points.push(new THREE.Vector2(0.15, -0.35));
        points.push(new THREE.Vector2(0.12, -0.1));
        points.push(new THREE.Vector2(0.08, 0.1));
        points.push(new THREE.Vector2(0.1, 0.25));
        points.push(new THREE.Vector2(0.06, 0.35));
        points.push(new THREE.Vector2(0.0, 0.4));
        return <latheGeometry args={[points, 24]} />;
      }
    }
  };

  return (
    <group position={position}>
      {/* Glass display case base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Marble top */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.75, 0.04, 0.75]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Glass case */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.7]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0}
          metalness={0.1}
        />
      </mesh>
      {/* Artifact */}
      <group position={[0, 0.6, 0]} rotation={[0, rotation, 0]}>
        <mesh castShadow>
          {getArtifactGeometry()}
          <meshStandardMaterial
            color="#C17F59"
            roughness={0.75}
            metalness={0.05}
            emissive="#8B4513"
            emissiveIntensity={0.08}
          />
        </mesh>
      </group>
      {/* Spotlight from above */}
      <spotLight
        position={[0, 2.5, 0]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.2}
        color="#fff8e7"
        distance={5}
        castShadow
      />
    </group>
  );
};

// Wall with molding and frame
const MuseumWall: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  hasPainting?: boolean;
}> = ({ position, rotation, width, hasPainting }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main wall */}
      <mesh>
        <planeGeometry args={[width, 8]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      {/* Wainscoting (lower wall panel) */}
      <mesh position={[0, -2.5, 0.02]}>
        <planeGeometry args={[width, 3]} />
        <meshStandardMaterial color="#5C4033" roughness={0.8} />
      </mesh>

      {/* Chair rail molding */}
      <mesh position={[0, -1, 0.04]}>
        <boxGeometry args={[width, 0.08, 0.06]} />
        <meshStandardMaterial color="#E8DCC4" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Crown molding at top */}
      <mesh position={[0, 3.8, 0.05]}>
        <boxGeometry args={[width, 0.15, 0.1]} />
        <meshStandardMaterial color="#E8DCC4" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Baseboard */}
      <mesh position={[0, -3.9, 0.03]}>
        <boxGeometry args={[width, 0.2, 0.06]} />
        <meshStandardMaterial color="#3D2914" roughness={0.6} />
      </mesh>

      {/* Painting frame */}
      {hasPainting && (
        <group position={[0, 1, 0.1]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[2.2, 1.7, 0.15]} />
            <meshStandardMaterial
              color="#8B6914"
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          {/* Canvas/painting */}
          <mesh position={[0, 0, 0.08]}>
            <planeGeometry args={[1.9, 1.4]} />
            <meshStandardMaterial color="#2d1810" roughness={0.9} />
          </mesh>
          {/* Inner frame detail */}
          <mesh position={[0, 0, 0.076]}>
            <boxGeometry args={[2, 1.5, 0.02]} />
            <meshStandardMaterial
              color="#A67C00"
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
          {/* Painting light */}
          <spotLight
            position={[0, 1.5, 0.5]}
            angle={0.5}
            penumbra={0.3}
            intensity={0.8}
            color="#fff5e0"
            target-position={[0, 0, 0]}
          />
        </group>
      )}
    </group>
  );
};

// Marble floor tile
const MarbleFloor: React.FC = () => {
  const tileSize = 2;
  const tiles: JSX.Element[] = [];

  for (let x = -6; x <= 6; x++) {
    for (let z = -8; z <= 2; z++) {
      const isAlternate = (x + z) % 2 === 0;
      tiles.push(
        <mesh
          key={`${x}-${z}`}
          position={[x * tileSize, 0, z * tileSize]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[tileSize - 0.02, tileSize - 0.02]} />
          <meshStandardMaterial
            color={isAlternate ? "#E8DCC4" : "#C9B896"}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      );
    }
  }

  return <group position={[0, -4, -4]}>{tiles}</group>;
};

// Ornate column
const Column: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, -3.5, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshStandardMaterial color="#E8DCC4" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, -3.15, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#D4C4A8" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 6, 24]} />
        <meshStandardMaterial color="#F5F0E6" roughness={0.25} metalness={0.1} />
      </mesh>
      {/* Fluting effect (vertical lines) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28]}
          >
            <boxGeometry args={[0.02, 6, 0.04]} />
            <meshStandardMaterial
              color="#E8E0D0"
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
        );
      })}
      {/* Capital */}
      <mesh position={[0, 3.15, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#D4C4A8" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#E8DCC4" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
};

// Ceiling with coffers
const OrnamentedCeiling: React.FC = () => {
  const coffers: JSX.Element[] = [];
  const cofferSize = 3;

  for (let x = -2; x <= 2; x++) {
    for (let z = -3; z <= 0; z++) {
      coffers.push(
        <group key={`${x}-${z}`} position={[x * cofferSize, 4, z * cofferSize - 4]}>
          {/* Coffer recess */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[cofferSize - 0.3, cofferSize - 0.3]} />
            <meshStandardMaterial color="#2d1810" roughness={0.9} />
          </mesh>
          {/* Coffer frame */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
            <boxGeometry args={[cofferSize - 0.1, cofferSize - 0.1, 0.1]} />
            <meshStandardMaterial color="#5C4033" roughness={0.7} />
          </mesh>
        </group>
      );
    }
  }

  return (
    <group>
      {/* Main ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.1, -4]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#3D2914" roughness={0.9} />
      </mesh>
      {coffers}
    </group>
  );
};

// 3D Museum Environment
const MuseumEnvironment: React.FC = () => {
  const frame = useCurrentFrame();

  // Camera movement through museum
  const cameraZ = interpolate(frame, [0, 300], [6, -4], {
    extrapolateRight: "clamp",
  });
  const cameraX = Math.sin(frame * 0.006) * 1;
  const cameraY = 1 + Math.sin(frame * 0.004) * 0.15;

  const artifacts: Array<{
    position: [number, number, number];
    rotationSpeed: number;
    type: "vase" | "bowl" | "figurine";
  }> = [
    { position: [-2.5, -4, -2], rotationSpeed: 0.018, type: "vase" },
    { position: [0, -4, -5], rotationSpeed: 0.012, type: "bowl" },
    { position: [2.5, -4, -2], rotationSpeed: 0.022, type: "figurine" },
    { position: [-1.5, -4, -8], rotationSpeed: 0.015, type: "figurine" },
    { position: [1.5, -4, -8], rotationSpeed: 0.02, type: "vase" },
  ];

  return (
    <group>
      <group position={[cameraX, -cameraY, cameraZ]}>
        {/* Marble floor */}
        <MarbleFloor />

        {/* Walls */}
        <MuseumWall
          position={[0, 0, -12]}
          rotation={[0, 0, 0]}
          width={16}
          hasPainting
        />
        <MuseumWall
          position={[-8, 0, -4]}
          rotation={[0, Math.PI / 2, 0]}
          width={16}
          hasPainting
        />
        <MuseumWall
          position={[8, 0, -4]}
          rotation={[0, -Math.PI / 2, 0]}
          width={16}
          hasPainting
        />

        {/* Columns */}
        <Column position={[-6, 0, -2]} />
        <Column position={[6, 0, -2]} />
        <Column position={[-6, 0, -8]} />
        <Column position={[6, 0, -8]} />

        {/* Ornamented ceiling */}
        <OrnamentedCeiling />

        {/* Artifacts in display cases */}
        {artifacts.map((artifact, i) => (
          <MuseumArtifact
            key={i}
            position={artifact.position}
            rotationSpeed={artifact.rotationSpeed}
            type={artifact.type}
            frame={frame}
          />
        ))}

        {/* Museum ambient lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={0.3}
          color="#fff5e6"
          castShadow
        />
        {/* Warm accent lights */}
        <pointLight position={[0, 3, -4]} intensity={0.2} color="#FFE4B5" />
        <pointLight position={[-5, 3, -6]} intensity={0.15} color="#FFE4B5" />
        <pointLight position={[5, 3, -6]} intensity={0.15} color="#FFE4B5" />
      </group>
    </group>
  );
};

export const MuseumScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Title fade
  const titleOpacity = interpolate(frame, [0, 30, 250, 280], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // UI overlay animations
  const controlsOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating UI cards
  const cards = [
    { label: "ממצאים בתצוגה", value: "127", delay: 100 },
    { label: "העלאות קהילה", value: "3,450", delay: 130 },
    { label: "מדינות", value: "42", delay: 160 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0503", direction: "rtl" }}>
      {/* 3D Museum Environment */}
      <div style={{ position: "absolute", inset: 0 }}>
        <ThreeCanvas width={width} height={height}>
          <MuseumEnvironment />
        </ThreeCanvas>
      </div>

      {/* Cinematic bars for widescreen effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "linear-gradient(180deg, rgba(10,5,3,0.95), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "linear-gradient(0deg, rgba(10,5,3,0.95), transparent)",
        }}
      />

      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          top: 30,
          right: 50,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 44,
            fontWeight: 700,
            color: "#E8DCC4",
            textShadow:
              "0 2px 20px rgba(0,0,0,0.9), 0 4px 40px rgba(0,0,0,0.8)",
          }}
        >
          חווית מוזיאון וירטואלי
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: heeboFont,
            fontSize: 20,
            fontWeight: 400,
            color: "#C17F59",
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          חקור ממצאים בגלריה תלת-ממדית סוחפת
        </div>
      </div>

      {/* Control hints */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 50,
          display: "flex",
          gap: 15,
          opacity: controlsOpacity,
        }}
      >
        {[
          { icon: "⌨️", label: "WASD לתנועה" },
          { icon: "🖱️", label: "עכבר להסתכלות" },
          { icon: "📱", label: "פקדי מגע" },
        ].map((control) => (
          <div
            key={control.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "rgba(0,0,0,0.7)",
              borderRadius: 8,
              border: "1px solid rgba(193,127,89,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ fontSize: 16 }}>{control.icon}</span>
            <span
              style={{
                fontFamily: heeboFont,
                fontSize: 13,
                fontWeight: 500,
                color: "#E8DCC4",
              }}
            >
              {control.label}
            </span>
          </div>
        ))}
      </div>

      {/* Stats cards */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 50,
          display: "flex",
          flexDirection: "column",
          gap: 15,
        }}
      >
        {cards.map((card) => {
          const cardOpacity = interpolate(
            frame,
            [card.delay, card.delay + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const cardX = interpolate(
            frame,
            [card.delay, card.delay + 20],
            [-30, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={card.label}
              style={{
                padding: "12px 20px",
                background: "rgba(0,0,0,0.75)",
                borderRadius: 10,
                border: "1px solid rgba(193,127,89,0.5)",
                backdropFilter: "blur(4px)",
                opacity: cardOpacity,
                transform: `translateX(${cardX}px)`,
                minWidth: 140,
              }}
            >
              <div
                style={{
                  fontFamily: heeboFont,
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#C17F59",
                  marginBottom: 3,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontFamily: heeboFont,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#E8DCC4",
                }}
              >
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Artifact interaction hint */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 50,
          opacity: interpolate(frame, [200, 230], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            padding: "15px 25px",
            background: "rgba(193,127,89,0.25)",
            borderRadius: 10,
            border: "2px solid rgba(193,127,89,0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 16,
              fontWeight: 500,
              color: "#E8DCC4",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>👆</span>
            לחץ על ממצאים לצפייה בפרטים
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
