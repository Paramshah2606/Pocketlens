// Regenerates the iOS splash screens in public/splash/ from one HTML design, using
// headless Chrome. Sizes come from src/lib/splashScreens.js.
//   CHROME=/path/to/chrome-headless-shell node scripts/generate-splash.mjs
// Use chrome-headless-shell (e.g. from `npx playwright install chromium-headless-shell`):
// regular Chrome's --window-size includes window chrome, leaving a blank strip at the
// bottom of each image. Needs internet for the Google font.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appleSplashScreens } from '../src/lib/splashScreens.js';

const CHROME = process.env.CHROME || 'chrome-headless-shell';
const OUT = path.resolve('public/splash');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'splash-'));

// Lucide "wallet" — the same mark as the app icon
const WALLET = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`;

const html = (w, h) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;800&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background:
      radial-gradient(90% 55% at 50% 40%, rgba(59,130,246,.55) 0%, rgba(37,99,235,.18) 38%, rgba(37,99,235,0) 70%),
      linear-gradient(180deg, #0b1430 0%, #0a1024 55%, #060914 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff; -webkit-font-smoothing: antialiased; position: relative;
  }
  /* Concentric "lens" rings behind the mark */
  .tile-wrap { position: relative; }
  .rings { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
  .rings span { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%;
    border: 1px solid rgba(147,197,253,.10); }
  .rings span:nth-child(1) { width: ${Math.round(w * 1.16)}px; height: ${Math.round(w * 1.16)}px; border-color: rgba(147,197,253,.14); }
  .rings span:nth-child(2) { width: ${Math.round(w * 1.6)}px; height: ${Math.round(w * 1.6)}px; }
  .rings span:nth-child(3) { width: ${Math.round(w * 2.1)}px; height: ${Math.round(w * 2.1)}px; border-color: rgba(147,197,253,.06); }
  .brand { position: relative; display: flex; flex-direction: column; align-items: center; margin-top: -${Math.round(h * 0.1)}px; }
  .tile {
    width: ${Math.round(w * 0.25)}px; height: ${Math.round(w * 0.25)}px; border-radius: 28%;
    background: linear-gradient(150deg, #60a5fa 0%, #3b82f6 42%, #1d4ed8 100%);
    box-shadow: 0 0 0 1px rgba(255,255,255,.14) inset, 0 1.5px 0 rgba(255,255,255,.35) inset,
                0 24px 60px rgba(37,99,235,.55), 0 6px 18px rgba(2,6,23,.5);
    display: flex; align-items: center; justify-content: center;
  }
  .tile svg { width: 54%; height: 54%; }
  h1 { margin-top: ${Math.round(w * 0.075)}px; font-weight: 800; font-size: ${Math.round(w * 0.105)}px; letter-spacing: -0.035em; line-height: 1; }
  h1 em { font-style: normal; background: linear-gradient(90deg, #93c5fd, #60a5fa); -webkit-background-clip: text; color: transparent; }
  .tag { margin-top: ${Math.round(w * 0.04)}px; font-weight: 600; font-size: ${Math.max(11, Math.round(w * 0.03))}px;
    letter-spacing: .32em; text-transform: uppercase; color: rgba(191,219,254,.72); }
  .foot { position: absolute; bottom: ${Math.round(h * 0.06)}px; display: flex; align-items: center; gap: 10px;
    font-weight: 500; font-size: ${Math.max(11, Math.round(w * 0.031))}px; color: rgba(226,232,240,.45); letter-spacing: .02em; }
  .foot i { width: 4px; height: 4px; border-radius: 50%; background: rgba(147,197,253,.5); }
</style></head><body>
  <div class="brand">
    <div class="tile-wrap">
      <div class="rings"><span></span><span></span><span></span></div>
      <div class="tile">${WALLET}</div>
    </div>
    <h1>Pocket<em>Lens</em></h1>
    <p class="tag">Smart expense tracking</p>
  </div>
  <div class="foot">Track <i></i> Budget <i></i> Save</div>
</body></html>`;

for (const { url, media } of appleSplashScreens) {
  const [, pxW, pxH] = /splash-(\d+)x(\d+)/.exec(url);
  const dpr = Number(/pixel-ratio:\s*(\d+)/.exec(media)[1]);
  const landscape = /landscape/.test(media);
  const w = Math.round(Number(pxW) / dpr);
  const h = Math.round(Number(pxH) / dpr);
  const file = path.join(tmp, `${w}x${h}.html`);
  fs.writeFileSync(file, html(w, h));
  const out = path.join(OUT, path.basename(url));
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    `--force-device-scale-factor=${dpr}`, `--window-size=${w},${h}`,
    '--virtual-time-budget=4000', `--screenshot=${out}`, `file://${file}`,
  ], { stdio: 'ignore' });
  console.log(`${path.basename(url)}${landscape ? ' (landscape)' : ''}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
