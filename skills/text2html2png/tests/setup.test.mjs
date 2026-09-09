import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSetupArgs, supportedNode, requiredFonts } from '../scripts/setup.mjs';

test('setup validates theme arguments before invoking npm', () => {
  assert.equal(parseSetupArgs([]).theme, 'clean');
  assert.equal(parseSetupArgs(['--theme', 'glass', '--check']).check, true);
  assert.throws(() => parseSetupArgs(['--theme']), /--theme/);
  assert.throws(() => parseSetupArgs(['--theme', 'clean;echo unsafe']), /--theme/);
  assert.throws(() => parseSetupArgs(['--chrome']), /--chrome/);
});
test('setup honors the Node minimum and derives font packages from the theme', async () => {
  assert.equal(supportedNode('22.11.0'), false);
  assert.equal(supportedNode('22.12.0'), true);
  assert.equal(supportedNode('24.1.0'), true);
  const clean = (await requiredFonts('clean')).map(entry => entry.pkg).sort();
  assert.deepEqual(clean, ['@fontsource/ibm-plex-mono', '@fontsource/ibm-plex-sans', '@fontsource/noto-sans-sc']);
  assert.ok((await requiredFonts('all')).length > clean.length);
});
