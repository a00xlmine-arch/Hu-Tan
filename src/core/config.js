 'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'config.json');

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error('config/config.json غير موجود. شغّلي npm start لإكمال الإعداد.');

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`config.json غير صالح: ${error.message}`);
  }

  if (!/^\d+$/.test(String(config.facebook?.allowedThreadID || ''))) {
    throw new Error('facebook.allowedThreadID غير صالح.');
  }

  config.bot = {
    name: 'Hu Tan',
    developer: 'Rin Il',
    version: '0.2.1-beta',
    language: 'ar',
    prefix: '.',
    feminineSelfReference: true,
    ...config.bot,
    name: 'Hu Tan',
    developer: 'Rin Il',
    prefix: '.'
  };

  config.facebook = {
    listenEvents: true,
    autoReconnect: true,
    selfListen: false,
    online: false,
    updatePresence: false,
    logLevel: 'error',
    ownerID: '',
    ...config.facebook,
    allowedThreadID: String(config.facebook.allowedThreadID),
    ownerID: config.facebook.ownerID ? String(config.facebook.ownerID) : ''
  };

  config.features = {
    welcome: true,
    startupGreeting: true,
    rank: true,
    economy: true,
    tasks: true,
    messageCounter: true,
    antiSpam: true,
    ...config.features
  };

  config.limits = {
    commandCooldownMs: 2500,
    maxCommandsPerMinute: 18,
    maxMessagesPer10Seconds: 8,
    workCooldownMs: 30 * 60 * 1000,
    dailyCooldownMs: 24 * 60 * 60 * 1000,
    replyTTLms: 10 * 60 * 1000,
    adminCacheMs: 30 * 1000,
    unknownCommandCooldownMs: 5000,
    ...config.limits
  };
  for (const key of Object.keys(config.limits)) config.limits[key] = positiveNumber(config.limits[key], 1);

  config.ai = {
    enabled: Boolean(config.ai?.enabled && config.ai?.url),
    url: '',
    apiKey: '',
    model: '',
    allowEveryoneReply: false,
    temperature: 0.85,
    maxTokens: 500,
    timeoutMs: 30000,
    maxPromptChars: 4000,
    feminineSystemPrompt: 'أنتِ Hu Tan، فتاة عربية طبيعية وهادئة ولطيفة داخل دردشة جماعية. استخدمي صيغة المؤنث عند الحديث عن نفسك. تحدثي بعفوية وباختصار مناسب للسياق، ولا تستخدمي اعتذارات آلية أو عبارات روبوتية.',
    ...config.ai
  };
  config.ai.url = String(config.ai.url || '').trim();
  config.ai.apiKey = String(config.ai.apiKey || '');
  config.ai.model = String(config.ai.model || '').trim();
  config.ai.maxPromptChars = positiveNumber(config.ai.maxPromptChars, 4000);
  config.ai.maxTokens = positiveNumber(config.ai.maxTokens, 500);
  config.ai.timeoutMs = positiveNumber(config.ai.timeoutMs, 30000);

  return config;
}

module.exports = { ROOT, CONFIG_PATH, loadConfig };
