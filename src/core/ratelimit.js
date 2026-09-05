'use strict';

class RateLimiter {
  constructor(options = {}) {
    this.commandCooldownMs = Number(options.commandCooldownMs || 2500);
    this.maxCommandsPerMinute = Number(options.maxCommandsPerMinute || 18);
    this.maxMessagesPer10Seconds = Number(options.maxMessagesPer10Seconds || 8);
    this.unknownCommandCooldownMs = Number(options.unknownCommandCooldownMs || 5000);
    this.lastCommand = new Map();
    this.commandHistory = new Map();
    this.messageHistory = new Map();
    this.unknownHistory = new Map();
  }

  purge(list, now, windowMs) {
    while (list.length && now - list[0] > windowMs) list.shift();
  }

  messageAllowed(userID) {
    const now = Date.now();
    const key = String(userID);
    const list = this.messageHistory.get(key) || [];
    this.purge(list, now, 10000);
    if (list.length >= this.maxMessagesPer10Seconds) return false;
    list.push(now);
    this.messageHistory.set(key, list);
    return true;
  }

  commandAllowed(userID) {
    const now = Date.now();
    const key = String(userID);
    const last = this.lastCommand.get(key) || 0;
    if (now - last < this.commandCooldownMs) return { ok: false, retryAfter: this.commandCooldownMs - (now - last) };
    const list = this.commandHistory.get(key) || [];
    this.purge(list, now, 60000);
    if (list.length >= this.maxCommandsPerMinute) return { ok: false, retryAfter: Math.max(1000, 60000 - (now - list[0])) };
    this.lastCommand.set(key, now);
    list.push(now);
    this.commandHistory.set(key, list);
    return { ok: true, retryAfter: 0 };
  }

  unknownAllowed(userID) {
    const now = Date.now();
    const key = String(userID);
    const last = this.unknownHistory.get(key) || 0;
    if (now - last < this.unknownCommandCooldownMs) return false;
    this.unknownHistory.set(key, now);
    return true;
  }
}

module.exports = RateLimiter;
