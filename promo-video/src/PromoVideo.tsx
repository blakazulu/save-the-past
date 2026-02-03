import { AbsoluteFill, Sequence, useVideoConfig, Audio, staticFile, interpolate, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { CaptureScene } from "./scenes/CaptureScene";
import { ReconstructionScene } from "./scenes/ReconstructionScene";
import { AnalysisScene } from "./scenes/AnalysisScene";
import { MuseumScene } from "./scenes/MuseumScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { OutroScene } from "./scenes/OutroScene";
import { LogoRevealScene } from "./scenes/LogoRevealScene";

export const PromoVideo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Scene timing calculations (in frames)
  const scene1End = 7 * fps;                    // 210
  const scene2End = scene1End + 5 * fps;        // 360
  const scene3End = scene2End + 8 * fps;        // 600
  const scene4End = scene3End + 10 * fps;       // 900
  const scene5End = scene4End + 8 * fps;        // 1140
  const scene6End = scene5End + 10 * fps;       // 1440
  const scene7End = scene6End + 6 * fps;        // 1620

  // Background music volume with fade in/out
  const bgMusicVolume = interpolate(
    frame,
    [0, 60, durationInFrames - 90, durationInFrames],
    [0, 0.25, 0.25, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0f0a" }}>
      {/* Background Music - starts when logo appears (~0.6s) */}
      <Sequence from={19}>
        <Audio
          src={staticFile("audio/background.mp3")}
          volume={(f) => interpolate(
            f + 19,
            [durationInFrames - 90, durationInFrames],
            [0.25, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )}
        />
      </Sequence>

      {/* Camera shutter in Capture scene */}
      <Sequence from={404}>
        <Audio src={staticFile("audio/camera.mp3")} volume={0.6} />
      </Sequence>

      {/* Whoosh on scene transitions */}
      <Sequence from={scene1End - 10}>
        <Audio src={staticFile("audio/whoosh1.mp3")} volume={0.2} />
      </Sequence>
      <Sequence from={295}>
        <Audio src={staticFile("audio/whoosh2.mp3")} volume={0.4} />
      </Sequence>
      {/* Reconstruction scene sound effect */}
      <Sequence from={scene3End - 60}>
        <Audio src={staticFile("audio/ReconstructionScene.mp3")} volume={0.5} />
      </Sequence>

      {/* Museum ambience */}
      <Sequence from={1000} durationInFrames={10 * fps + 60}>
        <Audio
          src={staticFile("audio/MuseumScene.mp3")}
          volume={(f) => interpolate(f, [0, 30, 10 * fps, 10 * fps + 30], [0, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>

      {/* Outro reveal sound */}
      <Sequence from={scene7End + 15}>
        <Audio src={staticFile("audio/OutroScene.mp3")} volume={0.55} />
      </Sequence>
      <TransitionSeries>
        {/* Scene 1: Cinematic Intro with Logo - 7 seconds */}
        <TransitionSeries.Sequence durationInFrames={7 * fps} style={{ backgroundColor: "#0a0503" }}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.floor(0.8 * fps) })}
        />

        {/* Scene 2: The Problem - 5 seconds */}
        <TransitionSeries.Sequence durationInFrames={5 * fps}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: Math.floor(0.6 * fps) })}
        />

        {/* Scene 3: Capture Flow - 8 seconds */}
        <TransitionSeries.Sequence durationInFrames={8 * fps}>
          <CaptureScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.floor(0.5 * fps) })}
        />

        {/* Scene 4: 3D Reconstruction - 10 seconds */}
        <TransitionSeries.Sequence durationInFrames={10 * fps}>
          <ReconstructionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: Math.floor(0.6 * fps) })}
        />

        {/* Scene 5: AI Analysis - 8 seconds */}
        <TransitionSeries.Sequence durationInFrames={8 * fps}>
          <AnalysisScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.floor(0.8 * fps) })}
        />

        {/* Scene 6: Virtual Museum - 10 seconds */}
        <TransitionSeries.Sequence durationInFrames={10 * fps}>
          <MuseumScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.floor(0.5 * fps) })}
        />

        {/* Scene 7: Feature Highlights - 6 seconds */}
        <TransitionSeries.Sequence durationInFrames={6 * fps}>
          <FeaturesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.floor(1 * fps) })}
        />

        {/* Scene 8: Outro with CTA - 6 seconds */}
        <TransitionSeries.Sequence durationInFrames={6 * fps}>
          <OutroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.floor(0.5 * fps) })}
        />

        {/* Scene 9: Logo Reveal - dramatic reverse explosion - to end */}
        <TransitionSeries.Sequence durationInFrames={11 * fps}>
          <LogoRevealScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
