import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

// Animated character for URL
const AnimatedChar: React.FC<{
  char: string;
  index: number;
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ char, index, frame, fps, startFrame }) => {
  const charDelay = index * 3;
  const animStart = startFrame + charDelay;

  const charOpacity = interpolate(
    frame,
    [animStart, animStart + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const charY = interpolate(
    frame,
    [animStart, animStart + 20],
    [30, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(2)),
    }
  );

  const charScale = interpolate(
    frame,
    [animStart, animStart + 10, animStart + 20],
    [0.5, 1.2, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const glowAmount = interpolate(
    frame,
    [animStart + 10, animStart + 25, animStart + 40],
    [0, 15, 5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <span
      style={{
        display: "inline-block",
        opacity: charOpacity,
        transform: `translateY(${charY}px) scale(${charScale})`,
        textShadow: `0 0 ${glowAmount}px #C17F59, 0 0 ${glowAmount * 2}px rgba(193,127,89,0.5)`,
      }}
    >
      {char}
    </span>
  );
};

// Fragment that flies inward
const Fragment: React.FC<{
  index: number;
  frame: number;
  totalFragments: number;
}> = ({ index, frame, totalFragments }) => {
  // Random but deterministic starting positions (far from center)
  const angle = (index / totalFragments) * Math.PI * 2 + (index * 0.5);
  const startDistance = 800 + (index % 5) * 100;
  const startX = Math.cos(angle) * startDistance;
  const startY = Math.sin(angle) * startDistance;

  // Rotation
  const startRotation = (index * 73) % 360;

  // Size variation
  const size = 15 + (index % 4) * 10;

  // Staggered timing - fragments arrive at different times, climax at frame 120
  const delay = (index % 8) * 5;
  const progress = interpolate(
    frame - delay,
    [0, 110],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  // Current position (flying inward)
  const x = interpolate(progress, [0, 1], [startX, 0]);
  const y = interpolate(progress, [0, 1], [startY, 0]);
  const rotation = interpolate(progress, [0, 1], [startRotation, 0]);
  const scale = interpolate(progress, [0, 0.8, 1], [1, 1.2, 0]);
  const opacity = interpolate(progress, [0, 0.3, 0.9, 1], [0.8, 1, 1, 0]);

  // Color variation - warm tones
  const colors = ["#C17F59", "#E8DCC4", "#A0522D", "#8B4513", "#D4A574"];
  const color = colors[index % colors.length];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        borderRadius: "50%",
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        boxShadow: `0 0 ${size}px ${color}`,
      }}
    />
  );
};

export const LogoRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFragments = 60;

  // Logo appears after fragments converge - climax at frame 120 (59 seconds)
  const logoOpacity = interpolate(
    frame,
    [100, 120],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const logoScale = interpolate(
    frame,
    [100, 120],
    [0.5, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.5)),
    }
  );

  // Shockwave effect when logo appears
  const shockwaveScale = interpolate(
    frame,
    [110, 135],
    [0, 3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const shockwaveOpacity = interpolate(
    frame,
    [110, 135],
    [0.6, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Glow pulse - continues pulsing after reveal
  const glowIntensity = interpolate(
    frame,
    [105, 115, 120],
    [0, 1, 0.8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  ) + (frame > 120 ? Math.sin((frame - 120) * 0.1) * 0.15 : 0);

  // Subtle breathing scale after reveal - logo stays until end
  const breatheScale = frame > 120 ? 1 + Math.sin((frame - 120) * 0.08) * 0.02 : 1;

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, #1a0f0a 0%, #0a0503 100%)",
        overflow: "hidden",
      }}
    >
      {/* Flying fragments */}
      {Array.from({ length: totalFragments }).map((_, i) => (
        <Fragment
          key={i}
          index={i}
          frame={frame}
          totalFragments={totalFragments}
        />
      ))}

      {/* Shockwave ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: "3px solid #C17F59",
          transform: `translate(-50%, -50%) scale(${shockwaveScale})`,
          opacity: shockwaveOpacity,
          boxShadow: "0 0 30px #C17F59",
        }}
      />

      {/* Logo glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(193,127,89,${glowIntensity * 0.5}) 0%, transparent 60%)`,
          transform: "translate(-50%, -50%)",
          filter: "blur(30px)",
          opacity: logoOpacity,
        }}
      />

      {/* Main logo */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("logo-full.png")}
          style={{
            width: 500,
            height: "auto",
            opacity: logoOpacity,
            transform: `scale(${logoScale * breatheScale})`,
            filter: `drop-shadow(0 0 ${30 * glowIntensity}px rgba(193,127,89,${glowIntensity}))`,
          }}
        />
      </AbsoluteFill>

      {/* Website URL - animated reveal starting at frame 150 */}
      {frame >= 150 && (
        <div
          style={{
            position: "absolute",
            bottom: 180,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 52,
              fontWeight: 600,
              color: "#E8DCC4",
              letterSpacing: "0.05em",
            }}
          >
            {"save-the-past.netlify.app".split("").map((char, i) => (
              <AnimatedChar
                key={i}
                char={char}
                index={i}
                frame={frame}
                fps={fps}
                startFrame={150}
              />
            ))}
          </div>
        </div>
      )}

      {/* Decorative line under URL */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(
            frame,
            [200, 230],
            [0, 600],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          height: 2,
          background: "linear-gradient(90deg, transparent, #C17F59, transparent)",
          opacity: interpolate(
            frame,
            [200, 220],
            [0, 0.8],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
        }}
      />
    </AbsoluteFill>
  );
};
