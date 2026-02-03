import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

// Feature card with icon
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  text: string;
  delay: number;
  frame: number;
  fps: number;
  index: number;
}> = ({ icon, text, delay, frame, fps, index }) => {
  const cardScale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardY = interpolate(frame, [delay, delay + 20], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  // Subtle float animation after entrance
  const floatY = frame > delay + 30 ? Math.sin((frame - delay) * 0.05 + index) * 5 : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        opacity: cardOpacity,
        transform: `scale(${cardScale}) translateY(${cardY + floatY}px)`,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #C17F59, #8B4513)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 15px 40px rgba(193,127,89,0.4)",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: heeboFont,
          fontSize: 26,
          fontWeight: 600,
          color: "#E8DCC4",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Icons
const FreeIcon = () => (
  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#E8DCC4" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M6 12h12" strokeWidth="2" />
  </svg>
);

const NoInstallIcon = () => (
  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#E8DCC4" strokeWidth="1.5">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <circle cx="12" cy="18" r="1" fill="#E8DCC4" />
    <path d="M9 6h6M9 9h6" />
  </svg>
);

const OpenSourceIcon = () => (
  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#E8DCC4" strokeWidth="1.5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const titleY = interpolate(frame, [0, 25], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA pulse
  const ctaGlow = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.3, 0.7]
  );

  const ctaScale = spring({
    frame: frame - 120,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const ctaOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const features = [
    { icon: <FreeIcon />, text: "חינם לשימוש" },
    { icon: <NoInstallIcon />, text: "ללא התקנה" },
    { icon: <OpenSourceIcon />, text: "קוד פתוח" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, #2d1810 0%, #0a0503 100%)",
        direction: "rtl",
      }}
    >
      {/* Animated background particles */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2 + frame * 0.003;
        const radius = 400 + Math.sin(frame * 0.015 + i) * 150;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const size = 3 + (i % 4);
        const opacity = 0.1 + Math.sin(frame * 0.04 + i) * 0.08;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#C17F59",
              transform: `translate(${x}px, ${y}px)`,
              opacity,
            }}
          />
        );
      })}

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,5,3,0.9) 100%)",
        }}
      />

      {/* Main title */}
      <div
        style={{
          position: "absolute",
          top: 100,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `scale(${titleScale}) translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 72,
            fontWeight: 800,
            color: "#E8DCC4",
            textShadow: "0 4px 30px rgba(193,127,89,0.6), 0 8px 20px rgba(0,0,0,0.8)",
          }}
        >
          מוכנים להתחיל?
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: heeboFont,
            fontSize: 32,
            fontWeight: 400,
            color: "#C17F59",
            opacity: subtitleOpacity,
          }}
        >
          שימור העבר מתחיל עכשיו
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 120,
        }}
      >
        {features.map((feature, i) => (
          <FeatureCard
            key={feature.text}
            icon={feature.icon}
            text={feature.text}
            delay={40 + i * 20}
            frame={frame}
            fps={fps}
            index={i}
          />
        ))}
      </div>

      {/* CTA Button */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: ctaOpacity,
        }}
      >
        <div
          style={{
            padding: "25px 70px",
            background: "linear-gradient(145deg, #C17F59, #8B4513)",
            borderRadius: 60,
            boxShadow: `0 15px 50px rgba(193,127,89,0.5), 0 0 ${40 * ctaGlow}px rgba(193,127,89,${ctaGlow * 0.6})`,
            transform: `scale(${ctaScale})`,
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            התחל לשמר היסטוריה
          </div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [150, 180], [0, 500], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 2,
          background: "linear-gradient(90deg, transparent, #C17F59, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
