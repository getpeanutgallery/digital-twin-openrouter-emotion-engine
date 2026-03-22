#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const manifest = require(path.join(REPO_ROOT, 'manifest.json'));
const argv = process.argv.slice(2);
const explicitFiles = [];
let mode = 'staged';

for (const arg of argv) {
  if (arg === '--tracked') mode = 'tracked';
  else explicitFiles.push(arg);
}

const SECRET_PATTERNS = [
  { label: 'unredacted Authorization bearer token', pattern: /Bearer\s+(?!\[REDACTED(?:_[A-Z0-9_]+)?\])[A-Za-z0-9._~+/=-]{8,}/i },
  { label: 'key-shaped secret token', pattern: /\b(?:sk-(?:or-|proj-)?[A-Za-z0-9_-]{8,}|AIza[0-9A-Za-z_-]{20,})\b/ }
];

function getFiles() {
  if (explicitFiles.length > 0) return explicitFiles;

  const args = mode === 'tracked'
    ? ['ls-files']
    : ['diff', '--cached', '--name-only', '--diff-filter=ACMR'];

  const stdout = execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  if (!stdout) return [];
  return stdout.split('\n').filter(Boolean);
}

function main() {
  const files = getFiles();
  const failures = [];
  const manifestPaths = new Set(manifest.cassettes || []);

  for (const relPath of files) {
    const normalizedPath = relPath.replace(/\\/g, '/');

    if (/^cassettes\/.*-record-.*\.json$/i.test(normalizedPath)) {
      failures.push({ file: normalizedPath, reason: 'record/debug cassettes must not be committed to the pack' });
    }

    if (/^cassettes\/.*\.json$/i.test(normalizedPath) && !manifestPaths.has(normalizedPath)) {
      failures.push({ file: normalizedPath, reason: 'cassette is not listed in manifest.json' });
    }

    if (!/^cassettes\/.*\.json$/i.test(normalizedPath)) continue;

    const absolutePath = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(absolutePath)) continue;
    const content = fs.readFileSync(absolutePath, 'utf8');

    for (const rule of SECRET_PATTERNS) {
      if (rule.pattern.test(content)) {
        failures.push({ file: normalizedPath, reason: rule.label });
      }
    }
  }

  if (failures.length > 0) {
    console.error('Cassette safety guard failed:');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.reason}`);
    }
    process.exit(1);
  }

  console.log(`Cassette safety guard passed (${files.length} file${files.length === 1 ? '' : 's'} checked, mode=${mode}).`);
}

main();
