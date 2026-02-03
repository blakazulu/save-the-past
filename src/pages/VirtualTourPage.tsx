import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Billboard, Image as DreiImage, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import {
  ProceduralGallery,
  Pedestal,
  PEDESTAL_POSITIONS,
  FirstPersonControls,
  TouchControls,
  VirtualJoystick,

} from '@/components/virtual-tour';


// Pedestal order from entrance to back of museum
// Maps artifact index to pedestal index (artifact 0 goes to pedestal 15 = lobby, etc.)
const ENTRANCE_TO_BACK_ORDER = [
  15, 16,           // Entrance Lobby (z=16)
  13, 14,           // South Corridor (z=12)
  11,               // Grand Hall back (z=6)
  9, 10,            // Grand Hall front (z=2)
  8, 12,            // Room D & E (z=0)
  4, 5, 6, 7,       // North Corridor (z=-8)
  0, 1, 2, 3,       // Rooms A, B, C (z=-14)
];
import { fetchMuseumArtifacts } from '@/lib/firebase/museumService';
import { db } from '@/lib/db';
import type { MuseumArtifact } from '@/types/museum';
import type { LocalizedText } from '@/types/artifact';

// Info card data for display
interface DisplayInfoCard {
  material: LocalizedText;
  estimatedAge: {
    range: LocalizedText;
    confidence: 'high' | 'medium' | 'low';
  };
  possibleUse: LocalizedText;
  culturalContext: LocalizedText;
  preservationNotes: LocalizedText;
  aiConfidence: number;
}

// Combine personal and museum artifacts for display
interface DisplayArtifact {
  id: string;
  name: string;
  modelUrl?: string | null;  // For remote artifacts
  model3DId?: string;        // For local artifacts
  thumbnailUrl?: string | null;
  isPersonal: boolean;
  siteName?: string;
  infoCard?: DisplayInfoCard;
}

// Lazy loaded artifact component
function LazyArtifact({ artifact }: { artifact: DisplayArtifact }) {
  const { camera } = useThree();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [localModelUrl, setLocalModelUrl] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [distance, setDistance] = useState(100);

  // Check distance to camera
  useFrame(() => {
    if (groupRef.current) {
      const dist = camera.position.distanceTo(groupRef.current.getWorldPosition(new THREE.Vector3()));
      setDistance(dist);
      // Load if closer than 8 units
      if (dist < 8 && !shouldLoad) {
        setShouldLoad(true);
      }
      // Optional: Unload if very far (e.g., > 20 units) to save memory, 
      // but might cause stutter if revisiting. keeping simple for now.
    }
  });

  // Load local blob if needed
  useEffect(() => {
    if (shouldLoad && artifact.isPersonal && artifact.model3DId && !localModelUrl) {
      const loadBlob = async () => {
        try {
          const model = await db.models.get(artifact.model3DId!);
          if (model?.blob) {
            const url = URL.createObjectURL(model.blob);
            setLocalModelUrl(url);
          }
        } catch (e) {
          console.error("Failed to load local model blob", e);
        }
      };
      loadBlob();
    }

    // Cleanup
    return () => {
      if (localModelUrl) URL.revokeObjectURL(localModelUrl);
    };
  }, [shouldLoad, artifact, localModelUrl]);

  const url = artifact.isPersonal ? localModelUrl : artifact.modelUrl;

  return (
    <group ref={groupRef}>
      {/* 3D Model - Only show if close and loaded */}
      {shouldLoad && url ? (
        <Suspense fallback={<LoadingWireframe />}>
          <ArtifactModel url={url} />
        </Suspense>
      ) : (
        /* Thumbnail Billboard when far or loading */
        <ThumbnailBillboard url={artifact.thumbnailUrl} />
      )}

      {/* Label always visible but fades with distance */}
      <Billboard position={[0, -0.8, 0]} follow={true}>
        <Text
          fontSize={0.15}
          color="#3D2914"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#EAE0D5"
          fillOpacity={Math.max(0, 1 - (distance / 10))} // Fade out label
        >
          {artifact.name.length > 20 ? artifact.name.substring(0, 20) + '...' : artifact.name}
        </Text>
      </Billboard>
    </group>
  );
}

function LoadingWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5, 2, 2, 2]} />
      <meshStandardMaterial
        color="#C17F59"
        emissive="#C17F59"
        emissiveIntensity={0.5}
        wireframe
      />
    </mesh>
  );
}

function ThumbnailBillboard({ url }: { url?: string | null }) {
  return (
    <Billboard position={[0, 0.5, 0]} follow={true}>
      {url ? (
        <DreiImage url={url} scale={[1, 1]} transparent />
      ) : (
        <mesh>
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial color="#EAE0D5" transparent opacity={0.5} />
        </mesh>
      )}
    </Billboard>
  );
}

// 3D artifact model component
function ArtifactModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  // Memoize the cloned scene and random rotation so they don't change on re-render
  const { clonedScene, rotation } = useMemo(() => ({
    clonedScene: scene.clone(),
    rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
  }), [scene]);

  return (
    <primitive
      object={clonedScene}
      scale={0.5}
      rotation={rotation}
    />
  );
}

// Camera teleporter - moves camera to artifact positions
interface CameraTeleporterProps {
  targetArtifactIndex: number | null;
  onTeleportComplete: () => void;
}

function CameraTeleporter({ targetArtifactIndex, onTeleportComplete }: CameraTeleporterProps) {
  const { camera } = useThree();
  const isAnimating = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());
  const progress = useRef(0);

  useEffect(() => {
    if (targetArtifactIndex === null || targetArtifactIndex < 0) return;

    // Get the pedestal index for this artifact
    const pedestalIndex = ENTRANCE_TO_BACK_ORDER[targetArtifactIndex];
    if (pedestalIndex === undefined) return;

    const pedestalPos = PEDESTAL_POSITIONS[pedestalIndex];
    if (!pedestalPos) return;

    // Start animation
    startPos.current.copy(camera.position);
    // Position camera 2 units away from pedestal, at eye height
    targetPos.current.set(pedestalPos[0], 1.7, pedestalPos[2] + 2);
    progress.current = 0;
    isAnimating.current = true;
  }, [targetArtifactIndex, camera]);

  useFrame((_, delta) => {
    if (!isAnimating.current) return;

    // Smooth animation over ~0.5 seconds
    progress.current += delta * 2;

    if (progress.current >= 1) {
      progress.current = 1;
      isAnimating.current = false;
      camera.position.copy(targetPos.current);
      // Look at the pedestal
      const pedestalIndex = ENTRANCE_TO_BACK_ORDER[targetArtifactIndex!];
      const pedestalPos = PEDESTAL_POSITIONS[pedestalIndex];
      if (pedestalPos) {
        camera.lookAt(pedestalPos[0], 1.5, pedestalPos[2]);
      }
      onTeleportComplete();
    } else {
      // Ease out cubic for smooth deceleration
      const t = 1 - Math.pow(1 - progress.current, 3);
      camera.position.lerpVectors(startPos.current, targetPos.current, t);
    }
  });

  return null;
}

// Proximity detection - checks camera distance to pedestals
const PROXIMITY_THRESHOLD = 2.5; // Distance to trigger info card (closer than before)

interface ProximityDetectorProps {
  artifacts: DisplayArtifact[];
  onNearArtifact: (artifact: DisplayArtifact | null, pedestalIndex: number) => void;
}

function ProximityDetector({ artifacts, onNearArtifact }: ProximityDetectorProps) {
  const { camera } = useThree();
  const lastNearIndexRef = useRef<number>(-1);
  const lastFacingRef = useRef<boolean>(true);

  useFrame(() => {
    let nearestPedestalIndex = -1;
    let nearestDistance = PROXIMITY_THRESHOLD;
    let nearestPedestalPos: [number, number, number] | null = null;

    // Check distance to each pedestal
    for (let i = 0; i < PEDESTAL_POSITIONS.length; i++) {
      const [px, , pz] = PEDESTAL_POSITIONS[i];
      const dx = camera.position.x - px;
      const dz = camera.position.z - pz;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPedestalIndex = i;
        nearestPedestalPos = PEDESTAL_POSITIONS[i];
      }
    }

    // Check if facing the pedestal (using dot product)
    let isFacingPedestal = false;
    if (nearestPedestalPos) {
      // Get camera forward direction (negative Z in camera space)
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      forward.y = 0; // Ignore vertical component
      forward.normalize();

      // Get direction from camera to pedestal
      const toPedestal = new THREE.Vector3(
        nearestPedestalPos[0] - camera.position.x,
        0,
        nearestPedestalPos[2] - camera.position.z
      ).normalize();

      // Dot product > 0 means we're facing toward the pedestal
      const dot = forward.dot(toPedestal);
      isFacingPedestal = dot > 0.3; // Roughly within ~70 degree cone
    }

    // Update if pedestal changed OR facing direction changed
    const stateChanged = nearestPedestalIndex !== lastNearIndexRef.current ||
      isFacingPedestal !== lastFacingRef.current;

    if (stateChanged) {
      lastNearIndexRef.current = nearestPedestalIndex;
      lastFacingRef.current = isFacingPedestal;

      // Only show artifact if close AND facing it
      if (nearestPedestalIndex >= 0 && isFacingPedestal) {
        // Map pedestal index to artifact index using entrance-to-back order
        const artifactIndex = ENTRANCE_TO_BACK_ORDER.indexOf(nearestPedestalIndex);
        const artifact = artifactIndex >= 0 && artifactIndex < artifacts.length
          ? artifacts[artifactIndex]
          : undefined;

        if (artifact) {
          onNearArtifact(artifact, nearestPedestalIndex);
        } else {
          onNearArtifact(null, -1);
        }
      } else {
        onNearArtifact(null, -1);
      }
    }
  });

  return null;
}

// Info card overlay component
interface InfoCardOverlayProps {
  artifact: DisplayArtifact;
  onClose: () => void;
}

function InfoCardOverlay({ artifact, onClose }: InfoCardOverlayProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('he') ? 'he' : 'en';

  // Get localized text
  const getText = (localizedText: LocalizedText | undefined): string => {
    if (!localizedText) return '';
    return localizedText[lang] || localizedText.en || '';
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
    }
  };

  return (
    <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-sand/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-earth">{artifact.name}</h3>
          {artifact.siteName && (
            <p className="text-sm text-text-secondary">{artifact.siteName}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-earth/10 rounded-full transition-colors"
          aria-label={t('common.close', 'Close')}
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Info card content */}
      {artifact.infoCard ? (
        <div className="space-y-2 text-sm">
          {/* Material */}
          <div className="flex">
            <span className="font-medium text-earth w-24 flex-shrink-0">{t('infoCard.material', 'Material')}:</span>
            <span className="text-text-primary">{getText(artifact.infoCard.material)}</span>
          </div>

          {/* Age */}
          <div className="flex items-start">
            <span className="font-medium text-earth w-24 flex-shrink-0">{t('infoCard.age', 'Age')}:</span>
            <div className="flex items-center gap-2">
              <span className="text-text-primary">{getText(artifact.infoCard.estimatedAge.range)}</span>
              <span className={`w-2 h-2 rounded-full ${getConfidenceColor(artifact.infoCard.estimatedAge.confidence)}`}
                title={artifact.infoCard.estimatedAge.confidence} />
            </div>
          </div>

          {/* Possible Use */}
          <div className="flex">
            <span className="font-medium text-earth w-24 flex-shrink-0">{t('infoCard.use', 'Use')}:</span>
            <span className="text-text-primary">{getText(artifact.infoCard.possibleUse)}</span>
          </div>

          {/* Cultural Context */}
          <div className="flex">
            <span className="font-medium text-earth w-24 flex-shrink-0">{t('infoCard.context', 'Context')}:</span>
            <span className="text-text-primary line-clamp-2">{getText(artifact.infoCard.culturalContext)}</span>
          </div>

          {/* AI Confidence */}
          <div className="pt-2 mt-2 border-t border-earth/20 flex items-center justify-between text-xs text-text-secondary">
            <span>{t('infoCard.aiGenerated', 'AI Generated')}</span>
            <span>{Math.round(artifact.infoCard.aiConfidence * 100)}% {t('infoCard.confidence', 'confidence')}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary italic">
          {t('virtualTour.noInfoCard', 'No detailed information available for this artifact.')}
        </p>
      )}

      {/* Personal artifact badge */}
      {artifact.isPersonal && (
        <div className="mt-3 pt-2 border-t border-earth/20">
          <span className="inline-flex items-center gap-1 text-xs bg-terracotta/20 text-terracotta px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            {t('virtualTour.yourArtifact', 'Your Artifact')}
          </span>
        </div>
      )}
    </div>
  );
}

// Detect if device is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

export default function VirtualTourPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [artifacts, setArtifacts] = useState<DisplayArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [nearArtifact, setNearArtifact] = useState<DisplayArtifact | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);

  // Texture loading progress
  const [textureProgress, setTextureProgress] = useState(0);

  // Artifact teleportation
  const [currentArtifactIndex, setCurrentArtifactIndex] = useState(0);
  const [teleportTarget, setTeleportTarget] = useState<number | null>(null);

  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track blob URLs for cleanup
  const blobUrlsRef = useRef<string[]>([]);

  // Load artifacts (personal + museum)
  useEffect(() => {
    let mounted = true;

    async function loadArtifacts() {
      try {
        // Load personal artifacts metadata ONLY (no blobs yet)
        const personalArtifacts = await db.artifacts.toArray();
        const personalWithModels: DisplayArtifact[] = [];

        for (const artifact of personalArtifacts) {
          if (artifact.model3DId) {
            // Get thumbnail if exists
            const images = await db.images.where('artifactId').equals(artifact.id).toArray();
            let thumbnailUrl = null;
            if (images.length > 0) {
              // We create a blob URL for the thumbnail image (much smaller than 3D model)
              thumbnailUrl = URL.createObjectURL(images[0].blob);
              blobUrlsRef.current.push(thumbnailUrl);
            }

            // Load info card if available
            let infoCard: DisplayInfoCard | undefined;
            if (artifact.infoCardId) {
              const card = await db.infoCards.get(artifact.infoCardId);
              if (card) {
                infoCard = {
                  material: card.material,
                  estimatedAge: {
                    range: card.estimatedAge.range,
                    confidence: card.estimatedAge.confidence,
                  },
                  possibleUse: card.possibleUse,
                  culturalContext: card.culturalContext,
                  preservationNotes: card.preservationNotes,
                  aiConfidence: card.aiConfidence,
                };
              }
            }

            personalWithModels.push({
              id: artifact.id,
              name: artifact.metadata.name || 'Artifact',
              model3DId: artifact.model3DId,
              thumbnailUrl,
              isPersonal: true,
              siteName: artifact.metadata.siteName,
              infoCard,
            });
          }
        }

        // Load museum artifacts
        const museumArtifacts = await fetchMuseumArtifacts();
        const museumWithModels: DisplayArtifact[] = museumArtifacts
          .filter((a: MuseumArtifact) => a.modelUrl)
          .map((a: MuseumArtifact) => ({
            id: a.id,
            name: a.name,
            modelUrl: a.modelUrl,
            thumbnailUrl: a.thumbnailUrl,
            isPersonal: false,
            siteName: a.siteName,
            infoCard: a.infoCard,
          }));

        if (mounted) {
          // Combine all artifacts
          const allArtifacts = [...personalWithModels, ...museumWithModels];

          // Shuffle for random selection
          const shuffled = allArtifacts.sort(() => Math.random() - 0.5);

          // Limit to number of pedestals if we have more artifacts
          const maxPedestals = PEDESTAL_POSITIONS.length;
          const selected = shuffled.slice(0, maxPedestals);

          setArtifacts(selected);
          setLoading(false);
          // Set progress to 100 instantly as we aren't loading models yet
          setTextureProgress(100);
        }
      } catch (error) {
        console.error('Failed to load artifacts:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadArtifacts();
    return () => {
      mounted = false;
      // Clean up blob URLs
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  // Handle fullscreen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const enterFullscreen = async () => {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
      } catch (e) {
        // Fullscreen not supported or denied
      }
    };

    enterFullscreen();
  }, []);

  // Handle exit
  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
    navigate('/museum');
  }, [navigate]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit]);

  // Joystick handlers
  const handleJoystickMove = useCallback((x: number, y: number) => {
    joystickRef.current = { x, y };
  }, []);

  const handleJoystickEnd = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
  }, []);

  // Hide instructions after first interaction
  const handleCanvasClick = useCallback(() => {
    if (showInstructions) {
      setShowInstructions(false);
    }
  }, [showInstructions]);

  // Handle proximity to artifacts
  const handleNearArtifact = useCallback((artifact: DisplayArtifact | null) => {
    setNearArtifact(artifact);
    // Auto-show info card when approaching an artifact
    if (artifact) {
      setShowInfoCard(true);
    }
  }, []);

  // Handle info card close
  const handleCloseInfoCard = useCallback(() => {
    setShowInfoCard(false);
  }, []);

  // Handle teleport to next artifact
  const handleTeleportToNextArtifact = useCallback(() => {
    if (artifacts.length === 0) return;
    const nextIndex = (currentArtifactIndex + 1) % artifacts.length;
    setCurrentArtifactIndex(nextIndex);
    setTeleportTarget(nextIndex);
    setShowInfoCard(false); // Close any open info card
  }, [artifacts.length, currentArtifactIndex]);

  // Handle teleport complete
  const handleTeleportComplete = useCallback(() => {
    setTeleportTarget(null);
  }, []);

  // Callback for texture loading progress (must be before early return to respect Rules of Hooks)
  const handleTextureProgress = useCallback((progress: number) => {
    setTextureProgress(progress);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-earth flex items-center justify-center">
        <div className="text-center text-sand">
          <div className="w-16 h-16 border-4 border-sand/30 border-t-sand rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">{t('virtualTour.loading', 'Loading museum...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black">
      {/* 3D Canvas */}
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1] : [1, 2]}
        camera={{
          fov: 75,
          near: 0.1,
          far: isMobile ? 100 : 1000,
          position: [0, 1.7, 17],
        }}
        onClick={handleCanvasClick}
        gl={{
          antialias: !isMobile,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
      >
        {/* Gallery environment - renders immediately with fallback colors, then loads textures progressively */}
        <ProceduralGallery
          isMobile={isMobile}
          onProgress={handleTextureProgress}
        />

        {/* All pedestals - artifacts placed from entrance to back */}
        {PEDESTAL_POSITIONS.map((position, pedestalIndex) => {
          // Find which artifact goes on this pedestal based on entrance-to-back order
          const artifactIndex = ENTRANCE_TO_BACK_ORDER.indexOf(pedestalIndex);
          const artifact = artifactIndex >= 0 && artifactIndex < artifacts.length
            ? artifacts[artifactIndex]
            : undefined;
          return (
            <Pedestal key={`pedestal-${pedestalIndex}`} position={position}>
              {artifact && (
                <LazyArtifact artifact={artifact} />
              )}
            </Pedestal>
          );
        })}

        {/* Controls */}
        {isMobile ? (
          <TouchControls enabled={true} joystickRef={joystickRef} />
        ) : (
          <FirstPersonControls enabled={true} onLockChange={setIsLocked} />
        )}

        {/* Proximity detection for info cards */}
        <ProximityDetector artifacts={artifacts} onNearArtifact={handleNearArtifact} />

        {/* Camera teleporter for jumping between artifacts */}
        <CameraTeleporter
          targetArtifactIndex={teleportTarget}
          onTeleportComplete={handleTeleportComplete}
        />
      </Canvas>

      {/* Texture loading progress overlay */}
      {textureProgress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-10">
          <div className="text-center">
            {/* Progress ring */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              {/* Background ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#3D2914"
                  strokeWidth="6"
                  opacity="0.3"
                />
                {/* Progress ring */}
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#C17F59"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - textureProgress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-sand">{Math.round(textureProgress)}%</span>
              </div>
            </div>
            <p className="text-sand text-sm">
              {t('virtualTour.loadingTextures', 'Loading museum textures...')}
            </p>
          </div>
        </div>
      )}

      {/* Info card overlay */}
      {showInfoCard && nearArtifact && (
        <InfoCardOverlay artifact={nearArtifact} onClose={handleCloseInfoCard} />
      )}

      {/* Mobile joystick */}
      {isMobile && (
        <VirtualJoystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      )}

      {/* Instructions overlay */}
      {showInstructions && !isMobile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="bg-sand/90 rounded-lg p-6 text-center max-w-sm mx-4 pointer-events-auto">
            <h2 className="text-xl font-bold text-earth mb-4">
              {t('virtualTour.welcome', 'Welcome to the Museum')}
            </h2>
            <p className="text-text-secondary mb-4">
              {t('virtualTour.desktopInstructions', 'Click to start. Use WASD or arrow keys to move. Mouse to look around. Shift to sprint.')}
            </p>
            <button
              onClick={() => setShowInstructions(false)}
              className="px-6 py-2 bg-terracotta text-sand rounded-lg hover:bg-clay transition-colors"
            >
              {t('virtualTour.start', 'Start Exploring')}
            </button>
          </div>
        </div>
      )}

      {/* Mobile instructions */}
      {showInstructions && isMobile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-sand/90 rounded-lg p-6 text-center max-w-sm mx-4">
            <h2 className="text-xl font-bold text-earth mb-4">
              {t('virtualTour.welcome', 'Welcome to the Museum')}
            </h2>
            <p className="text-text-secondary mb-4">
              {t('virtualTour.mobileInstructions', 'Use the joystick on the left to move. Drag on the right side to look around.')}
            </p>
            <button
              onClick={() => setShowInstructions(false)}
              className="px-6 py-2 bg-terracotta text-sand rounded-lg active:bg-clay transition-colors"
            >
              {t('virtualTour.start', 'Start Exploring')}
            </button>
          </div>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
        aria-label={t('virtualTour.exit', 'Exit tour')}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Artifact teleport button */}
      {artifacts.length > 0 && (
        <button
          onClick={handleTeleportToNextArtifact}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 active:bg-terracotta text-white text-sm rounded-full transition-colors z-10"
          aria-label={t('virtualTour.nextArtifact', 'Go to next artifact')}
        >
          <span>{currentArtifactIndex + 1}/{artifacts.length}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}

      {/* Pointer lock hint for desktop */}
      {!isMobile && !isLocked && !showInstructions && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded-lg">
          {t('virtualTour.clickToLook', 'Click to enable mouse look')}
        </div>
      )}
    </div>
  );
}
