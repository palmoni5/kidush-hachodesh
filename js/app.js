// נקודת הכניסה: ניווט בין האיורים, מחזור חיים, אודות, ולולאת האנימציה.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const SIMS = window.Sims;
  let active = 'moon';

  // ── רינדור לפי דרישה ──────────────────────────────────────────────
  // הלולאה רצה ברצף רק כשהאיור הפעיל מתנגן (playing). במצב סטטי מציירים
  // פריים אחד ועוצרים; ציור מחדש מתבצע רק על אינטראקציה / שינוי נושא /
  // החלפת לשונית / שינוי גודל. כך צריכת ה-CPU בסרק יורדת כמעט לאפס.
  let rafId = null, last = 0, dirty = true;

  function frame(now) {
    rafId = null;
    if (!last) last = now;
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const sim = SIMS[active];
    if (!sim) return;
    if (sim.playing) { sim.step(dt); dirty = true; }
    if (dirty) { sim.draw(); if (sim.sync) sim.sync(); dirty = false; }
    if (sim.playing) schedule();   // ממשיכים להנפיש רק בזמן ניגון
    else last = 0;
  }
  function schedule() { if (rafId === null) rafId = requestAnimationFrame(frame); }
  function invalidate() { dirty = true; schedule(); }   // בקשת ציור מחדש
  window.__invalidate = invalidate;

  function setView(name) {
    active = name;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    SIMS[name].bind();
    saveLastView(name);
    revealTab(document.querySelector('#tabs button.active'));
    invalidate();
  }

  // ── גלילת פס הלשוניות ──────────────────────────────────────────────
  // הלשונית הפעילה עלולה לשבת מחוץ לפס הנגלל. scrollIntoView עם inline:'nearest'
  // אינו פועל כאן בפריסת RTL, ולכן החישוב נעשה ידנית — והוא גם נייטרלי לכיוון:
  // הגדלת scrollLeft מזיזה את התוכן שמאלה בשני הכיוונים.
  function revealTab(btn) {
    if (!btn || !btn.parentElement) return;
    const bar = btn.parentElement;
    if (bar.scrollWidth <= bar.clientWidth) return;
    const b = btn.getBoundingClientRect(), r = bar.getBoundingClientRect(), pad = 8;
    let d = 0;
    if (b.left < r.left + pad) d = b.left - (r.left + pad);
    else if (b.right > r.right - pad) d = b.right - (r.right - pad);
    // גלילה מיידית ולא behavior:'smooth': ההנפשה אינה פועלת בחלק מן ה-webview
    // (נבדק — גם ללא prefers-reduced-motion), והקריאה יוצאת ללא כל תזוזה.
    if (d) bar.scrollLeft += d;
  }

  // במגע הגלילה טבעית (overflow-x). בעכבר חסרות שתי דרכים: גלגלת אנכית
  // שתזיז אופקית, וגרירה. הגרירה מסומנת רק אחרי סף תזוזה, כדי שלחיצה
  // רגילה על לשונית תמשיך לעבוד; מעבר לסף מבוטלת לחיצת הסיום.
  function enableTabScroll(bar) {
    bar.addEventListener('wheel', e => {
      if (bar.scrollWidth <= bar.clientWidth) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // מחווה אופקית: מיפוי תקני — deltaX חיובי מגדיל את scrollLeft, בשני
        // הכיוונים. הערה: ה-webview של אוצריא מוסר את סימן deltaX הפוך על
        // מסמך RTL (תנועת אצבעות ימינה גוררת את הפס שמאלה), בעוד שבמארחים
        // אחרים ("כלי קודש", דפדפן) הסימן תקני. הוחלט שלא לעקוף זאת כאן —
        // התיקון ייעשה בצד אוצריא, שהבאג שלה פוגע בכל התוספים.
        bar.scrollLeft += e.deltaX;
      } else {
        // ב-RTL הקצה ההתחלתי הוא scrollLeft = 0 והתוכן נמשך שמאלה בערכים
        // שליליים; לכן גלגול מטה, שאמור להתקדם בלשוניות, הוא הפחתה.
        const rtl = getComputedStyle(bar).direction === 'rtl';
        bar.scrollLeft += rtl ? -e.deltaY : e.deltaY;
      }
      e.preventDefault();
    }, { passive: false });

    let startX = 0, startScroll = 0, id = null, moved = false;
    const THRESHOLD = 4;                                       // פיקסלים עד שגרירה נחשבת גרירה

    bar.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return; // במגע — הגלילה המובנית עדיפה
      if (bar.scrollWidth <= bar.clientWidth) return;
      id = e.pointerId; startX = e.clientX; startScroll = bar.scrollLeft; moved = false;
    });
    bar.addEventListener('pointermove', e => {
      if (id === null || e.pointerId !== id) return;
      const dx = e.clientX - startX;
      if (!moved) {
        if (Math.abs(dx) < THRESHOLD) return;
        moved = true;
        bar.classList.add('dragging');
        bar.setPointerCapture(id);
      }
      bar.scrollLeft = startScroll - dx;
    });
    const end = () => {
      if (id === null) return;
      if (bar.hasPointerCapture && bar.hasPointerCapture(id)) bar.releasePointerCapture(id);
      id = null;
      // הסרת הסימון נדחית לסוף התור, אחרי שאירוע ה-click של הגרירה כבר בוטל
      if (moved) setTimeout(() => bar.classList.remove('dragging'), 0);
      else bar.classList.remove('dragging');
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
    bar.addEventListener('dragstart', e => e.preventDefault());
  }

  async function saveLastView(name) {
    try { await Otzaria.call('storage.set', { key: 'lastView', value: name }); } catch (e) {}
  }
  async function loadLastView() {
    try { const r = await Otzaria.call('storage.get', { key: 'lastView' }); if (r && r.success && r.data) return r.data; } catch (e) {}
    return 'moon';
  }

  // ── רקע איור בהיר/כהה ──
  function applyBg(light) {
    document.body.classList.toggle('ill-light', light);
    $('bgBtn').textContent = light ? '🌙 רקע כהה' : '☀ רקע בהיר';
    if (window.Sims.clearColorCache) window.Sims.clearColorCache();
    invalidate();
  }
  async function toggleBg() {
    const light = !document.body.classList.contains('ill-light');
    applyBg(light);
    try { await Otzaria.call('storage.set', { key: 'illLight', value: light }); } catch (e) {}
  }
  async function loadBg() {
    try { const r = await Otzaria.call('storage.get', { key: 'illLight' }); if (r && r.success) return !!r.data; } catch (e) {}
    return false;
  }

  // ── חיווט ראשוני (לא תלוי boot) ──
  $('brandIcon').src = window.ASSETS.moon_icon;
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setView(b.dataset.view));
  enableTabScroll($('tabs'));
  $('bgBtn').onclick = toggleBg;

  // ── חצי הגדלה/הקטנה מותאמים לכל שדות המספר ──
  // (ה-spinner המובנה זעיר ונחתך ב-RTL; כאן עוטפים כל שדה בחצים ברורים)
  function enhanceNumberInputs() {
    document.querySelectorAll('input[type=number]').forEach(inp => {
      if (inp.parentElement && inp.parentElement.classList.contains('numfield')) return;
      const wrap = document.createElement('span');
      wrap.className = 'numfield';
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);
      const steps = document.createElement('span');
      steps.className = 'numstep';
      const mk = (cls, glyph, label) => {
        const b = document.createElement('button');
        b.type = 'button'; b.tabIndex = -1; b.className = cls; b.textContent = glyph;
        b.setAttribute('aria-label', label);
        return b;
      };
      const up = mk('num-up', '▲', 'הגדל'), down = mk('num-down', '▼', 'הקטן');
      const bump = dir => {
        // הפוקוס מועבר לשדה עצמו: sync() של האיורים דורס שדות שאינם בפוקוס
        // (document.activeElement), ובלי זה הערך היה קופץ מיד חזרה לערך הקודם.
        inp.focus();
        if (inp.value === '') inp.value = inp.min || 0;
        // גלגול מחזורי בקצוות: מ-59 דקות חוזרים ל-0 ולהפך, במקום להיתקע בתקרה
        const min = inp.min !== '' ? +inp.min : null, max = inp.max !== '' ? +inp.max : null;
        const cur = +inp.value;
        if (dir > 0 && max !== null && cur >= max) inp.value = min !== null ? min : max;
        else if (dir < 0 && min !== null && cur <= min) inp.value = max !== null ? max : min;
        else if (dir > 0) inp.stepUp(); else inp.stepDown();
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      };
      up.onclick = () => bump(1); down.onclick = () => bump(-1);
      steps.appendChild(up); steps.appendChild(down);
      wrap.appendChild(steps);
    });
  }
  enhanceNumberInputs();

  // ── הסברים נגללים: "ראה עוד" פותח את ההסבר המלא, ולחיצה נוספת מסתירה ──
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('.expl-toggle');
    if (!t) return;
    const open = t.closest('.expl').classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // ── שמירת ערכים שהוזנו בשדות תאריך/שעה ──────────────────────────────
  // sync() של האיורים כותב לשדות שאינם בפוקוס, ולכן מילוי של כמה שדות ברצף
  // (יום ואז חודש) איפס את הראשון ברגע שהפוקוס עבר הלאה. שדה שהמשתמש שינה
  // מסומן "מלוכלך" ואינו נדרס — עד לחיצה על כפתור כלשהו (הצג/עכשיו/היום),
  // שמאשרת או מחליפה את הערכים. חיצי ההגדלה (.numstep) אינם מנקים, כדי שעריכת
  // שדה אחד בחיצים לא תאפס שדה אחר שהוקלד לפניו.
  document.addEventListener('input', e => {
    if (e.target.matches && e.target.matches('input[type=number]')) e.target.dataset.dirty = '1';
  }, true);
  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('button');
    // כפתורי "ראה עוד" רק פותחים הסבר — אינם מאשרים ערכים שהוקלדו
    if (btn && !btn.closest('.numstep') && !btn.classList.contains('expl-toggle'))
      document.querySelectorAll('input[type=number][data-dirty]').forEach(i => delete i.dataset.dirty);
  }, true);
  // עוזר לפונקציות ה-sync: אין לדרוס שדה בפוקוס או שדה שהוזן ולא אושר
  window.__fieldLocked = el => document.activeElement === el || (el.dataset && el.dataset.dirty === '1');

  // ערכת נושא משתנה בזמן אמת → ניקוי מטמון הצבעים וציור מחדש של הנוף הפעיל
  window.__onThemeApplied = () => { if (window.Sims.clearColorCache) window.Sims.clearColorCache(); invalidate(); };

  // אינטראקציה עם פקדים (כפתורים, מחוונים, שדות) → ציור מחדש בודד.
  // האזנה ממומשת בבועה, אחרי המטפלים של האיור עצמו, כך שהמצב כבר עודכן.
  for (const ev of ['click', 'input', 'change'])
    document.addEventListener(ev, invalidate, { passive: true });

  // שינוי גודל הקנבס → ניקוי מטמון המידות וציור מחדש (במקום fit() בכל פריים)
  const onResize = () => { if (window.Sims.clearFitCache) window.Sims.clearFitCache(); invalidate(); };
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(onResize);
    document.querySelectorAll('.view canvas').forEach(c => { if (c.parentElement) ro.observe(c.parentElement); });
  } else {
    window.addEventListener('resize', onResize, { passive: true });
  }

  // ── שפת הממשק ──────────────────────────────────────────────────────
  // עברית ברירת המחדל; שפה אחרת מוחלת רק אם יש לה מילון (ראו js/i18n.js).
  // החלפת שפה משנה כיוון ופריסה — ולכן מנקים את מטמוני המידות ומציירים מחדש.
  function applyLocale(app) {
    try {
      window.I18N.setLanguage(app && (app.language || app.locale), app && app.textDirection);
      // תוכן שנבנה באירוע (טבלאות, תוויות תלת-מימד) מתרענן דרך hook ייעודי
      for (const k of ['moon', 'luach', 'year', 'planets', 'zodiac', 'hours', 'dateline', 'eclipse', 'system3d'])
        if (SIMS[k] && SIMS[k].onLanguage) { try { SIMS[k].onLanguage(); } catch (e) {} }
      if (window.Sims.clearFitCache) window.Sims.clearFitCache();
      invalidate();
    } catch (e) {}
  }
  // עדכון חי כשמחליפים שפה בהגדרות אוצריא (הרשאת events.subscribe:settings.changed)
  Otzaria.on('settings.changed', async p => {
    if (!p || p.key !== 'key-settings-language') return;
    try {
      const r = await Otzaria.call('app.getLocale', {});
      if (r && r.success && r.data) applyLocale(r.data);
    } catch (e) {}
  });

  Otzaria.on('theme.changed', applyTheme);
  Otzaria.on('plugin.boot', async (payload) => {
    applyTheme(payload.theme);
    applyLocale(payload.app);
    applyBg(await loadBg());
    const start = await loadLastView();
    // ממתינים לטעינת הגופנים לפני הרינדור הראשון: מדידות הפריסה (גובה ה-HUD וסרגל
    // הלשוניות) חייבות להיעשות לפי המטריקות הסופיות, אחרת reflow מאוחר עם טעינת
    // הגופן מקפיץ את האיור פעם אחת עם תחילת ההפעלה.
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    setView(['moon', 'luach', 'year', 'planets', 'zodiac', 'hours', 'dateline', 'eclipse', 'system3d'].includes(start) ? start : 'moon');
  });
  // ביטחון נוסף: אם גופן נטען מאוחר יותר, מנקים את מטמון המידות ומציירים מחדש פעם אחת
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (window.Sims.clearFitCache) window.Sims.clearFitCache(); invalidate(); });
  }
})();
