#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourcePath = join(root, 'shared', 'constants.json');
const tsPath = join(root, 'unit', 'lib', 'constants.generated.ts');
const jsPath = join(root, 'www', 'js', 'constants.js');

const constants = JSON.parse(readFileSync(sourcePath, 'utf8'));
const ts = [
  '// Generated from shared/constants.json. Do not edit.',
  '',
  `export const MODE_COSTS = ${JSON.stringify(constants.MODE_COSTS, null, 2)} as const;`,
  '',
  `export const SCORE_WEIGHTS = ${JSON.stringify(constants.SCORE_WEIGHTS, null, 2)} as const;`,
  '',
  `export const MODE_EXPOSURE = ${JSON.stringify(constants.MODE_EXPOSURE, null, 2)} as const;`,
  '',
  `export const AQI_BANDS = ${JSON.stringify(constants.AQI_BANDS, null, 2)} as const;`,
  '',
].join('\n');
const js = [
  '/* Generated from shared/constants.json. Do not edit. */',
  `window.TRIPMIND_CONSTANTS = ${JSON.stringify(constants, null, 2)};`,
  '',
].join('\n');

const check = process.argv.includes('--check');
for (const [path, content] of [[tsPath, ts], [jsPath, js]]) {
  if (check) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {
      current = '<missing>';
    }
    if (current !== content) {
      console.error(`FATAL: ${path} is out of date. Run: node unit/scripts/generate-constants.mjs`);
      process.exit(1);
    }
  } else {
    writeFileSync(path, content);
  }
}

if (!check) {
  console.log(`Wrote ${tsPath}`);
  console.log(`Wrote ${jsPath}`);
}
