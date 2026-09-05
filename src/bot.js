 'use strict';

const fs = require('fs');
const path = require('path');
const login = require('@anbuinfosec/fca-unofficial');
const { loadConfig, ROOT, CONFIG_PATH } = require('./core/config');
const Database = require('./core/database');
const RateLimiter = require('./core/ratelimit');
const CommandManager = require('./core/command-manager');
const ReplyManager = require('./core/reply-manager');
const Dispatcher = require('./core/dispatcher');
const AIService = require('./services/ai');
const EconomyService = require('./services/economy');
const TaskService = require('./services/tasks');
const messenger = require('./services/messenger');
const { isAdmin } = require('./core/permissions');
const logger = require('./utils/logger');
const { box } = require('./utils/format');

function loginWithAppState(credentials, options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (error, api) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(api);
    };

    try {
      if (login.length >= 3) {
        login(credentials, options, done);
        return;
      }
      const result = login(credentials, options);
      if (result && typeof result.then === 'function') result.then((api) => done(null, api), done);
      else if (result) done(null, result);
      else setTimeout(() => done(new Error('واجهة تسجيل الدخول لم تُعد نتيجة.')), 15000);
    } catch (error) {
      done(error);
    }
  });
}

function readAppState(filePath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`تعذر قراءة AppState: ${error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('AppState فارغ أو غير صالح.');
  return parsed;
}

function secureWriteJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch (_) {}
}

const config = loadConfig();
const appStatePath = path.join(ROOT, 'data', 'appstate.json');
const db = new Database(path.join(ROOT, 'data', 'database.json'));
db.load();

const thread = db.getThread({
  welcome: config.features.welcome !== false,
  startupGreetingEnabled: config.features.startupGreeting !== false
});
thread.id = String(config.facebook.allowedThreadID);
if (!thread.name) thread.name = 'الغروب';
db.scheduleSave();

const commandManager = new CommandManager(path.join(__dirname, 'commands'));
commandManager.load();
const replyManager = new ReplyManager(Number(config.limits.replyTTLms));
const limiter = new RateLimiter(config.limits);
const ai = new AIService(config);
const economy = new EconomyService(db, config.limits);
const tasks = new TaskService(db);

const app = {
  api: null,
  botID: '',
  config,
  db,
  thread,
  commandManager,
  replyManager,
  limiter,
  ai,
  economy,
  tasks,
  services: messenger,
  mathGames: new Map(),
  startedAt: Date.now(),
  stopListening: null,
  send(message, threadID, messageID) {
    return messenger.send(this.api, message, threadID, messageID);
  },
  async isAdmin(userID, threadID) {
    return isAdmin(
      this.api,
      threadID,
      userID,
      this.config.facebook.ownerID,
      Number(this.config.limits.adminCacheMs)
    );
  },
  async requireAdmin(userID, threadID) {
    if (!(await this.isAdmin(userID, threadID))) throw new Error('هذا الأمر مخصص لإدارة الغروب.');
  }
};

const dispatcher = new Dispatcher(app);
let shuttingDown = false;

async function safeSend(message, threadID, messageID) {
  try {
    await app.send(message, threadID, messageID);
    return true;
  } catch (error) {
    logger.error(`فشل إرسال رسالة: ${error.message}`);
    return false;
  }
}

async function sendStartupGreeting() {
  if (!thread.startupGreetingEnabled || thread.startupGreetingSent) return;

  const sent = await safeSend(
    box('Hu Tan', [
      'مرحبًا، أنا Hu Tan.',
      'سعيدة بوجودي معكنّ في هذا الغروب.',
      `هذه النسخة ${config.bot.version}.`,
      'المطور: Rin Il',
      '',
      `اكتبي ${config.bot.prefix}القائمة لاكتشاف ما لديّ.`
    ]),
    config.facebook.allowedThreadID
  );

  if (sent) {
    thread.startupGreetingSent = true;
    db.scheduleSave();
  }
}

async function validateThread() {
  try {
    const info = await messenger.getThreadInfo(app.api, config.facebook.allowedThreadID);
    if (info?.threadName) {
      thread.name = String(info.threadName);
      db.scheduleSave();
    }
    return info;
  } catch (error) {
    logger.warn(`تعذر قراءة معلومات الغروب: ${error.message}`);
    return null;
  }
}

async function refreshAppState() {
  if (typeof app.api?.getAppState !== 'function') return;
  try {
    const value = await Promise.resolve(app.api.getAppState());
    if (Array.isArray(value) && value.length) secureWriteJson(appStatePath, value);
  } catch (error) {
    logger.warn(`تعذر تحديث AppState المحلي: ${error.message}`);
  }
}

async function main() {
  if (!fs.existsSync(appStatePath)) throw new Error('data/appstate.json غير موجود. شغّلي npm start لإكمال الإعداد.');
  const appState = readAppState(appStatePath);

  logger.info('جارٍ تسجيل الدخول إلى Messenger...');
  try {
    app.api = await loginWithAppState(
      { appState },
      {
        listenEvents: config.facebook.listenEvents !== false,
        autoReconnect: config.facebook.autoReconnect !== false,
        selfListen: config.facebook.selfListen === true,
        online: config.facebook.online === true,
        updatePresence: config.facebook.updatePresence === true,
        logLevel: config.facebook.logLevel || 'error'
      }
    );
  } catch (error) {
    throw new Error(`فشل تسجيل الدخول: ${error.message}`);
  }

  app.botID = messenger.getCurrentUserID(app.api);
  if (!config.facebook.ownerID && app.botID) {
    config.facebook.ownerID = app.botID;
    secureWriteJson(CONFIG_PATH, config);
  }

  await refreshAppState();

  logger.info(`تم تسجيل الدخول: ${app.botID || 'الحساب غير معروف'}`);
  logger.info(`الغروب المسموح: ${config.facebook.allowedThreadID}`);

  if (typeof app.api.setOptions === 'function') {
    app.api.setOptions({
      listenEvents: config.facebook.listenEvents !== false,
      autoReconnect: config.facebook.autoReconnect !== false,
      selfListen: config.facebook.selfListen === true,
      online: config.facebook.online === true,
      updatePresence: config.facebook.updatePresence === true,
      logLevel: config.facebook.logLevel || 'error'
    });
  }

  const info = await validateThread();
  if (info && info.threadID && String(info.threadID) !== String(config.facebook.allowedThreadID)) {
    throw new Error('تعذر مطابقة الغروب المحدد مع معلومات Messenger.');
  }

  await sendStartupGreeting();

  if (typeof app.api.listenMqtt !== 'function') throw new Error('مكتبة Messenger لا توفر listenMqtt.');

  const stop = app.api.listenMqtt((error, event) => {
    if (error) {
      logger.error(`اتصال Messenger: ${error.message || error}`);
      return;
    }
    Promise.resolve()
      .then(() => dispatcher.process(event))
      .catch((handlerError) => logger.error(`معالجة الحدث: ${handlerError.stack || handlerError.message}`));
  });
  if (typeof stop === 'function') app.stopListening = stop;

  const cleanupTimer = setInterval(() => {
    replyManager.cleanup();
    limiter.cleanup();
    const now = Date.now();
    for (const [userID, game] of app.mathGames) {
      if (!game || game.expiresAt <= now) app.mathGames.delete(userID);
    }
  }, 60000);
  cleanupTimer.unref?.();

  const saveTimer = setInterval(() => db.scheduleSave(), 15000);
  saveTimer.unref?.();

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`إيقاف Hu Tan بسبب ${signal}...`);
    try { app.stopListening?.(); } catch (_) {}
    try { clearInterval(cleanupTimer); } catch (_) {}
    try { clearInterval(saveTimer); } catch (_) {}
    try { db.close(); } catch (error) { logger.error(`فشل حفظ قاعدة البيانات: ${error.message}`); }
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  logger.info(box('HU TAN', [
    'الحالة: تعمل',
    `الإصدار: ${config.bot.version}`,
    'اللغة: العربية',
    `الأوامر: ${commandManager.list().length}`,
    `الغروب: ${thread.name}`,
    'المطور: Rin Il'
  ]));
}

main().catch((error) => {
  logger.error(error.stack || error.message);
  process.exitCode = 1;
});
