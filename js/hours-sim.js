// hours-sim.js — שרי השעות (שצ״ם חנכ״ל) וארבע התקופות
// שבעת כוכבי הלכת משמשים בשעות היממה על הסדר שבתאי·צדק·מאדים·חמה·נוגה·כוכב·לבנה,
// שעה ראשונה של יום ראשון לחמה. מכיוון ש-24 = 3×7+3, מתקדם שר השעה הראשונה בשלושה
// בכל יום — ומכאן שר לכל יום משבעת ימי השבוע.
// השעות שבלוח ובחיווי הן שעות זמניות: היום מהזריחה עד השקיעה והלילה מהשקיעה עד
// הזריחה, כל אחד מחולק לשתים-עשרה. חשבון התקופות (שמואל) לעומת זאת בשעות שוות
// מתחילת הלילה — ראו עירובין נ״ו ע״א וברש״י ד״ה ואין תקופה בשם ר׳ שבתי דונולו.
"use strict";
(function () {
  const AE = window.Astronomy;
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? window.I18N.t(s) : s);

  const PLANETS = [
    { he: 'שבתאי', ab: 'ש', color: '#b0a060' },
    { he: 'צדק',   ab: 'צ', color: '#c8a870' },
    { he: 'מאדים', ab: 'מ', color: '#d05030' },
    { he: 'חמה',   ab: 'ח', color: '#f5c842' },
    { he: 'נוגה',  ab: 'נ', color: '#e8c870' },
    { he: 'כוכב',  ab: 'כ', color: '#a09080' },
    { he: 'לבנה',  ab: 'ל', color: '#c8c8c8' },
  ];
  const DOW = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
  const DOW_S = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  // שר השעה: d = יום בשבוע (0 = ראשון), n = מספר השעה מתחילת הלילה (0..23;
  // 0..11 שעות הלילה, 12..23 שעות היום). שעה ראשונה של יום א׳ (n=12) — חמה.
  const rulerIdx = (d, n) => (((3 + 3 * d - 12 + n) % 7) + 7) % 7;
  const ruler = (d, n) => PLANETS[rulerIdx(d, n)];
  const dayRuler = d => PLANETS[((3 + 3 * d) % 7 + 7) % 7];

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
  const _cc = Object.create(null);
  const cv = n => { if (_cc[n] === undefined) _cc[n] = getComputedStyle(document.body).getPropertyValue(n).trim() || ''; return _cc[n]; };
  function clearColorCache() { for (const k in _cc) delete _cc[k]; }

  // ══ שעות זמניות ═══════════════════════════════════════════════════════
  // מאתרים את הזריחה/השקיעה האחרונות שלפני הרגע ואת הבאות אחריו, וקובעים
  // אם עתה יום או לילה ובאיזו שעה זמנית.
  function seasonal(date, lat, lon) {
    let obs;
    try { obs = new AE.Observer(lat, lon, 0); } catch (_) { obs = null; }
    const find = (dir, from, days) => {
      try { const e = AE.SearchRiseSet(AE.Body.Sun, obs, dir, AE.MakeTime(from), days); return e ? e.date : null; } catch (_) { return null; }
    };
    const lastBefore = dir => {
      let from = new Date(date.getTime() - 40 * 3600000), last = null;
      for (let i = 0; i < 6; i++) {
        const e = find(dir, from, 2);
        if (!e || e >= date) break;
        last = e; from = new Date(e.getTime() + 3600000);
      }
      return last;
    };
    const pRise = obs && lastBefore(+1), pSet = obs && lastBefore(-1);
    const nRise = obs && find(+1, date, 2), nSet = obs && find(-1, date, 2);
    if (!pRise || !pSet || !nRise || !nSet) {          // אזורים קוטביים / כשל חישוב — שעות שוות
      const h = date.getHours() + date.getMinutes() / 60;
      const day = h >= 6 && h < 18;
      const n = day ? 12 + Math.floor(h - 6) : (h >= 18 ? Math.floor(h - 18) : Math.floor(h + 6));
      const d = day || h >= 18 ? date.getDay() : date.getDay();
      return { day, n, d: (day || h < 6) ? d : (d + 1) % 7, len: 1, start: null, approx: true };
    }
    const isDay = pRise > pSet;
    const start = isDay ? pRise : pSet, end = isDay ? nSet : nRise;
    const len = (end - start) / 12;
    const idx = Math.max(0, Math.min(11, Math.floor((date - start) / len)));
    // הלילה שייך ליום העברי המתחיל בו — כלומר ליום שלמחרת השקיעה
    const d = isDay ? date.getDay() : (start.getDay() + 1) % 7;
    return { day: isDay, n: isDay ? 12 + idx : idx, d, len: len / 3600000, start, end, approx: false };
  }

  // ══ ארבע התקופות (תקופת שמואל) ════════════════════════════════════════
  // תקופת ניסן של שנה שבה (שנה מוד 28) = 1 — בתחילת ליל רביעי (ברכת החמה).
  // כל שנה מוסיפה יום ושש שעות, וכל תקופה 91 יום ו-7½ שעות.
  function tekufot(hy) {
    const k = (((hy - 1) % 28) + 28) % 28;
    const base = 3 * 24 + k * 30;                 // שעות מתחילת ליל יום א׳
    return ['ניסן', 'תמוז', 'תשרי', 'טבת'].map((nm, i) => {
      const abs = base + i * (91 * 24 + 7.5);
      const d = Math.floor(abs / 24) % 7, h = abs % 24;
      return { nm, d, h, ruler: ruler(d, Math.floor(h)) };
    });
  }
  function hebYearOf(date) {
    try {
      const s = new Intl.DateTimeFormat('en-u-ca-hebrew', { year: 'numeric' }).format(date);
      const m = s.match(/\d+/); if (m) return +m[0];
    } catch (_) {}
    return 5786;
  }
  // שעה מתחילת הלילה (שעות שוות משש בערב) → שעון + מניין השעות
  function fmtTekufaHour(h) {
    const clock = (18 + h) % 24, hh = Math.floor(clock), mm = Math.round((clock - hh) * 60);
    const cnt = Number.isInteger(h) ? h : Math.floor(h) + '½';
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} — ${cnt} ${T('שעות מתחילת הלילה')}`;
  }
  const tekufaDay = (d, h) => (h < 12 ? T('ליל') : T('יום')) + ' ' + T(DOW_S[d]);

  // ══ ציור הלוח ═════════════════════════════════════════════════════════
  function draw(ctx, W, H, cur) {
    ctx.clearRect(0, 0, W, H);
    // הלוח רחב על פני כל הקנבס, ולכן שומרים רצועה מתחת ל-HUD (ולא מימינו)
    const top = Math.max(8, window.Sims.stageLayout($('hoursCanvas'), W, H, 'below').y);
    const pad = 10, labelW = Math.min(72, W * 0.15);
    const gridRight = W - pad - labelW, gridLeft = pad;
    const cw = (gridRight - gridLeft) / 24;
    const headH = 34;
    const rowH = Math.max(18, (H - top - headH - 30) / 7);
    const gridTop = top + headH;
    const x = c => gridRight - (c + 1) * cw;

    const txt = cv('--ill-text') || '#e6e6e6', muted = cv('--ill-muted') || '#9aa';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // כותרות הקבוצות
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = muted;
    ctx.fillText(T('שעות הלילה'), x(11) + 6 * cw, top + 9);
    ctx.fillText(T('שעות היום'), x(23) + 6 * cw, top + 9);
    // מספרי השעות
    ctx.font = '10px sans-serif';
    for (let c = 0; c < 24; c++) {
      const num = (c % 12) + 1;
      if (cw < 15 && num % 2 === 0) continue;
      ctx.fillStyle = muted;
      ctx.fillText(String(num), x(c) + cw / 2, top + 25);
    }
    // תוויות הימים ושר היום
    for (let d = 0; d < 7; d++) {
      const y = gridTop + d * rowH;
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = txt;
      ctx.fillText(T(DOW_S[d]), W - pad, y + rowH / 2 - 6);
      ctx.font = '10px sans-serif'; ctx.fillStyle = dayRuler(d).color;
      ctx.fillText(T(dayRuler(d).he), W - pad, y + rowH / 2 + 7);
      ctx.textAlign = 'center';
    }

    // התאים
    for (let d = 0; d < 7; d++) {
      for (let c = 0; c < 24; c++) {
        const p = ruler(d, c), xx = x(c), yy = gridTop + d * rowH;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = c < 12 ? 0.62 : 1;              // שעות הלילה מעומעמות
        ctx.fillRect(xx + 0.5, yy + 0.5, cw - 1, rowH - 1);
        ctx.globalAlpha = 1;
        if (cw >= 13 && rowH >= 16) {
          const full = cw >= 44 && rowH >= 26;
          ctx.fillStyle = 'rgba(20,18,10,0.85)';
          ctx.font = `${Math.max(9, Math.min(14, full ? cw * 0.24 : Math.min(cw * 0.55, rowH * 0.5)))}px sans-serif`;
          ctx.fillText(full ? T(p.he) : T(p.ab), xx + cw / 2, yy + rowH / 2);
        }
      }
    }
    // קו הפרדה בין הלילה ליום
    ctx.strokeStyle = cv('--ill-line') || 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x(11), gridTop); ctx.lineTo(x(11), gridTop + 7 * rowH); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeRect(x(23), gridTop, 24 * cw, 7 * rowH);

    // סימון השעה הנוכחית
    if (cur) {
      const xx = x(cur.n), yy = gridTop + cur.d * rowH;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.strokeRect(xx - 1, yy - 1, cw + 2, rowH + 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.strokeRect(xx - 2.5, yy - 2.5, cw + 5, rowH + 5);
    }

    ctx.textAlign = 'center'; ctx.fillStyle = muted; ctx.font = '11px sans-serif';
    ctx.fillText(T('ש=שבתאי · צ=צדק · מ=מאדים · ח=חמה · נ=נוגה · כ=כוכב · ל=לבנה'),
      W / 2, Math.min(H - 10, gridTop + 7 * rowH + 16));
  }

  // ══ מצב האיור ═════════════════════════════════════════════════════════
  const sim = {
    date: new Date(), playing: false, speed: 1, lat: 31.78, lon: 35.22, _bound: false,
    step(dt) { this.date = new Date(this.date.getTime() + this.speed * dt * 3600000); },

    draw() {
      const c = $('hoursCanvas'); if (!c) return;
      const { ctx, W, H } = fit(c);
      const s = seasonal(this.date, this.lat, this.lon);
      draw(ctx, W, H, s);
      const p = ruler(s.d, s.n);
      $('h_date').textContent = this.date.toLocaleDateString(window.I18N ? window.I18N.dateLocale : 'he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
      $('h_clock').textContent = this.date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      $('h_dow').textContent = T(DOW[s.d]) + (s.day ? T(' — ביום') : T(' — בלילה'));
      $('h_seasonal').textContent = T('שעה') + ' ' + ((s.n % 12) + 1) + (s.day ? T(' של היום') : T(' של הלילה')) +
        (s.approx ? '' : ' (' + (s.len * 60).toFixed(0) + ' ' + T('דק׳') + ')');
      $('h_ruler').textContent = T('שר השעה') + ' — ' + T(p.he);
      $('h_ruler').style.color = p.color;
      $('h_dayruler').textContent = T(dayRuler(s.d).he);
      const he = $('h_date_he');
      if (he && window.HebrewDate) window.HebrewDate(this.date).then(x => { he.textContent = x; });
    },

    tekufotTable(hy) {
      const t = tekufot(hy);
      $('h_tekufot').innerHTML = t.map(r =>
        `<tr><td>${T('תקופת')} ${T(r.nm)}</td><td>${tekufaDay(r.d, r.h)}, ${fmtTekufaHour(r.h)}</td>` +
        `<td style="color:${r.ruler.color};font-weight:600">${T(r.ruler.he)}</td></tr>`).join('');
    },

    _syncDate() {
      const d = this.date;
      const set = (id, v) => { const el = $(id); if (el && !window.__fieldLocked(el)) el.value = v; };
      set('h_day', d.getDate()); set('h_month', d.getMonth() + 1); set('h_year', d.getFullYear());
      set('h_hh', d.getHours()); set('h_mi', d.getMinutes());
    },
    sync() { this._syncDate(); },

    bind() {
      if (this._bound) return; this._bound = true;
      this._syncDate();
      $('h_hyear').value = hebYearOf(this.date);
      this.tekufotTable(+$('h_hyear').value);
      $('h_play').onclick = e => { this.playing = !this.playing; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      $('h_now').onclick = () => { this.date = new Date(); this.playing = false; $('h_play').textContent = T('▶ הפעל'); this._syncDate(); };
      $('h_speed').oninput = e => { this.speed = +e.target.value; $('h_spdL').textContent = (+e.target.value).toFixed(1); };
      $('h_go').onclick = () => {
        const y = +$('h_year').value, m = +$('h_month').value, d = +$('h_day').value;
        if (!y || !m || !d) return;
        this.date = new Date(y, m - 1, d, +$('h_hh').value || 0, +$('h_mi').value || 0, 0);
        this.playing = false; $('h_play').textContent = T('▶ הפעל');
      };
      $('h_lat').oninput = e => this.lat = Math.max(-89, Math.min(89, +e.target.value || 0));
      $('h_lon').oninput = e => this.lon = Math.max(-180, Math.min(180, +e.target.value || 0));
      $('h_hgo').onclick = () => { const y = +$('h_hyear').value; if (y) this.tekufotTable(y); };
    },
  };

  // החלפת שפה: בנייה מחדש של טבלת התקופות (נבנית רק באירוע)
  sim.onLanguage = () => { if (sim._bound) { const y = +$('h_hyear').value; if (y) sim.tekufotTable(y); } };

  window.Sims.hours = sim;
  const _ccc = window.Sims.clearColorCache;
  window.Sims.clearColorCache = () => { _ccc && _ccc(); clearColorCache(); };
  const _cfc = window.Sims.clearFitCache;
  window.Sims.clearFitCache = () => { _cfc && _cfc(); clearFitCache(); };
})();
