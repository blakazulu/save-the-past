import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const logoOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.3, 0.7]
  );

  // CTA button
  const ctaScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const ctaOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL fade in
  const urlOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Features at bottom
  const features = ["חינם לשימוש", "ללא התקנה", "קוד פתוח"];

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, #2d1810 0%, #0a0503 100%)",
        direction: "rtl",
      }}
    >
      {/* Animated background particles */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 2 + frame * 0.005;
        const radius = 300 + Math.sin(frame * 0.02 + i) * 100 + i * 8;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const size = 2 + (i % 4);
        const opacity = 0.1 + Math.sin(frame * 0.05 + i) * 0.1;

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
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,5,3,0.8) 100%)",
        }}
      />

      {/* Main content */}
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
            background: `radial-gradient(circle, rgba(193,127,89,${glowIntensity * 0.3}) 0%, transparent 60%)`,
            filter: "blur(30px)",
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        />

        {/* Logo */}
        <Img
          src={staticFile("logo-full.png")}
          style={{
            width: 400,
            height: "auto",
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            filter: `drop-shadow(0 0 ${20 + glowIntensity * 20}px rgba(193,127,89,${glowIntensity}))`,
            marginBottom: 40,
          }}
        />

        {/* CTA Button */}
        <div
          style={{
            marginTop: 20,
            padding: "18px 50px",
            background: "linear-gradient(145deg, #C17F59, #8B4513)",
            borderRadius: 50,
            boxShadow: `0 10px 40px rgba(193,127,89,0.4), 0 0 ${30 * glowIntensity}px rgba(193,127,89,${glowIntensity * 0.5})`,
            transform: `scale(${ctaScale})`,
            opacity: ctaOpacity,
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            התחל לשמר היסטוריה
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 30,
            opacity: urlOpacity,
          }}
        >
          <div
            style={{
              fontFamily: heeboFont,
              fontSize: 26,
              fontWeight: 500,
              color: "#E8DCC4",
              letterSpacing: "0.02em",
            }}
          >
            save-the-past.netlify.app
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom features */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        {features.map((feature, i) => {
          const featureOpacity = interpolate(
            frame,
            [110 + i * 15, 130 + i * 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: featureOpacity,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #4CAF50, #2E7D32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: heeboFont,
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#E8DCC4",
                }}
              >
                {feature}
              </div>
            </div>
          );
        })}
      </div>

      {/* Corner decorations */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 80,
          height: 80,
          borderLeft: "3px solid rgba(193,127,89,0.4)",
          borderTop: "3px solid rgba(193,127,89,0.4)",
          opacity: interpolate(frame, [140, 160], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          width: 80,
          height: 80,
          borderRight: "3px solid rgba(193,127,89,0.4)",
          borderTop: "3px solid rgba(193,127,89,0.4)",
          opacity: interpolate(frame, [145, 165], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          width: 80,
          height: 80,
          borderLeft: "3px solid rgba(193,127,89,0.4)",
          borderBottom: "3px solid rgba(193,127,89,0.4)",
          opacity: interpolate(frame, [150, 170], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          width: 80,
          height: 80,
          borderRight: "3px solid rgba(193,127,89,0.4)",
          borderBottom: "3px solid rgba(193,127,89,0.4)",
          opacity: interpolate(frame, [155, 175], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
