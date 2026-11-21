// Records one demo take: dashboard (CDP screencast frames) + phone (adb screenrecord), in sync.
// usage: node record.mjs <take-name>     -> out/<take>/{dash_frames/,phone.mp4,events.json}
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';

const ADB = 'C:/Users/Arham/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const DASH = 'http://localhost:5174';
const API = 'http://localhost:8000';
const DEV = 'KHI-TEX-COMP-01';
const take = process.argv[2] || 'take1';
const out = `out/${take}`;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(`${out}/dash_frames`, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = (...a) => execFileSync(ADB, a, { stdio: 'ignore' });
const events = [];
let T0 = 0;
const mark = (name) => { const t = Date.now() - T0; events.push({ t, name }); console.log(`[${(t / 1000).toFixed(1)}s] ${name}`); };

async function inject(inj, secs) {
  const ctrl = await (await fetch(`${API}/sim/${DEV}`)).json();
  ctrl.inject[inj] = { active: true, until_ts: Date.now() + secs * 1000 };
  await fetch(`${API}/sim/${DEV}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ctrl) });
}
const reset = () => fetch(`${API}/sim/reset`, { method: 'POST' });

// --- prep: clean state, phone on the asset list ---
adb('reverse', 'tcp:8000', 'tcp:8000');
await reset();
adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP');
adb('shell', 'am', 'force-stop', 'com.omnitex.twinlab');
adb('shell', 'monkey', '-p', 'com.omnitex.twinlab', '-c', 'android.intent.category.LAUNCHER', '1');
adb('shell', 'rm', '-f', '/sdcard/twinlab_demo.mp4');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(DASH);
await page.addStyleTag({ content: 'html{zoom:1.3}' });
await sleep(5000); // WS connects, phone app loads

// --- start both recorders ---
const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const i = frames.length;
  frames.push({ file: `f${String(i).padStart(5, '0')}.jpg`, ts: metadata.timestamp * 1000 });
  fs.writeFileSync(`${out}/dash_frames/${frames[i].file}`, Buffer.from(data, 'base64'));
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
const phoneRec = spawn(ADB, ['shell', 'screenrecord', '--bit-rate', '12000000', '--time-limit', '120', '/sdcard/twinlab_demo.mp4']);
T0 = Date.now();
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080 });
mark('start');

// --- choreography (~80 s) ---
await sleep(7000);  mark('fleet_overview');            // dashboard: 4 assets, phone: asset list
await page.getByText('Air Compressor', { exact: false }).first().click();
mark('dash_open_compressor');
await sleep(9000);                                       // live healthy charts
await inject('overload', 35);  mark('fault_injected');  // vibration 0.05 -> 0.4 g, load 18 -> 56 A
const adbOut = (...a) => execFileSync(ADB, a, { encoding: 'utf8' });
for (let i = 0; i < 20 && !adbOut('shell', 'dumpsys', 'notification', '--noredact').includes('pkg=com.omnitex.twinlab'); i++) await sleep(250);
mark('push_arrives');
await sleep(1200);                                       // let the heads-up be seen
adb('shell', 'input', 'tap', '360', '190');              // tap heads-up notification -> deep link
mark('phone_tap_notification');
await sleep(1500);
if (!adbOut('shell', 'dumpsys', 'window').match(/mCurrentFocus=.*twinlab/) ||
    adbOut('shell', 'uiautomator', 'dump', '/dev/tty').includes('KARACHI TEXTILE MILL')) {
  // heads-up tap missed: fire the same intent the notification's PendingIntent carries
  adb('shell', 'am', 'start', '-n', 'com.omnitex.twinlab/.MainActivity', '-f', '0x24000000', '--es', 'deviceId', DEV);
  mark('phone_deeplink_fallback');
}
await sleep(14000); mark('twin_critical');               // phone twin red; dashboard alerts panel
await sleep(10000);
adb('reverse', 'tcp:8000', 'tcp:8000');
await reset(); mark('demo_reset');                        // maintenance fixed it
await sleep(14000); mark('back_to_healthy');
await sleep(4000); mark('end');

// --- stop + collect ---
await cdp.send('Page.stopScreencast');
phoneRec.kill('SIGINT');
adb('shell', 'pkill', '-INT', 'screenrecord');
await sleep(2500);
await browser.close();
execFileSync(ADB, ['pull', '/sdcard/twinlab_demo.mp4', `${out}/phone.mp4`], { stdio: 'inherit' });

// concat list for ffmpeg (variable frame timing -> CFR later)
const lines = ['ffconcat version 1.0'];
const dashStart = frames[0].ts - T0;
frames.forEach((f, i) => {
  const next = frames[i + 1] ? frames[i + 1].ts : T0 + events.at(-1).t;
  lines.push(`file 'dash_frames/${f.file}'`, `duration ${Math.max(0.001, (next - f.ts) / 1000).toFixed(3)}`);
});
lines.push(`file 'dash_frames/${frames.at(-1).file}'`);
fs.writeFileSync(`${out}/dash.ffconcat`, lines.join('\n'));
fs.writeFileSync(`${out}/events.json`, JSON.stringify({ dashStartMs: dashStart, events }, null, 1));
console.log(`[OK] ${frames.length} dashboard frames, dash offset ${dashStart} ms`);
