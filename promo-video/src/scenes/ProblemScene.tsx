import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

// Better SVG Icons
const PhotoFadeIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="8" y="12" width="40" height="32" rx="4" stroke="#C17F59" strokeWidth="2" opacity="0.3" />
    <rect x="12" y="16" width="40" height="32" rx="4" stroke="#C17F59" strokeWidth="2" opacity="0.5" />
    <rect x="16" y="20" width="40" height="32" rx="4" fill="#2d1810" stroke="#C17F59" strokeWidth="2" />
    <circle cx="28" cy="32" r="4" fill="#C17F59" />
    <path d="M20 44 L30 36 L38 42 L48 32 L52 36 V48 H20 V44Z" fill="#C17F59" opacity="0.6" />
  </svg>
);

const ScatteredDocsIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="6" y="8" width="24" height="32" rx="2" fill="#2d1810" stroke="#C17F59" strokeWidth="2" transform="rotate(-15 6 8)" />
    <rect x="28" y="4" width="24" height="32" rx="2" fill="#2d1810" stroke="#C17F59" strokeWidth="2" transform="rotate(10 28 4)" />
    <rect x="18" y="28" width="24" height="32" rx="2" fill="#2d1810" stroke="#C17F59" strokeWidth="2" />
    <line x1="22" y1="36" x2="38" y2="36" stroke="#C17F59" strokeWidth="2" opacity="0.6" />
    <line x1="22" y1="42" x2="34" y2="42" stroke="#C17F59" strokeWidth="2" opacity="0.6" />
    <line x1="22" y1="48" x2="36" y2="48" stroke="#C17F59" strokeWidth="2" opacity="0.6" />
  </svg>
);

const ContextLostIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="24" stroke="#C17F59" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="32" cy="32" r="16" stroke="#C17F59" strokeWidth="2" opacity="0.5" />
    <circle cx="32" cy="32" r="8" fill="#C17F59" opacity="0.3" />
    <path d="M32 8 V16" stroke="#C17F59" strokeWidth="2" />
    <path d="M32 48 V56" stroke="#C17F59" strokeWidth="2" opacity="0.3" />
    <path d="M8 32 H16" stroke="#C17F59" strokeWidth="2" />
    <path d="M48 32 H56" stroke="#C17F59" strokeWidth="2" opacity="0.3" />
    <text x="28" y="36" fill="#C17F59" fontSize="14" fontWeight="bold">?</text>
  </svg>
);

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const problems = [
    { icon: <PhotoFadeIcon />, text: "תמונות נעלמות עם הזמן" },
    { icon: <ScatteredDocsIcon />, text: "תיעוד מפוזר ולא מאורגן" },
    { icon: <ContextLostIcon />, text: "ההקשר ההיסטורי הולך לאיבוד" },
  ];

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [0, 20], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #1a0f0a 0%, #2d1810 50%, #1a0f0a 100%)",
        direction: "rtl",
      }}
    >
      {/* Background texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C17F59' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 100,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 56,
            fontWeight: 700,
            color: "#E8DCC4",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          האתגר
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: heeboFont,
            fontSize: 28,
            fontWeight: 300,
            color: "#C17F59",
          }}
        >
          ממצאים ארכיאולוגיים ראויים לשימור טוב יותר
        </div>
      </div>

      {/* Problem cards */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        {problems.map((problem, i) => {
          const delay = 30 + i * 20;
          const cardScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Shake effect at the end
          const shake = frame > 120 ? Math.sin(frame * 0.5) * 3 : 0;

          return (
            <div
              key={i}
              style={{
                width: 300,
                padding: 40,
                background:
                  "linear-gradient(145deg, rgba(45,24,16,0.9), rgba(26,15,10,0.95))",
                borderRadius: 16,
                border: "1px solid rgba(193,127,89,0.3)",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
                textAlign: "center",
                transform: `scale(${cardScale}) translateX(${shake}px)`,
                opacity: cardOpacity,
              }}
            >
              <div
                style={{
                  marginBottom: 20,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {problem.icon}
              </div>
              <div
                style={{
                  fontFamily: heeboFont,
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#E8DCC4",
                  lineHeight: 1.4,
                }}
              >
                {problem.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Red warning glow at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: 200,
          background:
            "radial-gradient(ellipse at bottom, rgba(180,60,40,0.2) 0%, transparent 70%)",
          opacity: interpolate(frame, [100, 140], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
