import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, Bounds, useBounds } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl: string;
  onDownload?: () => void;
  className?: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const bounds = useBounds();

  // Ensure materials render correctly and enable shadows
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // If the model has no material or is plain white, apply a default clay material
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          // Only apply default if there's no texture and color is white
          if (!mat.map && mat.color && mat.color.getHex() === 0xffffff) {
            mat.color.setHex(0xC17F59); // terracotta color
            mat.roughness = 0.7;
            mat.metalness = 0.1;
          }
          mat.needsUpdate = true;
        }
      }
    });
    // Fit camera to model bounds after load
    bounds.refresh(scene).fit();
  }, [scene, bounds]);

  return <primitive object={scene} />;
}

function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#C17F59" wireframe />
    </mesh>
  );
}

export function ModelViewer({ modelUrl, onDownload, className = '' }: ModelViewerProps) {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-sand rounded-xl overflow-hidden h-[70vh] mx-auto ${className} w-[70vw]`}
    >
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        className="touch-none"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        <Suspense fallback={<LoadingSpinner />}>
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <Model url={modelUrl} />
            </Center>
          </Bounds>
          <Environment preset="studio" />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={10}
        />
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
          aria-label={isFullscreen ? t('viewer.exitFullscreen') : t('viewer.fullscreen')}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>

        {/* Download button */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 bg-terracotta text-white rounded-lg hover:bg-clay transition-colors"
            aria-label={t('viewer.download')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>

      {/* Touch hint */}
      <div className="absolute bottom-4 left-4 text-md text-text-secondary bg-black/40 text-white px-2 py-1 rounded">
        {t('viewer.hint')}
      </div>
    </div>
  );
}

// Preload function to clean up GLTF cache
export function preloadModel(url: string) {
  useGLTF.preload(url);
}

export function clearModelCache(url: string) {
  useGLTF.clear(url);
}
