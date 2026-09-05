 'use strict';

const path = require('path');
const fs = require('fs');
const { createContext } = require('./context');
const { isAdmin } = require('./permissions');
const { box, msToText } = require('../utils/format');
const logger = require('../utils/logger');

function loadEventHandlers(root) {
  const handlers = [];
  if (!fs.existsSync(root)) return handlers;
  for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.js')).sort()) {
    const full = path.join(root, file);
    delete require.cache[require.resolve(full)];
    const handler = require(full);
    if (typeof handler === 'function') handlers.push({ name: file, handler });
  }
  return handlers;
}

function featureForCategory(category) {
  const map = {
    level: 'rank',
    economy: 'economy',
    tasks: 'tasks',
    ai: 'ai'
  };
  return map[category] || null;
}

class Dispatcher {
  constructor(app) {
    this.app = app;
    this.eventHandlers = loadEventHandlers(path.join(__dirname, '..', 'events'));
  }

  parseCommand(body) {
    const text = String(body || '').trim();
    const prefix = this.app.config.bot.prefix;
    if (!text.startsWith(prefix)) return null;
    const rest = text.slice(prefix.length).trim();
    if (!rest) return null;
    const parts = rest.split(/\s+/);
    const name = String(parts.shift() || '').trim().toLowerCase();
    if (!name) return null;
    return { name, args: parts, raw: rest };
  }

  async safeSend(message, threadID, messageID) {
    try {
      await this.app.send(message, threadID, messageID);
      return true;
    } catch (error) {
      logger.error(`فشل إرسال رسالة: ${error.message}`);
      return false;
    }
  }

  async isAdmin(userID, threadID) {
    return isAdmin(
      this.app.api,
      threadID,
      userID,
      this.app.config.facebook.ownerID,
      Number(this.app.config.limits.adminCacheMs)
    );
  }

  async runCommand(event, parsed, options = {}) {
    const command = this.app.commandManager.get(parsed.name);
    if (!command) {
      if (this.app.limiter.unknownAllowed(event.senderID)) {
        await this.safeSend(
          box('Hu Tan', [
            `الأمر «${parsed.name}» غير موجود.`,
            `اكتبي ${this.app.config.bot.prefix}القائمة لرؤية الأوامر.`
          ]),
          event.threadID
        );
      }
      return true;
    }

    const thread = this.app.db.getThread();
    if (!options.fromReply && thread.quiet && command.category !== 'admin' && command.name !== 'وضع_الهدوء') return true;

    const feature = featureForCategory(command.category);
    if (feature && this.app.config.features[feature] === false) {
      await this.safeSend(`قسم «${command.category}» متوقف حاليًا.`, event.threadID);
      return true;
    }

    const rate = this.app.limiter.commandAllowed(event.senderID);
    if (!rate.ok) {
      await this.safeSend(`⏳ تمهّلي قليلًا، عودي بعد ${msToText(rate.retryAfter)}.`, event.threadID);
      return true;
    }

    const user = this.app.db.getUser(event.senderID);
    this.app.db.touchCommand(user);
    thread.totalCommands += 1;
    this.app.db.scheduleSave();

    const ctx = createContext(this.app, event, parsed.name, parsed.args);
    try {
      if (command.adminOnly) await ctx.requireAdmin();
      await command.execute(ctx, options);
    } catch (error) {
      logger.error(`الأمر .${command.name}: ${error.stack || error.message}`);
      await this.safeSend(`تعذر تنفيذ .${command.name}.\n${error.message}`, event.threadID);
    }
    return true;
  }

  async process(event) {
    if (!event) return;
    const threadID = String(event.threadID || '');
    if (threadID !== String(this.app.config.facebook.allowedThreadID)) return;

    for (const { handler } of this.eventHandlers) {
      try {
        const handled = await handler(this.app, event, this);
        if (handled === true) return;
      } catch (error) {
        logger.error(`حدث ${event.type || event.eventType || 'غير معروف'}: ${error.stack || error.message}`);
      }
    }
  }
}

module.exports = Dispatcher;
