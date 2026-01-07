import { useState, useEffect, useCallback } from 'react';

/**
 * ScribbleBackground - Animated archaeological scribbles that draw themselves
 * Creates an ambient effect like an archaeologist's working notes being written
 */

// Handwritten words and phrases
const HANDWRITTEN_TEXTS = [
  'specimen #47',
  'circa 1200 BCE',
  'layer III',
  'pottery shard',
  'excavation site B',
  'bronze age?',
  'fragile',
  'unknown origin',
  'see notes pg. 12',
  'remarkable find',
  'cross-reference',
  'catalog pending',
  'Mediterranean',
  'ceramic fragment',
  'handle intact',
  'restoration needed',
  'Iron Age',
  'Neolithic',
  'depth: 2.3m',
  'grid ref: E-14',
];

// SVG path definitions for various scribble types
const SCRIBBLE_PATHS = [
  // Pottery/amphora outline
  {
    viewBox: '0 0 40 60',
    path: 'M15 5 Q20 0 25 5 L27 15 Q32 20 32 35 Q32 50 25 55 L15 55 Q8 50 8 35 Q8 20 13 15 Z',
  },
  // Spiral symbol
  {
    viewBox: '0 0 40 40',
    path: 'M20 20 Q20 15 25 15 Q30 15 30 20 Q30 27 22 27 Q12 27 12 18 Q12 8 22 8 Q35 8 35 22 Q35 35 20 35',
  },
  // Arrowhead
  {
    viewBox: '0 0 30 50',
    path: 'M15 5 L25 25 L18 25 L18 45 L12 45 L12 25 L5 25 Z',
  },
  // Compass rose (simplified)
  {
    viewBox: '0 0 50 50',
    path: 'M25 5 L28 22 L45 25 L28 28 L25 45 L22 28 L5 25 L22 22 Z',
  },
  // Wave pattern
  {
    viewBox: '0 0 80 30',
    path: 'M5 15 Q15 5 25 15 Q35 25 45 15 Q55 5 65 15 Q75 25 80 15',
  },
  // Sun symbol
  {
    viewBox: '0 0 40 40',
    path: 'M20 12 A8 8 0 1 1 20 28 A8 8 0 1 1 20 12 M20 2 L20 8 M20 32 L20 38 M2 20 L8 20 M32 20 L38 20',
  },
  // Grid/map fragment
  {
    viewBox: '0 0 50 50',
    path: 'M10 10 L40 10 M10 25 L40 25 M10 40 L40 40 M10 10 L10 40 M25 10 L25 40 M40 10 L40 40',
  },
  // Location marker / pin
  {
    viewBox: '0 0 30 45',
    path: 'M15 40 L5 25 Q0 15 5 8 Q10 0 15 0 Q20 0 25 8 Q30 15 25 25 Z M15 10 A5 5 0 1 1 15 20 A5 5 0 1 1 15 10',
  },
  // Pottery shard with lines
  {
    viewBox: '0 0 45 35',
    path: 'M5 30 Q10 5 25 5 Q35 8 40 20 Q38 30 30 32 Q20 35 10 32 Z M12 15 Q18 12 25 15 M15 22 Q22 20 28 23',
  },
  // Archaeological trowel
  {
    viewBox: '0 0 35 55',
    path: 'M10 50 L17 25 L10 5 Q17 0 25 5 L18 25 L25 50 Q17 55 10 50 Z',
  },
  // Simple X mark
  {
    viewBox: '0 0 30 30',
    path: 'M5 5 L25 25 M25 5 L5 25',
  },
  // Circle with dot
  {
    viewBox: '0 0 40 40',
    path: 'M20 5 A15 15 0 1 1 20 35 A15 15 0 1 1 20 5 M20 18 A2 2 0 1 1 20 22 A2 2 0 1 1 20 18',
  },
];

interface ActiveScribble {
  id: number;
  type: 'path' | 'text';
  pathIndex: number;
  text: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
}

let scribbleIdCounter = 0;

export function ScribbleBackground() {
  const [scribbles, setScribbles] = useState<ActiveScribble[]>([]);

  const createRandomScribble = useCallback((): ActiveScribble => {
    // Avoid center - pick either left/right edge or top/bottom edge
    let x: number, y: number;

    if (Math.random() > 0.5) {
      // Left or right edge
      x = Math.random() > 0.5 ? 5 + Math.random() * 20 : 75 + Math.random() * 20; // 5-25% or 75-95%
      y = 5 + Math.random() * 90; // anywhere vertically
    } else {
      // Top or bottom edge
      x = 5 + Math.random() * 90; // anywhere horizontally
      y = Math.random() > 0.5 ? 5 + Math.random() * 20 : 75 + Math.random() * 20; // 5-25% or 75-95%
    }

    // 50% chance for text vs path
    const isText = Math.random() > 0.5;

    return {
      id: scribbleIdCounter++,
      type: isText ? 'text' : 'path',
      pathIndex: Math.floor(Math.random() * SCRIBBLE_PATHS.length),
      text: HANDWRITTEN_TEXTS[Math.floor(Math.random() * HANDWRITTEN_TEXTS.length)],
      x,
      y,
      size: isText ? 18 + Math.random() * 10 : 80 + Math.random() * 80, // text: 18-28px font, path: 80-160px
      rotation: isText ? -15 + Math.random() * 30 : Math.random() * 360, // text: slight tilt, path: any angle
      duration: 3 + Math.random() * 3, // 3-6 seconds to draw
    };
  }, []);

  const addScribble = useCallback(() => {
    setScribbles(prev => {
      // Limit to max 6 scribbles
      if (prev.length >= 6) return prev;

      const newScribble = createRandomScribble();

      // Schedule removal after animation completes
      setTimeout(() => {
        setScribbles(curr => curr.filter(s => s.id !== newScribble.id));
      }, (newScribble.duration + 2) * 1000); // +2s for fade out

      return [...prev, newScribble];
    });
  }, [createRandomScribble]);

  useEffect(() => {
    // Start with 3 scribbles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => addScribble(), i * 600);
    }

    // Add new scribbles periodically (maintain 3-6 active)
    const interval = setInterval(() => {
      addScribble();
    }, 2500); // Every 2.5 seconds

    return () => clearInterval(interval);
  }, [addScribble]);

  return (
    <div className="scribble-background" aria-hidden="true">
      {scribbles.map((scribble) => {
        if (scribble.type === 'text') {
          return (
            <span
              key={scribble.id}
              className="scribble-text"
              style={{
                left: `${scribble.x}%`,
                top: `${scribble.y}%`,
                fontSize: scribble.size,
                transform: `translate(-50%, -50%) rotate(${scribble.rotation}deg)`,
                '--draw-duration': `${scribble.duration}s`,
              } as React.CSSProperties}
            >
              {scribble.text}
            </span>
          );
        }

        const pathData = SCRIBBLE_PATHS[scribble.pathIndex];
        return (
          <svg
            key={scribble.id}
            className="scribble-item"
            viewBox={pathData.viewBox}
            style={{
              left: `${scribble.x}%`,
              top: `${scribble.y}%`,
              width: scribble.size,
              height: scribble.size,
              transform: `translate(-50%, -50%) rotate(${scribble.rotation}deg)`,
              '--draw-duration': `${scribble.duration}s`,
            } as React.CSSProperties}
          >
            <path
              d={pathData.path}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}
