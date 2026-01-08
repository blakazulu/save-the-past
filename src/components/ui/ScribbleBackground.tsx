import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ScribbleBackground - Animated archaeological scribbles that draw themselves
 * Creates an ambient effect like an archaeologist's working notes being written
 */

// Handwritten phrases (3-6 words each)
const HANDWRITTEN_TEXTS = [
  'specimen #47 - handle with care',
  'circa 1200 BCE, Mediterranean origin',
  'excavation layer III, site B',
  'pottery shard with geometric patterns',
  'bronze age ceremonial vessel fragment',
  'unknown origin - requires analysis',
  'see field notes page 12',
  'remarkable find near eastern wall',
  'cross-reference with catalog entry #89',
  'pending restoration and classification',
  'ceramic fragment from storage pit',
  'handle intact, base missing',
  'Iron Age settlement layer confirmed',
  'Neolithic tool, flint composition',
  'depth 2.3m below surface level',
  'grid reference E-14, trench 3',
  'possible ritual significance noted',
  'similar to Mycenaean examples',
  'carbon dating results pending',
  'fragmentary inscription visible here',
  'compare with previous season finds',
  'stratigraphy disrupted by roots',
  'photographed and cataloged today',
  'unusually fine craftsmanship observed',
];

interface ActiveScribble {
  id: number;
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
  const timeoutIds = useRef<Set<number>>(new Set());

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

    return {
      id: scribbleIdCounter++,
      text: HANDWRITTEN_TEXTS[Math.floor(Math.random() * HANDWRITTEN_TEXTS.length)],
      x,
      y,
      size: 14 + Math.random() * 12, // 14-26px font
      rotation: -15 + Math.random() * 30, // slight tilt
      duration: 4 + Math.random() * 3, // 4-7 seconds to draw
    };
  }, []);

  const addScribble = useCallback(() => {
    setScribbles(prev => {
      // Limit to max 6 scribbles
      if (prev.length >= 6) return prev;

      const newScribble = createRandomScribble();

      // Schedule removal after animation completes (draw + 2s hold + fade)
      const timeoutId = window.setTimeout(() => {
        setScribbles(curr => curr.filter(s => s.id !== newScribble.id));
        timeoutIds.current.delete(timeoutId);
      }, (newScribble.duration + 3) * 1000); // +2s hold +1s fade

      timeoutIds.current.add(timeoutId);

      return [...prev, newScribble];
    });
  }, [createRandomScribble]);

  useEffect(() => {
    let interval: number | undefined;
    const initialTimeouts: number[] = [];

    const startAnimations = () => {
      // Start with 3 scribbles
      for (let i = 0; i < 3; i++) {
        const timeoutId = window.setTimeout(() => addScribble(), i * 600);
        initialTimeouts.push(timeoutId);
      }

      // Add new scribbles periodically (maintain 3-6 active)
      interval = window.setInterval(() => {
        addScribble();
      }, 2500); // Every 2.5 seconds
    };

    const stopAnimations = () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimations();
      } else {
        startAnimations();
      }
    };

    // Start if page is visible
    if (!document.hidden) {
      startAnimations();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Clean up interval
      stopAnimations();
      // Clean up initial timeouts
      initialTimeouts.forEach(id => clearTimeout(id));
      // Clean up all scribble removal timeouts
      timeoutIds.current.forEach(id => clearTimeout(id));
      timeoutIds.current.clear();
      // Remove visibility listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [addScribble]);

  return (
    <div className="scribble-background" aria-hidden="true">
      {scribbles.map((scribble) => (
        <span
          key={scribble.id}
          className="scribble-text"
          style={{
            left: `${scribble.x}%`,
            top: `${scribble.y}%`,
            fontSize: scribble.size,
            transform: `translate(-50%, -50%) rotate(${scribble.rotation}deg)`,
            '--total-duration': `${scribble.duration + 3}s`, // draw + 2s hold + 1s fade
          } as React.CSSProperties}
        >
          {scribble.text}
        </span>
      ))}
    </div>
  );
}
