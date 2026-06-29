// system3d.js — מערכת שמש · ארץ · ירח (ועם כוכבי לכת וליקויים) בתלת-מימד (Three.js)
// המיקומים והכיוונים מחושבים במדויק מ-Astronomy Engine (וקטורי J2000):
//   הליוצנטרי — HelioVector(גוף); כיוון (אורך מלקה) מדויק.
//   גאוצנטרי  — GeoVector(Sun) / GeoVector(Moon); כיוונים אמיתיים.
// מרחק ארץ–ירח ומרחקי כוכבי הלכת דחוסים לתצוגה (אחרת בלתי-נראים); הכיוון מדויק.
// התאורה מגיעה מכיוון השמש האמיתי → מופע הירח וקו היום/לילה של הארץ נוצרים
// פיזיקלית נכון. ליקויים מחושבים מ-SearchLunarEclipse / SearchGlobalSolarEclipse.
// הכל מסונכרן מאותו רגע-זמן יחיד.
"use strict";
(function () {
  const AE = window.Astronomy;
  const $ = id => document.getElementById(id);
  const RAD = Math.PI / 180;

  // ── קני מידה לתצוגה (לא פיזיקליים — לקריאוּת) ──────────────────────────
  const AU_K     = 22;   // רדיוס מסלול = AU_K · √(מרחק ב-AU)  (דחיסה לאורבית קריא)
  const MOON_VIS = 6;    // רדיוס מסלול הירח סביב הארץ (מוגדל)
  const R_SUN = 4, R_EARTH = 1.4, R_MOON = 0.6;
  const EPS = 23.4392911 * RAD;              // נטיית המלקה J2000 (להמרה משוונית→אקליפטית)
  const COS_EPS = Math.cos(EPS), SIN_EPS = Math.sin(EPS);

  function orbitR(au) { return AU_K * Math.sqrt(au); }

  // כוכבי הלכת (מבט הליוצנטרי) — au לקנה-מידה, period (ימים) לדגימת מסלול אמיתי, צבע, רדיוס
  const PLANETS = [
    { key: 'Mercury', he: 'חמה',    au: 0.387, period: 87.969,   color: 0xa09080, r: 0.45 },
    { key: 'Venus',   he: 'נוגה',   au: 0.723, period: 224.701,  color: 0xe8c870, r: 0.7 },
    { key: 'Mars',    he: 'מאדים',  au: 1.524, period: 686.980,  color: 0xd05030, r: 0.55 },
    { key: 'Jupiter', he: 'צדק',    au: 5.203, period: 4332.589, color: 0xc8a870, r: 1.5 },
    { key: 'Saturn',  he: 'שבתאי',  au: 9.537, period: 10759.22, color: 0xb0a060, r: 1.3 },
    { key: 'Uranus',  he: 'אורנוס', au: 19.19, period: 30688.5,  color: 0x70c0cc, r: 1.0 },
    { key: 'Neptune', he: 'נפטון',  au: 30.07, period: 60182.0,  color: 0x5060c8, r: 1.0 },
  ];
  const EARTH_PERIOD = 365.256, MOON_PERIOD = 27.32166;   // ימים (סידורי)

  // המרת וקטור Astronomy Engine (משווני J2000: x→שווי-יום, z→קוטב שמימי) למרחב Three:
  //   1) סיבוב למערכת אקליפטית J2000 (סביב ציר השוויון בזווית ε)
  //   2) מיפוי למרחב Three עם Y=הקוטב האקליפטי הצפוני: (x, z_ecl, -y_ecl)
  // החלפת y↔z בלבד הייתה שיקוף (דטרמיננטה −1); הסימן השלילי ב-Z שומר מערכת ימנית
  // (דטרמיננטה +1), כך שהמסלולים פונים נגד כיוון השעון במבט מהצפון — כמו במציאות.
  function v3(v) {
    const ye =  v.y * COS_EPS + v.z * SIN_EPS;   // y אקליפטי
    const ze = -v.y * SIN_EPS + v.z * COS_EPS;   // z אקליפטי (קוטב המלקה)
    return new THREE.Vector3(v.x, ze, -ye);
  }

  // אוריינטציה פיזיקלית של גוף מ-Astronomy.RotationAxis: בונה מסגרת-גוף אורתונורמלית
  // ימנית במרחב הסצנה — Y=הקוטב הצפוני (של-תאריך), X≈קו-האורך הראשי. כך מתקבל קצב
  // וכיוון סיבוב נכונים, ולירח גם נעילה גאותית (אותו צד כלפי הארץ) + ליברציה.
  // הערה (קוסמטי בלבד): הציר/הקצב/הכיוון מדויקים, אך רישום קו-אורך 0° של קובץ
  // הטקסטורה לציר X המקומי אינו ודאי — ייתכן היסט קבוע (גריניץ' בארץ / מרכז הצד
  // הקרוב בירח). תיקון דורש כיול חזותי חד-פעמי של הטקסטורה, לא שינוי בחישוב.
  const _bX = new THREE.Vector3(), _bY = new THREE.Vector3(), _bZ = new THREE.Vector3(), _basis = new THREE.Matrix4();
  function orientBody(mesh, body, time) {
    let ax; try { ax = AE.RotationAxis(body, time); } catch (e) { return; }
    const a0 = ax.ra * 15 * RAD, W = ax.spin * RAD;
    const nx = ax.north.x, ny = ax.north.y, nz = ax.north.z;
    const qx = -Math.sin(a0), qy = Math.cos(a0);                  // כיוון הצומת העולה Q (qz=0)
    const cx = -nz * qy, cy = nz * qx, cz = nx * qy - ny * qx;    // n × Q
    const cw = Math.cos(W), sw = Math.sin(W);
    // קו-האורך הראשי ב-EQJ: B = Q·cosW + (n×Q)·sinW
    _bY.copy(v3({ x: nx, y: ny, z: nz })).normalize();                          // Y = קוטב צפוני
    _bX.copy(v3({ x: qx * cw + cx * sw, y: qy * cw + cy * sw, z: cz * sw }));    // ≈ קו-אורך ראשי
    _bX.addScaledVector(_bY, -_bX.dot(_bY)).normalize();          // אורתוגונליזציה מול Y
    _bZ.crossVectors(_bX, _bY).normalize();                      // Z = X×Y (ימני)
    _basis.makeBasis(_bX, _bY, _bZ);
    mesh.quaternion.setFromRotationMatrix(_basis);
  }

  const EK = { total: 'מלא', partial: 'חלקי', penumbral: 'צל-קדמי', annular: 'טבעתי', hybrid: 'היברידי' };

  // ── מצב פנימי ──────────────────────────────────────────────────────────
  let inited = false, renderer, scene, camera, controls;
  let sun, earth, moon, light, ambient, earthOrbit, moonOrbit, earthMoonLine, shadowCone;
  const labels = {};
  let curW = 0, curH = 0;
  let ecCache = null;
  let moonOrbitKey = null;   // מפתח throttle לחישוב-מחדש של טבעת הירח לפי התאריך

  function tex(key) {
    const url = window.ASSETS && window.ASSETS[key];
    if (!url) return null;
    return new THREE.TextureLoader().load(url, () => { try { window.__invalidate(); } catch (e) {} });
  }

  function makeLabel(text, color, scale) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const c = cv.getContext('2d');
    c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color; c.fillText(text, 128, 32);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
    const s = scale || 1; sp.scale.set(12 * s, 3 * s, 1);
    return sp;
  }

  // הילת זוהר רכה לשמש — sprite עם מילוי רדיאלי, מיזוג חיבורי (additive)
  function sunGlow() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,228,140,0.95)');
    g.addColorStop(0.35, 'rgba(255,200,90,0.45)');
    g.addColorStop(1, 'rgba(255,180,60,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(R_SUN * 4.5, R_SUN * 4.5, 1);
    return sp;
  }

  function starfield() {
    const g = new THREE.BufferGeometry();
    const N = 800, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 900;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(th);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7 }));
  }

  function loopFromPoints(pts, color, op) {
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: op == null ? 0.35 : op }));
  }

  // מסלול אמיתי: דגימת מיקומי הגוף לאורך תקופה שלמה → קו סגור המשמר נטיית-מסלול
  // ואקסצנטריות. הכיוון מדויק; הרדיוס דחוס (orbitR) בדיוק כמו מיקום הגוף עצמו, כך
  // שהקו עובר במקום שבו הגוף מצויר. נדגם פעם אחת (epoch קבוע) — המסלולים יציבים.
  const ORBIT_EPOCH = Date.UTC(2026, 0, 1);   // עוגן לדגימה (צורת המסלול כמעט קבועה)
  function helioOrbit(body, periodDays, color, op) {
    const seg = 256, pts = [];
    for (let i = 0; i < seg; i++) {
      const t = AE.MakeTime(new Date(ORBIT_EPOCH + (i / seg) * periodDays * 86400000));
      const v = v3(AE.HelioVector(body, t)), len = v.length() || 1;
      pts.push(v.multiplyScalar(orbitR(len) / len));         // כיוון מדויק · רדיוס דחוס
    }
    return loopFromPoints(pts, color, op);
  }
  // נקודות מסלול הירח סביב הארץ (גאוצנטרי) לחודש סידורי שמתחיל בתאריך הנתון — רדיוס
  // ויזואלי קבוע (המרחק האמיתי דחוס מדי) אך הכיוון אמיתי, ולכן נטיית המסלול (~5° למלקה)
  // מוצגת. נדגם מחדש לפי התאריך (לא כמו הכוכבים) כי מישור מסלול הירח נסוג במחזור 18.6
  // שנה — טבעת קבועה של 2026 הייתה סוטה מהירח כעבור שנים. i=0 = כיוון הירח בתאריך עצמו.
  function moonOrbitPoints(refMs) {
    const seg = 192, pts = [];
    for (let i = 0; i < seg; i++) {
      const t = AE.MakeTime(new Date(refMs + (i / seg) * MOON_PERIOD * 86400000));
      const v = v3(AE.GeoVector(AE.Body.Moon, t, false)), len = v.length() || 1;
      pts.push(v.multiplyScalar(MOON_VIS / len));
    }
    return pts;
  }

  function init() {
    const canvas = $('sys3dCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 8000);
    camera.position.set(50, 38, 70);

    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.addEventListener('change', () => { try { window.__invalidate(); } catch (e) {} });

    scene.add(starfield());

    light = new THREE.PointLight(0xffffff, 2.8, 0, 0); scene.add(light);
    ambient = new THREE.AmbientLight(0xffffff, 0.07); scene.add(ambient);

    // שמש — כדור זוהר אחיד (ללא טקסטורה: אייקון שטוח על ספרה יוצר כתם שחור)
    sun = new THREE.Mesh(new THREE.SphereGeometry(R_SUN, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd24a }));
    sun.add(sunGlow());
    scene.add(sun);

    // color=לבן כדי לא להכהות את הטקסטורה (גוון כחול כפל את המפה והחשיך אותה);
    // התוצאה — הצד המואר של כדור הארץ בהיר ונאמן לצבעי הטקסטורה.
    earth = new THREE.Mesh(new THREE.SphereGeometry(R_EARTH, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex('globe_earth'), roughness: 1, metalness: 0 }));
    scene.add(earth);

    moon = new THREE.Mesh(new THREE.SphereGeometry(R_MOON, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, map: tex('moon_real'), roughness: 1, metalness: 0 }));
    scene.add(moon);

    earthOrbit = helioOrbit(AE.Body.Earth, EARTH_PERIOD, 0x88aaff); scene.add(earthOrbit);
    moonOrbit  = loopFromPoints(moonOrbitPoints(ORBIT_EPOCH), 0xaaaaaa); scene.add(moonOrbit);

    earthMoonLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({ color: 0xffcc55, dashSize: 1.5, gapSize: 1.5, transparent: true, opacity: 0.5 }));
    scene.add(earthMoonLine);

    // חרוט צל הארץ (אומברה) — לכיוון מנוגד לשמש; הירח המלא הנכנס אליו = ליקוי לבנה
    shadowCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 12, 28, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x101018, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
    shadowCone.visible = false; scene.add(shadowCone);

    // כוכבי לכת — כדורים מוארים + טבעת מסלול + תווית
    for (const p of PLANETS) {
      p.mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 32, 32),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 1, metalness: 0 }));
      p.ringObj = helioOrbit(AE.Body[p.key], p.period, p.color, 0.22);
      p.labelObj = makeLabel(p.he, '#' + p.color.toString(16).padStart(6, '0'), 0.7);
      p.mesh.visible = p.ringObj.visible = p.labelObj.visible = false;
      scene.add(p.mesh); scene.add(p.ringObj); scene.add(p.labelObj);
    }

    labels.sun = makeLabel('שמש', '#ffd24a');
    labels.earth = makeLabel('ארץ', '#88bbff');
    labels.moon = makeLabel('ירח', '#dddddd');
    for (const k in labels) scene.add(labels[k]);

    inited = true;
  }

  function resize() {
    const stage = $('sys3dCanvas').parentElement;
    const r = stage.getBoundingClientRect();
    const W = Math.max(280, r.width), H = Math.max(240, r.height);
    if (W === curW && H === curH) return;
    curW = W; curH = H;
    renderer.setSize(W, H, true);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }

  function phaseLabel(elong /*0..360, 0=מולד*/) {
    if (elong < 8 || elong > 352) return 'מולד (ירח חדש)';
    if (Math.abs(elong - 90)  < 8) return 'רבע ראשון';
    if (Math.abs(elong - 180) < 8) return 'ירח מלא';
    if (Math.abs(elong - 270) < 8) return 'רבע אחרון';
    const wax = elong < 180;
    if (elong < 90 || elong > 270) return wax ? 'סהר מתמלא' : 'סהר מתמעט';
    return wax ? 'גיבן מתמלא' : 'גיבן מתמעט';
  }

  // ליקויים — חישוב + מטמון (יקר; מחושב מחדש רק כשהזמן יוצא מהטווח הנוכחי)
  function eclipses(date) {
    const t = date.getTime();
    if (ecCache && t >= ecCache.from && t < ecCache.next) return ecCache;
    let lun = null, sol = null;
    try { const e = AE.SearchLunarEclipse(date); lun = { date: e.peak.date, kind: e.kind }; } catch (e) {}
    try { const e = AE.SearchGlobalSolarEclipse(date); sol = { date: e.peak.date, kind: e.kind }; } catch (e) {}
    const next = Math.min(lun ? lun.date.getTime() : Infinity, sol ? sol.date.getTime() : Infinity);
    ecCache = { from: t, next: isFinite(next) ? next : t + 86400000, lun, sol };
    return ecCache;
  }

  // ── עדכון הסצנה לרגע-זמן ולמבט נוכחי ──────────────────────────────────
  function update(date, mode, showPlanets) {
    const time = AE.MakeTime(date);
    const geoMoon = v3(AE.GeoVector(AE.Body.Moon, time, false));
    const geoSun  = v3(AE.GeoVector(AE.Body.Sun,  time, false));
    const dirMoon = geoMoon.clone().normalize();
    const dirSun  = geoSun.clone().normalize();

    let pSun, pEarth, pMoon;
    if (mode === 'helio') {
      const he = AE.HelioVector(AE.Body.Earth, time);
      const dirE = v3(he).normalize();
      pSun = new THREE.Vector3(0, 0, 0);
      pEarth = dirE.multiplyScalar(orbitR(Math.hypot(he.x, he.y, he.z)));
      pMoon = pEarth.clone().add(dirMoon.clone().multiplyScalar(MOON_VIS));
      earthOrbit.visible = true;
    } else {
      // גאוצנטרי — הכל לפי מרחק גאוצנטרי אמיתי (דחוס), פרט לירח המוגדל
      pEarth = new THREE.Vector3(0, 0, 0);
      pSun = dirSun.clone().multiplyScalar(orbitR(geoSun.length()));
      pMoon = dirMoon.clone().multiplyScalar(MOON_VIS);
      earthOrbit.visible = false;
    }

    sun.position.copy(pSun);
    earth.position.copy(pEarth);
    moon.position.copy(pMoon);
    light.position.copy(pSun);
    moonOrbit.position.copy(pEarth);

    // חישוב-מחדש של טבעת הירח לפי התאריך (מקובץ ל-~7 ימים כדי לא לחשב בכל פריים).
    // מישור מסלול הירח נסוג לאט, ולכן הטבעת עוקבת אחרי המישור העדכני לכל תאריך נבחר.
    const mKey = Math.floor(date.getTime() / (7 * 86400000));
    if (mKey !== moonOrbitKey) {
      moonOrbitKey = mKey;
      moonOrbit.geometry.dispose();
      moonOrbit.geometry = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints(date.getTime()));
    }

    // אוריינטציה פיזיקלית מדויקת מהתאריך (קוטב של-תאריך + קו-אורך ראשי) דרך RotationAxis:
    // לארץ — נקיפה/נוטציה וקצב כוכבי נכון (~360.9856°/יום); לירח — נעילה גאותית + ליברציה.
    // דטרמיניסטי: אותו תאריך → אותה אוריינטציה. קו היום/לילה עדיין נקבע מכיוון השמש.
    orientBody(earth, AE.Body.Earth, time);
    orientBody(moon, AE.Body.Moon, time);

    earthMoonLine.geometry.setFromPoints([pEarth, pMoon]);
    earthMoonLine.computeLineDistances();

    // חרוט הצל — רק במבט גאוצנטרי, לכיוון מנוגד לשמש
    if (mode === 'geo') {
      const antiSun = dirSun.clone().negate();
      shadowCone.position.copy(pEarth).add(antiSun.clone().multiplyScalar(6));
      shadowCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), antiSun);
      shadowCone.visible = true;
    } else {
      shadowCone.visible = false;
    }

    // כוכבי לכת — בשני המבטים. הליוצנטרי: HelioVector ממרכז השמש.
    // גאוצנטרי: GeoVector ממרכז הארץ (מראה צמידוּת לשמש/ירח). טבעות מסלול
    // מעגליות אמיתיות רק הליוצנטרית — לכן מוסתרות במבט הגאוצנטרי.
    for (const p of PLANETS) {
      const on = showPlanets;
      p.mesh.visible = p.labelObj.visible = on;
      p.ringObj.visible = on && mode === 'helio';
      if (!on) continue;
      const vec = mode === 'helio'
        ? v3(AE.HelioVector(AE.Body[p.key], time))
        : v3(AE.GeoVector(AE.Body[p.key], time, false));
      const pos = vec.clone().normalize().multiplyScalar(orbitR(vec.length()));
      p.mesh.position.copy(pos);
      p.labelObj.position.copy(pos).add(new THREE.Vector3(0, p.r + 1.5, 0));
    }

    labels.sun.position.copy(pSun).add(new THREE.Vector3(0, R_SUN + 2.5, 0));
    labels.earth.position.copy(pEarth).add(new THREE.Vector3(0, R_EARTH + 2, 0));
    labels.moon.position.copy(pMoon).add(new THREE.Vector3(0, R_MOON + 1.5, 0));

    // הגוף המרכזי (שמש בהליוצנטרי / ארץ בגאוצנטרי) תמיד בראשית הצירים, ולכן
    // אין צורך לאפס את controls.target בכל פריים. איפוס כזה היה מבטל את הגרירה
    // (pan) שהמשתמש מבצע ב-Ctrl+גרירה. המיקוד מאופס לראשית רק בהחלפת מבט (_reframe).
    controls.update();

    // HUD — מופע
    let elong = 0, illum = 0;
    try { elong = AE.MoonPhase(time); } catch (e) {}
    try { illum = AE.Illumination(AE.Body.Moon, time).phase_fraction; } catch (e) {}
    const sp = $('s_phase'); if (sp) sp.textContent = phaseLabel(elong);
    const sc = $('s_pct'); if (sc) sc.textContent = Math.round(illum * 100) + '%';

    // HUD — ליקויים
    const ec = eclipses(date);
    const fmt = e => e ? `${e.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })} (${EK[e.kind] || e.kind})` : '—';
    const el1 = $('s_eclLun'); if (el1) el1.textContent = fmt(ec.lun);
    const el2 = $('s_eclSol'); if (el2) el2.textContent = fmt(ec.sol);
  }

  // ── אובייקט האיור (תואם ל-window.Sims) ────────────────────────────────
  const sim = {
    date: new Date(),
    mode: 'helio',
    showPlanets: false,
    playing: false,
    speed: 1,
    _bound: false,

    step(dt) { this.date = new Date(this.date.getTime() + this.speed * dt * 86400000); },

    draw() {
      if (typeof THREE === 'undefined') return;
      if (!inited) init();
      resize();
      update(this.date, this.mode, this.showPlanets);
      renderer.render(scene, camera);

      const sd = $('s_date');
      if (sd) sd.textContent = this.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
      this._syncHebrew();
    },

    _syncHebrew() {
      const el = $('s_date_he'); if (!el || !window.HebrewDate) return;
      window.HebrewDate(this.date).then(s => { if (el && s) el.textContent = s; });
    },

    _syncDate() {
      const d = this.date, dy = $('s_day'), dm = $('s_month'), dyr = $('s_year');
      if (dy && document.activeElement !== dy) dy.value = d.getDate();
      if (dm && document.activeElement !== dm) dm.value = d.getMonth() + 1;
      if (dyr && document.activeElement !== dyr) dyr.value = d.getFullYear();
    },

    sync() { this._syncDate(); },

    _setMode(m) {
      this.mode = m;
      document.querySelectorAll('#view-system3d .segmented button').forEach(b => b.classList.toggle('active', b.dataset.cam === m));
      const lbl = $('s_view'); if (lbl) lbl.textContent = m === 'helio' ? 'מבט הליוצנטרי' : 'מבט גאוצנטרי';
      this._reframe();
    },

    // מרחק מבט התחלתי מתאים למצב הנוכחי
    _reframe() {
      if (!inited) return;
      controls.target.set(0, 0, 0); // מרכוז מחדש על הגוף המרכזי (מבטל pan קודם)
      const d = this.showPlanets ? orbitR(30.07) * 1.6
        : (this.mode === 'geo' ? 55 : orbitR(1) * 2.4);
      const dir = camera.position.clone().sub(controls.target).normalize();
      if (dir.lengthSq() < 1e-6) dir.set(0.6, 0.45, 0.85).normalize();
      camera.position.copy(controls.target).add(dir.multiplyScalar(d));
      controls.update();
    },

    bind() {
      if (this._bound) return; this._bound = true;
      this._syncDate();
      $('s_play').onclick = e => { this.playing = !this.playing; e.target.textContent = this.playing ? '⏸ השהה' : '▶ הפעל'; };
      $('s_today').onclick = () => { this.date = new Date(); this.playing = false; $('s_play').textContent = '▶ הפעל'; this._syncDate(); };
      $('s_speed').oninput = e => { this.speed = +e.target.value; $('s_spdL').textContent = (+e.target.value).toFixed(1); };
      $('s_go').onclick = () => {
        const y = +$('s_year').value, m = +$('s_month').value, d = +$('s_day').value;
        if (y && m && d) { this.date = new Date(y, m - 1, d, 12, 0, 0); this.playing = false; $('s_play').textContent = '▶ הפעל'; }
      };
      document.querySelectorAll('#view-system3d .segmented button').forEach(b => { b.onclick = () => this._setMode(b.dataset.cam); });
      const pc = $('s_planets');
      if (pc) pc.onchange = () => { this.showPlanets = pc.checked; if (this.mode === 'helio') this._reframe(); };
      const jl = $('s_jumpLun');
      if (jl) jl.onclick = () => { try { const e = AE.SearchLunarEclipse(this.date); this.date = e.peak.date; this.playing = false; $('s_play').textContent = '▶ הפעל'; this._syncDate(); } catch (er) {} };
      const js = $('s_jumpSol');
      if (js) js.onclick = () => { try { const e = AE.SearchGlobalSolarEclipse(this.date); this.date = e.peak.date; this.playing = false; $('s_play').textContent = '▶ הפעל'; this._syncDate(); } catch (er) {} };
    },
  };

  window.Sims.system3d = sim;
})();
