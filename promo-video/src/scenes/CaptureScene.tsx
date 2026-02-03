import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

// Phone mockup component
const PhoneMockup: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      width: 320,
      height: 650,
      background: "linear-gradient(145deg, #1a1a1a, #0d0d0d)",
      borderRadius: 40,
      padding: 12,
      boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 2px #333",
      position: "relative",
      ...style,
    }}
  >
    {/* Notch */}
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: 120,
        height: 28,
        background: "#0d0d0d",
        borderRadius: 14,
        zIndex: 10,
      }}
    />
    {/* Screen */}
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#F4E4C1",
        borderRadius: 28,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  </div>
);

// AI Magic sparkle icon
const AISparkleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path
      d="M24 4L27 17L40 20L27 23L24 36L21 23L8 20L21 17L24 4Z"
      fill="#C17F59"
      stroke="#E8DCC4"
      strokeWidth="1"
    />
    <circle cx="38" cy="10" r="3" fill="#E8DCC4" opacity="0.8" />
    <circle cx="10" cy="38" r="2" fill="#E8DCC4" opacity="0.6" />
    <circle cx="40" cy="36" r="2" fill="#E8DCC4" opacity="0.5" />
  </svg>
);

export const CaptureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance
  const phoneScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const phoneX = interpolate(frame, [0, 30], [-400, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera flash effect - single shot
  const isFlashing = frame >= 100 && frame < 105;

  // Photo captured indicator
  const photoCaptured = frame > 105;
  const checkmarkScale = spring({
    frame: frame - 110,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  // AI processing indicator
  const aiProcessing = frame > 140;
  const aiPulse = Math.sin(frame * 0.15) * 0.1 + 1;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a0f0a 0%, #2d1810 100%)",
        direction: "rtl",
      }}
    >
      {/* Flash overlay */}
      {isFlashing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: 0.4,
            zIndex: 100,
          }}
        />
      )}

      {/* Left side - Phone mockup */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: "50%",
          transform: `translateY(-50%) translateX(${phoneX}px) scale(${phoneScale})`,
        }}
      >
        <PhoneMockup>
          {/* Camera viewfinder simulation */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, #3d2914 0%, #2d1810 100%)",
            }}
          >
            {/* Simulated artifact in viewfinder - detailed vase */}
            <div
              style={{
                position: "absolute",
                top: "25%",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {/* Vase body */}
              <div
                style={{
                  width: 140,
                  height: 180,
                  background:
                    "linear-gradient(145deg, #C17F59 0%, #A0522D 50%, #8B4513 100%)",
                  borderRadius: "45% 45% 35% 35% / 50% 50% 30% 30%",
                  boxShadow:
                    "inset -20px 0 30px rgba(0,0,0,0.3), inset 20px 0 30px rgba(255,255,255,0.1), 0 15px 40px rgba(0,0,0,0.5)",
                  position: "relative",
                }}
              >
                {/* Decorative bands */}
                <div
                  style={{
                    position: "absolute",
                    top: "20%",
                    left: "5%",
                    right: "5%",
                    height: 8,
                    background:
                      "linear-gradient(90deg, #8B4513, #654321, #8B4513)",
                    borderRadius: 4,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "60%",
                    left: "5%",
                    right: "5%",
                    height: 8,
                    background:
                      "linear-gradient(90deg, #8B4513, #654321, #8B4513)",
                    borderRadius: 4,
                  }}
                />
                {/* Neck */}
                <div
                  style={{
                    position: "absolute",
                    top: -40,
                    left: "30%",
                    width: "40%",
                    height: 50,
                    background:
                      "linear-gradient(145deg, #C17F59 0%, #8B4513 100%)",
                    borderRadius: "20% 20% 0 0",
                  }}
                />
                {/* Rim */}
                <div
                  style={{
                    position: "absolute",
                    top: -50,
                    left: "20%",
                    width: "60%",
                    height: 15,
                    background:
                      "linear-gradient(145deg, #A0522D, #8B4513)",
                    borderRadius: "50% 50% 0 0",
                  }}
                />
              </div>
            </div>

            {/* Capture frame */}
            <div
              style={{
                position: "absolute",
                top: "15%",
                left: "10%",
                right: "10%",
                bottom: "25%",
                border: `3px solid ${photoCaptured ? "#4CAF50" : "rgba(255,255,255,0.6)"}`,
                borderRadius: 12,
              }}
            >
              {/* Corner markers */}
              {[
                { top: -3, left: -3 },
                { top: -3, right: -3 },
                { bottom: -3, left: -3 },
                { bottom: -3, right: -3 },
              ].map((pos, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 25,
                    height: 25,
                    borderColor: photoCaptured ? "#4CAF50" : "#C17F59",
                    borderStyle: "solid",
                    borderWidth: 0,
                    ...(pos.top !== undefined && {
                      top: pos.top,
                      borderTopWidth: 4,
                    }),
                    ...(pos.bottom !== undefined && {
                      bottom: pos.bottom,
                      borderBottomWidth: 4,
                    }),
                    ...(pos.left !== undefined && {
                      left: pos.left,
                      borderLeftWidth: 4,
                    }),
                    ...(pos.right !== undefined && {
                      right: pos.right,
                      borderRightWidth: 4,
                    }),
                  }}
                />
              ))}
            </div>

            {/* Photo captured checkmark */}
            {photoCaptured && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) scale(${checkmarkScale})`,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(76, 175, 80, 0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 30px rgba(76,175,80,0.5)",
                  opacity: interpolate(frame, [110, 130, 140, 160], [0, 1, 1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            )}

            {/* AI Processing indicator */}
            {aiProcessing && (
              <div
                style={{
                  position: "absolute",
                  bottom: 100,
                  left: "50%",
                  transform: `translateX(-50%) scale(${aiPulse})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  background: "rgba(193,127,89,0.9)",
                  borderRadius: 30,
                  boxShadow: "0 0 20px rgba(193,127,89,0.5)",
                }}
              >
                <AISparkleIcon />
                <span
                  style={{
                    fontFamily: heeboFont,
                    fontSize: 14,
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  AI יוצר תלת-ממד...
                </span>
              </div>
            )}

            {/* Single image badge */}
            <div
              style={{
                position: "absolute",
                top: 50,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "8px 16px",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 20,
                border: "1px solid rgba(193,127,89,0.5)",
              }}
            >
              <span
                style={{
                  fontFamily: heeboFont,
                  fontSize: 12,
                  color: "#E8DCC4",
                }}
              >
                תמונה בודדת מספיקה
              </span>
            </div>

            {/* Capture button */}
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: photoCaptured
                  ? "linear-gradient(145deg, #4CAF50, #2E7D32)"
                  : "#fff",
                border: "5px solid rgba(0,0,0,0.2)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {photoCaptured && (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
          </div>
        </PhoneMockup>
      </div>

      {/* Right side - Text content */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: "50%",
          transform: "translateY(-50%)",
          width: 600,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 52,
            fontWeight: 700,
            color: "#E8DCC4",
            marginBottom: 30,
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          תמונה אחת. זה הכל.
        </div>
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 26,
            fontWeight: 400,
            color: "#C17F59",
            lineHeight: 1.6,
            marginBottom: 40,
          }}
        >
          צלם תמונה בודדת של הממצא והבינה המלאכותית שלנו תיצור מודל תלת-ממדי מלא
          באופן אוטומטי.
        </div>

        {/* Feature bullets */}
        <div style={{ marginTop: 40 }}>
          {[
            { icon: "📸", text: "צילום מהיר ופשוט" },
            { icon: "🤖", text: "AI מתקדם ליצירת תלת-ממד" },
            { icon: "⚡", text: "תוצאות תוך שניות" },
          ].map((feature, i) => {
            const featureOpacity = interpolate(
              frame,
              [40 + i * 20, 60 + i * 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const featureX = interpolate(
              frame,
              [40 + i * 20, 60 + i * 20],
              [30, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={feature.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 20,
                  opacity: featureOpacity,
                  transform: `translateX(${featureX}px)`,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    background: "rgba(193,127,89,0.2)",
                    border: "1px solid rgba(193,127,89,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  {feature.icon}
                </div>
                <div
                  style={{
                    fontFamily: heeboFont,
                    fontSize: 22,
                    fontWeight: 500,
                    color: "#E8DCC4",
                  }}
                >
                  {feature.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Badge */}
        <div
          style={{
            marginTop: 50,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "15px 25px",
            background:
              "linear-gradient(145deg, rgba(193,127,89,0.2), rgba(139,69,19,0.2))",
            borderRadius: 50,
            border: "1px solid rgba(193,127,89,0.4)",
            opacity: interpolate(frame, [120, 150], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <AISparkleIcon />
          <span
            style={{
              fontFamily: heeboFont,
              fontSize: 18,
              fontWeight: 600,
              color: "#C17F59",
            }}
          >
            מופעל על ידי בינה מלאכותית מתקדמת
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
