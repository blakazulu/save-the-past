import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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
  modelUrl: string | null;
  isPersonal: boolean;
  siteName?: string;
  infoCard?: DisplayInfoCard;
}

// 3D artifact model component
function ArtifactModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  return (
    <primitive
      object={scene.clone()}
      scale={0.5}
      rotation={[0, Math.random() * Math.PI * 2, 0]}
    />
  );
}

// Loading indicator for 3D scene
function SceneLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#C17F59" wireframe />
    </mesh>
  );
}

// Proximity detection - checks camera distance to pedestals
const PROXIMITY_THRESHOLD = 3.5; // Distance to trigger info card

interface ProximityDetectorProps {
  artifacts: DisplayArtifact[];
  onNearArtifact: (artifact: DisplayArtifact | null, pedestalIndex: number) => void;
}

function ProximityDetector({ artifacts, onNearArtifact }: ProximityDetectorProps) {
  const { camera } = useThree();
  const lastNearIndexRef = useRef<number>(-1);

  useFrame(() => {
    let nearestPedestalIndex = -1;
    let nearestDistance = PROXIMITY_THRESHOLD;

    // Check distance to each pedestal
    for (let i = 0; i < PEDESTAL_POSITIONS.length; i++) {
      const [px, , pz] = PEDESTAL_POSITIONS[i];
      const dx = camera.position.x - px;
      const dz = camera.position.z - pz;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPedestalIndex = i;
      }
    }

    // Only update if the nearest pedestal changed
    if (nearestPedestalIndex !== lastNearIndexRef.current) {
      lastNearIndexRef.current = nearestPedestalIndex;

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

  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track blob URLs for cleanup
  const blobUrlsRef = useRef<string[]>([]);

  // Load artifacts (personal + museum)
  useEffect(() => {
    let mounted = true;

    async function loadArtifacts() {
      try {
        // Load personal artifacts with 3D models
        const personalArtifacts = await db.artifacts.toArray();
        const personalWithModels: DisplayArtifact[] = [];

        for (const artifact of personalArtifacts) {
          if (artifact.model3DId) {
            const model = await db.models.get(artifact.model3DId);
            if (model?.blob) {
              // Create blob URL for the model
              const modelUrl = URL.createObjectURL(model.blob);
              blobUrlsRef.current.push(modelUrl);

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
                modelUrl,
                isPersonal: true,
                siteName: artifact.metadata.siteName,
                infoCard,
              });
            }
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
      document.exitFullscreen().catch(() => {});
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
        shadows
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [0, 1.7, 17],
        }}
        onClick={handleCanvasClick}
      >
        <Suspense fallback={<SceneLoader />}>
          {/* Gallery environment */}
          <ProceduralGallery />

          {/* All pedestals - artifacts placed from entrance to back */}
          {PEDESTAL_POSITIONS.map((position, pedestalIndex) => {
            // Find which artifact goes on this pedestal based on entrance-to-back order
            const artifactIndex = ENTRANCE_TO_BACK_ORDER.indexOf(pedestalIndex);
            const artifact = artifactIndex >= 0 && artifactIndex < artifacts.length
              ? artifacts[artifactIndex]
              : undefined;
            return (
              <Pedestal key={`pedestal-${pedestalIndex}`} position={position}>
                {artifact?.modelUrl && (
                  <Suspense fallback={<SceneLoader />}>
                    <ArtifactModel url={artifact.modelUrl} />
                  </Suspense>
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
        </Suspense>
      </Canvas>

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

      {/* Artifact count indicator */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 text-white text-sm rounded-full">
        {t('virtualTour.artifactCount', '{{count}} artifacts', { count: artifacts.length })}
      </div>

      {/* Pointer lock hint for desktop */}
      {!isMobile && !isLocked && !showInstructions && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded-lg">
          {t('virtualTour.clickToLook', 'Click to enable mouse look')}
        </div>
      )}
    </div>
  );
}
