// נקודת הכניסה: ניווט בין האיורים, מחזור חיים, אודות, ולולאת האנימציה.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const SIMS = window.Sims;
  let active = 'moon';
  let last = performance.now();

  function setView(name) {
    active = name;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    SIMS[name].bind();
    saveLastView(name);
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const sim = SIMS[active];
    if (sim) { sim.step(dt); sim.draw(); if (sim.sync) sim.sync(); }
    requestAnimationFrame(loop);
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
    const s = window.Sims[active]; if (s) s.draw();
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

  // ערכת נושא משתנה בזמן אמת → ציור מחדש של הנוף הפעיל
  window.__onThemeApplied = () => { const s = SIMS[active]; if (s) s.draw(); };

  Otzaria.on('theme.changed', applyTheme);
  Otzaria.on('plugin.boot', async (payload) => {
    applyTheme(payload.theme);
    applyBg(await loadBg());
    const start = await loadLastView();
    setView(['moon', 'year', 'planets'].includes(start) ? start : 'moon');
    requestAnimationFrame(loop);
  });
})();
