// zodiac-sim.js — גלגל המלקה והמזלות
// מציג את מיקומי השמש, הירח וכוכבי הלכת על גלגל המזלות (מבט גאוצנטרי מעמוד העולם).
// 0° טלה = ימין; הגלגל מתקדם נגד כיוון השעון (מזרחה).
"use strict";
(function () {
  const AE = window.Astronomy;
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
    { key: 'mercury', he: 'חמה',    color: '#a09080', r: 4 },
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

  // תאריך עברי — מ-Otzaria calendar API; fallback: Intl עם לוח עברי
  const _hebFmt = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
  const _hebCache = new Map(); // ms → string

  async function fetchHebrewDate(date) {
    const ms = date.getTime();
    if (_hebCache.has(ms)) return _hebCache.get(ms);
    try {
      const iso = date.toISOString().slice(0, 10);
      const res = await Otzaria.call('calendar.getJewishDate', { date: iso });
      if (res && res.success && res.data) {
        const { day, monthName, year } = res.data;
        const str = `${hebDay(day)} ${monthName} ${hebYear(year)}`;
        _hebCache.set(ms, str);
        return str;
      }
    } catch (_) {}
    // fallback אם Otzaria לא זמינה (למשל בפיתוח) — parse מ-Intl ומשתמש בגימטריה
    try {
      const parts = _hebFmt.formatToParts(date);
      const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
      const str = `${hebDay(+p.day)} ${p.month} ${hebYear(+p.year)}`;
      _hebCache.set(ms, str); return str;
    } catch (_) { return ''; }
  }

  // ══ ציור ══════════════════════════════════════════════════════════════

  // אורך מלקה → זווית קנבס: 0° = ימין, גדל נגד כיוון השעון
  function L2A(lon) { return -lon * RAD; }

  function drawWheel(ctx, W, H, date) {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const maxR  = Math.min(W, H) * 0.46;
    const outerR = maxR;
    const innerR = maxR * 0.74;
    const bodyR  = maxR * 0.54;

    // ── רקע כללי ──
    ctx.fillStyle = cv('--ill-bg') || '#060616';
    ctx.beginPath(); ctx.arc(cx, cy, outerR + 2, 0, 2 * PI); ctx.fill();

    // ── רינג 12 מזלות ──
    for (let i = 0; i < 12; i++) {
      const a0 = L2A(i * 30), a1 = L2A((i + 1) * 30);
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
      const a = L2A(i * 30);
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
      const midA = L2A(i * 30 + 15);
      ctx.fillStyle = cv('--ill-text') || '#e0e0e0';
      ctx.fillText(SIGNS[i], cx + labelR * Math.cos(midA), cy + labelR * Math.sin(midA));
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
    ctx.strokeStyle = 'rgba(255,200,80,0.35)';
    ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + innerR - 2, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,200,80,0.7)';
    ctx.font = `${Math.max(8, fontSize - 2)}px sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('↑ 0° טלה', cx + innerR + 4, cy);

    // ── גרמי שמים ──
    const lons = getLongitudes(date);

    for (let i = 0; i < BODIES.length; i++) {
      const body = BODIES[i];
      const ang = L2A(lons[body.key] ?? 0);
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
      ctx.fillText(body.he, x + (dx / d) * (body.r + 13), y + (dy / d) * (body.r + 13));
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
    ctx.fillText('ארץ', cx, cy + eR + 4);
  }

  // ══ פאנל מיקומים ══════════════════════════════════════════════════════
  function updateLegend(date) {
    const el = document.getElementById('z_legend'); if (!el) return;
    const lons = getLongitudes(date);
    el.innerHTML = BODIES.map(b => {
      const lon = lons[b.key]; if (lon === undefined) return '';
      const deg = Math.floor(((lon % 360) + 360) % 360);
      return `<div style="display:flex;gap:6px;align-items:center;padding:2px 0;font-size:0.75em">
        <span style="color:${b.color};font-weight:bold;min-width:40px">${b.he}</span>
        <span style="flex:1">${signOf(lon)}</span>
        <span style="opacity:.6;direction:ltr;font-size:0.9em">${deg}°</span>
      </div>`;
    }).join('');
  }

  // ══ מצב האיור ══════════════════════════════════════════════════════════
  const $ = id => document.getElementById(id);

  const zodiac = {
    date: new Date(),
    playing: false,
    speed: 1,
    _bound: false,

    step(dt) { this.date = new Date(this.date.getTime() + this.speed * dt * 86400000); },

    draw() {
      const c = $('zodiacCanvas'); if (!c) return;
      const { ctx, W, H } = fit(c);
      drawWheel(ctx, W, H, this.date);
      const hud = $('z_date');
      if (hud) hud.textContent = this.date.toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' });
      const hudHe = $('z_date_he');
      if (hudHe) {
        const ms = this.date.getTime();
        if (_hebCache.has(ms)) {
          hudHe.textContent = _hebCache.get(ms);
        } else {
          fetchHebrewDate(this.date).then(s => { if (hudHe) hudHe.textContent = s; });
        }
      }
      updateLegend(this.date);
    },

    _syncDate() {
      const d = this.date;
      const dy = $('z_day'), dm = $('z_month'), dyr = $('z_year');
      if (dy  && document.activeElement !== dy)  dy.value  = d.getDate();
      if (dm  && document.activeElement !== dm)  dm.value  = d.getMonth() + 1;
      if (dyr && document.activeElement !== dyr) dyr.value = d.getFullYear();
    },

    sync() { this._syncDate(); },

    bind() {
      if (this._bound) return; this._bound = true;
      this._syncDate();
      $('z_play').onclick   = e => { this.playing = !this.playing; e.target.textContent = this.playing ? '⏸ השהה' : '▶ הפעל'; };
      $('z_today').onclick  = () => { this.date = new Date(); this.playing = false; $('z_play').textContent = '▶ הפעל'; this._syncDate(); };
      $('z_speed').oninput  = e => { this.speed = +e.target.value; $('z_spdL').textContent = (+e.target.value).toFixed(1); };
      $('z_go').onclick     = () => {
        const y = +$('z_year').value, m = +$('z_month').value, d = +$('z_day').value;
        this.date = new Date(y, m - 1, d, 12, 0, 0);
        this.playing = false; $('z_play').textContent = '▶ הפעל';
      };
    },
  };

  // חשיפת מעצב התאריך העברי (גימטריה + מטמון + נפילה ל-Intl) לשימוש משותף
  window.HebrewDate = fetchHebrewDate;

  // ══ הרשמה ב-window.Sims ════════════════════════════════════════════════
  window.Sims.zodiac = zodiac;
  const _ccc = window.Sims.clearColorCache;
  window.Sims.clearColorCache = () => { _ccc && _ccc(); clearColorCache(); };
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
})();
