 'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const errors = [];
const ignoredDirs = new Set(['node_modules', '.git', 'coverage', 'dist']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && full.endsWith('.js')) {
      try {
        execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
      } catch (error) {
        errors.push(`${path.relative(root, full)}\n${error.stderr?.toString() || error.message}`);
      }
    }
  }
}

walk(root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('✓ فحص Syntax لجميع ملفات JavaScript ناجح.');
