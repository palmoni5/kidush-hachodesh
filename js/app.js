// נקודת הכניסה: ניווט בין האיורים, מחזור חיים, אודות, ולולאת האנימציה.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const SIMS = window.Sims;
  let active = 'moon', pluginId = 'com.otzaria.kidush-hachodesh', version = '1.0.0', platform = 'dev';
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

  // ── אודות + קיצור דרך ──
  function isDesktop() { return ['windows', 'macos', 'linux'].includes(platform); }
  function openAbout() { $('scrim').classList.add('open'); $('about').classList.add('open'); }
  function closeAbout() { $('scrim').classList.remove('open'); $('about').classList.remove('open'); }
  async function makeShortcut(location) {
    try {
      const res = await Otzaria.call('shortcut.create', { label: 'קידוש החודש', location });
      if (res && res.success && res.data && res.data.created)
        await Otzaria.call('ui.showSuccess', { message: 'קיצור הדרך נוצר בהצלחה!' });
      else if (!res || !res.success)
        await Otzaria.call('ui.showError', { message: 'לא ניתן ליצור קיצור דרך' });
    } catch (e) {}
  }
  function renderAbout() {
    const box = $('aboutActions'); box.innerHTML = '';
    if (!isDesktop()) return;
    const b1 = document.createElement('button'); b1.className = 'btn-secondary'; b1.textContent = 'צור קיצור דרך בשולחן העבודה';
    b1.onclick = () => makeShortcut('desktop'); box.appendChild(b1);
    if (platform === 'windows') {
      const b2 = document.createElement('button'); b2.className = 'btn-secondary'; b2.textContent = 'הוסף לתפריט ההתחל';
      b2.onclick = () => makeShortcut('startMenu'); box.appendChild(b2);
    }
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
  $('aboutBtn').onclick = openAbout;
  $('aboutClose').onclick = closeAbout;
  $('scrim').onclick = closeAbout;
  $('bgBtn').onclick = toggleBg;

  // ערכת נושא משתנה בזמן אמת → ציור מחדש של הנוף הפעיל
  window.__onThemeApplied = () => { const s = SIMS[active]; if (s) s.draw(); };

  Otzaria.on('theme.changed', applyTheme);
  Otzaria.on('plugin.boot', async (payload) => {
    if (payload.plugin) { pluginId = payload.plugin.id || pluginId; version = payload.plugin.version || version; }
    if (payload.app) platform = payload.app.platform || platform;
    applyTheme(payload.theme);
    renderAbout();
    applyBg(await loadBg());
    const start = await loadLastView();
    setView(['moon', 'year', 'planets'].includes(start) ? start : 'moon');
    requestAnimationFrame(loop);
  });
})();
