// שלושת האיורים: מופעי הירח, מהלך השמש (שנת חמה), מיקום כוכבי הלכת.
// כל הצבעים נקראים ממשתני CSS (var) — תואם ערכת הנושא של אוצריא.
"use strict";
window.Sims = (function () {
  const A = window.Astro, AS = window.ASSETS;
  // מטמון לערכי משתני CSS — getComputedStyle יקר (מכריח חישוב-סגנון).
  // מתאפס רק כשערכת הנושא/הרקע משתנים (clearColorCache).
  // נקרא מ-document.body (ולא מ-documentElement): דריסת פלטת האיור הבהירה
  // מוגדרת על body.ill-light, ו-<html> שמעליו אינו יורש אותה — קריאה מ-<html>
  // הייתה מחזירה תמיד את צבעי הכהה (טקסט לבן) וכך הכיתובים נעלמו ברקע בהיר.
  const _cvCache = Object.create(null);
  const cv = n => {
    let v = _cvCache[n];
    if (v === undefined) v = _cvCache[n] = getComputedStyle(document.body).getPropertyValue(n).trim();
    return v;
  };
  function clearColorCache() { for (const k in _cvCache) delete _cvCache[k]; }
  const $ = id => document.getElementById(id);
  function mkImg(src) { const i = new Image(); i.src = src; return i; }
  const IMG = { sun: mkImg(AS.moon_sun), earth: mkImg(AS.moon_earth), moon: mkImg(AS.moon_moon), moonReal: mkImg(AS.moon_real), globe: mkImg(AS.globe_earth), planets: {} };
  for (const k of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune'])
    IMG.planets[k] = mkImg(AS['planet_' + k]);
  // טקסטורת כדור הארץ נטענת אסינכרונית — מבקשים ציור מחדש בסיום הטעינה כדי שלא יישאר הכדור בנפילה
  IMG.globe.onload = () => { try { window.__invalidate && window.__invalidate(); } catch (e) {} };

  // מטמון מידות הקנבס — getBoundingClientRect מכריח layout, ולכן נמדד רק
  // פעם אחת לכל קנבס. מתאפס על שינוי גודל בלבד (clearFitCache מ-ResizeObserver).
  const _fitCache = new Map();
  // מטמון פריסה: במסכים צרים ה-HUD נערם מעל הקנבס, ולכן שומרים מקום אנכי בראשו
  // כדי שהאיור (המרכזי) יצויר מתחתיו ולא יוסתר. מתאפס על שינוי גודל בלבד.
  const _layout = { yearTop: null, moonTop: null };
  function clearFitCache() { _fitCache.clear(); _layout.yearTop = null; _layout.moonTop = null; }
  // גובה ה-HUD ביחס לראש הבמה (במסכים צרים בלבד); אחרת מחזיר את ברירת המחדל.
  function hudInset(canvas, W, fallback) {
    if (W >= 760) return fallback;   // דסקטופ/טאבלט רחב — פריסה מקורית
    const stage = canvas.parentElement, hud = stage.querySelector('.hud');
    if (!hud) return fallback;
    const sr = stage.getBoundingClientRect();
    return Math.max(fallback, hud.getBoundingClientRect().bottom - sr.top + 8);
  }
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
  function drawHint(ctx, W, txt = 'לחצו ▶ הפעל כדי להניע את הסיבוב') {
    ctx.fillStyle = cv('--ill-muted'); ctx.font = '12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(txt, W / 2, 8);
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
      // במסך צר מורידים את כל ההרכב מתחת ל-HUD (top=0 בדסקטופ → פריסה מקורית)
      if (_layout.moonTop === null) _layout.moonTop = hudInset($('moonCanvas'), W, 0);
      const top = _layout.moonTop;
      const earthX = W * 0.60, earthY = top + (H - top) * 0.56, sunX = W * 0.13, sunY = earthY;
      const orbitR = Math.min(W, H - top) * 0.19;
      const ang = Math.PI - 2 * Math.PI * (this.day / A.SYNODIC);
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
      // ירח מצויר פשוט — יציב ברינדור (במקום תמונה זעירה שמרצדת בהקטנה)
      const mg = ctx.createRadialGradient(mx - 3, my - 3, 1, mx, my, 11);
      mg.addColorStop(0, '#f3f1ea'); mg.addColorStop(1, '#bdbbb1');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 11, 0, 2 * Math.PI); ctx.fill();
      shade(ctx, mx, my, 11, sunX, sunY);
      ctx.fillStyle = cv('--ill-text'); ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('הארץ', earthX, earthY + 30); ctx.fillText('הירח', mx, my - 16);
      // תצוגת הירח כפי שנראה מהארץ (אינסט בפינה ימנית-תחתונה, הרחק מה-HUD)
      const vR = Math.min(W, H) * 0.15, vx = W - vR - 20, vy = H - vR - 22;
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('הירח מכדור הארץ', vx, vy - vR - 14);
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
    ctx.fillStyle = cv('--ill-night'); ctx.beginPath(); ctx.arc(cx, cy, r + 1, a - Math.PI / 2, a + Math.PI / 2); ctx.fill(); ctx.restore();
  }
  // גוף הירח מצויר וקטורית — חד בכל קנה מידה (במקום תמונה זעירה מוגדלת ומטושטשת)
  // מראה סלעי: בסיס מוצלל, "ימות" (maria) כהים, ומכתשים עם שפה מוארת לתחושת עומק.
  function drawMoonDisc(ctx, cx, cy, R) {
    const g = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, R * 0.08, cx, cy, R);
    g.addColorStop(0, '#f3f1ea'); g.addColorStop(0.6, '#d3d1c7'); g.addColorStop(1, '#aeaca2');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
    // "ימות" — כתמים כהים גדולים ורכים
    ctx.fillStyle = 'rgba(118,116,106,0.30)';
    for (const [dx, dy, r] of [[-.22,-.18,.34],[.28,.10,.28],[-.05,.40,.26],[.34,-.34,.18]]) {
      ctx.beginPath(); ctx.arc(cx + dx * R, cy + dy * R, r * R, 0, 2 * Math.PI); ctx.fill();
    }
    // מכתשים — צל פנימי + שפה מוארת בצד שמאל-עליון
    for (const [dx, dy, r] of [[-.30,-.10,.13],[.22,.20,.11],[.06,-.40,.085],[-.20,.34,.10],
        [.40,-.18,.07],[.14,-.06,.055],[-.40,.12,.06],[.02,.16,.075],[.30,.40,.05],[-.12,-.34,.045]]) {
      const x = cx + dx * R, y = cy + dy * R, cr = r * R;
      ctx.fillStyle = 'rgba(94,92,84,0.34)';
      ctx.beginPath(); ctx.arc(x, y, cr, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(255,253,245,0.32)'; ctx.lineWidth = Math.max(0.6, cr * 0.18);
      ctx.beginPath(); ctx.arc(x, y, cr * 0.92, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
    }
  }
  function drawPhase(ctx, cx, cy, R, day) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
    // תצלום אמיתי של הירח (LRO/NASA, נחלת הכלל); נפילה לציור וקטורי עד שייטען
    if (IMG.moonReal.complete && IMG.moonReal.naturalWidth) {
      ctx.filter = 'brightness(1.5) contrast(0.9)';   // הבהרה — ירח לבן יותר
      ctx.drawImage(IMG.moonReal, cx - R, cy - R, 2 * R, 2 * R);
      ctx.filter = 'none';
    } else drawMoonDisc(ctx, cx, cy, R);
    const theta = 2 * Math.PI * (day % A.SYNODIC) / A.SYNODIC, a = R * Math.cos(theta);
    const waning = A.moonWaning(day), limb = waning ? 1 : -1, term = waning ? -1 : 1, N = 72;
    ctx.fillStyle = cv('--ill-night'); ctx.beginPath();
    for (let i = 0; i <= N; i++) { const u = Math.PI * i / N; ctx.lineTo(cx + limb * R * Math.sin(u), cy - R * Math.cos(u)); }
    for (let i = N; i >= 0; i--) { const u = Math.PI * i / N; ctx.lineTo(cx + term * a * Math.sin(u), cy - R * Math.cos(u)); }
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.strokeStyle = cv('--ill-line'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
  }

  // ════════════════ מהלך השמש — שנת חמה ════════════════
  const BETA = 24;
  const year = {
    hour: 12, dayY: 0, lat: 31.78, speed: 2, playing: false, auto: true, viewAz: 90, hintDone: false, _bound: false,
    step(dt) { if (this.playing) { this.hour += this.speed * dt; if (this.hour >= 24) { this.hour -= 24; if (this.auto) this.dayY = (this.dayY + 1) % A.SOLAR_YEAR; } } },
    proj(v, cx, cy, R) {
      const a = this.viewAz * Math.PI / 180, b = BETA * Math.PI / 180;
      const E = v.E * Math.cos(a) - v.N * Math.sin(a), N = v.E * Math.sin(a) + v.N * Math.cos(a);
      return { x: cx - R * E, y: cy - R * (v.U * Math.cos(b) - N * Math.sin(b)) };
    },
    circle(ctx, dec, cx, cy, R, upCol, w, occ) {
      let prev = null;
      for (let H = 0; H <= 360.001; H += 3) {
        const v = A.sunHorizon(H, dec, this.lat), p = this.proj(v, cx, cy, R), oc = occ ? occ(v, p) : false;
        if (prev && !(prev.oc && oc)) {       // דלג על קטע שכולו מאחורי כדור הארץ (מוסתר)
          const above = prev.U > 0 && v.U > 0;
          ctx.strokeStyle = above ? upCol : withA(upCol, 0.22); ctx.lineWidth = w;
          ctx.setLineDash(above ? [] : [4, 5]); ctx.beginPath(); ctx.moveTo(prev.p.x, prev.p.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        prev = { p, U: v.U, oc };
      }
      ctx.setLineDash([]);
    },
    draw() {
      const { ctx, W, H } = fit($('yearCanvas'));
      ctx.clearRect(0, 0, W, H);
      // cy מוסט מעט מטה ו-R מוקטן כדי לפנות מקום לשורת ההסבר בראש (פסגת המסלול במרכז-עליון).
      // במסכים צרים מורידים את מרכז המסלול מתחת ל-HUD כדי שלא יכסה את האיור.
      const cx = W / 2;
      let cy, R;
      if (W >= 760) { cy = H / 2 + 12; R = Math.min(W * 0.40, (H - 54) / 2); }
      else {
        if (_layout.yearTop === null) _layout.yearTop = hudInset($('yearCanvas'), W, 54);
        const usableH = H - _layout.yearTop - 10;
        cy = _layout.yearTop + usableH / 2; R = Math.min(W * 0.40, usableH / 2);
      }
      const yR = R * Math.sin(BETA * Math.PI / 180);
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
      // השמש (כיוון) + כדור הארץ. מציירים את הכדור תחילה, ואז את מסלולי השמיים והשמש מעליו עם
      // הסתרה (occlusion): מה שמאחורי הכדור (בצד הרחוק מהצופה) מוסתר על־ידו, ומה שלפניו מצויר מעליו.
      const s = this.season();
      const Hh = (this.hour - 12) * 15, v = A.sunHorizon(Hh, dec, this.lat), p = this.proj(v, cx, cy, R), up = v.U > 0, sR = up ? 17 : 13;
      const gR = Math.max(26, R * 0.2);
      const va = this.viewAz * Math.PI / 180, vb = BETA * Math.PI / 180;
      const ev = [Math.sin(va) * Math.cos(vb), Math.cos(va) * Math.cos(vb), Math.sin(vb)];   // כיוון הצופה (עומק)
      // נקודה מוסתרת אם היא נופלת בתוך דיסקת הכדור וגם בצדו הרחוק (רכיב עומק שלילי)
      const occ = (vd, pt) => { const dx = pt.x - cx, dy = pt.y - cy; return dx*dx + dy*dy < gR*gR && (vd.E*ev[0] + vd.N*ev[1] + vd.U*ev[2]) < 0; };
      drawGlobe(ctx, cx, cy, gR, v, this.viewAz, this.lat);
      // מסלולי ייחוס + תוויות
      this.circle(ctx, 23.44, cx, cy, R, cv('--ill-summer'), 1.2, occ);
      this.circle(ctx, 0, cx, cy, R, cv('--ill-text'), 1.2, occ);
      this.circle(ctx, -23.44, cx, cy, R, cv('--ill-winter'), 1.2, occ);
      for (const [dc, lbl, col] of [[23.44, 'קיץ', cv('--ill-summer')], [0, 'שוויון', cv('--ill-text')], [-23.44, 'חורף', cv('--ill-winter')]]) {
        const tp = this.proj(A.sunHorizon(0, dc, this.lat), cx, cy, R);
        ctx.fillStyle = col; ctx.font = '11px sans-serif'; ctx.fillText(lbl, tp.x + 24, tp.y - 2);
      }
      // המסלול הנוכחי
      this.circle(ctx, dec, cx, cy, R, cv(s.c), 2.6, occ);
      // השמש — מצוירת מעל הכדור כשהיא לפניו, ומוסתרת רק כשהיא ממש מאחוריו
      if (!occ(v, p)) {
        if (up) { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, sR * 2.4); g.addColorStop(0, cv('--ill-sun-glow')); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, sR * 2.4, 0, 2 * Math.PI); ctx.fill(); }
        ctx.globalAlpha = up ? 1 : 0.5; sprite(ctx, IMG.sun, p.x, p.y, 2 * sR, 2 * sR); ctx.globalAlpha = 1;
      }
      if (!this.hintDone) drawHint(ctx, W, 'גררו לסיבוב · ▶ הפעל להנעה');
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
      $('y_rot0').onclick = () => { this.viewAz = 90; };
      document.querySelectorAll('#view-year .seg button').forEach(b => b.onclick = () => this.dayY = +b.dataset.d);
      // גרירת העכבר/מגע לסיבוב התצוגה (~0.5° לכל פיקסל)
      { const cnv = $('yearCanvas'); let dragX = 0, dragAz = 0, dragging = false; cnv.style.cursor = 'grab';
        cnv.onpointerdown = e => { dragging = true; this.hintDone = true; dragX = e.clientX; dragAz = this.viewAz; cnv.setPointerCapture(e.pointerId); cnv.style.cursor = 'grabbing'; };
        cnv.onpointermove = e => { if (!dragging) return; this.viewAz = (((dragAz + (e.clientX - dragX) * 0.5) % 360) + 360) % 360; window.__invalidate && window.__invalidate(); };
        cnv.onpointerup = cnv.onpointercancel = () => { dragging = false; cnv.style.cursor = 'grab'; }; }
    },
  };
  function withA(col, a) { // הוספת אלפא לצבע hex/rgb שנקרא מ-CSS
    if (col.startsWith('#')) { const n = parseInt(col.slice(1, 7), 16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
    const m = col.match(/\d+(\.\d+)?/g); return m ? `rgba(${m[0]},${m[1]},${m[2]},${a})` : col;
  }
  function fmtH(h) { const m = Math.round((((h % 24) + 24) % 24) * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }

  // טקסטורת כדור הארץ נדגמת פעם אחת מהתמונה (equirectangular) למערך פיקסלים, ומשם דוגמים לכל פיקסל בכדור.
  let _earthTex = null, _globeBuf = null;
  function earthTexture() {
    if (_earthTex) return _earthTex;
    const im = IMG.globe;
    if (!(im.complete && im.naturalWidth)) return null;
    const w = im.naturalWidth, h = im.naturalHeight;
    const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
    const octx = oc.getContext('2d'); octx.drawImage(im, 0, 0);
    _earthTex = { data: octx.getImageData(0, 0, w, h).data, w, h };
    return _earthTex;
  }

  // כדור הארץ הקטן במרכז כיפת השמיים. ציר הקטבים מוטה כקו הרוחב של הצופה (זהה ל"ציר העולם" המצויר).
  // הכדור מרונדר פיקסל-אחר-פיקסל: היטל אורתוגרפי של הספֵרה, דגימת מפת עולם (equirectangular) והצללת יום/לילה
  // לפי כיוון השמש. סיבוב התצוגה (viewAz) מסובב את הספֵרה ממש, כך שהיבשות מסתובבות יחד עם הרשת.
  function drawGlobe(ctx, cx, cy, r, sun, viewAz, lat) {
    const a = viewAz * Math.PI / 180, b = BETA * Math.PI / 180;
    // שלושה צירים אורתונורמליים במערכת (E,N,U): ex→ציר-x במסך, eup→ציר-y במסך, ev→לכיוון הצופה (עומק)
    const ex  = [Math.cos(a), -Math.sin(a), 0];
    const eup = [-Math.sin(a) * Math.sin(b), -Math.cos(a) * Math.sin(b), Math.cos(b)];
    const ev  = [Math.sin(a) * Math.cos(b),  Math.cos(a) * Math.cos(b),  Math.sin(b)];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const sx = P => cx - r * dot(P, ex);
    const sy = P => cy - r * dot(P, eup);
    // צירי כדור הארץ: k=ציר הקטבים לכיוון קוטב השמים, i=מזרח, j=k×i
    const ph = lat * Math.PI / 180;
    const k = [0, Math.cos(ph), Math.sin(ph)], jj = [0, Math.sin(ph), -Math.cos(ph)];
    const surf = (la, lo) => {
      const cl = Math.cos(la), sl = Math.sin(la), co = Math.cos(lo), so = Math.sin(lo);
      return [cl*co + sl*k[0], cl*(so*jj[1]) + sl*k[1], cl*(so*jj[2]) + sl*k[2]];
    };
    // כיוון השמש כווקטור יחידה (פני שטח מוארים כאשר P·sN > 0)
    const m0 = Math.hypot(sun.E, sun.N, sun.U) || 1, sN = [sun.E/m0, sun.N/m0, sun.U/m0];

    // ── גוף הכדור: טקסטורה ממופה לספֵרה + הצללת יום/לילה (לחוצץ חוץ-מסך, ואז מצוירת מעל הכיפה) ──
    const tex = earthTexture();
    const dpr = (ctx.getTransform ? ctx.getTransform().a : (window.devicePixelRatio || 1)) || 1;
    if (tex) {
      const px = Math.max(2, Math.round(2 * r * dpr)), C = px / 2, half = px / 2;
      if (!_globeBuf) _globeBuf = document.createElement('canvas');
      if (_globeBuf.width !== px) { _globeBuf.width = px; _globeBuf.height = px; }
      const gctx = _globeBuf.getContext('2d');
      const img = gctx.createImageData(px, px), out = img.data;
      const td = tex.data, tw = tex.w, th = tex.h, T2 = Math.PI * 2;
      const e0=ex[0],e1=ex[1],e2=ex[2], u0=eup[0],u1=eup[1],u2=eup[2], v0=ev[0],v1=ev[1],v2=ev[2];
      const k0=k[0],k1=k[1],k2=k[2], j1=jj[1],j2=jj[2], s0=sN[0],s1=sN[1],s2=sN[2];
      for (let yy = 0; yy < px; yy++) {
        const bb = (C - yy - 0.5) / half;
        for (let xx = 0; xx < px; xx++) {
          const aa = (C - xx - 0.5) / half, rr = aa*aa + bb*bb, o = (yy*px + xx) << 2;
          if (rr > 1) { out[o+3] = 0; continue; }
          const zz = Math.sqrt(1 - rr);
          const Px = aa*e0 + bb*u0 + zz*v0, Py = aa*e1 + bb*u1 + zz*v1, Pz = aa*e2 + bb*u2 + zz*v2;
          const latP = Math.asin(Math.max(-1, Math.min(1, Px*k0 + Py*k1 + Pz*k2)));
          const lonP = Math.atan2(Px*0 + Py*j1 + Pz*j2, Px);    // P·j , P·i(=Px)
          let uu = lonP / T2 + 0.5; uu -= Math.floor(uu);
          let vv = 0.5 - latP / Math.PI; vv = vv < 0 ? 0 : (vv > 0.999999 ? 0.999999 : vv);
          const ti = ((Math.floor(vv*th)*tw) + Math.floor(uu*tw)) << 2;
          const d = Px*s0 + Py*s1 + Pz*s2;            // קוסינוס הזווית לשמש → יום/לילה
          // התמונה כהה יחסית, לכן מבהירים את צד היום (מקדם>1) ומחשיכים יותר את הלילה — להגברת הניגודיות
          const t = d <= -0.06 ? 0 : d >= 0.06 ? 1 : (d + 0.06) / 0.12;
          const shf = 0.16 + 1.19 * t;                // לילה ~0.16, יום ~1.35 (Uint8ClampedArray גוזר אוטומטית)
          out[o] = td[ti]*shf; out[o+1] = td[ti+1]*shf; out[o+2] = td[ti+2]*shf; out[o+3] = 255;
        }
      }
      gctx.putImageData(img, 0, 0);
      ctx.drawImage(_globeBuf, cx - r, cy - r, 2*r, 2*r);
    } else {                                           // נפילה עד שהטקסטורה תיטען
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI); ctx.clip();
      ctx.fillStyle = '#2f6fb0'; ctx.fillRect(cx - r, cy - r, 2*r, 2*r); ctx.restore();
    }

    // ── רשת קווי אורך/רוחב (עדינה) + סמנים — מצוירים כקווים וקטוריים מעל הכדור, גזורים למעגלו ──
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI); ctx.clip();
    const seg = (P0, P1, emph) => {
      if (dot(P0, ev) < -0.04 && dot(P1, ev) < -0.04) return;       // אחורי לגמרי — דלג
      const lit = dot(P0, sN) + dot(P1, sN) > 0;
      ctx.strokeStyle = emph ? (lit ? 'rgba(255,226,140,0.90)' : 'rgba(255,226,140,0.34)')
                             : (lit ? 'rgba(232,243,255,0.45)' : 'rgba(200,220,250,0.18)');
      ctx.lineWidth = emph ? 1.3 : 0.8;
      ctx.beginPath(); ctx.moveTo(sx(P0), sy(P0)); ctx.lineTo(sx(P1), sy(P1)); ctx.stroke();
    };
    for (const la of [-60, -30, 0, 30, 60]) {                        // קווי רוחב (המשווה מודגש)
      const L = la * Math.PI / 180; let prev = surf(L, 0);
      for (let lo = 8; lo <= 360; lo += 8) { const cur = surf(L, lo*Math.PI/180); seg(prev, cur, la === 0); prev = cur; }
    }
    for (let lo = 0; lo < 360; lo += 30) {                           // קווי אורך
      const O = lo * Math.PI / 180; let prev = surf(-Math.PI/2, O);
      for (let la = -78; la <= 78; la += 8) { const cur = surf(la*Math.PI/180, O); seg(prev, cur, false); prev = cur; }
    }
    { const L = ph; let prev = surf(L, 0);                           // קו הרוחב של הצופה — מודגש
      for (let lo = 8; lo <= 360; lo += 8) { const cur = surf(L, lo*Math.PI/180); seg(prev, cur, true); prev = cur; } }
    ctx.restore();
    // קו מתאר הכדור
    ctx.strokeStyle = cv('--ill-line'); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI); ctx.stroke();
    // סמן הצופה (זנית) — תמיד פונה לצופה
    ctx.fillStyle = '#ff5a4d'; ctx.beginPath(); ctx.arc(sx([0,0,1]), sy([0,0,1]), 2.6, 0, 2*Math.PI); ctx.fill();
    // קוטב צפון של הכדור (אם פונה לצופה)
    if (dot(k, ev) > 0) { ctx.fillStyle = cv('--ill-text'); ctx.beginPath(); ctx.arc(sx(k), sy(k), 1.8, 0, 2*Math.PI); ctx.fill(); }
  }

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
