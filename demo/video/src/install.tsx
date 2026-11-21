// Animated "what we monitor / what we install / how it installs" section, then the recorded demo.
// Flat line-art in brand colours (navy strokes, mist fills, teal for moving parts).
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B, Canvas, CloseCard, ease, Rise, SplitShot, TitleCard, useBrandFonts } from "./brand";

const S = { stroke: B.navy, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const VB = "0 -40 320 250"; // shared machine viewBox (room above for exhaust / kit)

const Wheel: React.FC<{ cx: number; cy: number; r: number; speed?: number }> = ({ cx, cy, r, speed = 8 }) => {
  const f = useCurrentFrame();
  return (
    <g transform={`rotate(${f * speed} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill={B.mist} {...S} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} {...S} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} {...S} />
    </g>
  );
};

const Generator: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const t = (f * 1.2 + i * 20) % 60;
        return <circle key={i} cx={69 + t / 4} cy={26 - t} r={6 + t / 8} fill={B.gray} opacity={0.45 * (1 - t / 60)} />;
      })}
      <rect x={60} y={30} width={18} height={42} fill={B.navy} />
      <rect x={30} y={70} width={260} height={110} rx={10} fill={B.mist} {...S} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={52 + i * 24} y1={95} x2={52 + i * 24} y2={155} stroke={B.teal} strokeWidth={5} strokeLinecap="round" />
      ))}
      <rect x={200} y={92} width={70} height={56} rx={6} fill="#fff" {...S} />
      <circle cx={218} cy={110} r={6} fill={B.teal} />
      <circle cx={238} cy={110} r={6} fill={B.navy} />
      <rect x={210} y={126} width={50} height={10} rx={3} fill={B.gray} opacity={0.5} />
      <rect x={20} y={180} width={280} height={16} rx={3} fill={B.navy} />
    </g>
  );
};

const Motor: React.FC = () => (
  <g>
    <rect x={70} y={172} width={150} height={12} rx={3} fill={B.navy} />
    <rect x={40} y={184} width={210} height={12} rx={3} fill={B.navy} />
    <rect x={50} y={80} width={190} height={95} rx={40} fill={B.mist} {...S} />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={78 + i * 17} y1={90} x2={78 + i * 17} y2={165} stroke={B.navy} strokeOpacity={0.3} strokeWidth={3} />
    ))}
    <rect x={232} y={96} width={22} height={64} rx={8} fill={B.mist} {...S} />
    <rect x={254} y={120} width={36} height={14} fill={B.navy} />
    <Wheel cx={294} cy={127} r={17} speed={14} />
    <rect x={110} y={56} width={50} height={26} rx={4} fill="#fff" {...S} />
  </g>
);

const Conveyor: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      {[60, 260].map((x) => <line key={x} x1={x} y1={136} x2={x} y2={196} {...S} strokeWidth={5} />)}
      <line x1={30} y1={196} x2={290} y2={196} {...S} strokeWidth={5} />
      <rect x={20} y={100} width={280} height={36} rx={18} fill={B.mist} {...S} />
      <line x1={38} y1={100} x2={282} y2={100} stroke={B.teal} strokeWidth={4} strokeDasharray="10 12" strokeDashoffset={-f * 3} />
      <Wheel cx={38} cy={118} r={13} />
      <Wheel cx={282} cy={118} r={13} />
      {[0, 1, 2].map((i) => {
        const x = 40 + ((f * 2 + i * 85) % 240);
        return <rect key={i} x={x} y={64} width={34} height={34} rx={3} fill="#fff" {...S} opacity={interpolate(x, [40, 58, 250, 280], [0, 1, 1, 0])} />;
      })}
    </g>
  );
};

const Compressor: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      {[60, 240].map((x) => <rect key={x} x={x} y={176} width={20} height={20} fill={B.navy} />)}
      <rect x={20} y={110} width={280} height={70} rx={35} fill={B.mist} {...S} />
      <rect x={55} y={62} width={80} height={48} rx={8} fill="#fff" {...S} />
      <Wheel cx={152} cy={86} r={18} speed={16} />
      <rect x={180} y={50} width={62} height={60} rx={6} fill={B.mist} {...S} />
      {[62, 74, 86, 98].map((y) => <line key={y} x1={186} y1={y} x2={236} y2={y} stroke={B.navy} strokeOpacity={0.35} strokeWidth={3} />)}
      <line x1={275} y1={98} x2={275} y2={110} {...S} />
      <circle cx={275} cy={80} r={19} fill="#fff" {...S} />
      <line x1={275} y1={80} x2={275} y2={66} stroke={B.teal} strokeWidth={4} strokeLinecap="round" transform={`rotate(${-25 + 14 * Math.sin(f / 7)} 275 80)`} />
    </g>
  );
};

const Header: React.FC<{ label: string; title: string }> = ({ label, title }) => (
  <Rise style={{ position: "absolute", left: 125, top: 120 }}>
    <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: 4, color: B.teal }}>{label}</div>
    <div style={{ fontSize: 64, fontWeight: 500, color: B.navy, marginTop: 12 }}>{title}</div>
  </Rise>
);

const MACHINES = [
  { name: "Generators", sub: "Gensets and backup power", Art: Generator },
  { name: "Motors", sub: "Pumps, fans, spindles", Art: Motor },
  { name: "Conveyors", sub: "Process and packing lines", Art: Conveyor },
  { name: "Compressors", sub: "Plant air and chillers", Art: Compressor },
];

const MachinesScene: React.FC = () => (
  <Canvas corner>
    <Header label="WHAT WE MONITOR" title="The machines a plant can't afford to lose" />
    <div style={{ position: "absolute", left: 125, top: 400, display: "flex", gap: 50 }}>
      {MACHINES.map(({ name, sub, Art }, i) => (
        <Rise key={name} delay={14 + i * 10}>
          <div style={{ width: 380 }}>
            <div style={{ background: "#fff", border: `2px solid ${B.mist}`, borderRadius: 20, padding: "40px 30px 30px" }}>
              <svg viewBox={VB} width={316} height={247} style={{ overflow: "visible" }}><Art /></svg>
            </div>
            <div style={{ fontSize: 44, fontWeight: 500, color: B.navy, marginTop: 26 }}>{name}</div>
            <div style={{ fontSize: 28, color: B.gray, marginTop: 6 }}>{sub}</div>
          </div>
        </Rise>
      ))}
    </div>
  </Canvas>
);

const STEPS = [
  { at: 15, text: "Mount it on the outside of the housing" },
  { at: 85, text: "It joins the plant Wi-Fi" },
  { at: 125, text: "Readings go live on dashboard and phone" },
];

const InstallScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = interpolate(spring({ frame: f - 15, fps, config: { damping: 14 } }), [0, 1], [-220, 0]);
  const strap = interpolate(f, [45, 70], [1, 0], ease);
  const chart = interpolate(f, [125, 190], [1, 0], ease);
  return (
    <Canvas corner>
      <Header label="HOW IT INSTALLS" title="Non-invasive: nothing is wired into the machine" />
      <svg viewBox={VB} width={800} height={625} style={{ position: "absolute", left: 110, top: 270, overflow: "visible" }}>
        <Motor />
        <line x1={202} y1={80} x2={202} y2={175} pathLength={1} strokeDasharray={1} strokeDashoffset={strap} stroke={B.navy} strokeWidth={6} strokeLinecap="round" />
        {f > 85 && [0, 1, 2].map((i) => {
          const p = ((f - 85) / 30 + i / 3) % 1;
          const r = 14 + p * 40;
          const dx = r * Math.sin(Math.PI / 3), dy = r * Math.cos(Math.PI / 3);
          return <path key={i} d={`M ${202 - dx} ${40 - dy} A ${r} ${r} 0 0 1 ${202 + dx} ${40 - dy}`} fill="none" stroke={B.teal} strokeWidth={3} strokeLinecap="round" opacity={1 - p} />;
        })}
        <g transform={`translate(0 ${drop})`}>
          <rect x={178} y={46} width={48} height={34} rx={5} fill={B.teal} stroke={B.navy} strokeWidth={2} />
          <rect x={185} y={53} width={34} height={20} rx={2} fill={B.cream} opacity={0.9} />
          <circle cx={194} cy={63} r={4} fill={B.navy} />
        </g>
      </svg>
      <svg width={200} height={20} style={{ position: "absolute", left: 930, top: 500, opacity: interpolate(f, [100, 115], [0, 1], ease) }}>
        <line x1={0} y1={10} x2={200} y2={10} stroke={B.teal} strokeWidth={4} strokeDasharray="10 12" strokeDashoffset={-f * 2} />
      </svg>
      <Rise delay={110} style={{ position: "absolute", left: 1150, top: 330 }}>
        <div style={{ width: 460, height: 290, border: `5px solid ${B.navy}`, borderRadius: 14, background: "#fff", overflow: "hidden" }}>
          <div style={{ background: B.mist, padding: "8px 16px", fontSize: 22, fontWeight: 500, color: B.navy }}>Motor 01 · vibration</div>
          <svg viewBox="0 0 400 200" width={450} height={225}>
            <polyline points="10,150 50,140 90,146 130,120 170,132 210,104 250,118 290,96 330,108 390,90" pathLength={1} strokeDasharray={1} strokeDashoffset={chart}
              fill="none" stroke={B.teal} strokeWidth={5} strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ width: 540, height: 18, background: B.navy, borderRadius: "0 0 10px 10px", marginLeft: -40 }} />
      </Rise>
      <Rise delay={130} style={{ position: "absolute", left: 1680, top: 300 }}>
        <div style={{ width: 170, height: 340, border: `5px solid ${B.navy}`, borderRadius: 26, background: "#fff", padding: 14 }}>
          <div style={{ background: B.mist, borderRadius: 10, padding: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 20, color: B.navy, fontWeight: 500 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: B.teal }} />Motor 01
          </div>
          <svg viewBox="0 0 120 120" width={132} height={132} style={{ marginTop: 30 }}>
            <rect x={20} y={30} width={80} height={60} rx={14} fill={B.mist} stroke={B.teal} strokeWidth={4} />
            <circle cx={60} cy={60} r={20} fill="#fff" stroke={B.navy} strokeWidth={3} />
            <g transform={`rotate(${f * 10} 60 60)`}>
              <line x1={46} y1={60} x2={74} y2={60} stroke={B.navy} strokeWidth={4} />
              <line x1={60} y1={46} x2={60} y2={74} stroke={B.navy} strokeWidth={4} />
            </g>
          </svg>
        </div>
      </Rise>
      <div style={{ position: "absolute", left: 125, top: 930, display: "flex", gap: 60 }}>
        {STEPS.map((s, i) => (
          <div key={s.text} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 31, whiteSpace: "nowrap", color: B.navy, opacity: interpolate(f, [s.at, s.at + 12], [0.25, 1], ease) }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: B.teal, color: B.cream, fontSize: 26, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            {s.text}
          </div>
        ))}
      </div>
    </Canvas>
  );
};

// 78.5 s of scenes minus 10 x 0.5 s fades = 73.5 s (2205 frames).
// A function so the scene components defined further down exist when it runs.
const SCENES = (): { name: string; secs: number; el: React.ReactNode }[] => [
  { name: "Title", secs: 3.5, el: <TitleCard /> },
  { name: "PF curve", secs: 8.5, el: <PFPage /> },
  { name: "Machines", secs: 7, el: <MachinesScene /> },
  { name: "Kit", secs: 7, el: <KitPhotoPage /> },
  { name: "Install", secs: 8, el: <InstallScene /> },
  { name: "Fleet", secs: 8, el: <SplitShot start={10} focus="both" caption="Four critical assets across two plants, live on one screen and in the owner's pocket" /> },
  { name: "Fault", secs: 5, el: <SplitShot start={20.5} focus="dash" simulated caption="Compressor vibration jumps 8x past its limit, load current spikes" /> },
  { name: "Push", secs: 4, el: <SplitShot start={25.3} focus="phone" caption="A critical push alert lands on the owner's phone" /> },
  { name: "Twin", secs: 11, el: <SplitShot start={31.6} focus="phone" caption="One tap opens the live digital twin: which asset, which sensor, how far over" /> },
  { name: "Recovery", secs: 10, el: <SplitShot start={60} focus="both" caption="Fault fixed: the twin and the charts return to green on their own" /> },
  { name: "Close", secs: 7, el: <CloseCard /> },
];

export const TwinLabFull: React.FC = () => {
  useBrandFonts();
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: Math.round(0.5 * fps) });
  return (
    <TransitionSeries>
      {SCENES().flatMap((s, i) => [
        ...(i ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={t} />] : []),
        <TransitionSeries.Sequence key={s.name} name={s.name} durationInFrames={Math.round(s.secs * fps)}>{s.el}</TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
  );
};

// ---- Real-photo kit + P-F curve scenes (also rendered as PDF pages at their last frame) ----

// Real bench kit photo (TwinLab_Raw_Kit.jpg, cropped). Marker positions are fractions of the crop.
const KIT_PARTS = [
  { n: 1, name: "ESP32", desc: "Wi-Fi and MQTT, streams every reading", x: 0.5, y: 0.52 },
  { n: 2, name: "MPU6050", desc: "3-axis vibration", x: 0.42, y: 0.22 },
  { n: 3, name: "DHT22", desc: "Temperature and humidity", x: 0.3, y: 0.8 },
];

export const KitPhotoPage: React.FC = () => {
  useBrandFonts();
  const f = useCurrentFrame();
  const H = 720, W = Math.round((H * 1112) / 1400);
  return (
    <Canvas corner>
      <Header label="WHAT WE INSTALL" title="One small kit per machine" />
      <div style={{ position: "absolute", left: 125, top: 290, width: W, height: H, borderRadius: 20, overflow: "hidden", boxShadow: "0 18px 50px rgba(26,58,92,.22)" }}>
        <div style={{ width: W, height: H, scale: interpolate(f, [0, 210], [1, 1.06]) }}>
          <Img src={staticFile("kit_photo.jpg")} style={{ width: W, height: H, objectFit: "cover" }} />
          {KIT_PARTS.map((p, i) => (
            <div key={p.n} style={{ position: "absolute", left: p.x * W - 24, top: p.y * H - 24, width: 48, height: 48, borderRadius: 24, background: B.teal, border: `3px solid ${B.cream}`,
              color: B.cream, fontSize: 26, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: interpolate(f, [30 + i * 25, 40 + i * 25], [0, 1], ease), scale: interpolate(f, [30 + i * 25, 42 + i * 25], [0.4, 1], ease) }}>{p.n}</div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 125 + W + 110, top: 330 }}>
        {KIT_PARTS.map((p, i) => (
          <Rise key={p.n} delay={30 + i * 25} style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 52 }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: B.teal, color: B.cream, fontSize: 28, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{p.n}</div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 500, color: B.navy }}>{p.name}</div>
              <div style={{ fontSize: 32, color: B.gray, marginTop: 4 }}>{p.desc}</div>
            </div>
          </Rise>
        ))}
        <div style={{ opacity: interpolate(f, [115, 130], [0, 1], ease), fontSize: 30, color: B.navy, marginTop: 30, lineHeight: 1.4, maxWidth: 780 }}>
          The working prototype on a breadboard, flashed and publishing live as device <span style={{ color: B.teal, fontWeight: 500 }}>TL-B49244</span>.
        </div>
      </div>
    </Canvas>
  );
};

// P-F curve: condition falls slowly, then fast, from P (fault detectable) to F (breakdown).
const PF_STAGES = [
  { x: 0.08, label: "P: fault starts", tl: false, p: true },
  { x: 0.34, label: "Vibration changes", tl: true },
  { x: 0.5, label: "Heat builds up", tl: true },
  { x: 0.68, label: "Audible noise", tl: false },
  { x: 0.8, label: "Hot to touch", tl: false },
  { x: 0.9, label: "Smoke", tl: false },
];

export const PFPage: React.FC = () => {
  useBrandFonts();
  const W = 1080, H = 520, X0 = 60, Y0 = 40;
  const cond = (x: number) => 1 - (Math.exp(4 * x) - 1) / (Math.exp(4) - 1);
  const pt = (x: number) => [X0 + x * W, Y0 + (1 - cond(x)) * H] as const;
  const path = Array.from({ length: 101 }, (_, i) => pt(i / 100)).map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const [ax] = pt(0.34), [fx] = pt(1);
  const f = useCurrentFrame();
  const draw = interpolate(f, [15, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const after = (a: number) => interpolate(f, [a, a + 15], [0, 1], ease);
  return (
    <Canvas corner>
      <Header label="THE PREDICTIVE ENGINE" title="Catch the fault at P, not at F" />
      <div style={{ position: "absolute", left: 125, top: 262, fontSize: 32, color: B.gray }}>
        Most plants find a failing machine at F, <span style={{ color: B.critical }}>when the line stops.</span>
      </div>
      <svg width={1200} height={680} viewBox="0 0 1200 680" style={{ position: "absolute", left: 85, top: 345, overflow: "visible", fontFamily: B.sans }}>
        <rect x={ax} y={Y0} width={fx - ax} height={H} fill={B.mist} opacity={after(95)} />
        <text opacity={after(95)} x={ax + 30} y={Y0 + H - 30} textAnchor="start" fontSize={26} fontWeight={500} fill={B.teal}>Warning window: plan the repair</text>
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + H} stroke={B.navy} strokeWidth={3} />
        <line x1={X0} y1={Y0 + H} x2={X0 + W + 20} y2={Y0 + H} stroke={B.navy} strokeWidth={3} />
        <text x={X0 - 18} y={Y0 + H / 2} textAnchor="middle" fontSize={24} fill={B.gray} transform={`rotate(-90 ${X0 - 18} ${Y0 + H / 2})`}>Machine condition</text>
        <text x={X0 + W} y={Y0 + H + 40} textAnchor="end" fontSize={24} fill={B.gray}>Time</text>
        <path d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} fill="none" stroke={B.navy} strokeWidth={5} strokeLinecap="round" />
        {PF_STAGES.map((s) => {
          const [x, y] = pt(s.x);
          const c = s.tl ? B.teal : s.p ? B.navy : B.gray;
          return (
            <g key={s.label} opacity={interpolate(draw, [s.x - 0.04, s.x + 0.02], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
              <circle cx={x} cy={y} r={s.tl ? 14 : 10} fill={s.tl ? B.teal : B.cream} stroke={c} strokeWidth={4} />
              <text x={x + 4} y={y - 26} fontSize={s.tl ? 28 : 24} fontWeight={s.tl ? 500 : 400} fill={s.tl ? B.navy : B.gray}>{s.label}</text>
            </g>
          );
        })}
        <circle cx={fx} cy={Y0 + H} r={16} fill={B.critical} opacity={after(85)} />
        <text opacity={after(85)} x={fx - 26} y={Y0 + H - 30} textAnchor="end" fontSize={28} fontWeight={500} fill={B.critical}>F: breakdown</text>
        <g opacity={after(95)} transform={`translate(${X0 + 20} ${Y0 + H + 70})`}>
          <circle cx={10} cy={-8} r={10} fill={B.teal} />
          <text x={32} y={0} fontSize={24} fill={B.navy}>What TwinLab sensors measure</text>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 1380, top: 360, width: 460, opacity: after(110) }}>
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: 4, color: B.teal, marginBottom: 30 }}>HOW IT WORKS TODAY</div>
        {[
          ["Sense", "Vibration, temperature and humidity stream live from every machine"],
          ["Check", "Each reading is compared with that machine's own limits"],
          ["Alert", "A breach sends a critical push to the owner's phone within seconds"],
        ].map(([h, d], i) => (
          <div key={h} style={{ display: "flex", gap: 20, marginBottom: 40 }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: B.teal, color: B.cream, fontSize: 26, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 38, fontWeight: 500, color: B.navy }}>{h}</div>
              <div style={{ fontSize: 28, color: B.gray, marginTop: 4, lineHeight: 1.35 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </Canvas>
  );
};
