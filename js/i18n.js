// i18n.js — תמיכה רב-לשונית.
// עברית היא שפת הבסיס: כל הטקסט בקוד וב-HTML כתוב עברית, והמחרוזת העברית
// עצמה משמשת כמפתח התרגום. מילון לכל שפה נוספת יושב ב-i18n/<code>.js
// (window.TRANSLATIONS.<code>); מחרוזת שאין לה תרגום נשארת בעברית — וכך
// גם שפה שאין לה מילון כלל.
// השפה נקבעת מ-payload.app.language של plugin.boot (ראו app.js), ומתעדכנת
// חי באירוע settings.changed עם key-settings-language.
"use strict";
window.TRANSLATIONS = window.TRANSLATIONS || {};
window.I18N = (function () {
  let lang = 'he', dict = null;

  // מפתח קנוני: קיצוץ רווחים בקצוות וכיווץ רווחים פנימיים (טקסט HTML נשבר לשורות)
  const keyOf = s => s.replace(/\s+/g, ' ').trim();

  function t(s) {
    if (!dict || typeof s !== 'string') return s;
    const v = dict[keyOf(s)];
    return v === undefined ? s : v;
  }

  // המקורות העבריים נשמרים כדי שמעבר שפה הלוך ושוב ישחזר אותם במדויק.
  // לכל צומת נשמר גם הפלט האחרון שנכתב: אם הערך הנוכחי שונה ממנו, הקוד
  // שכתב את הצומת דינמית (HUD מתעדכן) — והמקור מוחלף בערך העדכני, כדי
  // שמעבר שפה לא ישחזר ערכים ישנים.
  const _origText = new WeakMap();     // Text node → {orig, out}
  const _origAttr = new WeakMap();     // Element → {attr: ערך מקורי}

  const ATTRS = ['aria-label', 'title', 'placeholder', 'label'];

  function translateDom(root) {
    root = root || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      let rec = _origText.get(n);
      if (!rec) {
        if (!keyOf(n.nodeValue)) continue;
        rec = { orig: n.nodeValue, out: n.nodeValue };
        _origText.set(n, rec);
      }
      if (n.nodeValue !== rec.out) rec.orig = n.nodeValue;   // נכתב דינמית מאז
      rec.out = dict ? t(rec.orig) : rec.orig;
      n.nodeValue = rec.out;
    }
    for (const el of root.querySelectorAll(ATTRS.map(a => '[' + a + ']').join(','))) {
      let saved = _origAttr.get(el);
      if (!saved) { saved = {}; _origAttr.set(el, saved); }
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        if (saved[a] === undefined) saved[a] = el.getAttribute(a);
        el.setAttribute(a, dict ? t(saved[a]) : saved[a]);
      }
    }
  }

  function setLanguage(code, textDirection) {
    lang = (code || 'he').toLowerCase().split(/[-_]/)[0];
    // מפתחות המילון מנורמלים כמו מפתח החיפוש (keyOf) — אחרת מפתח עם רווח
    // מוביל/כפול לעולם לא יימצא
    const raw = lang !== 'he' && window.TRANSLATIONS[lang] ? window.TRANSLATIONS[lang] : null;
    dict = null;
    if (raw) { dict = {}; for (const k in raw) dict[keyOf(k)] = raw[k]; }
    if (!dict) lang = 'he';
    // ה-HTML הסטטי מוכרז rtl (דרישת ולידציית העיצוב); הכיוון מוחלף בזמן ריצה.
    // גם על body — כי ה-CSS מגדיר עליו direction: rtl, שגובר על מאפיין ה-dir.
    const dir = dict ? (textDirection || 'ltr') : 'rtl';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    if (document.body) document.body.style.direction = dir;
    translateDom();
    return lang;
  }

  return {
    t, setLanguage, translateDom,
    get lang() { return lang; },
    get active() { return !!dict; },
    // ה-locale לפורמט תאריכים מקומיים (toLocaleDateString)
    get dateLocale() { return dict ? lang : 'he-IL'; },
  };
})();
