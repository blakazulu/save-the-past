import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { getCollisionBoundaries, getSafePosition, CollisionBoundary } from './collision';

const MOVE_SPEED = 5;
const SPRINT_MULTIPLIER = 2;
const PLAYER_HEIGHT = 1.7;

// Desktop first-person controls (WASD + mouse look)
interface FirstPersonControlsProps {
  enabled?: boolean;
  onLockChange?: (locked: boolean) => void;
}

export function FirstPersonControls({ enabled = true, onLockChange }: FirstPersonControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  // Get collision boundaries once
  const boundaries = useMemo<CollisionBoundary[]>(() => getCollisionBoundaries(), []);

  // Handle keyboard input
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          moveState.current.sprint = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          moveState.current.sprint = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  // Handle pointer lock events
  const handleLock = useCallback(() => {
    onLockChange?.(true);
  }, [onLockChange]);

  const handleUnlock = useCallback(() => {
    onLockChange?.(false);
  }, [onLockChange]);

  // Movement loop
  useFrame((_, delta) => {
    if (!enabled) return;

    const { forward, backward, left, right, sprint } = moveState.current;
    if (!forward && !backward && !left && !right) return;

    const speed = MOVE_SPEED * (sprint ? SPRINT_MULTIPLIER : 1) * delta;

    // Get camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    // Calculate right vector
    const rightDir = new THREE.Vector3();
    rightDir.crossVectors(direction, camera.up).normalize();

    // Calculate target position
    const targetPos = camera.position.clone();
    if (forward) targetPos.addScaledVector(direction, speed);
    if (backward) targetPos.addScaledVector(direction, -speed);
    if (left) targetPos.addScaledVector(rightDir, -speed);
    if (right) targetPos.addScaledVector(rightDir, speed);

    // Apply movement with collision detection
    const safePos = getSafePosition(camera.position, targetPos, boundaries);
    camera.position.copy(safePos);

    // Keep camera at walking height
    camera.position.y = PLAYER_HEIGHT;
  });

  if (!enabled) return null;

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={handleLock}
      onUnlock={handleUnlock}
    />
  );
}

// Touch controls for mobile - now with separate joysticks for movement and rotation
interface TouchControlsProps {
  enabled?: boolean;
  movementJoystickRef: React.RefObject<{ x: number; y: number }>;
  rotationJoystickRef: React.RefObject<{ x: number; y: number }>;
}

export function TouchControls({ enabled = true, movementJoystickRef, rotationJoystickRef }: TouchControlsProps) {
  const { camera } = useThree();
  const rotationState = useRef({
    yaw: 0,
    pitch: 0,
  });

  // Get collision boundaries once
  const boundaries = useMemo<CollisionBoundary[]>(() => getCollisionBoundaries(), []);

  // Combined movement and rotation loop
  useFrame((_, delta) => {
    if (!enabled) return;

    // Handle movement from movement joystick
    if (movementJoystickRef.current) {
      const { x, y } = movementJoystickRef.current;
      if (x !== 0 || y !== 0) {
        // Get camera direction
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const rightDir = new THREE.Vector3();
        rightDir.crossVectors(direction, camera.up).normalize();

        const speed = MOVE_SPEED * delta;

        // Calculate target position (Y is inverted)
        const targetPos = camera.position.clone();
        targetPos.addScaledVector(direction, -y * speed);
        targetPos.addScaledVector(rightDir, x * speed);

        // Apply movement with collision detection
        const safePos = getSafePosition(camera.position, targetPos, boundaries);
        camera.position.copy(safePos);

        // Keep at walking height
        camera.position.y = PLAYER_HEIGHT;
      }
    }

    // Handle rotation from rotation joystick
    if (rotationJoystickRef.current) {
      const { x, y } = rotationJoystickRef.current;
      if (x !== 0 || y !== 0) {
        // Apply rotation based on joystick input
        const rotationSpeed = 2.5; // Rotation speed multiplier
        rotationState.current.yaw -= x * rotationSpeed * delta;
        rotationState.current.pitch -= y * rotationSpeed * delta;

        // Clamp pitch to prevent looking too far up or down
        rotationState.current.pitch = Math.max(
          -Math.PI / 2 + 0.1,
          Math.min(Math.PI / 2 - 0.1, rotationState.current.pitch)
        );

        // Apply rotation to camera
        camera.rotation.order = 'YXZ';
        camera.rotation.y = rotationState.current.yaw;
        camera.rotation.x = rotationState.current.pitch;
      }
    }
  });

  return null;
}

// Virtual joystick UI component
interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export function VirtualJoystick({ onMove, onEnd }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;

      for (const touch of Array.from(e.changedTouches)) {
        const rect = container.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        if (touchX >= 0 && touchX <= rect.width && touchY >= 0 && touchY <= rect.height) {
          touchIdRef.current = touch.identifier;
          centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;

      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === touchIdRef.current) {
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          resetKnob();
          onEnd();
          break;
        }
      }
    };

    const updateKnob = (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const maxDist = 40;

      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const angle = Math.atan2(dy, dx);

      const clampedX = Math.cos(angle) * dist;
      const clampedY = Math.sin(angle) * dist;

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
      }

      onMove(clampedX / maxDist, clampedY / maxDist);
    };

    const resetKnob = () => {
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate(-50%, -50%)';
      }
    };

    container.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd, { passive: true });
    window.addEventListener('touchcancel', handleEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [onMove, onEnd]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-24 left-6 w-28 h-28 rounded-full bg-black/30 border-2 border-white/30 touch-none"
    >
      <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50"
      />
    </div>
  );
}

// Movement joystick (forward/back/left/right) - Bottom RIGHT
interface MovementJoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export function MovementJoystick({ onMove, onEnd }: MovementJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;

      for (const touch of Array.from(e.changedTouches)) {
        const rect = container.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        if (touchX >= 0 && touchX <= rect.width && touchY >= 0 && touchY <= rect.height) {
          touchIdRef.current = touch.identifier;
          centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;

      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === touchIdRef.current) {
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          resetKnob();
          onEnd();
          break;
        }
      }
    };

    const updateKnob = (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const maxDist = 40;

      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const angle = Math.atan2(dy, dx);

      const clampedX = Math.cos(angle) * dist;
      const clampedY = Math.sin(angle) * dist;

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
      }

      onMove(clampedX / maxDist, clampedY / maxDist);
    };

    const resetKnob = () => {
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate(-50%, -50%)';
      }
    };

    container.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd, { passive: true });
    window.addEventListener('touchcancel', handleEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [onMove, onEnd]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-6 right-6 w-32 h-32 rounded-full bg-black/40 border-2 border-white/40 touch-none shadow-lg"
    >
      {/* Directional arrows hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-16 h-16">
          {/* Up arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white/30" />
          {/* Down arrow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/30" />
          {/* Left arrow */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-white/30" />
          {/* Right arrow */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white/30" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 shadow-md"
      />
    </div>
  );
}

// Rotation joystick (camera look around) - Bottom LEFT
interface RotationJoystickProps {
  onRotate: (x: number, y: number) => void;
  onEnd: () => void;
}

export function RotationJoystick({ onRotate, onEnd }: RotationJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;

      for (const touch of Array.from(e.changedTouches)) {
        const rect = container.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        if (touchX >= 0 && touchX <= rect.width && touchY >= 0 && touchY <= rect.height) {
          touchIdRef.current = touch.identifier;
          centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;

      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === touchIdRef.current) {
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          resetKnob();
          onEnd();
          break;
        }
      }
    };

    const updateKnob = (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const maxDist = 40;

      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const angle = Math.atan2(dy, dx);

      const clampedX = Math.cos(angle) * dist;
      const clampedY = Math.sin(angle) * dist;

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
      }

      onRotate(clampedX / maxDist, clampedY / maxDist);
    };

    const resetKnob = () => {
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate(-50%, -50%)';
      }
    };

    container.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd, { passive: true });
    window.addEventListener('touchcancel', handleEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [onRotate, onEnd]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-6 left-6 w-32 h-32 rounded-full bg-black/40 border-2 border-white/40 touch-none shadow-lg"
    >
      {/* Circular rotation arrows hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/70 shadow-md"
      />
    </div>
  );
}
