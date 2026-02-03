import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";

// Load Hebrew-supporting font
import { loadFont } from "@remotion/google-fonts/Heebo";
const { fontFamily: heeboFont } = loadFont();

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Particles floating in background
  const particles = Array.from({ length: 30 }, (_, i) => ({
    x: (i * 73) % 100,
    y: (i * 47) % 100,
    size: 2 + (i % 5),
    speed: 0.3 + (i % 3) * 0.2,
    delay: i * 3,
  }));

  // Logo entrance with spring
  const logoScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const logoOpacity = interpolate(frame, [15, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow pulse effect
  const glowIntensity = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.3, 0.8]
  );

  // Tagline fade in
  const taglineOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [90, 120], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle stagger
  const subtitleOpacity = interpolate(frame, [130, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, #1a0f0a 0%, #0a0503 100%)",
        overflow: "hidden",
        direction: "rtl",
      }}
    >
      {/* Animated dust particles */}
      {particles.map((p, i) => {
        const particleY =
          ((p.y + (frame - p.delay) * p.speed * 0.3) % 120) - 10;
        const particleOpacity = interpolate(
          frame - p.delay,
          [0, 30, 180, 210],
          [0, 0.6, 0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${particleY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "#C17F59",
              opacity: particleOpacity * 0.5,
              filter: "blur(1px)",
            }}
          />
        );
      })}

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,5,3,0.8) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Main logo container */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Logo glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(193,127,89,${glowIntensity * 0.3}) 0%, transparent 70%)`,
            filter: "blur(40px)",
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        />

        {/* Logo */}
        <Img
          src={staticFile("logo-full.png")}
          style={{
            width: 450,
            height: "auto",
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            filter: `drop-shadow(0 0 ${20 + glowIntensity * 30}px rgba(193,127,89,${glowIntensity}))`,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            position: "absolute",
            top: "68%",
            textAlign: "center",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 48,
              fontWeight: 700,
              color: "#E8DCC4",
              letterSpacing: "0.05em",
              textShadow:
                "0 0 30px rgba(193,127,89,0.5), 0 4px 8px rgba(0,0,0,0.8)",
            }}
          >
            שחזור ארכיאולוגיה דיגיטלית
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            position: "absolute",
            top: "76%",
            textAlign: "center",
            opacity: subtitleOpacity,
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 28,
              fontWeight: 400,
              color: "#C17F59",
            }}
          >
            הפוך ממצאים ארכיאולוגיים למודלים תלת-ממדיים
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom ornamental line */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [160, 200], [0, 400], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 2,
          background:
            "linear-gradient(90deg, transparent, #C17F59, transparent)",
          opacity: interpolate(frame, [160, 200], [0, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
