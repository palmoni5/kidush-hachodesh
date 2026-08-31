// שלושת האיורים: מופעי הירח, מהלך השמש (שנת חמה), מיקום כוכבי הלכת.
// כל הצבעים נקראים ממשתני CSS (var) — תואם ערכת הנושא של אוצריא.
"use strict";
window.Sims = (function () {
  const A = window.Astro, AS = window.ASSETS;
  const T = s => (window.I18N ? window.I18N.t(s) : s);
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
  function clearFitCache() { _fitCache.clear(); _layout.yearTop = null; _layout.moonTop = null; _hudCache.clear(); }
  // גובה ה-HUD ביחס לראש הבמה (במסכים צרים בלבד); אחרת מחזיר את ברירת המחדל.
  // הסף נקבע לפי רוחב החלון (כמו ה-@media ב-CSS) ולא לפי רוחב הקנבס: רוחב הקנבס
  // (חלון פחות פאנל 312px) יושב לעיתים ממש סביב 760 ומתהפך על reflow זעיר —
  // מה שגרם לפריסה לקפוץ בין מרכוז (top=0) להזחה מתחת ל-HUD עם תחילת ההפעלה.
  function hudInset(canvas, W, fallback) {
    if ((window.innerWidth || W) >= 760) return fallback;   // חלון רחב — פריסה מקורית
    const stage = canvas.parentElement, hud = stage.querySelector('.hud');
    if (!hud) return fallback;
    const sr = stage.getBoundingClientRect();
    return Math.max(fallback, hud.getBoundingClientRect().bottom - sr.top + 8);
  }
  // ── אזור הציור הפנוי מה-HUD ───────────────────────────────────────────
  // ה-HUD צף מעל הקנבס בפינה הימנית-העליונה, ולכן האיור חייב להצטמצם כדי שלא
  // יצויר מתחתיו. במסך רחב שומרים רצועה מימין (בלי לאבד גובה), ובמסך צר —
  // שבו ה-HUD נערם על פני כל הרוחב — שומרים רצועה בראש.
  // mode='below' מכריח את הרצועה העליונה גם במסך רחב (לאיור רחב כלוח השעות).
  // המדידה יקרה (מכריחה layout) ולכן היא נשמרת במטמון ומתאפסת בשינוי גודל.
  const _hudCache = new Map();
  function stageLayout(canvas, W, H, mode) {
    const key = canvas;
    let L = _hudCache.get(key);
    if (L) return L;
    const stage = canvas.parentElement, hud = stage && stage.querySelector('.hud');
    if (!hud) { L = { x: 0, y: 0, w: W, h: H }; }
    else {
      const sr = stage.getBoundingClientRect(), hr = hud.getBoundingClientRect();
      // חלונית איור בפינת הבמה (אם יש) יושבת באותו צד עצמו, ולכן הרצועה
      // השמורה נמדדת לפי הרחב שבשניהם
      const ins = stage.querySelector('.stage-inset'), ir = ins && ins.getBoundingClientRect();
      if (mode === 'below' || (window.innerWidth || W) < 760) {
        const top = Math.max(0, hr.bottom - sr.top + 8);
        L = { x: 0, y: top, w: W, h: Math.max(80, H - top) };
      } else if ((hr.left + hr.right) / 2 < (sr.left + sr.right) / 2) {
        // ה-HUD בצד שמאל (פריסת LTR) — האזור הפנוי מימינו
        const reserve = Math.max(0, hr.right - sr.left + 10, ir ? ir.right - sr.left + 10 : 0);
        L = { x: Math.min(reserve, W - 120), y: 0, w: Math.max(120, W - reserve), h: H };
      } else {
        // ה-HUD בצד ימין (פריסת RTL) — האזור הפנוי משמאלו
        const reserve = Math.max(0, sr.right - hr.left + 10, ir ? sr.right - ir.left + 10 : 0);
        L = { x: 0, y: 0, w: Math.max(120, W - reserve), h: H };
      }
    }
    _hudCache.set(key, L);
    return L;
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
  // התאמת מידות לקנבס משני היושב בכרטיס שבפאנל (ולא בבמה) — המזעריות
  // הגדולות של fit() (280×240) היו גולשות מגבולות הכרטיס הצר.
  function fitInset(canvas) {
    let c = _fitCache.get(canvas);
    if (!c) {
      const r = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(180, r.width), H = Math.max(140, r.height);
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c = { ctx, W, H };
      _fitCache.set(canvas, c);
    }
    return c;
  }
  function sprite(ctx, im, cx, cy, w, h) {
    if (im.complete && im.naturalWidth) ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    else { ctx.fillStyle = cv('--ill-muted'); ctx.beginPath(); ctx.arc(cx, cy, w / 2, 0, 2 * Math.PI); ctx.fill(); }
  }
  // ── שרשרת הקיבוצים האמיתיים ─────────────────────────────────────────
  // גיל הירח ורגעי החודש נמנים מן הקיבוץ (המולד) האסטרונומי האמיתי, ולא
  // ממולד ממוצע: אורך החודש האמיתי נע בין כ-29.27 לכ-29.83 ימים, והקיבוץ
  // סוטה מן המולד הממוצע עד כי״ד שעות, כפי מהירות הירח במסלולו.
  // חיפוש המופע יקר, ולכן החודש המוצג נשמר במטמון ומחושב מחדש רק כשהרגע
  // המוצג יוצא מגבולותיו.
  const MEAN_LUN = A.SYNODIC;
  const REF_NEW = Date.UTC(2026, 7, 12, 17, 37, 11);   // קיבוץ ידוע — לגיבוי בלבד
  function moonPhaseAfter(deg, ms) {
    try {
      const AE = window.Astronomy;
      const t = AE.SearchMoonPhase(deg, AE.MakeTime(new Date(ms)), 31);
      return t ? t.date.getTime() : null;
    } catch (_) { return null; }
  }
  let _lun = null;                                     // {t0, t1, len} של החודש שבמטמון
  function lunation(ms) {
    if (_lun && ms >= _lun.t0 && ms < _lun.t1) return _lun;
    // בכל חלון של 30 יום יש קיבוץ אחד לפחות, ולכן הראשון שנמצא אינו לאחר ms;
    // משם מדלגים קדימה עד שהחודש שבידינו הוא זה שהרגע המוצג בתוכו
    let t0 = moonPhaseAfter(0, ms - 30 * 86400000), t1 = null;
    if (t0 != null) {
      for (let k = 0; k < 3; k++) {
        t1 = moonPhaseAfter(0, t0 + 86400000);
        if (t1 == null || t1 > ms) break;
        t0 = t1;
      }
    }
    if (t0 == null || t1 == null) {                    // גיבוי: שרשרת ממוצעת מקיבוץ ידוע
      const a = ((((ms - REF_NEW) / 86400000) % MEAN_LUN) + MEAN_LUN) % MEAN_LUN;
      t0 = ms - a * 86400000; t1 = t0 + MEAN_LUN * 86400000;
    }
    _lun = { t0, t1, len: (t1 - t0) / 86400000 };
    return _lun;
  }
  const moonAgeAt = ms => (ms - lunation(ms).t0) / 86400000;
  // זווית המופע האמיתית (0° קיבוץ, 180° ניגוד) מומרת ל״יום שקול״ בחודש ממוצע,
  // כדי שחישובי הציור והתאורה שנבנו על החודש הממוצע יישארו כשהם — ויקבלו
  // מעתה את המופע האמיתי
  function phaseDayAt(ms) {
    try {
      const AE = window.Astronomy;
      return AE.MoonPhase(AE.MakeTime(new Date(ms))) / 360 * MEAN_LUN;
    } catch (_) { return moonAgeAt(ms); }
  }
  // ── שעון המקום הנבחר ──────────────────────────────────────────────────
  // הרגע שבאיור אחד הוא לכל העולם, וכל מקום רואה אותו בשעונו שלו: זמני
  // זריחת הירח ושקיעתו וה"שעה במקום" מוצגים בשעון האזרחי של מקום הצפייה
  // (כולל שעון קיץ). ב"מותאם אישית" — אין אזור זמן ידוע, והשעון מוערך מקו
  // האורך (15 מעלות לשעה), כדרך שנעשה בלשונית מהלך השמש.
  const _placeFmt = Object.create(null);
  function fmtAtPlace(date, loc) {
    if (loc && loc.tz) {
      try {
        const f = _placeFmt[loc.tz] || (_placeFmt[loc.tz] =
          new Intl.DateTimeFormat('he-IL', { timeZone: loc.tz, hour: '2-digit', minute: '2-digit', hour12: false }));
        return f.format(date);
      } catch (e) {}
    }
    const off = Math.round(((loc && loc.lon) || 0) / 15);
    const d = new Date(date.getTime() + off * 3600000);
    return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  }
  // חצות הלילה האזרחי של מקום הצפייה ליממה שהרגע ms בתוכה — תחילת חיפוש
  // זריחת/שקיעת הירח. ההיסט נלקח מאזור הזמן של המקום (וב"מותאם אישית" —
  // מקו האורך), ולא משעון המכשיר: מחשב בישראל שמציג את ניו יורק היה מתחיל
  // את החיפוש ב-17:00–18:00 של היום הקודם בשעון ניו יורק.
  function placeMidnight(ms, loc) {
    let off = loc && loc.tz ? tzOffsetHours(loc.tz, new Date(ms)) : null;
    if (off === null) off = Math.round(((loc && loc.lon) || 0) / 15);
    const wallMid = Math.floor((ms + off * 3600000) / 86400000) * 86400000;
    let utc = wallMid - off * 3600000;
    if (loc && loc.tz) {   // עידון על גבול שעון קיץ: ההיסט בחצות עשוי להיות אחר
      const o2 = tzOffsetHours(loc.tz, new Date(utc));
      if (o2 !== null && o2 !== off) utc = wallMid - o2 * 3600000;
    }
    return utc;
  }
  // זריחת/שקיעת הירח במקום הנבחר, ביממה שמתחילה ב-date (Astronomy Engine; בקירוב)
  function moonRiseSet(date, loc) {
    try {
      const AE = window.Astronomy, obs = new AE.Observer(loc.lat, loc.lon, 0);
      const t = AE.MakeTime(date);
      const r = AE.SearchRiseSet(AE.Body.Moon, obs, +1, t, 1.2);
      const s = AE.SearchRiseSet(AE.Body.Moon, obs, -1, t, 1.2);
      return { rise: r ? fmtAtPlace(r.date, loc) : '—', set: s ? fmtAtPlace(s.date, loc) : '—' };
    } catch (e) { return { rise: '—', set: '—' }; }
  }
  // מיקום הירח והשמש בכיפת השמים מעל המקום הנבחר לרגע נתון (Astronomy Engine)
  function moonSkyPos(date, loc) {
    try {
      const AE = window.Astronomy, obs = new AE.Observer(loc.lat, loc.lon, 0), t = AE.MakeTime(date);
      const eqM = AE.Equator(AE.Body.Moon, t, obs, true, true);
      const hM = AE.Horizon(t, obs, eqM.ra, eqM.dec, 'normal');
      const eqS = AE.Equator(AE.Body.Sun, t, obs, true, true);
      const hS = AE.Horizon(t, obs, eqS.ra, eqS.dec, 'normal');
      return { moon: { az: hM.azimuth, alt: hM.altitude }, sun: { az: hS.azimuth, alt: hS.altitude } };
    } catch (e) { return null; }
  }
  const COMPASS8 = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
  const compassName = az => COMPASS8[Math.round((((az % 360) + 360) % 360) / 45) % 8];

  // חלון תצפית השמים: עיגול כיפת השמים (כמו בלשונית כוכבי הלכת) ובו הירח
  // במיקומו הנוכחי ובצורתו הנראית, והשמש להקשר. מרכז העיגול = זניט,
  // השפה = האופק; מזרח משמאל (מבט אל-על, כבלשונית כוכבי הלכת).
  // placeName — שם מקום הצפייה הנבחר, לכותרת החלון.
  function drawMoonSky(ctx, cx, cy, R, pos, day, placeName) {
    ctx.strokeStyle = cv('--ill-grid'); ctx.lineWidth = 1;
    for (const alt of [30, 60]) {
      const rr = (90 - alt) / 90 * R;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.strokeStyle = cv('--ill-horizon'); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = cv('--ill-text'); ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(T('צפון'), cx, cy - R - 8); ctx.fillText(T('דרום'), cx, cy + R + 8);
    ctx.fillText(T('מזרח'), cx - R - 14, cy); ctx.fillText(T('מערב'), cx + R + 14, cy);
    ctx.fillStyle = cv('--ill-muted'); ctx.font = '10px sans-serif';
    ctx.fillText(T('הירח בשמים') + ' — ' + T(placeName || 'ירושלים'), cx, cy - R - 22);
    if (!pos) return;
    const place = o => {
      const rr = (90 - Math.max(o.alt, 0)) / 90 * R, a = o.az * Math.PI / 180;
      return { x: cx - rr * Math.sin(a), y: cy - rr * Math.cos(a) };
    };
    // גוף מתחת לאופק מוצמד לשפת האופק בכיוונו (אזימוט) — אך עמוק מתחת לאופק,
    // ליד הנדיר, האזימוט מתהפך במהירות והגוף המוצמד "רץ" לאורך השפה פי עשרות
    // מקצבו האמיתי. לכן עמוק מן הסף הוא מוסתר, ורק סמוך לזריחה/שקיעה נראה בשפה.
    const HIDE_ALT = -14;
    // השמש — להקשר (עמומה מתחת לאופק); הקרבה לירח מסבירה מתי הסהר נראה
    if (pos.sun.alt > HIDE_ALT) {
      const ps = place(pos.sun);
      ctx.globalAlpha = pos.sun.alt > 0 ? 0.95 : 0.3;
      sprite(ctx, IMG.sun, ps.x, ps.y, 15, 15);
      ctx.globalAlpha = 1;
    }
    // הירח בצורתו הנראית; מעט מתחת לאופק — עמום, על שפת האופק בכיוונו
    const pm = place(pos.moon);
    if (pos.moon.alt > HIDE_ALT) {
      ctx.globalAlpha = pos.moon.alt > 0 ? 1 : 0.35;
      drawPhase(ctx, pm.x, pm.y, 9, day);
      ctx.globalAlpha = 1;
    }
    if (pos.moon.alt <= 0) {
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '9px sans-serif';
      if (pos.moon.alt > HIDE_ALT) ctx.fillText(T('מתחת לאופק'), pm.x, pm.y + 17);
      else { ctx.textBaseline = 'middle'; ctx.fillText(T('מתחת לאופק'), cx, cy); }
    } else if (pos.sun.alt > 0) {
      // הלבנה מעל האופק אך החמה זורחת — באור היום אינה נראית לעין
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '9px sans-serif';
      ctx.fillText(T('אור יום — אינה נראית לעין'), cx, cy + R + 20);
    }
  }

  // שורת הסבר עדינה (ללא רקע) למעלה — מוצגת בזמן השהיה
  function drawHint(ctx, W, txt = T('לחצו ▶ הפעל כדי להניע את הסיבוב')) {
    ctx.fillStyle = cv('--ill-muted'); ctx.font = '12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(T(txt), W / 2, 8);
  }
  // נקודת ייחוס לנפילה הסכמטית — שוויון אביב (תקופת ניסן) 20.3.2000 07:35 UT
  const SPRING_REF = Date.UTC(2000, 2, 20, 7, 35, 0);
  // מחזור השנה המוצג — אסטרונומי כולו (Astronomy Engine): מתקופת ניסן האמיתית
  // (שוויון האביב) האחרונה ועד הבאה. "יום 0" הוא רגע התקופה עצמו, אורך השנה
  // הוא המרווח האמיתי בין שני השוויונים (כ-365.2424 יום), ו-tek הם ימי ארבע
  // התקופות האמיתיות במחזור — שאינן רבעים שווים, שהעונות אינן שוות באורכן
  // (המסלול אליפטי — הארץ איטית ברחקה, וקיץ הצפון ארוך מחורפו): תשרי נופלת
  // כ-4 ימים אחרי רבע שנת שמואל הסכמטי. כשהמנוע אינו זמין — נפילה למחזור
  // הסכמטי (שנת שמואל של 365.25 יום המעוגנת בשוויון האביב של 2000, tek=null).
  let _span = null;
  function yearSpan() {
    if (_span && Date.now() < _span.end) return _span;
    try {
      const AE = window.Astronomy;
      let y = new Date().getUTCFullYear();
      if (AE.Seasons(y).mar_equinox.date.getTime() > Date.now()) y--;
      const s = AE.Seasons(y);
      const start = s.mar_equinox.date.getTime();
      const end = AE.Seasons(y + 1).mar_equinox.date.getTime();
      const d = t => (t.date.getTime() - start) / 86400000;
      return (_span = { start, end, days: (end - start) / 86400000,
                        tek: [0, d(s.jun_solstice), d(s.sep_equinox), d(s.dec_solstice)] });
    } catch (e) {
      const cyc = A.SOLAR_YEAR * 86400000;
      const start = SPRING_REF + Math.floor((Date.now() - SPRING_REF) / cyc) * cyc;
      return { start, end: start + cyc, days: A.SOLAR_YEAR, tek: null };   // לא נשמר — שהמנוע ינוסה שוב
    }
  }
  // יום בשנת החמה (מתקופת ניסן האמיתית) ושעה נוכחית באזור הזמן שנבחר
  function solarToday(tz) {
    const now = new Date();
    const dayY = (now.getTime() - yearSpan().start) / 86400000;
    const off = tzOffsetHours(tz, now);
    const hour = off === null ? now.getHours() + now.getMinutes() / 60
                              : (((now.getTime() / 3600000 + off) % 24) + 24) % 24;
    return { dayY, hour };
  }
  // רגע התקופה האמיתי שבמחזור השנה המוצג. i: 0=ניסן (שוויון מרץ), 1=תמוז,
  // 2=תשרי, 3=טבת. null כשהמנוע אינו זמין — ואז הלחצנים נופלים לרבעים הסכמטיים.
  function tekufaMoment(i) {
    const s = yearSpan();
    return s.tek ? new Date(s.start + s.tek[i] * 86400000) : null;
  }
  // היסט אזור הזמן (שעות) לתאריך נתון — כולל שעון קיץ, מנתוני ה-IANA של הדפדפן.
  // מוחזר null כשאין אזור זמן ידוע (מיקום "מותאם אישית") — ואז מעריכים לפי קו האורך.
  const _tzCache = Object.create(null);
  function tzOffsetHours(tz, date) {
    if (!tz) return null;
    const key = tz + '|' + Math.floor(date.getTime() / 86400000);
    if (_tzCache[key] !== undefined) return _tzCache[key];
    let v = null;
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const p = {}; for (const x of dtf.formatToParts(date)) p[x.type] = x.value;
      const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      v = Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000) / 60;
    } catch (e) { v = null; }
    return (_tzCache[key] = v);
  }
  // ── זמני היום מלוח אוצריא ────────────────────────────────────────────
  // calendar.getDailyTimes (הרשאת calendar.read) מחזיר את הזמנים המדויקים
  // (kosher_dart) לתאריך ולעיר הנבחרים בלוח שבאפליקציה. הערכים מגיעים בפורמט
  // "⁦HH:MM.⁩" — עטופים ב-LTR isolate ועם סימן שניות בסופם — ולכן מנוקים לתצוגה.
  const cleanZman = s => typeof s === 'string' ? s.replace(/[⁦⁩]/g, '').replace(/[.:]$/, '') : '';
  // הכרטיס דורש אוצריא 0.9.97+ (calendar.getCities ו-getDailyTimes עם
  // {date, city} — ראו minAppVersion במניפסט): הזמנים עוקבים אחרי התאריך
  // שבאיור, ובורר הערים נפתח על העיר הנבחרת באפליקציה. שינוי עיר באפליקציה
  // מעדכן את הכרטיס בזמן אמת (calendar.city_changed, ובגיבוי — settings.changed).
  const otz = { ready: false, city: null, followApp: true };
  async function loadOtzariaTimes() {
    const card = $('y_otzCard');
    if (!card || typeof window.Otzaria === 'undefined') return;
    try {
      const g = async (m, a) => { const r = await Otzaria.call(m, a || {}); return r && r.success ? r.data : null; };
      // אתחול חד-פעמי: אכלוס בורר הערים (מקובצות לפי מדינה), ברירת מחדל —
      // העיר הנבחרת באפליקציה
      if (!otz.ready) {
        const cities = await g('calendar.getCities');
        if (!Array.isArray(cities) || !cities.length) return;   // מחוץ לאוצריא — מוסתר
        const groups = {};
        for (const c of cities) (groups[c.country] = groups[c.country] || []).push(c.name);
        $('yo_city').innerHTML = Object.entries(groups).map(([gr, names]) =>
          `<optgroup label="${gr}">` + names.map(n => `<option>${n}</option>`).join('') + '</optgroup>').join('');
        // key-selected-city הוא המפתח שבו אוצריא שומרת את עיר הלוח
        // (settings_repository.dart); הקריאה דורשת את ההרשאה settings.read.
        const cur = await g('settings.get', { key: 'key-selected-city' });
        $('yo_city').value = cur || '';
        // גיבוי אם ההרשאה חסרה או שהמפתח ריק — ירושלים, לא העיר הראשונה ברשימה
        if (!$('yo_city').value) $('yo_city').value = 'ירושלים';
        if (!$('yo_city').value) $('yo_city').value = cities[0].name;
        otz.city = $('yo_city').value;
        $('yo_cityRow').style.display = '';
        otz.ready = true;
      }
      const d = dayYToDate(year.dayY);
      const times = await g('calendar.getDailyTimes', { date: d.toISOString().slice(0, 10), city: otz.city });
      if (!times || typeof times !== 'object') return;
      $('yo_cityName').textContent = otz.city || '—';
      $('yo_date').textContent = d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
      const put = (id, key) => { $(id).textContent = cleanZman(times[key]) || '—'; };
      put('yo_riseSea', 'seaLevelSunrise'); put('yo_rise', 'sunrise');
      put('yo_setSea', 'seaLevelSunset');   put('yo_set', 'sunset');
      put('yo_noon', 'chatzos');            put('yo_midnight', 'chatzosLayla');
      otz.shownFor = d.toISOString().slice(0, 10);
      syncOtzRefreshBtn(d);
      card.style.display = '';
    } catch (e) {}
  }
  // כפתור "רענן מהלוח" מוצג רק כשהכרטיס אינו מסונכרן עם תאריך האיור:
  // גרירת מחוון היום וריצת האנימציה אינן קוראות ללוח בכל שינוי (עשרות
  // קריאות בגרירה אחת), וגם קריאה שנכשלה משאירה את הכרטיס מאחור. בכל
  // שאר המסלולים הכרטיס מתעדכן מאליו — והכפתור מיותר ומוסתר.
  function syncOtzRefreshBtn(d) {
    if (!otz.ready) return;
    const stale = d.toISOString().slice(0, 10) !== otz.shownFor;
    const b = $('yo_refresh');
    if ((b.style.display === 'none') === stale) b.style.display = stale ? '' : 'none';
  }
  // שינוי העיר באפליקציה משתקף בזמן אמת — כל עוד המשתמש לא בחר עיר אחרת בכרטיס
  function applyAppCity(name) {
    if (!otz.ready || !otz.followApp || !name || name === otz.city) return;
    $('yo_city').value = name;
    if ($('yo_city').value === name) { otz.city = name; loadOtzariaTimes(); }
  }
  // קריאת העיר הנבחרת בלוח היישר מן ההגדרות — הן לרענון יזום והן כגיבוי
  // לאירועים: מחזירה את השם או null אם ההרשאה חסרה / מחוץ לאוצריא.
  async function fetchAppCity() {
    try {
      const r = await Otzaria.call('settings.get', { key: 'key-selected-city' });
      if (r && r.success && r.data) return r.data;
    } catch (e) {}
    return null;
  }
  if (typeof window.Otzaria !== 'undefined' && Otzaria.on) {
    try {
      Otzaria.on('calendar.city_changed', payload =>
        applyAppCity(payload && (payload.city || payload.name)));
      // גיבוי: גרסאות אוצריא שאינן משדרות calendar.city_changed (או משדרות
      // אותו במבנה אחר) עדיין כותבות את עיר הלוח להגדרות תחת key-selected-city
      // (settings_repository.dart) — והכתיבה מפיצה settings.changed, שאליו
      // התוסף כבר מנוי (עדכון שפה חי). כשהערך אינו בגוף האירוע — נשלף בקריאה.
      Otzaria.on('settings.changed', async p => {
        if (!p || p.key !== 'key-selected-city') return;
        applyAppCity(p.value || await fetchAppCity());
      });
    } catch (e) {}
  }

  // משוואת הזמן (שעות) — ההפרש בין השמש האמיתית לשמש הממוצעת (קירוב סטנדרטי)
  function equationOfTime(dateUTC) {
    const N = (Date.UTC(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth(), dateUTC.getUTCDate())
             - Date.UTC(dateUTC.getUTCFullYear(), 0, 0)) / 86400000;
    const B = 2 * Math.PI * (N - 81) / 364;
    return (9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)) / 60;
  }
  // יום בשנת החמה מתאריך לועזי (נדגם בצהרי היום) — ממופה מחזורית אל השנה המוצגת
  function dayYFromDate(Y, M, D) {
    const s = yearSpan();
    return ((((Date.UTC(Y, M - 1, D, 12) - s.start) / 86400000) % s.days) + s.days) % s.days;
  }
  // תאריך לועזי מיום בשנת החמה המוצגת
  const GREG_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  function dayYToDate(dayY) {
    return new Date(yearSpan().start + dayY * 86400000);
  }
  function dayYToDateLabel(dayY) {
    const d = dayYToDate(dayY);
    return window.I18N && window.I18N.active
      ? T(GREG_MONTHS[d.getUTCMonth()]) + ' ' + d.getUTCDate()
      : d.getUTCDate() + ' ב' + GREG_MONTHS[d.getUTCMonth()];
  }

  // ════════════════ מופעי הירח ════════════════
  // מקור האמת של האיור הוא רגע אמיתי (t, מילישניות) — ולא גיל הירח בלבד:
  // כך יש לכל מצב תאריך ושעה של ממש, וכפתורי ג׳/ז׳ מן המולד קופצים אל הרגע
  // האמיתי בחודש, שרואים בו שהוא יום או לילה. day נגזר מ-t בכל ציור.
  const moon = {
    t: Date.now(), day: 0, phase: 0, speed: 2, playing: false, hintDone: false, _bound: false,
    // מקום הצפייה — קובע את חלון "הירח בשמים", את מיקום הירח ואת זמני
    // זריחתו ושקיעתו (המוצגים בשעון האזרחי של אותו מקום). המופע עצמו ואחוז
    // ההארה כמעט שווים בכל העולם, אך שעת הראייה והמקום בשמים תלויי מקום —
    // וזה עיקרו של קידוש החודש על פי הראייה.
    loc: { lat: 31.78, lon: 35.24, tz: 'Asia/Jerusalem', name: 'ירושלים' },
    step(dt) { if (this.playing) this.t += this.speed * dt * 86400000; },
    // תחילת החודש המוצג — רגע הקיבוץ האמיתי שהרגע הנוכחי בתוך חודשו.
    // נגזר מ-t עצמו, ולכן החודש מתחלף רק כש-t חוצה קיבוץ (הפעלה, תאריך ידני,
    // "הירח היום") או בכפתורי החודש הקודם/הבא — לא בלחיצות על רגעי החודש.
    _monthT0() { return lunation(this.t).t0; },
    draw() {
      this.day = moonAgeAt(this.t);
      this.phase = phaseDayAt(this.t);
      const simDate = new Date(this.t);
      const { ctx, W, H } = fit($('moonCanvas'));
      ctx.clearRect(0, 0, W, H);
      // עדכון ה-HUD תחילה: hudInset מודד את גובה ה-HUD, ולכן יש לעדכן את תוכנו
      // (שאורכו משתנה לפי המופע) לפני מדידת moonTop — אחרת הפריים הראשון נמדד
      // לפי ערכי ברירת המחדל שב-HTML, ומדידה-מחדש מאוחרת מקפיצה את האיור.
      const pct = Math.round(A.moonIllum(this.phase) * 100);
      $('m_day').textContent = Math.floor(this.day) + 1;
      $('m_pct').textContent = pct + '%';
      // מרחק הירח מהשמש במעלות (הפרש האורך האקליפטי — "האורך הראשון" של
      // הרמב"ם פי"ז) — הוא הקובע את ראיית הלבנה החדשה: בתשע מעלות או פחות
      // אי אפשר שתיראה, ובחמש עשרה ודאי תיראה (רמב"ם פי"ז ה"ג); ובעל המאור
      // (ר"ה כ' ע"ב) נתן שיעור י"ב מעלות. עד הניגוד הירח ממזרח לשמש, ומשם
      // ואילך ממערב לה. phase נגזר מ-AE.MoonPhase, וההמרה חזרה למעלות מדויקת.
      const eDeg = (this.phase / MEAN_LUN) * 360;
      const eDist = eDeg <= 180 ? eDeg : 360 - eDeg;
      $('m_elong').textContent = eDist.toFixed(1) + '° ' + T(eDeg <= 180 ? 'ממזרח לשמש' : 'ממערב לשמש');
      $('m_phase').textContent = T(A.moonPhaseLabel(this.phase));
      // תאריך, תאריך עברי ושעה של הרגע המוצג — כבשאר הלשוניות
      $('m_date').textContent = simDate.toLocaleDateString(window.I18N ? window.I18N.dateLocale : 'he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
      // התווית מבטיחה "שעה באופק ירושלים" — מוצמד לאזור הזמן של ירושלים גם
      // כשהמכשיר מכוון לאזור אחר (כך ניתן להשוות מולדות מול הלוחות)
      $('m_clock').textContent = fmtAtPlace(simDate, { tz: 'Asia/Jerusalem', lon: 35.24 });
      // התאריך העברי מחושב אסינכרונית — רק כשהתצוגה מתחלפת (שקיעה / עלות השחר)
      const heKey = window.HebrewDate && window.HebrewDate.key
        ? window.HebrewDate.key(simDate)
        : simDate.getFullYear() * 10000 + simDate.getMonth() * 100 + simDate.getDate();
      if (this._heKey !== heKey && window.HebrewDate) {
        this._heKey = heKey;
        window.HebrewDate(simDate).then(s => { if (s && this._heKey === heKey) $('m_date_he').textContent = s; });
      }
      // זריחת/שקיעת הירח — ליממה האזרחית של התאריך המוצג במקום הנבחר.
      // החיפוש יקר, ולכן מחושב רק כשחצות המקום (או המקום עצמו) משתנה בפועל.
      const mid = placeMidnight(this.t, this.loc);
      const rsKey = mid + '|' + this.loc.lat + ',' + this.loc.lon + ',' + this.loc.tz;
      if (this._rsKey !== rsKey) {
        this._rsKey = rsKey;
        this._rs = moonRiseSet(new Date(mid), this.loc);
      }
      $('m_rise').textContent = this._rs.rise;
      $('m_set').textContent = this._rs.set;
      // מקום הצפייה והשעה שבו לרגע המוצג — הרגע אחד, והשעון משתנה ממקום למקום.
      // ב"מותאם אישית" השעון משוער מקו האורך (זמן שמש ממוצע) — ומסומן ככזה.
      $('m_loc').textContent = T(this.loc.name);
      $('m_locClock').textContent = fmtAtPlace(simDate, this.loc)
        + (this.loc.tz ? '' : ' (' + T('זמן שמש ממוצע') + ')');
      // במסך צר מורידים את כל ההרכב מתחת ל-HUD (top=0 בדסקטופ → פריסה מקורית)
      if (_layout.moonTop === null) _layout.moonTop = hudInset($('moonCanvas'), W, 0);
      const top = _layout.moonTop;
      const earthX = W * 0.60, earthY = top + (H - top) * 0.56, sunX = W * 0.13, sunY = earthY;
      const orbitR = Math.min(W, H - top) * 0.19;
      const ang = Math.PI - 2 * Math.PI * (this.phase / MEAN_LUN);
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
      ctx.fillStyle = cv('--ill-text'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      // תווית הארץ — מתחת לכדור עם מרווח ברור (~8px). textBaseline=top מבטיח
      // שכל הטקסט יושב מתחת לנקודת העוגן (אחרת טקסט alphabetic זוחל אל הכדור).
      ctx.textBaseline = 'top';
      ctx.fillText(T('הארץ'), earthX, earthY + 29);
      // תווית הירח — מעל הירח עם מרווח מתון (~8px). textBaseline=bottom מבטיח
      // שכל הטקסט יושב מעל נקודת העוגן (ולא יזלוג מטה אל הדיסקה).
      ctx.textBaseline = 'bottom';
      ctx.fillText(T('הירח'), mx, Math.max(top + 13, my - 19));
      ctx.textBaseline = 'alphabetic';
      // תצוגת הירח כפי שנראה מהארץ — פינה ימנית-תחתונה. הרדיוס מוגבל למקום
      // הפנוי מימין למסלול, כדי שלא יתנגש בירח המקיף ובתוויתו במסכים צרים.
      const vR = Math.max(28, Math.min(Math.min(W, H) * 0.15, (W - (earthX + orbitR) - 36) / 2));
      const vx = W - vR - 16, vy = H - vR - 20;
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(T('הירח מכדור הארץ'), vx, vy - vR - 12);
      drawPhase(ctx, vx, vy, vR, this.phase);
      // חלון תצפית השמים — בפינה העליונה שמנגד ל-HUD (ימין ב-RTL ⇒ החלון משמאל)
      const pos = moonSkyPos(simDate, this.loc);
      if (W >= 520) {
        const dR = Math.max(50, Math.min(W * 0.12, (H - top) * 0.16, 92));
        const rtl = getComputedStyle(document.body).direction !== 'ltr';
        const dx = rtl ? 24 + dR + 14 : W - 24 - dR - 14;
        drawMoonSky(ctx, dx, top + 38 + dR, dR, pos, this.phase, this.loc.name);
      }
      // לבנה מעל האופק בשעות היום — מעל האופק, אך אור החמה מסתירה מן העין
      const daylight = pos && pos.sun.alt > 0 && pos.moon.alt > 0;
      $('m_pos').textContent = !pos ? '—'
        : pos.moon.alt > 0 ? T(compassName(pos.moon.az)) + ' · ' + pos.moon.alt.toFixed(0) + '°'
          + (daylight ? ' — ' + T('ביום אינה נראית לעין') : '')
        : T('מתחת לאופק');
      if (!this.hintDone) drawHint(ctx, W);
    },
    bind() {
      if (this._bound) return; this._bound = true;
      this.t = Date.now();   // ברירת מחדל: מצב הירח עכשיו
      this.day = moonAgeAt(this.t);
      this._syncDate();
      const stop = () => { this.playing = false; $('m_play').textContent = T('▶ הפעל'); };
      $('m_play').onclick = e => { this.playing = !this.playing; this.hintDone = true; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      // קפיצה לרגעי המחזור: מולד (קיבוץ), ניגוד (מילוי), וזמני ברכת הלבנה.
      // כל הקפיצות מעוגנות לחודש המוצג (_monthT0) ואינן זולגות לחודש הבא —
      // גם בלחיצות חוזרות בכל סדר שהוא. מעבר חודש נעשה בכפתורי החודש בלבד.
      const jump = (id, target) => { const b = $(id); if (b) b.onclick = () => {
        this.t = this._monthT0() + target * 86400000;
        stop(); this._syncDate();
      }; };
      jump('m_jNew', 0);
      // ר"ה כ' ע"ב: כ"ד שעות מכוסה הלבנה סביב הקיבוץ — "לדידן" (בבל) י"ח מהן
      // לאחר המולד, ו"לדידהו" (ארץ ישראל) שש בלבד; ומכאן שני הרגעים הללו,
      // שהם הראשונים שאפשר בהם לראות את הלבנה החדשה לשתי הלשונות.
      jump('m_j6h', 0.25);
      jump('m_j18h', 0.75);
      jump('m_j3', 3);
      jump('m_j7', 7);
      // רגע הראייה — כשליש שעה (20 דקות) אחר שקיעת החמה הראשונה שאחרי
      // הקיבוץ, במקום הצפייה הנבחר: הוא "עת הראייה" שחשבון הרמב"ם (פי"ד)
      // מכוון אליה, והרגע שבו נמדד "האורך הראשון" שקובע אם תיראה הלבנה.
      // ברוחב קוטבי (אין שקיעה בטווח החיפוש) — נפילה לי"ח שעות מן המולד.
      $('m_jSee').onclick = () => {
        const t0 = this._monthT0();
        let t = null;
        try {
          const AE = window.Astronomy, obs = new AE.Observer(this.loc.lat, this.loc.lon, 0);
          const s = AE.SearchRiseSet(AE.Body.Sun, obs, -1, AE.MakeTime(new Date(t0)), 2);
          if (s) t = s.date.getTime() + 20 * 60000;
        } catch (_) {}
        this.t = t == null ? t0 + 0.75 * 86400000 : t;
        stop(); this._syncDate();
      };
      // הניגוד אינו נופל בדיוק באמצע החודש — הירח אינו נע במהירות אחידה;
      // לכן הוא נדרש כמופע אמיתי (180°) ולא כמחצית אורך החודש
      $('m_jFull').onclick = () => {
        const t0 = this._monthT0();
        const f = moonPhaseAfter(180, t0);
        this.t = f == null ? t0 + lunation(t0).len / 2 * 86400000 : f;
        stop(); this._syncDate();
      };
      // מעבר מפורש בין חודשים — אל הקיבוץ האמיתי הסמוך; היום בחודש נשמר
      // בקירוב, וכפתורי הרגעים מכוונים מעתה אל החודש החדש
      const shiftMonth = (id, dir) => { const b = $(id); if (b) b.onclick = () => {
        const cur = lunation(this.t), age = this.t - cur.t0;
        // אורכי החודשים אינם שווים; גיל שאינו נכנס בחודש היעד נקטע, שלא יזלוג
        const nt0 = dir > 0 ? cur.t1 : lunation(cur.t0 - 1000).t0;
        const nxt = lunation(nt0 + 1000);
        this.t = nt0 + Math.min(age, nxt.t1 - nt0 - 1000);
        stop(); this._syncDate();
      }; };
      shiftMonth('m_prevM', -1);
      shiftMonth('m_nextM', +1);
      $('m_today').onclick = () => { this.t = Date.now(); stop(); this._syncDate(); };
      $('m_speed').oninput = e => { this.speed = +e.target.value; $('m_spdL').textContent = this.speed.toFixed(1); };
      // גרירת "יום בחודש" — מציבה את הרגע בתוך החודש המוצג. טווח המחוון נקבע
      // באורכו האמיתי של החודש (sync), והקצה נקטע שלא יגלוש אל הקיבוץ הבא
      $('m_scrub').oninput = e => {
        const cur = lunation(this.t);
        this.t = cur.t0 + Math.min(+e.target.value * 86400000, cur.t1 - cur.t0 - 1000);
        stop(); this._syncDate();
      };
      // מקום הצפייה: בחירה מן הרשימה קובעת רוחב+אורך+אזור זמן; עריכה ידנית
      // של הקואורדינטות מעבירה ל"מותאם אישית" (ואז אזור הזמן מוערך מקו האורך).
      $('m_city').onchange = e => {
        const opt = e.target.selectedOptions[0], v = e.target.value;
        if (!v) { this.loc = { lat: this.loc.lat, lon: this.loc.lon, tz: null, name: 'מותאם אישית' }; return; }
        const [la, lo] = v.split(',').map(Number);
        $('m_lat').value = la; $('m_lon').value = lo;
        this.loc = { lat: la, lon: lo, tz: opt.dataset.tz || null, name: opt.textContent.trim() };
      };
      const mCustom = () => { $('m_city').value = ''; this.loc.tz = null; this.loc.name = 'מותאם אישית'; };
      $('m_lat').oninput = e => { this.loc.lat = Math.max(-89, Math.min(89, +e.target.value || 0)); mCustom(); };
      $('m_lon').oninput = e => { this.loc.lon = Math.max(-180, Math.min(180, +e.target.value || 0)); mCustom(); };
      $('m_go').onclick = () => {
        const y = +$('m_yy').value, m = +$('m_mm').value, d = +$('m_dd').value;
        if (!y || !m || !d) return;
        this.t = new Date(y, m - 1, d, +$('m_hh').value || 0, +$('m_mi').value || 0, 0).getTime();
        stop();
      };
    },
    _syncDate() {
      const d = new Date(this.t);
      const set = (id, v) => { const el = $(id); if (el && !window.__fieldLocked(el)) el.value = v; };
      set('m_dd', d.getDate()); set('m_mm', d.getMonth() + 1); set('m_yy', d.getFullYear());
      set('m_hh', d.getHours()); set('m_mi', d.getMinutes());
    },
    sync() {
      // טווח המחוון הוא אורכו האמיתי של החודש המוצג (29.27–29.83 ימים)
      const sc = $('m_scrub');
      sc.max = lunation(this.t).len.toFixed(2);
      if (document.activeElement !== sc) sc.value = this.day.toFixed(2);
      this._syncDate();
    },
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
    const theta = 2 * Math.PI * (day % MEAN_LUN) / MEAN_LUN, a = R * Math.cos(theta);
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
    // hour = השעון האזרחי במקום הנבחר (כולל שעון קיץ). ההמרה לזוית השעה נעשית
    // ב-solarHour(): הפחתת היסט אזור הזמן, הוספת קו האורך המקומי ומשוואת הזמן.
    hour: 12, dayY: 0, lat: 31.78, lon: 35.24, tz: 'Asia/Jerusalem', cityName: 'ירושלים',
    speed: 2, playing: false, auto: true, viewAz: 90, hintDone: false, _bound: false,
    step(dt) { if (this.playing) { this.hour += this.speed * dt; if (this.hour >= 24) { this.hour -= 24; if (this.auto) this.dayY = (this.dayY + 1) % yearSpan().days; } } },
    // היסט אזור הזמן בשעות; ללא אזור זמן ידוע — הערכה לפי קו האורך
    tzOff() {
      const o = tzOffsetHours(this.tz, dayYToDate(this.dayY));
      return o === null ? Math.round(this.lon / 15) : o;
    },
    eot() { return equationOfTime(dayYToDate(this.dayY)); },
    // שעון אזרחי → שעה שמשית אמיתית (חצות היום האמיתי = 12:00) — נפילה סכמטית
    solarHour(h) {
      return (h === undefined ? this.hour : h) - this.tzOff() + this.lon / 15 + this.eot();
    },
    // שעה שמשית אמיתית → שעון אזרחי — נפילה סכמטית
    civilHour(s) { return s + this.tzOff() - this.lon / 15 - this.eot(); },
    // הרגע המוצג: התאריך שבאיור + השעון האזרחי במקום הנבחר
    instant() {
      const d = dayYToDate(this.dayY);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
        + (this.hour - this.tzOff()) * 3600000);
    },
    // מיקום השמש האמיתי לרגע המוצג (Astronomy Engine): זוית השעה המקומית
    // והנטייה. האיור וה-HUD נצמדים לזמנים האמיתיים; אם המנוע אינו זמין —
    // נפילה למודל הסכמטי (שנת שמואל + משוואת הזמן).
    sun() {
      try {
        const AE = window.Astronomy, t = AE.MakeTime(this.instant());
        const eq = AE.Equator(AE.Body.Sun, t, new AE.Observer(this.lat, this.lon, 0), true, true);
        const H = (((AE.SiderealTime(t) * 15 + this.lon - eq.ra * 15) % 360) + 360) % 360;
        return { H, dec: eq.dec };
      } catch (e) {
        return { H: (((this.solarHour() - 12) * 15 % 360) + 360) % 360, dec: A.solarDecl(this.dayY) };
      }
    },
    // זריחה/שקיעה/חצות אמיתיים ליום המוצג — במטמון (חיפושי AE יקרים יחסית)
    riseSet() {
      const key = Math.floor(this.dayY) + '|' + this.lat + '|' + this.lon + '|' + this.tz;
      if (this._rsKey === key) return this._rs;
      this._rsKey = key;
      let out = null;
      try {
        const AE = window.Astronomy, obs = new AE.Observer(this.lat, this.lon, 0);
        const d = dayYToDate(this.dayY);
        const t0 = AE.MakeTime(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
          - this.tzOff() * 3600000));
        const rise = AE.SearchRiseSet(AE.Body.Sun, obs, +1, t0, 1.2);
        const set  = AE.SearchRiseSet(AE.Body.Sun, obs, -1, t0, 1.2);
        const noon = AE.SearchHourAngle(AE.Body.Sun, obs, 0, t0);
        const mid  = AE.SearchHourAngle(AE.Body.Sun, obs, 12, t0);
        out = {
          rise: rise && rise.date, set: set && set.date,
          noon: noon && noon.time.date, mid: mid && mid.time.date,
          midAlt: mid && mid.hor ? mid.hor.altitude : null,
        };
      } catch (e) {}
      return (this._rs = out);
    },
    // רגע מוחלט → השעון האזרחי במקום הנבחר
    civilOfDate(dt) { return (((dt.getTime() / 3600000 + this.tzOff()) % 24) + 24) % 24; },
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
    // ── מקומה של חלונית הנטייה ─────────────────────────────────────────
    // האיור הזה אינו הסבר נלווה אלא חלק מן ההמחשה, ולכן מקומו בבמה עצמה —
    // בפינה שמתחת ל-HUD, ברצועה ששמורה לו ממילא ואין הכיפה מצוירת בה. במסך
    // צר אין בבמה פינה פנויה (ה-HUD נערם בראש והכיפה תופסת את השאר), ושם הוא
    // חוזר אל הכרטיס שבלוח הצד. המעבר מאפס את מטמון המידות והפריסה.
    placeTilt() {
      const box = $('y_tiltInset'), slot = $('y_tiltSlot'), c = $('yearCanvas');
      if (!box || !slot || !c) return;
      const target = (window.innerWidth || 0) >= 760 ? c.parentElement : slot;
      if (box.parentElement === target) return;
      target.appendChild(box);
      clearFitCache();
    },
    draw() {
      this.placeTilt();
      const { ctx, W, H } = fit($('yearCanvas'));
      ctx.clearRect(0, 0, W, H);
      // cy מוסט מעט מטה ו-R מוקטן כדי לפנות מקום לשורת ההסבר בראש (פסגת המסלול במרכז-עליון).
      // במסכים צרים מורידים את מרכז המסלול מתחת ל-HUD כדי שלא יכסה את האיור.
      let cx = W / 2, cy, R;
      if (W >= 760) {
        // רצועה שמורה ל-HUD מימין, כדי שהכיפה לא תצויר מתחתיו
        const L = stageLayout($('yearCanvas'), W, H);
        cx = L.x + L.w / 2; cy = H / 2 + 12; R = Math.min(L.w * 0.40, (H - 54) / 2);
      }
      else {
        if (_layout.yearTop === null) _layout.yearTop = hudInset($('yearCanvas'), W, 54);
        const usableH = H - _layout.yearTop - 10;
        cy = _layout.yearTop + usableH / 2; R = Math.min(W * 0.40, usableH / 2);
      }
      const yR = R * Math.sin(BETA * Math.PI / 180);
      // מיקום השמש האמיתי (Astronomy Engine) — המסלול הנוכחי והשמש עצמה
      const sn = this.sun(), dec = sn.dec;
      ctx.strokeStyle = cv('--ill-horizon'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, R, yR, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = cv('--ill-text'); ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [az, lbl] of [[180, 'דרום'], [0, 'צפון'], [90, 'מזרח'], [270, 'מערב']]) {
        const rd = az * Math.PI / 180, p = this.proj({ E: 1.15 * Math.sin(rd), N: 1.15 * Math.cos(rd), U: 0 }, cx, cy, R);
        ctx.fillText(T(lbl), p.x, p.y);
      }
      // ציר העולם
      const pole = this.proj({ E: 0, N: Math.cos(this.lat * Math.PI / 180), U: Math.sin(this.lat * Math.PI / 180) }, cx, cy, R);
      ctx.strokeStyle = cv('--ill-grid'); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pole.x, pole.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.fillText(T('ציר העולם'), pole.x, pole.y - 10);
      // השמש (כיוון) + כדור הארץ. מציירים את הכדור תחילה, ואז את מסלולי השמיים והשמש מעליו עם
      // הסתרה (occlusion): מה שמאחורי הכדור (בצד הרחוק מהצופה) מוסתר על־ידו, ומה שלפניו מצויר מעליו.
      const s = this.season();
      const v = A.sunHorizon(sn.H, dec, this.lat), p = this.proj(v, cx, cy, R), up = v.U > 0, sR = up ? 17 : 13;
      const gR = Math.max(26, R * 0.2);
      const va = this.viewAz * Math.PI / 180, vb = BETA * Math.PI / 180;
      const ev = [Math.sin(va) * Math.cos(vb), Math.cos(va) * Math.cos(vb), Math.sin(vb)];   // כיוון הצופה (עומק)
      // נקודה מוסתרת אם היא נופלת בתוך דיסקת הכדור וגם בצדו הרחוק (רכיב עומק שלילי)
      const occ = (vd, pt) => { const dx = pt.x - cx, dy = pt.y - cy; return dx*dx + dy*dy < gR*gR && (vd.E*ev[0] + vd.N*ev[1] + vd.U*ev[2]) < 0; };
      drawGlobe(ctx, cx, cy, gR, v, this.viewAz, this.lat, this.lon);
      // מסלולי ייחוס + תוויות. מדרום לקו המשוה הקיץ והחורף מתהפכים:
      // המסלול הגבוה שם (נטייה דרומית, תקופת טבת) הוא הקיץ. סמוך לקו המשוה
      // (3°±) אין לא קיץ ולא חורף — הקווים מסומנים כקווי ההיפוך בלבד.
      const south = this.lat < 0, nearEq = Math.abs(this.lat) <= 3;
      this.circle(ctx, 23.44, cx, cy, R, cv(south ? '--ill-winter' : '--ill-summer'), 1.2, occ);
      this.circle(ctx, 0, cx, cy, R, cv('--ill-text'), 1.2, occ);
      this.circle(ctx, -23.44, cx, cy, R, cv(south ? '--ill-summer' : '--ill-winter'), 1.2, occ);
      for (const [dc, lbl, col] of [
          [23.44, nearEq ? 'קו ההיפוך הצפוני' : (south ? 'חורף' : 'קיץ'), cv(south ? '--ill-winter' : '--ill-summer')],
          [0, 'שוויון', cv('--ill-text')],
          [-23.44, nearEq ? 'קו ההיפוך הדרומי' : (south ? 'קיץ' : 'חורף'), cv(south ? '--ill-summer' : '--ill-winter')]]) {
        const tp = this.proj(A.sunHorizon(0, dc, this.lat), cx, cy, R);
        ctx.fillStyle = col; ctx.font = '11px sans-serif'; ctx.fillText(T(lbl), tp.x + 24, tp.y - 2);
      }
      // המסלול הנוכחי
      this.circle(ctx, dec, cx, cy, R, cv(s.c), 2.6, occ);
      // השמש — מצוירת מעל הכדור כשהיא לפניו, ומוסתרת רק כשהיא ממש מאחוריו
      if (!occ(v, p)) {
        if (up) { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, sR * 2.4); g.addColorStop(0, cv('--ill-sun-glow')); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, sR * 2.4, 0, 2 * Math.PI); ctx.fill(); }
        ctx.globalAlpha = up ? 1 : 0.5; sprite(ctx, IMG.sun, p.x, p.y, 2 * sR, 2 * sR); ctx.globalAlpha = 1;
      }
      if (!this.hintDone) drawHint(ctx, W, 'גררו לסיבוב · ▶ הפעל להנעה');
      this.hud(v.U, sn);
      this.drawSeasons(dec, sn.H);
    },
    // ── מדוע מסלול השמש נודד? — איור עזר בפאנל ─────────────────────────
    // מבט אלכסוני על מסלול הארץ סביב השמש, מצפון למישור המסלול (מישור המלקה):
    // המסלול נראה כאליפסה. ציר הסיבוב נטוי 23.44° וכיוונו קבוע בחלל, ולכן
    // בתקופת תמוז החצי הצפוני רכון אל השמש ובטבת ממנה והלאה.
    //
    // ההיטל מחושב בשלושה ממדים ממש: EX ימינה במסך, EUP מעלה, ו-EV לעומק (אל
    // הצופה). זה תיקון עיקרי: קודם צוירו קו המשווה וגבול היום־לילה כקווים
    // *ניצבים על המסך* לציר שעל המסך — ומכיוון שההיטל אלכסוני יצא שהקרן מן
    // השמש פגעה בקו המשווה בימים 43 ו-226 מתקופת ניסן במקום בתקופות ניסן
    // ותשרי עצמן, וגבול היום־לילה לא התאים לכיוון השמש. כאן קו המשווה, גבול
    // היום־לילה והנקודה שהשמש מעליה כולם היטלים של מעגלים בחלל — ולכן הם
    // מתאימים לכיוון השמש בכל נקודה שבמסלול.
    drawSeasons(dec, hourAng) {
      const c = $('seasonsCanvas'); if (!c) return;
      const { ctx, W, H } = fitInset(c);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 + 4;
      const a = Math.min(W * 0.38, 130), b = a * 0.44;
      // בסיס ההיטל. גובה נקודת המבט מעל מישור המסלול נגזר מיחס האליפסה עצמו
      // (b/a = sin α), ולכן המסלול והכדור מצוירים באותו היטל בדיוק.
      const sinA = b / a, cosA = Math.sqrt(1 - sinA * sinA);
      const EX = [1, 0, 0], EUP = [0, sinA, cosA], EV = [0, -cosA, sinA];
      const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
      const cross3 = (u, v) => [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]];
      const norm3 = u => { const m = Math.hypot(u[0], u[1], u[2]) || 1; return [u[0]/m, u[1]/m, u[2]/m]; };
      // מסלול הארץ (סכמטי)
      ctx.strokeStyle = cv('--ill-line'); ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      // מיקום על המסלול: תקופת תמוז מימין (שם הציר הקבוע רכון אל השמש), טבת
      // משמאל, ותקופות השוויון בקצות האליפסה. הארץ נעה נגד כיוון השעון — כמות
      // שהיא נראית ממש מצפון למישור המסלול. הזוית נגזרת מאורך המלקה האמיתי
      // של השמש (Astronomy Engine): ארבע התקופות רחוקות זו מזו 90° באורך
      // המלקה בשווה אף שאינן שוות בזמן, וכך רוחב הנקודה הצהובה שעל הכדור
      // (sin ε · sin λ) שווה בדיוק לנטייה האמיתית שבשורת הנתונים. בלי המנוע —
      // נפילה לתנועה סכמטית אחידה ברבעים שווים.
      const lam = d => {
        try {
          const AE = window.Astronomy;
          return (AE.SunPosition(AE.MakeTime(dayYToDate(d))).elon - 90) * Math.PI / 180;
        } catch (e) { return 2 * Math.PI * (d - 91.31) / A.SOLAR_YEAR; }
      };
      const orbit = d => { const l = lam(d); return [Math.cos(l), Math.sin(l), 0]; };
      const scr = P => ({ x: cx + a * dot3(P, EX), y: cy - a * dot3(P, EUP) });
      // השמש במרכז
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      g.addColorStop(0, cv('--ill-sun-glow')); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 2 * Math.PI); ctx.fill();
      sprite(ctx, IMG.sun, cx, cy, 26, 26);
      // ארבע התקופות על המסלול — ברגעיהן האמיתיים (רבעים סכמטיים בלי המנוע).
      // הנקודות כאן, והשמות בסוף הציור (אחרי הכדור), שהכדור לא יכסה את שם
      // התקופה שהוא עומד בה
      const spn = yearSpan(), tkd = spn.tek || [0, 91.31, 182.62, 273.94];
      const TEKUFOT = [[tkd[0], 'ניסן'], [tkd[1], 'תמוז'], [tkd[2], 'תשרי'], [tkd[3], 'טבת']];
      ctx.fillStyle = cv('--ill-muted');
      for (const [d] of TEKUFOT) {
        const q = scr(orbit(d));
        ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, 2 * Math.PI); ctx.fill();
      }
      // ── הארץ ביומה ──
      const dayY = ((this.dayY % spn.days) + spn.days) % spn.days;
      const E = orbit(dayY), p = scr(E), er = 11;
      const sv = norm3([-E[0], -E[1], -E[2]]);          // כיוון השמש מן הארץ
      const eps = 23.44 * Math.PI / 180;
      const N3 = [-Math.sin(eps), 0, Math.cos(eps)];    // ציר הסיבוב — קבוע בחלל
      // נקודה על פני הכדור (וקטור יחידה) → מסך
      const sph = P => ({ x: p.x + er * dot3(P, EX), y: p.y - er * dot3(P, EUP) });
      const ang = P => { const q = sph(P); return Math.atan2(q.y - p.y, q.x - p.x); };
      // קרן השמש — עד שפת הכדור בלבד. קודם נמשכה עד מרכז הכדור, וממילא חצתה
      // תמיד את קו המשווה ולא ניתן היה לראות בה מעל איזה קו רוחב השמש עומדת.
      { const dx = p.x - cx, dy = p.y - cy, m = Math.hypot(dx, dy) || 1;
        ctx.strokeStyle = cv('--ill-ray'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x - dx / m * er, p.y - dy / m * er); ctx.stroke(); }
      sprite(ctx, IMG.earth, p.x, p.y, 2 * er, 2 * er);
      // ── צד הלילה ──
      // האזור שאין השמש זורחת בו ושהצופה רואה אותו: מחצית גבול היום־לילה
      // (מעגל הניצב לכיוון השמש) הפונה אל הצופה, ואחריה מחצית שפת הכדור
      // שמנגד לשמש. שתי המחציות נפגשות בדיוק בקצות הגבול, ולכן הצורה נסגרת.
      { const u1 = norm3(cross3(sv, EV));               // בגבול, ובמישור המסך
        const u2 = cross3(sv, u1);                      // בגבול, לכיוון העומק
        const sgn = dot3(u2, EV) >= 0 ? 1 : -1;         // המחצית הפונה אל הצופה
        ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, er, 0, 2 * Math.PI); ctx.clip();
        ctx.fillStyle = cv('--ill-night'); ctx.beginPath();
        const NS = 36;
        for (let i = 0; i <= NS; i++) {
          const t = sgn * Math.PI * i / NS;
          const P = [u1[0]*Math.cos(t) + u2[0]*Math.sin(t), u1[1]*Math.cos(t) + u2[1]*Math.sin(t),
                     u1[2]*Math.cos(t) + u2[2]*Math.sin(t)];
          const q = sph(P); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
        }
        // שפת הכדור מקצה הגבול בחזרה, דרך הכיוון שמנגד לשמש
        const a1 = ang(u1), a2 = ang([-u1[0], -u1[1], -u1[2]]);
        const asun = ang([-sv[0], -sv[1], -sv[2]]);   // כיוון "מנגד לשמש" במסך
        const nrm = x => ((x % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
        const ccw = !(nrm(asun - a2) < nrm(a1 - a2));
        ctx.arc(p.x, p.y, er, a2, a1, ccw);
        ctx.closePath(); ctx.fill(); ctx.restore(); }
      // ── קו המשווה — היטל המעגל הניצב לציר ──
      // דו-גוני (בהיר מלא ומעליו קווקוו כהה) כדי שייראה על צד היום ועל צד
      // הלילה ובשתי פלטות האיור; החצי הרחוק עמום.
      { const w1 = norm3(cross3(N3, EV)), w2 = cross3(N3, w1);
        const pts = [];
        for (let i = 0; i <= 72; i++) {
          const t = 2 * Math.PI * i / 72;
          const P = [w1[0]*Math.cos(t) + w2[0]*Math.sin(t), w1[1]*Math.cos(t) + w2[1]*Math.sin(t),
                     w1[2]*Math.cos(t) + w2[2]*Math.sin(t)];
          pts.push({ q: sph(P), near: dot3(P, EV) >= 0 });
        }
        const run = near => { ctx.beginPath();
          for (let i = 0; i < pts.length - 1; i++) {
            if (pts[i].near !== near || pts[i+1].near !== near) continue;
            ctx.moveTo(pts[i].q.x, pts[i].q.y); ctx.lineTo(pts[i+1].q.x, pts[i+1].q.y);
          } ctx.stroke(); };
        ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 2.6; run(true);
        ctx.strokeStyle = 'rgba(18,24,44,0.95)'; ctx.lineWidth = 1.3;
        ctx.setLineDash([2.5, 2.5]); run(true); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(160,170,190,0.45)'; ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]); run(false); ctx.setLineDash([]); }
      // ── הסיבוב היומי — קו האורך של הצופה ──────────────────────────
      // עד כאן היה הכדור עומד באיור, וסיבובו היומי נזכר בהסבר בלבד. הקו
      // האדום הוא קו האורך של הצופה והנקודה שעליו מקומו ממש; שניהם מקיפים
      // את הציר פעם ביממה. כשהם פונים אל השמש — שם חצות היום, וכשהם מנגד —
      // חצות הלילה. הזווית נגזרת מזוית השעה האמיתית של השמש: מרידיאן
      // חצות היום הוא הכיוון שבמישור המשווה הפונה אל השמש, ומרידיאן הצופה
      // מרוחק ממנו כשיעור זוית השעה — בכיוון הסיבוב, שהוא נגד כיוון השעון מן הקוטב
      // הצפוני. משום כך בשעה 18:00 (H=90°) הצופה רבע-סיבוב אחרי חצות היום.
      { const svn = dot3(sv, N3);
        const en = norm3([sv[0] - svn * N3[0], sv[1] - svn * N3[1], sv[2] - svn * N3[2]]);
        const wn = cross3(N3, en);
        const hr = (hourAng || 0) * Math.PI / 180, ch = Math.cos(hr), sh = Math.sin(hr);
        const u = [en[0] * ch + wn[0] * sh, en[1] * ch + wn[1] * sh, en[2] * ch + wn[2] * sh];
        let prev = null;
        for (let i = 0; i <= 24; i++) {                 // חצי המרידיאן שהצופה עליו — מקוטב לקוטב
          const t = -Math.PI / 2 + Math.PI * i / 24, ct = Math.cos(t), stt = Math.sin(t);
          const P = [u[0] * ct + N3[0] * stt, u[1] * ct + N3[1] * stt, u[2] * ct + N3[2] * stt];
          const q = sph(P), near = dot3(P, EV) >= 0;
          if (prev) {
            const vis = prev.near && near;
            ctx.strokeStyle = vis ? 'rgba(255,110,90,0.95)' : 'rgba(255,110,90,0.28)';
            ctx.lineWidth = vis ? 1.4 : 1;
            ctx.beginPath(); ctx.moveTo(prev.q.x, prev.q.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
          prev = { q, near };
        }
        const la = this.lat * Math.PI / 180, cl = Math.cos(la), sl = Math.sin(la);
        const Po = [u[0] * cl + N3[0] * sl, u[1] * cl + N3[1] * sl, u[2] * cl + N3[2] * sl];
        const qo = sph(Po);                             // מקום הצופה — מלא כשהוא לצדנו, טבעת כשהוא מנגד
        ctx.beginPath(); ctx.arc(qo.x, qo.y, 2.4, 0, 2 * Math.PI);
        if (dot3(Po, EV) >= 0) { ctx.fillStyle = '#ff5a4d'; ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(255,90,77,0.85)'; ctx.lineWidth = 1.1; ctx.stroke(); } }

      // ── ציר הסיבוב ──
      const pn = sph(N3), ps = sph([-N3[0], -N3[1], -N3[2]]);
      ctx.strokeStyle = cv('--ill-text'); ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x + (pn.x - p.x) * 1.7, p.y + (pn.y - p.y) * 1.7);
      ctx.lineTo(p.x + (ps.x - p.x) * 1.7, p.y + (ps.y - p.y) * 1.7);
      ctx.stroke();
      // ── הנקודה שהשמש עומדת מעליה ──
      // היא הקישור בין האיור ובין השורה שמתחתיו: בתקופות ניסן ותשרי היא על קו
      // המשווה ממש, ובתמוז ובטבת על קווי ההיפוך. כשהיא בצדו הרחוק של הכדור
      // (הארץ בין הצופה ובין השמש) היא מסומנת כטבעת ריקה.
      { const q = sph(sv), vis = dot3(sv, EV) >= 0;
        ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, 2 * Math.PI);
        if (vis) { ctx.fillStyle = '#ffd257'; ctx.fill(); ctx.strokeStyle = 'rgba(60,40,0,0.8)'; }
        else { ctx.strokeStyle = 'rgba(255,210,87,0.85)'; }
        ctx.lineWidth = 1.1; ctx.stroke(); }
      // סימון הכיוונים על הכדור: צ/ד בקצות הציר. מזרח ומערב אינם מסומנים —
      // אינם נקודות קבועות באיור, שהרי הכדור מסתובב סביב הציר פעם ביממה.
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = cv('--ill-text');
      // אות ראשונה של שם הרוח (צ/ד; באנגלית N/S) — 'צ' לבדה משמשת כמפתח
      // תרגום אחר (צדק, בשצ"ם חנכ"ל), ולכן נגזרת כאן מן המילה המלאה
      ctx.fillText(T('צפון').charAt(0), p.x + (pn.x - p.x) * 2.3, p.y + (pn.y - p.y) * 2.3);
      ctx.fillText(T('דרום').charAt(0), p.x + (ps.x - p.x) * 2.3, p.y + (ps.y - p.y) * 2.3);
      // מקרא בשולי האיור — הכדור קטן מלהכיל שמות מלאים
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = cv('--ill-muted');
      { const txt = T('צפון').charAt(0) + '=' + T('צפון') + ' · ' + T('דרום').charAt(0) + '=' + T('דרום') +
          ' · ' + T('המעגל הניצב לציר — קו המשווה');
        // הקנבס צר, ואורך המקרא משתנה עם השפה — הגופן מוקטן עד שהוא נכנס
        let fs = 8;
        ctx.font = fs + 'px sans-serif';
        while (fs > 6 && ctx.measureText(txt).width > W - 12) { fs -= 0.5; ctx.font = fs + 'px sans-serif'; }
        ctx.fillText(txt, W - 6, H - 4); }
      // שמות התקופות — בקצות המסלול האופקיים (תמוז וטבת) הצמודים לשולי
      // הקנבס השם נכתב מעל הנקודה, שלא ייחתך בשוליים ולא ייבלע בכדור
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = cv('--ill-muted');
      for (const [d, n] of TEKUFOT) {
        const q = scr(orbit(d)), side = Math.abs(q.x - cx) > a * 0.7;
        const lx = side ? Math.min(Math.max(q.x, 22), W - 22) : q.x;
        const ly = side ? q.y - er - 22 : q.y + (q.y - cy) / b * (er + 22);   // מחוץ לכדור ולאותיות שבקצות הציר
        ctx.fillText(T(n), lx, ly);
      }
      // השורה החיה שמתחת לאיור: קו הרוחב שהשמש ניצבת מעליו כעת
      const el = $('ss_now');
      if (el) el.textContent = T('השמש עומדת כעת מעל קו רוחב') + ' ' + fmtNS(dec) +
        (Math.abs(dec) < 0.05 ? ' — ' + T('קו המשווה') : '');
    },
    season() {
      // מדרום לקו המשוה העונות מהופכות: תקופת תמוז שם חורף ותקופת טבת קיץ.
      // סמוך לקו המשוה (3°±) אין קיץ וחורף — מוצג שם התקופה בלבד.
      const south = this.lat < 0, nearEq = Math.abs(this.lat) <= 3;
      const s = yearSpan(), tk = s.tek || [0, 91.31, 182.62, 273.94];
      const t = ((this.dayY % s.days) + s.days) % s.days;
      if (t < tk[1]) return nearEq ? { n: 'תקופת ניסן', c: '--ill-spring' } : south ? { n: 'סתיו · ניסן', c: '--ill-autumn' } : { n: 'אביב · ניסן', c: '--ill-spring' };
      if (t < tk[2]) return nearEq ? { n: 'תקופת תמוז', c: '--ill-summer' } : south ? { n: 'חורף · תמוז', c: '--ill-winter' } : { n: 'קיץ · תמוז', c: '--ill-summer' };
      if (t < tk[3]) return nearEq ? { n: 'תקופת תשרי', c: '--ill-autumn' } : south ? { n: 'אביב · תשרי', c: '--ill-spring' } : { n: 'סתיו · תשרי', c: '--ill-autumn' };
      return nearEq ? { n: 'תקופת טבת', c: '--ill-winter' } : south ? { n: 'קיץ · טבת', c: '--ill-summer' } : { n: 'חורף · טבת', c: '--ill-winter' };
    },
    hud(Unow, sn) {
      const dec = sn.dec, phi = this.lat;
      const altNow = Math.asin(Unow) * 180 / Math.PI;
      const s = this.season();
      $('y_clock').textContent = fmtH(this.hour);
      $('y_tz').textContent = (this.tz ? T('שעון מקומי') : T('זמן שמש ממוצע (משוער)'))
        + ' — ' + T(this.cityName) + ' (' + fmtOff(this.tzOff()) + ')';
      $('y_updown').textContent = altNow > 0 ? T('השמש מעל האופק ☀') : T('השמש מתחת לאופק 🌙');
      $('y_alt').textContent = altNow.toFixed(0) + '°';
      // נטיית השמש — זוית השמש מצפון/דרום לקו המשוה
      $('y_dec').textContent = fmtNS(dec);
      // זוית השמש מצפון/דרום למקום הצופה (מרחק זויתי מהזנית בכיוון צפון–דרום)
      $('y_zen').textContent = fmtNS(dec - phi);
      $('y_season').textContent = T(s.n);
      $('y_date').textContent = dayYToDateLabel(this.dayY);
      // שעה שמשית אמיתית — מזוית השעה של השמש (חצות אמיתי = 12:00)
      $('y_solar').textContent = fmtH(sn.H / 15 + 12);
      // זריחה/שקיעה/אורך היום/עומק חצות — זמנים אמיתיים (Astronomy Engine,
      // כולל שבירת אור); נפילה לחישוב הסכמטי אם החיפוש נכשל
      const rs = this.riseSet();
      if (rs && rs.rise && rs.set) {
        $('y_rise').textContent = fmtH(this.civilOfDate(rs.rise)) + ' / ' + fmtH(this.civilOfDate(rs.set));
        $('y_daylen').textContent = fmtH((((rs.set - rs.rise) / 3600000) % 24 + 24) % 24);
      } else {
        const cosH = -Math.tan(phi * Math.PI / 180) * Math.tan(dec * Math.PI / 180);
        $('y_rise').textContent = cosH <= -1 ? T('יום תמידי') : cosH >= 1 ? T('לילה תמידי') : '—';
        $('y_daylen').textContent = fmtH(A.dayLengthHours(dec, phi));
      }
      $('y_mid').textContent = (rs && rs.midAlt != null ? rs.midAlt
        : Math.asin(A.sunHorizon(180, dec, phi).U) * 180 / Math.PI).toFixed(0) + '°';
    },
    faceLabel() {
      const f = (((this.viewAz + 180) % 360) + 360) % 360;
      const names = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
      const off = ((this.viewAz % 360) + 360) % 360, sgn = off > 180 ? off - 360 : off;
      return T(names[Math.round(f / 45) % 8]) + (sgn ? ` (${sgn > 0 ? '+' : ''}${sgn}°)` : '');
    },
    sync() {
      $('y_spdL').textContent = this.speed; $('y_hourL').textContent = fmtH(this.hour); $('y_dayL').textContent = Math.floor(this.dayY);
      $('y_azL').textContent = this.faceLabel();
      if (document.activeElement !== $('y_hour')) $('y_hour').value = this.hour;
      if (document.activeElement !== $('y_dayY')) $('y_dayY').value = this.dayY;
      // שדות "או לפי תאריך" עוקבים אחרי היום המוצג באיור (ולא נשארים על תאריך
      // ישן) — כך קפיצה של יום אחד מהמקום הנוכחי יוצאת ממנו ולא מהיום שהוזן
      // קודם. שדה בפוקוס או שהוזן ולא אושר אינו נדרס (__fieldLocked).
      const d = dayYToDate(this.dayY), L = window.__fieldLocked || (el => document.activeElement === el);
      if (!L($('y_dd'))) $('y_dd').value = d.getUTCDate();
      if (!L($('y_mm'))) $('y_mm').value = d.getUTCMonth() + 1;
      if (!L($('y_yy'))) $('y_yy').value = d.getUTCFullYear();
      syncOtzRefreshBtn(d);   // הכפתור מופיע כשהתאריך שבאיור התרחק מזה שבכרטיס
    },
    bind() {
      if (this._bound) return; this._bound = true;
      { const t = solarToday(this.tz); this.dayY = t.dayY; this.hour = t.hour; }   // ברירת מחדל: היום והשעה הנוכחיים
      $('y_play').onclick = e => { this.playing = !this.playing; this.hintDone = true; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      $('y_today').onclick = () => { const t = solarToday(this.tz); this.dayY = t.dayY; this.hour = t.hour; this.playing = false; $('y_play').textContent = T('▶ הפעל'); loadOtzariaTimes(); };
      // חצות אמיתי (מעבר המרידיאן, Astronomy Engine) בשעון האזרחי — בירושלים
      // (חורף) ~11:39, ובשעון קיץ ~12:39; לא 12:00 שעל השעון.
      $('y_noon').onclick = () => {
        const rs = this.riseSet();
        this.hour = rs && rs.noon ? this.civilOfDate(rs.noon) : ((this.civilHour(12) % 24) + 24) % 24;
      };
      $('y_midnight').onclick = () => {
        const rs = this.riseSet();
        this.hour = rs && rs.mid ? this.civilOfDate(rs.mid) : ((this.civilHour(0) % 24) + 24) % 24;
      };
      $('y_speed').oninput = e => this.speed = +e.target.value;
      $('y_hour').oninput = e => { this.hour = +e.target.value; this.playing = false; $('y_play').textContent = T('▶ הפעל'); };
      $('y_dayY').oninput = e => this.dayY = +e.target.value;
      // קביעת היום בשנה לפי תאריך לועזי (כמו בכוכבי הלכת)
      { const d = new Date(); $('y_dd').value = d.getDate(); $('y_mm').value = d.getMonth() + 1; $('y_yy').value = d.getFullYear(); }
      $('y_dateGo').onclick = () => {
        const Y = +$('y_yy').value, M = +$('y_mm').value, D = +$('y_dd').value;
        if (!Y || !M || !D) return;
        this.dayY = dayYFromDate(Y, M, D);
        loadOtzariaTimes();   // במצב החדש כרטיס הלוח עוקב אחרי תאריך האיור
      };
      // מיקום הצופה: בחירת עיר קובעת רוחב+אורך; עריכה ידנית מעבירה ל"מותאם אישית"
      // מעבר מקום שומר על אותו רגע פיזי: השעון מוסט בהפרש אזורי הזמן, כך
      // שבחירת ניו יורק בשעה 21:00 בירושלים תציג 14:00 — השעה המקומית שם.
      const reClock = fn => {
        const o = this.tzOff(); fn();
        this.hour = (((this.hour + this.tzOff() - o) % 24) + 24) % 24;
      };
      $('y_city').onchange = e => reClock(() => {
        const opt = e.target.selectedOptions[0], v = e.target.value;
        if (!v) { this.tz = null; this.cityName = 'מותאם אישית'; return; }
        const [la, lo] = v.split(',').map(Number);
        this.lat = la; this.lon = lo; $('y_lat').value = la; $('y_lon').value = lo;
        this.tz = opt.dataset.tz || null; this.cityName = opt.textContent.trim();
      });
      const custom = () => { $('y_city').value = ''; this.tz = null; this.cityName = 'מותאם אישית'; };
      $('y_lat').oninput = e => reClock(() => { this.lat = Math.max(-89, Math.min(89, +e.target.value || 0)); custom(); });
      $('y_lon').oninput = e => reClock(() => { this.lon = Math.max(-180, Math.min(180, +e.target.value || 0)); custom(); });
      $('y_auto').onchange = e => this.auto = e.target.checked;
      $('y_rotR').onclick = () => { this.viewAz = (this.viewAz + 10) % 360; };
      $('y_rotL').onclick = () => { this.viewAz = (this.viewAz - 10 + 360) % 360; };
      $('y_rot0').onclick = () => { this.viewAz = 90; };
      // לחצני התקופות — קפיצה אל רגע התקופה האמיתי (שוויון/היפוך), בתאריך
      // ובשעון האזרחיים של המקום הנבחר, כך שהשמש עומדת בדיוק על קו השוויון או
      // ההיפוך. dayY נגזר מהרגע עצמו — לא במיפוי המחזורי של dayYFromDate,
      // שבקצה המחזור (תקופת ניסן, יום 0) היה עוטף את היום אל סוף הפס ומרכיב
      // את שעת התקופה על תאריך של שנה אחרת. instant() בונה את הרגע מהיום
      // ומהשעון האזרחיים — כשהיום האזרחי המקומי שונה מיום ה-UTC מוסטים יום
      // ושעה יחדיו, והרגע נשמר. data-d (רבעי שנת שמואל) — נפילה בלי המנוע.
      document.querySelectorAll('#view-year .seg button').forEach((b, i) => b.onclick = () => {
        const m = tekufaMoment(i);
        if (m) {
          const o = tzOffsetHours(this.tz, m), off = o === null ? Math.round(this.lon / 15) : o;
          let dayY = (m.getTime() - yearSpan().start) / 86400000;
          let hour = ((m.getTime() / 3600000) % 24 + 24) % 24 + off;
          if (hour >= 24) { hour -= 24; dayY += 1; }
          else if (hour < 0) { hour += 24; dayY -= 1; }
          this.dayY = dayY; this.hour = hour;
        } else this.dayY = +b.dataset.d;
        loadOtzariaTimes();   // כרטיס הלוח עוקב אחרי תאריך האיור
      });
      // זמני היום מלוח אוצריא — נטענים בכניסה ללשונית, ברענון, בהחלפת עיר
      // בכרטיס, ובקביעת תאריך באיור (במצב החדש הזמנים עוקבים אחרי תאריך האיור)
      // הרענון גם מיישר את העיר עם האפליקציה (כשלא נבחרה עיר אחרת בכרטיס):
      // רשת ביטחון למקרה ששני האירועים (city_changed / settings.changed) לא הגיעו
      $('yo_refresh').onclick = async () => {
        if (otz.followApp) {
          const name = await fetchAppCity();
          if (name && name !== otz.city) { applyAppCity(name); return; }
        }
        loadOtzariaTimes();
      };
      $('yo_city').onchange = e => { otz.city = e.target.value; otz.followApp = false; loadOtzariaTimes(); };
      loadOtzariaTimes();
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
  // זוית בכיוון צפון/דרום — הערך המוחלט ואחריו הצד
  function fmtNS(deg) {
    const a = Math.abs(deg).toFixed(1) + '°';
    return Math.abs(deg) < 0.05 ? a : a + ' ' + (deg > 0 ? T('צפון') : T('דרום'));
  }
  // היסט אזור זמן לתצוגה: UTC+3, UTC−4:30
  function fmtOff(h) {
    const s = h < 0 ? '−' : '+', a = Math.abs(h), m = Math.round((a % 1) * 60);
    return 'UTC' + s + Math.floor(a) + (m ? ':' + String(m).padStart(2, '0') : '');
  }

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
  // lon = קו האורך של הצופה; הטקסטורה מוסטת כך שנקודת הזנית (הסמן האדום) נופלת בדיוק על מיקומו במפה.
  function drawGlobe(ctx, cx, cy, r, sun, viewAz, lat, lon) {
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
    // היסט קו-אורך: בזנית lonP=-π/2, ורוצים שתידגם שם נקודת הצופה (lon מעלות מזרחה)
    const lonOff = Math.PI / 2 + lon * Math.PI / 180;

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
          let uu = (lonP + lonOff) / T2 + 0.5; uu -= Math.floor(uu);
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
    for (let lo = 0; lo < 360; lo += 30) {                           // קווי אורך (מיושרים למרידיאני המפה)
      const O = lo * Math.PI / 180 - lonOff; let prev = surf(-Math.PI/2, O);
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
    sky: null, lat: 31.78, lon: 35.24, tz: 'Asia/Jerusalem', cityName: 'ירושלים', _bound: false,
    step() {},
    // היסט אזור הזמן (שעות) לפירוש השעה שבשדות: אזור ה-IANA של המקום הנבחר
    // (כולל שעון קיץ); ב"מותאם אישית" — זמן שמש ממוצע המשוער מקו האורך,
    // כדרך שאר הלשוניות
    tzOffAt(date) {
      const o = tzOffsetHours(this.tz, date);
      return o === null ? Math.round(this.lon / 15) : o;
    },
    // השעה שבשדות היא השעון האזרחי של מקום הצפייה. ההמרה ההפוכה (מקומי→UTC)
    // צריכה את ההיסט של הרגע המבוקש עצמו, שאינו ידוע עדיין — לכן ההיסט מוערך
    // על הקריאה כ-UTC ומעודן פעם אחת; די בכך גם על גבולות שעון הקיץ.
    inputToUTC() {
      const Y = +$('p_year').value, M = +$('p_month').value, D = +$('p_day').value, h = +$('p_hour').value, mi = +$('p_min').value;
      const wall = Date.UTC(Y, M - 1, D, h, mi, 0);
      const off = this.tzOffAt(new Date(wall));
      const off2 = this.tzOffAt(new Date(wall - off * 3600000));
      return new Date(wall - off2 * 3600000);
    },
    compute() {
      this.lat = +$('p_lat').value; this.lon = +$('p_lon').value;
      const utc = this.inputToUTC();
      this.sky = A.computeSky(utc, this.lat, this.lon);
      this.legend(); this.note(utc);
    },
    // באיזה שעון פורשה השעה — מוצג מתחת לשדות התאריך
    note(utc) {
      const el = $('p_tzNote'); if (!el) return;
      const off = fmtOff(this.tzOffAt(utc || new Date()));
      el.textContent = this.tz
        ? T('השעה בשעון') + ' ' + T(this.cityName) + ' (' + off + ')'
        : T('השעה בזמן שמש ממוצע המשוער מקו האורך') + ' (' + off + ')';
    },
    draw() {
      const { ctx, W, H } = fit($('planetsCanvas'));
      ctx.clearRect(0, 0, W, H);
      const s = Math.min(W, H), cx = W / 2, cy = H / 2, R = s / 2 - 34;
      ctx.strokeStyle = cv('--ill-grid'); ctx.lineWidth = 1;
      for (const alt of [30, 60]) { const rr = (90 - alt) / 90 * R; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.strokeStyle = cv('--ill-horizon'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = cv('--ill-text'); ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(T('צפון'), cx, cy - R - 14); ctx.fillText(T('דרום'), cx, cy + R + 14);
      ctx.fillText(T('מזרח'), cx - R - 16, cy); ctx.fillText(T('מערב'), cx + R + 16, cy);
      ctx.fillStyle = cv('--ill-muted'); ctx.font = '11px sans-serif'; ctx.fillText(T('זניט'), cx + 16, cy - 12);
      if (!this.sky) return;
      for (const b of BODIES) {
        const o = this.sky[b.k]; if (o.alt <= 0) continue;
        const rr = (90 - o.alt) / 90 * R, x = cx - rr * Math.sin(o.az * Math.PI / 180), y = cy - rr * Math.cos(o.az * Math.PI / 180);
        const im = IMG.planets[b.k]; let w = b.k === 'sun' ? 28 : (b.k === 'saturn' ? 34 : 22), h = im.naturalWidth ? w * im.naturalHeight / im.naturalWidth : w;
        sprite(ctx, im, x, y, w, h);
        ctx.fillStyle = cv('--ill-text'); ctx.font = '12px sans-serif'; ctx.textBaseline = 'top'; ctx.fillText(T(b.n), x, y + h / 2 + 2);
        ctx.textBaseline = 'middle';
      }
    },
    legend() {
      const L = $('p_legend'); L.innerHTML = '';
      for (const b of BODIES) {
        const o = this.sky[b.k], up = o.alt > 0;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:3px 4px;font-size:0.72em;' + (up ? '' : 'opacity:.45');
        row.innerHTML = `<img src="${AS['planet_' + b.k]}" style="width:20px;height:20px;object-fit:contain" alt=""><span style="flex:1">${T(b.n)}</span>` +
          `<span style="direction:ltr;opacity:.75">${up ? ('h ' + o.alt.toFixed(0) + '° · az ' + o.az.toFixed(0) + '°') : T('מתחת לאופק')}</span>`;
        L.appendChild(row);
      }
    },
    // מילוי השדות בשעה הנוכחית — בשעון המקום הנבחר, לא בשעון המכשיר
    setNow() {
      const now = new Date();
      const d = new Date(now.getTime() + this.tzOffAt(now) * 3600000);   // השעון המקומי כקריאת-UTC
      $('p_day').value = d.getUTCDate(); $('p_month').value = d.getUTCMonth() + 1; $('p_year').value = d.getUTCFullYear();
      $('p_hour').value = d.getUTCHours(); $('p_min').value = d.getUTCMinutes();
    },
    bind() {
      if (this._bound) return; this._bound = true;
      $('p_lat').value = 31.78; $('p_lon').value = 35.24; this.setNow();
      $('p_go').onclick = () => this.compute();
      $('p_now').onclick = () => { this.setNow(); this.compute(); };
      // בחירת עיר קובעת רוחב+אורך+אזור זמן; עריכה ידנית של הקואורדינטות
      // מעבירה ל"מותאם אישית" (ואז השעה מפורשת בזמן שמש ממוצע מקו האורך)
      $('p_city').onchange = e => {
        const opt = e.target.selectedOptions[0], v = e.target.value;
        if (!v) { this.tz = null; this.cityName = 'מותאם אישית'; this.compute(); return; }
        const [la, lo] = v.split(',').map(Number);
        $('p_lat').value = la; $('p_lon').value = lo;
        this.tz = opt.dataset.tz || null; this.cityName = opt.textContent.trim();
        this.compute();
      };
      const pCustom = () => { $('p_city').value = ''; this.tz = null; this.cityName = 'מותאם אישית'; };
      $('p_lat').oninput = pCustom;
      $('p_lon').oninput = pCustom;
      this.compute();
    },
  };

  // החלפת שפה: מקרא כוכבי הלכת וכרטיס זמני הלוח נבנים באירוע — מרעננים
  planets.onLanguage = function () { if (this.sky) { this.legend(); this.note(); } };
  year.onLanguage = function () { if (this._bound) loadOtzariaTimes(); };

  return { moon, year, planets, clearColorCache, clearFitCache, stageLayout };
})();
