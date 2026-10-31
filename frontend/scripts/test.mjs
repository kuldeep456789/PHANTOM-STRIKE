import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_FRONTEND = path.resolve(__dirname, '..');

console.log('Running Frontend Test Suite...');

// 1. Verify avatar PNG assets exist
const avatarDir = path.join(ROOT_FRONTEND, 'public', 'avatars');
assert.ok(fs.existsSync(avatarDir), 'Avatars directory must exist');

for (let i = 0; i < 8; i++) {
  const file = path.join(avatarDir, `avatar-${i}.png`);
  assert.ok(fs.existsSync(file), `Avatar image ${file} must exist`);
  const stat = fs.statSync(file);
  assert.ok(stat.size > 1000, `Avatar image ${file} must have valid size`);
}
console.log('✓ All 8 avatar images verified.');

// 2. Verify shared types file
const sharedTypesPath = path.resolve(ROOT_FRONTEND, '..', 'shared', 'types.ts');
assert.ok(fs.existsSync(sharedTypesPath), 'shared/types.ts must exist');
const sharedTypesContent = fs.readFileSync(sharedTypesPath, 'utf8');
assert.ok(sharedTypesContent.includes('AVATARS'), 'shared/types.ts must export AVATARS');
assert.ok(sharedTypesContent.includes('ActionType'), 'shared/types.ts must define ActionType');
console.log('✓ Shared types and game models verified.');

// 3. Verify globals.css and Tailwind import
const globalsCss = path.join(ROOT_FRONTEND, 'app', 'globals.css');
assert.ok(fs.existsSync(globalsCss), 'globals.css must exist');
const cssContent = fs.readFileSync(globalsCss, 'utf8');
assert.ok(cssContent.includes('@import "tailwindcss"') || cssContent.includes('@import \'tailwindcss\''), 'globals.css must import tailwindcss');
console.log('✓ Tailwind CSS integration verified.');

console.log('\nAll frontend tests PASSED!');

