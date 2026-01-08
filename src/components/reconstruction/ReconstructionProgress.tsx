import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ReconstructionProgressProps {
  progress: number;
  status: 'analyzing' | 'uploading' | 'processing' | 'saving';
  startTime?: number;
  message?: string;
}

// Fun archaeology facts for both languages
const FACTS = {
  en: [
    "The oldest known 3D map was created by ancient Babylonians around 2300 BCE.",
    "Photogrammetry was first used in archaeology in the 1960s.",
    "The Great Pyramid was surveyed using early photogrammetric techniques in 1867.",
    "Digital 3D modeling can reveal details invisible to the naked eye.",
    "Archaeologists use 3D scanning to preserve artifacts that are too fragile to handle.",
    "Some ancient artifacts can only be studied through their 3D digital twins.",
    "3D reconstruction helps archaeologists virtually reassemble broken pottery.",
    "Modern AI can identify artifact materials with up to 95% accuracy.",
    "The first underwater 3D archaeological survey was conducted in 1975.",
    "3D printed replicas of artifacts are used in museums worldwide.",
  ],
  he: [
    "המפה התלת-ממדית העתיקה ביותר נוצרה על ידי הבבלים הקדומים בסביבות 2300 לפנה\"ס.",
    "פוטוגרמטריה שימשה לראשונה בארכיאולוגיה בשנות ה-60.",
    "הפירמידה הגדולה נסקרה בטכניקות פוטוגרמטריות מוקדמות ב-1867.",
    "מידול תלת-ממדי דיגיטלי יכול לחשוף פרטים בלתי נראים לעין.",
    "ארכיאולוגים משתמשים בסריקה תלת-ממדית לשימור ממצאים שבירים.",
    "חלק מהממצאים העתיקים ניתנים לחקירה רק דרך התאומים הדיגיטליים שלהם.",
    "שחזור תלת-ממדי מסייע לארכיאולוגים להרכיב כלי חרס שבורים.",
    "בינה מלאכותית יכולה לזהות חומרי ממצאים עם דיוק של עד 95%.",
    "הסקר הארכיאולוגי התת-ימי התלת-ממדי הראשון נערך ב-1975.",
    "העתקים מודפסים בתלת-ממד של ממצאים משמשים במוזיאונים ברחבי העולם.",
  ],
};

// Typical Meshy processing time is 2-4 minutes
const ESTIMATED_TOTAL_TIME_MS = 3 * 60 * 1000; // 3 minutes average

export function ReconstructionProgress({
  progress,
  status,
  startTime,
  message,
}: ReconstructionProgressProps) {
  const { t, i18n } = useTranslation();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const lang = i18n.language === 'he' ? 'he' : 'en';
  const facts = FACTS[lang];

  // Rotate facts every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % facts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [facts.length]);

  // Calculate estimated time remaining
  const getTimeRemaining = () => {
    if (!startTime || progress <= 0) return null;

    const elapsed = Date.now() - startTime;

    // Use progress-based estimation if we have real progress
    if (progress > 5) {
      const estimatedTotal = (elapsed / progress) * 100;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      return remaining;
    }

    // Fallback to fixed estimate minus elapsed
    const remaining = Math.max(0, ESTIMATED_TOTAL_TIME_MS - elapsed);
    return remaining;
  };

  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null || ms <= 0) return null;

    const minutes = Math.ceil(ms / 60000);
    if (minutes <= 1) {
      return i18n.language === 'he' ? 'פחות מדקה' : 'Less than a minute';
    }
    return i18n.language === 'he'
      ? `כ-${minutes} דקות`
      : `~${minutes} minutes`;
  };

  const timeRemaining = getTimeRemaining();
  const timeRemainingText = formatTimeRemaining(timeRemaining);
  const statusMessage = message || t(`reconstruction.status.${status}`);

  return (
    <div className="space-y-6">
      {/* Spinning 3D Cube Animation */}
      <div className="flex justify-center">
        <div className="cube-container">
          <div className="cube">
            <div className="cube-face cube-front" />
            <div className="cube-face cube-back" />
            <div className="cube-face cube-right" />
            <div className="cube-face cube-left" />
            <div className="cube-face cube-top" />
            <div className="cube-face cube-bottom" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-3 bg-sand rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terracotta to-clay rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        {/* Status info */}
        <div className="flex items-center justify-between text-base">
          <span className="text-text-secondary">{statusMessage}</span>
          <span className="font-medium text-earth">{Math.round(progress)}%</span>
        </div>

        {/* Time remaining */}
        {timeRemainingText && (
          <div className="text-center text-sm text-text-muted">
            {timeRemainingText}
          </div>
        )}
      </div>

      {/* Fun fact */}
      <div className="bg-sand/50 rounded-xl p-4 min-h-[80px] flex items-center">
        <p className="text-sm text-text-secondary leading-relaxed text-center w-full animate-fade-in">
          <span className="text-terracotta font-medium">
            {i18n.language === 'he' ? '💡 הידעת?' : '💡 Did you know?'}
          </span>
          <br />
          {facts[currentFactIndex]}
        </p>
      </div>
    </div>
  );
}
