// astronomy-adapter.js
// מממש את window.Astro מעל Astronomy Engine (v2) לחישובים מדויקים.
// שומר על אותו ממשק כמו astro.js כדי שקוד הציור לא יצטרך להשתנות.
"use strict";
(function () {
  const AE = window.Astronomy;
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const sin = x => Math.sin(x * RAD), cos = x => Math.cos(x * RAD), tan = x => Math.tan(x * RAD);

  const SYNODIC = 29.530589;   // חודש סינודי (ימים)
  const SOLAR_YEAR = 365.25;   // שנת שמואל

  // ===== מופעי הירח =====
  // אלה ממשיכים להיות חישוב מושגי (לאיור הירח) — לא משתנים.
  function moonIllum(day) { return (1 - Math.cos(2 * Math.PI * day / SYNODIC)) / 2; }
  function moonWaning(day) { return (day % SYNODIC) >= SYNODIC / 2; }
  function moonPhaseLabel(day) {
    const t = (day % SYNODIC) / SYNODIC;
    if (t < 0.02 || t > 0.98) return 'מולד (ירח חדש)';
    if (Math.abs(t - 0.25) < 0.02) return 'רבע ראשון';
    if (Math.abs(t - 0.50) < 0.02) return 'ירח מלא';
    if (Math.abs(t - 0.75) < 0.02) return 'רבע אחרון';
    const wax = t < 0.5, f = moonIllum(day);
    if (f < 0.5) return wax ? 'סהר מתמלא' : 'סהר מתמעט';
    return wax ? 'גיבן מתמלא' : 'גיבן מתמעט';
  }

  // ===== מהלך השמש =====
  // חישוב טהור — לא תלוי בדיוק הספרייה; נשמר כפי שהוא.
  function solarDecl(daysFromSpring) { return 23.44 * sin(360 * daysFromSpring / SOLAR_YEAR); }
  function sunHorizon(H, dec, phi) {
    const Up = sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H);
    const South = sin(phi) * cos(dec) * cos(H) - cos(phi) * sin(dec);
    return { E: -cos(dec) * sin(H), N: -South, U: Up };
  }
  function dayLengthHours(dec, phi) {
    let c = -tan(phi) * tan(dec); c = Math.max(-1, Math.min(1, c));
    return 2 * Math.acos(c) * DEG / 15;
  }

  // ===== מיקום גרמי השמים — מדויק =====
  const BODY_MAP = {
    sun:     AE.Body.Sun,
    moon:    AE.Body.Moon,
    mercury: AE.Body.Mercury,
    venus:   AE.Body.Venus,
    mars:    AE.Body.Mars,
    jupiter: AE.Body.Jupiter,
    saturn:  AE.Body.Saturn,
    uranus:  AE.Body.Uranus,
    neptune: AE.Body.Neptune,
  };

  function computeSky(dateUTC, latObs, lonObs) {
    const time = AE.MakeTime(dateUTC);
    const observer = new AE.Observer(latObs, lonObs, 0);
    const out = {};
    for (const [name, body] of Object.entries(BODY_MAP)) {
      try {
        // ofdate=true: תיאום לתאריך; aberration=true: תיקון אברציה
        const eq = AE.Equator(body, time, observer, true, true);
        // 'normal': תיקון שבירה אטמוספרית
        const hor = AE.Horizon(time, observer, eq.ra, eq.dec, 'normal');
        out[name] = { az: hor.azimuth, alt: hor.altitude };
      } catch (_) {
        out[name] = { az: 0, alt: -90 };
      }
    }
    return out;
  }

  window.Astro = {
    SYNODIC, SOLAR_YEAR,
    moonIllum, moonWaning, moonPhaseLabel,
    solarDecl, sunHorizon, dayLengthHours,
    computeSky,
  };
})();
