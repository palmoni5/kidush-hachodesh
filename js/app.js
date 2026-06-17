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
    invalidate();
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
  $('bgBtn').onclick = toggleBg;

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

  Otzaria.on('theme.changed', applyTheme);
  Otzaria.on('plugin.boot', async (payload) => {
    applyTheme(payload.theme);
    applyBg(await loadBg());
    const start = await loadLastView();
    setView(['moon', 'year', 'planets'].includes(start) ? start : 'moon');
  });
})();
