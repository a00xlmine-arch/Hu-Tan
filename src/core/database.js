 'use strict';

const fs = require('fs');
const path = require('path');

function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function integer(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback;
}

function safeNonNegative(value, fallback = 0) {
  return Math.max(0, integer(value, fallback));
}

function makeUser(id) {
  const now = Date.now();
  return {
    id: String(id),
    name: 'عضوة',
    messages: 0,
    commands: 0,
    xp: 0,
    level: 1,
    coins: 500,
    bank: 0,
    warnings: 0,
    lastDaily: 0,
    lastWork: 0,
    taskState: { date: '', claimed: [] },
    gameWins: 0,
    gameLosses: 0,
    gameDraws: 0,
    joinedAt: now,
    lastSeen: now,
    dailyStats: { date: today(), messages: 0, commands: 0, gameWins: 0 }
  };
}

function makeThread(id = '') {
  return {
    id: String(id),
    name: 'الغروب',
    quiet: false,
    welcome: true,
    startupGreetingEnabled: true,
    startupGreetingSent: false,
    totalMessages: 0,
    totalCommands: 0,
    createdAt: Date.now()
  };
}

class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.tmpPath = `${filePath}.tmp`;
    this.data = { meta: { version: 3 }, users: {}, thread: {}, transactions: {} };
    this.writeTimer = null;
    this.writeAgain = false;
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) return this.saveSync();

    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.data = {
        meta: parsed?.meta || { version: 3 },
        users: parsed?.users && typeof parsed.users === 'object' ? parsed.users : {},
        thread: parsed?.thread && typeof parsed.thread === 'object' ? parsed.thread : {},
        transactions: parsed?.transactions && typeof parsed.transactions === 'object' ? parsed.transactions : {}
      };
      this.data.meta.version = 3;
      this.migrate();
    } catch (error) {
      throw new Error(`قاعدة البيانات تالفة: ${error.message}`);
    }
  }

  migrate() {
    const thread = this.data.thread;
    if (!thread.id) this.data.thread = makeThread('');
    else {
      thread.id = String(thread.id);
      if (typeof thread.name !== 'string' || !thread.name.trim()) thread.name = 'الغروب';
      if (typeof thread.quiet !== 'boolean') thread.quiet = false;
      if (typeof thread.welcome !== 'boolean') thread.welcome = true;
      if (typeof thread.startupGreetingEnabled !== 'boolean') {
        thread.startupGreetingEnabled = true;
      }
      if (typeof thread.startupGreetingSent !== 'boolean') thread.startupGreetingSent = false;
      thread.totalMessages = safeNonNegative(thread.totalMessages);
      thread.totalCommands = safeNonNegative(thread.totalCommands);
      thread.createdAt = number(thread.createdAt, Date.now());
    }

    for (const [id, raw] of Object.entries(this.data.users)) {
      const user = raw && typeof raw === 'object' ? raw : makeUser(id);
      user.id = String(user.id || id);
      user.name = String(user.name || 'عضوة').trim() || 'عضوة';
      for (const field of ['messages', 'commands', 'xp', 'warnings', 'gameWins', 'gameLosses', 'gameDraws']) user[field] = safeNonNegative(user[field]);
      user.level = Math.max(1, safeNonNegative(user.level, 1));
      user.coins = safeNonNegative(user.coins, 500);
      user.bank = safeNonNegative(user.bank);
      user.lastDaily = safeNonNegative(user.lastDaily);
      user.lastWork = safeNonNegative(user.lastWork);
      user.joinedAt = number(user.joinedAt, Date.now());
      user.lastSeen = number(user.lastSeen, Date.now());
      if (!user.taskState || typeof user.taskState !== 'object') user.taskState = { date: '', claimed: [] };
      if (!Array.isArray(user.taskState.claimed)) user.taskState.claimed = [];
      if (!user.dailyStats || typeof user.dailyStats !== 'object') user.dailyStats = { date: today(), messages: 0, commands: 0, gameWins: 0 };
      if (user.dailyStats.date !== today()) user.dailyStats = { date: today(), messages: 0, commands: 0, gameWins: 0 };
      user.dailyStats.messages = safeNonNegative(user.dailyStats.messages);
      user.dailyStats.commands = safeNonNegative(user.dailyStats.commands);
      user.dailyStats.gameWins = safeNonNegative(user.dailyStats.gameWins);
      this.data.users[id] = user;
    }
  }

  saveSync() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const payload = `${JSON.stringify(this.data, null, 2)}\n`;
    fs.writeFileSync(this.tmpPath, payload, { mode: 0o600 });
    try { fs.chmodSync(this.tmpPath, 0o600); } catch (_) {}
    fs.renameSync(this.tmpPath, this.filePath);
    try { fs.chmodSync(this.filePath, 0o600); } catch (_) {}
  }

  scheduleSave() {
    this.writeAgain = true;
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      if (!this.writeAgain) return;
      this.writeAgain = false;
      try {
        this.saveSync();
      } catch (error) {
        console.error(`[DB] ${error.message}`);
        this.writeAgain = true;
        this.scheduleSave();
      }
    }, 500);
    this.writeTimer.unref?.();
  }

  close() {
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = null;
    this.writeAgain = false;
    this.saveSync();
  }

  getUser(id) {
    const key = String(id);
    if (!this.data.users[key]) this.data.users[key] = makeUser(key);
    const user = this.data.users[key];
    const date = today();
    if (!user.dailyStats || user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    user.taskState = user.taskState && typeof user.taskState === 'object' ? user.taskState : { date: '', claimed: [] };
    if (!Array.isArray(user.taskState.claimed)) user.taskState.claimed = [];
    user.coins = safeNonNegative(user.coins);
    user.bank = safeNonNegative(user.bank);
    user.xp = safeNonNegative(user.xp);
    user.level = Math.max(1, safeNonNegative(user.level, 1));
    return user;
  }

  getUsers() {
    return Object.values(this.data.users).map((user) => this.getUser(user.id));
  }

  getThread(defaults = {}) {
    if (!this.data.thread || typeof this.data.thread !== 'object' || Array.isArray(this.data.thread)) this.data.thread = makeThread('');
    const thread = this.data.thread;
    if (!thread.id) {
      const fresh = makeThread('');
      fresh.welcome = defaults.welcome !== undefined ? Boolean(defaults.welcome) : fresh.welcome;
      fresh.startupGreetingEnabled = defaults.startupGreetingEnabled !== undefined ? Boolean(defaults.startupGreetingEnabled) : fresh.startupGreetingEnabled;
      Object.assign(thread, fresh);
    }
    if (typeof thread.welcome !== 'boolean') thread.welcome = defaults.welcome !== undefined ? Boolean(defaults.welcome) : true;
    if (typeof thread.startupGreetingEnabled !== 'boolean') thread.startupGreetingEnabled = defaults.startupGreetingEnabled !== undefined ? Boolean(defaults.startupGreetingEnabled) : true;
    if (typeof thread.startupGreetingSent !== 'boolean') thread.startupGreetingSent = false;
    if (typeof thread.quiet !== 'boolean') thread.quiet = false;
    thread.totalMessages = safeNonNegative(thread.totalMessages);
    thread.totalCommands = safeNonNegative(thread.totalCommands);
    return thread;
  }

  touchUser(user, name, options = {}) {
    const countMessage = options.countMessage !== false;
    if (name) user.name = String(name).replace(/\s+/g, ' ').trim() || user.name;
    const date = today();
    if (!user.dailyStats || user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    if (countMessage) {
      user.messages += 1;
      user.dailyStats.messages += 1;
    }
    user.lastSeen = Date.now();
  }

  touchCommand(user) {
    const date = today();
    if (!user.dailyStats || user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    user.commands += 1;
    user.dailyStats.commands += 1;
  }

  touchGameWin(user) {
    const date = today();
    if (!user.dailyStats || user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    user.dailyStats.gameWins += 1;
  }

  addXP(user, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const before = user.level;
    user.xp = safeNonNegative(user.xp) + Math.floor(amount);
    user.level = Math.max(1, 1 + Math.floor(Math.sqrt(user.xp / 50)));
    return user.level > before;
  }

  addTransaction(userID, type, amount, peerID = '', note = '') {
    const key = String(userID);
    if (!this.data.transactions[key]) this.data.transactions[key] = [];
    this.data.transactions[key].unshift({
      at: Date.now(),
      type: String(type),
      amount: integer(amount),
      peerID: String(peerID || ''),
      note: String(note || '')
    });
    this.data.transactions[key] = this.data.transactions[key].slice(0, 30);
  }

  getTransactions(userID) {
    return Array.isArray(this.data.transactions[String(userID)]) ? this.data.transactions[String(userID)] : [];
  }

  resetUser(userID, name) {
    const key = String(userID);
    const user = makeUser(key);
    user.name = String(name || 'عضوة');
    this.data.users[key] = user;
    this.data.transactions[key] = [];
    return user;
  }
}

module.exports = Database;
