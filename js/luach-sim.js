// luach-sim.js — לשונית הלוח העברי: מולד, דחיות, וקביעת השנה כולה.
// החשבון עצמו יושב ב-js/hebrew-calendar.js; כאן רק התצוגה.
//
// שני מצבים:
//   שנה אמיתית — כל הנתונים נגזרים ממחזור י״ט השנים ומהמולד שלה.
//   שנת מעבדה  — המשתמש קובע בעצמו את מולד תשרי ואת סטטוס העיבור, כדי לראות
//                כיצד כל דחיה פועלת. צירופים שאינם קיימים בלוח האמיתי (שתי
//                שנים מעוברות רצופות; אורך שנה שאינו חוקי) מסומנים במפורש,
//                כדי שלא ייקראו כתוצאה אמיתית.
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const H = window.HebCal;

  const DECHIYA_NAME = {
    zaken: 'מולד זקן',
    adu: 'לא אד״ו ראש',
    'zaken+adu': 'מולד זקן ולא אד״ו ראש',
    gatarad: 'ג״ט ר״ד',
    'betutakpat+adu': 'ב־ט״ו־תקפ״ט',
    betutakpat: 'ב־ט״ו־תקפ״ט',
  };
  const DECHIYA_ROW = {                       // הדגשת הכלל המתאים בכרטיס ההסבר
    zaken: 'l_r1', adu: 'l_r2', 'zaken+adu': 'l_r1',
    gatarad: 'l_r3', betutakpat: 'l_r4', 'betutakpat+adu': 'l_r4',
  };

  // שעות הלוח נמנות מתחילת הלילה (שש בערב); כאן גם שעון היממה המקביל,
  // שהוא ההבדל שמטעה כמעט תמיד — "מולד זקן" בשעה 18 הוא חצות היום.
  function clockOf(h, p) {
    const total = (18 + h) * 60 + p / 18;
    const hh = Math.floor(total / 60) % 24, mm = Math.floor(total % 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }
  // שמות הימים המלאים נפרדים מן הקצרים כדי שהתרגום יהיה "Sunday" ולא "Day Sun"
  const DOW_FULL = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
  const moladShort = m => `${T(H.DOW[m.dow])} ${m.h}·${m.p}`;
  const moladFull = m =>
    `${T(DOW_FULL[m.dow])}, ${m.h} ${T('שעות')} ${m.p} ${T('חלקים')} (${clockOf(m.h, m.p)})`;

  const gregShort = abs => {
    const d = H.absToDate(abs);
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1);
  };
  const gregFull = abs => {
    const d = H.absToDate(abs);
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
  };
  const rcText = rc => rc.days.map(a => T(H.DOW[(a + 1) % 7])).join('–');
  const fullWord = m => m.full ? 'חודש מלא' : 'חודש חסר';

  // ── בניית הטבלה בשתי אוריינטציות ────────────────────────────────────
  // 13 עמודות אינן נכנסות במסך טלפון, ולכן נבנות שתי טבלאות מאותם נתונים
  // וה-CSS בוחר ביניהן. הכפילות זניחה (13 חודשים) ומייתרת חישובי פריסה.
  function renderTable(t) {
    const ms = t.months;
    const th = s => `<th>${T(s)}</th>`;
    const cell = (v, title) => `<td${title ? ` title="${title}"` : ''}>${v}</td>`;

    const cols =
      '<table class="luach-cols"><thead><tr><th class="corner"></th>' +
      ms.map(m => `<th>${T(m.name)}</th>`).join('') + '</tr></thead><tbody>' +
      `<tr>${th('זמן המולד')}${ms.map(m => cell(moladShort(m.molad), moladFull(m.molad))).join('')}</tr>` +
      `<tr>${th('מלא / חסר')}${ms.map(m => cell(m.len, T(fullWord(m)))).join('')}</tr>` +
      `<tr>${th('ר״ח ביום בשבוע')}${ms.map(m => cell(rcText(m.rc))).join('')}</tr>` +
      `<tr>${th('א׳ בחודש — לועזי')}${ms.map(m => cell(gregShort(m.startAbs), gregFull(m.startAbs))).join('')}</tr>` +
      '</tbody></table>';

    const rows =
      '<table class="luach-rows"><thead><tr>' +
      ['חודש', 'זמן המולד', 'ימים', 'ר״ח', 'לועזי'].map(th).join('') +
      '</tr></thead><tbody>' +
      ms.map(m => '<tr>' +
        `<td class="mname">${T(m.name)}</td>` +
        cell(moladShort(m.molad), moladFull(m.molad)) +
        cell(`${m.len} <i>${T(fullWord(m))}</i>`) +
        cell(rcText(m.rc)) +
        cell(gregFull(m.startAbs)) + '</tr>').join('') +
      '</tbody></table>';

    $('l_table').innerHTML = cols + rows;
  }

  function dechiyaPhrase(info) {
    return info.dechiya
      ? T('דחיית') + ' ' + T(DECHIYA_NAME[info.dechiya] || info.dechiya)
      : T('יום המולד');
  }

  function renderSummary(t) {
    // בעברית שם השנה בגימטריה הוא העיקר והמספר בסוגריים; בשפה אחרת להפך,
    // אבל הגימטריה נשמרת — היא שם השנה ולא קישוט.
    const he = !(window.I18N && window.I18N.active);
    const yearName = t.year
      ? (he ? `${T('שנת')} ${H.hebYearName(t.year)} (${t.year})`
            : `${T('שנת')} ${t.year} (${H.hebYearName(t.year)})`)
      : T('שנת מעבדה');
    $('l_title').textContent = yearName;
    $('l_kind').textContent =
      `${T(t.leap ? 'מעוברת' : 'פשוטה')} · ${T(t.kind || '—')} · ${t.len} ${T('ימים')}`;
    $('l_siman').textContent = t.siman;
    // המחזורים נמנים משנת הבריאה, ולכן אין להם משמעות בשנת מעבדה
    $('l_cycles').textContent = t.cycle19
      ? `${T('מחזור קטן')} — ${T('שנה')} ${t.cycle19.year} ${T('מתוך')} 19 (${T('מחזור')} ${t.cycle19.num}) · ` +
        `${T('מחזור גדול')} — ${T('שנה')} ${t.cycle28.year} ${T('מתוך')} 28 (${T('מחזור')} ${t.cycle28.num})`
      : '';
    $('l_rh').innerHTML =
      `${T('ראש השנה ביום')} <b>${T(H.DOW[t.rh.dow])}</b> (${dechiyaPhrase(t.rh)})` +
      (t.year ? ` — ${gregFull(t.rh.abs)}` : '');
    $('l_rhNext').innerHTML =
      `${T('ראש השנה בשנה הבאה ביום')} <b>${T(H.DOW[t.rhNext.dow])}</b> (${dechiyaPhrase(t.rhNext)})` +
      (t.year ? ` — ${gregFull(t.rhNext.abs)}` : '');
    $('l_moladT').textContent = moladFull(t.rh.molad);
    // מולד תשרי הבא — הבסיס לקביעת השנה: ההפרש בין שני ימי ראש השנה
    // (אחרי הדחיות) הוא שקובע אם השנה חסרה, כסדרה או שלמה.
    $('l_moladTNext').textContent = moladFull(t.nextMolad);

    // הדגשת הדחיה שפעלה בפועל
    for (const id of ['l_r1', 'l_r2', 'l_r3', 'l_r4'])
      if ($(id)) $(id).classList.remove('hit');
    const row = DECHIYA_ROW[t.rh.dechiya];
    if (row && $(row)) $(row).classList.add('hit');
    if (t.rh.dechiya === 'zaken+adu' && $('l_r2')) $('l_r2').classList.add('hit');

    // אזהרות מצב מעבדה
    const w = $('l_warn'), msgs = [];
    if (t.leap && t.prevLeap)
      msgs.push(T('אין בלוח שתי שנים מעוברות רצופות — במחזור י״ט השנים המעוברות הן ג׳ ו׳ ח׳ י״א י״ד י״ז י״ט, ואין שתיים סמוכות. הצירוף הזה אינו קיים.'));
    if (!t.valid)
      msgs.push(T('אורך השנה שהתקבל אינו מן האורכים החוקיים (353/354/355 בפשוטה, 383/384/385 במעוברת) — צירוף הנתונים שנבחר אינו נפגש בלוח.'));
    w.innerHTML = msgs.map(m => `<div>⚠ ${m}</div>`).join('');
    w.style.display = msgs.length ? '' : 'none';
  }

  // ── מצב האיור ───────────────────────────────────────────────────────
  const sim = {
    playing: false, _bound: false, custom: false,
    year: 5786,
    c: { dow: 4, h: 9, p: 391, leap: false, prevLeap: false, nextLeap: false },

    step() {},

    build() {
      return this.custom ? H.customYear(this.c) : H.yearTable(this.year);
    },

    // draw() נקרא בכל invalidate (כל לחיצה במסמך). בניית הטבלה מחדש מאפסת את
    // גלילת המכולה, ולכן היא מדלגת כשהמצב והשפה לא השתנו.
    draw() {
      if (!$('l_table')) return;
      const sig = (this.custom ? 'c' + JSON.stringify(this.c) : 'y' + this.year) +
        '|' + (window.I18N ? window.I18N.lang : 'he');
      if (this._sig === sig) return;
      this._sig = sig;
      const t = this.build();
      renderSummary(t);
      renderTable(t);
      if (window.I18N && window.I18N.active) window.I18N.translateDom($('l_view'));
      // אחרי translateDom ולא לפניו: הוא משחזר מאפייני title מן הערך שנקלט
      // בפעם הראשונה (בניגוד לצמתי טקסט, שיש להם זיהוי כתיבה דינמית), ולכן
      // title שנבנה בזמן ריצה על צומת קבוע היה נדרס בחזרה לעברית.
      $('l_siman').title = `${T('סימן השנה')}: ${T(H.DOW[t.rh.dow])} · ${T(t.kind || '')} · ` +
        `${T('א׳ דפסח')} ${T(H.DOW[t.pesachDow])}`;
    },

    // בשנה מעוברת השנה הבאה בהכרח פשוטה; הפקד ננעל ומשקף זאת.
    _syncCustom() {
      const on = this.custom;
      $('l_customBox').style.display = on ? '' : 'none';
      $('l_yearBox').style.display = on ? 'none' : '';
      $('l_customBtn').textContent = T(on ? '↩ חזרה לשנה אמיתית' : '🧪 שנת מעבדה');
      if (!on) return;
      const nx = $('l_nextLeap');
      if (this.c.leap) { this.c.nextLeap = false; nx.checked = false; nx.disabled = true; }
      else nx.disabled = false;
      $('l_nextHint').textContent = this.c.leap
        ? T('שנה שאחרי מעוברת היא תמיד פשוטה')
        : T('משפיע רק כשמולד תשרי הבא חל ביום ג׳ אחרי ט׳ ר״ד');
    },

    _syncYear() {
      const el = $('l_year');
      if (el && !window.__fieldLocked(el)) el.value = this.year;
      $('l_yearName').textContent = H.hebYearName(this.year);
    },

    sync() { if (!this.custom) this._syncYear(); },

    bind() {
      if (this._bound) return; this._bound = true;
      const today = H.fromGregorian(new Date());
      if (today) this.year = today.year;
      this._syncYear();
      this._syncCustom();

      const redraw = () => this.draw();
      const setYear = y => {
        this.year = Math.max(1, Math.min(9999, y | 0));
        this._syncYear(); redraw();
      };
      $('l_year').onchange = e => setYear(+e.target.value || this.year);
      $('l_prev').onclick = () => setYear(this.year - 1);
      $('l_next').onclick = () => setYear(this.year + 1);
      $('l_today').onclick = () => {
        const h = H.fromGregorian(new Date());
        if (h) setYear(h.year);
      };
      $('l_customBtn').onclick = () => {
        this.custom = !this.custom;
        if (this.custom) {                       // פותחים מהשנה המוצגת, כנקודת מוצא מוכרת
          const t = H.yearTable(this.year), m = t.rh.molad;
          this.c = {
            dow: m.dow, h: m.h, p: m.p,
            leap: t.leap, prevLeap: t.prevLeap, nextLeap: t.nextLeap,
          };
          $('l_dow').value = String(m.dow);
          $('l_h').value = m.h; $('l_p').value = m.p;
          $('l_leap').checked = t.leap;
          $('l_prevLeap').checked = t.prevLeap;
          $('l_nextLeap').checked = t.nextLeap;
        }
        this._syncCustom(); redraw();
      };

      const num = (id, key, min, max) => {
        $(id).oninput = e => {
          const v = Math.max(min, Math.min(max, +e.target.value || 0));
          this.c[key] = v; redraw();
        };
      };
      $('l_dow').onchange = e => { this.c.dow = +e.target.value; redraw(); };
      num('l_h', 'h', 0, 23);
      num('l_p', 'p', 0, 1079);
      for (const [id, key] of [['l_leap', 'leap'], ['l_prevLeap', 'prevLeap'], ['l_nextLeap', 'nextLeap']]) {
        $(id).onchange = e => { this.c[key] = e.target.checked; this._syncCustom(); redraw(); };
      }
      this.draw();
    },
  };

  sim.onLanguage = () => { if (sim._bound) { sim._sig = null; sim._syncCustom(); sim.draw(); } };

  window.Sims.luach = sim;
})();
