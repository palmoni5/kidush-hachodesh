// כותב ל-box ההעדפות של אוצריא (app_preferences.hive בשורש הנתונים) את מה
// שמונע חלונות הפעלה-ראשונה שהיו מסתירים את התוסף בצילום:
//   tour_status — הסיור המודרך נפתח מעצמו כשהמפתח ריק (lib/tour/bloc/tour_cubit.dart)
//   ad_popup_dont_show_again — חלון הקידום שקופץ 5 שניות אחרי העלייה
//   key-software-and-book-updates-enabled — בלי בדיקת עדכונים ופס ההודעה שלה
// רץ לפני ההפעלה הראשונה, כשה-box עדיין ריק: box שהאפליקציה כבר כתבה בו עלול
// להכיל ערכים מטיפוסים שאין לנו adapter עבורם.
import 'dart:io';

import 'package:hive_ce/hive.dart';

Future<void> main(List<String> args) async {
  final root = args.single;
  Directory(root).createSync(recursive: true);
  Hive.init(root);
  final box = await Hive.openBox<dynamic>('app_preferences');
  await box.putAll({
    'tour_status': 'skipped',
    'ad_popup_dont_show_again': true,
    'key-software-and-book-updates-enabled': false,
  });
  await box.close();
  stdout.writeln('✓ העדפות נכתבו ל-$root');
}
