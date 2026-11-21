import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import { CloseCard, ProblemCard, SplitShot, TitleCard } from "./scenes";

// Shot starts are seconds on the take-4 recording clock (demo/out/take4/events.json).
export const TwinLabDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: Math.round(0.5 * fps) });
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Title" durationInFrames={4.5 * fps}>
        <TitleCard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Problem" durationInFrames={6.5 * fps}>
        <ProblemCard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Fleet" durationInFrames={8 * fps}>
        <SplitShot start={10} focus="both" caption="Four critical assets across two plants, live on one screen and in the owner's pocket" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Fault" durationInFrames={5 * fps}>
        <SplitShot start={20.5} focus="dash" simulated caption="Compressor vibration jumps 8x past its limit, load current spikes" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Push" durationInFrames={4 * fps}>
        <SplitShot start={25.3} focus="phone" caption="A critical push alert lands on the owner's phone" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Twin" durationInFrames={11 * fps}>
        <SplitShot start={31.6} focus="phone" caption="One tap opens the live digital twin: which asset, which sensor, how far over" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Recovery" durationInFrames={10 * fps}>
        <SplitShot start={60} focus="both" caption="Fault fixed: the twin and the charts return to green on their own" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Close" durationInFrames={8 * fps}>
        <CloseCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
