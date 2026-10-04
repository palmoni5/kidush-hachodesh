// צילומי מסך לחנות: מריץ את התוסף ב-Edge ללא ממשק (אותו מנוע כמו WebView2
// של אוצריא ב-Windows), עם מטען האתחול שאוצריא שולחת לתוסף בהגדרות ברירת
// המחדל, עובר על כל הטאבים שבפס העליון לפי סדרם ומצלם כל אחד.
//   node scripts/store-screenshots/capture.mjs [out-dir=screenshots]
// בלי תלויות: Edge מופעל ישירות ומדובר איתו ב-CDP. נתיב דפדפן אחר
// (Chrome/Chromium) — במשתנה הסביבה BROWSER.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = resolve(process.argv[2] || join(root, 'screenshots'));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const WIDTH = 1600, HEIGHT = 900;
const MAX_STORE_SHOTS = 10;   // מגבלת החנות (MAX_SCREENSHOTS בוולידטור)
const sleep = ms => new Promise(r => setTimeout(r, ms));

// מטען plugin.boot כפי שאוצריא 0.9.97 שולחת אותו בהתקנה חדשה: ערכה בהירה
// (ערכי colorScheme נקראו מהתוסף כשרץ באוצריא), עברית, RTL. כשאוצריא משנה את
// ערכת ברירת המחדל — לעדכן כאן.
const boot = {
  plugin: { id: manifest.id, version: manifest.version },
  app: { version: '0.9.97', platform: 'windows', locale: 'he-IL', textDirection: 'rtl', runMode: 'foreground' },
  theme: {
    mode: 'light',
    colorScheme: {
      primary: '#805610', onPrimary: '#ffffff', secondary: '#6f5b40', onSecondary: '#ffffff',
      secondaryContainer: '#fbdebc', onSecondaryContainer: '#56442a',
      surface: '#fff8f4', onSurface: '#201b13',
      surfaceContainerHigh: '#f3e6da', surfaceContainerHighest: '#ede0d4',
      error: '#ba1a1a', onError: '#ffffff', outline: '#817567',
    },
    typography: { lineHeight: 1.5 },
  },
  permissions: [...new Set([
    'app.info.read', 'ui.feedback', 'plugin.storage.read', 'plugin.storage.write',
    ...(manifest.permissions || []),
  ])],
};

// SDK מדומה שנטען לפני סקריפטי התוסף, כך שה-stub שב-theme.js אינו נכנס לפעולה.
// כמו ב-stub: storage ושאר הקריאות מחזירים null, והתוסף נופל לברירות המחדל
// שלו — כמו בהתקנה חדשה.
const shim = `(() => {
  const boot = ${JSON.stringify(boot)};
  const listeners = {};
  let booted = false;
  window.Otzaria = {
    call: async () => ({ success: true, data: null, error: null }),
    on: (e, cb) => {
      (listeners[e] = listeners[e] || []).push(cb);
      if (e === 'plugin.boot' && booted) setTimeout(() => cb(boot), 0);
    },
    off: (e, cb) => { listeners[e] = (listeners[e] || []).filter(f => f !== cb); },
  };
  addEventListener('DOMContentLoaded', () => setTimeout(() => {
    booted = true;
    (listeners['plugin.boot'] || []).forEach(cb => cb(boot));
  }, 0));
})();`;

function findBrowser() {
  const candidates = [
    process.env.BROWSER,
    join(process.env['ProgramFiles(x86)'] || '', 'Microsoft/Edge/Application/msedge.exe'),
    join(process.env.ProgramFiles || '', 'Microsoft/Edge/Application/msedge.exe'),
  ].filter(Boolean);
  const found = candidates.find(p => existsSync(p));
  if (!found) throw new Error(`דפדפן לא נמצא (נבדקו: ${candidates.join(', ')}) — הגדירו BROWSER`);
  return found;
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ send, evaluate, close: () => ws.close() });
    ws.onerror = reject;
  });
}

const profile = mkdtempSync(join(tmpdir(), 'kh-shots-'));
const browser = spawn(findBrowser(), [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--lang=he-IL', '--force-device-scale-factor=1', `--window-size=${WIDTH},${HEIGHT}`,
  '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });

try {
  // הדפדפן בוחר פורט פנוי ורושם אותו ב-DevToolsActivePort
  const portFile = join(profile, 'DevToolsActivePort');
  for (let t = 0; !existsSync(portFile); t += 200) {
    if (t > 30000) throw new Error('הדפדפן לא פתח פורט CDP');
    await sleep(200);
  }
  await sleep(200);
  const port = readFileSync(portFile, 'utf8').split(/\r?\n/)[0].trim();
  const target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page');
  const page = await connect(target.webSocketDebuggerUrl);

  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: shim });
  await page.send('Page.navigate', { url: pathToFileURL(join(root, manifest.entrypoint)).href });

  await page.evaluate(`new Promise(r => {
    const ok = () => document.readyState === 'complete' && document.querySelector('#tabs button[data-view]');
    const t = setInterval(() => { if (ok()) { clearInterval(t); r(); } }, 100);
  })`);
  await page.evaluate('document.fonts.ready.then(() => true)');
  // ה-SDK המדומה אכן נטען (ולא ה-stub הכהה של theme.js)
  const primary = await page.evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()`);
  if (primary !== boot.theme.colorScheme.primary) throw new Error(`ערכת הנושא לא הוחלה (--color-primary=${primary})`);
  await sleep(2000);

  let views = await page.evaluate(`[...document.querySelectorAll('#tabs button[data-view]')].map(b => b.dataset.view)`);
  if (views.length > MAX_STORE_SHOTS) {
    console.warn(`⚠ ${views.length} טאבים — החנות מקבלת עד ${MAX_STORE_SHOTS}; מצלם את הראשונים`);
    views = views.slice(0, MAX_STORE_SHOTS);
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const [i, view] of views.entries()) {
    await page.evaluate(`document.querySelector('#tabs button[data-view="${view}"]').click()`);
    // ציור הקנבס, אנימציות הכניסה וטעינה אסינכרונית
    await sleep(3000);
    const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
    const file = join(outDir, `${String(i + 1).padStart(2, '0')}-${view}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`✓ ${file}`);
  }
  page.close();
  console.log(`✓ ${views.length} צילומים (${WIDTH}×${HEIGHT}) ב-${outDir}`);
} finally {
  browser.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* קבצים נעולים בסגירה */ }
}
