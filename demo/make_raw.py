# Burns captions onto a recorded take and exports raw + captioned clips.
# usage: ..\.venv\Scripts\python make_raw.py take1   -> out/take1/final/*.mp4
import json
import subprocess
import sys
from pathlib import Path

take = Path("out") / (sys.argv[1] if len(sys.argv) > 1 else "take1")
final = take / "final"
final.mkdir(exist_ok=True)
PHONE_OFFSET = 0.7  # phone clip starts ~0.7 s after the dashboard clip (measured from the push frame)

ev = {e["name"]: e["t"] / 1000 for e in json.load(open(take / "events.json"))["events"]}

# (start, end, text) on the shared T0 timeline
DASH_CAPS = [
    (0.5, ev["fleet_overview"], "TwinLab: predictive maintenance for textile & FMCG plants"),
    (ev["fleet_overview"], ev["fault_injected"], "Four critical assets, one live view. Non-invasive sensors, no OT integration"),
    (ev["fault_injected"], ev["fault_injected"] + 6, "Simulated bearing fault: compressor vibration jumps 8x past its limit"),
    (ev["fault_injected"] + 6, ev["twin_critical"], "Every breach is logged, timestamped and pushed to the owner's phone"),
    (ev["twin_critical"], ev["demo_reset"], "Maintenance sees which asset, which sensor, how far over, before the line stops"),
    (ev["demo_reset"], ev["back_to_healthy"], "Fault cleared: readings drop back under threshold automatically"),
    (ev["back_to_healthy"], ev["end"] + 3, "TwinLab by OmniteX  |  Non-invasive  |  PKR-billed"),
]
PHONE_CAPS = [
    (0.5, ev["fault_injected"], "The owner's view: every asset on the TwinLab app"),
    (ev["fault_injected"], ev["phone_tap_notification"], "Critical push alert, seconds after the fault"),
    (ev["phone_tap_notification"], ev["twin_critical"], "One tap opens the live digital twin"),
    (ev["twin_critical"], ev["demo_reset"], "Red rim, shaking fan, every sensor in context"),
    (ev["demo_reset"], ev["end"] + 3, "Fixed: the twin turns green on its own"),
]


def ts(s):
    s = max(0.0, s)
    return f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"


def write_ass(path, caps, w, h, size, margin, offset=0.0):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Segoe UI Semibold,{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90141A1F,0,0,0,0,100,100,0,0,3,{size // 3},0,2,{margin},{margin},{margin},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [f"Dialogue: 0,{ts(a - offset)},{ts(b - offset)},Cap,,0,0,0,,{{\\fad(200,200)}}{t}" for a, b, t in caps]
    path.write_text(head + "\n".join(lines) + "\n", encoding="utf-8")


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True, cwd=take)


write_ass(take / "dash.ass", DASH_CAPS, 1920, 1080, 44, 60)
write_ass(take / "phone.ass", PHONE_CAPS, 720, 1600, 46, 48, offset=PHONE_OFFSET)

x264 = ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
ff("-i", "dash.mp4", *x264, "final/dashboard_raw.mp4")
ff("-i", "dash.mp4", "-vf", "ass=dash.ass", *x264, "final/dashboard_captioned.mp4")
ff("-i", "phone.mp4", "-vf", "fps=30", *x264, "-an", "final/phone_raw.mp4")
ff("-i", "phone.mp4", "-vf", "fps=30,ass=phone.ass", *x264, "-an", "final/phone_captioned.mp4")
print("[OK]", *sorted(p.name for p in final.iterdir()))
