'use strict';
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..'); const errors = [];
function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (['node_modules', '.git'].includes(e.name)) continue; const full = path.join(dir, e.name); if (e.isDirectory()) walk(full); else if (e.isFile() && full.endsWith('.js')) { try { execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' }); } catch (err) { errors.push(`${path.relative(root, full)}\n${err.stderr?.toString() || err.message}`); } } } }
walk(root); if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('✓ فحص Syntax لجميع ملفات JavaScript ناجح.');
