// dateline-sim.js — קו התאריך
// גלובוס גדול (היטל אורתוגרפי של כדור הארץ) עם ארבעת הקווים העיקריים:
//   0°        — קו זמן יקום מתואם (גריניץ')
//   125.235°E — קו התאריך שיטת החזון איש (90° מזרחית לירושלים)
//   144.765°W — קו התאריך שיטת הגרי"מ טוקצינסקי (180° מירושלים)
//   180°      — קו התאריך שבהסכמי אומות העולם (180° מגריניץ')
// בשיטת החזו"א הקו הישר מצויר מקווקו, ולצדו קו מלא הנוטה אל סוף היבשת:
// לדעתו אין מחלקים יבשה אחת לשני תאריכים, וכל המחובר יבשית למערב הקו נדון כמערב.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  const JLEM_LON = 35.2354, JLEM_LAT = 31.7784;
  const CI_LON   = JLEM_LON + 90;            // 125.2354°  — חזון איש
  const GRIT_LON = JLEM_LON - 180;           // -144.7646° — הגרי"מ טוקצינסקי
  const IDL_LON  = 180;                      // הסכמי אומות העולם

  const COL = { utc: '#dfe6ef', ci: '#ffd24d', grit: '#5ad2ff', idl: '#ff6b6b', jlem: '#7ee081' };

  // מהלך קו החזו"א בפועל: יורד לאורך 125.24°E, ובמפגש עם יבשת הנמשכת ממערבו
  // הוא נוטה מזרחה עד סוף אותה יבשת (אסיה, ואחר כך אוסטרליה) וחוזר אל הקו הישר.
  // הקואורדינטות מקורבות — להמחשת העיקרון, לא לפסיקה למעשה.
  const CI_PATH = [
    [90, CI_LON], [74, CI_LON],
    // חופה המזרחי של אסיה: סיביר → צ'וקוטקה → קמצ'טקה → ים אוכוצק → קוריאה
    [73, 129], [72, 140], [70, 160], [69, 180], [66, -170], [64, -173], [62, 179],
    [60, 170], [56, 163], [51, 157], [54, 155], [59, 152], [59, 143], [53, 141],
    [48, 140], [43, 132], [39, 128], [35, 129], [37, 126], [34, 126],
    // חופה של סין → וייטנאם → חצי האי מלאיה
    [32, 121], [25, 119], [22, 114], [21, 108], [16, 109], [11, 109], [9, 106], [6, 103], [1.3, 104],
    // מכאן ואילך אין יבשת מחוברת — חזרה אל הקו הישר
    [1.3, CI_LON], [-13.5, CI_LON],
    // אוסטרליה: חופה הצפוני ואז החוף המזרחי דרומה
    [-12, 130], [-12, 136], [-11, 142], [-16, 146], [-24, 153], [-28, 153.6],
    [-33, 151.3], [-37, 150], [-39, 146.4],
    [-39, CI_LON], [-90, CI_LON],
  ];

  // ── טקסטורת כדור הארץ (equirectangular) ──────────────────────────────
  const IMG = new Image(); IMG.src = window.ASSETS.globe_earth;
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

  // ── רינדור גוף הכדור לחוצץ חוץ-מסך; מחושב מחדש רק כשהמבט/הגודל משתנים ──
  const _cache = { key: '', cv: null };
  function globeBuffer(lat0, lon0, R) {
    const tex = texture(); if (!tex) return null;
    const px = Math.max(64, Math.min(900, Math.round(2 * R * (window.devicePixelRatio || 1))));
    const key = lat0.toFixed(2) + '|' + lon0.toFixed(2) + '|' + px;
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
        // הבהרה קלה — התמונה כהה יחסית, וכאן אין הצללת יום/לילה
        out[o] = td[ti] * 1.32; out[o + 1] = td[ti + 1] * 1.32; out[o + 2] = td[ti + 2] * 1.32; out[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    _cache.key = key;
    return cvs;
  }

  const sim = {
    lat0: 10, lon0: 125, playing: false, _bound: false,
    show: { utc: true, ci: true, grit: true, idl: true, grid: true },
    step() {},

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

      const buf = globeBuffer(this.lat0, this.lon0, R);
      if (buf) ctx.drawImage(buf, cx - R, cy - R, 2 * R, 2 * R);
      else { ctx.fillStyle = '#2f6fb0'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill(); }

      // רשת קווי אורך ורוחב
      if (this.show.grid) {
        for (let la = -60; la <= 60; la += 30) {
          const p = []; for (let lo = -180; lo <= 180; lo += 3) p.push([la, lo]);
          this.path(ctx, p, cx, cy, R, la === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)', la === 0 ? 1.2 : 0.7);
        }
        for (let lo = -180; lo < 180; lo += 30) this.path(ctx, this.meridian(lo), cx, cy, R, 'rgba(255,255,255,0.22)', 0.7);
      }

      // ארבעת הקווים
      if (this.show.utc)  this.path(ctx, this.meridian(0), cx, cy, R, COL.utc, 2.6);
      if (this.show.idl)  this.path(ctx, this.meridian(IDL_LON), cx, cy, R, COL.idl, 2.6);
      if (this.show.grit) this.path(ctx, this.meridian(GRIT_LON), cx, cy, R, COL.grit, 2.6);
      if (this.show.ci) {
        this.path(ctx, this.meridian(CI_LON), cx, cy, R, COL.ci, 1.8, [5, 5]);   // הקו הישר, בתוך היבשת
        this.path(ctx, CI_PATH, cx, cy, R, COL.ci, 3);                            // הקו בפועל — עד סוף היבשת
      }

      // ירושלים
      const j = this.proj(JLEM_LAT, JLEM_LON, cx, cy, R);
      if (j.vis) {
        ctx.fillStyle = COL.jlem; ctx.beginPath(); ctx.arc(j.x, j.y, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const w = ctx.measureText('ירושלים').width + 10;
        ctx.fillRect(j.x - w / 2, j.y - 24, w, 17);
        ctx.fillStyle = COL.jlem; ctx.fillText('ירושלים', j.x, j.y - 9);
      }

      // תוויות הקווים — במרווחים אנכיים שונים כדי שלא ייערמו
      if (this.show.utc)  this.label(ctx, 'גריניץ׳ 0°', 0, cx, cy, R, COL.utc, -34);
      if (this.show.ci)   this.label(ctx, 'חזו״א', CI_LON, cx, cy, R, COL.ci, -12);
      if (this.show.grit) this.label(ctx, 'גרי״מ טוקצינסקי', GRIT_LON, cx, cy, R, COL.grit, 12);
      if (this.show.idl)  this.label(ctx, 'הסכמי אוה״ע 180°', IDL_LON, cx, cy, R, COL.idl, 34);

      // מתאר הכדור
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();

      $('d_center').textContent = fmtLon(this.lon0) + ' · ' + fmtLat(this.lat0);
    },

    sync() {
      $('d_lonL').textContent = fmtLon(this.lon0);
      $('d_latL').textContent = fmtLat(this.lat0);
      if (document.activeElement !== $('d_lon')) $('d_lon').value = Math.round(this.lon0);
      if (document.activeElement !== $('d_lat')) $('d_lat').value = Math.round(this.lat0);
    },

    goto(lon, lat) { this.lon0 = lon; this.lat0 = (lat === undefined ? this.lat0 : lat); },

    bind() {
      if (this._bound) return; this._bound = true;
      $('d_lon').oninput = e => this.lon0 = +e.target.value;
      $('d_lat').oninput = e => this.lat0 = +e.target.value;
      $('d_goJlem').onclick = () => this.goto(JLEM_LON, 25);
      $('d_goCI').onclick   = () => this.goto(CI_LON, 10);
      $('d_goGRIT').onclick = () => this.goto(GRIT_LON, 10);
      $('d_goIDL').onclick  = () => this.goto(IDL_LON, 10);
      for (const [id, k] of [['d_utc','utc'],['d_ci','ci'],['d_grit','grit'],['d_idl','idl'],['d_grid','grid']])
        $(id).onchange = e => this.show[k] = e.target.checked;
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

  function fmtLon(l) { return Math.abs(l).toFixed(0) + '° ' + (l >= 0 ? 'מזרח' : 'מערב'); }
  function fmtLat(l) { return Math.abs(l).toFixed(0) + '° ' + (l >= 0 ? 'צפון' : 'דרום'); }

  window.Sims.dateline = sim;
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
})();
