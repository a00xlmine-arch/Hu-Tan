'use strict';

class ReplyManager {
  constructor(ttlMs = 600000) {
    this.ttlMs = ttlMs;
    this.entries = new Map();
  }
  set(messageID, entry) {
    if (!messageID) return;
    this.entries.set(String(messageID), { ...entry, expiresAt: Date.now() + this.ttlMs });
  }
  get(messageID) {
    const entry = this.entries.get(String(messageID || ''));
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) { this.entries.delete(String(messageID)); return null; }
    return entry;
  }
  delete(messageID) { this.entries.delete(String(messageID || '')); }
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) this.entries.delete(key);
  }
}

module.exports = ReplyManager;
