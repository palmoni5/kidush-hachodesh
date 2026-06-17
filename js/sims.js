// שלושת האיורים: מופעי הירח, מהלך השמש (שנת חמה), מיקום כוכבי הלכת.
// כל הצבעים נקראים ממשתני CSS (var) — תואם ערכת הנושא של אוצריא.
"use strict";
window.Sims = (function () {
  const A = window.Astro, AS = window.ASSETS;
  // מטמון לערכי משתני CSS — getComputedStyle יקר (מכריח חישוב-סגנון).
  // מתאפס רק כשערכת הנושא/הרקע משתנים (clearColorCache).
  const _cvCache = Object.create(null);
  const cv = n => {
    let v = _cvCache[n];
    if (v === undefined) v = _cvCache[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return v;
  };
  function clearColorCache() { for (const k in _cvCache) delete _cvCache[k]; }
  const $ = id => document.getElementById(id);
  function mkImg(src) { const i = new Image(); i.src = src; return i; }
  const IMG = { sun: mkImg(AS.moon_sun), earth: mkImg(AS.moon_earth), moon: mkImg(AS.moon_moon), planets: {} };
  for (const k of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune'])
    IMG.planets[k] = mkImg(AS['planet_' + k]);

  // מטמון מידות הקנבס — getBoundingClientRect מכריח layout, ולכן נמדד רק
  // פעם אחת לכל קנבס. מתאפס על שינוי גודל בלבד (clearFitCache מ-ResizeObserver).
  const _fitCache = new Map();
  function clearFitCache() { _fitCache.clear(); }
  function fit(canvas) {
    let c = _fitCache.get(canvas);
    if (!c) {
      const r = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(280, r.width), H = Math.max(240, r.height);
      const ctx = canvas.getContext('2d');
      if (canvas.width !== Math.round(W * dpr)) canvas.width = Math.round(W * dpr);
      if (canvas.height !== Math.round(H * dpr)) canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // נשמר על הקונטקסט בין פריימים
      c = { ctx, W, H };
      _fitCache.set(canvas, c);
    }
    return c;
  }
  function sprite(ctx, im, cx, cy, w, h) {
    if (im.complete && im.naturalWidth) ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    else { ctx.fillStyle = cv('--ill-muted'); ctx.beginPath(); ctx.arc(cx, cy, w / 2, 0, 2 * Math.PI); ctx.fill(); }
  }
  // גיל הירח היום (ימים מאז מולד) לפי מולד ידוע — 6.1.2000 18:14 UT
  function moonAgeToday() {
    const refNew = Date.UTC(2000, 0, 6, 18, 14, 0);
    return ((((Date.now() - refNew) / 86400000) % A.SYNODIC) + A.SYNODIC) % A.SYNODIC;
  }
  // שורת הסבר עדינה (ללא רקע) למעלה — מוצגת בזמן השהיה
  function drawHint(ctx, W) {
    ctx.fillStyle = cv('--ill-muted'); ctx.font = '12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('לחצו ▶ הפעל כדי להניע את הסיבוב', W / 2, 8);
  }
  // יום בשנת החמה (מתקופת ניסן) ושעה נוכחית — שוויון אביב ~20.3
  function solarToday() {
    const springRef = Date.UTC(2000, 2, 20, 7, 35, 0), now = new Date();
    const dayY = ((((now.getTime() - springRef) / 86400000) % A.SOLAR_YEAR) + A.SOLAR_YEAR) % A.SOLAR_YEAR;
    return { dayY, hour: now.getHours() + now.getMinutes() / 60 };
  }

  // ════════════════ מופעי הירח ════════════════
  const moon = {
    day: 0, speed: 2, playing: false, hintDone: false, _bound: false,
    step(dt) { if (this.playing) this.day = (this.day + this.speed * dt) % A.SYNODIC; },
    draw() {
      const { ctx, W, H } = fit($('moonCanvas'));
      ctx.clearRect(0, 0, W, H);
      const earthX = W * 0.60, earthY = H * 0.56, sunX = W * 0.13, sunY = earthY;
      const orbitR = Math.min(W, H) * 0.19;
      const ang = Math.PI + 2 * Math.PI * (this.day / A.SYNODIC);
      const mx = earthX + Math.cos(ang) * orbitR, my = earthY + Math.sin(ang) * orbitR;
      // קרני שמש (עד אזור הארץ/הירח בלבד) + מסלול
      const rayEnd = earthX + orbitR + 26;
      ctx.strokeStyle = cv('--ill-ray'); ctx.lineWidth = 1;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(sunX + 30, sunY + k * 20); ctx.lineTo(rayEnd, sunY + k * 20); ctx.stroke(); }
      ctx.strokeStyle = cv('--ill-line'); ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(earthX, earthY, orbitR, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = cv('--ill-grid'); ctx.beginPath(); ctx.moveTo(earthX, earthY); ctx.lineTo(mx, my); ctx.stroke();
      // שמש
      const g = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 70);
      g.addColorStop(0, cv('--ill-sun-glow')); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sunX, sunY, 70, 0, 2 * Math.PI); ctx.fill();
      sprite(ctx, IMG.sun, sunX, sunY, 66, 66);
      // ארץ + ירח עם חצי מוצל
      sprite(ctx, IMG.earth, earthX, earthY, 42, 42); shade(ctx, earthX, earthY, 21, sunX, sunY);
      sprite(ctx, IMG.moon, mx, my, 22, 22); shade(ctx, mx, my, 11, sunX, sunY);
      ctx.fillStyle = cv('--ill-text'); ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('הארץ', earthX, earthY + 30); ctx.fillText('הירח', mx, my - 16);
      // תצוגת הירח כפי שנראה מהארץ (אינסט בפינה ימנית-תחתונה, הרחק מה-HUD)
      const vR = Math.min(W, H) * 0.15, vx = W - vR - 20, vy = H - vR - 22;
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('הירח מכדור הארץ', vx, vy - vR - 9);
      drawPhase(ctx, vx, vy, vR, this.day);
      if (!this.hintDone) drawHint(ctx, W);
      // HUD
      const pct = Math.round(A.moonIllum(this.day) * 100);
      $('m_day').textContent = Math.floor(this.day % A.SYNODIC) + 1;
      $('m_pct').textContent = pct + '%';
      $('m_phase').textContent = A.moonPhaseLabel(this.day);
    },
    bind() {
      if (this._bound) return; this._bound = true;
      this.day = moonAgeToday();   // ברירת מחדל: מצב הירח היום
      $('m_play').onclick = e => { this.playing = !this.playing; this.hintDone = true; e.target.textContent = this.playing ? '⏸ השהה' : '▶ הפעל'; };
      $('m_reset').onclick = () => { this.day = 0; };
      $('m_today').onclick = () => { this.day = moonAgeToday(); this.playing = false; $('m_play').textContent = '▶ הפעל'; };
      $('m_speed').oninput = e => { this.speed = +e.target.value; $('m_spdL').textContent = this.speed.toFixed(1); };
      $('m_scrub').oninput = e => { this.day = +e.target.value; this.playing = false; $('m_play').textContent = '▶ הפעל'; };
    },
    sync() { if (document.activeElement !== $('m_scrub')) $('m_scrub').value = (this.day % A.SYNODIC).toFixed(2); },
  };
  function shade(ctx, cx, cy, r, sunX, sunY) {
    const a = Math.atan2(cy - sunY, cx - sunX);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.clip();
    ctx.fillStyle = cv('--ill-night'); ctx.beginPath(); ctx.arc(cx, cy, r, a - Math.PI / 2, a + Math.PI / 2); ctx.fill(); ctx.restore();
  }
  function drawPhase(ctx, cx, cy, R, day) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
    sprite(ctx, IMG.moon, cx, cy, 2 * R, 2 * R);
    const theta = 2 * Math.PI * (day % A.SYNODIC) / A.SYNODIC, a = R * Math.cos(theta);
    const waning = A.moonWaning(day), limb = waning ? -1 : 1, term = waning ? 1 : -1, N = 72;
    ctx.fillStyle = cv('--ill-night'); ctx.beginPath();
    for (let i = 0; i <= N; i++) { const u = Math.PI * i / N; ctx.lineTo(cx + limb * R * Math.sin(u), cy - R * Math.cos(u)); }
    for (let i = N; i >= 0; i--) { const u = Math.PI * i / N; ctx.lineTo(cx + term * a * Math.sin(u), cy - R * Math.cos(u)); }
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.strokeStyle = cv('--ill-line'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
  }

  // ════════════════ מהלך השמש — שנת חמה ════════════════
  const BETA = 24;
  const year = {
    hour: 12, dayY: 0, lat: 31.78, speed: 2, playing: false, auto: true, viewAz: 0, hintDone: false, _bound: false,
    step(dt) { if (this.playing) { this.hour += this.speed * dt; if (this.hour >= 24) { this.hour -= 24; if (this.auto) this.dayY = (this.dayY + 1) % A.SOLAR_YEAR; } } },
    proj(v, cx, cy, R) {
      const a = this.viewAz * Math.PI / 180, b = BETA * Math.PI / 180;
      const E = v.E * Math.cos(a) - v.N * Math.sin(a), N = v.E * Math.sin(a) + v.N * Math.cos(a);
      return { x: cx - R * E, y: cy - R * (v.U * Math.cos(b) - N * Math.sin(b)) };
    },
    circle(ctx, dec, cx, cy, R, upCol, w) {
      let prev = null;
      for (let H = 0; H <= 360.001; H += 3) {
        const v = A.sunHorizon(H, dec, this.lat), p = this.proj(v, cx, cy, R);
        if (prev) {
          const above = prev.U > 0 && v.U > 0;
          ctx.strokeStyle = above ? upCol : withA(upCol, 0.22); ctx.lineWidth = w;
          ctx.setLineDash(above ? [] : [4, 5]); ctx.beginPath(); ctx.moveTo(prev.p.x, prev.p.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        prev = { p, U: v.U };
      }
      ctx.setLineDash([]);
    },
    draw() {
      const { ctx, W, H } = fit($('yearCanvas'));
      ctx.clearRect(0, 0, W, H);
      // cy מוסט מעט מטה ו-R מוקטן כדי לפנות מקום לשורת ההסבר בראש (פסגת המסלול במרכז-עליון)
      const cx = W / 2, cy = H / 2 + 12, R = Math.min(W * 0.40, (H - 54) / 2), yR = R * Math.sin(BETA * Math.PI / 180);
      const dec = A.solarDecl(this.dayY);
      ctx.strokeStyle = cv('--ill-horizon'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, R, yR, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = cv('--ill-text'); ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [az, lbl] of [[180, 'דרום'], [0, 'צפון'], [90, 'מזרח'], [270, 'מערב']]) {
        const rd = az * Math.PI / 180, p = this.proj({ E: 1.15 * Math.sin(rd), N: 1.15 * Math.cos(rd), U: 0 }, cx, cy, R);
        ctx.fillText(lbl, p.x, p.y);
      }
      // ציר העולם
      const pole = this.proj({ E: 0, N: Math.cos(this.lat * Math.PI / 180), U: Math.sin(this.lat * Math.PI / 180) }, cx, cy, R);
      ctx.strokeStyle = cv('--ill-grid'); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pole.x, pole.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.fillText('ציר העולם', pole.x, pole.y - 10);
      // מסלולי ייחוס + תוויות
      this.circle(ctx, 23.44, cx, cy, R, cv('--ill-summer'), 1.2);
      this.circle(ctx, 0, cx, cy, R, cv('--ill-text'), 1.2);
      this.circle(ctx, -23.44, cx, cy, R, cv('--ill-winter'), 1.2);
      for (const [dc, lbl, col] of [[23.44, 'קיץ', cv('--ill-summer')], [0, 'שוויון', cv('--ill-text')], [-23.44, 'חורף', cv('--ill-winter')]]) {
        const tp = this.proj(A.sunHorizon(0, dc, this.lat), cx, cy, R);
        ctx.fillStyle = col; ctx.font = '11px sans-serif'; ctx.fillText(lbl, tp.x + 24, tp.y - 2);
      }
      // המסלול הנוכחי
      const s = this.season();
      this.circle(ctx, dec, cx, cy, R, cv(s.c), 2.6);
      // השמש
      const Hh = (this.hour - 12) * 15, v = A.sunHorizon(Hh, dec, this.lat), p = this.proj(v, cx, cy, R), up = v.U > 0, sR = up ? 17 : 13;
      if (up) { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, sR * 2.4); g.addColorStop(0, cv('--ill-sun-glow')); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, sR * 2.4, 0, 2 * Math.PI); ctx.fill(); }
      ctx.globalAlpha = up ? 1 : 0.5; sprite(ctx, IMG.sun, p.x, p.y, 2 * sR, 2 * sR); ctx.globalAlpha = 1;
      ctx.fillStyle = cv('--ill-muted'); ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * Math.PI); ctx.fill();
      if (!this.hintDone) drawHint(ctx, W);
      this.hud(v.U);
    },
    season() {
      const t = ((this.dayY % A.SOLAR_YEAR) + A.SOLAR_YEAR) % A.SOLAR_YEAR;
      if (t < 91.31) return { n: 'אביב · ניסן', c: '--ill-spring' };
      if (t < 182.62) return { n: 'קיץ · תמוז', c: '--ill-summer' };
      if (t < 273.94) return { n: 'סתיו · תשרי', c: '--ill-autumn' };
      return { n: 'חורף · טבת', c: '--ill-winter' };
    },
    hud(Unow) {
      const dec = A.solarDecl(this.dayY), phi = this.lat;
      const altNow = Math.asin(Unow) * 180 / Math.PI;
      const midAlt = Math.asin(A.sunHorizon(180, dec, phi).U) * 180 / Math.PI;
      const dl = A.dayLengthHours(dec, phi), s = this.season();
      $('y_clock').textContent = fmtH(this.hour);
      $('y_updown').textContent = altNow > 0 ? 'השמש מעל האופק ☀' : 'השמש מתחת לאופק 🌙';
      $('y_alt').textContent = altNow.toFixed(0) + '°';
      $('y_season').textContent = s.n;
      $('y_daylen').textContent = fmtH(dl);
      $('y_mid').textContent = midAlt.toFixed(0) + '°';
    },
    faceLabel() {
      const f = (((this.viewAz + 180) % 360) + 360) % 360;
      const names = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
      const off = ((this.viewAz % 360) + 360) % 360, sgn = off > 180 ? off - 360 : off;
      return names[Math.round(f / 45) % 8] + (sgn ? ` (${sgn > 0 ? '+' : ''}${sgn}°)` : '');
    },
    sync() {
      $('y_spdL').textContent = this.speed; $('y_hourL').textContent = fmtH(this.hour); $('y_dayL').textContent = Math.floor(this.dayY);
      $('y_azL').textContent = this.faceLabel();
      if (document.activeElement !== $('y_hour')) $('y_hour').value = this.hour;
      if (document.activeElement !== $('y_dayY')) $('y_dayY').value = this.dayY;
    },
    bind() {
      if (this._bound) return; this._bound = true;
      { const t = solarToday(); this.dayY = t.dayY; this.hour = t.hour; }   // ברירת מחדל: היום והשעה הנוכחיים
      $('y_play').onclick = e => { this.playing = !this.playing; this.hintDone = true; e.target.textContent = this.playing ? '⏸ השהה' : '▶ הפעל'; };
      $('y_today').onclick = () => { const t = solarToday(); this.dayY = t.dayY; this.hour = t.hour; this.playing = false; $('y_play').textContent = '▶ הפעל'; };
      $('y_noon').onclick = () => { this.hour = 12; };
      $('y_midnight').onclick = () => { this.hour = 0; };
      $('y_speed').oninput = e => this.speed = +e.target.value;
      $('y_hour').oninput = e => { this.hour = +e.target.value; this.playing = false; $('y_play').textContent = '▶ הפעל'; };
      $('y_dayY').oninput = e => this.dayY = +e.target.value;
      $('y_lat').oninput = e => this.lat = +e.target.value || 0;
      $('y_auto').onchange = e => this.auto = e.target.checked;
      $('y_rotR').onclick = () => { this.viewAz = (this.viewAz + 10) % 360; };
      $('y_rotL').onclick = () => { this.viewAz = (this.viewAz - 10 + 360) % 360; };
      $('y_rot0').onclick = () => { this.viewAz = 0; };
      document.querySelectorAll('#view-year .seg button').forEach(b => b.onclick = () => this.dayY = +b.dataset.d);
    },
  };
  function withA(col, a) { // הוספת אלפא לצבע hex/rgb שנקרא מ-CSS
    if (col.startsWith('#')) { const n = parseInt(col.slice(1, 7), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
    const m = col.match(/\d+(\.\d+)?/g); return m ? `rgba(${m[0]},${m[1]},${m[2]},${a})` : col;
  }
  function fmtH(h) { const m = Math.round((((h % 24) + 24) % 24) * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }

  // ════════════════ מיקום כוכבי הלכת ════════════════
  const BODIES = [
    { k: 'sun', n: 'שמש' }, { k: 'moon', n: 'ירח' }, { k: 'mercury', n: 'כוכב חמה' },
    { k: 'venus', n: 'נוגה' }, { k: 'mars', n: 'מאדים' }, { k: 'jupiter', n: 'צדק' },
    { k: 'saturn', n: 'שבתאי' }, { k: 'uranus', n: 'אורנוס' }, { k: 'neptune', n: 'נפטון' },
  ];
  const planets = {
    sky: null, lat: 31.78, lon: 35.22, _bound: false,
    step() {},
    inputToUTC() {
      const Y = +$('p_year').value, M = +$('p_month').value, D = +$('p_day').value, h = +$('p_hour').value, mi = +$('p_min').value;
      const off = $('p_dst').checked ? 3 : 2;
      return new Date(Date.UTC(Y, M - 1, D, h - off, mi, 0));
    },
    compute() { this.lat = +$('p_lat').value; this.lon = +$('p_lon').value; this.sky = A.computeSky(this.inputToUTC(), this.lat, this.lon); this.legend(); },
    draw() {
      const { ctx, W, H } = fit($('planetsCanvas'));
      ctx.clearRect(0, 0, W, H);
      const s = Math.min(W, H), cx = W / 2, cy = H / 2, R = s / 2 - 34;
      ctx.strokeStyle = cv('--ill-grid'); ctx.lineWidth = 1;
      for (const alt of [30, 60]) { const rr = (90 - alt) / 90 * R; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.strokeStyle = cv('--ill-horizon'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = cv('--ill-text'); ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('צפון', cx, cy - R - 14); ctx.fillText('דרום', cx, cy + R + 14);
      ctx.fillText('מזרח', cx - R - 16, cy); ctx.fillText('מערב', cx + R + 16, cy);
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.fillText('זניט', cx + 16, cy - 12);
      if (!this.sky) return;
      for (const b of BODIES) {
        const o = this.sky[b.k]; if (o.alt <= 0) continue;
        const rr = (90 - o.alt) / 90 * R, x = cx - rr * Math.sin(o.az * Math.PI / 180), y = cy - rr * Math.cos(o.az * Math.PI / 180);
        const im = IMG.planets[b.k]; let w = b.k === 'sun' ? 28 : (b.k === 'saturn' ? 34 : 22), h = im.naturalWidth ? w * im.naturalHeight / im.naturalWidth : w;
        sprite(ctx, im, x, y, w, h);
        ctx.fillStyle = cv('--ill-text'); ctx.font = '12px sans-serif'; ctx.textBaseline = 'top'; ctx.fillText(b.n, x, y + h / 2 + 2);
        ctx.textBaseline = 'middle';
      }
    },
    legend() {
      const L = $('p_legend'); L.innerHTML = '';
      for (const b of BODIES) {
        const o = this.sky[b.k], up = o.alt > 0;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:3px 4px;font-size:0.72em;' + (up ? '' : 'opacity:.45');
        row.innerHTML = `<img src="${AS['planet_' + b.k]}" style="width:20px;height:20px;object-fit:contain" alt=""><span style="flex:1">${b.n}</span>` +
          `<span style="direction:ltr;opacity:.75">${up ? ('h ' + o.alt.toFixed(0) + '° · az ' + o.az.toFixed(0) + '°') : 'מתחת לאופק'}</span>`;
        L.appendChild(row);
      }
    },
    setNow() {
      const d = new Date(), m = d.getMonth() + 1;
      $('p_day').value = d.getDate(); $('p_month').value = m; $('p_year').value = d.getFullYear();
      $('p_hour').value = d.getHours(); $('p_min').value = d.getMinutes(); $('p_dst').checked = (m >= 4 && m <= 10);
    },
    bind() {
      if (this._bound) return; this._bound = true;
      $('p_lat').value = 31.78; $('p_lon').value = 35.22; this.setNow();
      $('p_go').onclick = () => this.compute();
      $('p_now').onclick = () => { this.setNow(); this.compute(); };
      this.compute();
    },
  };

  return { moon, year, planets, clearColorCache, clearFitCache };
})();
