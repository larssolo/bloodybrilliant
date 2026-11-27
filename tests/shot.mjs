// Visual checks: drive headless Edge over the DevTools protocol and save a screenshot.
// The sound pop is pre-answered (bb-sound = 0) so it never covers the scene.
// Start the server first: npx -y serve -l 5179 .
// Usage: node tests/shot.mjs "<query>" <name> [waitMs] [js-to-run-before-capture]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [query = '', name = 'shot', wait = '4500', js = ''] = process.argv.slice(2);
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const port = 9300 + Math.floor(Math.random() * 500), out = join(tmpdir(), 'bb-shots');
mkdirSync(out, { recursive: true });
const ed = spawn(edge, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'bb-edge-'))}`, '--window-size=1280,760', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = list.find((t) => t.type === 'page'); if (pg) ws = pg.webSocketDebuggerUrl; } catch {}
  if (!ws) await sleep(200);
}
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map(), errors = [];
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
await cmd('Runtime.enable'); await cmd('Page.enable');
await cmd('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('bb-sound','0')}catch(e){}" });
await cmd('Page.navigate', { url: `http://localhost:5179/?${query}` });
await sleep(+wait);
if (js) { const r = await cmd('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true }); if (r.result?.result?.value !== undefined) console.log('eval:', JSON.stringify(r.result.result.value)); await sleep(1200); }
const shot = await cmd('Page.captureScreenshot', { format: 'png' });
const file = join(out, `${name}.png`); writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
console.log(file); if (errors.length) console.log('PAGE ERRORS:', errors.join(' | '));
sock.close(); ed.kill();
