import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

// Beautiful SVG Icons
const DevicesIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" strokeLinecap="round" />
    <rect x="2" y="6" width="6" height="10" rx="1" opacity="0.5" />
    <rect x="16" y="6" width="6" height="10" rx="1" opacity="0.5" />
  </svg>
);

const OfflineIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
    <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
  </svg>
);

const LanguageIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const PrivacyIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" strokeWidth="2" />
  </svg>
);

// Feature card component
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ icon, title, description, delay, frame, fps }) => {
  const cardScale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const cardOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stagger animation for internal elements
  const iconScale = spring({
    frame: frame - delay - 5,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        width: 260,
        padding: 30,
        background:
          "linear-gradient(145deg, rgba(45,24,16,0.95), rgba(26,15,10,0.98))",
        borderRadius: 20,
        border: "1px solid rgba(193,127,89,0.3)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        transform: `scale(${cardScale})`,
        opacity: cardOpacity,
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 70,
          height: 70,
          margin: "0 auto 20px",
          background: "linear-gradient(145deg, #C17F59, #8B4513)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E8DCC4",
          transform: `scale(${iconScale})`,
          boxShadow: "0 10px 30px rgba(193,127,89,0.4)",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: heeboFont,
          fontSize: 22,
          fontWeight: 700,
          color: "#E8DCC4",
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: heeboFont,
          fontSize: 15,
          fontWeight: 400,
          color: "#C17F59",
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  );
};

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    {
      icon: <DevicesIcon />,
      title: "עובד בכל מקום",
      description: "PWA שרץ על כל מכשיר - ללא צורך בהתקנה",
    },
    {
      icon: <OfflineIcon />,
      title: "עובד אופליין",
      description: "צלם ונתח ממצאים גם ללא חיבור לאינטרנט",
    },
    {
      icon: <LanguageIcon />,
      title: "דו-לשוני",
      description: "תמיכה מלאה בעברית ואנגלית עם עיצוב RTL",
    },
    {
      icon: <PrivacyIcon />,
      title: "פרטיות קודם",
      description: "אחסון מקומי עם אפשרות שיתוף בענן",
    },
  ];

  // Title animation
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
          "radial-gradient(ellipse at center, #2d1810 0%, #1a0f0a 100%)",
        direction: "rtl",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i * 57) % 100;
          const baseY = (i * 43) % 100;
          const y = ((baseY + frame * 0.1 * ((i % 3) + 1) * 0.3) % 120) - 10;
          const size = 3 + (i % 4);
          const opacity = 0.1 + (i % 5) * 0.05;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: "50%",
                background: "#C17F59",
                opacity,
              }}
            />
          );
        })}
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
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
          בנוי לשטח
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
          טכנולוגיה מודרנית פוגשת גילויים עתיקים
        </div>
      </div>

      {/* Feature cards grid */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 25,
          marginTop: 50,
        }}
      >
        {features.map((feature, i) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={30 + i * 15}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [120, 150], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 22,
            fontWeight: 300,
            fontStyle: "italic",
            color: "#E8DCC4",
          }}
        >
          "משמרים מורשת תרבותית לדורות הבאים"
        </div>
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [130, 160], [0, 300], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 2,
          background:
            "linear-gradient(90deg, transparent, #C17F59, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
