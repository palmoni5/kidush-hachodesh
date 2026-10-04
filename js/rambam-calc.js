// rambam-calc.js — חשבון מקום השמש והירח כדרך הרמב״ם (הלכות קידוש החודש פי״ב–פט״ז).
// כרטיס בלשונית הלוח העברי. החשבון מספרי בלבד, בטבלאות הרמב״ם עצמן:
// המהלכים מן הסימנים שמסר (לעשרת אלפים, לאלף, לשנה סדורה, למאה, לכ״ט, לעשרה
// וליום אחד) — ולא מכפל מהלך יומי, שבמהלכים המעוגלים (אמצע המסלול, הראש)
// מתרחק מטבלאותיו; והמנות מטבלאותיו, באחדים שבין העשרות לפי היתר (פי״ג ה״ז).
// בנוסח כתבי היד (פי״ד ה״ה: ל׳ חלקים מתחילת תאומים עד תחילת אריה, ולא ט״ו כבדפוס).
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const H = window.HebCal;

  // כל הזוויות בשלישיות — יחידה שלמה, בלי שגיאות עיגול
  const SEC = 60, MIN = 3600, DEG = 216000, CIRCLE = 360 * DEG;
  const v = (d, m = 0, s = 0, t = 0) => d * DEG + m * MIN + s * SEC + t;
  const norm = x => ((x % CIRCLE) + CIRCLE) % CIRCLE;

  // סימני המהלכים, בסדר שבו מפרקים את מניין הימים
  const SPANS = [10000, 1000, 354, 100, 29, 10, 1];
  const MOTION = {
    // פי״ב ה״א
    sun:     { 10000: v(136, 28, 20), 1000: v(265, 38, 50), 354: v(348, 55, 15), 100: v(98, 33, 53),
               29: v(28, 35, 1), 10: v(9, 51, 23), 1: v(0, 59, 8) },
    // פי״ב ה״ב — לעשרה ימים שניה וחצי (ל׳ שלישיות), ליום אחד עשירית מזה;
    // לכ״ט יום "ארבע שניות ועוד" — כ״ט פעמים מהלך היום
    apogee:  { 10000: v(0, 25), 1000: v(0, 2, 30), 354: v(0, 0, 53), 100: v(0, 0, 15),
               29: v(0, 0, 4, 21), 10: v(0, 0, 1, 30), 1: v(0, 0, 0, 9) },
    // פי״ד ה״ב
    moon:    { 10000: v(3, 58, 20), 1000: v(216, 23, 50), 354: v(344, 26, 43), 100: v(237, 38, 23),
               29: v(22, 6, 56), 10: v(131, 45, 50), 1: v(13, 10, 35) },
    // פי״ד ה״ג–ה״ד
    anomaly: { 10000: v(329, 48, 20), 1000: v(104, 58, 50), 354: v(305, 0, 13), 100: v(226, 29, 53),
               29: v(18, 53, 4), 10: v(130, 39, 0), 1: v(13, 3, 54) },
    // פט״ז ה״ב
    node:    { 10000: v(169, 31, 40), 1000: v(52, 57, 10), 354: v(18, 44, 42), 100: v(5, 17, 43),
               29: v(1, 32, 9), 10: v(0, 31, 47), 1: v(0, 3, 11) },
  };
  // העיקר: תחילת ליל ה׳, ג׳ ניסן ד׳תתקל״ח (פי״א הט״ז)
  const EPOCH = {
    sun: v(7, 3, 32), apogee: v(86, 45, 8),       // פי״ב ה״ב
    moon: v(31, 14, 43), anomaly: v(84, 28, 42),   // פי״ד ה״ד (מזל שור א׳ י״ד מ״ג)
    node: v(180, 57, 28),                          // פט״ז ה״ב (אמצע הראש)
  };

  // טבלאות המנות בחלקים, לכל עשר מעלות
  const SUN_MANA = [0, 20, 40, 58, 75, 89, 101, 111, 117, 119, 118, 113, 105, 93, 79, 61, 42, 21, 0]; // פי״ג ה״ד
  const MOON_MANA = [0, 50, 98, 144, 186, 224, 256, 281, 300, 305, 308, 299, 280, 251, 213, 168, 116, 59, 0]; // פט״ו ה״ו
  const LAT_MANA = [0, 52, 103, 150, 193, 230, 260, 282, 295, 300];  // פט״ז הי״א

  // התיקון לשעת הראייה לפי מקום השמש (פי״ד ה״ה), בחלקים
  const SIGHT_FIX = [[15, 0], [60, 15], [120, 30], [165, 15], [195, 0], [240, -15], [300, -30], [345, -15], [360, 0]];
  // התוספת על אמצע המסלול לפי המרחק הכפול (פט״ו ה״ג): [עד מעלה, תוספת]
  const DOUBLE_ADD = [[5, 0], [11, 1], [18, 2], [24, 3], [31, 4], [38, 5], [45, 6], [51, 7], [59, 8], [63, 9]];

  const MAZAL = ['טלה', 'שור', 'תאומים', 'סרטן', 'אריה', 'בתולה', 'מאזנים', 'עקרב', 'קשת', 'גדי', 'דלי', 'דגים'];

  function motion(kind, days) {
    let n = Math.abs(days), total = 0;
    const parts = [];
    for (const s of SPANS) {
      const k = Math.floor(n / s);
      if (!k) continue;
      total += k * MOTION[kind][s];
      parts.push([k, s]);
      n -= k * s;
    }
    return { total: days < 0 ? -total : total, parts };
  }

  // מסלול בלי החלקים: פחות משלשים — אין פונים אליהם, שלשים ומעלה — מעלה שלמה (פי״ג ה״ט)
  const roundDeg = x => Math.floor((norm(x) + 30 * MIN) / DEG) % 360;
  // מנה מן הטבלה, ובאחדים — לפי היתר שבין שתי המנות; מעוגלת לחלק שלם
  function fromTable(tab, deg) {
    const i = Math.floor(deg / 10), r = deg % 10;
    const a = tab[i], b = tab[Math.min(i + 1, tab.length - 1)];
    return Math.round(a + (b - a) * r / 10) * MIN;
  }
  const sightFix = lon => SIGHT_FIX.find(([to]) => lon / DEG < to)[1] * MIN;
  // במקום השמש והירח האמיתי ובמקום הראש אין פונים אל השניות; קרוב לשלשים — חלק (פי״ג ה״י, פט״ז ה״ה)
  const toPart = x => norm(Math.round(x / MIN) * MIN);

  function compute(days) {
    const r = { days };
    const at = k => { const m = motion(k, days); return { mean: norm(EPOCH[k] + m.total), parts: m.parts }; };

    // ── השמש (פי״ב–פי״ג) ──
    const sun = at('sun'), apo = at('apogee');
    r.sunMean = sun.mean; r.apogee = apo.mean; r.spans = sun.parts;
    r.sunCourse = norm(sun.mean - apo.mean);
    r.sunCourseDeg = roundDeg(r.sunCourse);
    r.sunMana = fromTable(SUN_MANA, r.sunCourseDeg <= 180 ? r.sunCourseDeg : 360 - r.sunCourseDeg);
    r.sunSign = r.sunCourseDeg < 180 ? -1 : 1;        // פחות מק״פ — גורעין; יותר — מוסיפין
    r.sunTrue = toPart(sun.mean + r.sunSign * r.sunMana);

    // ── הירח (פי״ד–פט״ו) ──
    const moon = at('moon'), anom = at('anomaly');
    r.moonNight = moon.mean;
    r.fix = sightFix(r.sunTrue);
    r.fixByMean = sightFix(r.sunMean);
    r.moonSight = norm(moon.mean + r.fix);
    r.anomaly = anom.mean;
    r.double = norm(2 * norm(r.moonSight - r.sunMean));
    r.doubleDeg = roundDeg(r.double);
    const add = r.doubleDeg >= 5 ? DOUBLE_ADD.find(([to]) => r.doubleDeg <= to) : null;
    r.inRange = !!add;

    // ── הראש (פט״ז ה״ב–ה״ג) ──
    r.nodeMean = at('node').mean;
    r.head = toPart(-r.nodeMean);
    r.tail = norm(r.head + 180 * DEG);

    if (r.inRange) {
      r.add = add[1] * DEG;
      r.course = norm(r.anomaly + r.add);
      r.courseDeg = roundDeg(r.course);
      r.moonMana = fromTable(MOON_MANA, r.courseDeg <= 180 ? r.courseDeg : 360 - r.courseDeg);
      r.moonSign = r.courseDeg < 180 ? -1 : 1;
      r.moonTrue = toPart(r.moonSight + r.moonSign * r.moonMana);

      // ── הרוחב (פט״ז ה״י–הי״ח) ──
      r.latCourse = norm(r.moonTrue - r.head);
      const k = r.latCourseDeg = roundDeg(r.latCourse);
      const red = k <= 90 ? k : k <= 180 ? 180 - k : k <= 270 ? k - 180 : 360 - k;
      r.lat = fromTable(LAT_MANA, red);
      r.latDir = k === 0 || k === 180 ? 0 : k < 180 ? 1 : -1;
    }
    return r;
  }

  // ── תצוגה ──
  function dms(x, secs = true) {
    const neg = x < 0; x = Math.round(Math.abs(x) / SEC) * SEC;   // לשניות שלמות
    const d = Math.floor(x / DEG), m = Math.floor((x % DEG) / MIN), s = Math.round((x % MIN) / SEC);
    const out = secs ? `${d}° ${m}′ ${s}″` : !d ? `${m}′` : m ? `${d}° ${m}′` : `${d}°`;
    return ltr((neg ? '−' : '') + out);
  }
  // מעלות-חלקים-שניות נכתבים משמאל לימין גם בממשק עברי — אחרת האלגוריתם הדו-כיווני מהפך את סדרם
  function ltr(str) { return `<span class="rc-ltr" dir="ltr">${str}</span>`; }
  const plain = h => h.replace(/<[^>]+>/g, '');
  const signed = (x, sign) => ltr((sign < 0 ? '− ' : '+ ') + plain(dms(x, false)));
  const arrow = deg => `<i>${T('←')} ${ltr(deg + '°')}</i>`;
  function inMazal(x, secs = true) {
    x = Math.round(norm(x) / SEC) * SEC;
    const i = Math.floor(x / (30 * DEG)) % 12, d = x - i * 30 * DEG;
    return `${secs ? dms(d) : ltr(plain(dms(d, false)).replace(/^(\d+′)$/, '0° $1'))} ${T('במזל')} ${T(MAZAL[i])}`;
  }
  const lon = (x, secs = true) => `${dms(x, secs)}<i> — ${inMazal(x, secs)}</i>`;

  // דוגמת הרמב״ם: ליל ב׳ אייר ד׳תתקל״ח (שנה מעוברת — ולכן החודשים לפי שמם ולא לפי מקומם)
  const monthIdx = (y, name) => H.yearTable(y).months.findIndex(m => m.name === name);
  const state = { hy: 4938, mi: 0, day: 2 };
  let bound = false, epochAbs = null;

  function render() {
    const box = $('l_ramBox');
    if (!box || !bound) return;
    const months = H.yearTable(state.hy).months;
    state.mi = Math.min(state.mi, months.length - 1);
    const mSel = $('rc_month');
    mSel.innerHTML = months.map((m, k) => `<option value="${k}">${T(m.name)}</option>`).join('');
    mSel.value = String(state.mi);
    const mLen = months[state.mi].len;
    state.day = Math.min(state.day, mLen);
    const dSel = $('rc_day');
    dSel.innerHTML = Array.from({ length: mLen }, (_, k) =>
      `<option value="${k + 1}">${H.hebNum(k + 1)}</option>`).join('');
    dSel.value = String(state.day);
    $('rc_year').value = state.hy;

    const days = months[state.mi].startAbs + state.day - 1 - epochAbs;
    const r = compute(days);

    const sec = title => `<div class="rc-sec">${T(title)}</div>`;
    const row = (label, src, val) =>
      `<div class="lm-row"><span>${T(label)}${src ? ` <i>${T(src)}</i>` : ''}</span><b>${val}</b></div>`;
    let h = '';
    h += row('ימים גמורים מן העיקר', 'פי״א הט״ז', ltr(String(days)));
    h += `<div class="rc-spans">${r.spans.length
      ? r.spans.map(([k, s]) => `${k}×${s}`).join(' + ') + (days < 0 ? ` <i>${T('(לפני העיקר — גורעין)')}</i>` : '')
      : '0'}</div>`;

    h += sec('השמש — פי״ב–פי״ג');
    h += row('אמצע השמש', '', lon(r.sunMean));
    h += row('גובה השמש', '', lon(r.apogee));
    h += row('מסלול השמש', '', `${dms(r.sunCourse)} ${arrow(r.sunCourseDeg)}`);
    h += row('מנת המסלול', '', r.sunMana ? signed(r.sunMana, r.sunSign) : T('אין לו מנה'));
    h += row('מקום השמש האמיתי', '', lon(r.sunTrue, false));

    h += sec('הירח — פי״ד–פט״ו');
    h += row('אמצע הירח בתחילת הלילה', '', lon(r.moonNight));
    h += row('לשעת הראייה', 'פי״ד ה״ה', r.fix ? signed(Math.abs(r.fix), Math.sign(r.fix)) : T('כמות שהוא'));
    if (r.fixByMean !== r.fix) {
      const f = r.fixByMean;
      h += `<div class="rc-note">${T('סמוך לגבול: התיקון נקבע כאן לפי מקום השמש האמיתי; לפי מקומה האמצעי היה')} ${f ? signed(Math.abs(f), Math.sign(f)) : ltr('0′')}.</div>`;
    }
    h += row('אמצע הירח לשעת הראייה', '', lon(r.moonSight));
    h += row('אמצע המסלול', '', dms(r.anomaly));
    h += row('המרחק הכפול', 'פט״ו ה״א', `${dms(r.double)} ${arrow(r.doubleDeg)}`);
    if (!r.inRange) {
      h += `<div class="rc-note rc-stop">${T('בליל הראייה המרחק הכפול הוא לעולם בין ה׳ לס״ב מעלות (פט״ו ה״ב), והתוספת על אמצע המסלול אינה מבוארת אלא בתחום זה — וזה הלילה אינו ליל ראייה. לכן אין כאן מקום הירח האמיתי ורוחבו; בחרו לילה סמוך לתחילת החודש.')}</div>`;
    } else {
      h += row('תוספת על אמצע המסלול', 'פט״ו ה״ג', r.add ? signed(r.add, 1) : T('אין מוסיפין'));
      h += row('המסלול הנכון', '', `${dms(r.course)} ${arrow(r.courseDeg)}`);
      h += row('מנת המסלול', 'פט״ו ה״ו', r.moonMana ? signed(r.moonMana, r.moonSign) : T('אין לו מנה'));
      h += row('מקום הירח האמיתי לשעת הראייה', '', lon(r.moonTrue, false));
    }

    h += sec('הרוחב — פט״ז');
    h += row('מקום הראש', '', lon(r.head, false));
    h += row('מקום הזנב', '', `<i>${inMazal(r.tail, false)}</i>`);
    if (r.inRange) {
      h += row('מסלול הרוחב', '', `${dms(r.latCourse, false)} ${arrow(r.latCourseDeg)}`);
      h += row('רוחב הירח', '', r.latDir ? `${dms(r.lat, false)} ${T(r.latDir > 0 ? 'צפוני' : 'דרומי')}` : T('אין לירח רוחב'));
    }
    $('rc_out').innerHTML = h;
  }

  function init() {
    if (bound || !$('l_ramBox')) return;
    bound = true;
    epochAbs = H.yearTable(4938).months[monthIdx(4938, 'ניסן')].startAbs + 2;   // ג׳ ניסן ד׳תתקל״ח
    state.mi = monthIdx(4938, 'אייר');
    $('rc_year').onchange = e => {
      state.hy = Math.max(1, Math.min(9999, +e.target.value || state.hy));
      render();
    };
    $('rc_month').onchange = e => { state.mi = +e.target.value; render(); };
    $('rc_day').onchange = e => { state.day = +e.target.value; render(); };
    $('rc_example').onclick = () => { state.hy = 4938; state.mi = monthIdx(4938, 'אייר'); state.day = 2; render(); };
    render();
  }

  window.RambamCalc = { compute, init, render };
})();
