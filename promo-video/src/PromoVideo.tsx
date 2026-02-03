import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
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

export const PromoVideo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0f0a" }}>
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
      </TransitionSeries>
    </AbsoluteFill>
  );
};
