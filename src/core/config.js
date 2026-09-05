'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error('config/config.json غير موجود. شغّلي npm start.');
  let config;
  try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch (error) { throw new Error(`config.json غير صالح: ${error.message}`); }
  if (!/^\d+$/.test(String(config.facebook?.allowedThreadID || ''))) throw new Error('facebook.allowedThreadID غير صالح.');
  config.bot = { prefix: '.', language: 'ar', feminineSelfReference: true, ...config.bot, prefix: '.' };
  config.bot.name = 'Hu Tan';
  config.bot.developer = 'Rin Il';
  config.bot.version = config.bot.version || '0.2.0-beta';
  config.features = { welcome: true, startupGreeting: true, rank: true, economy: true, tasks: true, messageCounter: true, antiSpam: true, ...config.features };
  config.limits = {
    commandCooldownMs: 2500,
    maxCommandsPerMinute: 18,
    maxMessagesPer10Seconds: 8,
    workCooldownMs: 1800000,
    dailyCooldownMs: 86400000,
    replyTTLms: 600000,
    adminCacheMs: 30000,
    unknownCommandCooldownMs: 5000,
    ...config.limits
  };
  config.ai = {
    enabled: Boolean(config.ai?.enabled && config.ai?.url),
    allowEveryoneReply: false,
    temperature: 0.85,
    maxTokens: 500,
    timeoutMs: 30000,
    ...config.ai
  };
  return config;
}

module.exports = { ROOT, CONFIG_PATH, loadConfig };
