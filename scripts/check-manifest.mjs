// בדיקת manifest.json מול מגבלות הוולידטור של אוצריא, מקומית ולפני הקומיט.
// הוולידטור ב-CI (Otzaria/otzaria-plugin-validator) הוא גם שלב הפרסום לחנות:
// כשהוא נכשל הגרסה אינה מתפרסמת. הבדיקות כאן הן אלה שהפילו אותנו בפועל.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };

let m;
try {
  m = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
} catch (e) {
  console.error('✗ manifest.json אינו JSON תקין:', e.message);
  process.exit(1);
}

check(typeof m.description === 'string' && m.description.length <= 150,
  `תיאור קצר חייב להכיל לכל היותר 150 תווים (כרגע ${m.description ? m.description.length : 0})`);
check(/^\d+\.\d+\.\d+$/.test(m.version || ''),
  `version חייב להיות בתבנית x.y.z (כרגע ${JSON.stringify(m.version)})`);
for (const f of ['id', 'name', 'entrypoint', 'icon', 'author'])
  check(m[f], `שדה חובה חסר במניפסט: ${f}`);

// קבצים שהמניפסט מפנה אליהם חייבים להתקיים בעץ
for (const f of ['entrypoint', 'icon']) {
  if (!m[f]) continue;
  try { readFileSync(join(root, m[f])); }
  catch { errors.push(`הקובץ המוזכר ב-${f} אינו קיים: ${m[f]}`); }
}

// כל <script src> ב-index.html חייב להתקיים — קובץ חסר שובר את התוסף בלי
// שהוולידטור יתפוס זאת, וזו טעות קלה בהוספת לשונית חדשה
try {
  const html = readFileSync(join(root, m.entrypoint || 'index.html'), 'utf8');
  for (const src of [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x => x[1])) {
    if (/^https?:/.test(src)) continue;
    try { readFileSync(join(root, src)); }
    catch { errors.push(`script src חסר: ${src}`); }
  }
} catch { /* entrypoint כבר דווח למעלה */ }

if (errors.length) {
  console.error('✗ בדיקת המניפסט נכשלה:');
  for (const e of errors) console.error('  · ' + e);
  process.exit(1);
}
console.log(`✓ המניפסט תקין (גרסה ${m.version}, תיאור ${m.description.length}/150 תווים)`);
