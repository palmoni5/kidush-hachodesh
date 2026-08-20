// report.js — דיווח מן התוסף אל מפתח התוסף דרך אתר אוצריא (feedback.report).
//
// הזרימה: החלון כאן אוסף את פרטי הדיווח, ואוצריא מציגה אחריו דיאלוג אישור
// משלה (שם התוסף, יעד הדיווח ותצוגה מקדימה של הטקסט) — אין דרך לעקוף אותו,
// והאישור הזה הוא גבול האבטחה. לכן feedback.report אינה דורשת הרשאה במניפסט.
// הכתובת המוחזרת אינה חובה: אם לא נמסרה, אוצריא נוטלת את כתובת השולח השמורה
// בהגדרות דיווח השגיאות. אין תור המתנה offline — כשל חוזר אל התוסף, וכאן הוא
// מוצג למשתמש כדי שינסה שוב בלי שהטקסט שכתב יאבד.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const MAX = 4800;                    // אוצריא חותכת ל-5000; נשמר מרווח לשורת ההקשר
  const EMAIL_KEY = 'reportEmail';     // הכתובת נשמרת כדי שלא תוקלד בכל דיווח

  const ovl = $('reportOvl');
  if (!ovl) return;
  const elType = $('rp_type'), elDetails = $('rp_details'), elEmail = $('rp_email'),
        elCtx = $('rp_ctx'), elCount = $('rp_count'), elSend = $('rp_send'),
        elEmailField = $('rp_emailField'), elSavedMail = $('rp_savedMail');

  const T = s => (window.I18N ? window.I18N.t(s) : s);

  // ── שורת ההקשר ──────────────────────────────────────────────────────
  // שם הלשונית הפעילה וגרסת התוסף הם המידע שחוסך את רוב שאלות ההמשך.
  // נשלח רק בהסכמה מפורשת (תיבת הסימון), ומצורף בעברית — שפת המפתח.
  function contextLine() {
    const tab = document.querySelector('#tabs button.active');
    const view = tab ? (tab.textContent || '').trim() : '';
    const ver = (window.__pluginVersion || '');
    const parts = [];
    if (view) parts.push('איור: ' + view);
    if (ver) parts.push('גרסת התוסף: ' + ver);
    return parts.length ? '\n\n---\n' + parts.join(' | ') : '';
  }

  function updateCount() { elCount.textContent = String(elDetails.value.length); }

  // ── פתיחה וסגירה ────────────────────────────────────────────────────
  // כתובת שמורה בהגדרות דיווח השגיאות של אוצריא גוברת תמיד על reporterEmail
  // שהתוסף שולח (מאז 0.9.97), ולכן כשהיא קיימת אין טעם לבקש כתובת מן המשתמש —
  // השדה מוסתר ובמקומו מוצגת הודעה. feedback.hasReporterEmail מחזירה ביט קיום
  // בלבד; הכתובת עצמה לעולם אינה נחשפת לתוסף.
  let lastFocus = null;
  async function open() {
    lastFocus = document.activeElement;
    ovl.hidden = false;
    updateCount();

    let hasSaved = false;
    try {
      const r = await Otzaria.call('feedback.hasReporterEmail');
      hasSaved = !!(r && r.success && r.data);
    } catch (err) {}
    elEmailField.hidden = hasSaved;
    elSavedMail.hidden = !hasSaved;
    if (!hasSaved && !elEmail.value) {
      try {
        const r = await Otzaria.call('storage.get', { key: EMAIL_KEY });
        if (r && r.success && typeof r.data === 'string') elEmail.value = r.data;
      } catch (err) {}
    }
    elDetails.focus();
  }
  function close() {
    ovl.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ── שליחה ───────────────────────────────────────────────────────────
  async function send() {
    const details = elDetails.value.trim();
    if (!details) {
      try { await Otzaria.call('ui.showError', { message: T('יש לפרט את הדיווח לפני השליחה.') }); } catch (e) {}
      elDetails.focus();
      return;
    }
    // כשקיימת כתובת שמורה השדה מוסתר — ואין טעם לשלוח כתובת שתידחה ממילא
    const email = elEmailField.hidden ? '' : elEmail.value.trim();
    const payload = { details: details + (elCtx.checked ? contextLine() : ''), reportType: elType.value };
    if (email) payload.reporterEmail = email;

    elSend.disabled = true;
    const label = elSend.textContent;
    elSend.textContent = T('שולח…');
    try {
      const r = await Otzaria.call('feedback.report', payload);
      if (!r || !r.success) throw new Error((r && r.error && r.error.message) || 'report failed');
      if (r.data === false) return;    // המשתמש ביטל בדיאלוג האישור — החלון נשאר פתוח
      if (email) { try { await Otzaria.call('storage.set', { key: EMAIL_KEY, value: email }); } catch (e) {} }
      try { await Otzaria.call('ui.showSuccess', { message: T('הדיווח נשלח. תודה!') }); } catch (e) {}
      elDetails.value = '';
      updateCount();
      close();
    } catch (e) {
      // אין ניסיון חוזר אוטומטי ואין תור offline: הטקסט נשמר בחלון, והמשתמש בוחר מתי לנסות שוב.
      try { await Otzaria.call('ui.showError', { message: T('שליחת הדיווח נכשלה. בדוק את החיבור לאינטרנט ונסה שוב.') }); } catch (e2) {}
    } finally {
      elSend.disabled = false;
      elSend.textContent = label;
    }
  }

  // ── חיווט ───────────────────────────────────────────────────────────
  $('reportLink').onclick = open;
  $('rp_cancel').onclick = close;
  elSend.onclick = send;
  elDetails.addEventListener('input', updateCount);
  elDetails.setAttribute('maxlength', String(MAX));
  // לחיצה על הרקע סוגרת; לחיצה בתוך הכרטיס אינה מבעבעת אל כאן דרך stopPropagation
  ovl.addEventListener('click', e => { if (e.target === ovl) close(); });
  document.addEventListener('keydown', e => {
    if (ovl.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    // Ctrl+Enter מתוך שדה הפירוט — קיצור השליחה המקובל בטפסי טקסט ארוך
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
  });

  // גרסת התוסף נמסרת ב-plugin.boot ומשמשת את שורת ההקשר
  Otzaria.on('plugin.boot', p => {
    if (p && p.plugin && p.plugin.version) window.__pluginVersion = p.plugin.version;
  });
})();
