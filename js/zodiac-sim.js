// zodiac-sim.js — גלגל המלקה והמזלות
// מציג את מיקומי השמש, הירח וכוכבי הלכת על גלגל המזלות (מבט גאוצנטרי מעמוד העולם).
// 0° טלה = ימין; הגלגל מתקדם נגד כיוון השעון (מזרחה).
// כשמוצג האופק (מזל עולה) הגלגל מסובב לפי הרגע והמקום: המזל העולה במזרח (שמאל),
// אמצע הרקיע למעלה, והחלק שמתחת לאופק מוצל למטה.
"use strict";
(function () {
  const AE = window.Astronomy;
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const PI = Math.PI, RAD = PI / 180;

  const SIGNS = ['טלה','שור','תאומים','סרטן','אריה','בתולה','מאזניים','עקרב','קשת','גדי','דלי','דגים'];

  // תרגום דו-לשוני "Aries (טלה)" נפרק על הגלגל לשתי שורות, שלא יגלוש מהמשבצת
  function drawSignLabel(ctx, label, x, y, fs) {
    const m = /^(.*\S) \((.+)\)$/.exec(label);
    if (!m) { ctx.fillText(label, x, y); return; }
    const f = ctx.font;
    ctx.fillText(m[1], x, y - fs * 0.42);
    ctx.font = f.replace(/\d+(\.\d+)?px/, Math.max(8, fs - 2) + 'px');
    ctx.fillText(m[2], x, y + fs * 0.62);
    ctx.font = f;
  }

  // גרמי שמים לפי סדר חשיבות ויזואלית
  const BODIES = [
    { key: 'sun',     he: 'שמש',    color: '#f5c842', r: 9 },
    { key: 'moon',    he: 'ירח',    color: '#c8c8c8', r: 7 },
    { key: 'venus',   he: 'נוגה',   color: '#e8c870', r: 5 },
    { key: 'mars',    he: 'מאדים',  color: '#d05030', r: 5 },
    { key: 'jupiter', he: 'צדק',    color: '#c8a870', r: 6 },
    { key: 'saturn',  he: 'שבתאי',  color: '#b0a060', r: 5 },
    // 'כוכב' (ולא 'חמה' הקצר): בשצ"ם חנכ"ל כ=כוכב, וגם נבדל מ'חמה'=שמש בתרגום
    { key: 'mercury', he: 'כוכב',   color: '#a09080', r: 4 },
    { key: 'uranus',  he: 'אורנוס', color: '#70c0cc', r: 3 },
    { key: 'neptune', he: 'נפטון',  color: '#5060c8', r: 3 },
  ];

  // צבעי אלמנטים: אש, אדמה, אוויר, מים
  const ELEM = ['rgba(200,70,30,0.22)','rgba(60,160,60,0.18)','rgba(50,130,210,0.18)','rgba(30,180,190,0.18)'];
  const ELEM_I = [0,1,2,3,0,1,2,3,0,1,2,3]; // לפי סדר המזלות

  // מטמון צבעים מ-CSS
  const _cc = Object.create(null);
  const cv = n => { if (_cc[n] === undefined) _cc[n] = getComputedStyle(document.body).getPropertyValue(n).trim() || ''; return _cc[n]; };
  function clearColorCache() { for (const k in _cc) delete _cc[k]; }
  // ברקע האיור הבהיר צבעי הגופים הבהירים (ירח #c8c8c8 וכד') נבלעים — התוויות
  // מוכהות; הדיסקות עצמן נשארות בצבען (יש להן זוהר והן ניכרות גם כך)
  const isLight = () => document.body.classList.contains('ill-light');
  function shadeHex(hex, f) {
    const n = parseInt(hex.slice(1, 7), 16), m = v => Math.round(v * f);
    return `rgb(${m((n >> 16) & 255)},${m((n >> 8) & 255)},${m(n & 255)})`;
  }
  const labelCol = c => isLight() ? shadeHex(c, 0.58) : c;

  // מטמון מידות קנבס
  const _fc = new Map();
  function clearFitCache() { _fc.clear(); }
  function fit(canvas) {
    let c = _fc.get(canvas);
    if (!c) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement.getBoundingClientRect();
      const W = Math.max(280, rect.width), H = Math.max(240, rect.height);
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c = { ctx, W, H }; _fc.set(canvas, c);
    }
    return c;
  }

  // ══ ארבע התקופות ══════════════════════════════════════════════════════
  // התקופה = הרגע שבו אורך המלקה של השמש הוא 0° (ניסן), 90° (תמוז),
  // 180° (תשרי) או 270° (טבת) — שוויון היום והלילה ושתי נקודות ההיפוך.
  // מחושב אסטרונומית (Astronomy Engine) בשנה המבוקשת.
  function tekufaDate(targetLon, year) {
    try {
      const t = AE.SearchSunLongitude(targetLon, new Date(Date.UTC(year, 0, 1)), 400);
      return t ? t.date : null;
    } catch (_) { return null; }
  }

  // ══ חישוב אורכי מלקה ══════════════════════════════════════════════════

  // אורך מלקה אמיתי של-תאריך (tropical) של גוף, באופן אחיד לכל הגופים:
  // וקטור גאוצנטרי (EQJ, עם תיקון אברציה) → המרה אחת ב-Astronomy.Ecliptic.
  // (קודם השמש/הירח/הכוכבים חושבו בשלוש שיטות שונות — וגם EclipticGeoMoon().elon
  //  היה שגוי: השדה הוא .lon, כך שהירח נתקע ב-0° טלה. כעת הכול מאוחד ומתוקן.)
  function ecLon(body, time) {
    try { return AE.Ecliptic(AE.GeoVector(body, time, true)).elon; } catch (_) { return 0; }
  }

  let _cacheMs = null, _cacheLons = null;
  function getLongitudes(date) {
    if (_cacheMs === date.getTime()) return _cacheLons;
    const time = AE.MakeTime(date);
    const out = {};
    for (const { key } of BODIES) {
      const name = key[0].toUpperCase() + key.slice(1);   // 'sun'→'Sun', 'mercury'→'Mercury'...
      out[key] = ecLon(AE.Body[name], time);
    }
    _cacheMs = date.getTime(); _cacheLons = out;
    return out;
  }

  function signOf(lon) { return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)]; }
  const rev360 = x => ((x % 360) + 360) % 360;

  // ══ האופק — מזל עולה ואמצע הרקיע ══════════════════════════════════════
  // ASC = אורך המלקה של הנקודה העולה באופק המזרחי; MC = אורך המלקה שעל קו חצי השמים.
  //   θ = זמן הכוכבים המקומי (מעלות), ε = נטיית המלקה, φ = קו הרוחב.
  //   ASC = atan2( cos θ , −(sin θ·cos ε + tan φ·sin ε) )
  //   MC  = atan2( sin θ , cos θ·cos ε )
  // (בדיקה: ב-φ=0, ε=0 מתקבל ASC = θ+90 ו-MC = θ — כמצופה.)
  const EPS = 23.4392911;                       // נטיית J2000 — לגאומטריית הציור בלבד
  // נטיית המלקה הממוצעת לתאריך עצמו (IAU 2006) — ל-ASC/MC, שזמן הכוכבים
  // שבהם הוא של התאריך; הנטייה נסוגה כ-47″ למאה, וקיבוע J2000 היה מטה את
  // המזל העולה בשניות קשת בודדות בעשורים הסמוכים (וגדל והולך עם השנים).
  function epsOfDate(date) {
    const T = (date.getTime() / 86400000 - 10957.5) / 36525;   // מאות יוליאניות מ-J2000
    return 23.439279444444445 + T * (-0.013010213611111 + T * (-5.0861111111e-8 + T * 5.565e-7));
  }
  function horizonPoints(date, lat, lon) {
    let gast;
    try { gast = AE.SiderealTime(AE.MakeTime(date)); } catch (_) { return null; }
    const th = rev360(gast * 15 + lon) * RAD, ph = lat * RAD, ep = epsOfDate(date) * RAD;
    const asc = rev360(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(ep) + Math.tan(ph) * Math.sin(ep))) / RAD);
    const mc  = rev360(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(ep)) / RAD);
    return { asc, mc };
  }

  // זוית השעה של השמש במקום הצופה (0° = חצות היום, גדלה במשך היממה).
  // היא המידה של הסיבוב היומי: מרידיאן הצופה מרוחק ממרידיאן חצות היום
  // בדיוק בשיעורה, ומכאן מקומו של הצופה על הכדור במבט מבחוץ.
  function sunHourAngle(date, lat, lon) {
    try {
      const t = AE.MakeTime(date);
      const eq = AE.Equator(AE.Body.Sun, t, new AE.Observer(lat, lon, 0), true, true);
      return rev360(AE.SiderealTime(t) * 15 + lon - eq.ra * 15);
    } catch (_) { return 0; }
  }

  // ══ ראשי חודשים — א' בחודש עברי הקרוב (מהיום והלאה) ═══════════════════
  // הנידונים ברש"י ותוס' ר"ה וב"מ: ניסן, שבט, ואדר (בשנה מעוברת — אדר ב',
  // הסמוך לניסן). מחושב מן המולד (js/hebrew-calendar.js) ולא מלוח ה-Intl,
  // שסוטה ממנו ביום אחד בחלק מן השנים. התוצאה נשמרת במטמון.
  const RH_MONTHS = { nisan: ['ניסן'], shevat: ['שבט'], adar: ['אדר', 'אדר ב׳'] };
  const _rhCache = Object.create(null);
  function nextRoshChodesh(key) {
    const dayKey = key + '|' + new Date().toDateString();
    if (_rhCache[dayKey]) return _rhCache[dayKey];
    const start = new Date(); start.setHours(12, 0, 0, 0);
    try {
      const d = window.HebCal.nextRoshChodesh(RH_MONTHS[key], start);   // חצות מקומי
      if (d) return (_rhCache[dayKey] = d);
    } catch (_) {}
    return null;
  }

  // המרת מספר לאותיות עבריות (גימטריה) עם גרשיים
  function toHebNum(n) {
    const ones    = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
    const tens    = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
    const hunds   = ['','ק','ר','ש','ת','תק','תר','תש','תת','תתק'];
    let s = '';
    s += hunds[Math.floor(n / 100)];
    const rem = n % 100;
    if (rem === 15) s += 'טו';
    else if (rem === 16) s += 'טז';
    else { s += tens[Math.floor(rem / 10)]; s += ones[rem % 10]; }
    // גרשיים לפני האות האחרונה אם יש יותר מאות אחת; גרש אם אות בודדת
    if (s.length > 1) s = s.slice(0, -1) + '״' + s.slice(-1);
    else if (s.length === 1) s = s + '׳';
    return s;
  }
  function hebDay(n)  { return toHebNum(n); }
  function hebYear(n) { return toHebNum(n % 1000); } // מוריד אלפים (5786 → 786 = תשפ"ו)

  // תאריך עברי — מ-Otzaria calendar API; fallback: חשבון המולד שב-HebCal.
  // היום העברי מתחיל בשקיעה: משקיעת החמה במקום הצופה (ברירת מחדל — ירושלים)
  // שייך הרגע ליום האזרחי שלמחרת. באזורים קוטביים, שאין בהם שקיעה, נסוגים
  // לגבול חצות האזרחי.
  const civilKey = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const _setCache = new Map(); // יום אזרחי|lat|lon → Date|null (חיפוש AE יקר)
  function sunsetOf(date, lat, lon) {
    const key = civilKey(date) + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
    if (_setCache.has(key)) return _setCache.get(key);
    let set = null;
    try {
      const noon = new Date(date); noon.setHours(12, 0, 0, 0);
      const e = AE.SearchRiseSet(AE.Body.Sun, new AE.Observer(lat, lon, 0), -1, AE.MakeTime(noon), 1);
      if (e) set = e.date;
    } catch (_) {}
    _setCache.set(key, set);
    return set;
  }
  // עלות השחר (החמה 16.1° מתחת לאופק) ביום האזרחי של הרגע — במטמון
  const _dawnCache = new Map();
  function dawnOf(date, lat, lon) {
    const key = civilKey(date) + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
    if (_dawnCache.has(key)) return _dawnCache.get(key);
    let dawn = null;
    try {
      const midnight = new Date(date); midnight.setHours(0, 0, 0, 0);
      const e = AE.SearchAltitude(AE.Body.Sun, new AE.Observer(lat, lon, 0), +1, AE.MakeTime(midnight), 1, -16.1);
      if (e) dawn = e.date;
    } catch (_) {}
    _dawnCache.set(key, dawn);
    return dawn;
  }
  // ══ רגעי היום האמיתיים — זריחה, שקיעה וחצות ═══════════════════════════
  // כפתורי הרגעים מכוונים אל האירוע עצמו בתאריך ובמקום המוצגים, ולא לשעת
  // שעון קבועה: שעה קבועה אינה יכולה לעקוב אחרי העונות. בירושלים השקיעה נעה
  // בין 16:39 (טבת) ל-19:47 (תמוז), ולכן "לילה" בשעה 18:00 היה מציג רקיע של
  // יום בכל הקיץ. חצות הוא חצות הלילה האמיתי (מעבר השמש במרידיאן התחתון).
  // באזורים קוטביים, שאין בהם זריחה או שקיעה ביום המבוקש, נסוגים לשעה קבועה.
  const TOD_FALLBACK = { rise: 6, set: 18, mid: 0 };
  const _todCache = new Map();
  function dayEvent(kind, date, lat, lon) {
    const key = kind + '|' + civilKey(date) + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
    if (_todCache.has(key)) return _todCache.get(key);
    let out = null;
    try {
      const obs = new AE.Observer(lat, lon, 0);
      const t0 = new Date(date); t0.setHours(0, 0, 0, 0);
      const t = AE.MakeTime(t0);
      if (kind === 'mid') {
        const e = AE.SearchHourAngle(AE.Body.Sun, obs, 12, t);
        out = e && e.time.date;
      } else {
        const e = AE.SearchRiseSet(AE.Body.Sun, obs, kind === 'rise' ? +1 : -1, t, 1.2);
        out = e && e.date;
      }
    } catch (_) {}
    _todCache.set(key, out);
    return out;
  }

  // היום האזרחי שהתאריך העברי שלו הוא תאריכו של הרגע הנתון
  function hebCivilDay(date, lat, lon) {
    const set = sunsetOf(date, lat === undefined ? 31.78 : lat, lon === undefined ? 35.24 : lon);
    return set && date >= set ? new Date(date.getTime() + 86400000) : date;
  }
  // לילה לעניין "אור ל־": מהשקיעה ועד עלות השחר האדם בתחילת יום המחרת,
  // ובלוח (כבלוח השנה של אוצריא) נכתב "אור לז׳ אלול" — שלא יתבלבל בתאריך.
  function isNight(date, lat, lon) {
    const la = lat === undefined ? 31.78 : lat, lo = lon === undefined ? 35.24 : lon;
    const set = sunsetOf(date, la, lo);
    if (set && date >= set) return true;                 // מהשקיעה עד חצות
    const dawn = dawnOf(date, la, lo);
    return !!(dawn && date < dawn);                      // מחצות עד עלות השחר
  }
  // מפתח תצוגה: היום האזרחי האפקטיבי + דגל הלילה — לקוראים הממטמנים לפי יום,
  // כדי שהחיווי יתרענן גם בשקיעה (חילוף התאריך) וגם בעלות השחר (נפילת "אור ל־")
  const hebDisplayKey = (date, lat, lon) =>
    civilKey(hebCivilDay(date, lat, lon)) + (isNight(date, lat, lon) ? '|N' : '');

  const _hebCache = new Map(); // hebDisplayKey → string

  async function fetchHebrewDate(date, lat, lon) {
    const d = hebCivilDay(date, lat, lon);
    const night = isNight(date, lat, lon);
    const key = civilKey(d) + (night ? '|N' : '');
    if (_hebCache.has(key)) return _hebCache.get(key);
    try {
      // תאריך מקומי דווקא — toISOString הוא UTC, ובקיץ הזיז את גבול היום ל-3:00
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await Otzaria.call('calendar.getJewishDate', { date: iso });
      if (res && res.success && res.data) {
        const { day, monthName, year } = res.data;
        const str = (night ? T('אור ל') : '') + `${hebDay(day)} ${monthName} ${hebYear(year)}`;
        _hebCache.set(key, str);
        return str;
      }
    } catch (_) {}
    // fallback אם Otzaria לא זמינה (למשל בפיתוח) — חשבון המולד שלנו.
    // לוח ה-Intl שימש כאן קודם, ונזנח: הוא סוטה ביום אחד בשנים שמולד תשרי
    // שלהן חל ביום א׳ בין שעה 15 ל-18 והשנה שלפניהן מעוברת (ראו js/hebrew-calendar.js).
    try {
      let str = window.HebCal.formatHebrewDate(d);
      if (str && night) str = T('אור ל') + str;
      if (str) _hebCache.set(key, str);
      return str;
    } catch (_) { return ''; }
  }

  // ══ ציור ══════════════════════════════════════════════════════════════

  // אורך מלקה → זווית קנבס: 0° = ימין, גדל נגד כיוון השעון
  function L2A(lon) { return -lon * RAD; }

  // ── רינג שנים-עשר המזלות ──────────────────────────────────────────────
  // משותף למבט-על ולמבט מבחוץ: אותו גלגל ממש, ורק מקומו של הצופה בו משתנה.
  // A היא פונקציית אורך-מלקה → זווית-קנבס של האיור הקורא (במבט-על היא מסובבת
  // לפי המזל העולה, ובמבט מבחוץ קבועה), ו-hiSign מזל שיודגש (‎-1 = אין).
  function drawRing(ctx, cx, cy, innerR, outerR, A, fontSize, hiSign) {
    for (let i = 0; i < 12; i++) {
      const a0 = A(i * 30), a1 = A((i + 1) * 30);
      ctx.fillStyle = ELEM[ELEM_I[i]];
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a0, a1, true);
      ctx.arc(cx, cy, innerR, a1, a0, false);
      ctx.closePath(); ctx.fill();
    }

    // קווי מחיצה
    ctx.strokeStyle = cv('--ill-grid') || 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = A(i * 30);
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(a), cy + innerR * Math.sin(a));
      ctx.lineTo(cx + outerR * Math.cos(a), cy + outerR * Math.sin(a));
      ctx.stroke();
    }

    // תוויות מזלות
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const labelR = (innerR + outerR) / 2;
    for (let i = 0; i < 12; i++) {
      const midA = A(i * 30 + 15);
      ctx.font = (i === hiSign ? 'bold ' : '') + fontSize + 'px sans-serif';
      ctx.fillStyle = cv('--ill-text') || '#e0e0e0';
      drawSignLabel(ctx, T(SIGNS[i]), cx + labelR * Math.cos(midA), cy + labelR * Math.sin(midA), fontSize);
    }
    ctx.font = `${fontSize}px sans-serif`;

    // מסגרות רינג
    ctx.strokeStyle = cv('--ill-line') || 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, 2 * PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, 2 * PI); ctx.stroke();
  }

  function drawWheel(ctx, W, H, date, hz) {
    ctx.clearRect(0, 0, W, H);
    // כשמוצג האופק הגלגל מסובב כך שהמזל העולה יושב במזרח (שמאל), אמצע הרקיע למעלה,
    // וחצי הגלגל שמתחת לאופק למטה — כך נראית עליית המזלות כפי שהיא בשמים.
    // בלי האופק נשמרת התצוגה הקבועה: 0° טלה מימין.
    const rot = hz ? (180 + hz.asc) * RAD : 0;
    const A = lon => -lon * RAD + rot;
    // אזור הציור הפנוי מה-HUD (רצועה מימין במסך רחב, בראש במסך צר)
    const L = window.Sims.stageLayout(document.getElementById('zodiacCanvas'), W, H);
    const cx = L.x + L.w / 2, cy = L.y + L.h / 2;
    const maxR  = Math.min(L.w, L.h) * 0.46;
    const outerR = maxR;
    const innerR = maxR * 0.74;
    const bodyR  = maxR * 0.54;

    // ── רקע כללי ──
    ctx.fillStyle = cv('--ill-bg') || '#060616';
    ctx.beginPath(); ctx.arc(cx, cy, outerR + 2, 0, 2 * PI); ctx.fill();

    // ── רינג 12 מזלות ──
    const fontSize = Math.max(9, Math.min(13, maxR * 0.073));
    drawRing(ctx, cx, cy, innerR, outerR, A, fontSize, -1);

    // ── אזור פנימי (חלל) ──
    ctx.fillStyle = cv('--ill-space') || '#04040e';
    ctx.beginPath(); ctx.arc(cx, cy, innerR - 1, 0, 2 * PI); ctx.fill();

    // קו 0° (נקודת השוויון)
    const a0 = A(0);
    ctx.strokeStyle = 'rgba(255,200,80,0.35)';
    ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (innerR - 2) * Math.cos(a0), cy + (innerR - 2) * Math.sin(a0)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isLight() ? 'rgba(146,108,18,0.9)' : 'rgba(255,200,80,0.7)';
    ctx.font = `${Math.max(8, fontSize - 2)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(T('0° טלה'), cx + (innerR - 22) * Math.cos(a0), cy + (innerR - 22) * Math.sin(a0));

    // ── האופק: החצי שמתחת לאופק מוצל, וקו האופק מסומן מהמזל העולה אל השוקע ──
    if (hz) {
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, A(hz.asc), A(hz.asc + 180), true);
      ctx.closePath(); ctx.fill();

      const aA = A(hz.asc), aD = A(hz.asc + 180);
      ctx.strokeStyle = '#7ee081'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + outerR * Math.cos(aA), cy + outerR * Math.sin(aA));
      ctx.lineTo(cx + outerR * Math.cos(aD), cy + outerR * Math.sin(aD));
      ctx.stroke();
      // קו אמצע הרקיע (חצי השמים) — מצויר כקוטר מלא, כמו קו האופק, שכן אף הוא
      // חתך של מישור בגלגל. הוא אינו ניצב לקו האופק והוא נע במשך היממה, ואין
      // בזה שגיאה: הכיוון בשמים אמנם קבוע, אבל הקשת שעל הגלגל בין הנקודה
      // העולה לנקודה שבחצי השמים משתנה — מפני שהגלגל נטוי לקו המשווה (23.44°).
      // בירושלים היא 71°–108°, בלונדון 54°–126°, ובקו המשווה כמעט 90° קבועות.
      // לכן אי אפשר לקבע את שני הקווים גם יחד, והעוגן הוא המזל העולה.
      // הירוק הבהיר נבלע ברקע האיור הבהיר (ובפרט בחציו המוצל של הגלגל), ולכן
      // מוכהה שם — כדרך תווית "0° טלה" שלמעלה.
      const aM = A(hz.mc), aI = A(hz.mc + 180);
      const mcCol = isLight() ? 'rgba(32,96,40,' : 'rgba(126,224,129,';
      ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.strokeStyle = mcCol + '0.55)';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + outerR * Math.cos(aM), cy + outerR * Math.sin(aM)); ctx.stroke();
      ctx.strokeStyle = mcCol + (isLight() ? '0.32)' : '0.20)');   // החצי שמתחת לארץ — עמום, כשאר מה שמתחת לאופק
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + outerR * Math.cos(aI), cy + outerR * Math.sin(aI)); ctx.stroke();
      ctx.setLineDash([]);

      // התווית מוצמדת אל גבולות הקנבס: בקנבס צר אין מקום מחוץ לגלגל, ובלי ההצמדה
      // הכיתוב נחתך בשוליים.
      const tag = (a, txt) => {
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(txt).width + 8, h = 16;
        let x = cx + (outerR + 14) * Math.cos(a), y = cy + (outerR + 14) * Math.sin(a);
        x = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, x));
        y = Math.max(h / 2 + 2, Math.min(H - h / 2 - 2, y));
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.fillStyle = '#7ee081'; ctx.fillText(txt, x, y);
      };
      tag(aA, T('מזרח · עולה')); tag(aD, T('מערב · שוקע')); tag(aM, T('אמצע הרקיע'));
    }

    // ── גרמי שמים ──
    const lons = getLongitudes(date);

    for (let i = 0; i < BODIES.length; i++) {
      const body = BODIES[i];
      const ang = A(lons[body.key] ?? 0);
      const r = bodyR;
      const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);

      // קו עדין מהמרכז לגוף (מרידיאן)
      ctx.strokeStyle = body.color + '55';
      ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      ctx.setLineDash([]);

      // זוהר
      const glow = ctx.createRadialGradient(x, y, 0, x, y, body.r * 3);
      glow.addColorStop(0, body.color + 'bb'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, body.r * 3, 0, 2 * PI); ctx.fill();

      // גוף
      ctx.fillStyle = body.color;
      ctx.beginPath(); ctx.arc(x, y, body.r, 0, 2 * PI); ctx.fill();

      // תווית — בכיוון רדיאלי מחוץ לגוף
      const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const lfs = Math.max(8, Math.min(10, maxR * 0.06));
      ctx.font = `bold ${lfs}px sans-serif`;
      ctx.fillStyle = labelCol(body.color);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(T(body.he), x + (dx / d) * (body.r + 13), y + (dy / d) * (body.r + 13));
    }

    // ── הארץ במרכז ──
    const eR = Math.max(8, maxR * 0.065);
    const eg = ctx.createRadialGradient(cx - eR * 0.3, cy - eR * 0.35, 1, cx, cy, eR);
    eg.addColorStop(0, '#4888ff'); eg.addColorStop(0.6, '#1850b8'); eg.addColorStop(1, '#0c2848');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(cx, cy, eR, 0, 2 * PI); ctx.fill();
    ctx.strokeStyle = 'rgba(80,140,255,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = cv('--ill-text') || '#ddd';
    ctx.font = `${Math.max(8, maxR * 0.055)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(T('ארץ'), cx, cy + eR + 4);
  }

  // ══ מבט הצופה — רצועת המזלות על פני הרקיע ═══════════════════════════════
  // הצופה עומד על הארץ במרכז, האופק סביבו, ורצועת גלגל המזלות נטויה על פני
  // הרקיע — נטייתה צפונה ודרומה נראית מול קו המשווה השמימי המסומן לצדה.
  // הסיבוב היומי (הפעלה ב"שעות") מרים את המזלות מן האופק המזרחי, והשמש
  // והכוכבים נישאים עם הרצועה. גרירה מסובבת את המבט סביב הצופה.
  const BETA_V = 24;                     // הגבהת נקודת המבט — כמו באיור מהלך השמש
  const HALF_BAND = 9;                   // חצי רוחב הרצועה במעלות (תחום נדודי הלבנה והכוכבים)
  const CE = Math.cos(EPS * RAD), SE = Math.sin(EPS * RAD);
  const COMPASS8 = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
  // צבעי האלמנטים כבסיס rgba פתוח — האלפא נקבעת לפי מעל/מתחת לאופק והדגשת מזל השמש
  const ELEM_V = ['rgba(200,70,30,', 'rgba(60,160,60,', 'rgba(50,130,210,', 'rgba(30,180,190,'];

  function drawObserver(ctx, W, H, date, st, hz) {
    ctx.clearRect(0, 0, W, H);
    const L = window.Sims.stageLayout(document.getElementById('zodiacCanvas'), W, H);
    const cx = L.x + L.w / 2, cy = L.y + L.h / 2 + 8;
    const R = Math.min(L.w * 0.44, L.h * 0.42);
    const av = st.viewAz * RAD, bv = BETA_V * RAD;
    const cosA = Math.cos(av), sinA = Math.sin(av), cosB = Math.cos(bv), sinB = Math.sin(bv);
    // היטל וקטור אופק (מזרח,צפון,מעלה) למסך — כהיטל שבאיור מהלך השמש
    const proj = v => {
      const N2 = v.E * sinA + v.N * cosA;
      return { x: cx - R * (v.E * cosA - v.N * sinA), y: cy - R * (v.U * cosB - N2 * sinB) };
    };
    let gast = 0; try { gast = AE.SiderealTime(AE.MakeTime(date)); } catch (_) {}
    const th = rev360(gast * 15 + st.lon);                       // זמן הכוכבים המקומי
    const phi = st.lat * RAD, sphi = Math.sin(phi), cphi = Math.cos(phi);
    // נקודה על גלגל המזלות (אורך lam, רוחב bet במעלות) → וקטור אופק:
    // מלקה → משווני (סיבוב בנטיית המלקה) → זווית שעה ונטייה → (E,N,U)
    const hor = (lam, bet) => {
      const cl = Math.cos(lam * RAD), sl = Math.sin(lam * RAD);
      const cb = Math.cos(bet * RAD), sb = Math.sin(bet * RAD);
      const x = cb * cl, y = cb * sl * CE - sb * SE, z = cb * sl * SE + sb * CE;
      const Hh = th * RAD - Math.atan2(y, x);                    // זווית השעה
      const dxy = Math.hypot(x, y);                              // קוסינוס הנטייה (z=סינוס)
      const cH = Math.cos(Hh), sH = Math.sin(Hh);
      return { E: -dxy * sH, N: cphi * z - sphi * dxy * cH, U: sphi * z + cphi * dxy * cH };
    };
    const lineBase = isLight() ? 'rgba(40,40,40,' : 'rgba(255,255,255,';

    // ── משטח הארץ (האופק) ──
    const yR = R * sinB;
    ctx.fillStyle = isLight() ? 'rgba(140,120,80,0.16)' : 'rgba(110,150,110,0.10)';
    ctx.beginPath(); ctx.ellipse(cx, cy, R, yR, 0, 0, 2 * PI); ctx.fill();
    ctx.strokeStyle = cv('--ill-horizon') || '#8a8a8a'; ctx.lineWidth = 2; ctx.stroke();
    // רוחות השמים
    ctx.fillStyle = cv('--ill-text') || '#e0e0e0'; ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [az, lbl] of [[0, 'צפון'], [90, 'מזרח'], [180, 'דרום'], [270, 'מערב']]) {
      const r = az * RAD, p = proj({ E: 1.13 * Math.sin(r), N: 1.13 * Math.cos(r), U: 0 });
      ctx.fillText(T(lbl), p.x, p.y);
    }
    // הצופה במרכז
    ctx.fillStyle = cv('--ill-text') || '#e0e0e0';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * PI); ctx.fill();
    ctx.fillStyle = cv('--ill-muted') || '#999'; ctx.font = '10px sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText(T('צופה'), cx, cy + 5);

    // ── קו המשווה השמימי — הרצועה נטויה ממנו צפונה ודרומה ──
    ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
    let prevP = null, prevU = 0;
    for (let Hd = 0; Hd <= 360.01; Hd += 5) {
      const cH = Math.cos(Hd * RAD), sH = Math.sin(Hd * RAD);
      const v = { E: -sH, N: -sphi * cH, U: cphi * cH };          // נטייה 0
      const p = proj(v);
      if (prevP) {
        ctx.strokeStyle = lineBase + (v.U + prevU > 0 ? '0.34)' : '0.12)');
        ctx.beginPath(); ctx.moveTo(prevP.x, prevP.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      prevP = p; prevU = v.U;
    }
    ctx.setLineDash([]);
    { const p = proj({ E: 0, N: -sphi, U: cphi });                // הקודקוד העליון (בדרום)
      ctx.fillStyle = lineBase + '0.5)'; ctx.font = '10px sans-serif'; ctx.textBaseline = 'bottom';
      ctx.fillText(T('משווה השמים'), p.x, p.y - 4); }

    // ── רצועת המזלות ──
    const lons = getLongitudes(date);
    const sunSign = Math.floor(rev360(lons.sun) / 30);
    for (let i = 0; i < 12; i++) {
      const base = ELEM_V[ELEM_I[i]];
      for (let s = 0; s < 5; s++) {
        const l0 = i * 30 + s * 6, l1 = l0 + 6;
        const q = [hor(l0, -HALF_BAND), hor(l0, HALF_BAND), hor(l1, HALF_BAND), hor(l1, -HALF_BAND)];
        const up = q[0].U + q[1].U + q[2].U + q[3].U > 0;
        const col = base + (up ? (i === sunSign ? '0.62)' : '0.34)') : (i === sunSign ? '0.20)' : '0.10)'));
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
        ctx.beginPath();
        const pp = q.map(proj);
        ctx.moveTo(pp[0].x, pp[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(pp[k].x, pp[k].y);
        ctx.closePath(); ctx.fill(); ctx.stroke();               // stroke סוגר תפרים בין המקטעים
      }
      // קו הגבול שבין מזל למזל
      const g0 = hor(i * 30, -HALF_BAND), g1 = hor(i * 30, HALF_BAND);
      const p0 = proj(g0), p1 = proj(g1);
      ctx.strokeStyle = lineBase + (g0.U + g1.U > 0 ? '0.45)' : '0.14)'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    // מסלול השמש (אמצע הרצועה — המלקה עצמה)
    prevP = null; prevU = 0;
    for (let l = 0; l <= 360.01; l += 4) {
      const v = hor(l, 0), p = proj(v);
      if (prevP) {
        ctx.strokeStyle = 'rgba(255,200,80,' + (v.U + prevU > 0 ? '0.55)' : '0.16)');
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(prevP.x, prevP.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      prevP = p; prevU = v.U;
    }
    // שמות המזלות — על אמצע הרצועה; מזל השמש מודגש
    const fs = Math.max(9, Math.min(12, R * 0.055));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const v = hor(i * 30 + 15, 0), p = proj(v);
      ctx.globalAlpha = v.U > 0 ? 1 : 0.35;
      ctx.font = (i === sunSign ? 'bold ' : '') + fs + 'px sans-serif';
      ctx.fillStyle = cv('--ill-text') || '#e0e0e0';
      drawSignLabel(ctx, T(SIGNS[i]), p.x, p.y, fs);
      ctx.globalAlpha = 1;
    }
    // המזל העולה — נקודת החיתוך של המלקה עם האופק המזרחי
    if (hz) {
      const p = proj(hor(hz.asc, 0));
      ctx.fillStyle = '#7ee081';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 2 * PI); ctx.fill();
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(T('המזל העולה'), p.x, p.y - 5);
    }
    // ── גרמי השמים על הרצועה ──
    for (const body of BODIES) {
      const v = hor(rev360(lons[body.key] ?? 0), 0), p = proj(v);
      const up = v.U > 0, r = body.key === 'sun' ? body.r + 2 : body.r;
      ctx.globalAlpha = up ? 1 : 0.3;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      glow.addColorStop(0, body.color + 'bb'); glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = body.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * PI); ctx.fill();
      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = labelCol(body.color);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(T(body.he), p.x, p.y + r + 3);
      ctx.globalAlpha = 1;
    }
    // כותרת המבט + רמז גרירה
    ctx.fillStyle = cv('--ill-muted') || '#999'; ctx.font = '12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const f = rev360(st.viewAz + 180);
    ctx.fillText(T('מבט אל') + ' ' + T(COMPASS8[Math.round(f / 45) % 8]) + ' · ' + T('גררו לסיבוב המבט'),
      L.x + L.w / 2, L.y + 6);
  }

  // ══ מבט מבחוץ — הארץ, השמש והמזלות כאחד ═══════════════════════════════
  // שני המבטים שקדמו לו עומדים שניהם על הארץ: האחד מפה של הגלגל והשני תמונת
  // הרקיע. כאן יוצא הצופה אל מחוץ למערכת כולה ורואה את שלושתם יחד — ומתברר
  // מה מסובב את הגלגל ומה מוליך את השמש בו:
  //   · המזלות קבועים — רצועת כוכבים רחוקה, שאינה זזה כלל.
  //   · הארץ סובבת סביב עצמה פעם ביממה — וזהו הסיבוב היומי של הגלגל כולו.
  //   · הארץ מקיפה את השמש פעם בשנה — ומכאן נדידת השמש בין המזלות.
  // הקו הצהוב הוא קו הראייה מן הארץ דרך השמש אל הרצועה, והוא הנותן את
  // התשובה לשאלה "באיזה מזל השמש": בתקופת תמוז הארץ עומדת בצד גדי, ולכן
  // השמש נראית מנגד — בראש סרטן.
  // הציור אינו קנה מידה: המזלות רחוקים לאין ערוך ממסלול הארץ, והם מצוירים
  // כטבעת סמוכה. הכיוונים בלבד אמיתיים — ולכן קו הראייה נמתח מן הארץ דרך
  // השמש עצמה, שכך הוא מדויק בכל מקום שבמסלול.
  function drawExternal(ctx, W, H, date, st) {
    ctx.clearRect(0, 0, W, H);
    const L = window.Sims.stageLayout(document.getElementById('zodiacCanvas'), W, H);
    const cx = L.x + L.w / 2, cy = L.y + L.h / 2 + 8;
    const maxR = Math.min(L.w, L.h) * 0.45;
    const outerR = maxR, innerR = maxR * 0.79, orbR = maxR * 0.48;
    const A = lon => -lon * RAD;                       // כמו במבט-על: 0° טלה מימין
    const px = (lon, r) => ({ x: cx + r * Math.cos(A(lon)), y: cy + r * Math.sin(A(lon)) });

    const lons = getLongitudes(date);
    const sunLon = rev360(lons.sun);                   // אורך השמש כפי שהיא נראית מן הארץ
    const earthLon = rev360(sunLon + 180);             // ומכאן מקום הארץ סביב השמש
    const sunSign = Math.floor(sunLon / 30);

    // ── רקע, רינג המזלות, והחלל שבתוכו ──
    ctx.fillStyle = cv('--ill-bg') || '#060616';
    ctx.beginPath(); ctx.arc(cx, cy, outerR + 2, 0, 2 * PI); ctx.fill();
    const fontSize = Math.max(9, Math.min(13, maxR * 0.073));
    drawRing(ctx, cx, cy, innerR, outerR, A, fontSize, sunSign);
    ctx.fillStyle = cv('--ill-space') || '#04040e';
    ctx.beginPath(); ctx.arc(cx, cy, innerR - 1, 0, 2 * PI); ctx.fill();

    // ── מסלול הארץ סביב השמש, וארבע התקופות שעליו ──
    ctx.strokeStyle = cv('--ill-line') || 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, 2 * PI); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `${Math.max(8, fontSize - 3)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [sl, name] of [[0, 'ניסן'], [90, 'תמוז'], [180, 'תשרי'], [270, 'טבת']]) {
      const p = px(sl + 180, orbR), q = px(sl + 180, orbR - 14);
      ctx.fillStyle = cv('--ill-muted') || '#999';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 2 * PI); ctx.fill();
      ctx.fillText(T(name), q.x, q.y);
    }

    const eP = px(earthLon, orbR);

    // ── קו הראייה: מן הארץ, דרך השמש, אל המזל שהיא נראית בו ──
    { const hit = px(sunLon, innerR - 3);
      ctx.strokeStyle = 'rgba(255,200,80,0.75)'; ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(eP.x, eP.y); ctx.lineTo(hit.x, hit.y); ctx.stroke();
      ctx.setLineDash([]); }
    // והקו שמנגד — המזל שכנגד השמש, העומד באמצע הרקיע בחצות הלילה
    { const hit = px(earthLon, innerR - 3);
      ctx.strokeStyle = isLight() ? 'rgba(60,70,110,0.45)' : 'rgba(160,180,255,0.35)';
      ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(eP.x, eP.y); ctx.lineTo(hit.x, hit.y); ctx.stroke();
      ctx.setLineDash([]); }

    // ── השמש במרכז ──
    { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
      g.addColorStop(0, 'rgba(245,200,66,0.75)'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = '#f5c842'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 2 * PI); ctx.fill();
      ctx.font = `bold ${Math.max(9, fontSize - 2)}px sans-serif`;
      ctx.fillStyle = labelCol('#f5c842');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(T('שמש'), cx, cy + 13); }

    // ── הארץ: גופה, צד הלילה שבה, והסיבוב היומי ──
    const er = Math.max(10, maxR * 0.062);
    { const g = ctx.createRadialGradient(eP.x - er * 0.3, eP.y - er * 0.35, 1, eP.x, eP.y, er);
      g.addColorStop(0, '#4888ff'); g.addColorStop(0.6, '#1850b8'); g.addColorStop(1, '#0c2848');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(eP.x, eP.y, er, 0, 2 * PI); ctx.fill(); }
    // חצי הכדור שמנגד לשמש — הוא הלילה. כיוון השמש מן הארץ הוא A(sunLon) ממש,
    // שהרי הקו היוצא מן הארץ באותה זווית עובר במרכז, ושם השמש עומדת.
    { const a = A(sunLon);
      ctx.save(); ctx.beginPath(); ctx.arc(eP.x, eP.y, er, 0, 2 * PI); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.arc(eP.x, eP.y, er, a + PI / 2, a + 3 * PI / 2);
      ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = 'rgba(80,140,255,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(eP.x, eP.y, er, 0, 2 * PI); ctx.stroke();
    // מרידיאן הצופה — מרוחק ממרידיאן חצות היום כשיעור זוית השעה, ומקיף את
    // הכדור פעם ביממה. כשהוא פונה אל השמש — חצות היום; מנגד — חצות הלילה.
    { const obsLon = rev360(sunLon + sunHourAngle(date, st.lat, st.lon));
      const a = A(obsLon), ox = eP.x + er * Math.cos(a), oy = eP.y + er * Math.sin(a);
      ctx.strokeStyle = '#ff5a4d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(eP.x, eP.y); ctx.lineTo(ox, oy); ctx.stroke();
      ctx.fillStyle = '#ff5a4d';
      ctx.beginPath(); ctx.arc(ox, oy, 2.8, 0, 2 * PI); ctx.fill();
      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = labelCol('#ff5a4d');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(T('צופה'), eP.x + (er + 12) * Math.cos(a), eP.y + (er + 12) * Math.sin(a)); }
    // התווית מרוחקת מן הכדור כשיעור מסלול הירח, בכיוון השמש — שם היא פנויה
    // מתווית הצופה (שמקומה על שפת הכדור) ומן התווית שעל הרצועה שמנגד.
    { ctx.font = `bold ${Math.max(9, fontSize - 2)}px sans-serif`;
      ctx.fillStyle = labelCol('#4888ff');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const a = A(sunLon), d = er * 2.6 + 13;
      ctx.fillText(T('ארץ'), eP.x + d * Math.cos(a), eP.y + d * Math.sin(a)); }

    // ── הירח סביב הארץ — כיוונו אמיתי, ומרחקו מוגדל כדי שייראה ──
    { const mLon = rev360(lons.moon ?? 0), mr = er * 2.6;
      const a = A(mLon), mx = eP.x + mr * Math.cos(a), my = eP.y + mr * Math.sin(a);
      ctx.strokeStyle = isLight() ? 'rgba(60,60,60,0.22)' : 'rgba(200,200,200,0.20)';
      ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.arc(eP.x, eP.y, mr, 0, 2 * PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#c8c8c8';
      ctx.beginPath(); ctx.arc(mx, my, 3.6, 0, 2 * PI); ctx.fill();
      const sa = A(sunLon);                              // צד הלילה של הירח — כשל הארץ
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 3.6, 0, 2 * PI); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.arc(mx, my, 3.6, sa + PI / 2, sa + 3 * PI / 2);
      ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = labelCol('#c8c8c8');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(T('ירח'), mx + 11 * Math.cos(a), my + 11 * Math.sin(a)); }

    // ── תוויות על הרצועה ──
    const tagAt = (lon, r, txt, col) => {
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const p = px(lon, r), w = ctx.measureText(txt).width + 8, h = 16;
      const x = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, p.x));
      const y = Math.max(h / 2 + 2, Math.min(H - h / 2 - 2, p.y));
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = col; ctx.fillText(txt, x, y);
    };
    tagAt(sunLon, innerR - 16, T('כאן נראית השמש'), '#f5c842');
    tagAt(earthLon, innerR - 10, T('המזל שכנגד'), '#b8c8ff');

    // ── שורת ההסבר שבראש הבמה (הגופן מוקטן עד שהיא נכנסת ברוחב) ──
    { const txt = T('המזלות עומדים · הארץ מקיפה את השמש בשנה וסובבת סביב עצמה ביממה');
      let fs = 12; ctx.font = fs + 'px sans-serif';
      while (fs > 8 && ctx.measureText(txt).width > L.w - 10) { fs -= 0.5; ctx.font = fs + 'px sans-serif'; }
      ctx.fillStyle = cv('--ill-muted') || '#999';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(txt, L.x + L.w / 2, L.y + 6); }
  }

  // ══ פאנל מיקומים ══════════════════════════════════════════════════════
  function updateLegend(date) {
    const el = document.getElementById('z_legend'); if (!el) return;
    const lons = getLongitudes(date);
    el.innerHTML = BODIES.map(b => {
      const lon = lons[b.key]; if (lon === undefined) return '';
      const deg = Math.floor(((lon % 360) + 360) % 360);
      return `<div style="display:flex;gap:6px;align-items:center;padding:2px 0;font-size:0.75em">
        <span style="color:${b.color};font-weight:bold;min-width:40px">${T(b.he)}</span>
        <span style="flex:1">${T(signOf(lon))}</span>
        <span style="opacity:.6;direction:ltr;font-size:0.9em">${deg}°</span>
      </div>`;
    }).join('');
  }

  // ══ מצב האיור ══════════════════════════════════════════════════════════
  const $ = id => document.getElementById(id);

  const zodiac = {
    date: new Date(),
    playing: false,
    speed: 0.3,
    // מהירות נפרדת לכל יחידה: בסיבוב היומי אפילו שעה לשנייה מהירה מדי לעין,
    // ולכן הטווח שם עדין יותר (ברירת מחדל: יממה שלמה בכ-80 שניות).
    speeds: { day: 1, hour: 0.3 },
    RANGE: { day: { min: 0.1, max: 30, step: 0.1 }, hour: { min: 0.02, max: 6, step: 0.02 } },
    unit: 'hour',             // 'hour' — עליית המזלות ביממה (ברירת מחדל); 'day' — מהלך המזלות בשנה
    horizon: true,
    view: 'wheel',            // 'wheel' — מבט-על; 'observer' — הרצועה ברקיע; 'external' — כל המערכת מבחוץ
    viewAz: 270,              // כיוון המבט במבט הצופה (270 = פנים אל המזרח, כיוון הזריחה)
    lat: 31.78, lon: 35.24,
    _bound: false,

    step(dt) { this.date = new Date(this.date.getTime() + this.speed * dt * (this.unit === 'day' ? 86400000 : 3600000)); },

    draw() {
      const c = $('zodiacCanvas'); if (!c) return;
      const { ctx, W, H } = fit(c);
      // במבט הצופה האופק הוא עצם האיור — נקודות האופק מחושבות תמיד
      const hz = (this.horizon || this.view === 'observer') ? horizonPoints(this.date, this.lat, this.lon) : null;
      if (this.view === 'observer') drawObserver(ctx, W, H, this.date, this, hz);
      else if (this.view === 'external') drawExternal(ctx, W, H, this.date, this);
      else drawWheel(ctx, W, H, this.date, this.horizon ? hz : null);
      $('z_clock').textContent = this.date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      const zs = $('z_sun');
      if (zs) { const sl = getLongitudes(this.date).sun; zs.textContent = T(signOf(sl)) + ' ' + Math.floor(rev360(sl) % 30) + '°'; }
      $('z_asc').textContent = hz ? T(signOf(hz.asc)) + ' ' + Math.floor(hz.asc % 30) + '°' : '—';
      $('z_mc').textContent  = hz ? T(signOf(hz.mc))  + ' ' + Math.floor(hz.mc  % 30) + '°' : '—';
      // הקשת שבין אמצע הרקיע למזל העולה — משתנה במשך היממה (ראו ההערה בציור
      // קו אמצע הרקיע); הצגתה מבארת מדוע הקו נע ואינו ניצב לקו האופק.
      const za = $('z_arc');
      if (za) za.textContent = hz ? rev360(hz.asc - hz.mc).toFixed(0) + '°' : '—';
      const hud = $('z_date');
      if (hud) hud.textContent = this.date.toLocaleDateString(window.I18N ? window.I18N.dateLocale : 'he-IL', { day:'numeric', month:'long', year:'numeric' });
      const hudHe = $('z_date_he');
      if (hudHe) {
        const key = hebDisplayKey(this.date, this.lat, this.lon);
        if (_hebCache.has(key)) {
          hudHe.textContent = _hebCache.get(key);
        } else {
          fetchHebrewDate(this.date, this.lat, this.lon).then(s => { if (hudHe) hudHe.textContent = s; });
        }
      }
      updateLegend(this.date);
    },

    _syncDate() {
      const d = this.date;
      const set = (id, v) => { const el = $(id); if (el && !window.__fieldLocked(el)) el.value = v; };
      set('z_day', d.getDate()); set('z_month', d.getMonth() + 1); set('z_year', d.getFullYear());
      set('z_hh', d.getHours()); set('z_mi', d.getMinutes());
      const h = d.getHours() + d.getMinutes() / 60;
      set('z_hour', h.toFixed(2));
      $('z_hourL').textContent = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    },

    sync() { this._syncDate(); },

    _spdTxt() { return this.unit === 'day' ? this.speed.toFixed(1) : this.speed.toFixed(2); },

    // החלפת יחידת המהירות — כולל התאמת טווח המחוון והערך השמור לכל יחידה
    _setUnit(u) {
      this.unit = u;
      const r = this.RANGE[u], el = $('z_speed');
      el.min = r.min; el.max = r.max; el.step = r.step;
      this.speed = this.speeds[u]; el.value = this.speed;
      $('z_spdL').textContent = this._spdTxt();
      $('z_unitL').textContent = u === 'day' ? T('ימים') : T('שעות');
    },

    // קביעת השעה ביממה תוך שמירה על התאריך
    _setHour(h) {
      const d = new Date(this.date);
      d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
      this.date = d;
    },

    bind() {
      if (this._bound) return; this._bound = true;
      this._syncDate();
      $('z_play').onclick   = e => { this.playing = !this.playing; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      $('z_today').onclick  = () => { this.date = new Date(); this.playing = false; $('z_play').textContent = T('▶ הפעל'); this._syncDate(); };
      $('z_speed').oninput  = e => { this.speed = this.speeds[this.unit] = +e.target.value; $('z_spdL').textContent = this._spdTxt(); };
      $('z_go').onclick     = () => {
        const y = +$('z_year').value, m = +$('z_month').value, d = +$('z_day').value;
        const hh = +$('z_hh').value || 0, mi = +$('z_mi').value || 0;
        this.date = new Date(y, m - 1, d, hh, mi, 0);
        this.playing = false; $('z_play').textContent = T('▶ הפעל');
      };
      $('z_hour').oninput = e => { this._setHour(+e.target.value); this.playing = false; $('z_play').textContent = T('▶ הפעל'); };
      // ראשי חודשים — קפיצה לא' בחודש הקרוב, תוך שמירת השעה הנוכחית
      document.querySelectorAll('#view-zodiac [data-rh]').forEach(b => b.onclick = () => {
        const d = nextRoshChodesh(b.dataset.rh);
        if (!d) return;
        const cur = this.date;
        this.date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), cur.getHours(), cur.getMinutes(), 0);
        this.playing = false; $('z_play').textContent = T('▶ הפעל'); this._syncDate();
      });
      // זריחה / שקיעה / חצות — קפיצה אל האירוע האמיתי בתאריך ובמקום המוצגים
      document.querySelectorAll('#view-zodiac [data-sev]').forEach(b => b.onclick = () => {
        const kind = b.dataset.sev, d = dayEvent(kind, this.date, this.lat, this.lon);
        if (d) this.date = new Date(d.getTime());
        else this._setHour(TOD_FALLBACK[kind]);
        this.playing = false; $('z_play').textContent = T('▶ הפעל'); this._syncDate();
      });
      // ארבע התקופות — קפיצה אל רגע התקופה המדויק: הרגע שבו אורך השמש
      // מגיע ל-0/90/180/270 מעלות מלקה, בשנת התאריך המוצג (כמו בלשונית
      // מהלך השמש; משוב משתמשים — שמירת השעה הקודמת הרכיבה שעת אחה"צ
      // שרירותית על יום התקופה במקום רגעה האמיתי).
      document.querySelectorAll('#view-zodiac [data-tek]').forEach(b => b.onclick = () => {
        const d = tekufaDate(+b.dataset.tek, this.date.getFullYear());
        if (!d) return;
        this.date = new Date(d.getTime());
        this.playing = false; $('z_play').textContent = T('▶ הפעל'); this._syncDate();
      });
      $('z_horizon').onchange = e => this.horizon = e.target.checked;
      $('z_lat').oninput = e => this.lat = Math.max(-89, Math.min(89, +e.target.value || 0));
      $('z_lon').oninput = e => this.lon = Math.max(-180, Math.min(180, +e.target.value || 0));
      document.querySelectorAll('#view-zodiac .seg button[data-unit]').forEach(b => b.onclick = () => {
        document.querySelectorAll('#view-zodiac .seg button[data-unit]').forEach(x => x.classList.toggle('active', x === b));
        this._setUnit(b.dataset.unit);
      });
      this._setUnit('hour');
      // מבט-על על הגלגל ⇄ מבט הצופה על הרקיע
      // ההסבר שבכרטיס "מבט" מוצג לפי המבט הפעיל בלבד: כל פסקה מסומנת
      // ב-data-zexpl עם המבט שהיא מבארת, ומחליף המבט מציג רק את פסקאותיו
      const syncExpl = () => document.querySelectorAll('#view-zodiac [data-zexpl]')
        .forEach(p => { p.hidden = p.dataset.zexpl !== this.view; });
      const cnv = $('zodiacCanvas');
      document.querySelectorAll('#view-zodiac [data-zview]').forEach(b => b.onclick = () => {
        document.querySelectorAll('#view-zodiac [data-zview]').forEach(x => x.classList.toggle('active', x === b));
        this.view = b.dataset.zview;
        syncExpl();
        const obs = this.view === 'observer';
        const row = $('z_gazeRow'); if (row) row.style.display = obs ? '' : 'none';
        cnv.style.cursor = obs ? 'grab' : '';
      });
      syncExpl();
      const gaze = (id, az) => { const b = $(id); if (b) b.onclick = () => { this.viewAz = az; }; };
      gaze('z_gazeE', 270);   // פנים אל המזרח — המזלות עולים מלפנים
      gaze('z_gazeS', 0);     // פנים אל הדרום — הרצועה נמתחת ממזרח (משמאל) למערב
      // גרירה לסיבוב המבט סביב הצופה (~0.5° לפיקסל) — פעילה במבט הצופה בלבד
      { let dragging = false, dragX = 0, dragAz = 0;
        cnv.onpointerdown = e => { if (this.view !== 'observer') return; dragging = true; dragX = e.clientX; dragAz = this.viewAz; cnv.setPointerCapture(e.pointerId); cnv.style.cursor = 'grabbing'; };
        cnv.onpointermove = e => { if (!dragging) return; this.viewAz = rev360(dragAz + (e.clientX - dragX) * 0.5); window.__invalidate && window.__invalidate(); };
        cnv.onpointerup = cnv.onpointercancel = () => { if (!dragging) return; dragging = false; cnv.style.cursor = 'grab'; }; }
    },
  };

  // חשיפת מעצב התאריך העברי (גימטריה + מטמון + גבול יום בשקיעה + "אור ל־"
  // בלילה) לשימוש משותף. key חשוף לקוראים הממטמנים לפי מפתח-יום — שיתחלף
  // להם בשקיעה ובעלות השחר, ולא בחצות.
  window.HebrewDate = fetchHebrewDate;
  window.HebrewDate.civilDay = hebCivilDay;
  window.HebrewDate.key = hebDisplayKey;

  // ══ הרשמה ב-window.Sims ════════════════════════════════════════════════
  window.Sims.zodiac = zodiac;
  const _ccc = window.Sims.clearColorCache;
  window.Sims.clearColorCache = () => { _ccc && _ccc(); clearColorCache(); };
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
})();
