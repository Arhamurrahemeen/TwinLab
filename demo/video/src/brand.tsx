// TwinLab-branded copy of the demo (Brand_Voice_and_Visual.md): cream canvas, navy/teal,
// Plus Jakarta Sans 400/500, sentence case, navy->teal bottom accent bar, wordmark top-right.
import { Video } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useEffect, useState } from "react";
import {
  AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

export const B = {
  navy: "#1A3A5C",
  teal: "#2A7A8A",
  mist: "#EAF4F7",
  cream: "#FAF8F3",
  gray: "#9C8E75",
  critical: "#D9534F", // app StatusCritical — functional alert colour, not brand
  sans: "'Jakarta', 'Plus Jakarta Sans', Calibri, sans-serif",
  serif: "'Lora', Georgia, serif", // wordmark face, as in the app
};
const COMPANY = "Zentriq";

export const useBrandFonts = () => {
  const [handle] = useState(() => delayRender("brand fonts"));
  useEffect(() => {
    const faces = [
      new FontFace("Jakarta", `url(${staticFile("jakarta_variable.ttf")})`, { weight: "200 800" }),
      new FontFace("Lora", `url(${staticFile("lora_variable.ttf")})`, { weight: "400 700" }),
    ];
    Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(handle));
  }, [handle]);
};

export const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) } as const;

export const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ opacity: interpolate(f, [delay, delay + 18], [0, 1], ease), translate: interpolate(f, [delay, delay + 18], ["0px 30px", "0px 0px"], ease), ...style }}>
      {children}
    </div>
  );
};

export const Lockup: React.FC<{ size: number; byline?: boolean }> = ({ size, byline }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
    <Img src={staticFile("twinlab_mark.png")} style={{ height: size * 0.82 }} />
    <div>
      <div style={{ fontFamily: B.serif, fontWeight: 500, fontSize: size, lineHeight: 1, color: B.navy }}>
        Twin<span style={{ color: B.teal }}>Lab</span>
      </div>
      {byline && (
        <div style={{ fontFamily: B.sans, fontWeight: 500, fontSize: size * 0.2, letterSpacing: size * 0.04, color: B.gray, marginTop: size * 0.12 }}>
          BY {COMPANY.toUpperCase()}
        </div>
      )}
    </div>
  </div>
);

// Shared chrome on every scene: cream canvas, bottom accent bar, optional top-right wordmark.
export const Canvas: React.FC<{ children: React.ReactNode; corner?: boolean; style?: React.CSSProperties }> = ({ children, corner, style }) => (
  <AbsoluteFill style={{ background: B.cream, fontFamily: B.sans, ...style }}>
    {children}
    {corner && (
      <div style={{ position: "absolute", top: 34, right: 70 }}>
        <Lockup size={40} />
      </div>
    )}
    <div style={{ position: "absolute", left: 0, bottom: 0, width: "40%", height: 6, background: `linear-gradient(90deg, ${B.navy}, ${B.teal})` }} />
  </AbsoluteFill>
);

export const TitleCard: React.FC = () => (
  <Canvas style={{ justifyContent: "center", alignItems: "center" }}>
    <Rise>
      <Lockup size={170} byline />
    </Rise>
    <Rise delay={14}>
      <div style={{ fontSize: 50, color: B.gray, marginTop: 60 }}>Predictive maintenance for Pakistani industry</div>
    </Rise>
  </Canvas>
);

export const ProblemCard: React.FC = () => (
  <Canvas corner style={{ justifyContent: "center", padding: "0 180px" }}>
    <Rise>
      <div style={{ fontSize: 92, fontWeight: 500, color: B.navy, lineHeight: 1.12 }}>
        Most plants find a failing machine <span style={{ color: B.critical }}>when the line stops.</span>
      </div>
    </Rise>
    <Rise delay={22}>
      <div style={{ fontSize: 50, color: B.gray, marginTop: 40, lineHeight: 1.35 }}>
        TwinLab puts non-invasive sensors on compressors, chillers, gensets and fans, and warns the owner first.
      </div>
    </Rise>
  </Canvas>
);

type ShotProps = { start: number; caption: string; focus: "dash" | "phone" | "both"; simulated?: boolean };

export const SplitShot: React.FC<ShotProps> = ({ start, caption, focus, simulated }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dim = (side: "dash" | "phone") => (focus === "both" || focus === side ? 1 : 0.35);
  return (
    <Canvas corner>
      <div
        style={{
          position: "absolute", left: 60, top: 110, width: 1300, height: 731, borderRadius: 16, overflow: "hidden",
          boxShadow: "0 18px 50px rgba(26,58,92,.22)", outline: `1px solid ${B.mist}`,
          opacity: interpolate(f, [0, 15], [1, dim("dash")], ease),
        }}
      >
        <Video
          src={staticFile("dash.mp4")}
          trimBefore={Math.round(start * fps)}
          muted
          style={{ width: "100%", transformOrigin: "50% 62%", scale: interpolate(f, [10, 4 * fps], [1, focus === "dash" ? 1.55 : 1], ease) }}
        />
      </div>
      <div
        style={{
          position: "absolute", left: 1440, top: 110, width: 400, height: 888, borderRadius: 52, background: B.navy,
          padding: 11, boxShadow: "0 18px 50px rgba(26,58,92,.3)",
          opacity: interpolate(f, [0, 15], [1, dim("phone")], ease),
          scale: interpolate(f, [0, 20], [1, focus === "phone" ? 1.05 : 1], ease),
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 41, overflow: "hidden", background: B.cream }}>
          <Video src={staticFile("phone.mp4")} trimBefore={Math.round(start * fps)} muted style={{ width: "100%" }} />
        </div>
      </div>
      <Rise delay={6} style={{ position: "absolute", left: 60, top: 878, width: 1320 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ width: 6, borderRadius: 3, background: simulated ? B.critical : B.teal }} />
          <div>
            {simulated && (
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: 4, color: B.critical, marginBottom: 6 }}>SIMULATED FAULT</div>
            )}
            <div style={{ fontSize: 50, fontWeight: 500, color: B.navy, lineHeight: 1.22 }}>{caption}</div>
          </div>
        </div>
      </Rise>
    </Canvas>
  );
};

const Point: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => (
  <Rise delay={delay}>
    <div style={{ display: "flex", alignItems: "center", gap: 26, fontSize: 56, color: B.navy, marginTop: 30 }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, background: B.teal }} />
      {children}
    </div>
  </Rise>
);

export const CloseCard: React.FC = () => (
  <Canvas style={{ justifyContent: "center", padding: "0 180px" }}>
    <Rise>
      <Lockup size={130} byline />
    </Rise>
    <div style={{ marginTop: 40 }}>
      <Point delay={14}>Non-invasive sensors, no OT integration</Point>
      <Point delay={26}>Live digital twin and push alerts on Android</Point>
      <Point delay={38}>Built in Pakistan, billed in PKR</Point>
    </div>
  </Canvas>
);

// Same cut and timings as TwinLabDemo (take 4 clock).
export const TwinLabDemoBrand: React.FC = () => {
  useBrandFonts();
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
