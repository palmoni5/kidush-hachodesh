# רישום התוסף כ"תוסף בפיתוח" ישירות ב-plugins_host.db של אוצריא, כפי שעושה
# PluginDevLoaderService.loadDevelopmentPlugin בממשק ("טען תוסף מתיקייה"):
# source_type='development', נטען מהתיקייה עצמה, וכל ההרשאות מאושרות — בלי
# חלון ההסכמה שבהתקנת .otzplugin. עובד גם בגרסאות שאין בהן התקנה מובנית.
# הסכמה: lib/plugins/storage/plugin_system_database.dart באוצריא. עמודה שאינה
# קיימת בגרסה המותקנת מושמטת, ועמודת חובה שאיננו מכירים תפיל את ההרצה בבירור.
import datetime, json, os, sqlite3, sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

db_path, plugin_dir = sys.argv[1], os.path.abspath(sys.argv[2])
with open(os.path.join(plugin_dir, 'manifest.json'), encoding='utf-8') as f:
    m = json.load(f)
now = datetime.datetime.now().isoformat()

con = sqlite3.connect(db_path)
info = list(con.execute('PRAGMA table_info(plugin_installation)'))
if not info:
    sys.exit(f'✗ אין טבלת plugin_installation ב-{db_path}')
cols = {r[1] for r in info}
row = {
    'plugin_id': m['id'],
    'name': m['name'],
    'version': m['version'],
    'install_path': plugin_dir,
    'entrypoint_path': m['entrypoint'],
    'icon_path': m.get('icon'),
    'enabled': 1,
    'pinned': 1,
    'pinned_to_nav_rail': 0,
    'hidden_from_tools': 0,
    'allow_order_before_built_ins_granted':
        int(bool(m.get('contributes', {}).get('toolTab', {}).get('allowOrderBeforeBuiltIns'))),
    'manifest_json': json.dumps(m, ensure_ascii=False),
    'installed_at': now,
    'updated_at': now,
    'source_type': 'development',
    'dev_root_path': plugin_dir,
    'user_order': None,
}
# r: cid, name, type, notnull, dflt_value, pk
missing = [r[1] for r in info if r[3] and r[4] is None and r[1] not in row]
if missing:
    sys.exit(f'✗ עמודות חובה לא מוכרות ב-plugin_installation: {missing}')
row = {k: v for k, v in row.items() if k in cols}
con.execute(
    f'INSERT OR REPLACE INTO plugin_installation ({",".join(row)}) '
    f'VALUES ({",".join("?" * len(row))})', list(row.values()))
for perm in m.get('permissions', []):
    con.execute(
        'INSERT OR REPLACE INTO plugin_permission_grant '
        '(plugin_id, permission, granted, granted_at) VALUES (?, ?, 1, ?)',
        (m['id'], perm, now))
con.commit()
con.close()
print(f'✓ {m["id"]} {m["version"]} נרשם מ-{plugin_dir}')
