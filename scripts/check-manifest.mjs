// בדיקת manifest.json מול מגבלות הוולידטור של אוצריא, מקומית ולפני הקומיט.
// הוולידטור ב-CI (Otzaria/otzaria-plugin-validator) הוא גם שלב הפרסום לחנות:
// כשהוא נכשל הגרסה אינה מתפרסמת.
//
// זו בדיקה מהירה ובלי רשת, ואינה תחליף לוולידטור המלא. הוא נותן גם הרצה
// מקומית, והיא הבדיקה המחייבת לפני שחרור:
//   git clone --depth 1 https://github.com/Otzaria/otzaria-plugin-validator
//   node otzaria-plugin-validator/src/cli.js . --publish false
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

// הכללים כאן הועתקו מ-src/manifestValidator.js של הוולידטור הרשמי, כולל
// ה-trim ותבנית ה-SemVer, כדי שהתוצאה תהיה זהה לזו של ה-CI.
const desc = (m.description || '').trim(), name = (m.name || '').trim();
check(desc.length <= 150, `תיאור קצר חייב להכיל לכל היותר 150 תווים (כרגע ${desc.length})`);
check(name.length <= 14, `שם התוסף חייב להכיל לכל היותר 14 תווים (כרגע ${name.length})`);
check(/^\d+\.\d+\.\d+(?:\+.*)?$/.test(m.version || ''),
  `version חייב להיות בתבנית SemVer (כרגע ${JSON.stringify(m.version)})`);
for (const f of ['id', 'name', 'entrypoint', 'icon', 'author'])
  check(m[f], `שדה חובה חסר במניפסט: ${f}`);

// כותרת הטאב חייבת להיות זהה ל-name; כותרת חסרה נופלת ל-name ולכן עוברת
const tabTitle = m.contributes && m.contributes.toolTab
  ? (m.contributes.toolTab.title ?? m.name) : null;
if (tabTitle !== null)
  check((tabTitle || '').trim() === name,
    `שם התוסף ("${m.name}") שונה מכותרת הטאב ב-contributes.toolTab.title ("${tabTitle}") — חייבים להיות זהים`);

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
