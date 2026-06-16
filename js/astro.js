// מנוע אסטרונומי — מופעי ירח, מהלך השמש, ומיקומי כוכבי לכת (Paul Schlyter).
// כל הפונקציות טהורות; אין תלות חיצונית.
"use strict";
(function () {
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const sin = x => Math.sin(x * RAD), cos = x => Math.cos(x * RAD), tan = x => Math.tan(x * RAD);
  const asin = x => Math.asin(x) * DEG, atan2 = (y, x) => Math.atan2(y, x) * DEG;
  const rev = x => ((x % 360) + 360) % 360;

  const SYNODIC = 29.530589;     // חודש הלבנה (ימים)
  const SOLAR_YEAR = 365.25;     // שנת שמואל

  // ===== מופעי הירח =====
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

  // ===== מהלך השמש (גובה/אזימוט יומי) =====
  function solarDecl(daysFromSpring) { return 23.44 * sin(360 * daysFromSpring / SOLAR_YEAR); }
  function sunHorizon(H, dec, phi) {          // H,dec,phi מעלות → (E,N,U)
    const Up = sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H);
    const South = sin(phi) * cos(dec) * cos(H) - cos(phi) * sin(dec);
    return { E: -cos(dec) * sin(H), N: -South, U: Up };
  }
  function dayLengthHours(dec, phi) {
    let c = -tan(phi) * tan(dec); c = Math.max(-1, Math.min(1, c));
    return 2 * Math.acos(c) * DEG / 15;
  }

  // ===== מיקומי כוכבי לכת — אלגוריתם Schlyter =====
  function dayNumber(Y, M, D, UTh) {
    return 367 * Y - Math.floor(7 * (Y + Math.floor((M + 9) / 12)) / 4)
      + Math.floor(275 * M / 9) + D - 730530 + UTh / 24;
  }
  function elements(body, d) {
    const E = {
      sun:    { N:0, i:0, w:282.9404+4.70935e-5*d, a:1, e:0.016709-1.151e-9*d, M:356.0470+0.9856002585*d },
      moon:   { N:125.1228-0.0529538083*d, i:5.1454, w:318.0634+0.1643573223*d, a:60.2666, e:0.054900, M:115.3654+13.0649929509*d },
      mercury:{ N:48.3313+3.24587e-5*d, i:7.0047+5.00e-8*d, w:29.1241+1.01444e-5*d, a:0.387098, e:0.205635+5.59e-10*d, M:168.6562+4.0923344368*d },
      venus:  { N:76.6799+2.46590e-5*d, i:3.3946+2.75e-8*d, w:54.8910+1.38374e-5*d, a:0.723330, e:0.006773-1.302e-9*d, M:48.0052+1.6021302244*d },
      mars:   { N:49.5574+2.11081e-5*d, i:1.8497-1.78e-8*d, w:286.5016+2.92961e-5*d, a:1.523688, e:0.093405+2.516e-9*d, M:18.6021+0.5240207766*d },
      jupiter:{ N:100.4542+2.76854e-5*d, i:1.3030-1.557e-7*d, w:273.8777+1.64505e-5*d, a:5.20256, e:0.048498+4.469e-9*d, M:19.8950+0.0830853001*d },
      saturn: { N:113.6634+2.38980e-5*d, i:2.4886-1.081e-7*d, w:339.3939+2.97661e-5*d, a:9.55475, e:0.055546-9.499e-9*d, M:316.9670+0.0334442282*d },
      uranus: { N:74.0005+1.3978e-5*d, i:0.7733+1.9e-8*d, w:96.6612+3.0565e-5*d, a:19.18171-1.55e-8*d, e:0.047318+7.45e-9*d, M:142.5905+0.011725806*d },
      neptune:{ N:131.7806+3.0173e-5*d, i:1.7700-2.55e-7*d, w:272.8461-6.027e-6*d, a:30.05826+3.313e-8*d, e:0.008606+2.15e-9*d, M:260.2471+0.005995147*d },
    }[body];
    E.N = rev(E.N); E.w = rev(E.w); E.M = rev(E.M);
    return E;
  }
  function orbit(el) {
    const { N, i, w, a, e, M } = el;
    let Ecc = M + e * DEG * sin(M) * (1 + e * cos(M));
    for (let k = 0; k < 6; k++) Ecc = Ecc - (Ecc - e * DEG * sin(Ecc) - M) / (1 - e * cos(Ecc));
    const xv = a * (cos(Ecc) - e), yv = a * Math.sqrt(1 - e * e) * sin(Ecc);
    const v = rev(atan2(yv, xv)), r = Math.sqrt(xv * xv + yv * yv);
    const x = r * (cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i));
    const y = r * (sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i));
    const z = r * (sin(v + w) * sin(i));
    return { lon: rev(atan2(y, x)), lat: atan2(z, Math.sqrt(x * x + y * y)), r, v, w };
  }
  function fromLonLat(lon, lat, r) {
    return { x: r * cos(lon) * cos(lat), y: r * sin(lon) * cos(lat), z: r * sin(lat) };
  }
  function sunPos(d) {
    const el = elements('sun', d), o = orbit(el);
    const lon = rev(o.v + el.w);
    return { x: o.r * cos(lon), y: o.r * sin(lon), z: 0, lon, r: o.r, M: el.M };
  }
  function perturb(body, d, lon, lat, r, el) {
    if (body === 'moon') {
      const Ms = elements('sun', d).M, ws = elements('sun', d).w;
      const Mm = el.M, Nm = el.N, wm = el.w;
      const Ls = rev(Ms + ws), Lm = rev(Nm + wm + Mm), Dm = rev(Lm - Ls), F = rev(Lm - Nm);
      lon += -1.274*sin(Mm-2*Dm)+0.658*sin(2*Dm)-0.186*sin(Ms)-0.059*sin(2*Mm-2*Dm)
        -0.057*sin(Mm-2*Dm+Ms)+0.053*sin(Mm+2*Dm)+0.046*sin(2*Dm-Ms)+0.041*sin(Mm-Ms)
        -0.035*sin(Dm)-0.031*sin(Mm+Ms)-0.015*sin(2*F-2*Dm)+0.011*sin(Mm-4*Dm);
      lat += -0.173*sin(F-2*Dm)-0.055*sin(Mm-F-2*Dm)-0.046*sin(Mm+F-2*Dm)+0.033*sin(F+2*Dm)+0.017*sin(2*Mm+F);
      r += -0.58*cos(Mm-2*Dm)-0.46*cos(2*Dm);
    } else if (body === 'jupiter' || body === 'saturn' || body === 'uranus') {
      const Mj = elements('jupiter', d).M, Msa = elements('saturn', d).M, Mu = elements('uranus', d).M;
      if (body === 'jupiter') {
        lon += -0.332*sin(2*Mj-5*Msa-67.6)-0.056*sin(2*Mj-2*Msa+21)+0.042*sin(3*Mj-5*Msa+21)
          -0.036*sin(Mj-2*Msa)+0.022*cos(Mj-Msa)+0.023*sin(2*Mj-3*Msa+52)-0.016*sin(Mj-5*Msa-69);
      } else if (body === 'saturn') {
        lon += 0.812*sin(2*Mj-5*Msa-67.6)-0.229*cos(2*Mj-4*Msa-2)+0.119*sin(Mj-2*Msa-3)
          +0.046*sin(2*Mj-6*Msa-69)+0.014*sin(Mj-3*Msa+32);
        lat += -0.020*cos(2*Mj-4*Msa-2)+0.018*sin(2*Mj-6*Msa-49);
      } else {
        lon += 0.040*sin(Msa-2*Mu+6)+0.035*sin(Msa-3*Mu+33)-0.015*sin(Mj-Mu+20);
      }
    }
    return { lon: rev(lon), lat, r };
  }
  function computeSky(dateUTC, latObs, lonObs) {
    const Y = dateUTC.getUTCFullYear(), M = dateUTC.getUTCMonth() + 1, D = dateUTC.getUTCDate();
    const UTh = dateUTC.getUTCHours() + dateUTC.getUTCMinutes() / 60 + dateUTC.getUTCSeconds() / 3600;
    const d = dayNumber(Y, M, D, UTh);
    const ecl = 23.4393 - 3.563e-7 * d;
    const sun = sunPos(d);
    const sEl = elements('sun', d);
    const LST = rev(rev(sEl.M + sEl.w + 180) + UTh * 15.04107 + lonObs);
    const bodies = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    const out = {};
    for (const b of bodies) {
      let lon, lat, r, geo;
      if (b === 'sun') { lon = sun.lon; lat = 0; r = sun.r; geo = { x: sun.x, y: sun.y, z: 0 }; }
      else if (b === 'moon') {
        const el = elements('moon', d), o = orbit(el);
        ({ lon, lat, r } = perturb('moon', d, o.lon, o.lat, o.r, el));
        geo = fromLonLat(lon, lat, r);
      } else {
        const o = orbit(elements(b, d));
        ({ lon, lat, r } = perturb(b, d, o.lon, o.lat, o.r, {}));
        const p = fromLonLat(lon, lat, r);
        geo = { x: p.x + sun.x, y: p.y + sun.y, z: p.z };
      }
      const xe = geo.x, ye = geo.y * cos(ecl) - geo.z * sin(ecl), ze = geo.y * sin(ecl) + geo.z * cos(ecl);
      let RA = rev(atan2(ye, xe)), Dec = atan2(ze, Math.sqrt(xe * xe + ye * ye));
      if (b === 'moon') {                       // פרלקסה טופוצנטרית
        const mpar = asin(1 / r), gclat = latObs - 0.1924 * sin(2 * latObs), rho = 0.99833 + 0.00167 * cos(2 * latObs);
        const HAm = rev(LST - RA), g = atan2(tan(gclat), cos(HAm));
        RA = rev(RA - mpar * rho * cos(gclat) * sin(HAm) / cos(Dec));
        Dec = Dec - mpar * rho * sin(gclat) * sin(g - Dec) / sin(g);
      }
      const HA = rev(LST - RA);
      const x = cos(HA) * cos(Dec), y = sin(HA) * cos(Dec), z = sin(Dec);
      const xh = x * sin(latObs) - z * cos(latObs), yh = y, zh = x * cos(latObs) + z * sin(latObs);
      out[b] = { az: rev(atan2(yh, xh) + 180), alt: asin(zh) };
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
