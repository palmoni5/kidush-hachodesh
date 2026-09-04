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
  const T = s => (window.I18N ? window.I18N.t(s) : s);
  const RAD = Math.PI / 180;

  // ── קני מידה לתצוגה (לא פיזיקליים — לקריאוּת) ──────────────────────────
  const AU_K     = 22;   // רדיוס מסלול = AU_K · √(מרחק ב-AU)  (דחיסה לאורבית קריא)
  const MOON_VIS = 6;    // רדיוס מסלול הירח סביב הארץ (מוגדל)
  const R_SUN = 4, R_EARTH = 1.4, R_MOON = 0.6;
  const EPS = 23.4392911 * RAD;              // נטיית המלקה J2000 (להמרה משוונית→אקליפטית)
  const COS_EPS = Math.cos(EPS), SIN_EPS = Math.sin(EPS);

  function orbitR(au) { return AU_K * Math.sqrt(au); }
  const UP = new THREE.Vector3(0, 1, 0);

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

  // ── קבועים פיזיקליים לחישוב הצללים (ק"מ) ───────────────────────────────
  // רדיוס הארץ מוגדל ב-2% — כמנהג חשבון הליקויים (תיקון דנז'ון לאטמוספרה,
  // המרחיבה בפועל את צל הארץ). האומברה והפנומברה נגזרות מיחסי המשולשים.
  const KM_AU = 149597870.7, KM_SUN = 695700, KM_EARTH = 6378.14 * 1.02, KM_MOON = 1737.4;

  // חרוט האומברה המצויר: רדיוס בבסיס (אצל הארץ) וגובה עד קדקוד החרוט.
  // הגובה נבחר כך שברדיוס מסלול הירח המצויר (MOON_VIS) יהיה רוחב האומברה
  // כפליים מרדיוס הירח המצויר — קרוב ליחס האמיתי (≈2.7) בקנה-מידה הדחוס.
  const CONE_R = 1.6, CONE_H = 24;
  const coneRadiusAt = x => CONE_R * Math.max(0, 1 - x / CONE_H);

  // ── מצב פנימי ──────────────────────────────────────────────────────────
  let inited = false, renderer, scene, camera, controls;
  let eclGrid = null, eclGridKey = '', moonLatLine;   // רשת מישור המלקה וקו רוחב הירח
  let sun, earth, moon, light, ambient, earthOrbit, moonOrbit, earthMoonLine;
  let shadowCone, penumbraCone, moonCone, stars;
  let lastLight = null;   // ערכת הרקע (בהיר/כהה) שהסצנה מכוונת אליה כעת
  // יוניפורמים של צל הארץ על הירח (ביחידות רדיוס-ירח, במרחב-הגוף של הירח)
  const moonU = {
    uAxis:  { value: new THREE.Vector3(0, 1, 0) },   // ציר הצל
    uOff:   { value: new THREE.Vector3() },          // מהציר אל מרכז הירח
    uUmbra: { value: 0 }, uPen: { value: 0 }, uOn: { value: 0 },
  };
  const labels = {};
  let curW = 0, curH = 0;
  let ecCache = null;
  let moonOrbitKey = null;   // מפתח throttle לחישוב-מחדש של טבעת הירח לפי התאריך

  function tex(key) {
    const url = window.ASSETS && window.ASSETS[key];
    if (!url) return null;
    return new THREE.TextureLoader().load(url, () => { try { window.__invalidate(); } catch (e) {} });
  }

  // הכהיית צבע hex (מחרוזת/מספר) — לרקע האיור הבהיר, שבו הצבעים הבהירים נבלעים
  function shadeHexStr(hex, f) {
    const n = parseInt(hex.slice(1, 7), 16), m = v => Math.round(v * f);
    return `rgb(${m((n >> 16) & 255)},${m((n >> 8) & 255)},${m(n & 255)})`;
  }
  const shadeNum = (c, f) =>
    (Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f);
  const isLight = () => document.body.classList.contains('ill-light');

  // התווית מציירת את התרגום העדכני של המקור העברי; paintLabel מאפשר
  // רענון בעת החלפת שפה (repaintLabels) בלי לבנות את הספרייט מחדש.
  function paintLabel(sp) {
    const cv = sp.userData.cv, c = cv.getContext('2d');
    c.clearRect(0, 0, 256, 64);
    c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = isLight() ? shadeHexStr(sp.userData.color, 0.55) : sp.userData.color;
    c.fillText(T(sp.userData.src), 128, 32);
    sp.material.map.needsUpdate = true;
  }
  function makeLabel(text, color, scale) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
    sp.userData = { cv, src: text, color };
    paintLabel(sp);
    const s = scale || 1; sp.scale.set(12 * s, 3 * s, 1);
    return sp;
  }
  function repaintLabels() {
    if (!inited) return;
    for (const k in labels) paintLabel(labels[k]);
    for (const p of PLANETS) if (p.labelObj) paintLabel(p.labelObj);
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

    stars = starfield(); scene.add(stars);

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

    // הירח — חומר סטנדרטי שהוזרק לו הצל של הארץ (ליקוי לבנה). התאורה לבדה
    // אינה יכולה להחשיך אותו: מבחינת המנוע האור מגיע ישירות מהשמש, ואין
    // חסימה. לכן הצל מחושב אנליטית (ראו moonShadow) ומוחל בשיידר על הפיקסלים
    // שנופלים בתוך חרוט הצל — כך נראית קשת הצל העגולה על הצד המואר.
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, map: tex('moon_real'), roughness: 1, metalness: 0 });
    moonMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, moonU);
      const decl = [
        'varying vec3 vEclPos;',
        'uniform vec3 uAxis;', 'uniform vec3 uOff;',
        'uniform float uUmbra;', 'uniform float uPen;', 'uniform float uOn;', '',
      ].join('\n');
      sh.vertexShader = 'varying vec3 vEclPos;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>', '#include <begin_vertex>\n  vEclPos = position;');
      sh.fragmentShader = decl + sh.fragmentShader.replace('#include <tonemapping_fragment>', `
  if (uOn > 0.5) {
    vec3 p = vEclPos / ${R_MOON.toFixed(4)};              // ביחידות רדיוס-ירח
    vec3 q = p - uAxis * dot(p, uAxis) + uOff;            // מציר הצל אל הנקודה
    float d = length(q);
    float lit = smoothstep(uUmbra, uPen, d);              // 0=אומברה, 1=מחוץ לצל
    vec3 copper = vec3(1.0, 0.30, 0.11);                  // אודם הליקוי המלא
    gl_FragColor.rgb *= mix(copper, vec3(1.0), lit) * mix(0.26, 1.0, lit * lit);
  }
#include <tonemapping_fragment>`);
    };
    moon = new THREE.Mesh(new THREE.SphereGeometry(R_MOON, 40, 40), moonMat);
    scene.add(moon);

    earthOrbit = helioOrbit(AE.Body.Earth, EARTH_PERIOD, 0x88aaff); scene.add(earthOrbit);
    moonOrbit  = loopFromPoints(moonOrbitPoints(ORBIT_EPOCH), 0xaaaaaa); scene.add(moonOrbit);

    earthMoonLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({ color: 0xffcc55, dashSize: 1.5, gapSize: 1.5, transparent: true, opacity: 0.5 }));
    scene.add(earthMoonLine);

    // חרוט צל הארץ (אומברה) — לכיוון מנוגד לשמש; הירח המלא הנכנס אליו = ליקוי לבנה.
    // מצוירת רק הדופן האחורית (BackSide): כך גוף שנמצא בתוך החרוט נראה כמות
    // שהוא ואינו מתכהה פעמיים — פעם מן החישוב ופעם מן הדופן הקדמית שלפניו.
    shadowCone = new THREE.Mesh(
      new THREE.ConeGeometry(CONE_R, CONE_H, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x101018, transparent: true, opacity: 0.42, side: THREE.BackSide, depthWrite: false }));
    scene.add(shadowCone);

    // הפנומברה — צל חלקי המתרחב מן הארץ. ירח שנכנס אליה בלבד מעומעם קלות
    // (ליקוי צל-קדמי), וכשהוא נכנס לאומברה נראית קשת הצל החדה.
    penumbraCone = new THREE.Mesh(
      new THREE.CylinderGeometry(CONE_R * 2.25, CONE_R, CONE_H, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x2a2a3a, transparent: true, opacity: 0.13, side: THREE.BackSide, depthWrite: false }));
    scene.add(penumbraCone);

    // חרוט צל הירח — קדקודו מגיע בקושי אל הארץ; היכן שהוא פוגע בה = ליקוי חמה
    moonCone = new THREE.Mesh(
      new THREE.ConeGeometry(R_MOON * 0.98, MOON_VIS * 1.06, 26, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x101018, transparent: true, opacity: 0.45, side: THREE.BackSide, depthWrite: false }));
    scene.add(moonCone);

    // כוכבי לכת — כדורים מוארים + טבעת מסלול + תווית
    for (const p of PLANETS) {
      p.mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 32, 32),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 1, metalness: 0 }));
      p.ringObj = helioOrbit(AE.Body[p.key], p.period, p.color, 0.22);
      p.labelObj = makeLabel(p.he, '#' + p.color.toString(16).padStart(6, '0'), 0.7);
      p.mesh.visible = p.ringObj.visible = p.labelObj.visible = false;
      scene.add(p.mesh); scene.add(p.ringObj); scene.add(p.labelObj);
    }

    // קו רוחב הירח — מן הירח אל מישור המלקה שעובר בארץ (ניצב למישור): אורכו
    // הוא רוחב הירח (עד ~5°), והוא הניכר במבט מצד המלקה
    moonLatLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.85 }));
    scene.add(moonLatLine);

    labels.sun = makeLabel('שמש', '#ffd24a');
    labels.earth = makeLabel('ארץ', '#88bbff');
    labels.moon = makeLabel('ירח', '#dddddd');
    for (const k in labels) scene.add(labels[k]);

    inited = true;
  }

  // התאמת הסצנה לרקע האיור (בהיר/כהה). הצבעים המקוריים כוונו לרקע כהה בלבד:
  // ברקע בהיר חרוטי הצל הכהים צרמו, הכוכבים הלבנים והקווים הבהירים נעלמו —
  // ובכהה החרוטים (שצבעם היה כהה כמעט כרקע) לא נראו כלל. כאן כל ערכה מקבלת
  // גוונים משלה: בכהה הצללים בהירים מעט מהרקע, בבהיר — כהים ורכים.
  // רשת מישור המלקה (y=0 — מישור מסלול הארץ): קווים, ולא משטח, כדי שתיראה
  // כקו גם במבט מצד המלקה. נבנית מחדש כשמשתנים הרדיוס (מבט/כוכבי לכת) או הערכה.
  function ensureEclGrid(radius) {
    const l = isLight(), key = radius.toFixed(1) + '|' + l;
    if (eclGrid && eclGridKey === key) return;
    if (eclGrid) { scene.remove(eclGrid); eclGrid.geometry.dispose(); eclGrid.material.dispose(); }
    eclGridKey = key;
    eclGrid = new THREE.PolarGridHelper(radius, 12, 4, 96, l ? 0x4a5a8a : 0x8fa4d8, l ? 0x4a5a8a : 0x8fa4d8);
    eclGrid.material.transparent = true; eclGrid.material.opacity = l ? 0.28 : 0.22;
    eclGrid.material.depthWrite = false;
    scene.add(eclGrid);
  }

  function applyIllTheme() {
    const l = isLight();
    if (l === lastLight) return;
    lastLight = l;
    moonLatLine.material.color.setHex(l ? 0x3a4560 : 0xdddddd);
    stars.visible = !l;
    shadowCone.material.color.setHex(l ? 0x2c3350 : 0x8a9cc8);
    shadowCone.material.opacity = l ? 0.22 : 0.30;
    penumbraCone.material.color.setHex(l ? 0x3a4468 : 0x9cb0dc);
    penumbraCone.material.opacity = l ? 0.10 : 0.12;
    moonCone.material.color.setHex(l ? 0x2c3350 : 0x8a9cc8);
    moonCone.material.opacity = l ? 0.28 : 0.35;
    earthOrbit.material.color.setHex(l ? 0x3558b8 : 0x88aaff);
    moonOrbit.material.color.setHex(l ? 0x5a6480 : 0xaaaaaa);
    earthMoonLine.material.color.setHex(l ? 0x9a7414 : 0xffcc55);
    for (const p of PLANETS) p.ringObj.material.color.setHex(l ? shadeNum(p.color, 0.62) : p.color);
    repaintLabels();
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

  // ניווט בין ליקויים — Astronomy Engine מחפש רק קדימה, ולכן "הליקוי הקודם"
  // נמצא בסריקה קדימה מנקודה שלפני התאריך (400 יום מספיקים: בכל שנה יש
  // לפחות שני ליקויי חמה, ולבנה — כולל צל-קדמי — לרוב שניים עד שלושה),
  // ולקיחת האחרון שקדם לרגע הנוכחי.
  const GUARD = 60000;    // דקה — כדי שהליקוי שכבר מוצג לא ייתפס כ"הבא"/"הקודם"
  function seekEcl(t, lunar) {
    try { return lunar ? AE.SearchLunarEclipse(t) : AE.SearchGlobalSolarEclipse(t); } catch (e) { return null; }
  }
  // "הבא" — SearchLunarEclipse מחזירה את הליקוי שקדקודו בסביבת רגע החיפוש, ולכן
  // חיפוש מן הליקוי המוצג עצמו (ואפילו דקה אחריו) החזיר שוב את אותו ליקוי והכפתור
  // נתקע. לכן מדלגים עם Next* עד שהתוצאה מאוחרת ממש מן התאריך המוצג.
  function nextEcl(date, lunar) {
    const lim = date.getTime() + GUARD;
    let e = seekEcl(date, lunar);
    for (let i = 0; i < 4 && e && e.peak.date.getTime() < lim; i++) {
      try { e = lunar ? AE.NextLunarEclipse(e.peak) : AE.NextGlobalSolarEclipse(e.peak); } catch (er) { return null; }
    }
    return e;
  }
  function prevEcl(date, lunar) {
    const lim = date.getTime() - GUARD;
    let cur = seekEcl(new Date(date.getTime() - 400 * 86400000), lunar), last = null;
    for (let i = 0; i < 40 && cur; i++) {
      if (cur.peak.date.getTime() >= lim) break;
      last = cur;
      try { cur = lunar ? AE.NextLunarEclipse(cur.peak) : AE.NextGlobalSolarEclipse(cur.peak); } catch (e) { break; }
    }
    return last;
  }

  // ── עדכון הסצנה לרגע-זמן ולמבט נוכחי ──────────────────────────────────
  function update(date, mode, showPlanets, showCones, showEcl) {
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

    // מישור המלקה: רשת סביב הגוף המרכזי (עד למסלול הארץ/השמש, או עד נפטון עם
    // כוכבי הלכת), וקו רוחב הירח — מן הירח אל המישור, ניצב לו
    ensureEclGrid(showPlanets ? orbitR(30.07) * 1.05 : orbitR(1) * 1.15);
    eclGrid.visible = !!showEcl;
    moonLatLine.visible = !!showEcl;
    moonLatLine.geometry.setFromPoints([pMoon, new THREE.Vector3(pMoon.x, pEarth.y, pMoon.z)]);

    // חרוטי הצל — בשני המבטים כאחד (הצל קיים תמיד; המבט אינו משנה דבר).
    // ציר צל הארץ הוא הקו שמן השמש דרך הארץ, כלומר הכיוון המנוגד לשמש.
    const antiSun = dirSun.clone().negate();
    shadowCone.position.copy(pEarth).addScaledVector(antiSun, CONE_H / 2);
    shadowCone.quaternion.setFromUnitVectors(UP, antiSun);
    penumbraCone.position.copy(shadowCone.position);
    penumbraCone.quaternion.copy(shadowCone.quaternion);
    // צל הירח — לכיוון המנוגד לשמש כפי שהוא מן הירח (וקטור שמש→ירח האמיתי)
    const moonAnti = geoMoon.clone().sub(geoSun).normalize();
    moonCone.position.copy(pMoon).addScaledVector(moonAnti, MOON_VIS * 0.53);
    moonCone.quaternion.setFromUnitVectors(UP, moonAnti);
    shadowCone.visible = penumbraCone.visible = moonCone.visible = showCones;

    // ── צל הארץ על הירח (ליקוי לבנה) ────────────────────────────────────
    // גאומטריה אמיתית בק"מ: רוחב האומברה והפנומברה במרחק הירח, ומרחק מרכז
    // הירח מציר הצל. היחסים מומרים לקנה-המידה של החרוט המצויר, כך שהצל על
    // הירח והחרוט שעל המסך מתחילים ונגמרים באותו רגע.
    const proj = geoMoon.dot(antiSun);                      // רכיב לאורך ציר הצל (AU)
    let ecl = null;
    if (proj > 0) {
      const perp = geoMoon.clone().addScaledVector(antiSun, -proj);   // מהציר אל הירח
      const sepKm = perp.length() * KM_AU;
      const dsKm = geoSun.length() * KM_AU, dmKm = geoMoon.length() * KM_AU;
      const uKm = KM_EARTH - dmKm * (KM_SUN - KM_EARTH) / dsKm;       // רדיוס האומברה
      const pKm = KM_EARTH + dmKm * (KM_SUN + KM_EARTH) / dsKm;       // רדיוס הפנומברה
      const k = coneRadiusAt(MOON_VIS * (proj / (geoMoon.length() || 1))) / uKm;  // יחידות-ציור לק"מ
      const uSep = sepKm * k / R_MOON, uUmb = uKm * k / R_MOON, uPen = pKm * k / R_MOON;
      if (uSep < uPen + 1) {
        moonU.uOn.value = 1;
        moonU.uUmbra.value = uUmb; moonU.uPen.value = uPen;
        const inv = moon.quaternion.clone().invert();
        moonU.uAxis.value.copy(antiSun).applyQuaternion(inv);
        moonU.uOff.value.copy(perp).normalize().multiplyScalar(uSep).applyQuaternion(inv);
        // גודל הליקוי (מגניטודה) — לפי הגאומטריה האמיתית, לא לפי הציור
        ecl = { umbral: (uKm + KM_MOON - sepKm) / (2 * KM_MOON),
                penumbral: (pKm + KM_MOON - sepKm) / (2 * KM_MOON) };
      } else moonU.uOn.value = 0;
    } else moonU.uOn.value = 0;

    const en = $('s_eclNow');
    if (en) {
      en.textContent = !ecl || ecl.penumbral <= 0 ? '—'
        : ecl.umbral >= 1 ? T('ליקוי לבנה מלא')
        : ecl.umbral > 0 ? T('ליקוי לבנה חלקי') + ' · ' + Math.round(ecl.umbral * 100) + '%'
        : T('צל-קדמי (פנומברה)');
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
    const sp = $('s_phase'); if (sp) sp.textContent = T(phaseLabel(elong));
    const sc = $('s_pct'); if (sc) sc.textContent = Math.round(illum * 100) + '%';

    // רוחב הירח — נטייתו ממישור המלקה במעלות ("רוחב הירח" שברמב"ם הלכות
    // קידוש החודש פט"ז): חיובי = צפוני (לעבר קוטב המלקה הצפוני), שלילי =
    // דרומי. בשעת ליקוי הוא קרוב לאפס — הירח על מישור המלקה בקיבוץ/ניגוד.
    const sl = $('s_lat');
    if (sl) {
      let mlat = null;
      try { mlat = AE.EclipticGeoMoon(time).lat; } catch (e) {}
      sl.textContent = mlat === null ? '—'
        : Math.abs(mlat).toFixed(2) + '° ' + T(mlat >= 0 ? 'צפוני' : 'דרומי');
    }

    // HUD — ליקויים
    const ec = eclipses(date);
    const fmt = e => e ? `${e.date.toLocaleDateString(window.I18N ? window.I18N.dateLocale : 'he-IL', { day: 'numeric', month: 'short', year: 'numeric' })} (${T(EK[e.kind] || e.kind)})` : '—';
    const el1 = $('s_eclLun'); if (el1) el1.textContent = fmt(ec.lun);
    const el2 = $('s_eclSol'); if (el2) el2.textContent = fmt(ec.sol);
  }

  // ── אובייקט האיור (תואם ל-window.Sims) ────────────────────────────────
  const sim = {
    date: new Date(),
    mode: 'helio',
    showPlanets: false,
    showCones: true,
    showEcl: true,
    playing: false,
    speed: 1,
    _bound: false,

    step(dt) { this.date = new Date(this.date.getTime() + this.speed * dt * 86400000); },

    draw() {
      if (typeof THREE === 'undefined') return;
      if (!inited) init();
      applyIllTheme();
      resize();
      update(this.date, this.mode, this.showPlanets, this.showCones, this.showEcl);
      renderer.render(scene, camera);

      const sd = $('s_date');
      if (sd) sd.textContent = this.date.toLocaleDateString(window.I18N ? window.I18N.dateLocale : 'he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
      this._syncHebrew();
    },

    _syncHebrew() {
      const el = $('s_date_he'); if (!el || !window.HebrewDate) return;
      window.HebrewDate(this.date).then(s => { if (el && s) el.textContent = s; });
    },

    _syncDate() {
      const d = this.date, dy = $('s_day'), dm = $('s_month'), dyr = $('s_year');
      if (dy && !window.__fieldLocked(dy)) dy.value = d.getDate();
      if (dm && !window.__fieldLocked(dm)) dm.value = d.getMonth() + 1;
      if (dyr && !window.__fieldLocked(dyr)) dyr.value = d.getFullYear();
    },

    sync() { this._syncDate(); },

    _setMode(m) {
      this.mode = m;
      document.querySelectorAll('#view-system3d .segmented button').forEach(b => b.classList.toggle('active', b.dataset.cam === m));
      const lbl = $('s_view'); if (lbl) lbl.textContent = m === 'helio' ? T('מבט הליוצנטרי') : T('מבט גאוצנטרי');
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

    // העמדת המצלמה במישור המלקה עצמו ('edge' — המישור נראה כקו, והשמש, הארץ
    // וכוכבי הלכת עליו, והירח סוטה ממנו כרוחבו) או מעליו ('top' — מצד קוטב
    // המלקה הצפוני), במרחק הנוכחי מן המוקד. היסט זעיר מונע ניוון של OrbitControls.
    _lookFrom(kind) {
      if (!inited) return;
      const off = camera.position.clone().sub(controls.target), d = off.length() || 55;
      if (kind === 'edge') {
        off.y = 0; if (off.lengthSq() < 1e-6) off.set(1, 0, 0);
        off.setLength(d); off.y = d * 0.002;
      } else off.set(0, d, d * 0.002);
      camera.position.copy(controls.target).add(off);
      controls.update();
      try { window.__invalidate(); } catch (e) {}
    },

    bind() {
      if (this._bound) return; this._bound = true;
      this._syncDate();
      const ce = $('s_camEdge'); if (ce) ce.onclick = () => this._lookFrom('edge');
      const ct = $('s_camTop'); if (ct) ct.onclick = () => this._lookFrom('top');
      const ec = $('s_ecl');
      if (ec) { ec.checked = this.showEcl; ec.onchange = () => { this.showEcl = ec.checked; }; }
      $('s_play').onclick = e => { this.playing = !this.playing; e.target.textContent = this.playing ? T('⏸ השהה') : T('▶ הפעל'); };
      $('s_today').onclick = () => { this.date = new Date(); this.playing = false; $('s_play').textContent = T('▶ הפעל'); this._syncDate(); };
      $('s_speed').oninput = e => { this.speed = +e.target.value; $('s_spdL').textContent = (+e.target.value).toFixed(1); };
      $('s_go').onclick = () => {
        const y = +$('s_year').value, m = +$('s_month').value, d = +$('s_day').value;
        if (y && m && d) { this.date = new Date(y, m - 1, d, 12, 0, 0); this.playing = false; $('s_play').textContent = T('▶ הפעל'); }
      };
      document.querySelectorAll('#view-system3d .segmented button').forEach(b => { b.onclick = () => this._setMode(b.dataset.cam); });
      const pc = $('s_planets');
      if (pc) pc.onchange = () => { this.showPlanets = pc.checked; if (this.mode === 'helio') this._reframe(); };
      const cc = $('s_cones');
      if (cc) { cc.checked = this.showCones; cc.onchange = () => { this.showCones = cc.checked; }; }
      // ארבעה כפתורי ניווט: קודם/הבא לכל אחד מסוגי הליקוי, בנפרד
      const jump = (id, lunar, back) => {
        const b = $(id); if (!b) return;
        b.onclick = () => {
          const e = back ? prevEcl(this.date, lunar) : nextEcl(this.date, lunar);
          if (!e) return;
          this.date = e.peak.date;
          this.playing = false; $('s_play').textContent = T('▶ הפעל'); this._syncDate();
        };
      };
      jump('s_lunPrev', true, true);  jump('s_lunNext', true, false);
      jump('s_solPrev', false, true); jump('s_solNext', false, false);
    },
  };

  // רענון תוויות התלת-מימד בהחלפת שפה (נקרא מ-app.js)
  sim.onLanguage = () => { repaintLabels(); };

  window.Sims.system3d = sim;
})();
