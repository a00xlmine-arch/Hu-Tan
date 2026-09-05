'use strict';

const fs = require('fs');
const path = require('path');

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function makeUser(id) {
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
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    dailyStats: { date: today(), messages: 0, commands: 0, gameWins: 0 }
  };
}

class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.tmpPath = `${filePath}.tmp`;
    this.data = { meta: { version: 2 }, users: {}, thread: {}, transactions: {} };
    this.writeTimer = null;
    this.writeAgain = false;
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) return this.saveSync();
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.data = {
        meta: parsed.meta || { version: 2 },
        users: parsed.users || {},
        thread: parsed.thread || {},
        transactions: parsed.transactions || {}
      };
      if (!this.data.meta.version) this.data.meta.version = 2;
    } catch (error) {
      throw new Error(`قاعدة البيانات تالفة: ${error.message}`);
    }
  }

  saveSync() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const payload = `${JSON.stringify(this.data, null, 2)}
`;
    fs.writeFileSync(this.tmpPath, payload, { mode: 0o600 });
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
      try { this.saveSync(); }
      catch (error) { console.error(`[DB] ${error.message}`); this.writeAgain = true; this.scheduleSave(); }
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
    if (!user.dailyStats || user.dailyStats.date !== today()) user.dailyStats = { date: today(), messages: 0, commands: 0, gameWins: 0 };
    user.taskState = user.taskState || { date: '', claimed: [] };
    user.coins = Number.isFinite(user.coins) ? Math.max(0, Math.floor(user.coins)) : 0;
    user.bank = Number.isFinite(user.bank) ? Math.max(0, Math.floor(user.bank)) : 0;
    return user;
  }

  getThread() {
    if (!this.data.thread || typeof this.data.thread !== 'object') this.data.thread = {};
    if (!this.data.thread.id) {
      this.data.thread = {
        id: '',
        name: 'الغروب',
        quiet: false,
        welcome: true,
        startupGreetingSent: false,
        totalMessages: 0,
        totalCommands: 0,
        createdAt: Date.now()
      };
    }
    return this.data.thread;
  }

  touchUser(user, name) {
    if (name) user.name = String(name).replace(/\s+/g, ' ').trim() || user.name;
    const date = today();
    if (user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    user.messages += 1;
    user.dailyStats.messages += 1;
    user.lastSeen = Date.now();
  }

  touchCommand(user) {
    const date = today();
    if (user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    user.commands += 1;
    user.dailyStats.commands += 1;
  }

  touchGameWin(user) {
    const date = today();
    if (user.dailyStats.date !== date) user.dailyStats = { date, messages: 0, commands: 0, gameWins: 0 };
    user.dailyStats.gameWins += 1;
  }

  addXP(user, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const before = user.level;
    user.xp += Math.floor(amount);
    user.level = 1 + Math.floor(Math.sqrt(user.xp / 50));
    return user.level > before;
  }

  addTransaction(userID, type, amount, peerID = '', note = '') {
    const key = String(userID);
    if (!this.data.transactions[key]) this.data.transactions[key] = [];
    this.data.transactions[key].unshift({ at: Date.now(), type: String(type), amount: Number(amount), peerID: String(peerID || ''), note: String(note || '') });
    this.data.transactions[key] = this.data.transactions[key].slice(0, 20);
  }

  getTransactions(userID) {
    return this.data.transactions[String(userID)] || [];
  }

  resetUser(userID, name) {
    this.data.users[String(userID)] = makeUser(String(userID));
    this.data.users[String(userID)].name = String(name || 'عضوة');
    this.data.transactions[String(userID)] = [];
    return this.data.users[String(userID)];
  }
}

module.exports = Database;
