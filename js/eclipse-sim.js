// eclipse-sim.js — ליקויי המאורות: ליקוי לבנה, ליקוי חמה, ומסלול הליקוי על הגלובוס.
// שלוש תצוגות (בורר מקטעים):
//   ליקוי לבנה — מעבר הירח בצל הארץ (אומברה/פנומברה) + מראה הירח מן הארץ,
//   ליקוי חמה  — מערך שמש·ירח·ארץ עם חרוטי הצל + מראה השמש לצופה בנקודת השיא,
//   על הגלובוס — הכהיית פני כדור הארץ לפי אחוז כיסוי השמש בכל מקום, כתם הליקוי
//                המלא/הטבעתי, ומסלולו ממערב למזרח; בורר לכל ליקויי המאה (2001–2100).
// הגיאומטריה מחושבת ממש (Astronomy Engine, וקטורים גאוצנטריים בק"מ): רדיוסי צל,
// חפיפת דיסקות, ונקודת פני הארץ הקרובה לציר הצל. אחוז הכיסוי תואם את obscuration
// של המנוע (אומת מולו); הגדלת צל הארץ באטמוספרה — 2% כמקובל.
"use strict";
(function () {
  const AE = window.Astronomy;
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  const KM_AU  = AE.KM_PER_AU || 1.4959787069098932e8;
  const R_SUN = 695700, R_EARTH = 6371.0084, R_MOON = 1737.4;   // ק"מ
  const MEAN_DIST = 384400, PERIGEE = 356500, APOGEE = 406700;  // מרחקי הירח (ק"מ)
  const EPS = 23.4392911 * RAD;
  const ECL_N = [0, -Math.sin(EPS), Math.cos(EPS)];             // קוטב המלקה ב-J2000
  const EK = { total: 'מלא', partial: 'חלקי', penumbral: 'צל-קדמי', annular: 'טבעתי', hybrid: 'היברידי' };

  // ── אלגברה וקטורית על מערכים [x,y,z] ──────────────────────────────────
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const mul = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
  const norm = a => mul(a, 1 / (len(a) || 1));
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const clamp1 = x => Math.max(-1, Math.min(1, x));

  // וקטור גאוצנטרי בק"מ (J2000)
  function geoKm(body, time) {
    const v = AE.GeoVector(body, time, false);
    return [v.x * KM_AU, v.y * KM_AU, v.z * KM_AU];
  }

  // חלקו של עיגול r1 המכוסה על-ידי עיגול r2 שמרכזו במרחק d (שטח החיתוך / שטח r1)
  function overlapFrac(r1, r2, d) {
    if (r1 <= 0 || r2 <= 0 || d >= r1 + r2) return 0;
    if (d <= r2 - r1) return 1;                          // r1 בלוע כולו
    if (d <= r1 - r2) return (r2 * r2) / (r1 * r1);      // r2 בתוך r1 (טבעתי)
    const a1 = Math.acos((d*d + r1*r1 - r2*r2) / (2*d*r1));
    const a2 = Math.acos((d*d + r2*r2 - r1*r1) / (2*d*r2));
    return (r1*r1*(a1 - Math.sin(2*a1)/2) + r2*r2*(a2 - Math.sin(2*a2)/2)) / (Math.PI * r1 * r1);
  }

  // ── ליקוי לבנה: מצב הירח בצל הארץ לרגע נתון ────────────────────────────
  // הצל נופל נגד כיוון השמש; רדיוסי האומברה/פנומברה במרחק הירח — ליניאריים
  // בחרוט, מוגדלים 2% (האטמוספרה מאריכה את הצל). ההיסט הדו-ממדי של הירח מן
  // הציר נפרש על בסיס (מזרח, צפון-מלקה) לציור המעבר והמראה.
  function lunarGeom(date) {
    const time = AE.MakeTime(date);
    const s = geoKm(AE.Body.Sun, time), m = geoKm(AE.Body.Moon, time);
    const a = norm(mul(s, -1));                          // ציר הצל
    const proj = dot(m, a);                              // עומק הירח לאורך הציר
    const perpV = sub(m, mul(a, proj));
    const ds = len(s);
    const rU = (R_EARTH - proj * (R_SUN - R_EARTH) / ds) * 1.02;
    const rP = (R_EARTH + proj * (R_SUN + R_EARTH) / ds) * 1.02;
    const north = norm(sub(ECL_N, mul(a, dot(ECL_N, a))));
    const east = cross(north, a);
    return {
      umbra: proj > 0 ? overlapFrac(R_MOON, Math.max(rU, 0), len(perpV)) : 0,
      penum: proj > 0 ? overlapFrac(R_MOON, rP, len(perpV)) : 0,
      x: dot(perpV, east), y: dot(perpV, north),         // היסט הירח מהציר (ק"מ)
      rU, rP,
    };
  }

  // ── ליקוי חמה: גיאומטריית צל הירח מוקטורי שמש/ירח (בכל מערכת צירים) ────
  // מוצאת את נקודת פני הארץ הקרובה ביותר לציר הצל (בליקוי מרכזי — נקודת החיתוך),
  // ומחשבת שם את הכיסוי הטופוצנטרי: רדיוסים זוויתיים של שמש וירח + הפרדה זוויתית.
  function shadowGeom(s, m) {
    const axis = norm(sub(m, s));                        // מהשמש דרך הירח והלאה
    const u0 = -dot(m, axis);
    const q = [m[0]+axis[0]*u0, m[1]+axis[1]*u0, m[2]+axis[2]*u0];  // הקרוב לציר ממרכז הארץ
    const rho = len(q), central = rho < R_EARTH;
    let P;
    if (central) {
      const h = Math.sqrt(R_EARTH*R_EARTH - rho*rho);
      const u = u0 - h;                                  // נקודת הכניסה (הקרובה לירח)
      P = [m[0]+axis[0]*u, m[1]+axis[1]*u, m[2]+axis[2]*u];
    } else P = mul(q, R_EARTH / rho);
    const S = sub(s, P), M = sub(m, P);
    const dS = len(S), dM = len(M);
    const rs = Math.asin(R_SUN / dS), rm = Math.asin(Math.min(1, R_MOON / dM));
    const sep = Math.acos(clamp1(dot(S, M) / (dS * dM)));
    const frac = overlapFrac(rs, rm, sep);
    const kind = sep <= rm - rs ? 'total' : sep <= rs - rm ? 'annular' : frac > 0 ? 'partial' : 'none';
    // רדיוסי הצל על פני הארץ (בנקודה P): שלילי = הציר מעבר לקודקוד (אנטומברה/טבעתי)
    const D = len(sub(s, m)), depth = dot(sub(P, m), axis);
    const rUs = R_MOON - depth * (R_SUN - R_MOON) / D;
    const rPs = R_MOON + depth * (R_SUN + R_MOON) / D;
    return { axis, q, rho, central, P, S, M, rs, rm, sep, frac, kind, rUs, rPs, D, depth };
  }

  // מצב ליקוי חמה ב-J2000 (לתצוגות הדו-ממדיות), עם מרחק ירח מדומה אופציונלי
  function solarGeom(date, simKm) {
    const time = AE.MakeTime(date);
    const s = geoKm(AE.Body.Sun, time);
    let m = geoKm(AE.Body.Moon, time);
    const distReal = len(m);
    if (simKm) m = mul(m, simKm / distReal);
    const g = shadowGeom(s, m);
    g.s = s; g.m = m; g.distReal = distReal;
    // בסיס ⊥ לציר — להיסטים דו-ממדיים בציור
    g.north = norm(sub(ECL_N, mul(g.axis, dot(ECL_N, g.axis))));
    g.east = cross(g.north, g.axis);
    return g;
  }

  // וקטורי שמש/ירח במערכת קבועת-הארץ (ק"מ) — לגלובוס: EQJ→EQD וסיבוב בזמן הכוכבים
  function earthFixed(date) {
    const time = AE.MakeTime(date);
    const rot = AE.Rotation_EQJ_EQD(time);
    const g = AE.SiderealTime(time) * 15 * RAD;
    const cg = Math.cos(g), sg = Math.sin(g);
    const conv = body => {
      const v = AE.RotateVector(rot, AE.GeoVector(body, time, false));
      const x = v.x * KM_AU, y = v.y * KM_AU, z = v.z * KM_AU;
      return [x*cg + y*sg, y*cg - x*sg, z];
    };
    return { s: conv(AE.Body.Sun), m: conv(AE.Body.Moon) };
  }
  const efLatLon = P => ({ lat: Math.asin(clamp1(P[2] / len(P))) * DEG, lon: Math.atan2(P[1], P[0]) * DEG });

  // ── חיפוש ליקויים ──────────────────────────────────────────────────────
  const nextEcl = (type, date) => type === 'lunar' ? AE.SearchLunarEclipse(date) : AE.SearchGlobalSolarEclipse(date);
  const seqNext = (type, e) => type === 'lunar' ? AE.NextLunarEclipse(e.peak) : AE.NextGlobalSolarEclipse(e.peak);
  function prevEcl(type, beforeDate) {
    let e = nextEcl(type, new Date(beforeDate.getTime() - 420 * 86400000)), last = null;
    while (e.peak.date.getTime() < beforeDate.getTime() - 60000) { last = e; e = seqNext(type, e); }
    return last || e;
  }

  // חלון הזמן של הליקוי: לבנה — ממשכי הפנומברה שבמנוע; חמה — סריקה סביב השיא
  // עד שהכיסוי (בנקודה הטובה בעולם) מתאפס.
  function windowOf(type, einfo) {
    const pk = einfo.peak.date.getTime();
    if (type === 'lunar') {
      const w = (einfo.sd_penum || 110) * 60000 * 1.05;
      return { t0: pk - w, t1: pk + w };
    }
    let first = null, last = null;
    for (let mm = -260; mm <= 260; mm += 5) {
      if (solarGeom(new Date(pk + mm * 60000)).frac > 0) { if (first === null) first = mm; last = mm; }
    }
    if (first === null) { first = -90; last = 90; }
    return { t0: pk + (first - 6) * 60000, t1: pk + (last + 6) * 60000 };
  }

  // ── רשימת ליקויי המאה (2001–2100) — נבנית בנגיסות כדי לא להקפיא את הממשק ──
  const LISTS = { lunar: null, solar: null };
  function buildList(type) {
    if (LISTS[type]) return;
    const L = LISTS[type] = { arr: [], done: false };
    let e;
    try { e = nextEcl(type, new Date(Date.UTC(2000, 11, 20))); } catch (er) { L.done = true; return; }
    const chunk = () => {
      try {
        for (let n = 0; n < 12; n++) {
          if (e.peak.date.getUTCFullYear() > 2100) { L.done = true; refreshList(); return; }
          L.arr.push({ kind: e.kind, ms: e.peak.date.getTime(), date: e.peak.date });
          e = seqNext(type, e);
        }
      } catch (er) { L.done = true; }
      refreshList();
      if (!L.done) setTimeout(chunk, 0);
    };
    setTimeout(chunk, 0);
  }

  function refreshList() {
    const sel = $('e_list'); if (!sel) return;
    const type = sim.mode === 'lunar' ? 'lunar' : 'solar';
    const L = LISTS[type];
    const only = $('e_onlyTotal') && $('e_onlyTotal').checked;
    const loc = window.I18N ? window.I18N.dateLocale : 'he-IL';
    const cur = sim.einfo ? sim.einfo.peak.date.getTime() : 0;
    let html = '';
    if (L) for (const it of L.arr) {
      if (only && it.kind !== 'total') continue;
      const lbl = it.date.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' }) + ' — ' + T(EK[it.kind] || it.kind);
      html += `<option value="${it.ms}">${lbl}</option>`;
    }
    if (!L || !L.done) html += `<option value="">${T('טוען…')}</option>`;
    sel.innerHTML = html;
    sel.value = String(cur);
    if (sel.value !== String(cur)) sel.selectedIndex = -1;   // הליקוי הנוכחי מסונן/מחוץ למאה
  }

  // ── צבעי ערכת האיור (עם מטמון, כמו ב-sims.js) ──────────────────────────
  const _cvCache = Object.create(null);
  const cvv = n => {
    let v = _cvCache[n];
    if (v === undefined) v = _cvCache[n] = getComputedStyle(document.body).getPropertyValue(n).trim();
    return v;
  };
  function clearColorCache() { for (const k in _cvCache) delete _cvCache[k]; }

  // ── קנבס ותמונות ───────────────────────────────────────────────────────
  const IMG = { sun: new Image(), moon: new Image(), earth: new Image(), globe: new Image() };
  IMG.sun.src = window.ASSETS.moon_sun; IMG.moon.src = window.ASSETS.moon_real;
  IMG.earth.src = window.ASSETS.moon_earth; IMG.globe.src = window.ASSETS.globe_earth;
  IMG.globe.onload = () => { _tex = null; window.__invalidate && window.__invalidate(); };
  function sprite(ctx, im, cx, cy, w, h) {
    if (im.complete && im.naturalWidth) ctx.drawImage(im, cx - w/2, cy - h/2, w, h || w);
    else { ctx.fillStyle = cvv('--ill-muted'); ctx.beginPath(); ctx.arc(cx, cy, w/2, 0, 2*Math.PI); ctx.fill(); }
  }

  const _fc = new Map();
  function clearFitCache() { _fc.clear(); }
  function fit(canvas) {
    let c = _fc.get(canvas);
    if (!c) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.parentElement.getBoundingClientRect();
      const W = Math.max(280, r.width), H = Math.max(240, r.height);
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c = { ctx, W, H }; _fc.set(canvas, c);
    }
    return c;
  }

  // דיסקת הירח (תצלום) חתוכה לעיגול
  function moonDisc(ctx, cx, cy, R) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*Math.PI); ctx.clip();
    if (IMG.moon.complete && IMG.moon.naturalWidth) {
      ctx.filter = 'brightness(1.5) contrast(0.9)';
      ctx.drawImage(IMG.moon, cx - R, cy - R, 2*R, 2*R);
      ctx.filter = 'none';
    } else { ctx.fillStyle = '#cfcdc3'; ctx.fillRect(cx - R, cy - R, 2*R, 2*R); }
    ctx.restore();
  }

  const fmtUTC = d => String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  const fmtLat = l => Math.abs(l).toFixed(1) + '° ' + (l >= 0 ? T('צפון') : T('דרום'));
  const fmtLon = l => Math.abs(l).toFixed(1) + '° ' + (l >= 0 ? T('מזרח') : T('מערב'));

  // ════════════════ ציור: ליקוי לבנה ════════════════
  function drawLunar(ctx, L, sim) {
    const g = lunarGeom(sim.t);

    // ── רצועת המערך למעלה: שמש → ארץ → ירח, חרוט הצל, והקו ביניהם ──
    const ay = L.y + L.h * 0.15;
    const sx = L.x + L.w * 0.08, ex = L.x + L.w * 0.52, mxBase = L.x + L.w * 0.86;
    const kap = 13 / R_EARTH;                       // ק"מ→פיקסל לרדיוסים ולהיסטים (הארץ 13px)
    const my = ay - g.y * kap;                      // היסט הירח מציר הצל — אמיתי, באותו קנה
    // קרני שמש + הקו שבין השמש לירח (ההצעה: "יסומן קו בין הירח והשמש")
    ctx.strokeStyle = cvv('--ill-grid'); ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(sx, ay); ctx.lineTo(mxBase, my); ctx.stroke(); ctx.setLineDash([]);
    // חרוט הצל של הארץ: פנומברה (רחב, בהיר) + אומברה (צר, כהה) עד מעבר לירח
    const coneX = mxBase + L.w * 0.06;
    const rUpx = Math.max(1, g.rU * kap), rPpx = g.rP * kap, ePx = R_EARTH * kap;
    ctx.fillStyle = 'rgba(70,90,140,0.13)';
    ctx.beginPath(); ctx.moveTo(ex, ay - ePx); ctx.lineTo(coneX, ay - rPpx); ctx.lineTo(coneX, ay + rPpx); ctx.lineTo(ex, ay + ePx); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(10,12,22,0.42)';
    ctx.beginPath(); ctx.moveTo(ex, ay - ePx); ctx.lineTo(coneX, ay - rUpx); ctx.lineTo(coneX, ay + rUpx); ctx.lineTo(ex, ay + ePx); ctx.closePath(); ctx.fill();
    // גופים
    const gGlow = ctx.createRadialGradient(sx, ay, 2, sx, ay, 40);
    gGlow.addColorStop(0, cvv('--ill-sun-glow')); gGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = gGlow; ctx.beginPath(); ctx.arc(sx, ay, 40, 0, 2*Math.PI); ctx.fill();
    sprite(ctx, IMG.sun, sx, ay, 36, 36);
    sprite(ctx, IMG.earth, ex, ay, 2*ePx, 2*ePx);
    moonDisc(ctx, mxBase, my, Math.max(4, R_MOON * kap));
    ctx.fillStyle = cvv('--ill-text'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(T('שמש'), sx, ay + 24); ctx.fillText(T('הארץ'), ex, ay + ePx + 6); ctx.fillText(T('הירח'), mxBase, my + 12);
    ctx.fillStyle = cvv('--ill-muted');
    ctx.fillText(T('הארץ בין השמש לירח — צלה נופל על הירח'), L.x + L.w * 0.5, L.y + 6);

    // ── מעבר הירח בצל (מבט אל תוך החרוט) ──
    const cx1 = L.x + L.w * 0.34, cy1 = L.y + L.h * 0.60;
    const Rp = Math.min(L.w * 0.27, L.h * 0.30);
    const k2 = Rp / g.rP;                           // ק"מ→פיקסל של מישור הצל
    ctx.fillStyle = 'rgba(70,90,140,0.13)';
    ctx.beginPath(); ctx.arc(cx1, cy1, Rp, 0, 2*Math.PI); ctx.fill();
    ctx.strokeStyle = cvv('--ill-grid'); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(10,12,22,0.55)';
    ctx.beginPath(); ctx.arc(cx1, cy1, Math.max(2, g.rU * k2), 0, 2*Math.PI); ctx.fill();
    // נתיב הירח לאורך חלון הליקוי
    ctx.strokeStyle = cvv('--ill-line'); ctx.setLineDash([3, 4]); ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const gp = lunarGeom(new Date(sim.win.t0 + (i / 40) * (sim.win.t1 - sim.win.t0)));
      const x = cx1 - gp.x * k2, y = cy1 - gp.y * k2;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // הירח עצמו + הצללה בתוך הצל
    const mR = Math.max(5, R_MOON * k2), mx1 = cx1 - g.x * k2, my1 = cy1 - g.y * k2;
    moonDisc(ctx, mx1, my1, mR);
    shadeMoon(ctx, mx1, my1, mR, g, k2, cx1, cy1);
    ctx.strokeStyle = cvv('--ill-line'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(mx1, my1, mR, 0, 2*Math.PI); ctx.stroke();
    ctx.fillStyle = cvv('--ill-muted'); ctx.font = '10px sans-serif'; ctx.textBaseline = 'bottom';
    ctx.fillText(T('הצל המלא (אומברה)'), cx1, cy1 - Math.max(2, g.rU * k2) - 4);
    ctx.fillText(T('הצל החלקי (פנומברה)'), cx1, cy1 - Rp - 5);

    // ── מראה הירח מן הארץ ──
    const R2 = Math.min(L.w * 0.135, L.h * 0.21);
    const cx2 = L.x + L.w * 0.79, cy2 = L.y + L.h * 0.62;
    ctx.fillStyle = cvv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.textBaseline = 'bottom';
    ctx.fillText(T('מראה הירח מן הארץ'), cx2, cy2 - R2 - 8);
    moonDisc(ctx, cx2, cy2, R2);
    shadeMoon(ctx, cx2, cy2, R2, g, R2 / R_MOON, 0, 0, true);
    ctx.strokeStyle = cvv('--ill-line'); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx2, cy2, R2, 0, 2*Math.PI); ctx.stroke();
    const pct = Math.round(g.umbra * 100);
    ctx.fillStyle = cvv('--ill-text'); ctx.font = 'bold 13px sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText(pct + '% ' + T('מכוסה'), cx2, cy2 + R2 + 8);
    return g;
  }

  // הצללת הירח בצל הארץ: פנומברה עדינה, אומברה כהה, והאדמה לקראת ליקוי מלא.
  // observer=true — מרכז הצל נקבע מהיסט הירח (המראה מן הארץ); אחרת מרכז הצל נתון.
  function shadeMoon(ctx, mx, my, mR, g, k, scx, scy, observer) {
    const ux = observer ? mx + g.x * k : scx, uy = observer ? my + g.y * k : scy;
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mR, 0, 2*Math.PI); ctx.clip();
    ctx.fillStyle = 'rgba(24,26,40,0.30)';                                   // פנומברה
    ctx.beginPath(); ctx.arc(ux, uy, Math.max(1, g.rP * k), 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(8,7,12,0.93)';                                     // אומברה
    ctx.beginPath(); ctx.arc(ux, uy, Math.max(1, g.rU * k), 0, 2*Math.PI); ctx.fill();
    const red = Math.max(0, Math.min(1, (g.umbra - 0.88) / 0.12));           // האדמה בשיא
    if (red > 0) {
      ctx.fillStyle = `rgba(158,52,22,${(0.72 * red).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(ux, uy, Math.max(1, g.rU * k), 0, 2*Math.PI); ctx.fill();
    }
    ctx.restore();
  }

  // ════════════════ ציור: ליקוי חמה ════════════════
  function drawSolar(ctx, L, sim) {
    const simKm = sim.distOn ? sim.distKm : 0;
    const g = solarGeom(sim.t, simKm);

    // ── רצועת המערך: שמש → ירח (עם חרוטי הצל) → ארץ ──
    const ay = L.y + L.h * 0.16;
    const sx = L.x + L.w * 0.07, ex = L.x + L.w * 0.88;
    const ePx = 24, kap = ePx / R_EARTH;            // רדיוסים והיסטים בקנה הארץ (מוגדל לקריאוּת)
    // מרחק ירח–ארץ על המסך משתנה עם המרחק האמיתי/המדומה (מודגש פי 1 — יחס ישיר)
    const distKm = simKm || g.distReal;
    const gapPx = L.w * 0.30 * (distKm / MEAN_DIST);
    const mx = ex - gapPx;
    // היסט ציר הצל מן הארץ (הציר עובר דרך הירח; בארץ הוא מחטיא/פוגע לפי q)
    const yq = -dot(g.q, g.north) * kap;            // היסט הציר במישור הארץ
    const eyq = ay + yq;                             // נקודת הציר במישור הארץ (על המסך)
    const myq = ay + yq * ((mx - sx) / (ex - sx));  // הירח יושב על הציר המשופע שמן השמש
    // הציר: קו מקווקו מהשמש דרך הירח אל מישור הארץ ("קו בין הירח והשמש")
    ctx.strokeStyle = cvv('--ill-grid'); ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(sx, ay); ctx.lineTo(ex, eyq); ctx.stroke();
    ctx.setLineDash([]);
    const mPx = Math.max(3.5, R_MOON * kap);
    // חרוט האומברה: מתכנס לקודקוד; אם הקודקוד לפני הארץ — הליקוי טבעתי,
    // וההמשך (האנטומברה) מסומן מקווקו עד הארץ, כדרישת ההצעה להראות זאת.
    const umbLenPx = (R_MOON * g.D / (R_SUN - R_MOON)) * (gapPx / distKm);   // אורך האומברה בקנה המרחק
    const apexT = Math.min(umbLenPx / (ex - mx || 1), 1.35);
    const apexX = mx + (ex - mx) * apexT, apexY = myq + (eyq - myq) * apexT;
    ctx.fillStyle = 'rgba(8,10,20,0.55)';
    ctx.beginPath(); ctx.moveTo(mx, myq - mPx); ctx.lineTo(apexX, apexY); ctx.lineTo(mx, myq + mPx); ctx.closePath(); ctx.fill();
    if (umbLenPx < ex - mx) {                        // הצל אינו מגיע — טבעתי: אנטומברה מקווקוות
      ctx.strokeStyle = 'rgba(120,130,170,0.55)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(apexX, apexY); ctx.lineTo(ex, eyq - mPx * 0.8);
      ctx.moveTo(apexX, apexY); ctx.lineTo(ex, eyq + mPx * 0.8); ctx.stroke();
      ctx.setLineDash([]);
    }
    // פנומברה — מתרחבת מן הירח עד מישור הארץ (רדיוס rPs בקנה הארץ)
    const penPx = Math.max(10, g.rPs * kap);
    ctx.fillStyle = 'rgba(70,90,140,0.16)';
    ctx.beginPath(); ctx.moveTo(mx, myq - mPx); ctx.lineTo(ex, eyq - penPx); ctx.lineTo(ex, eyq + penPx); ctx.lineTo(mx, myq + mPx); ctx.closePath(); ctx.fill();
    // גופים
    const gGlow = ctx.createRadialGradient(sx, ay, 2, sx, ay, 44);
    gGlow.addColorStop(0, cvv('--ill-sun-glow')); gGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = gGlow; ctx.beginPath(); ctx.arc(sx, ay, 44, 0, 2*Math.PI); ctx.fill();
    sprite(ctx, IMG.sun, sx, ay, 38, 38);
    moonDisc(ctx, mx, myq, mPx);
    sprite(ctx, IMG.earth, ex, eyq, 2*ePx, 2*ePx);
    ctx.fillStyle = cvv('--ill-text'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(T('שמש'), sx, ay + 26); ctx.fillText(T('הירח'), mx, myq + mPx + 4); ctx.fillText(T('הארץ'), ex, eyq + ePx + 5);
    ctx.fillStyle = cvv('--ill-muted');
    ctx.fillText(T('הירח בין הארץ לשמש — צלו נופל על הארץ'), L.x + L.w * 0.5, L.y + 6);

    // ── מראה הליקוי לצופה (בנקודה הטובה ביותר על פני הארץ) ──
    const vw = Math.min(L.w * 0.42, L.h * 0.52), vh = vw * 0.86;
    const vx = L.x + L.w * 0.30 - vw / 2 + L.w * 0.02, vy = L.y + L.h * 0.40;
    // רקע השמים מתכהה מ-30% כיסוי ומעלה (בליקוי קטן מזה ההחשכה אינה מורגשת)
    const f = g.frac;
    const dk = f < 0.3 ? 0 : Math.pow((f - 0.3) / 0.7, 1.4);
    const skyTop = mixColor([143, 195, 234], [4, 6, 13], dk);
    const skyBot = mixColor([196, 224, 244], [8, 10, 18], dk);
    ctx.save();
    roundRect(ctx, vx, vy, vw, vh, 12); ctx.clip();
    const skyG = ctx.createLinearGradient(0, vy, 0, vy + vh);
    skyG.addColorStop(0, skyTop); skyG.addColorStop(1, skyBot);
    ctx.fillStyle = skyG; ctx.fillRect(vx, vy, vw, vh);
    // השמש והירח — רדיוסים זוויתיים אמיתיים ביחס, וההפרדה האמיתית
    const scx = vx + vw / 2, scy = vy + vh * 0.46;
    const sunR = vh * 0.20;
    const moonR = sunR * (g.rm / g.rs);
    // כיוון ההיסט במישור הראייה: בסיס (ימין, מעלה) סביב כיוון השמש מהצופה
    const zv = norm(g.S), upw = norm(g.P);
    const up = norm(sub(upw, mul(zv, dot(upw, zv))));
    const right = cross(zv, up);
    const vM = norm(g.M);
    const offx = dot(vM, right) / g.rs * sunR, offy = dot(vM, up) / g.rs * sunR;
    // בליקוי מלא — עטרה (קורונה) סביב השמש המכוסה
    if (g.kind === 'total') {
      const cor = ctx.createRadialGradient(scx, scy, sunR * 0.9, scx, scy, sunR * 2.3);
      cor.addColorStop(0, 'rgba(235,240,255,0.85)'); cor.addColorStop(1, 'transparent');
      ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(scx, scy, sunR * 2.3, 0, 2*Math.PI); ctx.fill();
    }
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.arc(scx, scy, sunR, 0, 2*Math.PI); ctx.fill();
    // הירח המסתיר — בצבע השמים: צדו הלילי אינו נראה כנגד שמי היום, ולכן מחוץ
    // לדיסקת השמש הוא נבלע ברקע, ועל פני השמש הוא נראה כ"נגיסה" בצבע השמים
    // שמתכהה עמם לאורך הליקוי.
    ctx.fillStyle = skyG;
    ctx.beginPath(); ctx.arc(scx + offx, scy - offy, moonR, 0, 2*Math.PI); ctx.fill();
    // הזוהר האטמוספרי סביב השמש (נחלש עם הכיסוי) — פזור באוויר שלפני הצופה,
    // ולכן נצבע מעל הירח; בליקוי מלא אין זוהר, רק העטרה שמאחור
    if (g.kind !== 'total') {
      const gl = ctx.createRadialGradient(scx, scy, 2, scx, scy, sunR * 2.1);
      gl.addColorStop(0, `rgba(255,214,120,${0.55 * (1 - 0.8 * f)})`); gl.addColorStop(1, 'transparent');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(scx, scy, sunR * 2.1, 0, 2*Math.PI); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = cvv('--ill-line'); ctx.lineWidth = 1.2;
    roundRect(ctx, vx, vy, vw, vh, 12); ctx.stroke();
    ctx.fillStyle = cvv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(T('מראה הליקוי מן הארץ (במקום השיא)'), vx + vw / 2, vy - 6);
    // כיתוב אחוז הכיסוי — כלשון ההצעה
    const pct = Math.round(f * 100);
    const lbl = g.kind === 'total' ? T('ליקוי מלא') + ' — 100% ' + T('כיסוי')
      : g.kind === 'annular' ? T('ליקוי טבעתי') + ' — ' + pct + '% ' + T('כיסוי')
      : T('כיסוי') + ': ' + pct + '%';
    ctx.fillStyle = cvv('--ill-text'); ctx.font = 'bold 13px sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText(lbl, vx + vw / 2, vy + vh + 8);

    // ── מבט אל מישור הארץ: היכן חולף הצל (עיגול הארץ + נתיב הציר) ──
    const cxE = L.x + L.w * 0.78, cyE = L.y + L.h * 0.66, RE = Math.min(L.w * 0.14, L.h * 0.20);
    const k3 = RE / R_EARTH;
    ctx.fillStyle = 'rgba(70,110,180,0.20)';
    ctx.beginPath(); ctx.arc(cxE, cyE, RE, 0, 2*Math.PI); ctx.fill();
    ctx.strokeStyle = cvv('--ill-line'); ctx.lineWidth = 1; ctx.stroke();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = cvv('--ill-line'); ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const gg = solarGeom(new Date(sim.win.t0 + (i / 40) * (sim.win.t1 - sim.win.t0)), simKm);
      const x = cxE - dot(gg.q, gg.east) * k3, y = cyE - dot(gg.q, gg.north) * k3;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // הצל הנוכחי: פנומברה + אומברה/אנטומברה
    const qx = cxE - dot(g.q, g.east) * k3, qy = cyE - dot(g.q, g.north) * k3;
    ctx.fillStyle = 'rgba(18,20,38,0.52)';
    ctx.beginPath(); ctx.arc(qx, qy, Math.max(2, g.rPs * k3), 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = g.rUs > 0 ? 'rgba(5,5,10,0.85)' : 'rgba(30,32,50,0.75)';
    ctx.beginPath(); ctx.arc(qx, qy, Math.max(1.6, Math.abs(g.rUs) * k3), 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = cvv('--ill-muted'); ctx.font = '10px sans-serif'; ctx.textBaseline = 'bottom';
    ctx.fillText(T('צל הירח על פני הארץ'), cxE, cyE - RE - 5);
    return g;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function mixColor(c1, c2, t) {
    const m = i => Math.round(c1[i] + (c2[i] - c1[i]) * t);
    return `rgb(${m(0)},${m(1)},${m(2)})`;
  }

  // ════════════════ ציור: מסלול הליקוי על הגלובוס ════════════════
  let _tex = null;
  function texture() {
    if (_tex) return _tex;
    if (!(IMG.globe.complete && IMG.globe.naturalWidth)) return null;
    const w = IMG.globe.naturalWidth, h = IMG.globe.naturalHeight;
    const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
    const octx = oc.getContext('2d'); octx.drawImage(IMG.globe, 0, 0);
    return (_tex = { data: octx.getImageData(0, 0, w, h).data, w, h });
  }
  // LUT להכהיית הליקוי לפי אחוז הכיסוי (חוסך pow לכל פיקסל)
  const COV_LUT = new Float32Array(256);
  for (let i = 0; i < 256; i++) COV_LUT[i] = 1 - 0.85 * Math.pow(i / 255, 1.25);

  const _gb = { cv: null };
  // גוף הגלובוס: טקסטורה + יום/לילה + הכהיית הליקוי (רשת כיסוי אינטרפולציה בי-ליניארית)
  function eclipseGlobeBuffer(lat0, lon0, R, sEF, mEF) {
    const tex = texture(); if (!tex) return null;
    const px = Math.max(64, Math.min(620, Math.round(2 * R * (window.devicePixelRatio || 1))));
    if (!_gb.cv) _gb.cv = document.createElement('canvas');
    const cvs = _gb.cv;
    if (cvs.width !== px) { cvs.width = px; cvs.height = px; }
    const g = cvs.getContext('2d');
    const img = g.createImageData(px, px), out = img.data;
    const la = lat0 * RAD, lo = lon0 * RAD;
    const r0 = -Math.sin(lo), r1 = Math.cos(lo);
    const u0 = -Math.sin(la) * Math.cos(lo), u1 = -Math.sin(la) * Math.sin(lo), u2 = Math.cos(la);
    const v0 = Math.cos(la) * Math.cos(lo), v1 = Math.cos(la) * Math.sin(lo), v2 = Math.sin(la);
    const sN = norm(sEF), s0 = sN[0], s1 = sN[1], s2 = sN[2];
    // רשת הכיסוי: חישוב מדויק (רדיוסים זוויתיים + הפרדה) בצמתים, ובי-ליניארי בפיקסלים
    const N = 80, grid = new Float32Array((N + 1) * (N + 1));
    for (let gy = 0; gy <= N; gy++) {
      const b = 1 - 2 * gy / N;
      for (let gx = 0; gx <= N; gx++) {
        const a = 2 * gx / N - 1, rr = a * a + b * b;
        if (rr > 1.02) continue;
        const z = Math.sqrt(Math.max(0, 1 - rr));
        const Px = (a * r0 + b * u0 + z * v0) * R_EARTH;
        const Py = (a * r1 + b * u1 + z * v1) * R_EARTH;
        const Pz = (b * u2 + z * v2) * R_EARTH;
        const Sx = sEF[0]-Px, Sy = sEF[1]-Py, Sz = sEF[2]-Pz;
        const Mx = mEF[0]-Px, My = mEF[1]-Py, Mz = mEF[2]-Pz;
        const dS = Math.hypot(Sx,Sy,Sz), dM = Math.hypot(Mx,My,Mz);
        const rs = Math.asin(R_SUN / dS), rm = Math.asin(Math.min(1, R_MOON / dM));
        const sep = Math.acos(clamp1((Sx*Mx + Sy*My + Sz*Mz) / (dS * dM)));
        grid[gy * (N + 1) + gx] = overlapFrac(rs, rm, sep);
      }
    }
    const td = tex.data, tw = tex.w, th = tex.h, C = px / 2, DEG_ = DEG;
    for (let y = 0; y < px; y++) {
      const b = (C - y - 0.5) / C;
      for (let x = 0; x < px; x++) {
        const a = (x + 0.5 - C) / C, rr = a * a + b * b, o = (y * px + x) << 2;
        if (rr > 1) { out[o + 3] = 0; continue; }
        const z = Math.sqrt(1 - rr);
        const Px = a * r0 + b * u0 + z * v0, Py = a * r1 + b * u1 + z * v1, Pz = b * u2 + z * v2;
        let uu = (Math.atan2(Py, Px) * DEG_ + 180) / 360; uu -= Math.floor(uu);
        let vv = 0.5 - Math.asin(clamp1(Pz)) / Math.PI;
        vv = vv < 0 ? 0 : (vv > 0.999999 ? 0.999999 : vv);
        const ti = ((Math.floor(vv * th) * tw) + Math.floor(uu * tw)) << 2;
        // יום/לילה
        const d = Px * s0 + Py * s1 + Pz * s2;
        const t = d <= -0.05 ? 0 : d >= 0.05 ? 1 : (d + 0.05) / 0.1;
        let shf = 0.45 + 0.95 * t;
        // הכהיית הליקוי — דגימה בי-ליניארית מהרשת
        const fgx = (a + 1) / 2 * N, fgy = (1 - b) / 2 * N;
        const ix = Math.min(N - 1, Math.floor(fgx)), iy = Math.min(N - 1, Math.floor(fgy));
        const tx = fgx - ix, ty = fgy - iy, base = iy * (N + 1) + ix;
        const f = grid[base] * (1-tx) * (1-ty) + grid[base+1] * tx * (1-ty)
                + grid[base+N+1] * (1-tx) * ty + grid[base+N+2] * tx * ty;
        if (f > 0.003) shf *= COV_LUT[Math.min(255, Math.round(f * 255))];
        out[o] = td[ti] * shf; out[o + 1] = td[ti + 1] * shf; out[o + 2] = td[ti + 2] * shf; out[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return cvs;
  }

  function drawGlobe(ctx, L, sim) {
    const ef = earthFixed(sim.t);
    const g = shadowGeom(ef.s, ef.m);
    const center = efLatLon(g.P);
    if (sim.follow) { sim.gLat = center.lat; sim.gLon = center.lon; }

    const cx = L.x + L.w / 2, cy = L.y + L.h / 2, R = Math.max(60, Math.min(L.w, L.h) / 2 - 18);
    const buf = eclipseGlobeBuffer(sim.gLat, sim.gLon, R, ef.s, ef.m);
    if (buf) ctx.drawImage(buf, cx - R, cy - R, 2 * R, 2 * R);
    else { ctx.fillStyle = '#2f6fb0'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*Math.PI); ctx.fill(); }

    // היטל נקודה גאוגרפית למסך (כמו בקו התאריך)
    const la0 = sim.gLat * RAD, lo0 = sim.gLon * RAD;
    const right = [-Math.sin(lo0), Math.cos(lo0), 0];
    const up = [-Math.sin(la0) * Math.cos(lo0), -Math.sin(la0) * Math.sin(lo0), Math.cos(la0)];
    const view = [Math.cos(la0) * Math.cos(lo0), Math.cos(la0) * Math.sin(lo0), Math.sin(la0)];
    const proj = (lat, lon) => {
      const l = lat * RAD, o = lon * RAD;
      const P = [Math.cos(l) * Math.cos(o), Math.cos(l) * Math.sin(o), Math.sin(l)];
      return { x: cx + R * dot(P, right), y: cy - R * dot(P, up), vis: dot(P, view) > 0 };
    };

    // רשת עדינה
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.7;
    for (let la = -60; la <= 60; la += 30) {
      ctx.beginPath(); let pen = false;
      for (let lo = -180; lo <= 180; lo += 4) {
        const p = proj(la, lo);
        if (!p.vis) { pen = false; continue; }
        pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true;
      }
      ctx.stroke();
    }
    for (let lo = -180; lo < 180; lo += 30) {
      ctx.beginPath(); let pen = false;
      for (let la = -85; la <= 85; la += 4) {
        const p = proj(la, lo);
        if (!p.vis) { pen = false; continue; }
        pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true;
      }
      ctx.stroke();
    }

    // מסלול מרכז הצל לאורך הליקוי (מוטמן לכל ליקוי) — הקו הכתום ממערב למזרח
    if (!sim._path || sim._path.key !== sim.win.t0) {
      const pts = [];
      for (let tt = sim.win.t0; tt <= sim.win.t1; tt += 60000) {
        const e2 = earthFixed(new Date(tt));
        const g2 = shadowGeom(e2.s, e2.m);
        pts.push(g2.central ? efLatLon(g2.P) : null);
      }
      sim._path = { key: sim.win.t0, pts };
    }
    ctx.strokeStyle = '#ff8c42'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.beginPath(); let pen = false;
    for (const pt of sim._path.pts) {
      if (!pt) { pen = false; continue; }
      const p = proj(pt.lat, pt.lon);
      if (!p.vis) { pen = false; continue; }
      pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true;
    }
    ctx.stroke();

    // כתם הליקוי המלא/הטבעתי הנוכחי — היטל טביעת האומברה על פני הכדור
    if (g.central && Math.abs(g.rUs) > 8) {
      const aN = norm(sub(ECL_N, mul(g.axis, dot(ECL_N, g.axis))));
      const aE = cross(aN, g.axis);
      ctx.fillStyle = g.rUs > 0 ? 'rgba(3,3,8,0.8)' : 'rgba(25,26,42,0.62)';
      ctx.beginPath(); let first = true;
      for (let k = 0; k <= 26; k++) {
        const th = k / 26 * 2 * Math.PI, rr = Math.abs(g.rUs);
        const pt = [g.P[0] + (aE[0]*Math.cos(th) + aN[0]*Math.sin(th)) * rr,
                    g.P[1] + (aE[1]*Math.cos(th) + aN[1]*Math.sin(th)) * rr,
                    g.P[2] + (aE[2]*Math.cos(th) + aN[2]*Math.sin(th)) * rr];
        const ll = efLatLon(mul(norm(pt), R_EARTH));
        const p = proj(ll.lat, ll.lon);
        first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false;
      }
      ctx.closePath(); ctx.fill();
    }
    // סמן מרכז הצל
    const cp = proj(center.lat, center.lon);
    if (cp.vis) {
      ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 6, 0, 2*Math.PI); ctx.stroke();
    }

    // מתאר
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*Math.PI); ctx.stroke();

    ctx.fillStyle = cvv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(T('ההכהיה — לפי אחוז כיסוי השמש בכל מקום; הקו הכתום — מסלול מרכז הצל'), cx, L.y + 6);
    return { g, center };
  }

  // ════════════════ אובייקט האיור ════════════════
  const sim = {
    mode: 'lunar',                    // lunar | solar | globe
    einfo: null, type: 'lunar',       // הליקוי הנוכחי וסוגו
    win: { t0: 0, t1: 0 },
    t: new Date(),
    playing: false, speed: 3,         // דקות (של זמן הליקוי) לשנייה
    distOn: false, distKm: MEAN_DIST, // הדגמת מרחק הירח (ליקוי חמה)
    gLat: 0, gLon: 0, follow: true,   // מבט הגלובוס
    hintDone: false, _bound: false,

    step(dt) {
      if (!this.playing) return;
      let ms = this.t.getTime() + this.speed * dt * 60000;
      if (ms > this.win.t1) ms = this.win.t0;         // חוזר חלילה לאורך הליקוי
      this.t = new Date(ms);
    },

    // טעינת ליקוי (info של המנוע) — חישוב חלון, איפוס לרגע השיא
    setEclipse(einfo) {
      this.einfo = einfo;
      this.win = windowOf(this.type, einfo);
      this.t = new Date(einfo.peak.date.getTime());
      this._path = null;
      this.follow = true;
      const fc = $('e_follow'); if (fc) fc.checked = true;
      this._heKey = null;
      refreshList();
    },

    _typeForMode(m) { return m === 'lunar' ? 'lunar' : 'solar'; },

    setMode(m) {
      const newType = this._typeForMode(m);
      this.mode = m;
      document.querySelectorAll('#e_modeseg button').forEach(b => b.classList.toggle('active', b.dataset.emode === m));
      document.querySelectorAll('#view-eclipse [data-emode-card]').forEach(c =>
        c.style.display = c.dataset.emodeCard === m ? '' : 'none');
      const lr = $('e_locRow'); if (lr) lr.style.display = m === 'globe' ? '' : 'none';
      if (newType !== this.type || !this.einfo) {
        this.type = newType;
        try { this.setEclipse(nextEcl(newType, new Date(this.t.getTime() - 40 * 86400000))); } catch (e) {}
      }
      buildList(newType);
      refreshList();
    },

    draw() {
      if (!AE) return;
      const { ctx, W, H } = fit($('eclipseCanvas'));
      ctx.clearRect(0, 0, W, H);
      if (!this.einfo) return;
      const L = window.Sims.stageLayout($('eclipseCanvas'), W, H);
      let g = null, loc = null;
      if (this.mode === 'lunar') g = drawLunar(ctx, L, this);
      else if (this.mode === 'solar') g = drawSolar(ctx, L, this);
      else { const r = drawGlobe(ctx, L, this); g = r.g; loc = r.center; }
      if (!this.hintDone) {
        ctx.fillStyle = cvv('--ill-muted'); ctx.font = '12px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(T('לחצו ▶ הפעל להנעת הליקוי · בחרו ליקוי אחר בלוח הצד'), L.x + L.w / 2, L.y + L.h - 6);
      }
      this._hud(g, loc);
    },

    _hud(g, loc) {
      const kindHe = T(EK[this.einfo.kind] || this.einfo.kind);
      const title = (this.type === 'lunar' ? T('ליקוי לבנה') : T('ליקוי חמה')) + ' — ' + kindHe;
      const el = $('e_kind'); if (el) el.textContent = title;
      const loc8 = window.I18N ? window.I18N.dateLocale : 'he-IL';
      const ed = $('e_date');
      if (ed) ed.textContent = this.einfo.peak.date.toLocaleDateString(loc8, { day: 'numeric', month: 'short', year: 'numeric' });
      const eu = $('e_utc'); if (eu) eu.textContent = fmtUTC(this.t);
      const pct = g ? Math.round((this.type === 'lunar' ? g.umbra : g.frac) * 100) : 0;
      const ep = $('e_pct'); if (ep) ep.textContent = pct + '%';
      const elc = $('e_loc'); if (elc && loc) elc.textContent = fmtLat(loc.lat) + ' · ' + fmtLon(loc.lon);
      // תאריך עברי — פעם ביום מוצג
      const hk = Math.floor(this.einfo.peak.date.getTime() / 86400000);
      if (this._heKey !== hk && window.HebrewDate) {
        this._heKey = hk;
        window.HebrewDate(this.einfo.peak.date).then(s => { const e = $('e_date_he'); if (e && s) e.textContent = s; });
      }
    },

    sync() {
      const sc = $('e_scrub');
      if (sc && document.activeElement !== sc && this.win.t1 > this.win.t0)
        sc.value = Math.round((this.t.getTime() - this.win.t0) / (this.win.t1 - this.win.t0) * 1000);
      const sl = $('e_spdL'); if (sl) sl.textContent = this.speed.toFixed(1);
    },

    bind() {
      if (this._bound) { refreshList(); return; }
      this._bound = true;
      try { this.setEclipse(nextEcl('lunar', new Date())); } catch (e) {}
      this.setMode('lunar');

      document.querySelectorAll('#e_modeseg button').forEach(b => b.onclick = () => this.setMode(b.dataset.emode));
      $('e_play').onclick = e => { this.playing = !this.playing; this.hintDone = true; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      $('e_peak').onclick = () => { this.t = new Date(this.einfo.peak.date.getTime()); };
      $('e_speed').oninput = e => { this.speed = +e.target.value; };
      $('e_scrub').oninput = e => {
        this.t = new Date(this.win.t0 + (+e.target.value / 1000) * (this.win.t1 - this.win.t0));
        this.playing = false; $('e_play').textContent = T('▶ הפעל');
        this.hintDone = true;
      };
      $('e_prev').onclick = () => { try { this.setEclipse(prevEcl(this.type, this.einfo.peak.date)); } catch (e) {} };
      $('e_next').onclick = () => { try { this.setEclipse(seqNext(this.type, this.einfo)); } catch (e) {} };
      $('e_list').onchange = e => {
        const ms = +e.target.value; if (!ms) return;
        try { this.setEclipse(nextEcl(this.type, new Date(ms - 5 * 86400000))); } catch (er) {}
      };
      $('e_onlyTotal').onchange = () => refreshList();
      $('e_dsim').onchange = e => {
        this.distOn = e.target.checked;
        $('e_dist').disabled = !this.distOn;
        if (!this.distOn) { this.distKm = MEAN_DIST; $('e_dist').value = MEAN_DIST; $('e_distL').textContent = MEAN_DIST.toLocaleString(); }
      };
      $('e_dist').oninput = e => { this.distKm = +e.target.value; $('e_distL').textContent = this.distKm.toLocaleString(); };
      const fc = $('e_follow'); if (fc) fc.onchange = e => { this.follow = e.target.checked; };
      // גרירת הגלובוס (במצב הגלובוס בלבד)
      const cnv = $('eclipseCanvas');
      let dx = 0, dy = 0, lo0 = 0, la0 = 0, dragging = false;
      cnv.onpointerdown = e => {
        if (this.mode !== 'globe') return;
        dragging = true; dx = e.clientX; dy = e.clientY; lo0 = this.gLon; la0 = this.gLat;
        this.follow = false; if (fc) fc.checked = false;
        cnv.setPointerCapture(e.pointerId); cnv.style.cursor = 'grabbing';
      };
      cnv.onpointermove = e => {
        if (!dragging) return;
        this.gLon = (((lo0 - (e.clientX - dx) * 0.35 + 180) % 360) + 360) % 360 - 180;
        this.gLat = Math.max(-80, Math.min(80, la0 + (e.clientY - dy) * 0.35));
        window.__invalidate && window.__invalidate();
      };
      cnv.onpointerup = cnv.onpointercancel = () => { dragging = false; cnv.style.cursor = ''; };
    },
  };

  // החלפת שפה: שמות הליקויים ברשימה ובתוויות מתעדכנים
  sim.onLanguage = () => { refreshList(); sim._heKey = null; };

  window.Sims.eclipse = sim;
  // שרשור לניקויי המטמונים הכלליים (כמו dateline-sim)
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
  const _ccc = window.Sims.clearColorCache;
  window.Sims.clearColorCache = () => { _ccc && _ccc(); clearColorCache(); };
})();
