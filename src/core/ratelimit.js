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
    const cooldown = Math.max(0, this.commandCooldownMs);
    if (now - last < cooldown) return { ok: false, retryAfter: cooldown - (now - last) };

    const list = this.commandHistory.get(key) || [];
    this.purge(list, now, 60000);
    if (list.length >= this.maxCommandsPerMinute) {
      return { ok: false, retryAfter: Math.max(1000, 60000 - (now - list[0])) };
    }

    // Reserve before command execution so concurrent async commands cannot bypass the cooldown.
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

  cleanup(maxIdleMs = 15 * 60 * 1000) {
    const now = Date.now();
    const maps = [this.lastCommand, this.commandHistory, this.messageHistory, this.unknownHistory];
    for (const [key, value] of this.lastCommand) {
      if (now - value > maxIdleMs) this.lastCommand.delete(key);
    }
    for (const map of maps.slice(1)) {
      for (const [key, list] of map) {
        const latest = Array.isArray(list) ? list[list.length - 1] : list;
        if (!latest || now - latest > maxIdleMs) map.delete(key);
      }
    }
  }
}

module.exports = RateLimiter;
