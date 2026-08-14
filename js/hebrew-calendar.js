// hebrew-calendar.js — חשבון הלוח העברי הקבוע: מולד, ארבע הדחיות, וקביעת השנה.
//
// כל החשבון בחלקים (1080 לשעה, 25920 ליממה), והשעות נמנות מתחילת הלילה —
// שש בערב — כדרך הלוח. מכאן ש"מולד זקן" שהוא שעה 18 הוא חצות היום, ולא שש
// בערב; זו טעות ההבנה הרווחת בנושא, ולכן הממשק מציג לצד כל מולד גם את שעון
// היממה המקביל.
//
// המימוש הושווה מול האלגוריתם הקנוני של Calendrical Calculations
// (Dershowitz–Reingold) על פני אלפיים שנה בהתאמה מלאה.
//
// אזהרה מעשית: לוח ה-Intl של הדפדפן (ca-hebrew) אינו זהה לחשבון הזה — הוא
// סוטה ביום אחד בשנים שבהן מולד תשרי חל ביום א׳ בין שעה 15 לשעה 18 והשנה
// שלפניה מעוברת (הקרובות: תת״ז, ו׳נ״ד). לכן אין להשתמש בו כאסמכתא.
"use strict";
window.HebCal = (function () {
  const P_HOUR = 1080, P_DAY = 24 * P_HOUR;                 // 25920 חלקים ביממה
  const LUNATION = 29 * P_DAY + 12 * P_HOUR + 793;          // כ״ט י״ב תשצ״ג
  const BEHERAD = 5 * P_HOUR + 204;                         // מולד בהר״ד: יום ב׳, ה׳ ר״ד

  const MONTHS_PLAIN = ['תשרי', 'חשון', 'כסליו', 'טבת', 'שבט', 'אדר',
    'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'];
  const MONTHS_LEAP = ['תשרי', 'חשון', 'כסליו', 'טבת', 'שבט', 'אדר א׳', 'אדר ב׳',
    'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'];
  const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];

  const isLeap = y => (((7 * y + 1) % 19) + 19) % 19 < 7;
  const monthsInYear = y => isLeap(y) ? 13 : 12;

  // מניין החודשים שקדמו לתשרי של שנה — נוסחת המחזור בת י״ט השנים
  function monthsBefore(y) {
    const c = Math.floor((y - 1) / 19), r = (y - 1) % 19;
    return c * 235 + 12 * r + Math.floor((7 * r + 1) / 19);
  }
  const moladTishrei = y => BEHERAD + monthsBefore(y) * LUNATION;
  // המולד של החודש ה-i בשנה (0 = תשרי)
  const moladOfMonth = (y, i) => moladTishrei(y) + i * LUNATION;

  // פירוק מולד לרכיביו. dow: 0 = יום א׳ … 6 = שבת.
  function partsOf(molad) {
    const day = Math.floor(molad / P_DAY), t = molad % P_DAY;
    return { abs: day, dow: (day + 1) % 7, h: Math.floor(t / P_HOUR), p: t % P_HOUR, t };
  }

  // ── ארבע הדחיות ─────────────────────────────────────────────────────
  // הסדר מהותי: מולד זקן / גטר״ד / בטו״תקפ״ט נבחנות על יום המולד עצמו,
  // ורק אחריהן נבחנת אד״ו ראש על היום שהתקבל. חילופו של הסדר הזה הוא
  // בדיוק הבאג שבלוח ה-Intl של הדפדפן.
  // leap = השנה הנדונה מעוברת; prevLeap = השנה שלפניה מעוברת.
  function applyDechiyot(molad, leap, prevLeap) {
    const m = partsOf(molad);
    let day = m.abs, why = null;
    if (m.t >= 18 * P_HOUR) { day++; why = 'zaken'; }                                  // א. מולד זקן
    else if (m.dow === 2 && m.t >= 9 * P_HOUR + 204 && !leap) { day += 2; why = 'gatarad'; }   // ג. גטר״ד
    else if (m.dow === 1 && m.t >= 15 * P_HOUR + 589 && prevLeap) { day++; why = 'betutakpat'; } // ד. בט״ו תקפ״ט
    const d2 = (day + 1) % 7;
    if (d2 === 0 || d2 === 3 || d2 === 5) {                                            // ב. לא אד״ו ראש
      day++;
      why = why === 'gatarad' ? 'gatarad' : (why ? why + '+adu' : 'adu');
    }
    return { abs: day, dow: (day + 1) % 7, dechiya: why, molad: m };
  }

  const roshHashana = y => applyDechiyot(moladTishrei(y), isLeap(y), isLeap(y - 1));
  const roshHashanaAbs = y => roshHashana(y).abs;
  const yearLength = y => roshHashanaAbs(y + 1) - roshHashanaAbs(y);

  // אורך השנה קובע את חשון וכסליו: 353/383 חסרה, 354/384 כסדרה, 355/385 שלמה
  function monthLengths(len, leap) {
    const kind = len % 10;                                  // 3 חסרה · 4 כסדרה · 5 שלמה
    const cheshvan = kind === 5 ? 30 : 29;
    const kislev = kind === 3 ? 29 : 30;
    return leap
      ? [30, cheshvan, kislev, 29, 30, 30, 29, 30, 29, 30, 29, 30, 29]
      : [30, cheshvan, kislev, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  }
  const YEAR_KIND = { 3: 'חסרה', 4: 'כסדרה', 5: 'שלמה' };

  // ── סימן השנה ───────────────────────────────────────────────────────
  // שלוש אותיות: יום ראש השנה, טיב השנה (חסרה/כסדרה/שלמה), ויום א׳ דפסח.
  // שבת נכתבת ז׳ בסימן, ולא כמו במניין ימי השבוע שבטבלה.
  const SIMAN_DOW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז'];
  const KIND_LETTER = { 3: 'ח', 4: 'כ', 5: 'ש' };
  const siman = (rhDow, len, pesachDow) => {
    const s = SIMAN_DOW[rhDow] + (KIND_LETTER[len % 10] || '?') + SIMAN_DOW[pesachDow];
    return s.slice(0, -1) + '״' + s.slice(-1);
  };

  // מחזור קטן — י״ט שנות מחזור הלבנה; מחזור גדול — כ״ח שנות מחזור החמה
  // (זה שברכת החמה בראשיתו, ועליו נסמך גם חשבון התקופות בשרי השעות).
  const cycleOf = (y, n) => ({ num: Math.floor((y - 1) / n) + 1, year: ((y - 1) % n) + 1, of: n });

  // ── המרה ללוח הלועזי ────────────────────────────────────────────────
  // עוגן: א׳ בתשרי תשפ״ה = 3.10.2024. החשבון כולו בהפרשי ימים שלמים.
  const ANCHOR_ABS = roshHashanaAbs(5785), ANCHOR_MS = Date.UTC(2024, 9, 3);
  // absToDate מחזיר תאריך שרכיביו נקראים ב-getUTC* (כך אין תלות באזור זמן);
  // absToLocalDate מחזיר את חצות היום המקומי של אותו יום, לשימוש בקוד שמשווה
  // מול תאריכים מקומיים — קריאת getHours על תוצאת absToDate הייתה מזיזה יום.
  const absToDate = abs => new Date(ANCHOR_MS + (abs - ANCHOR_ABS) * 86400000);
  const absToLocalDate = abs => {
    const d = absToDate(abs);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0);
  };
  const dateToAbs = d => ANCHOR_ABS +
    Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - ANCHOR_MS) / 86400000);

  // ── גימטריה ─────────────────────────────────────────────────────────
  function hebNum(n) {
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hund = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    let s = hund[Math.floor(n / 100)] || '';
    const r = n % 100;
    if (r === 15) s += 'טו';
    else if (r === 16) s += 'טז';
    else s += tens[Math.floor(r / 10)] + ones[r % 10];
    if (s.length > 1) s = s.slice(0, -1) + '״' + s.slice(-1);
    else if (s.length === 1) s += '׳';
    return s;
  }
  const hebYearName = y => hebNum(y % 1000);

  // ── בניית לוח שנה שלם ───────────────────────────────────────────────
  // מקבל את נתוני הפתיחה כבר מחושבים, כדי שאותו קוד ישמש גם לשנה אמיתית
  // וגם ל"שנת מעבדה" שהמשתמש מרכיב בעצמו.
  function buildYear(o) {
    const { molad, leap, prevLeap, nextLeap, year } = o;
    const rh = applyDechiyot(molad, leap, prevLeap);
    const nMonths = leap ? 13 : 12;
    const nextMolad = molad + nMonths * LUNATION;
    const rhNext = applyDechiyot(nextMolad, !!nextLeap, leap);
    const len = rhNext.abs - rh.abs;
    const valid = leap ? (len >= 383 && len <= 385) : (len >= 353 && len <= 355);
    const lens = monthLengths(len, leap);
    const names = leap ? MONTHS_LEAP : MONTHS_PLAIN;

    let abs = rh.abs;
    const months = names.map((name, i) => {
      const m = partsOf(molad + i * LUNATION);
      const start = abs;
      // ראש חודש בן יומיים כשהחודש הקודם מלא: ל׳ שלו ואחריו א׳ של זה
      const prevFull = i > 0 && lens[i - 1] === 30;
      const rc = i === 0
        ? { days: [start], label: 'ראש השנה' }
        : { days: prevFull ? [start - 1, start] : [start], label: null };
      abs += lens[i];
      return {
        idx: i, name, len: lens[i], full: lens[i] === 30,
        molad: m, startAbs: start, endAbs: abs - 1, rc,
      };
    });

    // א׳ דפסח — ט״ו בניסן; משמש כאות השלישית בסימן השנה
    const nisan = months.find(x => x.name === 'ניסן');
    const pesachAbs = nisan.startAbs + 14;

    return {
      year, leap, prevLeap, nextLeap: !!nextLeap,
      rh, rhNext, len, valid, kind: YEAR_KIND[len % 10],
      months, nextMolad: partsOf(nextMolad),
      pesachAbs, pesachDow: (pesachAbs + 1) % 7,
      siman: siman(rh.dow, len, (pesachAbs + 1) % 7),
      // המחזורים נמנים משנת הבריאה ולכן קיימים רק לשנה אמיתית
      cycle19: year ? cycleOf(year, 19) : null,
      cycle28: year ? cycleOf(year, 28) : null,
    };
  }

  const yearTable = y => buildYear({
    year: y, molad: moladTishrei(y),
    leap: isLeap(y), prevLeap: isLeap(y - 1), nextLeap: isLeap(y + 1),
  });

  // שנת מעבדה: המשתמש קובע את מולד תשרי ואת סטטוס העיבור בעצמו.
  // dow 0=א׳ … 6=שבת, h שעות מתחילת הלילה, p חלקים.
  function customYear({ dow, h, p, leap, prevLeap, nextLeap }) {
    // בונים מולד מלאכותי שיום השבוע שלו הוא הנדרש (מוחלט — לא קשור לשנה אמיתית)
    const molad = ((dow + 6) % 7) * P_DAY + h * P_HOUR + p;
    return buildYear({ year: null, molad, leap, prevLeap, nextLeap });
  }

  // ── תאריך עברי מתאריך לועזי ─────────────────────────────────────────
  function fromGregorian(date) {
    const abs = dateToAbs(date);
    let y = 5785 + Math.floor((abs - ANCHOR_ABS) / 365.2468);
    while (roshHashanaAbs(y) > abs) y--;
    while (roshHashanaAbs(y + 1) <= abs) y++;
    const t = yearTable(y);
    for (const m of t.months)
      if (abs >= m.startAbs && abs <= m.endAbs)
        return { year: y, month: m.name, monthIdx: m.idx, day: abs - m.startAbs + 1, leap: t.leap };
    return null;                                            // לא יקרה
  }
  const formatHebrewDate = date => {
    const h = fromGregorian(date);
    return h ? `${hebNum(h.day)} ${h.month} ${hebYearName(h.year)}` : '';
  };

  // א׳ בחודש המבוקש הקרוב מהיום והלאה. names — שמות חודשים כמו במערך שלמעלה.
  function nextRoshChodesh(names, from) {
    const start = from || new Date();
    const abs0 = dateToAbs(start);
    let y = fromGregorian(start).year;
    for (let k = 0; k < 3; k++, y++) {
      for (const m of yearTable(y).months)
        if (names.includes(m.name) && m.startAbs >= abs0) return absToLocalDate(m.startAbs);
    }
    return null;
  }

  return {
    P_HOUR, P_DAY, LUNATION, DOW, MONTHS_PLAIN, MONTHS_LEAP,
    isLeap, monthsInYear, moladTishrei, moladOfMonth, partsOf,
    roshHashana, roshHashanaAbs, yearLength, monthLengths, siman, cycleOf,
    absToDate, absToLocalDate, dateToAbs, hebNum, hebYearName,
    yearTable, customYear, fromGregorian, formatHebrewDate, nextRoshChodesh,
  };
})();
