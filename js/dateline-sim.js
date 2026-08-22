// dateline-sim.js — קו התאריך
// גלובוס גדול (היטל אורתוגרפי של כדור הארץ) עם ארבעת הקווים העיקריים:
//   0°        — קו זמן יקום מתואם (גריניץ')
//   125.235°E — קו התאריך שיטת החזון איש (90° מזרחית לירושלים)
//   144.765°W — קו התאריך שיטת הגרי"מ טוקצינסקי (180° מירושלים)
//   180°      — קו התאריך שבהסכמי אומות העולם (180° מגריניץ')
// בשיטת החזו"א הקו הישר מצויר מקווקו, ולצדו קו מלא הנוטה אל סוף היבשת:
// לדעתו אין מחלקים יבשה אחת לשני תאריכים, וכל המחובר יבשתית למערב הקו נדון כמערב.
"use strict";
(function () {
  const AE = window.Astronomy;
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  const JLEM_LON = 35.2354, JLEM_LAT = 31.7784;
  const CI_LON   = JLEM_LON + 90;            // 125.2354°  — חזון איש
  const GRIT_LON = JLEM_LON - 180;           // -144.7646° — הגרי"מ טוקצינסקי
  const IDL_LON  = 180;                      // הסכמי אומות העולם

  const COL = { utc: '#dfe6ef', ci: '#ffd24d', grit: '#5ad2ff', idl: '#ff6b6b', jlem: '#7ee081' };

  // ══ מקומות שהנדון משליך עליהם ═══════════════════════════════════════
  // טוקיו וּוולינגטון — ממזרח לקו החזו"א אך ממערב ל-180 (יום אחד אחורה לחזו"א);
  // הונולולו — ממערב לקו הגרי"מ אך ממזרח ל-180 (יום אחד קדימה לגרי"מ).
  const PLACES = [
    { he: 'טוקיו — יפן',           short: 'טוקיו',    tz: 'Asia/Tokyo',       lat: 35.68,  lon: 139.69 },
    { he: 'וולינגטון — ניו זילנד', short: 'וולינגטון', tz: 'Pacific/Auckland', lat: -41.29, lon: 174.78 },
    { he: 'הונולולו — הוואי',      short: 'הונולולו',  tz: 'Pacific/Honolulu', lat: 21.31,  lon: -157.86 },
  ];
  const DAYNAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const _fmtCache = Object.create(null);
  function tzFmt(tz) {
    return _fmtCache[tz] || (_fmtCache[tz] = new Intl.DateTimeFormat('en-US',
      { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }));
  }
  // היום בשבוע והשעה המקומיים-אזרחיים במקום נתון
  function localParts(date, tz) {
    const p = {}; for (const x of tzFmt(tz).formatToParts(date)) p[x.type] = x.value;
    return { d: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday], h: (+p.hour) % 24, m: +p.minute };
  }
  // הפרש הימים מהיום האזרחי לכל שיטה, לפי קו האורך (הקווים הישרים):
  // בין קו החזו"א ל-180 — לחזו"א היום אחד אחורה; בין 180 לקו הגרי"מ — לגרי"מ אחד קדימה.
  function dayOffsets(lonE) {
    const L = ((lonE % 360) + 360) % 360;
    return { intl: 0, ci: (L > CI_LON && L <= 180) ? -1 : 0, grit: (L > 180 && L < 360 + GRIT_LON) ? 1 : 0 };
  }
  // "יום שישי" / "ליל שבת": הלילה שמן הערב (מ-18:00 בקירוב) שייך ליום שאחריו
  function jLabel(d, h) {
    d = ((d % 7) + 7) % 7;
    if (h >= 18) return T('ליל') + ' ' + T(DAYNAMES[(d + 1) % 7]);
    if (h < 6) return T('ליל') + ' ' + T(DAYNAMES[d]);
    return T('יום') + ' ' + T(DAYNAMES[d]);
  }

  // הנקודה שמתחת לשמש (subsolar) — להצללת יום/לילה על הגלובוס
  function subsolar(date) {
    try {
      const t = AE.MakeTime(date);
      const eq = AE.Equator(AE.Body.Sun, t, new AE.Observer(0, 0, 0), true, true);
      let lon = (eq.ra - AE.SiderealTime(t)) * 15;
      lon = ((lon + 180) % 360 + 360) % 360 - 180;
      return { lat: eq.dec, lon };
    } catch (e) { return null; }
  }

  // מהלך קו החזו"א בפועל: הקו לעולם אינו נע ממערב ל-90° מירושלים. על הים הוא
  // יורד ישר לאורך 125.24°E, ובמפגש עם יבשת שחלקה נמשך מזרחה מן הקו (אסיה,
  // אוסטרליה) הוא נוטה מזרחה סביב סוף היבשת — שהמחובר יבשתית נדון כמערב —
  // וחוזר אל הקו הישר בנקודה שבה שב החוף מערבה. הקו הישר בתוך היבשות מסומן
  // במקווקו.
  // קווי החוף נגזרו ממפת הגלובוס שבאיור עצמו (זיהוי גוש היבשה המחובר ועקיבה
  // אחר גבולו), ולכן הקו חובק בדיוק את החוף הנראה. איים שאינם מחוברים יבשתית
  // אינם מוקפים — אף שברזולוציית המפה מיצר צר עלול להיראות סגור (סחלין).
  // עדיין להמחשת העיקרון, לא לפסיקה למעשה.
  const CI_PATH = [
    [90, CI_LON],
    // אסיה — גבול היבשת המחוברת, מדלתת הלנה שבחוף הצפוני (73.5°צ) מזרחה:
    // חופי סיביר הארקטיים, צ'וקוטקה ומיצר ברינג (שם חוצה הקו את קו 180°),
    // דרומה בים ברינג וסביב חצי־האי קמצ'טקה, חופי ים אוכוצק, פרימוריה,
    // וסביב חצי־האי הקוריאני — עד ששב החוף אל הקו במפרץ קוריאה (37.9°צ).
    [73.48, CI_LON], [73.48, 128.09], [72.77, 129.26], [72.54, 128.79], [72.3, 129.26],
    [72.3, 128.32], [71.84, 128.32], [71.84, 129.26], [71.6, 128.79], [71.37, 129.02],
    [70.66, 131.37], [71.84, 132.54], [71.37, 133.24], [71.6, 136.29], [71.13, 137.7],
    [71.6, 138.16], [71.37, 139.8], [71.6, 140.04], [72.3, 139.34], [72.77, 140.74],
    [72.54, 145.66], [72.07, 146.37], [72.07, 149.88], [71.37, 150.12], [70.9, 151.99],
    [70.9, 158.79], [70.66, 159.73], [69.96, 159.73], [69.49, 160.43], [69.49, 167.23],
    [69.96, 168.63], [69.73, 169.34], [69.73, 168.4], [69.26, 168.4], [68.79, 170.51],
    [69.26, 170.98], [69.73, 170.27], [69.96, 170.74], [69.73, 176.6], [67.85, -175.66],
    [66.21, -174.26], [66.91, -174.02], [66.91, -171.68], [66.21, -170.04], [65.74, -171.91],
    [64.8, -173.09], [64.34, -172.85], [64.8, -175.43], [65.74, -176.37], [65.51, -178.24],
    [66.21, -179.41], [65.04, -179.88], [64.57, 177.54], [62.7, 179.65], [62.46, 179.18],
    [62.7, 177.07], [61.99, 174.02], [60.59, 170.74], [60.12, 170.51], [60.12, 169.8],
    [60.59, 169.57], [60.59, 166.99], [59.88, 164.88], [60.12, 163.71], [58.01, 161.84],
    [57.77, 163.01], [56.84, 162.77], [56.37, 163.24], [56.37, 162.3], [55.43, 161.6],
    [54.73, 161.84], [54.49, 160.43], [53.79, 159.73], [53.32, 159.96], [53.09, 158.79],
    [50.98, 156.91], [54.49, 155.74], [56.6, 155.98], [57.77, 156.91], [58.01, 158.55],
    [60.12, 161.6], [60.82, 163.48], [62.46, 164.65], [62.7, 164.41], [62.7, 163.48],
    [61.76, 163.01], [60.82, 160.9], [61.05, 159.96], [61.99, 160.2], [61.99, 157.38],
    [59.88, 154.34], [59.41, 155.04], [59.18, 154.8], [59.41, 153.63], [58.95, 152.93],
    [58.95, 151.29], [59.18, 151.99], [59.65, 151.52], [59.88, 150.12], [59.41, 148.95],
    [59.41, 142.62], [54.73, 135.35], [54.49, 136.76], [53.79, 136.99], [54.26, 137.46],
    [53.32, 137.93], [54.26, 138.87], [54.26, 139.8], [53.32, 141.21], [52.15, 141.21],
    [51.21, 140.51], [48.4, 140.04], [43.48, 135.12], [42.77, 133.48], [43.24, 131.84],
    [41.6, 129.73], [40.9, 129.73], [39.49, 127.38], [37.38, 129.26], [35.27, 129.26],
    [34.34, 126.68], [37.15, 126.45], [36.91, 126.68], [37.38, 126.91], [38.09, 125.74],
    [37.85, CI_LON],
    // מקוריאה ועד אוסטרליה — הקו הישר בים.
    // אוסטרליה — מחופה הצפוני שבקימברלי (14.7°ד) מזרחה: מפרץ ג'וזף בונפרט,
    // דארווין וארנהם, מפרץ קרפנטריה וכף יורק, ואז החוף המזרחי דרומה עד
    // וילסונס פרומונטורי, ומן החוף הדרומי מערבה לאורך המפרץ האוסטרלי הגדול
    // עד ששב החוף מערבה מן הקו (32.5°ד).
    [-14.65, CI_LON], [-13.95, 127.38], [-14.88, 128.09], [-15.12, 129.49], [-14.18, 129.49],
    [-12.3, 130.9], [-12.3, 132.3], [-11.6, 132.77], [-12.3, 135.12], [-12.07, 136.52],
    [-12.54, 136.76], [-13.48, 135.82], [-14.88, 135.35], [-16.76, 138.16], [-16.99, 139.1],
    [-17.46, 139.34], [-17.7, 140.51], [-16.29, 141.45], [-11.84, 141.91], [-10.9, 142.62],
    [-13.01, 143.55], [-13.95, 143.55], [-14.88, 145.2], [-18.87, 146.13], [-20.27, 148.71],
    [-22.62, 149.88], [-22.15, 150.12], [-22.62, 150.82], [-23.09, 150.59], [-25.2, 152.7],
    [-27.54, 153.4], [-31.29, 152.93], [-35.27, 150.35], [-37.38, 149.88], [-37.62, 148.24],
    [-38.79, 146.13], [-38.09, 144.73], [-38.79, 143.32], [-37.85, 140.27], [-36.45, 139.8],
    [-35.51, 138.87], [-35.51, 138.4], [-34.8, 138.63], [-34.1, 138.16], [-35.04, 137.7],
    [-35.27, 136.99], [-33.16, 138.16], [-32.7, 137.7], [-33.63, 137.23], [-34.8, 135.59],
    [-32.23, 133.95], [-31.52, 131.6], [-31.52, 129.02], [-32.23, 127.38], [-32.46, CI_LON],
    // ומשם הקו הישר עד הקוטב הדרומי
    [-90, CI_LON],
  ];

  // שטח הספק של הגרי"מ טוקצינסקי: מערב אלסקה — מקו התאריך שלו (144.77°W)
  // מערבה עד מיצר ברינג. בספרו "היומם בכדור הארץ" הסתפק אם השטח, המחובר
  // יבשתית למזרח הקו, נדון כמזרח או כמערב. מוקף בקו מקווקו בצבע שיטתו.
  // קו החוף נגזר ממפת הגלובוס שבאיור, כדרך שנגזר קו החזו"א שלמעלה: מחוף
  // הים הצפוני (70.0°צ) מערבה דרך פוינט בארו, חצי־האי סוורד וכף הנסיך
  // מוויילס שמול מיצר ברינג, דלתת היוקון, מפרץ בריסטול וחצי־האי האלסקי,
  // ובחזרה מזרחה במפרץ קוק ובמצרי הנסיך ויליאם עד הקו (60.4°צ).
  const GRIT_DOUBT = [
    [69.96, GRIT_LON], [70.43, -152.23], [70.9, -152.7], [70.66, -154.34], [71.13, -155.74],
    [70.2, -162.3], [68.79, -164.18], [68.79, -166.29], [68.32, -166.29], [67.85, -164.41],
    [67.15, -163.48], [67.15, -162.07], [66.45, -161.6], [65.98, -161.84], [66.45, -165.35],
    [65.98, -166.05], [65.74, -167.93], [65.51, -166.76], [65.04, -166.76], [64.57, -166.05],
    [64.57, -162.3], [65.04, -161.13], [64.34, -161.13], [63.87, -160.66], [63.63, -160.9],
    [62.93, -163.24], [63.16, -164.41], [61.52, -166.05], [61.29, -165.35], [60.82, -164.88],
    [60.59, -165.12], [59.88, -164.18], [60.12, -162.3], [59.65, -161.84], [58.71, -161.84],
    [58.95, -159.49], [58.48, -158.79], [58.71, -159.02], [58.95, -158.55], [58.24, -157.38],
    [57.3, -158.09], [56.6, -159.02], [56.6, -159.73], [55.66, -160.66], [55.66, -162.54],
    [55.2, -162.77], [54.96, -164.41], [54.49, -164.88], [54.73, -163.48], [55.2, -163.01],
    [54.96, -162.77], [55.9, -159.02], [58.01, -155.27], [58.24, -154.1], [58.95, -153.4],
    [59.18, -154.1], [59.65, -153.87], [59.88, -152.93], [61.29, -151.05], [61.05, -149.65],
    [60.59, -151.29], [59.88, -151.76], [59.65, -151.29], [59.41, -151.76], [60.12, -148.48],
    [60.59, -148.01], [60.82, -148.48], [61.05, -148.24], [61.05, -146.6], [60.35, GRIT_LON],
    [69.96, GRIT_LON],
  ];

  // ── טקסטורת כדור הארץ (equirectangular) ──────────────────────────────
  // מפה שטוחה (ים · יבשה · קרח) ולא תצלום לוויין: על הגלובוס הקטן קווי החוף
  // והיבשות ניכרים בה הרבה יותר, וקווי התאריך הצבעוניים בולטים מעליה.
  const IMG = new Image(); IMG.src = window.ASSETS.globe_map;
  IMG.onload = () => { _tex = null; _cache.key = ''; window.__invalidate && window.__invalidate(); };
  let _tex = null;
  function texture() {
    if (_tex) return _tex;
    if (!(IMG.complete && IMG.naturalWidth)) return null;
    const w = IMG.naturalWidth, h = IMG.naturalHeight;
    const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
    const octx = oc.getContext('2d'); octx.drawImage(IMG, 0, 0);
    return (_tex = { data: octx.getImageData(0, 0, w, h).data, w, h });
  }

  // מטמון מידות הקנבס
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

  // ── רינדור גוף הכדור לחוצץ חוץ-מסך; מחושב מחדש רק כשהמבט/הגודל/השמש משתנים ──
  const _cache = { key: '', cv: null };
  function globeBuffer(lat0, lon0, R, sun) {
    const tex = texture(); if (!tex) return null;
    const px = Math.max(64, Math.min(900, Math.round(2 * R * (window.devicePixelRatio || 1))));
    const sunKey = sun ? sun.lat.toFixed(1) + ',' + sun.lon.toFixed(1) : 'x';
    const key = lat0.toFixed(2) + '|' + lon0.toFixed(2) + '|' + px + '|' + sunKey;
    if (_cache.key === key) return _cache.cv;
    if (!_cache.cv) _cache.cv = document.createElement('canvas');
    const cvs = _cache.cv;
    if (cvs.width !== px) { cvs.width = px; cvs.height = px; }
    const g = cvs.getContext('2d');
    const img = g.createImageData(px, px), out = img.data;
    const la = lat0 * RAD, lo = lon0 * RAD;
    const r0 = -Math.sin(lo), r1 = Math.cos(lo);                       // right (מזרח במרכז)
    const u0 = -Math.sin(la) * Math.cos(lo), u1 = -Math.sin(la) * Math.sin(lo), u2 = Math.cos(la);
    const v0 = Math.cos(la) * Math.cos(lo), v1 = Math.cos(la) * Math.sin(lo), v2 = Math.sin(la);
    const td = tex.data, tw = tex.w, th = tex.h, C = px / 2;
    // וקטור השמש במערכת הגאוגרפית (x לכיוון קו אורך 0 על המשווה)
    let s0 = 0, s1 = 0, s2 = 0;
    if (sun) {
      const sl = sun.lat * RAD, so = sun.lon * RAD;
      s0 = Math.cos(sl) * Math.cos(so); s1 = Math.cos(sl) * Math.sin(so); s2 = Math.sin(sl);
    }
    for (let y = 0; y < px; y++) {
      const b = (C - y - 0.5) / C;
      for (let x = 0; x < px; x++) {
        const a = (x + 0.5 - C) / C, rr = a * a + b * b, o = (y * px + x) << 2;
        if (rr > 1) { out[o + 3] = 0; continue; }
        const z = Math.sqrt(1 - rr);
        const Px = a * r0 + b * u0 + z * v0, Py = a * r1 + b * u1 + z * v1, Pz = b * u2 + z * v2;
        let uu = (Math.atan2(Py, Px) * DEG + 180) / 360; uu -= Math.floor(uu);
        let vv = 0.5 - Math.asin(Math.max(-1, Math.min(1, Pz))) / Math.PI;
        vv = vv < 0 ? 0 : (vv > 0.999999 ? 0.999999 : vv);
        const ti = ((Math.floor(vv * th) * tw) + Math.floor(uu * tw)) << 2;
        // הצללת יום/לילה לפי כיוון השמש; צד הלילה מעומעם אך נשאר קריא,
        // כדי שהקווים והמפה יוסיפו להיראות. בלי שמש — הבהרה אחידה.
        let shf = 1.1;
        if (sun) {
          const d = Px * s0 + Py * s1 + Pz * s2;
          const t = d <= -0.05 ? 0 : d >= 0.05 ? 1 : (d + 0.05) / 0.1;
          shf = 0.5 + 0.6 * t;
        }
        out[o] = td[ti] * shf; out[o + 1] = td[ti + 1] * shf; out[o + 2] = td[ti + 2] * shf; out[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    _cache.key = key;
    return cvs;
  }

  const sim = {
    // מרכז המבט הפותח ניטרלי — באמצע האוקיינוס השקט, כך ששלושת קווי התאריך
    // (חזו"א, אוה"ע והגרי"מ) נראים יחד ואף שיטה אינה במרכז.
    lat0: 10, lon0: 170, playing: false, _bound: false,
    date: new Date(), speed: 0.5,          // מהירות ההנעה: שעות לשנייה
    show: { utc: true, ci: true, grit: true, idl: true, grid: true, daynight: true },
    step(dt) { if (this.playing) this.date = new Date(this.date.getTime() + this.speed * dt * 3600000); },

    // היטל נקודה גאוגרפית למסך; vis=false כשהיא בצדו הרחוק של הכדור
    proj(lat, lon, cx, cy, R) {
      const la = lat * RAD, lo = lon * RAD, la0 = this.lat0 * RAD, lo0 = this.lon0 * RAD;
      const P = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
      const right = [-Math.sin(lo0), Math.cos(lo0), 0];
      const up = [-Math.sin(la0) * Math.cos(lo0), -Math.sin(la0) * Math.sin(lo0), Math.cos(la0)];
      const view = [Math.cos(la0) * Math.cos(lo0), Math.cos(la0) * Math.sin(lo0), Math.sin(la0)];
      const d = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
      return { x: cx + R * d(P, right), y: cy - R * d(P, up), vis: d(P, view) > 0 };
    },

    // ציור מסלול (רשימת [lat,lon]) עם דגימת-ביניים והסתרה בצדו הרחוק של הכדור
    path(ctx, pts, cx, cy, R, col, width, dash) {
      ctx.strokeStyle = col; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < pts.length - 1; i++) {
        const [la1, lo1] = pts[i]; let [la2, lo2] = pts[i + 1];
        let dLon = lo2 - lo1;                                   // מעבר קו ±180 — הפרש קצר
        if (dLon > 180) dLon -= 360; else if (dLon < -180) dLon += 360;
        const n = Math.max(2, Math.ceil(Math.max(Math.abs(la2 - la1), Math.abs(dLon)) / 1.5));
        for (let k = 0; k <= n; k++) {
          const t = k / n, p = this.proj(la1 + (la2 - la1) * t, lo1 + dLon * t, cx, cy, R);
          if (!p.vis) { pen = false; continue; }
          if (pen) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); pen = true; }
        }
      }
      ctx.stroke(); ctx.setLineDash([]);
    },

    meridian(lon) {
      const p = []; for (let la = -90; la <= 90; la += 2) p.push([la, lon]); return p;
    },

    // תווית לקו — על הנקודה הנראית הקרובה לגובה מרכז המבט
    label(ctx, txt, lon, cx, cy, R, col, dy) {
      const p = this.proj(this.lat0, lon, cx, cy, R);
      if (!p.vis) return;
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(txt).width + 10;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(p.x - w / 2, p.y + dy - 9, w, 18);
      ctx.fillStyle = col; ctx.fillText(txt, p.x, p.y + dy);
    },

    draw() {
      const { ctx, W, H } = fit($('datelineCanvas'));
      ctx.clearRect(0, 0, W, H);
      // אזור הציור הפנוי מה-HUD (רצועה מימין במסך רחב, בראש במסך צר)
      const L = window.Sims.stageLayout($('datelineCanvas'), W, H);
      const cx = L.x + L.w / 2, cy = L.y + L.h / 2, R = Math.max(60, Math.min(L.w, L.h) / 2 - 18);

      const sun = this.show.daynight ? subsolar(this.date) : null;
      const buf = globeBuffer(this.lat0, this.lon0, R, sun);
      if (buf) ctx.drawImage(buf, cx - R, cy - R, 2 * R, 2 * R);
      else { ctx.fillStyle = '#2f6fb0'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill(); }

      // רשת קווי אורך ורוחב — כל 15°, שהם שיעור תנועת השמש בשעה אחת: כל קו
      // אורך שכן הוא שעה. קווי הרוחב באותה צפיפות, ובהם מודגשים קו המשוה,
      // חוגי הסרטן והגדי (23.44°) ומעגלי הקוטב (66.56°).
      if (this.show.grid) {
        for (let la = -75; la <= 75; la += 15) {
          const p = []; for (let lo = -180; lo <= 180; lo += 3) p.push([la, lo]);
          this.path(ctx, p, cx, cy, R, la === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)', la === 0 ? 1.3 : 0.7);
        }
        for (const la of [-66.56, -23.44, 23.44, 66.56]) {
          const p = []; for (let lo = -180; lo <= 180; lo += 3) p.push([la, lo]);
          this.path(ctx, p, cx, cy, R, 'rgba(255,255,255,0.34)', 0.9, [4, 4]);
        }
        for (let lo = -180; lo < 180; lo += 15) this.path(ctx, this.meridian(lo), cx, cy, R, 'rgba(255,255,255,0.28)', 0.7);
      }

      // ארבעת הקווים
      if (this.show.utc)  this.path(ctx, this.meridian(0), cx, cy, R, COL.utc, 2.6);
      if (this.show.idl)  this.path(ctx, this.meridian(IDL_LON), cx, cy, R, COL.idl, 2.6);
      if (this.show.grit) {
        this.path(ctx, this.meridian(GRIT_LON), cx, cy, R, COL.grit, 2.6);
        // מערב אלסקה — שטח שהסתפק בו הגרי"מ, מוקף מקווקו בצבע שיטתו
        this.path(ctx, GRIT_DOUBT, cx, cy, R, COL.grit, 2.2, [5, 4]);
      }
      if (this.show.ci) {
        this.path(ctx, this.meridian(CI_LON), cx, cy, R, COL.ci, 1.8, [5, 5]);   // הקו הישר, בתוך היבשת
        this.path(ctx, CI_PATH, cx, cy, R, COL.ci, 3);                            // הקו בפועל — עד סוף היבשת
      }

      // קו האורך של ירושלים — מקווקו, בצבע סימונה: ממנו נמדדים שני קווי
      // התאריך שבמחלוקת (90° מזרחה לחזו"א, 180° לגרי"מ)
      this.path(ctx, this.meridian(JLEM_LON), cx, cy, R, COL.jlem, 1.6, [5, 5]);

      // ירושלים
      const j = this.proj(JLEM_LAT, JLEM_LON, cx, cy, R);
      if (j.vis) {
        ctx.fillStyle = COL.jlem; ctx.beginPath(); ctx.arc(j.x, j.y, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const w = ctx.measureText(T('ירושלים')).width + 10;
        ctx.fillRect(j.x - w / 2, j.y - 24, w, 17);
        ctx.fillStyle = COL.jlem; ctx.fillText(T('ירושלים'), j.x, j.y - 9);
      }

      // המקומות שהנדון משליך עליהם
      for (const p of PLACES) {
        const q = this.proj(p.lat, p.lon, cx, cy, R);
        if (!q.vis) continue;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const w = ctx.measureText(T(p.short)).width + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(q.x - w / 2, q.y + 5, w, 14);
        ctx.fillStyle = '#ffffff'; ctx.fillText(T(p.short), q.x, q.y + 7);
      }

      // תוויות הקווים — במרווחים אנכיים שונים כדי שלא ייערמו
      if (this.show.utc)  this.label(ctx, T('גריניץ׳ 0°'), 0, cx, cy, R, COL.utc, -34);
      if (this.show.ci)   this.label(ctx, T('חזו״א'), CI_LON, cx, cy, R, COL.ci, -12);
      if (this.show.grit) this.label(ctx, T('גרי״מ טוקצינסקי'), GRIT_LON, cx, cy, R, COL.grit, 12);
      if (this.show.idl)  this.label(ctx, T('הסכמי אוה״ע 180°'), IDL_LON, cx, cy, R, COL.idl, 34);

      // מתאר הכדור
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();

      $('d_center').textContent = fmtLon(this.lon0) + ' · ' + fmtLat(this.lat0);
      // שעון ישראל + לוח המקומות — מתעדכנים רק כשהדקה משתנה (Intl יקר יחסית)
      const mKey = Math.floor(this.date.getTime() / 60000);
      if (this._mKey !== mKey) { this._mKey = mKey; this._updateClocks(); }
    },

    _updateClocks() {
      const il = localParts(this.date, 'Asia/Jerusalem');
      const tt = c => String(c.h).padStart(2, '0') + ':' + String(c.m).padStart(2, '0');
      $('d_iltime').textContent = jLabel(il.d, il.h) + ' ' + tt(il);
      const el = $('d_places'); if (!el) return;
      el.innerHTML = PLACES.map(p => {
        const c = localParts(this.date, p.tz), o = dayOffsets(p.lon), t = tt(c);
        return `<div style="margin-bottom:9px;font-size:0.75em;line-height:1.75">
          <b>${T(p.he)}</b><br>
          <span style="color:${COL.idl}">■</span> ${T('הסכמי אוה״ע')}: <b>${jLabel(c.d + o.intl, c.h)}</b> ${T('בשעה')} ${t}<br>
          <span style="color:${COL.ci}">■</span> ${T('שיטת החזו״א')}: <b>${jLabel(c.d + o.ci, c.h)}</b> ${T('בשעה')} ${t}<br>
          <span style="color:${COL.grit}">■</span> ${T('שיטת הגרי״מ')}: <b>${jLabel(c.d + o.grit, c.h)}</b> ${T('בשעה')} ${t}
        </div>`;
      }).join('');
    },

    _syncDate() {
      const d = this.date;
      const set = (id, v) => { const el = $(id); if (el && !window.__fieldLocked(el)) el.value = v; };
      set('d_dd', d.getDate()); set('d_mm', d.getMonth() + 1); set('d_yy', d.getFullYear());
      set('d_hh', d.getHours()); set('d_mi', d.getMinutes());
    },

    sync() {
      $('d_lonL').textContent = fmtLon(this.lon0);
      $('d_latL').textContent = fmtLat(this.lat0);
      if (document.activeElement !== $('d_lon')) $('d_lon').value = Math.round(this.lon0);
      if (document.activeElement !== $('d_lat')) $('d_lat').value = Math.round(this.lat0);
      this._syncDate();
    },

    goto(lon, lat) { this.lon0 = lon; this.lat0 = (lat === undefined ? this.lat0 : lat); },

    bind() {
      if (this._bound) return; this._bound = true;
      this._syncDate();
      $('d_lon').oninput = e => this.lon0 = +e.target.value;
      $('d_lat').oninput = e => this.lat0 = +e.target.value;
      $('d_goJlem').onclick = () => this.goto(JLEM_LON, 25);
      $('d_goCI').onclick   = () => this.goto(CI_LON, 10);
      $('d_goGRIT').onclick = () => this.goto(GRIT_LON, 10);
      $('d_goIDL').onclick  = () => this.goto(IDL_LON, 10);
      for (const [id, k] of [['d_utc','utc'],['d_ci','ci'],['d_grit','grit'],['d_idl','idl'],['d_grid','grid'],['d_daynight','daynight']])
        $(id).onchange = e => this.show[k] = e.target.checked;
      // בקרת זמן (שעון ישראל = שעון המחשב)
      $('d_play').onclick = e => { this.playing = !this.playing; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      $('d_now').onclick = () => { this.date = new Date(); this.playing = false; $('d_play').textContent = T('▶ הפעל'); this._syncDate(); };
      $('d_speed').oninput = e => { this.speed = +e.target.value; $('d_spdL').textContent = (+e.target.value).toFixed(1); };
      $('d_go').onclick = () => {
        const y = +$('d_yy').value, m = +$('d_mm').value, d = +$('d_dd').value;
        if (!y || !m || !d) return;
        this.date = new Date(y, m - 1, d, +$('d_hh').value || 0, +$('d_mi').value || 0, 0);
        this.playing = false; $('d_play').textContent = T('▶ הפעל');
      };
      // גרירה לסיבוב הגלובוס
      const cnv = $('datelineCanvas');
      let dx = 0, dy = 0, lo0 = 0, la0 = 0, dragging = false;
      cnv.style.cursor = 'grab';
      cnv.onpointerdown = e => { dragging = true; dx = e.clientX; dy = e.clientY; lo0 = this.lon0; la0 = this.lat0; cnv.setPointerCapture(e.pointerId); cnv.style.cursor = 'grabbing'; };
      cnv.onpointermove = e => {
        if (!dragging) return;
        this.lon0 = (((lo0 - (e.clientX - dx) * 0.35 + 180) % 360) + 360) % 360 - 180;
        this.lat0 = Math.max(-80, Math.min(80, la0 + (e.clientY - dy) * 0.35));
        window.__invalidate && window.__invalidate();
      };
      cnv.onpointerup = cnv.onpointercancel = () => { dragging = false; cnv.style.cursor = 'grab'; };
    },
  };

  function fmtLon(l) { return Math.abs(l).toFixed(0) + '° ' + (l >= 0 ? T('מזרח') : T('מערב')); }
  function fmtLat(l) { return Math.abs(l).toFixed(0) + '° ' + (l >= 0 ? T('צפון') : T('דרום')); }

  // החלפת שפה: לוח המקומות נבנה לפי מטמון-דקה — מאלצים בנייה מחדש
  sim.onLanguage = () => { sim._mKey = null; };

  window.Sims.dateline = sim;
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
})();
