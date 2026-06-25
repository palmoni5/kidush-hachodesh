// ניהול ערכת נושא — אימוץ הצבעים והטיפוגרפיה מאוצריא (plugin.boot + theme.changed)
"use strict";

function applyTheme(theme) {
  if (!theme || !theme.colorScheme) return;
  const cs = theme.colorScheme, r = document.documentElement;
  const set = (k, v) => { if (v) r.style.setProperty(k, v); };
  set('--color-primary', cs.primary);
  set('--color-on-primary', cs.onPrimary);
  set('--color-secondary', cs.secondary);
  set('--color-on-secondary', cs.onSecondary);
  set('--color-secondary-container', cs.secondaryContainer);
  set('--color-on-secondary-container', cs.onSecondaryContainer);
  set('--color-surface', cs.surface);
  set('--color-on-surface', cs.onSurface);
  set('--color-surface-container-high', cs.surfaceContainerHigh);
  set('--color-surface-container-highest', cs.surfaceContainerHighest);
  set('--color-error', cs.error);
  set('--color-on-error', cs.onError);
  set('--color-outline', cs.outline);
  if (cs.primary)   set('--color-primary-subtle', hexToRgba(cs.primary, 0.12));
  if (cs.secondary) set('--color-secondary-subtle', hexToRgba(cs.secondary, 0.12));
  document.body.classList.toggle('dark-mode', theme.mode === 'dark');
  if (theme.typography) {
    const t = theme.typography;
    // לא דורסים את --font-main ו---font-size-base: typography הוא גופן/גודל
    // הקריאה (סריף, ~25px). ה-UI של התוסף נשאר sans-serif קומפקטי כמו סרגל הכלים.
    if (t.lineHeight) set('--line-height', String(t.lineHeight));
  }
  if (window.__onThemeApplied) window.__onThemeApplied();
}

function hexToRgba(hex, a) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// קריאת ערך משתנה CSS (לציור על קנבס) — מ-body, כדי לתפוס גם את דריסת
// פלטת האיור הבהירה המוגדרת על body.ill-light (ראו ההערה ב-sims.js)
function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

// ── Stub לפיתוח עצמאי בדפדפן (מופעל רק אם אוצריא אינה נוכחת) ──
if (typeof window.Otzaria === 'undefined') {
  const listeners = {};
  window.Otzaria = {
    call: async (m, p) => ({ success: true, data: null, error: null }),
    on:  (e, cb) => { (listeners[e] = listeners[e] || []).push(cb); },
    off: (e, cb) => { listeners[e] = (listeners[e] || []).filter(f => f !== cb); },
  };
  setTimeout(() => {
    (listeners['plugin.boot'] || []).forEach(cb => cb({
      plugin: { id: 'com.otzaria.kidush-hachodesh', version: '1.0.0' },
      app: { version: '5.0.0', platform: 'dev', locale: 'he-IL', textDirection: 'rtl', runMode: 'foreground' },
      theme: {
        mode: 'dark',
        colorScheme: {
          primary: '#9bb8ff', onPrimary: '#06234d', secondary: '#c7bfff', onSecondary: '#241a4d',
          secondaryContainer: '#3a3170', onSecondaryContainer: '#e7deff',
          surface: '#11131c', onSurface: '#e6e8f0',
          surfaceContainerHigh: '#1a1d2a', surfaceContainerHighest: '#22263a',
          error: '#ffb4ab', onError: '#690005', outline: '#3b4156',
        },
        typography: { fontFamily: 'FrankRuhlCLM', fontSize: 18, lineHeight: 1.5 },
      },
      permissions: ['app.info.read', 'ui.feedback', 'plugin.storage.read', 'plugin.storage.write', 'ui.create_shortcut'],
    }));
  }, 60);
}
