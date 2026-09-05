'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function walk(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.disabled.js')) result.push(full);
  }
  return result.sort();
}

class CommandManager {
  constructor(root) {
    this.root = root;
    this.commands = new Map();
  }
  load() {
    this.commands.clear();
    for (const full of walk(this.root)) {
      delete require.cache[require.resolve(full)];
      const command = require(full);
      this.register(command, path.relative(this.root, full));
    }
    logger.info(`تم تحميل ${this.list().length} أمرًا و${this.commands.size} اسم/مرادف.`);
  }
  register(command, file) {
    if (!command || !command.name || typeof command.execute !== 'function') throw new Error(`الأمر ${file} غير صالح.`);
    const names = [command.name, ...(Array.isArray(command.aliases) ? command.aliases : [])]
      .map((name) => String(name).trim().toLowerCase()).filter(Boolean);
    for (const name of names) if (this.commands.has(name)) throw new Error(`اسم الأمر مكرر: ${name} (${file})`);
    for (const name of names) this.commands.set(name, command);
  }
  get(name) { return this.commands.get(String(name || '').trim().toLowerCase()); }
  list() {
    const seen = new Set();
    const result = [];
    for (const command of this.commands.values()) {
      if (!seen.has(command)) { seen.add(command); result.push(command); }
    }
    return result;
  }
  categories() {
    const map = new Map();
    for (const command of this.list()) {
      const category = String(command.category || 'متفرقات');
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(command);
    }
    for (const values of map.values()) values.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
    return map;
  }
}

module.exports = CommandManager;
