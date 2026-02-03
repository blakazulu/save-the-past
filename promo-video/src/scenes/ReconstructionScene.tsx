import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { loadFont } from "@remotion/google-fonts/Heebo";
import * as THREE from "three";

const { fontFamily: heeboFont } = loadFont();

// Detailed 3D Artifact - Ancient Amphora
const DetailedArtifact: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rotation driven by frame
  const rotationY = frame * 0.025;
  const rotationX = Math.sin(frame * 0.008) * 0.15;

  // Scale animation for entrance
  const scale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 50 },
  });

  // Pulsing glow
  const glowIntensity = interpolate(
    Math.sin(frame * 0.06),
    [-1, 1],
    [0.05, 0.2]
  );

  // Create amphora profile points for lathe geometry
  const points: THREE.Vector2[] = [];
  // Bottom
  points.push(new THREE.Vector2(0.0, -1.8));
  points.push(new THREE.Vector2(0.15, -1.75));
  points.push(new THREE.Vector2(0.25, -1.6));
  // Body curve
  points.push(new THREE.Vector2(0.5, -1.2));
  points.push(new THREE.Vector2(0.75, -0.6));
  points.push(new THREE.Vector2(0.85, 0));
  points.push(new THREE.Vector2(0.8, 0.5));
  points.push(new THREE.Vector2(0.65, 0.9));
  // Shoulder
  points.push(new THREE.Vector2(0.45, 1.1));
  points.push(new THREE.Vector2(0.35, 1.2));
  // Neck
  points.push(new THREE.Vector2(0.28, 1.4));
  points.push(new THREE.Vector2(0.25, 1.6));
  points.push(new THREE.Vector2(0.28, 1.75));
  // Rim
  points.push(new THREE.Vector2(0.35, 1.8));
  points.push(new THREE.Vector2(0.32, 1.85));
  points.push(new THREE.Vector2(0.25, 1.85));

  return (
    <group scale={scale * 1.3} rotation={[rotationX, rotationY, 0]}>
      {/* Main vessel body */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[points, 64]} />
        <meshStandardMaterial
          color="#C17F59"
          roughness={0.75}
          metalness={0.05}
          emissive="#8B4513"
          emissiveIntensity={glowIntensity}
        />
      </mesh>

      {/* Decorative band 1 - upper body */}
      <mesh position={[0, 0.7, 0]}>
        <torusGeometry args={[0.72, 0.04, 16, 64]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>

      {/* Decorative band 2 - middle */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.87, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#654321"
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Decorative band 3 - lower body */}
      <mesh position={[0, -0.8, 0]}>
        <torusGeometry args={[0.65, 0.04, 16, 64]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>

      {/* Rim detail */}
      <mesh position={[0, 1.82, 0]}>
        <torusGeometry args={[0.3, 0.035, 16, 64]} />
        <meshStandardMaterial
          color="#A0522D"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Decorative patterns - vertical lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.83, 0, Math.sin(angle) * 0.83]}
            rotation={[0, -angle + Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.02, 1.2, 0.01]} />
            <meshStandardMaterial
              color="#654321"
              roughness={0.7}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {/* Surface imperfections - small bumps */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + 0.3;
        const y = -0.3 + (i % 3) * 0.5;
        const r = 0.78 + (i % 2) * 0.05;
        return (
          <mesh
            key={`bump-${i}`}
            position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}
          >
            <sphereGeometry args={[0.03 + (i % 3) * 0.01, 8, 8]} />
            <meshStandardMaterial
              color="#A0522D"
              roughness={0.8}
              metalness={0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Processing particle effect
const ProcessingParticle: React.FC<{
  index: number;
  total: number;
  frame: number;
}> = ({ index, total, frame }) => {
  const angle = (index / total) * Math.PI * 2 + frame * 0.02;
  const radius = 180 + Math.sin(frame * 0.05 + index) * 20;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const size = 4 + Math.sin(frame * 0.1 + index * 0.5) * 2;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#C17F59",
        transform: `translate(${x}px, ${y}px)`,
        opacity: 0.6,
        boxShadow: "0 0 10px rgba(193,127,89,0.8)",
      }}
    />
  );
};

export const ReconstructionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Title entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Processing phase (first half)
  const processingOpacity = interpolate(
    frame,
    [0, 20, 130, 150],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // 3D reveal phase (second half)
  const modelOpacity = interpolate(frame, [140, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress simulation
  const progress = interpolate(frame, [30, 140], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const processingSteps = [
    { label: "מנתח תמונה...", threshold: 20 },
    { label: "מזהה מאפיינים...", threshold: 40 },
    { label: "בונה מודל תלת-ממדי...", threshold: 60 },
    { label: "יוצר טקסטורות...", threshold: 80 },
    { label: "משלים עיבוד...", threshold: 95 },
  ];

  const currentStep = processingSteps.findIndex((s) => progress < s.threshold);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, #2d1810 0%, #1a0f0a 100%)",
        direction: "rtl",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 52,
            fontWeight: 700,
            color: "#E8DCC4",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          שחזור תלת-ממדי מבוסס AI
        </div>
        <div
          style={{
            marginTop: 15,
            fontFamily: heeboFont,
            fontSize: 24,
            fontWeight: 400,
            color: "#C17F59",
          }}
        >
          צפה בממצא שלך מתעורר לחיים
        </div>
      </div>

      {/* Center area */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
        }}
      >
        {/* Processing animation */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: processingOpacity,
          }}
        >
          {/* Rotating particles */}
          {Array.from({ length: 24 }).map((_, i) => (
            <ProcessingParticle key={i} index={i} total={24} frame={frame} />
          ))}

          {/* Center processing cube */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 80,
              height: 80,
              transform: `translate(-50%, -50%) rotateX(${frame * 2}deg) rotateY(${frame * 3}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Cube faces */}
            {[
              { transform: "translateZ(40px)", bg: "rgba(193,127,89,0.8)" },
              {
                transform: "translateZ(-40px) rotateY(180deg)",
                bg: "rgba(193,127,89,0.6)",
              },
              {
                transform: "translateX(40px) rotateY(90deg)",
                bg: "rgba(193,127,89,0.7)",
              },
              {
                transform: "translateX(-40px) rotateY(-90deg)",
                bg: "rgba(193,127,89,0.7)",
              },
              {
                transform: "translateY(-40px) rotateX(90deg)",
                bg: "rgba(193,127,89,0.5)",
              },
              {
                transform: "translateY(40px) rotateX(-90deg)",
                bg: "rgba(193,127,89,0.5)",
              },
            ].map((face, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 80,
                  height: 80,
                  background: face.bg,
                  border: "2px solid rgba(232,220,196,0.3)",
                  transform: face.transform,
                  backfaceVisibility: "visible",
                }}
              />
            ))}
          </div>
        </div>

        {/* 3D Model reveal */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: modelOpacity,
          }}
        >
          <ThreeCanvas width={500} height={500}>
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[5, 5, 5]}
              intensity={0.9}
              color="#fff5e6"
              castShadow
            />
            <directionalLight
              position={[-3, 3, -3]}
              intensity={0.4}
              color="#C17F59"
            />
            <pointLight
              position={[0, -3, 0]}
              intensity={0.3}
              color="#8B4513"
            />
            <spotLight
              position={[0, 5, 0]}
              intensity={0.5}
              angle={0.4}
              penumbra={0.5}
              color="#fff5e6"
            />
            <DetailedArtifact />
          </ThreeCanvas>
        </div>
      </div>

      {/* Progress bar and status */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          opacity: processingOpacity,
        }}
      >
        {/* Current step label */}
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 20,
            fontWeight: 500,
            color: "#E8DCC4",
            textAlign: "center",
            marginBottom: 20,
            height: 30,
          }}
        >
          {currentStep >= 0 ? processingSteps[currentStep].label : "הושלם!"}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 10,
            background: "rgba(0,0,0,0.4)",
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #8B4513, #C17F59, #E8DCC4)",
              borderRadius: 5,
              boxShadow: "0 0 20px rgba(193,127,89,0.6)",
            }}
          />
        </div>

        {/* Percentage */}
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 28,
            fontWeight: 700,
            color: "#C17F59",
            textAlign: "center",
            marginTop: 15,
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* Success message */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: modelOpacity,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 32,
            fontWeight: 700,
            color: "#4CAF50",
            textAlign: "center",
            textShadow: "0 0 20px rgba(76,175,80,0.5)",
          }}
        >
          השחזור הושלם
        </div>
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 20,
            fontWeight: 400,
            color: "#E8DCC4",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          גרור לסיבוב | צבוט לזום | הורדה זמינה
        </div>
      </div>
    </AbsoluteFill>
  );
};
