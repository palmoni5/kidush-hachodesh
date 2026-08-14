// התקנת git hooks מקומיים. ‏.git/hooks אינו נדחף, ולכן בשכפול חדש של הריפו
// יש להריץ: node scripts/install-hooks.mjs
import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hooks = join(root, '.git', 'hooks');
if (!existsSync(hooks)) mkdirSync(hooks, { recursive: true });

const hook = `#!/bin/sh
# נוצר על ידי scripts/install-hooks.mjs
node "$(git rev-parse --show-toplevel)/scripts/check-manifest.mjs" || {
  echo ""
  echo "הקומיט נעצר: תקנו את המניפסט, או עקפו עם --no-verify."
  exit 1
}
`;
const path = join(hooks, 'pre-commit');
writeFileSync(path, hook, { encoding: 'utf8' });
try { chmodSync(path, 0o755); } catch { /* Windows */ }
console.log('✓ הותקן pre-commit hook ב-' + path);
