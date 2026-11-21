// usage: node inject.mjs <device_id> <injector> <seconds> | node inject.mjs reset
const API = 'http://localhost:8000';
const [id, inj, secs] = process.argv.slice(2);
if (id === 'reset') { console.log(await (await fetch(`${API}/sim/reset`, { method: 'POST' })).json()); process.exit(); }
const ctrl = await (await fetch(`${API}/sim/${id}`)).json();
ctrl.inject[inj] = { active: true, until_ts: Date.now() + Number(secs) * 1000 };
const r = await fetch(`${API}/sim/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ctrl) });
console.log(r.status, JSON.stringify((await r.json()).inject[inj]));
