#!/usr/bin/env node
// ============================================================================
// Post-build script — Copy static & public assets into standalone output
//
// This replaces the Unix-only `cp -r` commands in the build script,
// making it work on Windows, Linux, and macOS alike.
// ============================================================================

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');

const TASKS = [
  {
    src: path.join(PROJECT_DIR, '.next', 'static'),
    dest: path.join(PROJECT_DIR, '.next', 'standalone', '.next', 'static'),
    label: '.next/static → .next/standalone/.next/static',
  },
  {
    src: path.join(PROJECT_DIR, 'public'),
    dest: path.join(PROJECT_DIR, '.next', 'standalone', 'public'),
    label: 'public → .next/standalone/public',
  },
];

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Source not found, skipping: ${src}`);
    return;
  }

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('Post-build: copying assets into standalone output...');

for (const task of TASKS) {
  console.log(`  ${task.label}`);
  copyRecursiveSync(task.src, task.dest);
}

console.log('Post-build: done.');
