// Drives headless Chromium over CDP to play-test Cari Bedanya! and take its
// screenshots. This Chromium build blocks loopback page loads, so pages are
// served from disk via Fetch interception, and it needs the Hatch WebGL domain
// policy file to start.
//   node shoot.mjs test    — loads the plain game, clicks a real difference,
//                            a wrong spot, a hint and pause, reports errors
//   node shoot.mjs shots   — takes every shot in shots.json as a JPEG
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, normalize } from 'node:path';

const CHROME = '/opt/meta-chromium/chrome';
const POLICY = '/tmp/webgl-policy-spotdiff.txt';
writeFileSync(POLICY, 'hatch-webgl-all-origins-v1\n');
const POLICY_SHA = createHash('sha256').update(readFileSync(POLICY)).digest('hex');
const PORT = 9343;
const BASE = 'http://localhost:8080';
const REPO = '/home/hatch/workspace/makefun-sweep/best-spot-the-difference-game-20261121-0451/repo';
const APP_DIR = join(REPO, 'game');
const SHOTS = JSON.parse(readFileSync(join(REPO, 'shots.json'), 'utf8'));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/proxy/i.test(k)) delete env[k];
  const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', '--no-proxy-server', '--disable-gpu',
    '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests', '--hide-scrollbars', '--mute-audio',
    `--remote-debugging-port=${PORT}`, `--hatch-webgl-allowed-domains-file=${POLICY}`,
    `--hatch-webgl-allowed-domains-sha256=${POLICY_SHA}`, '--window-size=1280,720',
    '--user-data-dir=/tmp/spotdiff-chrome', 'about:blank'], { env });
  let version = null;
  for (let i = 0; i < 60 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); }
  }
  if (!version) throw new Error('chrome did not start');
  return { proc, wsUrl: version.webSocketDebuggerUrl };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const listeners = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id !== undefined && pending.has(d.id)) {
        const p = pending.get(d.id);
        pending.delete(d.id);
        if (d.error) p.reject(new Error(JSON.stringify(d.error)));
        else p.resolve(d.result);
      } else if (d.method) {
        for (const fn of listeners) fn(d);
      }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({
      send(method, params = {}, sessionId) {
        const id = nextId++;
        return new Promise((ok, fail) => {
          pending.set(id, { resolve: ok, reject: fail });
          ws.send(JSON.stringify({ id, method, params, sessionId }));
        });
      },
      on(fn) { listeners.push(fn); },
      close() { ws.close(); },
    });
  });
}

async function openPage(browser, url, width, height) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const errors = [];
  const requests = [];
  browser.on((ev) => {
    if (ev.sessionId !== sessionId) return;
    if (ev.method === 'Fetch.requestPaused') {
      const { requestId, request } = ev.params;
      requests.push(request.url);
      const path = new URL(request.url).pathname;
      const file = normalize(join(APP_DIR, path === '/' ? 'index.html' : path));
      let code = 200;
      let body = '';
      let type = 'text/plain';
      try {
        const data = readFileSync(file);
        body = data.toString('base64');
        type = MIME[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream';
      } catch {
        code = 404;
        body = Buffer.from('not found').toString('base64');
      }
      browser.send('Fetch.fulfillRequest', { requestId, responseCode: code, responseHeaders: [{ name: 'Content-Type', value: type }], body }, sessionId).catch(() => {});
      return;
    }
    if (ev.method === 'Runtime.exceptionThrown') errors.push(`exception: ${ev.params.exceptionDetails.text} ${ev.params.exceptionDetails.exception?.description ?? ''}`);
    if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') errors.push(`log: ${ev.params.entry.text}`);
    if (ev.method === 'Runtime.consoleAPICalled' && ev.params.type === 'error') errors.push(`console: ${ev.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
  });
  await browser.send('Page.enable', {}, sessionId);
  await browser.send('Runtime.enable', {}, sessionId);
  await browser.send('Log.enable', {}, sessionId);
  await browser.send('Fetch.enable', { patterns: [{ urlPattern: `${BASE}/*`, requestStage: 'Request' }] }, sessionId);
  await browser.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  await browser.send('Page.navigate', { url }, sessionId);
  const evaluate = async (expr) => {
    const r = await browser.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''));
    return r.result.value;
  };
  const screenshot = async (path, quality = 85) => {
    const s = await browser.send('Page.captureScreenshot', { format: 'jpeg', quality, captureBeyondViewport: false }, sessionId);
    writeFileSync(path, Buffer.from(s.data, 'base64'));
  };
  const click = async (x, y) => {
    await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, sessionId);
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, sessionId);
  };
  const key = async (text) => {
    const params = text.length === 1
      ? { type: 'keyDown', key: text, text, code: `Key${text.toUpperCase()}` }
      : { type: 'keyDown', key: text, code: text };
    await browser.send('Input.dispatchKeyEvent', params, sessionId);
    await browser.send('Input.dispatchKeyEvent', { ...params, type: 'keyUp' }, sessionId);
  };
  return { sessionId, targetId, errors, requests, evaluate, screenshot, click, key };
}

async function waitFor(page, expr, timeoutMs = 60000) {
  const start = Date.now();
  for (;;) {
    const v = await page.evaluate(expr).catch(() => undefined);
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`timeout: ${expr}`);
    await sleep(120);
  }
}

const gameState = () => `(() => { const s = window.__game.state; return { screen: s.screen, level: s.levelIndex, found: s.found.size, score: s.score, timeLeft: Math.round(s.timeLeft), hintsLeft: s.hintsLeft, combo: s.combo }; })()`;

async function test() {
  const { proc, wsUrl } = await launch();
  const browser = await connect(wsUrl);
  try {
    const page = await openPage(browser, `${BASE}/`, 1280, 720);
    await sleep(2500);
    console.log('initial:', JSON.stringify(await page.evaluate(gameState())));
    // Start the game with Enter, then click the moon (left panel diff 0 at panel 480,62 -> page 510,172).
    await page.key('Enter');
    await sleep(400);
    console.log('after Enter:', JSON.stringify(await page.evaluate(gameState())));
    await page.click(510, 172);
    await sleep(300);
    const afterFind = await page.evaluate(gameState());
    console.log('after clicking the moon:', JSON.stringify(afterFind));
    if (afterFind.found !== 1 || afterFind.score < 100) throw new Error('difference click did not register');
    // A wrong click in empty sky (panel 480,30 -> page 510,140 is near moon? use panel 250,60 -> page 280,170).
    await page.click(280, 170);
    await sleep(300);
    const afterMiss = await page.evaluate(gameState());
    console.log('after a wrong click:', JSON.stringify(afterMiss));
    if (afterMiss.combo !== 0) throw new Error('combo did not reset on a miss');
    // Hint with the H key, then pause and resume with P.
    await page.key('h');
    await sleep(300);
    const afterHint = await page.evaluate(gameState());
    console.log('after H:', JSON.stringify(afterHint));
    if (afterHint.hintsLeft !== 2) throw new Error('hint did not spend');
    await page.key('p');
    await sleep(200);
    const paused = await page.evaluate(gameState());
    console.log('after P:', JSON.stringify(paused));
    if (paused.screen !== 'paused') throw new Error('pause did not engage');
    await page.key('p');
    await sleep(200);
    const resumed = await page.evaluate(gameState());
    console.log('after P again:', JSON.stringify(resumed));
    if (resumed.screen !== 'play') throw new Error('resume did not engage');
    // The clock must be running.
    const t1 = (await page.evaluate(gameState())).timeLeft;
    await sleep(1500);
    const t2 = (await page.evaluate(gameState())).timeLeft;
    console.log('clock:', t1, '->', t2);
    if (t2 >= t1) throw new Error('timer is not running');
    console.log('requests:', JSON.stringify(page.requests));
    console.log('errors:', page.errors.length ? page.errors : 'none');
    const external = page.requests.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:'));
    if (page.errors.length) throw new Error('console errors: ' + page.errors.join(' | '));
    if (external.length) throw new Error('external requests: ' + external.join(', '));
    console.log('TEST PASSED');
  } finally { browser.close(); proc.kill(); }
}

async function shots() {
  const { proc, wsUrl } = await launch();
  const browser = await connect(wsUrl);
  try {
    for (const shot of SHOTS) {
      const page = await openPage(browser, `${BASE}/${shot.query}`, shot.w, shot.h);
      await waitFor(page, 'window.__shotReady === true', 60000);
      await sleep(200);
      const out = join(REPO, 'screenshots', shot.name);
      let q = 88;
      await page.screenshot(out, q);
      let size = statSync(out).size;
      while (size > 262144 && q > 30) {
        q -= 12;
        await page.screenshot(out, q);
        size = statSync(out).size;
      }
      console.log(shot.name, 'bytes:', size, 'quality:', q, 'errors:', page.errors.length ? page.errors : 'none');
      if (page.errors.length) throw new Error(`errors in ${shot.name}: ${page.errors.join(' | ')}`);
      if (size > 262144) throw new Error(`${shot.name} too big: ${size}`);
      await browser.send('Target.closeTarget', { targetId: page.targetId }).catch(() => {});
    }
    console.log('SHOTS DONE');
  } finally { browser.close(); proc.kill(); }
}

if (process.argv[2] === 'shots') await shots();
else await test();
