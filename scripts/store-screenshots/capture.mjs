// מתחבר ב-CDP ל-WebView2 של התוסף בתוך אוצריא, עובר על כל הטאבים שבפס
// העליון לפי סדרם, ומצלם את חלון אוצריא כולו בכל אחד מהם.
//   node capture.mjs <out-dir> <webview2-user-data-dir>
// הפורט: run.ps1 מפעיל את WebView2 עם --remote-debugging-port=0, והדפדפן
// בוחר פורט פנוי וכותב אותו לשורה הראשונה של DevToolsActivePort בתיקיית
// נתוני המשתמש שלו.
// יציאה בקוד 3 כשדף התוסף לא נמצא — הקורא שולח שוב את קישור הפתיחה ומנסה שוב.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

const outDir = process.argv[2];
const userDataDir = process.argv[3];
const here = dirname(fileURLToPath(import.meta.url));
const MAX_STORE_SHOTS = 10;   // מגבלת החנות (MAX_SCREENSHOTS בוולידטור)
const sleep = ms => new Promise(r => setTimeout(r, ms));

function devToolsPort() {
  try {
    const f = readdirSync(userDataDir, { recursive: true }).find(x => basename(x) === 'DevToolsActivePort');
    return f ? readFileSync(join(userDataDir, f), 'utf8').split(/\r?\n/)[0].trim() : null;
  } catch { return null; }
}

let lastError = '';
async function targets() {
  const port = devToolsPort();
  if (!port) { lastError = `אין DevToolsActivePort תחת ${userDataDir}`; return []; }
  try { return await (await fetch(`http://127.0.0.1:${port}/json`)).json(); }
  catch (e) { lastError = `פורט ${port}: ${e.cause?.message || e.message}`; return []; }
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
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve({ evaluate, close: () => ws.close() });
    ws.onerror = reject;
  });
}

// דף התוסף: יעד file:// שיש בו פס הטאבים של התוסף. מחכים עד דקה —
// הפתיחה בקישור עוברת דרך תור ההפעלות של המופע הרץ.
async function findPlugin() {
  for (let t0 = Date.now(); Date.now() - t0 < 60000; await sleep(2000)) {
    for (const t of await targets()) {
      if (t.type !== 'page' || !t.url.startsWith('file:') || !t.webSocketDebuggerUrl) continue;
      try {
        const page = await connect(t.webSocketDebuggerUrl);
        if (await page.evaluate(`!!document.querySelector('#tabs button[data-view]')`)) {
          console.log(`✓ דף התוסף: ${decodeURI(t.url)}`);
          return page;
        }
        page.close();
      } catch { /* יעד שנסגר בינתיים */ }
    }
  }
  return null;
}

const page = await findPlugin();
if (!page) {
  const list = await targets();
  console.error('✗ דף התוסף לא נמצא ב-CDP.', list.length ? `יעדים: ${JSON.stringify(list, null, 1)}` : lastError);
  process.exit(3);
}

await page.evaluate(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
await page.evaluate('document.fonts.ready.then(() => true)');
await sleep(3000);

let views = await page.evaluate(`[...document.querySelectorAll('#tabs button[data-view]')].map(b => b.dataset.view)`);
if (views.length > MAX_STORE_SHOTS) {
  console.warn(`⚠ ${views.length} טאבים — החנות מקבלת עד ${MAX_STORE_SHOTS}; מצלם את הראשונים`);
  views = views.slice(0, MAX_STORE_SHOTS);
}

for (const [i, view] of views.entries()) {
  await page.evaluate(`document.querySelector('#tabs button[data-view="${view}"]').click()`);
  // ציור הקנבס, אנימציות הכניסה וטעינת נתונים אסינכרונית (storage)
  await sleep(3500);
  const file = join(outDir, `${String(i + 1).padStart(2, '0')}-${view}.png`);
  execFileSync('pwsh', ['-NoProfile', '-File', join(here, 'capture-window.ps1'), '-Out', file], { stdio: 'inherit' });
}
// הטאב הראשון בחזרה, שהמצב השמור (lastView) לא יישאר על האחרון
await page.evaluate(`document.querySelector('#tabs button[data-view]').click()`);
page.close();
console.log(`✓ ${views.length} צילומים ב-${outDir}`);
