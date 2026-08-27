// i18n/en.js — English dictionary.
// המפתחות הם מחרוזות המקור בעברית (ראו js/i18n.js); מחרוזת שאינה כאן תוצג בעברית.
// כללי תרגום (משוב משתמשים): מונח תורני שיש לו תרגום מבטא מוצג דו-לשונית —
// "Aries (טלה)"; מונח שתרגומו המילולי ריק ממשמעות (שרי השעות) נשאר בעברית
// בלבד — פשוט בלי רשומה כאן; והסברים באנגלית פשוטה וקריאה, לא טכנית.
"use strict";
window.TRANSLATIONS = window.TRANSLATIONS || {};
window.TRANSLATIONS.en = {
  // ── כללי ─────────────────────────────────────────────────────────────
  'קידוש החודש': 'Kiddush HaChodesh',
  'מופעי הירח': 'Moon Phases',
  'מהלך השמש (שנת חמה)': 'Sun’s Path (Solar Year)',
  'כוכבי הלכת': 'Planets',
  'גלגל המזלות': 'גלגל המזלות (Zodiac Wheel)',
  'קו התאריך': 'Date Line',
  'מערכת תלת-מימד': '3D System',
  // קידומת התאריך העברי בלילה (מהשקיעה עד עלות השחר): "אור לז׳ אלול"
  'אור ל': 'Eve of ',
  '☀ רקע בהיר': '☀ Light background',
  '🌙 רקע כהה': '🌙 Dark background',
  '▶ הפעל': '▶ Play',
  '⏸ השהה': '⏸ Pause',
  'מהירות:': 'Speed:',
  'ימים/שנייה': 'days/sec',
  'שעות/שנייה': 'hours/sec',
  '/שנייה': '/sec',
  'ימים': 'days',
  'שעות': 'hours',
  'מקרא': 'Legend',
  'ראה עוד ▾': 'Read more ▾',
  'הסתר ▴': 'Hide ▴',
  'בקרה': 'Controls',
  'בקרת זמן': 'Time controls',
  'תאריך': 'Date',
  'עברי': 'Hebrew date',
  'שעה': 'Hour',
  'יום': 'Day',
  'חודש': 'Month',
  'שנה': 'Year',
  'דקות': 'Minutes',
  'דק׳': 'min',
  'בשעה': 'at',
  'הצג': 'Show',
  'חשב': 'Compute',
  'איפוס': 'Reset',
  'הכנס תאריך': 'Enter date',
  'הכנס תאריך ושעה': 'Enter date and time',
  'מיקום הצופה': 'Observer location',
  'עיר': 'City',
  'מותאם אישית': 'Custom',
  'הגדל': 'Increase',
  'הקטן': 'Decrease',
  'לחצו ▶ הפעל כדי להניע את הסיבוב': 'Press ▶ Play to animate',
  'גררו לסיבוב · ▶ הפעל להנעה': 'Drag to rotate · ▶ Play to animate',

  // ── כיוונים ועונות ───────────────────────────────────────────────────
  'צפון': 'North', 'דרום': 'South', 'מזרח': 'East', 'מערב': 'West',
  'צפון-מזרח': 'North-East', 'דרום-מזרח': 'South-East',
  'דרום-מערב': 'South-West', 'צפון-מערב': 'North-West',
  'קיץ': 'Summer', 'חורף': 'Winter', 'שוויון': 'Equinox', 'אביב': 'Spring',
  'קו ההיפוך הצפוני': 'Tropic of Cancer',
  'קו ההיפוך הדרומי': 'Tropic of Capricorn',
  'ציר העולם': 'Celestial axis',
  'זניט': 'Zenith',

  // ── חודשים לועזיים ───────────────────────────────────────────────────
  'ינואר': 'January', 'פברואר': 'February', 'מרץ': 'March', 'אפריל': 'April',
  'מאי': 'May', 'יוני': 'June', 'יולי': 'July', 'אוגוסט': 'August',
  'ספטמבר': 'September', 'אוקטובר': 'October', 'נובמבר': 'November', 'דצמבר': 'December',

  // ── ימי השבוע ────────────────────────────────────────────────────────
  'ראשון': 'Sunday', 'שני': 'Monday', 'שלישי': 'Tuesday', 'רביעי': 'Wednesday',
  'חמישי': 'Thursday', 'שישי': 'Friday', 'שבת': 'Shabbos',
  'יום א׳': 'Sunday', 'יום ב׳': 'Monday', 'יום ג׳': 'Tuesday', 'יום ד׳': 'Wednesday',
  'יום ה׳': 'Thursday', 'יום ו׳': 'Friday',
  'א׳': 'Sun', 'ב׳': 'Mon', 'ג׳': 'Tue', 'ד׳': 'Wed', 'ה׳': 'Thu', 'ו׳': 'Fri', 'ש׳': 'Shab',
  'ליל': 'the night of',

  // ── גרמי השמים ───────────────────────────────────────────────────────
  'שמש': 'Sun', 'ירח': 'Moon', 'לבנה': 'Moon', 'חמה': 'Sun',
  'כוכב': 'Mercury', 'כוכב חמה': 'Mercury', 'נוגה': 'Venus', 'מאדים': 'Mars',
  'צדק': 'Jupiter', 'שבתאי': 'Saturn', 'אורנוס': 'Uranus', 'נפטון': 'Neptune',
  'ארץ': 'Earth', 'הארץ': 'Earth', 'הירח': 'Moon', 'כדור הארץ': 'Earth',

  // ── מופעי הירח ───────────────────────────────────────────────────────
  'יום בחודש': 'Day of month',
  'אחוז הירח הנראה': 'Illuminated fraction',
  'זריחת הירח': 'Moonrise',
  'שקיעת הירח': 'Moonset',
  'מקום הצפייה': 'Viewing location',
  'השעה במקום': 'Local time there',
  'מקום': 'Place',
  'מולד': 'New moon',
  '🗓 הירח היום': '🗓 Moon today',
  'רגעים בחודש': 'Moments of the month',
  '🌑 קיבוץ (מולד)': '🌑 Conjunction (new moon)',
  '🌕 ניגוד (ירח במילואו)': '🌕 Opposition (full moon)',
  'ו׳ שעות מן המולד': '6 hours after the molad',
  'י״ח שעות מן המולד': '18 hours after the molad',
  'ג׳ ימים מן המולד': '3 days after the molad',
  'ז׳ ימים מן המולד': '7 days after the molad',
  'החודש הקודם': 'Previous month',
  'החודש הבא': 'Next month',
  'מולד = השמש והירח בקיבוץ, ואין הירח נראה. ניגוד = השמש והירח משני עברי הארץ, והוא ירח מלא (ובו באים ליקויי הלבנה). ג׳ ימים מן המולד — תחילת זמן ברכת הלבנה למנהג אשכנז, וז׳ ימים — למנהג הספרדים.':
    'The molad is the moment the Sun and Moon line up ("conjunction"). Around that moment the Moon cannot be seen at all. Opposition is the reverse: the Sun and Moon stand on opposite sides of the Earth, and the Moon is full (this is when lunar eclipses happen). Birkat HaLevanah may be said from three days after the molad by Ashkenazi custom, or from seven days by Sephardi custom.',
  'ו׳ שעות וי״ח שעות מן המולד — ראש השנה כ׳ ע״ב: "עשרים וארבעה שעי מכסי סיהרא" — כ״ד שעות שאין הלבנה נראית בהן סביב הקיבוץ; "לדידן — שית מעתיקא ותמני סרי מחדתא, לדידהו — שית מחדתא ותמני סרי מעתיקא". לבני ארץ ישראל ("לדידהו") שש השעות שלפני המולד הן מן הישנה ושמונה עשרה שלאחריו מן החדשה — ונמצא שהלבנה החדשה נראית כבר שש שעות מן המולד; ולבני בבל ("לדידן") שמונה עשרה שעות שלפני המולד ושש שעות שלאחריו — ואינה נראית עד שמונה עשרה שעות מן המולד. לחצו על הכפתורים והשוו את מראה הלבנה ואת מקומה בשמים בשני הרגעים — ובפרט בבחירת נהרדעא (עירו של שמואל) מול ירושלים ברשימת המקומות שלהלן.':
    'Six and eighteen hours after the molad — from Rosh Hashanah 20b: “for twenty-four hours the moon is covered.” The Moon is hidden for about a full day around the molad. How is that day split? For the people of Eretz Yisrael, six of those hours come before the molad and eighteen after it — so the new moon can first be seen six hours after the molad. For the people of Bavel it is the reverse: eighteen hours before and six after — so it is not seen until eighteen hours after the molad. Press the two buttons and compare how the Moon looks, and where it sits in the sky, at each moment — especially with Nehardea (Shmuel’s city) chosen against Jerusalem in the location list below.',
  'כל הזמנים הם לפי המולדות האמיתיים (ראו בלשונית הלוח העברי אודות המולד האמיתי).':
    'All times here follow the true moladot — the actual astronomical moments of conjunction (see the Hebrew-calendar tab about the true molad).',
  'הכפתורים מקפיצים את התאריך והשעה (המוצגים למעלה) אל הרגע המדויק של מועדים אלו בחודש המוצג — חודש הלבנה שהתאריך שבאיור נמצא בתוכו, מן המולד ועד המולד הבא. כפתורי "החודש הקודם" ו"החודש הבא" מעבירים את התצוגה חודש לבנה שלם אחורה או קדימה. כשהרגע חל בשעות היום הלבנה אינה נראית לעין — גם כשהיא מעל האופק — אלא בסמוך לשקיעה או אחר הזריחה; קדמו את השעה אל הערב (בשדות התאריך או בהפעלה) ותראו אותה בחלון השמים.':
    'These buttons jump the date and time shown above to the exact moment of each milestone in the lunar month on screen — the month that runs from one molad to the next. "Previous month" and "Next month" move a whole lunar month back or forward. If a moment lands in the daytime, you will not be able to see the Moon with your eye, even when it is above the horizon. Move the time to the evening — with the date fields or the Play button — and you will see it in the sky window.',
  'יום בחודש (גרירה)': 'Day of month (drag)',
  'שמש — מקור האור': 'Sun — the source of light',
  'ירח — מקיף את הארץ': 'Moon — orbiting Earth',
  'חודש הלבנה (סינודי) = 29.53 יום': 'Lunar (synodic) month = 29.53 days',
  '(= כ"ט יום י"ב שעות ותשצ"ג חלקים = הזמן שבין מולד למולד).':
    '(= 29 days, 12 hours and 793 chalakim = the time between one molad and the next).',
  'הצד המואר תמיד פונה אל השמש; מהארץ נראה רק חלקו, וכך נוצרים המופעים.':
    'The lit side always faces the Sun; from Earth we see only part of it — and that is what makes the phases.',
  'זמני זריחת הירח ושקיעתו מוצגים לתאריך המוצג באיור, לפי אופק המקום הנבחר ובשעונו — להמחשה בלבד.':
    'Moonrise and moonset are shown for the date in the diagram, at the chosen location and on its local clock — for illustration only.',
  'הירח מכדור הארץ': 'The Moon as seen from Earth',
  'הירח בשמים': 'Moon in the sky',
  'ביום אינה נראית לעין': 'not visible to the eye by day',
  'אור יום — אינה נראית לעין': 'daylight — not visible to the eye',
  'מיקום בשמים': 'Sky position',
  'חלון "הירח בשמים" מציג את מיקום הירח בכיפת השמים מעל המקום הנבחר לרגע שבאיור, בצורתו הנראית — כדרך שמחפשים אותו בקידוש החודש על פי הראייה ובברכת הלבנה. השמש מסומנת גם היא, להבנת קרבתם.':
    'The "Moon in the sky" window shows where the Moon is in the sky over the place you chose, at the moment shown in the diagram. It also draws the Moon in the shape it really looks. This is how people look for it when the month is sanctified by sighting, and for Birkas HaLevanah. The Sun is marked too, so you can see how close the two of them are.',
  'מקום הצפייה קובע את חלון "הירח בשמים", את מיקום הירח (כיוון וגובה) ואת זמני זריחתו ושקיעתו — והם מוצגים בשעון האזרחי של אותו מקום (כולל שעון קיץ), שהוא "השעה במקום" שב-HUD. מופע הירח ואחוז הארתו כמעט שווים בכל העולם, אך שעת ראייתו ומקומו בשמים משתנים ממקום למקום — וזה עיקר עניינו של קידוש החודש על פי הראייה.':
    'The viewing place sets three things: the "Moon in the sky" window, where the Moon is (its direction, and its height above the horizon), and its rise and set times. All of them are shown on that place’s ordinary clock, daylight saving included — that is the "Local time there" reading in the HUD. The Moon’s phase, and how much of it is lit, are almost the same all over the world. But the hour you can see it, and its spot in the sky, change from place to place. That is the very heart of sanctifying the month by sighting.',
  'התאריך והשעה שבשדות הבקרה נשארים בשעון המקומי של המכשיר; רגע אחד הוא לכל המקומות, וכל מקום רואה אותו בשעונו שלו.':
    'The date and time in the control fields remain in the device’s own clock; the moment is one and the same everywhere, and each place sees it by its own clock.',
  'נהרדעא — עירו של שמואל ומרכז ישיבות בבל, על נהר פרת סמוך למפגש נהר מלכא (בקירוב 33.4° צפון, 43.8° מזרח, באזור אנבר שבעיראק). היא מובאת כאן כדי להעמיד את "לדידן" של בני בבל מול "לדידהו" של בני ארץ ישראל שבראש השנה כ׳ ע״ב.':
    'Nehardea — the city of Shmuel and a center of the Babylonian yeshivos, on the Euphrates near its meeting with the Nahr Malka (roughly 33.4°N, 43.8°E, in the Anbar region of Iraq). It is offered here to set the “for us” of the Babylonians against the “for them” of the people of Eretz Yisrael in Rosh Hashanah 20b.',
  'לבנה שמעל האופק בשעות היום אינה נראית לעין מפני אור החמה, אלא בסמוך לשקיעה או אחר הזריחה — וראו רש"י שבת קנ"ו ע"א ד"ה אכיל לא דיליה: "כלבנה המסגת גבול החמה למשול אף ביום".':
    'A moon that is above the horizon during the day is washed out by the sunlight, so the eye cannot see it. You can catch it near sunset, or right after sunrise. See Rashi, Shabbos 156a s.v. achil lo dilei: “like the moon that oversteps the sun’s bound, to rule even by day.”',
  'מולד (ירח חדש)': 'New moon (molad)',
  'רבע ראשון': 'First quarter',
  'ירח מלא': 'Full moon',
  'רבע אחרון': 'Last quarter',
  'סהר מתמלא': 'Waxing crescent',
  'סהר מתמעט': 'Waning crescent',
  'גיבן מתמלא': 'Waxing gibbous',
  'גיבן מתמעט': 'Waning gibbous',

  // ── מהלך השמש ────────────────────────────────────────────────────────
  'שעון מקומי': 'Local time',
  'שעון מקומי — ירושלים': 'Local time — Jerusalem',
  'השמש מעל האופק': 'Sun above the horizon',
  'השמש מעל האופק ☀': 'Sun above the horizon ☀',
  'השמש מתחת לאופק 🌙': 'Sun below the horizon 🌙',
  'גובה השמש מעל האופק': 'Sun altitude above horizon',
  'זוית השמש מצפון/דרום לקו המשוה': 'Sun’s angle N/S of the equator',
  'זוית השמש מצפון/דרום למקום הצופה': 'Sun’s angle N/S of the observer',
  'עונה / תקופה': 'Season / Tekufah',
  'שעה שמשית (החצות האמיתי נחשב כ-12:00)': 'Solar time (true noon counted as 12:00)',
  'זריחה / שקיעה': 'Sunrise / Sunset',
  'אורך היום': 'Day length',
  'עומק בחצות הלילה': 'Depth at midnight',
  '🗓 עכשיו': '🗓 Now',
  '🕐 עכשיו': '🕐 Now',
  '↻ עכשיו': '↻ Now',
  '☀ חצות היום': '☀ True noon',
  '🌙 חצות הלילה': '🌙 True midnight',
  'שעה ביממה:': 'Hour of day:',
  'שעה ביממה (גרירה):': 'Hour of day (drag):',
  'קדם יום אחד בכל סיבוב': 'Advance one day per cycle',
  'סיבוב המבט (אזימוט):': 'View rotation (azimuth):',
  'יום בשנה / עונה': 'Day of year / Season',
  'ניסן': 'Nissan', 'תמוז': 'Tammuz', 'תשרי': 'Tishrei', 'טבת': 'Teves',
  'יום מתקופת ניסן:': 'Days since Tekufas Nissan:',
  'או לפי תאריך': 'or by date',
  'קו רוחב במעלות (צפון חיובי)': 'Latitude in degrees (north positive)',
  'קו אורך במעלות (מזרח חיובי)': 'Longitude in degrees (east positive)',
  'קו רוחב °': 'Latitude °',
  'קו אורך °': 'Longitude °',
  'השעון שבאיור הוא השעון האזרחי במקום הנבחר, כולל שעון קיץ. לצדו מוצגת השעה השמשית — שעון שבו רגע החצות האמיתי של אותו יום (מעבר השמש במרידיאן) נחשב 12:00 בדיוק, והשעות נמנות ממנו. כל ההבדל בין שני השעונים — שלושה הפרשים: שעון הקיץ; ההפרש שבין אזור הזמן לקו האורך של המקום — בירושלים, למשל, 5.24 מעלות מזרחית לקו האורך 30° שהשעון מכוון לפיו, שהן כ-21 דקות; והפרש "השעות העקומות" (משוואת הזמן). ב"מותאם אישית" אזור הזמן מוערך לפי קו האורך.':
    'The clock in the diagram is the ordinary civil clock of the place you chose, daylight saving included. Next to it is solar time. On that clock, the moment the Sun crosses due south that day — true noon, its meridian transit — counts as exactly 12:00, and the hours are counted from there. Three things make up the whole gap between the two clocks. First, daylight saving. Second, the gap between the time zone and the place’s own longitude — Jerusalem, for example, sits 5.24° east of the 30° meridian its clock is set by, which comes to about 21 minutes. Third, the equation of time — the small wobble in the Sun’s timekeeping over the course of the year. Under "Custom", the time zone is estimated from the longitude.',
  'אביב · ניסן': 'Spring · Nissan', 'קיץ · תמוז': 'Summer · Tammuz',
  'סתיו · תשרי': 'Autumn · Tishrei', 'חורף · טבת': 'Winter · Teves',
  'סתיו · ניסן': 'Autumn · Nissan', 'חורף · תמוז': 'Winter · Tammuz',
  'אביב · תשרי': 'Spring · Tishrei', 'קיץ · טבת': 'Summer · Teves',
  'תקופת ניסן': 'Tekufas Nissan', 'תקופת תמוז': 'Tekufas Tammuz',
  'תקופת תשרי': 'Tekufas Tishrei', 'תקופת טבת': 'Tekufas Teves',
  'יום תמידי': 'Continuous day', 'לילה תמידי': 'Continuous night',
  'זמני היום — לוח אוצריא': 'Halachic times — Otzaria calendar',
  'עיר (מרשימת הלוח)': 'City (from calendar list)',
  'זריחה מישורית': 'Sea-level sunrise',
  'זריחה (עם גובה)': 'Sunrise (with elevation)',
  'שקיעה מישורית': 'Sea-level sunset',
  'שקיעה (עם גובה)': 'Sunset (with elevation)',
  'חצות היום': 'Midday (chatzos)',
  'חצות הלילה': 'Midnight (chatzos)',
  '↻ רענן מהלוח': '↻ Refresh from calendar',
  'זמנים הלכתיים מחושבי לוח אוצריא (כולל גובה המקום), לתאריך המוצג באיור ולעיר שנבחרה כאן. ברירת המחדל — העיר הנבחרת באפליקציה, והיא מתעדכנת עם שינויה שם. כפתור הרענון מופיע רק כשהכרטיס נשאר מאחורי התאריך שבאיור — אחרי גרירת מחוון היום או הפעלת האנימציה.':
    'Halachic times computed by the Otzaria calendar (including elevation), for the date shown in the diagram and the city chosen here. Default: the city selected in the app, updating live when it changes. The refresh button appears only when the card has fallen behind the date in the diagram — after dragging the day slider or running the animation.',
  'מדוע מסלול השמש נודד בין קיץ לחורף?': 'Why does the Sun’s path wander between summer and winter?',
  'ציר הסיבוב של כדור הארץ נטוי כ־23.44° ממאונך למישור מסלולו סביב השמש, וכיוונו קבוע בחלל — הוא מצביע תמיד אל אותה נקודה בשמים. לכן בתקופת תמוז חצי הכדור הצפוני רכון אל השמש והיא נראית גבוה (מעל קו ההיפוך הצפוני), בתקופת טבת הוא רכון ממנה והלאה והיא נמוכה (מעל קו ההיפוך הדרומי), ובניסן ותשרי הציר ניצב לכיוון השמש — והיא מעל קו המשווה. לחצו על כפתורי התקופות או גררו את "יום מתקופת ניסן" — והארץ תנוע במסלולה.':
    'The Earth spins on an axis. That axis is tilted about 23.44° away from straight up out of its orbit, and it always points at the same spot in the sky. So at Tekufas Tammuz the northern half of the Earth leans toward the Sun, and the Sun looks high — over the northern tropic. At Tekufas Teves that half leans away, and the Sun is low — over the southern tropic. At Nissan and Tishrei the axis leans neither toward the Sun nor away from it, and the Sun stands over the equator. Press the tekufah buttons, or drag "Day from Tekufas Nissan", and the Earth will move along its orbit.',
  'ובמבט מן הארץ, כדרך חז״ל והרמב״ם: השמש מהלכת בגלגל הנוטה (גלגל המזלות), שחציו נוטה צפונה וחציו דרומה מקו המשווה — ולכן מסלולה היומי שבאיור הגדול נודד צפונה ודרומה במשך השנה. את הגלגל הנטוי עצמו רואים ב"מבט הצופה" שבלשונית גלגל המזלות.':
    'And here is the same thing as seen from the Earth, the way Chazal and the Rambam describe it. The Sun travels along a tilted wheel — the zodiac. Half of that wheel leans north of the equator and half leans south. That is why the Sun’s daily path in the main diagram drifts north and south through the year. The tilted wheel itself is shown in the "Observer view" of the Zodiac Wheel tab.',
  'המעגל הניצב לציר — קו המשווה': 'the circle perpendicular to the axis — the equator',
  'האותיות שעל הכדור: צ ו־ד הם קצות ציר הסיבוב — הקוטב הצפוני והקוטב הדרומי, והמעגל הניצב להם הוא קו המשווה, שהוא קו רוחב אפס (ראו המקרא שבשולי האיור). מזרח ומערב אינם מסומנים, שאינם נקודות קבועות באיור: הכדור מסתובב סביב אותו ציר פעם ביממה, וכל נקודה שבמשווה פונה במשך היום לכל הרוחות. את המזרח והמערב רואים באיור הגדול, שהוא מבט מן הארץ.':
    'The letters on the globe: N and S mark the two ends of the axis the globe spins on — the north and south poles. The circle that runs around the middle, square to that axis, is the equator, latitude zero. East and west are not marked, because they are not fixed points in this drawing. The globe spins on that axis once a day, so every point on the equator faces every direction in the course of the day. For east and west, look at the main diagram, which is the view from the Earth.',
  'הנקודה הצהובה שעל הכדור היא המקום שהשמש ניצבת מעליו באותו רגע, והיא מראה מעל איזה קו רוחב היא עומדת: בתקופות ניסן ותשרי היא על קו המשווה ממש, ובתמוז ובטבת על קווי ההיפוך של-23.44 מעלות צפונה ודרומה. קרן השמש נמשכת עד שפת הכדור בלבד, כדי שיהיה ניכר לאן היא מגיעה. האיור, ככל הלשונית, מחושב אסטרונומית: סימוני התקופות עומדים ברגעיהן האמיתיים, ולכן אינם מחלקים את השנה לרבעים שווים בזמן כתקופת שמואל — שהעונות האמיתיות אינן שוות באורכן (האביב והקיץ ארוכים מן הסתו והחורף) — אף שבמסלול עצמו הם רחוקים זה מזה תשעים מעלות בשווה.':
    'The yellow dot on the globe marks the place the Sun is standing straight over at that moment. It shows you which latitude the Sun is over: at the tekufos of Nissan and Tishrei it sits exactly on the equator, and at Tammuz and Teves on the tropics, 23.44° north and south. The Sun’s ray is drawn only as far as the edge of the globe, so you can see where it lands. This picture, like the whole tab, is worked out astronomically. The tekufah marks stand at their true moments. So they do not cut the year into four stretches equal in time, the way Tekufas Shmuel does — the true seasons are not equal in length, and spring and summer run longer than autumn and winter. Along the orbit itself, though, they are an even ninety degrees apart.',
  'ומפני מה נראה הכדור בתקופת ניסן כולו כמעט בצד הלילה, ובתשרי כולו מואר? משום שהאיור הוא מבט מן הצד, ובתקופת ניסן הארץ עומדת ביננו ובין השמש — ונמצא שאנו רואים את צדה שאינו מואר, ובתשרי היא מעבר לשמש ואנו רואים את צד היום — כענין מופעי הלבנה ממש. בשתי התקופות האלו הנקודה שהשמש מעליה על קו המשווה בשווה, וכשהיא נופלת בצד הרחוק של הכדור היא מסומנת כטבעת ריקה.':
    'Why is the globe almost all in night at the tekufah of Nissan, and fully lit at Tishrei? Because we are looking at it from the side. At the tekufah of Nissan the Earth stands between us and the Sun, so we see its unlit side. At Tishrei it is on the far side of the Sun, so we see its day side. It works exactly like the phases of the Moon. At both of these tekufos the point the Sun stands over is on the equator all the same, and when that point falls on the far side of the globe it is drawn as an empty ring.',
  'במבט־על אתם מביטים על הגלגל מבחוץ, מצדו הצפוני של מישור המזלות (מישור המלקה) — הארץ במרכז, ושנים־עשר המזלות סביבה כסדרם. זו מעין מפה ולא תמונה של הרקיע: היא מראה באיזה מזל עומד כל גרם, ולא את גובהו מעל האופק. לכן אף קו האופק מצויר בו כקו החוצה את הגלגל — קו החיתוך של מישור האופק של הצופה בגלגל — וחצי הגלגל המוצל הוא מה שמתחת לארץ. את הגובה שברקיע ממש רואים ב"מבט הצופה".':
    'In the top-down view you are looking at the wheel from outside, from the northern side of the flat plane the zodiac sits on — the ecliptic. The Earth is at the center, with the twelve signs around it in order. Think of it as a map, not a picture of the sky: it tells you which sign each body stands in, not how high it is above the horizon. That is why the horizon too is drawn as a line cutting across the wheel — the line where the flat horizon around the observer slices through it — and the shaded half of the wheel is what lies beneath the Earth. For real height in the sky, use the “Observer view”.',
  'השמש עומדת כעת מעל קו רוחב': 'The Sun now stands over latitude',
  'קו המשווה': 'the equator',
  'שנת החמה — הלכה': 'The solar year — Halachah',
  'תקופת שמואל': 'Tekufas Shmuel',
  '365 ימים 6 שעות': '365 days 6 hours',
  'תקופת רב אדא': 'Tekufas Rav Ada',
  "365י' 5ש' 997ח' 48ר'": '365d 5h 997ch 48r',
  'כל תקופה (של שמואל)': 'Each tekufah (of Shmuel)',
  '91 ימים 7.5 שעות': '91 days 7.5 hours',
  'ארבע התקופות הן נקודות הקיצון של מסלול השמש: ניסן/תשרי (שוויון), תמוז וטבת (הקיצון).':
    'The four tekufos are the extreme points of the Sun’s path: Nissan/Tishrei (equinoxes), Tammuz and Teves (solstices).',
  'לחצני התקופות שבאיור קופצים אל רגעי התקופה האמיתיים, המחושבים אסטרונומית — והם שונים מתקופת שמואל ומתקופת רב אדא, שהן שנות ממוצע. עיין רמב״ם הלכות קידוש החודש פרקים ט–י.':
    'The tekufah buttons in the diagram jump to the true moments of the tekufos, worked out astronomically. These are not the same as the tekufos of Shmuel or of Rav Ada, which both use an average year. See Rambam, Hilchos Kiddush HaChodesh, ch. 9–10.',
  'מצפון לקו המשוה: תמוז=קיץ, טבת=חורף. מדרום לקו המשוה: תמוז=חורף, טבת=קיץ.':
    'North of the equator: Tammuz=summer, Teves=winter. South of the equator: Tammuz=winter, Teves=summer.',
  'הזמנים באיור (זריחה, שקיעה, חצות, השעה השמשית ומיקום השמש) מחושבים אסטרונומית במדויק (Astronomy Engine) לגובה פני הים. ייתכנו הבדלים קלים מהלוחות בשל גובה המקום ושיטות החישוב — אין לסמוך עליהם להלכה.':
    'The times in the diagram — sunrise, sunset, chatzos, solar time and the Sun’s position — are worked out astronomically (by Astronomy Engine) for sea level. They can differ a little from printed calendars, because of a place’s elevation and because methods of calculation differ. Do not rely on them for halachah.',
  // ערים
  'ירושלים': 'Jerusalem', 'נהרדעא (בבל)': 'Nehardea (Babylonia)',
  'לייקווד': 'Lakewood', 'ניו יורק': 'New York', "לוס אנג'לס": 'Los Angeles',
  'מיאמי': 'Miami', 'טורונטו': 'Toronto', 'מקסיקו סיטי': 'Mexico City',
  'סאו פאולו': 'São Paulo', 'בואנוס איירס': 'Buenos Aires', 'לונדון': 'London',
  'פריז': 'Paris', 'אנטוורפן': 'Antwerp', 'מוסקבה': 'Moscow',
  'יוהנסבורג': 'Johannesburg', 'סידני': 'Sydney',

  // ── כוכבי הלכת ───────────────────────────────────────────────────────
  'שעון קיץ (+3)': 'Daylight saving (+3)',
  'הצג מיקום': 'Show position',
  'ברירת מחדל: ירושלים': 'Default: Jerusalem',
  'מקרא — גובה / אזימוט': 'Legend — altitude / azimuth',
  'מתחת לאופק': 'below horizon',

  // ── גלגל המלקה ───────────────────────────────────────────────────────
  // שמות המזלות מוצגים דו-לשונית; על הגלגל הם נפרקים לשתי שורות (ראו zodiac-sim.js)
  'טלה': 'Aries (טלה)', 'שור': 'Taurus (שור)', 'תאומים': 'Gemini (תאומים)', 'סרטן': 'Cancer (סרטן)',
  'אריה': 'Leo (אריה)', 'בתולה': 'Virgo (בתולה)', 'מאזניים': 'Libra (מאזניים)', 'עקרב': 'Scorpio (עקרב)',
  'קשת': 'Sagittarius (קשת)', 'גדי': 'Capricorn (גדי)', 'דלי': 'Aquarius (דלי)', 'דגים': 'Pisces (דגים)',
  'מזל עולה (במזרח)': 'Ascendant (in the east)',
  'מזל באמצע הרקיע': 'Midheaven sign',
  'ימים (מהלך המזלות בשנה)': 'Days (yearly motion)',
  'שעות (עליית המזלות ביממה)': 'Hours (daily rising)',
  'ראשי חודשים (הנידונים בר״ה ובב״מ)': 'Rosh Chodesh (discussed in R.H. & B.M.)',
  'ר״ח ניסן': 'R.Ch. Nissan', 'ר״ח שבט': 'R.Ch. Shevat', 'ר״ח אדר': 'R.Ch. Adar',
  'רגעי היום (לתאריך ולמקום המוצגים)': 'Moments of the day (for the date and place shown)',
  '🌅 זריחה': '🌅 Sunrise', '🌇 שקיעה': '🌇 Sunset', '🌙 חצות': '🌙 Midnight',
  'הרגעים מחושבים לתאריך ולמקום שנבחרו, ולא לשעת שעון קבועה — בירושלים השקיעה נעה בין 16:39 בטבת ל-19:47 בתמוז. ברגע הזריחה השמש עומדת בנקודה העולה, ולכן המזל העולה הוא המזל שהשמש בו; ברגע השקיעה היא בנקודה השוקעת שמנגד; ובחצות הלילה היא בנקודה הנמוכה שמתחת לארץ, והמזל שכנגדה עומד באמצע הרקיע.':
    'These moments are worked out for the date and place you chose, not for a fixed hour on the clock. In Jerusalem, sunset moves between 16:39 in Teves and 19:47 in Tammuz. At sunrise the Sun stands at the rising point, so the ascendant — the sign coming up in the east — is the sign the Sun is in. At sunset the Sun is at the setting point opposite it. At midnight it is at the lowest point beneath the Earth, and the sign opposite it stands at the midheaven, the top of the sky.',
  'מהו משווה השמים?': 'What is the celestial equator?',
  'עיגול גדול ברקיע, העומד כנגד קו המשווה של הארץ ממש — כאילו נמתח משווה הארץ ועלה עד הרקיע. הוא באמצע בין שני הקטבים השמימיים שסביבם סובב כל הרקיע פעם ביממה, וכל כוכב מהלך בסיבובו היומי במעגל המקביל לו. וגלגל המזלות נטוי עליו כ־23.44° — חציו צפונה ממנו וחציו דרומה.':
    ' A great circle in the sky standing directly over the Earth’s equator — as if the Earth’s equator were stretched outward until it reached the sky. It lies midway between the two celestial poles, around which the whole sky turns once a day, and every star travels its daily round on a circle parallel to it. The zodiac wheel is tilted to it by about 23.44° — half of it north of it and half south.',
  'למה הרצועה נראית נוטה תמיד לדרום?': 'Why does the band always appear to lean south?',
  'משום שהצופה עומד בקו רוחב צפוני. הציר שסביבו מסתובב כל הרקיע מצביע אל הקוטב השמימי שבצפון, וגובהו מעל האופק שוה בדיוק לקו הרוחב (בירושלים 31.8°); ממילא משווה השמים נמתח מנקודת המזרח, דרך הדרום בגובה 58° (90° פחות 31.8°), אל נקודת המערב — כל קמרונו בחצי הדרומי של הרקיע. ורצועת המזלות חובקת את משווה השמים, חציה עד 23.44° צפונה וחציה עד 23.44° דרומה, ולכן גם שיאה בדרום — בין 34° ל־82°. שנו את קו הרוחב שבכרטיס "האופק ומזל עולה" למינוס 31.8 (דרום) והתמונה תתהפך והרצועה תיטה לצפון; בקו רוחב 0 משווה השמים עובר ממש מעל הראש, ולכן הרצועה אינה נוטה עוד לצד אחד קבוע — אבל נטייתה אינה מתבטלת: היא נשארת נטויה 23.44° למשווה השמים, ובמשך היממה היא מתנדנדת סביב הזניט ונוטה חליפות צפונה ודרומה. גלגל המזלות עצמו עובר בדיוק מעל הראש רק ברגעים שנקודת השוויון — 0° טלה או 0° מאזניים — נמצאת בזניט.':
    ' Because the observer stands at a northern latitude. The whole sky turns around one axis, and that axis points at the celestial pole in the north. Its height above the horizon is exactly the latitude — 31.8° in Jerusalem. So the celestial equator — the line in the sky right above the Earth’s equator — runs from the east point, up through the south at a height of 58° (90° minus 31.8°), and down to the west point. Its whole arc lies in the southern half of the sky. The zodiac band straddles that line, half of it up to 23.44° north and half up to 23.44° south, so its highest point is in the south too — between 34° and 82°. Set the latitude in the "Horizon and ascendant" card to -31.8 (south) and the picture flips: now the band leans north. At latitude 0 the celestial equator passes straight overhead, so the band no longer leans to one fixed side. But its tilt does not vanish. It stays tilted 23.44° to the celestial equator, and through the day it sways around the zenith — the point straight overhead — leaning north and south by turns. The zodiac itself passes exactly overhead only at the moments when an equinox point — 0° Aries or 0° Libra — stands at the zenith.',
  'ולמה התנועה נראית מעוקלת?': 'And why does the motion look curved?',
  'שני טעמים. האחד: הסיבוב היומי אינו סביב הנקודה שמעל הראש אלא סביב הציר השמימי הנטוי שבצפון, ולכן כל גרם מהלך במעגל הנטוי לאופק בכ־58° — עולה במזרח באלכסון, מגיע לשיאו בדרום, ושוקע במערב באלכסון. והשני: האיור הוא היטל של כיפת הרקיע כולה על שטח שטוח, כמבט עדשה רחבה, וכל מעגל שבו נראה מתעקל. הגלגל עצמו מסתובב בשוה סביב צירו — העיקום הוא במבט ולא בגלגל.':
    ' Two reasons. First: the daily turning is not around the point straight overhead. It is around the tilted celestial axis in the north. So every body travels a circle that is tilted some 58° to the horizon — it rises in the east at a slant, reaches its high point in the south, and sets in the west at a slant. Second: the drawing squeezes the whole dome of the sky onto a flat surface, as through a wide-angle lens, and on such a picture every circle comes out curved. The wheel itself turns evenly around its axis — the bend is in the view, not in the wheel.',
  'ארבע התקופות (בשנת התאריך המוצג)': 'The four tekufos (in the year shown)',
  'נטיית הרצועה עצמה אינה משתנה כלל — הקבוע הוא הגלגל הנטוי. מה שנודד במשך השנה הוא מקום השמש שבו: בתקופת תמוז היא בקצה הצפוני שברצועה ולכן עולה גבוה, בתקופת טבת בקצה הדרומי ולכן נמוכה, ובניסן ובתשרי היא על משווה השמים עצמו. הלחיצה מעבירה אל רגע התקופה המדויק, המחושב אסטרונומית; בחרו "מבט הצופה" כדי לראות את גובה השמש שברקיע.':
    'The tilt of the band itself never changes — the tilted wheel is the one thing that stays put. What moves through the year is the Sun’s place upon it. At Tekufas Tammuz the Sun is at the northern end of the band, so it rises high. At Tekufas Teves it is at the southern end, so it stays low. At Nissan and Tishrei it is on the celestial equator itself. Pressing a button jumps to the exact, astronomically computed moment of that tekufah. Choose "Observer view" to see how high the Sun is in the sky.',
  'וכך הן מוגדרות בגלגל: תקופת ניסן היא תמיד כשהשמש מתחילה להכנס למזל טלה, תקופת תמוז — למזל סרטן, תקופת תשרי — למזל מאזנים, ותקופת טבת — למזל גדי (רמב״ם, הלכות קידוש החודש פ״ט ה״ג).':
    'And this is how they are defined on the wheel: Tekufas Nissan is always the moment the Sun begins to enter the sign of Taleh (Aries); Tekufas Tammuz — the sign of Sartan (Cancer); Tekufas Tishrei — the sign of Moznayim (Libra); and Tekufas Teves — the sign of Gedi (Capricorn). (Rambam, Hilchos Kiddush HaChodesh 9:3.)',
  'האופק ומזל עולה': 'Horizon and ascendant',
  'הצג את קו האופק ואת המזל העולה': 'Show the horizon line and the ascendant',
  'המזל העולה הוא הנקודה שבגלגל המזלות (הוא "גלגל המלקה") העולה באותו רגע באופק המזרחי. הגלגל כולו מסתובב סביב הארץ פעם ביממה, ולכן כל שנים-עשר המזלות עולים ושוקעים בכל יום — בערך מזל לכל שעתיים.':
    'The ascendant is the point of the zodiac rising at that moment on the eastern horizon. The whole wheel circles the Earth once a day, so all twelve signs rise and set every day — roughly one sign every two hours.',
  'כשהאופק מוצג, הגלגל מסובב לפי הרגע והמקום: המזרח (המזל העולה) בצד שמאל, המערב (השוקע) מנגד, וחצי הגלגל המוצל הוא מה שמתחת לאופק. בחרו "שעות" בבקרת הזמן והפעילו — ותראו את המזלות עולים זה אחר זה.':
    'When the horizon is shown, the wheel is rotated for the moment and place: east (the rising sign) on the left, west opposite, and the shaded half is below the horizon. Choose "Hours" in the time controls and press Play to watch the signs rise one after another.',
  'קו אמצע הרקיע (המקווקו) אינו ניצב לקו האופק, והוא נע במשך היממה — וכך צריך להיות. הכיוון בשמים אמנם קבוע, קו חצי השמים שבדרום, אבל הקו שבאיור מסמן את נקודת הגלגל שנמצאת שם באותו רגע — והקשת שעל הגלגל בין הנקודה העולה לנקודה שבחצי השמים משתנה, מפני שהגלגל נטוי כ-23.44° לקו המשווה. בירושלים היא נעה בין 71° ל-108° במקום 90°, בלונדון בין 54° ל-126°, וסמוך לקו המשווה כמעט אינה משתנה. הקשת עצמה מוצגת בלוח הנתונים, ומכאן שאין לקבע את שני הקווים גם יחד — והעוגן כאן הוא המזל העולה.':
    'The midheaven line (the dashed one) is not square to the horizon line, and it shifts through the day. That is how it should be. The direction in the sky is indeed fixed — it is the meridian, due south. But the line in the drawing marks whichever point of the wheel is standing there at that moment. The stretch of wheel between the rising point and that top point keeps changing, because the wheel is tilted about 23.44° to the equator. In Jerusalem it ranges from 71° to 108° instead of a steady 90°, in London from 54° to 126°, and near the equator it barely changes at all. That stretch is shown in the data panel. So the two lines cannot both be held fixed, and the anchor here is the rising sign.',
  'הקשת מאמצע הרקיע למזל העולה': 'Arc from midheaven to ascendant',
  'סדר עליית המזלות — ראו ראש השנה י״א ע״ב–י״ב ע״א וברש״י שם.':
    'On the order in which the signs rise, see Rosh Hashanah 11b–12a with Rashi.',
  'מיקומים נוכחיים': 'Current positions',
  'מזרח · עולה': 'East · rising',
  'מערב · שוקע': 'West · setting',
  'אמצע הרקיע': 'Midheaven',
  '0° טלה': '0° Aries (טלה)',
  'מבט': 'View',
  'מבט־על על הגלגל': 'Top-down wheel',
  'מבט הצופה (הרקיע)': 'Observer view (sky)',
  '🌅 מבט למזרח': '🌅 Face east',
  'מבט מהצד (לדרום)': 'Side view (face south)',
  'במבט הצופה אתם עומדים על הארץ: רצועת המזלות נטויה על פני הרקיע — חציה נוטה צפונה וחציה דרומה מקו המשווה השמימי. גררו את האיור לסיבוב המבט, בחרו "שעות" והפעילו — ותראו את המזלות עולים מן המזרח והשמש נישאת עמם.':
    'In the observer view you are standing on the Earth. The zodiac band arcs across the sky at a tilt — half of it leaning north of the celestial equator and half leaning south. Drag the drawing to turn which way you are facing. Choose "Hours" and press Play, and you will see the signs rise in the east with the sun carried along with them.',
  'השמש במזל': 'Sun in sign',
  'צופה': 'Observer',
  'משווה השמים': 'Celestial equator',
  'המזל העולה': 'Rising sign',
  'מבט אל': 'Facing',
  'גררו לסיבוב המבט': 'drag to rotate the view',

  // ── שרי השעות ────────────────────────────────────────────────────────
  'יום בשבוע': 'Day of week',
  'שעה זמנית': 'Seasonal hour',
  // 'שרי השעות', 'שר השעה', 'שר היום' — בכוונה בלי רשומה: מונח תורני שתרגומו
  // המילולי ריק ממשמעות נשאר בעברית, כנהוג בציבור התורני דובר האנגלית.
  'שעות הלילה': 'Night hours',
  'שעות היום': 'Day hours',
  ' — ביום': ' — daytime', ' — בלילה': ' — nighttime',
  ' של היום': ' of the day', ' של הלילה': ' of the night',
  'תקופת': 'Tekufas',
  'שעות מתחילת הלילה': 'hours from nightfall',
  'השעות הזמניות מחושבות מהזריחה עד השקיעה (יום) ומהשקיעה עד הזריחה (לילה) במקום הנבחר, כל אחת מחולקת לשתים-עשרה.':
    'A seasonal hour is one twelfth of the day, or one twelfth of the night. The day runs from sunrise to sunset, and the night from sunset to sunrise, at the place you chose. Each one is split into twelve equal parts.',
  'ארבע התקופות ושריהן': 'The four tekufos and their rulers',
  'שנה עברית': 'Hebrew year',
  'תקופת שמואל: שנה = 365 יום ו-6 שעות, וכל תקופה 91 יום ו-7½ שעות. מכאן שתקופת ניסן נופלת תמיד ברבעי היום (0, 6, 12, 18 שעות מתחילת הלילה), תמוז — באחת ומחצה שאחריהן, תשרי — בשלוש, וטבת — בארבע ומחצה. השעות כאן שעות שוות מתחילת הלילה (שש בערב), כדרך חשבון התקופות.':
    'Tekufas Shmuel counts a year as 365 days and 6 hours. Each tekufah (season) is 91 days and 7½ hours. So Tekufas Nissan always falls at a quarter point of the day: 0, 6, 12 or 18 hours from nightfall. Tammuz falls an hour and a half later, Tishrei three hours later, and Teves four and a half. The hours here are fixed hours counted from nightfall (6 pm), the way tekufos have always been reckoned.',
  'שבעת כוכבי הלכת משמשים בשעות היממה על הסדר': 'The seven planets serve the hours of the day in the order',
  'שצ״ם חנכ״ל': 'ShaTZaM ChaNKaL',
  '— שבתאי, צדק, מאדים, חמה, נוגה, כוכב, לבנה — וחוזר חלילה. שעה ראשונה של יום ראשון היא לחמה, ומכיוון שיממה בת עשרים וארבע שעות והכוכבים שבעה (24 = 3×7+3), מתקדם שר השעה הראשונה בשלושה בכל יום — ומכאן שמות ימי השבוע בלשונות אוה״ע ושר לכל יום: א׳ חמה, ב׳ לבנה, ג׳ מאדים, ד׳ כוכב, ה׳ צדק, ו׳ נוגה, שבת שבתאי.':
    '— Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon — and then the order starts again. The first hour of Sunday belongs to the Sun. A day has 24 hours, and there are seven planets. Since 24 = 3×7+3, the ruler of the first hour moves ahead by three each day. That is where the weekday names in other languages come from, and each day has its own ruler: Sun. Sun, Mon. Moon, Tue. Mars, Wed. Mercury, Thu. Jupiter, Fri. Venus, Shabbos Saturn.',
  'ראו עירובין נ״ו ע״א ורש״י שם ד״ה ואין תקופה, בשם רבי שבתי דונולו הרופא.':
    'See Eruvin 56a and Rashi there s.v. ve-ein tekufah, citing R. Shabsai Donolo the physician.',
  'ש=שבתאי · צ=צדק · מ=מאדים · ח=חמה · נ=נוגה · כ=כוכב · ל=לבנה':
    'Sa=Saturn · Ju=Jupiter · Ma=Mars · Su=Sun · Ve=Venus · Me=Mercury · Mo=Moon',
  'ש': 'Sa', 'צ': 'Ju', 'מ': 'Ma', 'ח': 'Su', 'נ': 'Ve', 'כ': 'Me', 'ל': 'Mo',

  // ── קו התאריך ────────────────────────────────────────────────────────
  'שעון ישראל': 'Israel time',
  'מרכז המבט': 'View center',
  "קו זמן יקום מתואם (גריניץ')": 'UTC line (Greenwich)',
  'חזון איש': 'Chazon Ish',
  '35.24° מזרח': '35.24° East',
  '125.24° מזרח': '125.24° East',
  'הגרי"מ טיקוצינסקי': 'R. Y.M. Tukachinsky',
  '144.76° מערב': '144.76° West',
  'הסכמי אוה"ע': 'International convention',
  'בקרת זמן (שעון ישראל)': 'Time controls (Israel time)',
  'הצג יום ולילה על הגלובוס': 'Show day/night on the globe',
  'הפעילו וצפו: כשהחמה שוקעת במקומות שבמחלוקת, שלפי כל שיטה מתחלף היום ליום אחר.':
    'Press Play and watch. When the sun sets over the places under dispute, each opinion turns the day into a different day.',
  'מקומות שהנדון משליך עליהם': 'Places affected by the question',
  'סיבוב הגלובוס': 'Rotate the globe',
  'גררו את הגלובוס לסיבוב.': 'Drag the globe to rotate.',
  'קו החזו"א': 'Chazon Ish line',
  'קו הגרי"מ': 'Tukachinsky line',
  'קו 180°': '180° line',
  'קו אורך במרכז המבט:': 'Longitude at view center:',
  'קו רוחב במרכז המבט:': 'Latitude at view center:',
  'הצגת הקווים': 'Show lines',
  'קו התאריך — שיטת החזו"א': 'Date line — Chazon Ish',
  'קו התאריך — שיטת הגרי"מ טיקוצינסקי': 'Date line — R. Y.M. Tukachinsky',
  'קו התאריך — הסכמי אומות העולם': 'Date line — international convention',
  'רשת קווי אורך ורוחב': 'Latitude/longitude grid',
  'קווי האורך והרוחב': 'Lines of longitude and latitude',
  'קווי האורך': 'Lines of longitude',
  'קווי הרוחב': 'Lines of latitude',
  "יוצאים מקוטב אל קוטב וחוצים את קו המשוה, ומודדים מזרח ומערב מקו גריניץ' (0°) עד 180° לכל צד.":
    ' run from pole to pole, crossing the equator. They measure east and west from the Greenwich line (0°), up to 180° in each direction. ',
  'מקבילים לקו המשוה, ומודדים צפון ודרום מ-0° שבמשוה עד 90° שבקטבים.':
    ' run parallel to the equator. They measure north and south, from 0° at the equator up to 90° at the poles.',
  'הרשת שעל הגלובוס מסומנת': 'The grid on the globe is marked every',
  'בכל 15 מעלות': ' 15 degrees',
  ', לאורך ולרוחב. במקווקו מסומנים חוג הסרטן (23.44° צפון) וחוג הגדי (23.44° דרום), ומעגלי הקוטב — הצפוני והדרומי (66.56° צפון ודרום).':
    ', in both longitude and latitude. The dashed lines are the Tropic of Cancer (23.44°N) and the Tropic of Capricorn (23.44°S), and the Arctic and Antarctic circles (66.56°N and S).',
  '15 מעלות = שעה': '15 degrees = one hour',
  '— הכדור מסתובב 360 מעלות ביממה, ונמצא שהשמש נעה מעל פניו 15 מעלות בכל שעה. מכאן שכל תנועה של 15 מעלות מזרחה הזמן מתקדם בשעה, וכל 15 מעלות מערבה הזמן מתאחר בשעה — וכל רצועה שבין שני קווי אורך שברשת היא שעה.':
    ' — the Earth turns a full 360° in one day, so the Sun moves 15° across it every hour. Go 15° east and the time is an hour later. Go 15° west and it is an hour earlier. So each band between two grid meridians (longitude lines) is one hour.',
  'עשרים וארבע רצועות של 15 מעלות הן עשרים וארבע שעות, היממה כולה. לפיכך המקיף את הכדור כולו מרויח או מפסיד יממה שלמה — וכאן נצרך קו התאריך, שבו מתחלף היום.':
    'Twenty-four bands of 15° make twenty-four hours — one full day. So anyone who travels all the way around the globe gains or loses a whole day. That is why a date line is needed: the place where the day changes.',
  'קו זמן יקום מתואם (UTC)': 'UTC line',
  "— קו גריניץ', 0°.": ' — the Greenwich line, 0°.',
  'קו התאריך שיטת החזו"א': 'Chazon Ish date line',
  '— 90 מעלות מזרחית לירושלים (125.24° מזרח). כל מה שמחובר יבשתית למערב מקו התאריך נדון כמו המערב, ולכן הקו נוטה אל סוף היבשת (הקו הישר העובר בתוך היבשת מסומן במקווקו).':
    ' — 90° east of Jerusalem (125.24°E). Any land joined to the west side of the line follows the west. So the line bends around to the edge of the landmass. The straight line inside the landmass is shown dashed.',
  'קו התאריך הגרי"מ טיקוצינסקי': 'Tukachinsky date line',
  '— 180 מעלות מירושלים (144.76° מערב). קו מקווקו תכלת — שטח בספק של הגרי"מ: מערב אלסקה, מקו התאריך שלו עד מיצר ברינג, שהסתפק אם הוא נדון כמזרח הקו (שהוא מחובר אליו יבשתית) או כמערבו.':
    ' — 180° from Jerusalem (144.76°W). The dashed light-blue outline is the area R. Tukachinsky left in doubt: western Alaska, from his line to the Bering Strait, since it is joined by land to the line’s east.',
  'קו התאריך הסכמי אוה"ע': 'International date line',
  '— 180 מעלות מקו זמן יקום מתואם.': ' — 180° from the UTC line.',
  'ירושלים (35.24° מזרח). הקו המקווקו — קו האורך שעליו שוכנת ירושלים, וממנו נמדדים שני קווי התאריך שבמחלוקת.':
    'Jerusalem (35.24°E). The dashed line is the meridian (longitude line) that Jerusalem sits on. Both disputed date lines are measured from it.',
  'הערה: מהלך הקו לאורך חופי היבשות מצויר בקירוב, להמחשת העיקרון בלבד.':
    'Note: the line’s course along the coasts is approximate, for illustration only.',
  'מקורות:': 'Sources:',
  'חזון איש, או"ח סי\' ס"ד; הגרי"מ טיקוצינסקי, ספר "היומם בכדור הארץ".':
    'Chazon Ish, O.C. §64; R. Y.M. Tukachinsky, "HaYomam BeKadur HaAretz".',
  'טוקיו — יפן': 'Tokyo — Japan',
  'וולינגטון — ניו זילנד': 'Wellington — New Zealand',
  'הונולולו — הוואי': 'Honolulu — Hawaii',
  'טוקיו': 'Tokyo', 'וולינגטון': 'Wellington', 'הונולולו': 'Honolulu',
  'הסכמי אוה״ע': 'Intl. convention',
  'שיטת החזו״א': 'Chazon Ish',
  'שיטת הגרי״מ': 'Tukachinsky',
  'גריניץ׳ 0°': 'Greenwich 0°',
  'חזו״א': 'Chazon Ish',
  'גרי״מ טיקוצינסקי': 'Tukachinsky',
  'הסכמי אוה״ע 180°': 'Intl. 180°',

  // ── מערכת תלת-מימד ───────────────────────────────────────────────────
  'מבט הליוצנטרי': 'Heliocentric view',
  'מבט גאוצנטרי': 'Geocentric view',
  'מופע הירח': 'Moon phase',
  'אחוז מואר': 'Illuminated',
  'נקודת מבט': 'Viewpoint',
  'הליוצנטרי': 'Heliocentric',
  'השמש במרכז': 'Sun at center',
  'גאוצנטרי': 'Geocentric',
  'הארץ במרכז': 'Earth at center',
  'גררו עם העכבר לסיבוב המבט · Ctrl+גרירה להזזה (pan) · גלגלת לזום.':
    'Drag to rotate · Ctrl+drag to pan · wheel to zoom.',
  'כוכבי לכת': 'Planets',
  'הצג כוכבי לכת': 'Show planets',
  'המרחקים דחוסים (√) לתצוגה; הכיוון מדויק. במבט הגאוצנטרי הכוכבים ממוקמים לפי מרחקם מהארץ — כך נראית צמידוּתם לשמש ולירח.':
    'Distances are squeezed down (by a square root) so everything fits on screen. The directions are exact. In the geocentric view — Earth at the center — each planet sits at its own distance from Earth. That is how you see it line up close to the Sun and the Moon (a conjunction).',
  'ליקויים': 'Eclipses',
  'ליקוי לבנה הבא': 'Next lunar eclipse',
  'ליקוי חמה הבא': 'Next solar eclipse',
  '⏮ לבנה קודם': '⏮ Previous lunar',
  'ליקוי לבנה הבא ⏭': 'Next lunar eclipse ⏭',
  '⏮ חמה קודם': '⏮ Previous solar',
  'ליקוי חמה הבא ⏭': 'Next solar eclipse ⏭',
  'הצג חרוטי צל': 'Show shadow cones',
  'מצב ליקוי': 'Eclipse state',
  'ליקוי לבנה מלא': 'Total lunar eclipse',
  'ליקוי לבנה חלקי': 'Partial lunar eclipse',
  'צל-קדמי (פנומברה)': 'Penumbral',
  'חרוט הצל של הארץ מוצג בשני המבטים כאחד — הצל קיים תמיד, ונקודת המבט אינה משנה בו דבר. ירח מלא הנכנס אליו = ליקוי לבנה, ואז נראה צל הארץ מכהה את הצד המואר של הלבנה (עומק ההכהיה והאודם מחושבים מן הגאומטריה האמיתית). סביבו מצויר בעמעום גם חרוט הפנומברה — צל חלקי, ובו נעשה ליקוי צל-קדמי. חרוט הצל של הירח קדקודו מגיע בקושי אל הארץ, ובמולד — כשהוא פוגע בה — נעשה ליקוי חמה ליושבי אותו מקום.':
    'Earth’s shadow cone is shown the same way in both views. The shadow is always there, and your viewpoint changes nothing about it. When a full moon enters it, that is a lunar eclipse. You then see Earth’s shadow darken the lit side of the Moon (how dark it gets, and its copper color, are worked out from the real geometry). A fainter cone is drawn around it — the penumbra, the partial shadow. An eclipse inside that one is called penumbral. The Moon has a shadow cone of its own, and its tip barely reaches Earth. At new moon, where that tip hits, the people under it see a solar eclipse.',
  'המיקומים והכיוונים מחושבים במדויק (Astronomy Engine, וקטורי J2000). המרחק ארץ–ירח מוגדל לצורך תצוגה. הצד המואר של הירח והארץ פונה תמיד אל השמש — כך המופע נוצר פיזיקלית נכון.':
    'Positions and directions are computed exactly (Astronomy Engine, J2000 vectors). The distance from Earth to the Moon is drawn larger than it really is, so both are easy to see. The lit side of the Moon and of Earth always faces the Sun — so the phase you see forms the way it really does.',
  'מלא': 'total', 'חלקי': 'partial', 'צל-קדמי': 'penumbral',
  'טבעתי': 'annular', 'היברידי': 'hybrid',

  // ── ליקויי המאורות ───────────────────────────────────────────────────
  'ליקויי המאורות': 'Eclipses',
  'תצוגה': 'View',
  'ליקוי לבנה': 'Lunar eclipse',
  'ליקוי חמה': 'Solar eclipse',
  'על הגלובוס': 'On the globe',
  'צל הארץ על הירח': 'Earth’s shadow on the Moon',
  'הירח מכסה את השמש': 'Moon covers the Sun',
  'מסלול הליקוי': 'Eclipse path',
  'ליקוי לבנה — צל הארץ על הירח': 'Lunar eclipse — Earth’s shadow on the Moon',
  'ליקוי חמה — הירח מכסה את השמש': 'Solar eclipse — the Moon covers the Sun',
  'מסלול הליקוי על הגלובוס': 'Eclipse path on the globe',
  'בחירת ליקוי': 'Choose an eclipse',
  '⏮ הקודם': '⏮ Previous',
  '⏭ הבא': '⏭ Next',
  'ליקויי המאה (2001–2100)': 'Eclipses of the century (2001–2100)',
  'רק ליקויים מלאים': 'Total eclipses only',
  'רק ליקויים הנראים בארץ ישראל': 'Only eclipses visible from Israel',
  'בא״י': 'in Israel:',
  'טוען…': 'Loading…',
  '⏱ שיא הליקוי': '⏱ Eclipse peak',
  'דקות/שנייה': 'minutes/sec',
  'מהלך הליקוי (גרירה)': 'Eclipse progress (drag)',
  'מרחק הירח מן הארץ': 'Moon’s distance from Earth',
  'שליטה ידנית במרחק (הדגמה)': 'Manual distance control (demo)',
  'מרחק:': 'Distance:',
  'ק״מ': 'km',
  'ככל שהירח רחוק יותר מכדור הארץ הוא נראה קטן יותר, ואינו מספיק לכסות את כל השמש — והליקוי נעשה טבעתי. קרבו את הירח וראו את הליקוי נעשה מלא. כשההדגמה כבויה מוצג מרחקו האמיתי של הירח ברגע המוצג.':
    'The farther the Moon is from Earth, the smaller it looks. Too small, and it cannot cover the whole Sun. Then the eclipse is annular — a ring of sun is left showing around the Moon. Move the Moon closer and watch the eclipse turn total. With the demo off, you see the Moon’s real distance at the moment shown.',
  'הגלובוס': 'Globe',
  'המבט עוקב אחר מרכז הצל': 'View follows the shadow center',
  'גררו את הגלובוס לסיבוב. ההכהיה על פני הכדור — לפי אחוז כיסוי השמש הנראה מכל מקום; הכתם הכהה — אזור הליקוי המלא (או הטבעתי), והקו הכתום — מסלול מרכז הצל, המתקדם בדרך כלל ממערב למזרח.':
    'Drag the globe to turn it. The shading shows how much of the Sun is covered as seen from each place. The dark spot is where the eclipse is total — or annular, with a ring of sun left showing. The orange line is the path of the shadow’s center, which usually moves from west to east.',
  'הסבר קצר': 'In brief',
  'ליקוי לבנה — כדור הארץ עומד בין השמש ובין הירח, ומטיל את צלו על הירח. לעולם אינו בא אלא במילוי הירח, בסביבות ט״ו בחודש.':
    'Lunar eclipse — Earth stands between the Sun and the Moon, and casts its shadow on the Moon. It can only happen at full moon, around the 15th of the month.',
  'ליקוי חמה — הירח עומד בין כדור הארץ ובין השמש, ומסתיר אותה מיושבי הארץ. לעולם אינו בא אלא סמוך למולד, בסביבות ערב ראש חודש.':
    'Solar eclipse — the Moon stands between Earth and the Sun, and hides it from the people on Earth. It can only happen near the molad, around the eve of Rosh Chodesh.',
  'המיקומים, הזמנים ואחוזי הכיסוי מחושבים במדויק (Astronomy Engine); צל הארץ מוגדל 2% כמקובל בשל האטמוספרה. להמחשה בלבד.':
    'Positions, times and coverage percentages are computed exactly (Astronomy Engine). Earth’s shadow is drawn 2% larger, the usual allowance for the atmosphere. For illustration only.',
  'תאריך הליקוי': 'Eclipse date',
  'שעה (זמן עולמי)': 'Time (UTC)',
  'אחוז הכיסוי': 'Coverage',
  'מרכז הצל': 'Shadow center',
  'הארץ בין השמש לירח — צלה נופל על הירח': 'Earth between Sun and Moon — its shadow falls on the Moon',
  'הירח בין הארץ לשמש — צלו נופל על הארץ': 'Moon between Earth and Sun — its shadow falls on Earth',
  'הצל המלא (אומברה)': 'Full shadow (umbra)',
  'הצל החלקי (פנומברה)': 'Partial shadow (penumbra)',
  'מראה הירח מן הארץ': 'The Moon as seen from Earth',
  'מראה הליקוי מן הארץ (במקום השיא)': 'The eclipse as seen from Earth (at the peak location)',
  'מראה הליקוי': 'Eclipse view',
  'מקום הצופה': 'Observer location',
  'מראה הליקוי — מנקודת מבטו של צופה ב:': 'Eclipse view — from the viewpoint of an observer at:',
  'מקום שיא הליקוי': 'The eclipse peak location',
  'צפת': 'Safed', 'באר שבע': 'Beersheba', 'אילת': 'Eilat',
  'השמש מתחת לאופק': 'The sun is below the horizon',
  'הליקוי אינו נראה משם ברגע זה': 'The eclipse is not visible from there at this moment',
  'ההבדל בגודל הליקוי בין ערי הארץ הוא בעיקר מצפון לדרום; ההפרש בין מזרח למערב (ירושלים–תל אביב) זניח, שהארץ צרה.':
    'How big the eclipse looks changes mainly as you move from north to south in Israel. From east to west — Jerusalem to Tel Aviv — the difference is tiny, because the country is narrow.',
  'מכוסה': 'covered',
  'החמה מנגד, מתחת לאופק': 'The sun is opposite, below the horizon',
  'אור החמה הנשבר באוויר מאדים את הירח': 'Sunlight refracted through the air reddens the Moon',
  'ליקוי מלא': 'Total eclipse',
  'ליקוי טבעתי': 'Annular eclipse',
  'כיסוי': 'coverage',
  'צל הירח על פני הארץ': 'The Moon’s shadow on Earth',
  'ההכהיה — לפי אחוז כיסוי השמש בכל מקום; הקו הכתום — מסלול מרכז הצל':
    'Shading — how much of the Sun is covered at each place; orange line — the path of the shadow’s center',
  'לחצו ▶ הפעל להנעת הליקוי · בחרו ליקוי אחר בלוח הצד': 'Press ▶ Play to animate · choose another eclipse in the side panel',

  // ── הלוח העברי ───────────────────────────────────────────────────────
  // ימי השבוע הקצרים והמלאים כבר מתורגמים למעלה; כאן רק 'שבת', שחסר שם
  // (הלוח משתמש ב'שבת' המלא ולא ב'ש׳' שבלשונית שרי השעות).
  'הלוח העברי': 'The Hebrew Calendar',
  'שבת': 'Sat',
  'תשרי': 'Tishrei', 'חשון': 'Cheshvan', 'כסליו': 'Kislev', 'טבת': 'Tevet', 'שבט': 'Shevat',
  'אדר': 'Adar', 'אדר א׳': 'Adar I', 'אדר ב׳': 'Adar II', 'ניסן': 'Nisan', 'אייר': 'Iyar',
  'סיון': 'Sivan', 'תמוז': 'Tamuz', 'אב': 'Av', 'אלול': 'Elul',
  'זמן המולד': 'Molad time',
  'מלא / חסר': 'Full / lacking',
  // לא 'מלא' סתם: המילה כבר תפוסה בלשונית הליקויים במשמעות "ליקוי מלא"
  'חודש מלא': 'full month', 'חודש חסר': 'lacking month',
  'ר״ח ביום בשבוע': 'Rosh Chodesh weekday',
  'ר״ח': 'R. Chodesh',
  'א׳ בחודש — לועזי': '1st of month — civil',
  'לועזי': 'Civil',
  'שנת': 'Year', 'שנה עברית': 'Hebrew year',
  'פשוטה': 'regular', 'מעוברת': 'leap',
  'חסרה': 'deficient', 'כסדרה': 'regular order', 'שלמה': 'complete',
  'חלקים': 'parts',
  'ראש השנה ביום': 'Rosh Hashana falls on',
  'ראש השנה בשנה הבאה ביום': 'Next year’s Rosh Hashana falls on',
  'מולד תשרי': 'Molad of Tishrei',
  'מולד תשרי הבא': 'Next Molad of Tishrei',
  'יום המולד': 'the day of the molad',
  'דחיית': 'postponement:',
  'מולד זקן': 'Molad Zaken',
  'לא אד״ו ראש': 'Lo ADU Rosh',
  'מולד זקן ולא אד״ו ראש': 'Molad Zaken and Lo ADU Rosh',
  'ג״ט ר״ד': 'GaTaRaD',
  'ב־ט״ו־תקפ״ט': 'BeTUTaKPaT',
  'סימן השנה': 'Year siman', 'א׳ דפסח': 'first day of Pesach',
  'מחזור קטן': 'Minor cycle', 'מחזור גדול': 'Major cycle',
  'מחזור': 'cycle', 'שנה': 'year', 'מתוך': 'of',
  'בחירת שנה': 'Choose a year',
  // בעברית החץ של "קודמת" פונה ימינה ושל "הבאה" שמאלה; באנגלית להפך
  '▶ קודמת': '◀ Previous', 'הבאה ◀': 'Next ▶', '🗓 השנה': '🗓 This year',
  '🧪 שנת מעבדה': '🧪 Sandbox year',
  '↩ חזרה לשנה אמיתית': '↩ Back to a real year',
  'שנת מעבדה': 'Sandbox year',
  'מולד תשרי — יום בשבוע': 'Molad of Tishrei — weekday',
  'השנה מעוברת': 'This year is a leap year',
  'השנה שלפניה מעוברת': 'The preceding year is a leap year',
  'השנה שאחריה מעוברת': 'The following year is a leap year',
  'שנה שאחרי מעוברת היא תמיד פשוטה': 'A year following a leap year is always regular',
  'משפיע רק כשמולד תשרי חל ביום ב׳ אחרי ט״ו תקפ״ט ולפני י״ח':
    'This matters only when the molad of Tishrei falls on Monday, after 15 hours and 589 chalakim, and before 18 hours.',
  'משפיע רק כשמולד תשרי הבא חל ביום ג׳ אחרי ט׳ ר״ד ולפני י״ח':
    'This matters only when the next molad of Tishrei falls on Tuesday, after 9 hours and 204 chalakim, and before 18 hours.',
  'הקדמה': 'Introduction',
  'ארבע הדחיות': 'The four postponements',
  'מקורות והערות': 'Sources and notes',
  'אין בלוח שתי שנים מעוברות רצופות — במחזור י״ט השנים המעוברות הן ג׳ ו׳ ח׳ י״א י״ד י״ז י״ט, ואין שתיים סמוכות. הצירוף הזה אינו קיים.':
    'The calendar never has two leap years in a row. In the 19-year cycle the leap years are 3, 6, 8, 11, 14, 17 and 19 — no two of them are next to each other. So this combination never happens.',
  'אורך השנה שהתקבל אינו מן האורכים החוקיים (353/354/355 בפשוטה, 383/384/385 במעוברת) — צירוף הנתונים שנבחר אינו נפגש בלוח.':
    'The year length that came out is not one the calendar allows: 353, 354 or 355 days in a regular year, and 383, 384 or 385 days in a leap year. This combination does not occur in the calendar.',

  // ── חלונית חישוב המולדות ─────────────────────────────────────────────
  'חישוב המולדות': 'Molad Calculator',
  'חודש — בשנה המוצגת': 'Month — of the displayed year',
  'מולד בהר״ד': 'Molad BaHaRaD',
  'יום ב׳, 5 שעות 204 חלקים': 'Monday, 5 hours 204 parts',
  'חודשים שעברו מאז': 'Months elapsed since',
  'המולד (הממוצע)': 'The molad (mean)',
  'המולד האמיתי': 'The true molad',
  'שעון ישראל': 'Israel clock',
  'לפנה״ס': 'BCE',
  'האמיתי קדם לממוצע ב-{h} שעות ו-{m} דקות':
    'The true molad precedes the mean by {h}h {m}m',
  'האמיתי מאוחר מן הממוצע ב-{h} שעות ו-{m} דקות':
    'The true molad follows the mean by {h}h {m}m',
  'בשנים רחוקות מזמננו דיוק החישוב האסטרונומי פוחת, בעיקר מחמת אי-הוודאות בקצב סיבוב הארץ.':
    'For years far from our own time, the astronomical calculation is less exact. The main reason: we do not know exactly how fast Earth was spinning back then.',

  // ── דיווח למפתח ──────────────────────────────────────────────────────
  'נתקלתם בתקלה, בטעות בחישוב או שיש לכם הצעה?': 'Found a bug, a calculation error, or have a suggestion?',
  'שלחו דיווח למפתח התוסף': 'Send a report to the plugin developer',
  'דיווח על התוסף': 'Report an issue',
  'הדיווח נשלח לאתר אוצריא ומועבר למפתח התוסף. לפני השליחה תוצג בקשת אישור עם תצוגה מקדימה של הטקסט.':
    'The report is sent to the Otzaria site and forwarded to the plugin developer. A confirmation prompt with a preview of the text is shown before sending.',
  'סוג הדיווח': 'Report type',
  'תקלה בתוסף': 'Plugin malfunction',
  'קריסה': 'Crash',
  'טעות בתוכן או בחישוב': 'Content or calculation error',
  'אחר (הצעה, שאלה)': 'Other (suggestion, question)',
  'פירוט הדיווח': 'Details',
  'מה קרה? באיזה איור? מה ציפית שיקרה?': 'What happened? In which illustration? What did you expect?',
  'כתובת מייל לחזרה (לא חובה)': 'Reply e-mail (optional)',
  'לדיווח תצורף כתובת המייל השמורה בהגדרות דיווח השגיאות של אוצריא.':
    'The reply address saved in Otzaria’s error-reporting settings will be attached to the report.',
  'לצרף את שם האיור הפעיל ואת גרסת התוסף': 'Include the active illustration and the plugin version',
  'ביטול': 'Cancel',
  'שלח דיווח': 'Send report',
  'שולח…': 'Sending…',
  'יש לפרט את הדיווח לפני השליחה.': 'Please describe the issue before sending.',
  'הדיווח נשלח. תודה!': 'Report sent. Thank you!',
  'שליחת הדיווח נכשלה. בדוק את החיבור לאינטרנט ונסה שוב.':
    'Sending the report failed. Check your internet connection and try again.',

  // ── ממיר השעה היממתית ────────────────────────────────────────────────
  'ממיר שעה יממתית ⇄ שעה אזרחית': 'Calendar-Day ⇄ Civil Time Converter',
  'כיוון ההמרה': 'Conversion direction',
  'משעה אזרחית לשעה יממתית': 'Civil clock → hours and parts',
  'משעה יממתית לשעה אזרחית': 'Hours and parts → civil clock',
  'תאריך עברי': 'Hebrew date',
  'שניות': 'Seconds',
  'השעה בשעון ישראל. שעה 18:00 ואילך מתפרשת כליל התאריך הנבחר.':
    'This is the time on the Israel clock. From 18:00 on, it counts as the night of the date you chose.',
  'השעות נמנות מתחילת הלילה של התאריך הנבחר — תתר״פ חלקים לשעה.':
    'The hours are counted from nightfall of the date you chose. Each hour holds 1080 chalakim (parts).',
  'הרגע בשעון ישראל': 'The moment, Israel clock',
  'תוס׳ — שעות זמניות': 'Tosafot — seasonal hours',
  'תוס׳ — שעות שוות': 'Tosafot — equal hours',
  'הגרי״מ טיקוצינסקי — חצות אמיתי': 'R. Y. M. Tukachinsky — true noon',
  'הגר״י מרצבך — חצות ממוצע': 'R. Y. Merzbach — mean noon',
  'שיטה א׳ בתוס׳ עירובין נ״ו ע״א: היממה משקיעה לשקיעה, י״ב שעות ללילה וי״ב ליום':
    'First view in Tosafot, Eruvin 56a: the day runs from sunset to sunset. It is split into 12 hours for the night and 12 for the day',
  'שיטה ב׳ בתוס׳ שם: היממה משקיעה לשקיעה, בשעות שוות':
    'Second view in Tosafot there: the day runs sunset to sunset, in equal hours',
  'הלבוש סי׳ תכ״ח: היממה משש שעות אחר חצות; לפי החצות האמיתי של כל יום':
    'Levush §428: the day begins six hours after noon; per each day’s true noon',
  'הלבוש סי׳ תכ״ח: היממה משש שעות אחר חצות; לפי החצות הממוצע — תחילת היממה 17:39 בשעון החורף':
    'Levush §428: the day begins six hours after noon — here counted from mean noon, so the day always starts at 17:39 standard time',
  'בשנים רחוקות מזמננו דיוק חישובי הזריחה, השקיעה והחצות פוחת, בעיקר מחמת אי-הוודאות בקצב סיבוב הארץ.':
    'For years far from our own time, the sunrise, sunset and noon calculations are less exact. The main reason: we do not know exactly how fast Earth was spinning back then.',
};
