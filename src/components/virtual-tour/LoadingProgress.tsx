import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface LoadingProgressProps {
  progress: number; // 0-100
  message?: string;
}

export function LoadingProgress({ progress, message = 'Loading museum...' }: LoadingProgressProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Animate the loading ring
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.5;
    }
    if (glowRef.current) {
      glowRef.current.rotation.z += delta * 0.3;
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  // Progress ring geometry
  const progressAngle = (progress / 100) * Math.PI * 2;

  return (
    <group position={[0, 1.7, 15]}>
      {/* Background glow */}
      <mesh ref={glowRef}>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshBasicMaterial
          color="#C17F59"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Background ring (track) */}
      <mesh>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial
          color="#3D2914"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Progress ring */}
      <mesh ref={ringRef}>
        <ringGeometry
          args={[0.5, 0.6, 32, 1, 0, progressAngle]}
        />
        <meshBasicMaterial
          color="#C17F59"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center percentage */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.2}
        color="#E8DCC4"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {`${Math.round(progress)}%`}
      </Text>

      {/* Loading message */}
      <Text
        position={[0, -0.9, 0.01]}
        fontSize={0.12}
        color="#E8DCC4"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Regular.woff"
        maxWidth={2}
        textAlign="center"
      >
        {message}
      </Text>

      {/* Ambient light so the text is visible */}
      <ambientLight intensity={1} />
    </group>
  );
}

// Simple loading indicator for Suspense fallback (no text dependency)
export function SimpleLoader() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={[0, 1.7, 15]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#C17F59"
          emissive="#C17F59"
          emissiveIntensity={0.3}
          wireframe
        />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 2, 2]} intensity={1} color="#C17F59" />
    </group>
  );
}
