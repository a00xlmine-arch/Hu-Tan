'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const messenger = require('../src/services/messenger');
const Database = require('../src/core/database');
const RateLimiter = require('../src/core/ratelimit');

(async () => {
  const calls = [];
  const callbackApi = {
    sendMessage(message, threadID, callback, messageID) { calls.push(['send', message, threadID, messageID]); callback(null, { messageID: 'm1' }); },
    getThreadInfo(threadID, callback) { callback(null, { threadName: 'اختبار', adminIDs: ['1'] }); },
    removeUserFromGroup(userID, threadID, callback) { calls.push(['remove', userID, threadID]); callback(null, true); },
    setMessageReaction(reaction, messageID, callback) { calls.push(['react', reaction, messageID]); callback(null, true); }
  };
  const sendResult = await messenger.send(callbackApi, 'رسالة', '123', 'parent');
  if (sendResult.messageID !== 'm1' || calls[0][3] !== 'parent') throw new Error('فشل موضع messageID في sendMessage.');
  const info = await messenger.getThreadInfo(callbackApi, '123');
  if (info.threadName !== 'اختبار') throw new Error('فشل getThreadInfo.');
  await messenger.removeUser(callbackApi, '9', '123');
  await messenger.setReaction(callbackApi, '❤️', 'm1');

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hutan-int-'));
  const dbPath = path.join(temp, 'db.json');
  const db = new Database(dbPath); db.load();
  const user = db.getUser('1');
  db.touchUser(user, 'تجربة'); db.addXP(user, 600); db.addTransaction('1', 'اختبار', 50); db.scheduleSave();
  await new Promise((resolve) => setTimeout(resolve, 650));
  const db2 = new Database(dbPath); db2.load();
  if (db2.getUser('1').name !== 'تجربة' || db2.getTransactions('1').length !== 1) throw new Error('فشل حفظ/قراءة قاعدة البيانات.');
  db2.close(); db.close();

  const limiter = new RateLimiter({ commandCooldownMs: 1000, maxCommandsPerMinute: 2, maxMessagesPer10Seconds: 2 });
  if (!limiter.commandAllowed('1').ok) throw new Error('فشل command cooldown.');
  if (limiter.commandAllowed('1').ok) throw new Error('تم تجاوز command cooldown.');
  if (!limiter.messageAllowed('1') || !limiter.messageAllowed('1') || limiter.messageAllowed('1')) throw new Error('فشل message rate limit.');

  fs.rmSync(temp, { recursive: true, force: true });
  console.log('✓ اختبار API المحلي، قاعدة البيانات، والـrate limits ناجح.');
})().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
