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
  const EPS = 23.4392911;
  function horizonPoints(date, lat, lon) {
    let gast;
    try { gast = AE.SiderealTime(AE.MakeTime(date)); } catch (_) { return null; }
    const th = rev360(gast * 15 + lon) * RAD, ph = lat * RAD, ep = EPS * RAD;
    const asc = rev360(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(ep) + Math.tan(ph) * Math.sin(ep))) / RAD);
    const mc  = rev360(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(ep)) / RAD);
    return { asc, mc };
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
  // היום האזרחי שהתאריך העברי שלו הוא תאריכו של הרגע הנתון
  function hebCivilDay(date, lat, lon) {
    const set = sunsetOf(date, lat === undefined ? 31.78 : lat, lon === undefined ? 35.22 : lon);
    return set && date >= set ? new Date(date.getTime() + 86400000) : date;
  }

  const _hebCache = new Map(); // יום אזרחי אפקטיבי (civilKey) → string

  async function fetchHebrewDate(date, lat, lon) {
    const d = hebCivilDay(date, lat, lon);
    const key = civilKey(d);
    if (_hebCache.has(key)) return _hebCache.get(key);
    try {
      // תאריך מקומי דווקא — toISOString הוא UTC, ובקיץ הזיז את גבול היום ל-3:00
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await Otzaria.call('calendar.getJewishDate', { date: iso });
      if (res && res.success && res.data) {
        const { day, monthName, year } = res.data;
        const str = `${hebDay(day)} ${monthName} ${hebYear(year)}`;
        _hebCache.set(key, str);
        return str;
      }
    } catch (_) {}
    // fallback אם Otzaria לא זמינה (למשל בפיתוח) — חשבון המולד שלנו.
    // לוח ה-Intl שימש כאן קודם, ונזנח: הוא סוטה ביום אחד בשנים שמולד תשרי
    // שלהן חל ביום א׳ בין שעה 15 ל-18 והשנה שלפניהן מעוברת (ראו js/hebrew-calendar.js).
    try {
      const str = window.HebCal.formatHebrewDate(d);
      if (str) _hebCache.set(key, str);
      return str;
    } catch (_) { return ''; }
  }

  // ══ ציור ══════════════════════════════════════════════════════════════

  // אורך מלקה → זווית קנבס: 0° = ימין, גדל נגד כיוון השעון
  function L2A(lon) { return -lon * RAD; }

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
    const fontSize = Math.max(9, Math.min(13, maxR * 0.073));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const labelR = (innerR + outerR) / 2;
    for (let i = 0; i < 12; i++) {
      const midA = A(i * 30 + 15);
      ctx.fillStyle = cv('--ill-text') || '#e0e0e0';
      ctx.fillText(T(SIGNS[i]), cx + labelR * Math.cos(midA), cy + labelR * Math.sin(midA));
    }

    // מסגרות רינג
    ctx.strokeStyle = cv('--ill-line') || 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, 2 * PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, 2 * PI); ctx.stroke();

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
    ctx.fillStyle = 'rgba(255,200,80,0.7)';
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
      // קו אמצע הרקיע (חצי השמים) — מהמרכז כלפי מעלה
      const aM = A(hz.mc);
      ctx.strokeStyle = 'rgba(126,224,129,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + outerR * Math.cos(aM), cy + outerR * Math.sin(aM)); ctx.stroke();
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
      ctx.fillStyle = body.color;
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
    lat: 31.78, lon: 35.22,
    _bound: false,

    step(dt) { this.date = new Date(this.date.getTime() + this.speed * dt * (this.unit === 'day' ? 86400000 : 3600000)); },

    draw() {
      const c = $('zodiacCanvas'); if (!c) return;
      const { ctx, W, H } = fit(c);
      const hz = this.horizon ? horizonPoints(this.date, this.lat, this.lon) : null;
      drawWheel(ctx, W, H, this.date, hz);
      $('z_clock').textContent = this.date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      $('z_asc').textContent = hz ? T(signOf(hz.asc)) + ' ' + Math.floor(hz.asc % 30) + '°' : '—';
      $('z_mc').textContent  = hz ? T(signOf(hz.mc))  + ' ' + Math.floor(hz.mc  % 30) + '°' : '—';
      const hud = $('z_date');
      if (hud) hud.textContent = this.date.toLocaleDateString(window.I18N ? window.I18N.dateLocale : 'he-IL', { day:'numeric', month:'long', year:'numeric' });
      const hudHe = $('z_date_he');
      if (hudHe) {
        const key = civilKey(hebCivilDay(this.date, this.lat, this.lon));
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
      // בוקר / לילה — קביעת השעה בלבד, התאריך נשמר
      document.querySelectorAll('#view-zodiac [data-tod]').forEach(b => b.onclick = () => {
        this._setHour(+b.dataset.tod);
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
    },
  };

  // חשיפת מעצב התאריך העברי (גימטריה + מטמון + גבול יום בשקיעה) לשימוש משותף.
  // civilDay חשוף לקוראים הממטמנים לפי מפתח-יום — שיתחלף להם בשקיעה ולא בחצות.
  window.HebrewDate = fetchHebrewDate;
  window.HebrewDate.civilDay = hebCivilDay;

  // ══ הרשמה ב-window.Sims ════════════════════════════════════════════════
  window.Sims.zodiac = zodiac;
  const _ccc = window.Sims.clearColorCache;
  window.Sims.clearColorCache = () => { _ccc && _ccc(); clearColorCache(); };
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
})();
