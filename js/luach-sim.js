// luach-sim.js — לשונית הלוח העברי: מולד, דחיות, וקביעת השנה כולה.
// החשבון עצמו יושב ב-js/hebrew-calendar.js; כאן רק התצוגה.
//
// שני מצבים:
//   שנה אמיתית — כל הנתונים נגזרים ממחזור י״ט השנים ומהמולד שלה.
//   שנת מעבדה  — המשתמש קובע בעצמו את מולד תשרי ואת סטטוס העיבור, כדי לראות
//                כיצד כל דחיה פועלת. צירופים שאינם קיימים בלוח האמיתי (שתי
//                שנים מעוברות רצופות; אורך שנה שאינו חוקי) מסומנים במפורש,
//                כדי שלא ייקראו כתוצאה אמיתית.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const H = window.HebCal;

  const DECHIYA_NAME = {
    zaken: 'מולד זקן',
    adu: 'לא אד״ו ראש',
    'zaken+adu': 'מולד זקן ולא אד״ו ראש',
    gatarad: 'ג״ט ר״ד',
    'betutakpat+adu': 'ב־ט״ו־תקפ״ט',
    betutakpat: 'ב־ט״ו־תקפ״ט',
  };
  const DECHIYA_ROW = {                       // הדגשת הכלל המתאים בכרטיס ההסבר
    zaken: 'l_r1', adu: 'l_r4', 'zaken+adu': 'l_r1',
    gatarad: 'l_r2', betutakpat: 'l_r3', 'betutakpat+adu': 'l_r3',
  };

  // שעות הלוח נמנות מתחילת הלילה (שש בערב); כאן גם שעון היממה המקביל,
  // שהוא ההבדל שמטעה כמעט תמיד — "מולד זקן" בשעה 18 הוא חצות היום.
  function clockOf(h, p) {
    const total = (18 + h) * 60 + p / 18;
    const hh = Math.floor(total / 60) % 24, mm = Math.floor(total % 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }
  // שמות הימים המלאים נפרדים מן הקצרים כדי שהתרגום יהיה "Sunday" ולא "Day Sun"
  const DOW_FULL = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
  const moladShort = m => `${T(H.DOW[m.dow])} ${m.h}·${m.p}`;
  const moladFull = m =>
    `${T(DOW_FULL[m.dow])}, ${m.h} ${T('שעות')} ${m.p} ${T('חלקים')} (${clockOf(m.h, m.p)})`;

  const gregShort = abs => {
    const d = H.absToDate(abs);
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1);
  };
  const gregFull = abs => {
    const d = H.absToDate(abs);
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
  };
  const rcText = rc => rc.days.map(a => T(H.DOW[(a + 1) % 7])).join('–');
  const fullWord = m => m.full ? 'חודש מלא' : 'חודש חסר';

  // ── בניית הטבלה בשתי אוריינטציות ────────────────────────────────────
  // 13 עמודות אינן נכנסות במסך טלפון, ולכן נבנות שתי טבלאות מאותם נתונים
  // וה-CSS בוחר ביניהן. הכפילות זניחה (13 חודשים) ומייתרת חישובי פריסה.
  function renderTable(t) {
    const ms = t.months;
    const th = s => `<th>${T(s)}</th>`;
    const cell = (v, title) => `<td${title ? ` title="${title}"` : ''}>${v}</td>`;

    const cols =
      '<table class="luach-cols"><thead><tr><th class="corner"></th>' +
      ms.map(m => `<th>${T(m.name)}</th>`).join('') + '</tr></thead><tbody>' +
      `<tr>${th('זמן המולד')}${ms.map(m => cell(moladShort(m.molad), moladFull(m.molad))).join('')}</tr>` +
      `<tr>${th('מלא / חסר')}${ms.map(m => cell(m.len, T(fullWord(m)))).join('')}</tr>` +
      `<tr>${th('ר״ח ביום בשבוע')}${ms.map(m => cell(rcText(m.rc))).join('')}</tr>` +
      `<tr>${th('א׳ בחודש — לועזי')}${ms.map(m => cell(gregShort(m.startAbs), gregFull(m.startAbs))).join('')}</tr>` +
      '</tbody></table>';

    const rows =
      '<table class="luach-rows"><thead><tr>' +
      ['חודש', 'זמן המולד', 'ימים', 'ר״ח', 'לועזי'].map(th).join('') +
      '</tr></thead><tbody>' +
      ms.map(m => '<tr>' +
        `<td class="mname">${T(m.name)}</td>` +
        cell(moladShort(m.molad), moladFull(m.molad)) +
        cell(`${m.len} <i>${T(fullWord(m))}</i>`) +
        cell(rcText(m.rc)) +
        cell(gregFull(m.startAbs)) + '</tr>').join('') +
      '</tbody></table>';

    $('l_table').innerHTML = cols + rows;
  }

  // ── חלונית חישוב המולדות ────────────────────────────────────────────
  // המולד הממוצע — בהר״ד ועוד כ״ט י״ב תשצ״ג לכל חודש שעבר; המולד האמיתי —
  // רגע הקיבוץ האסטרונומי (Astro.newMoonNear), מוצג בשעון ישראל.
  // הגשר בין שני החשבונות הוא רגע לועזי אחד: יום המולד ממופה לתאריך דרך
  // עוגן הלוח, ושעות הלוח — הנמנות משש בערב — נקראות כזמן ירושלים האמצעי
  // (UTC+2:21), כדרך שנוקטים בחשבון המולדות.
  const BEHERAD = H.moladTishrei(1);          // מולד תוהו — נקודת האפס של המניין
  const JLM_MS = (2 * 60 + 21) * 60000;       // זמן ירושלים האמצעי

  // רגע המולד הממוצע: local — "שעון קיר" ירושלמי לקריאה ב-getUTC*; utc — אמיתי
  function moladInstant(m) {
    const local = H.absToDate(m.abs).getTime() - 6 * 3600000 +
      (m.h * 3600 + m.p * 10 / 3) * 1000;     // חלק = 10/3 שניות
    return { local, utc: local - JLM_MS };
  }

  // תאריך לועזי מ-Date שנקרא ב-getUTC*. שנים אסטרונומיות 0 ומטה הן לפנה״ס.
  function fmtDMY(d) {
    const y = d.getUTCFullYear();
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' +
      (y <= 0 ? (1 - y) + ' ' + T('לפנה״ס') : y);
  }

  // תאריך ושעה בשעון ישראל (Asia/Jerusalem — כולל שעון קיץ בשנים שנהג,
  // וזמן ירושלים המקומי בשנים שקדמו לשעון אזורים). fallback: UTC+2 קבוע.
  function fmtIsrael(date, sec) {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jerusalem', era: 'short', weekday: 'short',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      }).formatToParts(date);
      const g = t => { const p = parts.find(x => x.type === t); return p ? p.value : ''; };
      const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[g('weekday')];
      const era = /^b/i.test(g('era')) ? ' ' + T('לפנה״ס') : '';
      // התאריך והשעה עטופים ב-ltr — בלי זה סדר שני רצפי הספרות מתהפך ב-RTL
      return `${T(DOW_FULL[wd] || '')}, <span dir="ltr">${+g('day')}.${+g('month')}.${+g('year')}</span>${era} ` +
        `${g('hour')}:${g('minute')}${sec ? ':' + g('second') : ''}`;
    } catch (_) {
      const d = new Date(date.getTime() + 2 * 3600000);
      const pad = n => String(n).padStart(2, '0');
      return `${T(DOW_FULL[d.getUTCDay()])}, <span dir="ltr">${fmtDMY(d)}</span> ` +
        `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}${sec ? ':' + pad(d.getUTCSeconds()) : ''}`;
    }
  }

  function renderMolad(t) {
    const box = $('l_moladBox');
    if (!box || !t.year) return;                // בשנת מעבדה הכרטיס מוסתר
    if (sim.moladIdx == null) sim.moladIdx = 0;

    // רשימת החודשים תלויה בעיבור; הבחירה נשמרת לפי שם (אדר ↔ אדר א׳/ב׳ בקירוב)
    const sel = $('lm_month');
    let i = t.months.findIndex(x => x.name === sim._moladName);
    if (i < 0 && sim._moladName && sim._moladName.startsWith('אדר'))
      i = t.months.findIndex(x => x.name.startsWith('אדר'));
    if (i < 0) i = Math.min(sim.moladIdx, t.months.length - 1);
    sim.moladIdx = i; sim._moladName = t.months[i].name;
    sel.innerHTML = t.months.map((m, k) => `<option value="${k}">${T(m.name)}</option>`).join('');
    sel.value = String(i);

    const m = t.months[i].molad;
    // מניין החודשים: המרחק מבהר״ד בחלקים, מחולק באורך הלבנה — שלם בהגדרה
    $('lm_count').textContent = Math.round((m.abs * H.P_DAY + m.t - BEHERAD) / H.LUNATION);

    const inst = moladInstant(m);
    $('lm_mean').innerHTML = `${moladFull(m)}<br>${fmtDMY(new Date(inst.local))}`;

    const nm = window.Astro && window.Astro.newMoonNear
      ? window.Astro.newMoonNear(new Date(inst.utc)) : null;
    if (nm) {
      $('lm_true').innerHTML = `${fmtIsrael(nm)}<br><i>(${T('שעון ישראל')})</i>`;
      const diff = nm.getTime() - inst.utc;
      const tot = Math.round(Math.abs(diff) / 60000);
      $('lm_diff').textContent =
        T(diff < 0 ? 'האמיתי קדם לממוצע ב-{h} שעות ו-{m} דקות'
                   : 'האמיתי מאוחר מן הממוצע ב-{h} שעות ו-{m} דקות')
          .replace('{h}', Math.floor(tot / 60)).replace('{m}', tot % 60);
    } else {
      $('lm_true').textContent = '—';
      $('lm_diff').textContent = '';
    }
    // מחוץ לטווח 1600–2200 הדיוק האסטרונומי פוחת (אי-ודאות ΔT) — מוצגת הערה
    const gy = new Date(inst.utc).getUTCFullYear();
    $('lm_note').style.display = (gy < 1600 || gy > 2200) ? '' : 'none';
  }

  // ── ממיר שעה יממתית ⇄ שעה אזרחית ────────────────────────────────────
  // ארבע דרכים למניין שעות היממה (ההסבר בכרטיס):
  //   tosZ  — משקיעה לשקיעה בשעות זמניות (שיטה א׳ בתוס׳ עירובין נ״ו ע״א);
  //   tosE  — משקיעה לשקיעה בשעות שוות (שיטה ב׳ שם);
  //   grimt — הלבוש כפירוש הגרי״מ טיקוצינסקי: שש שעות אחר החצות האמיתי;
  //   merz  — הלבוש כפירוש הגר״י מרצבך: שש שעות אחר החצות הממוצע — תחילת
  //           היממה קבועה ב-18:00 זמן ירושלים האמצעי (17:39 שעון החורף),
  //           היא המוסכמה שחלונית חישוב המולדות נוקטת בה.
  const HOUR_MS = 3600000, DAY_MS = 86400000, PART_MS = 10000 / 3;
  // חצות ליל היום abs, בציר הזמן המקומי-האמצעי (getUTC* קורא אותו כשעון קיר)
  const EPOCH0 = H.absToDate(0).getTime();
  const localMidnight = abs => EPOCH0 + abs * DAY_MS;

  // זריחה, שקיעה וחצות אמיתי (מעבר המרידיאן) בירושלים ליום האזרחי abs — UTC ms
  const _sunCache = new Map();
  function sunEvents(abs) {
    if (_sunCache.has(abs)) return _sunCache.get(abs);
    let out = null;
    try {
      const AE = window.Astronomy, obs = new AE.Observer(31.78, 35.24, 0);
      const t0 = AE.MakeTime(new Date(localMidnight(abs) - JLM_MS));
      const rise = AE.SearchRiseSet(AE.Body.Sun, obs, +1, t0, 1.2);
      const set = AE.SearchRiseSet(AE.Body.Sun, obs, -1, t0, 1.2);
      const noon = AE.SearchHourAngle(AE.Body.Sun, obs, 0, t0);
      if (rise && set && noon)
        out = { rise: rise.date.getTime(), set: set.date.getTime(), noon: noon.time.date.getTime() };
    } catch (_) {}
    if (_sunCache.size > 400) _sunCache.clear();
    _sunCache.set(abs, out);
    return out;
  }

  // תחילת היממה של היום העברי שמספרו abs, לפי כל שיטה — UTC ms
  const startMerz = abs => localMidnight(abs) - 6 * HOUR_MS - JLM_MS;
  const startGrimt = abs => { const e = sunEvents(abs - 1); return e ? e.noon + 6 * HOUR_MS : null; };
  const startTos = abs => { const e = sunEvents(abs - 1); return e ? e.set : null; };

  // קריאה יממתית {abs,h,p} → רגע UTC. בשעות זמניות (tosZ) שעות 0–11 הן
  // י״ב חלקי הלילה ו-12–23 י״ב חלקי היום, והחלק — 1/1080 של שעה זמנית.
  function yemToUtc(shita, abs, h, p) {
    const off = h * HOUR_MS + p * PART_MS;
    if (shita === 'merz') return startMerz(abs) + off;
    if (shita === 'grimt') { const s = startGrimt(abs); return s == null ? null : s + off; }
    if (shita === 'tosE') { const s = startTos(abs); return s == null ? null : s + off; }
    const e0 = sunEvents(abs - 1), e1 = sunEvents(abs);
    if (!e0 || !e1) return null;
    const f = h + p / 1080;
    return f < 12
      ? e0.set + f * (e1.rise - e0.set) / 12
      : e1.rise + (f - 12) * (e1.set - e1.rise) / 12;
  }

  // רגע UTC → קריאה יממתית לפי שיטה. החלקים מעוגלים לחלק הקרוב.
  function utcToYem(shita, utc) {
    if (shita === 'merz') {
      const x = utc + JLM_MS + 6 * HOUR_MS - EPOCH0;
      const abs = Math.floor(x / DAY_MS);
      return packYem(abs, x - abs * DAY_MS);
    }
    const X = Math.floor((utc + JLM_MS - EPOCH0) / DAY_MS);  // היום האזרחי של הרגע
    if (shita === 'grimt' || shita === 'tosE') {
      const startOf = shita === 'grimt' ? startGrimt : startTos;
      const sNext = startOf(X + 1);
      if (sNext == null) return null;
      if (utc >= sNext) return packYem(X + 1, utc - sNext);
      const s = startOf(X);
      return s == null ? null : packYem(X, utc - s);
    }
    // tosZ — איתור הקטע (לילה/יום) שהרגע בתוכו, ומידתו בשעות זמניות
    const eX = sunEvents(X);
    if (!eX) return null;
    if (utc >= eX.set) {
      const eN = sunEvents(X + 1);
      return eN ? packZman(X + 1, 12 * (utc - eX.set) / (eN.rise - eX.set)) : null;
    }
    if (utc < eX.rise) {
      const eP = sunEvents(X - 1);
      return eP ? packZman(X, 12 * (utc - eP.set) / (eX.rise - eP.set)) : null;
    }
    return packZman(X, 12 + 12 * (utc - eX.rise) / (eX.set - eX.rise));
  }
  function packYem(abs, t) {
    let h = Math.floor(t / HOUR_MS), p = Math.round((t - h * HOUR_MS) / PART_MS);
    if (p === 1080) { p = 0; h++; }
    if (h >= 24) { h -= 24; abs++; }
    return { abs, h, p };
  }
  function packZman(abs, f) {
    let h = Math.floor(f), p = Math.round((f - h) * 1080);
    if (p === 1080) { p = 0; h++; }
    if (h >= 24) { h -= 24; abs++; }
    return { abs, h, p };
  }

  // שעון קיר ישראלי → UTC. Intl נותן רק את הכיוון ההפוך, ולכן מנחשים UTC+2
  // ומתקנים בשתי איטרציות (די בהן גם סביב מעברי שעון הקיץ). שנים לפנה״ס
  // נבנות ב-setUTCFullYear — ‎Date.UTC ממפה 0–99 למאה ה-20.
  const _wallFmt = (() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jerusalem', era: 'short',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      });
    } catch (_) { return null; }
  })();
  function wallOf(utc) {
    const parts = _wallFmt.formatToParts(new Date(utc));
    const g = t => { const p = parts.find(x => x.type === t); return p ? p.value : '0'; };
    let y = +g('year');
    if (/^b/i.test(g('era'))) y = 1 - y;
    const w = new Date(0);
    w.setUTCFullYear(y, +g('month') - 1, +g('day'));
    w.setUTCHours(+g('hour') % 24, +g('minute'), +g('second'), 0);
    return w.getTime();
  }
  function israelUtcFrom(y, mo, d, hh, mm, ss) {
    const w = new Date(0);
    w.setUTCFullYear(y, mo, d);
    w.setUTCHours(hh, mm, ss, 0);
    const want = w.getTime();
    if (!_wallFmt) return want - 2 * HOUR_MS;
    let utc = want - 2 * HOUR_MS;
    try {
      for (let i = 0; i < 2; i++) utc += want - wallOf(utc);
    } catch (_) { return want - 2 * HOUR_MS; }
    return utc;
  }

  // תאריך עברי ממספר יום — כמו H.fromGregorian, אבל על abs ישירות (בטוח גם
  // בשנים לועזיות 0–99, שבהן מסלול ה-Date המקומי משבש את המאה)
  function hebOfAbs(abs) {
    let y = Math.max(1, Math.round(5785 + (abs - H.roshHashanaAbs(5785)) / 365.2468));
    while (y > 1 && H.roshHashanaAbs(y) > abs) y--;
    while (H.roshHashanaAbs(y + 1) <= abs) y++;
    for (const m of H.yearTable(y).months)
      if (abs >= m.startAbs && abs <= m.endAbs)
        return { year: y, month: m.name, day: abs - m.startAbs + 1 };
    return null;
  }

  const SHITOT = [
    { key: 'tosZ', label: 'תוס׳ — שעות זמניות', src: 'שיטה א׳ בתוס׳ עירובין נ״ו ע״א: היממה משקיעה לשקיעה, י״ב שעות ללילה וי״ב ליום' },
    { key: 'tosE', label: 'תוס׳ — שעות שוות', src: 'שיטה ב׳ בתוס׳ שם: היממה משקיעה לשקיעה, בשעות שוות' },
    { key: 'grimt', label: 'הגרי״מ טיקוצינסקי — חצות אמיתי', src: 'הלבוש סי׳ תכ״ח: היממה משש שעות אחר חצות; לפי החצות האמיתי של כל יום' },
    { key: 'merz', label: 'הגר״י מרצבך — חצות ממוצע', src: 'הלבוש סי׳ תכ״ח: היממה משש שעות אחר חצות; לפי החצות הממוצע — תחילת היממה 17:39 בשעון החורף' },
  ];

  // כיוון ברירת המחדל — משעה יממתית לשעה אזרחית: זה עיקר תפקיד הממיר,
  // וההיפוך משמש להתלמד ולתרגל את המרת השעות
  const conv = {
    dir: 'y2c',
    hy: 5786, mi: 0, day: 1,
    ch: 12, cm: 0, cs: 0, h: 0, p: 0,
  };

  function hebLabel(abs) {
    const hd = hebOfAbs(abs);
    if (!hd) return '—';
    let s = `${T(DOW_FULL[(abs + 1) % 7])} ${H.hebNum(hd.day)} ${T(hd.month)}`;
    if (hd.year !== conv.hy) s += ' ' + H.hebYearName(hd.year);
    return s;
  }

  function renderConv() {
    if (!$('l_convBox')) return;
    $('lc_civIn').style.display = conv.dir === 'c2y' ? '' : 'none';
    $('lc_yemIn').style.display = conv.dir === 'y2c' ? '' : 'none';

    // רשימות החודש והיום תלויות בשנה (עיבור, חסרה/שלמה) — נבנות בכל רינדור
    const months = H.yearTable(conv.hy).months;
    conv.mi = Math.min(conv.mi, months.length - 1);
    const mSel = $('lc_month');
    mSel.innerHTML = months.map((m, k) => `<option value="${k}">${T(m.name)}</option>`).join('');
    mSel.value = String(conv.mi);
    const mLen = months[conv.mi].len;
    conv.day = Math.min(conv.day, mLen);
    const dSel = $('lc_day');
    dSel.innerHTML = Array.from({ length: mLen }, (_, k) =>
      `<option value="${k + 1}">${H.hebNum(k + 1)}</option>`).join('');
    dSel.value = String(conv.day);
    const habs = months[conv.mi].startAbs + conv.day - 1;

    const row = (label, title, val) =>
      `<div class="lm-row"><span title="${T(title)}">${T(label)}</span><b>${val}</b></div>`;
    let html = '';
    if (conv.dir === 'c2y') {
      // שעה 18:00 ואילך — ליל התאריך הנבחר, כלומר ערבו של היום האזרחי הקודם
      const cd = H.absToDate(conv.ch >= 18 ? habs - 1 : habs);
      const utc = israelUtcFrom(cd.getUTCFullYear(), cd.getUTCMonth(), cd.getUTCDate(),
        conv.ch, conv.cm, conv.cs);
      html += row('הרגע בשעון ישראל', '', fmtIsrael(new Date(utc), true));
      for (const s of SHITOT) {
        const r = utcToYem(s.key, utc);
        html += row(s.label, s.src, r
          ? `${hebLabel(r.abs)} — ${r.h} ${T('שעות')} ${r.p} ${T('חלקים')}`
          : '—');
      }
    } else {
      for (const s of SHITOT) {
        const utc = yemToUtc(s.key, habs, conv.h, conv.p);
        html += row(s.label, s.src, utc == null ? '—' : fmtIsrael(new Date(utc), true));
      }
    }
    $('lc_out').innerHTML = html;
    const gy = H.absToDate(habs).getUTCFullYear();
    $('lc_note').style.display = (gy < 1600 || gy > 2200) ? '' : 'none';
  }

  function dechiyaPhrase(info) {
    return info.dechiya
      ? T('דחיית') + ' ' + T(DECHIYA_NAME[info.dechiya] || info.dechiya)
      : T('יום המולד');
  }

  function renderSummary(t) {
    // בעברית שם השנה בגימטריה הוא העיקר והמספר בסוגריים; בשפה אחרת להפך,
    // אבל הגימטריה נשמרת — היא שם השנה ולא קישוט.
    const he = !(window.I18N && window.I18N.active);
    const yearName = t.year
      ? (he ? `${T('שנת')} ${H.hebYearName(t.year)} (${t.year})`
            : `${T('שנת')} ${t.year} (${H.hebYearName(t.year)})`)
      : T('שנת מעבדה');
    $('l_title').textContent = yearName;
    $('l_kind').textContent =
      `${T(t.leap ? 'מעוברת' : 'פשוטה')} · ${T(t.kind || '—')} · ${t.len} ${T('ימים')}`;
    $('l_siman').textContent = t.siman;
    // המחזורים נמנים משנת הבריאה, ולכן אין להם משמעות בשנת מעבדה
    $('l_cycles').textContent = t.cycle19
      ? `${T('מחזור קטן')} — ${T('שנה')} ${t.cycle19.year} ${T('מתוך')} 19 (${T('מחזור')} ${t.cycle19.num}) · ` +
        `${T('מחזור גדול')} — ${T('שנה')} ${t.cycle28.year} ${T('מתוך')} 28 (${T('מחזור')} ${t.cycle28.num})`
      : '';
    $('l_rh').innerHTML =
      `${T('ראש השנה ביום')} <b>${T(H.DOW[t.rh.dow])}</b> (${dechiyaPhrase(t.rh)})` +
      (t.year ? ` — ${gregFull(t.rh.abs)}` : '');
    $('l_rhNext').innerHTML =
      `${T('ראש השנה בשנה הבאה ביום')} <b>${T(H.DOW[t.rhNext.dow])}</b> (${dechiyaPhrase(t.rhNext)})` +
      (t.year ? ` — ${gregFull(t.rhNext.abs)}` : '');
    $('l_moladT').textContent = moladFull(t.rh.molad);
    // מולד תשרי הבא — הבסיס לקביעת השנה: ההפרש בין שני ימי ראש השנה
    // (אחרי הדחיות) הוא שקובע אם השנה חסרה, כסדרה או שלמה.
    $('l_moladTNext').textContent = moladFull(t.nextMolad);

    // הדגשת הדחיה שפעלה בפועל
    for (const id of ['l_r1', 'l_r2', 'l_r3', 'l_r4'])
      if ($(id)) $(id).classList.remove('hit');
    const row = DECHIYA_ROW[t.rh.dechiya];
    if (row && $(row)) $(row).classList.add('hit');
    if (String(t.rh.dechiya).endsWith('+adu') && $('l_r4')) $('l_r4').classList.add('hit');

    // אזהרות מצב מעבדה
    const w = $('l_warn'), msgs = [];
    if (t.leap && t.prevLeap)
      msgs.push(T('אין בלוח שתי שנים מעוברות רצופות — במחזור י״ט השנים המעוברות הן ג׳ ו׳ ח׳ י״א י״ד י״ז י״ט, ואין שתיים סמוכות. הצירוף הזה אינו קיים.'));
    if (!t.valid)
      msgs.push(T('אורך השנה שהתקבל אינו מן האורכים החוקיים (353/354/355 בפשוטה, 383/384/385 במעוברת) — צירוף הנתונים שנבחר אינו נפגש בלוח.'));
    w.innerHTML = msgs.map(m => `<div>⚠ ${m}</div>`).join('');
    w.style.display = msgs.length ? '' : 'none';
  }

  // ── מצב האיור ───────────────────────────────────────────────────────
  const sim = {
    playing: false, _bound: false, custom: false,
    year: 5786,
    c: { dow: 4, h: 9, p: 391, leap: false, prevLeap: false, nextLeap: false },

    step() {},

    build() {
      return this.custom ? H.customYear(this.c) : H.yearTable(this.year);
    },

    // draw() נקרא בכל invalidate (כל לחיצה במסמך). בניית הטבלה מחדש מאפסת את
    // גלילת המכולה, ולכן היא מדלגת כשהמצב והשפה לא השתנו.
    draw() {
      if (!$('l_table')) return;
      const sig = (this.custom ? 'c' + JSON.stringify(this.c) : 'y' + this.year) +
        '|' + (window.I18N ? window.I18N.lang : 'he');
      if (this._sig === sig) return;
      this._sig = sig;
      const t = this.build();
      this._t = t;                             // לחלונית המולדות (החלפת חודש בלבד)
      renderSummary(t);
      renderTable(t);
      renderMolad(t);
      if (window.I18N && window.I18N.active) window.I18N.translateDom($('l_view'));
      // אחרי translateDom ולא לפניו: הוא משחזר מאפייני title מן הערך שנקלט
      // בפעם הראשונה (בניגוד לצמתי טקסט, שיש להם זיהוי כתיבה דינמית), ולכן
      // title שנבנה בזמן ריצה על צומת קבוע היה נדרס בחזרה לעברית.
      $('l_siman').title = `${T('סימן השנה')}: ${T(H.DOW[t.rh.dow])} · ${T(t.kind || '')} · ` +
        `${T('א׳ דפסח')} ${T(H.DOW[t.pesachDow])}`;
    },

    // בשנה מעוברת השנה הבאה בהכרח פשוטה; הפקד ננעל ומשקף זאת.
    _syncCustom() {
      const on = this.custom;
      $('l_customBox').style.display = on ? '' : 'none';
      $('l_yearBox').style.display = on ? 'none' : '';
      // חלונית המולדות טעונה שנה אמיתית — למולד לועזי ולקיבוץ האסטרונומי
      // (ממיר השעה נשאר גלוי: התאריך שלו עצמאי ואינו תלוי בשנה המוצגת)
      $('l_moladBox').style.display = on ? 'none' : '';
      $('l_customBtn').textContent = T(on ? '↩ חזרה לשנה אמיתית' : '🧪 שנת מעבדה');
      if (!on) return;
      const pv = $('l_prevLeap'), nx = $('l_nextLeap');
      if (this.c.leap) { this.c.prevLeap = false; pv.checked = false; pv.disabled = true; }
      else pv.disabled = false;
      if (this.c.leap) { this.c.nextLeap = false; nx.checked = false; nx.disabled = true; }
      else nx.disabled = false;
      $('l_prevHint').textContent = this.c.leap
        ? T('שנה שלפני מעוברת היא תמיד פשוטה')
        : T('משפיע רק כשמולד תשרי חל ביום ב׳ אחרי ט״ו תקפ״ט ולפני י״ח');
      $('l_nextHint').textContent = this.c.leap
        ? T('שנה שאחרי מעוברת היא תמיד פשוטה')
        : T('משפיע רק כשמולד תשרי הבא חל ביום ג׳ אחרי ט׳ ר״ד ולפני י״ח');
    },

    _syncYear() {
      const el = $('l_year');
      if (el && !window.__fieldLocked(el)) el.value = this.year;
      $('l_yearName').textContent = H.hebYearName(this.year);
    },

    sync() { if (!this.custom) this._syncYear(); },

    bind() {
      if (this._bound) return; this._bound = true;
      const today = H.fromGregorian(new Date());
      if (today) this.year = today.year;
      this.moladIdx = today ? today.monthIdx : 0;   // חלונית המולדות נפתחת על החודש הנוכחי
      this._syncYear();
      this._syncCustom();

      const redraw = () => this.draw();
      const setYear = y => {
        this.year = Math.max(1, Math.min(9999, y | 0));
        this._syncYear(); redraw();
      };
      $('l_year').onchange = e => setYear(+e.target.value || this.year);
      $('lm_month').onchange = e => {
        this.moladIdx = +e.target.value;
        this._moladName = null;                    // הבחירה החדשה תיקבע לפי האינדקס
        if (this._t) renderMolad(this._t);
      };
      $('l_prev').onclick = () => setYear(this.year - 1);
      $('l_next').onclick = () => setYear(this.year + 1);
      $('l_today').onclick = () => {
        const h = H.fromGregorian(new Date());
        if (h) setYear(h.year);
      };
      $('l_customBtn').onclick = () => {
        this.custom = !this.custom;
        if (this.custom) {                       // פותחים מהשנה המוצגת, כנקודת מוצא מוכרת
          const t = H.yearTable(this.year), m = t.rh.molad;
          this.c = {
            dow: m.dow, h: m.h, p: m.p,
            leap: t.leap, prevLeap: t.prevLeap, nextLeap: t.nextLeap,
          };
          $('l_dow').value = String(m.dow);
          $('l_h').value = m.h; $('l_p').value = m.p;
          $('l_leap').checked = t.leap;
          $('l_prevLeap').checked = t.prevLeap;
          $('l_nextLeap').checked = t.nextLeap;
        }
        this._syncCustom(); redraw();
      };

      const num = (id, key, min, max) => {
        $(id).oninput = e => {
          const v = Math.max(min, Math.min(max, +e.target.value || 0));
          this.c[key] = v; redraw();
        };
      };
      $('l_dow').onchange = e => { this.c.dow = +e.target.value; redraw(); };
      num('l_h', 'h', 0, 23);
      num('l_p', 'p', 0, 1079);
      for (const [id, key] of [['l_leap', 'leap'], ['l_prevLeap', 'prevLeap'], ['l_nextLeap', 'nextLeap']]) {
        $(id).onchange = e => { this.c[key] = e.target.checked; this._syncCustom(); redraw(); };
      }

      // ── ממיר השעה היממתית ──
      // נפתח מכוון לרגע הנוכחי. מ-18:00 התאריך היממתי הוא כבר של מחר —
      // ולפי כלל הקלט (שעה 18+ היא ליל התאריך הנבחר) נבחר יום המחרת.
      {
        const now = new Date();
        try {
          const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Jerusalem',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
          }).formatToParts(now);
          const g = t => +((parts.find(x => x.type === t) || {}).value || 0);
          conv.ch = g('hour'); conv.cm = g('minute'); conv.cs = g('second');
        } catch (_) {
          conv.ch = now.getHours(); conv.cm = now.getMinutes(); conv.cs = now.getSeconds();
        }
        const hd = H.fromGregorian(conv.ch >= 18 ? new Date(now.getTime() + DAY_MS) : now);
        if (hd) { conv.hy = hd.year; conv.mi = hd.monthIdx; conv.day = hd.day; }
        $('lc_year').value = conv.hy;
        $('lc_ch').value = conv.ch; $('lc_cm').value = conv.cm; $('lc_cs').value = conv.cs;
      }
      $('lc_dir').onchange = e => { conv.dir = e.target.value; renderConv(); };
      $('lc_year').onchange = e => {
        conv.hy = Math.max(1, Math.min(9999, +e.target.value || conv.hy));
        e.target.value = conv.hy;
        renderConv();
      };
      $('lc_month').onchange = e => { conv.mi = +e.target.value; renderConv(); };
      $('lc_day').onchange = e => { conv.day = +e.target.value; renderConv(); };
      const cnum = (id, key, min, max) => {
        $(id).oninput = e => {
          conv[key] = Math.max(min, Math.min(max, +e.target.value || 0));
          renderConv();
        };
      };
      cnum('lc_ch', 'ch', 0, 23); cnum('lc_cm', 'cm', 0, 59); cnum('lc_cs', 'cs', 0, 59);
      cnum('lc_h', 'h', 0, 23); cnum('lc_p', 'p', 0, 1079);

      this.draw();
      renderConv();
    },
  };

  sim.onLanguage = () => {
    if (!sim._bound) return;
    sim._sig = null; sim._syncCustom(); sim.draw();
    renderConv();
  };

  window.Sims.luach = sim;
})();
