import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const C = {
  bg: "#0f1419",
  panel: "#18212a",
  text: "#f2f5f7",
  muted: "#9aa7af",
  teal: "#3fb8a4",
  red: "#e5534b",
  font: "'Segoe UI', 'Segoe UI Semibold', Arial, sans-serif",
};

// Phone and dashboard clips start together (take 4: notification tap at 29.1 s on both clocks).
const PHONE_OFFSET_S = 0;

const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) } as const;

const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        opacity: interpolate(f, [delay, delay + 18], [0, 1], ease),
        translate: interpolate(f, [delay, delay + 18], ["0px 30px", "0px 0px"], ease),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const TitleCard: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center", fontFamily: C.font }}>
    <Rise>
      <div style={{ fontSize: 190, fontWeight: 700, color: C.text, letterSpacing: -4 }}>
        Twin<span style={{ color: C.teal }}>Lab</span>
      </div>
    </Rise>
    <Rise delay={10}>
      <div style={{ fontSize: 56, color: C.muted, marginTop: 10 }}>Predictive maintenance for Pakistani industry</div>
    </Rise>
  </AbsoluteFill>
);

export const ProblemCard: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, justifyContent: "center", padding: "0 180px", fontFamily: C.font }}>
    <Rise>
      <div style={{ fontSize: 96, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
        Most plants find a failing machine <span style={{ color: C.red }}>when the line stops.</span>
      </div>
    </Rise>
    <Rise delay={22}>
      <div style={{ fontSize: 54, color: C.muted, marginTop: 40, lineHeight: 1.3 }}>
        TwinLab puts non-invasive sensors on compressors, chillers, gensets and fans, and warns the owner first.
      </div>
    </Rise>
  </AbsoluteFill>
);

type ShotProps = {
  start: number; // seconds on the recording timeline (dashboard clock)
  caption: string;
  focus: "dash" | "phone" | "both";
  simulated?: boolean;
};

export const SplitShot: React.FC<ShotProps> = ({ start, caption, focus, simulated }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dim = (side: "dash" | "phone") => (focus === "both" || focus === side ? 1 : 0.4);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: C.font }}>
      <div
        style={{
          position: "absolute", left: 60, top: 70, width: 1300, height: 731, borderRadius: 18, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.5)",
          opacity: interpolate(f, [0, 15], [1, dim("dash")], ease),
        }}
      >
        <Video
          src={staticFile("dash.mp4")}
          trimBefore={Math.round(start * fps)}
          muted
          style={{
            width: "100%",
            transformOrigin: "50% 62%", // vibration + load-current charts
            scale: interpolate(f, [10, 4 * fps], [1, focus === "dash" ? 1.55 : 1], ease),
          }}
        />
      </div>
      <div
        style={{
          position: "absolute", left: 1430, top: 50, width: 420, height: 932, borderRadius: 54, background: "#05080a",
          padding: 12, boxShadow: "0 20px 60px rgba(0,0,0,.6)", transformOrigin: "center",
          opacity: interpolate(f, [0, 15], [1, dim("phone")], ease),
          scale: interpolate(f, [0, 20], [1, focus === "phone" ? 1.06 : 1], ease),
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden" }}>
          <Video
            src={staticFile("phone.mp4")}
            trimBefore={Math.max(0, Math.round((start - PHONE_OFFSET_S) * fps))}
            muted
            style={{ width: "100%" }}
          />
        </div>
      </div>
      <Rise delay={6} style={{ position: "absolute", left: 60, top: 840, width: 1300 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ width: 8, alignSelf: "stretch", borderRadius: 4, background: simulated ? C.red : C.teal }} />
          <div>
            {simulated && (
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.red, marginBottom: 6 }}>SIMULATED FAULT</div>
            )}
            <div style={{ fontSize: 56, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{caption}</div>
          </div>
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

const Point: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => (
  <Rise delay={delay}>
    <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 60, color: C.text, marginTop: 34 }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: C.teal, boxShadow: `0 0 24px ${C.teal}` }} />
      {children}
    </div>
  </Rise>
);

export const CloseCard: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, justifyContent: "center", padding: "0 180px", fontFamily: C.font }}>
    <Rise>
      <div style={{ fontSize: 150, fontWeight: 700, color: C.text, letterSpacing: -3 }}>
        Twin<span style={{ color: C.teal }}>Lab</span>
      </div>
    </Rise>
    <Point delay={14}>Non-invasive sensors, no OT integration</Point>
    <Point delay={26}>Live digital twin and push alerts on Android</Point>
    <Point delay={38}>Built in Pakistan, billed in PKR</Point>
    <Rise delay={60}>
      <div style={{ fontSize: 40, color: C.muted, marginTop: 70 }}>by OmniteX</div>
    </Rise>
  </AbsoluteFill>
);
