import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Heebo";

const { fontFamily: heeboFont } = loadFont();

// Info card data field
const InfoField: React.FC<{
  label: string;
  value: string;
  confidence?: "high" | "medium" | "low";
  delay: number;
  frame: number;
}> = ({ label, value, confidence, delay, frame }) => {
  const fieldOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fieldX = interpolate(frame, [delay, delay + 15], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const confidenceColors = {
    high: "#4CAF50",
    medium: "#FFC107",
    low: "#FF9800",
  };

  const confidenceLabels = {
    high: "גבוהה",
    medium: "בינונית",
    low: "נמוכה",
  };

  return (
    <div
      style={{
        opacity: fieldOpacity,
        transform: `translateX(${fieldX}px)`,
        marginBottom: 16,
        padding: "12px 16px",
        background: "rgba(0,0,0,0.3)",
        borderRadius: 10,
        borderRight: `4px solid ${confidence ? confidenceColors[confidence] : "#C17F59"}`,
      }}
    >
      <div
        style={{
          fontFamily: heeboFont,
          fontSize: 13,
          fontWeight: 600,
          color: "#C17F59",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {label}
        {confidence && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 10,
              background: confidenceColors[confidence],
              color: "#fff",
            }}
          >
            {confidenceLabels[confidence]}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: heeboFont,
          fontSize: 17,
          fontWeight: 400,
          color: "#E8DCC4",
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
};

// Detailed vase SVG for analysis
const AnalysisVaseSVG = () => (
  <svg width="200" height="280" viewBox="0 0 200 280" fill="none">
    {/* Main body */}
    <ellipse cx="100" cy="180" rx="70" ry="80" fill="url(#vaseGradient)" />
    {/* Neck */}
    <path
      d="M70 100 Q70 80 80 70 L120 70 Q130 80 130 100 L130 120 L70 120 Z"
      fill="url(#vaseGradient)"
    />
    {/* Rim */}
    <ellipse cx="100" cy="70" rx="30" ry="8" fill="#A0522D" />
    {/* Decorative bands */}
    <ellipse
      cx="100"
      cy="140"
      rx="68"
      ry="12"
      fill="none"
      stroke="#654321"
      strokeWidth="4"
    />
    <ellipse
      cx="100"
      cy="200"
      rx="60"
      ry="10"
      fill="none"
      stroke="#654321"
      strokeWidth="3"
    />
    {/* Pattern details */}
    <path
      d="M50 150 Q70 160 90 150 Q110 140 130 150 Q150 160 170 150"
      stroke="#8B4513"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M45 170 Q65 180 85 170 Q105 160 125 170 Q145 180 165 170"
      stroke="#8B4513"
      strokeWidth="2"
      fill="none"
    />
    {/* Gradient definition */}
    <defs>
      <linearGradient id="vaseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C17F59" />
        <stop offset="50%" stopColor="#A0522D" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
  </svg>
);

export const AnalysisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card entrance
  const cardScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Scanning line animation
  const scanY = interpolate(frame % 120, [0, 120], [0, 100], {
    extrapolateRight: "clamp",
  });

  const analysisData = [
    {
      label: "חומר",
      value: "טרקוטה בלויה עם עקבות אוכרה אדומה",
      confidence: "high" as const,
      delay: 50,
    },
    {
      label: "גיל משוער",
      value: "2,500-2,800 שנה (תקופת הברזל המאוחרת)",
      confidence: "medium" as const,
      delay: 70,
    },
    {
      label: "הקשר תרבותי",
      value: "ים תיכון עתיק, ככל הנראה כד סחר פיניקי",
      confidence: "high" as const,
      delay: 90,
    },
    {
      label: "שימוש אפשרי",
      value: "אמפורה לאחסון יין או שמן זית",
      confidence: "medium" as const,
      delay: 110,
    },
    {
      label: "הערות שימור",
      value: "שחיקת משטח קלה, מומלץ אחסון מבוקר אקלים",
      delay: 130,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #1a0f0a 0%, #2d1810 50%, #1a0f0a 100%)",
        direction: "rtl",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 50,
          width: "100%",
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: heeboFont,
            fontSize: 48,
            fontWeight: 700,
            color: "#E8DCC4",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          ניתוח ממצאים חכם
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: heeboFont,
            fontSize: 22,
            fontWeight: 400,
            color: "#C17F59",
          }}
        >
          תובנות מבוססות AI תוך שניות
        </div>
      </div>

      {/* Left side - Artifact preview with scanning */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: "50%",
          transform: "translateY(-50%)",
          width: 380,
          height: 480,
        }}
      >
        {/* Artifact image placeholder */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(145deg, rgba(45,24,16,0.9), rgba(26,15,10,0.95))",
            borderRadius: 20,
            border: "2px solid rgba(193,127,89,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            transform: `scale(${cardScale})`,
          }}
        >
          {/* Detailed vase SVG */}
          <AnalysisVaseSVG />

          {/* Scanning line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scanY}%`,
              height: 4,
              background:
                "linear-gradient(90deg, transparent, #C17F59, transparent)",
              boxShadow: "0 0 20px rgba(193,127,89,0.8)",
              opacity: frame < 180 ? 0.8 : 0,
            }}
          />

          {/* Analysis points */}
          {frame > 60 && (
            <>
              {[
                { x: 35, y: 30, label: "שפה" },
                { x: 65, y: 45, label: "צוואר" },
                { x: 50, y: 60, label: "גוף" },
                { x: 40, y: 80, label: "בסיס" },
              ].map((point, i) => {
                const pointOpacity = interpolate(
                  frame,
                  [60 + i * 20, 80 + i * 20],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );

                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      opacity: pointOpacity,
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#C17F59",
                        border: "2px solid #E8DCC4",
                        boxShadow: "0 0 15px rgba(193,127,89,0.8)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: -25,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontFamily: heeboFont,
                        fontSize: 11,
                        color: "#E8DCC4",
                        background: "rgba(0,0,0,0.7)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {point.label}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* "Analyzing" label */}
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: heeboFont,
              fontSize: 16,
              fontWeight: 600,
              color: "#C17F59",
              opacity: frame < 180 ? 0.8 : 0,
              letterSpacing: "0.1em",
            }}
          >
            מנתח...
          </div>
        </div>
      </div>

      {/* Right side - Info card */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: "50%",
          transform: "translateY(-50%)",
          width: 520,
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(45,24,16,0.95), rgba(26,15,10,0.98))",
            borderRadius: 20,
            border: "1px solid rgba(193,127,89,0.3)",
            padding: 25,
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            transform: `scale(${cardScale})`,
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              marginBottom: 20,
              paddingBottom: 15,
              borderBottom: "1px solid rgba(193,127,89,0.2)",
            }}
          >
            <div
              style={{
                width: 45,
                height: 45,
                borderRadius: "50%",
                background: "linear-gradient(145deg, #C17F59, #8B4513)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h6v2H9v-2zm0 4h6v2H9v-2z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: heeboFont,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#E8DCC4",
                }}
              >
                כרטיס מידע ממצא
              </div>
              <div
                style={{
                  fontFamily: heeboFont,
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#C17F59",
                }}
              >
                נוצר על ידי ניתוח AI
              </div>
            </div>
          </div>

          {/* Analysis fields */}
          {analysisData.map((field) => (
            <InfoField
              key={field.label}
              label={field.label}
              value={field.value}
              confidence={field.confidence}
              delay={field.delay}
              frame={frame}
            />
          ))}

          {/* Footer */}
          <div
            style={{
              marginTop: 15,
              paddingTop: 12,
              borderTop: "1px solid rgba(193,127,89,0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: interpolate(frame, [160, 180], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                fontFamily: heeboFont,
                fontSize: 13,
                fontWeight: 500,
                color: "#C17F59",
              }}
            >
              תמיכה דו-לשונית: עברית | English
            </div>
            <div
              style={{
                fontFamily: heeboFont,
                fontSize: 13,
                fontWeight: 600,
                color: "#4CAF50",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              ניתן לעריכה
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
