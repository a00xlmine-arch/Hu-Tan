'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = __dirname;
const CONFIG_DIR = path.join(ROOT, 'config');
const DATA_DIR = path.join(ROOT, 'data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const APPSTATE_PATH = path.join(DATA_DIR, 'appstate.json');

fs.mkdirSync(CONFIG_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

function askSecret(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return rl.question(question, (answer) => resolve(answer.trim()));
    process.stdout.write(question);
    const stdin = process.stdin;
    const oldRaw = stdin.isRaw;
    let value = '';
    const onData = (chunk) => {
      const text = String(chunk);
      for (const ch of text) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(oldRaw || false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value.trim());
          return;
        }
        if (ch === '\u0003') {
          stdin.setRawMode(oldRaw || false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          resolve('');
          return;
        }
        if (ch === '\u007f') {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
          continue;
        }
        value += ch;
        process.stdout.write('*');
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

function parseAppState(raw) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('AppState يجب أن يكون مصفوفة JSON غير فارغة.');
  return parsed;
}

function parseYesNo(value, fallback = true) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  return !['لا', 'no', 'n', '0'].includes(normalized);
}

function writeSecure(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch (_) {}
}

async function main() {
  console.log('╭────────────────────────────────╮');
  console.log('│            HU TAN              │');
  console.log('│          0.2.0-beta            │');
  console.log('│          المطور: Rin Il        │');
  console.log('╰────────────────────────────────╯\n');
  console.log('سيتم حفظ AppState ومفاتيح API محليًا فقط. لا ترفعيها إلى GitHub.\n');

  let appState = null;
  while (!appState) {
    try {
      const source = await ask('مسار AppState (أو Enter للصق JSON): ');
      let raw;
      if (source) {
        raw = fs.readFileSync(path.resolve(source), 'utf8');
      } else {
        console.log('ألصقي AppState كاملًا في سطر واحد ثم اضغطي Enter.');
        raw = await ask('AppState: ');
      }
      appState = parseAppState(raw);
    } catch (error) {
      console.log(`✗ ${error.message}\n`);
    }
  }

  let groupID = '';
  while (!/^\d+$/.test(groupID)) {
    groupID = await ask('ID الغروب المسموح به: ');
    if (!/^\d+$/.test(groupID)) console.log('✗ يجب أن يكون ID الغروب أرقامًا فقط.');
  }

  const ownerID = await ask('ID المالك الإداري (Enter للاعتماد على حساب البوت): ');
  if (ownerID && !/^\d+$/.test(ownerID)) throw new Error('ID المالك يجب أن يكون أرقامًا فقط.');
  if (!ownerID) console.log('سيتم اعتبار حساب البوت مالكًا افتراضيًا بعد تسجيل الدخول.');

  const aiURL = await ask('رابط API للذكاء الاصطناعي (Enter للتخطي): ');
  const aiKey = aiURL ? await askSecret('مفتاح API (Enter إن لم يوجد): ') : '';
  const aiModel = aiURL ? await ask('اسم النموذج (اختياري): ') : '';
  const welcome = parseYesNo(await ask('تفعيل ترحيب الأعضاء؟ [نعم/لا]: '));
  const startupGreeting = parseYesNo(await ask('رسالة التعريف عند أول تشغيل في الغروب؟ [نعم/لا]: '));

  const config = {
    bot: {
      name: 'Hu Tan',
      developer: 'Rin Il',
      version: '0.2.0-beta',
      language: 'ar',
      prefix: '.',
      feminineSelfReference: true
    },
    facebook: {
      allowedThreadID: groupID,
      ownerID: ownerID || '',
      listenEvents: true,
      autoReconnect: true,
      selfListen: false,
      online: false,
      updatePresence: false,
      logLevel: 'error'
    },
    features: {
      welcome,
      startupGreeting,
      rank: true,
      economy: true,
      tasks: true,
      messageCounter: true,
      antiSpam: true
    },
    limits: {
      commandCooldownMs: 2500,
      maxCommandsPerMinute: 18,
      maxMessagesPer10Seconds: 8,
      workCooldownMs: 30 * 60 * 1000,
      dailyCooldownMs: 24 * 60 * 60 * 1000,
      replyTTLms: 10 * 60 * 1000,
      adminCacheMs: 30 * 1000,
      unknownCommandCooldownMs: 5000
    },
    ai: {
      enabled: Boolean(aiURL),
      url: aiURL,
      apiKey: aiKey,
      model: aiModel,
      allowEveryoneReply: false,
      temperature: 0.85,
      maxTokens: 500,
      timeoutMs: 30000,
      feminineSystemPrompt: 'أنتِ Hu Tan، فتاة عادية هادئة ولطيفة تتحدث بالعربية الطبيعية داخل دردشة جماعية. استخدمي صيغة المؤنث عند الحديث عن نفسك. لا تذكري كونك نموذج ذكاء اصطناعي إلا إذا سُئلتِ مباشرة عن طبيعتك. لا تستعملي اعتذارات آلية أو مقدمات مصطنعة. كوني قصيرة وطبيعية وراعي السياق. لا تدّعي أشياء لم تفعليها، ولا تزعمين امتلاك مشاعر أو حياة حقيقية خارج المحادثة.'
    }
  };

  writeSecure(APPSTATE_PATH, appState);
  writeSecure(CONFIG_PATH, config);
  console.log('\n✓ تم حفظ AppState.');
  console.log('✓ تم حفظ إعدادات Hu Tan.');
  console.log('✓ الغروب مقيد إلى ID واحد.');
  console.log('\nشغّلي البوت بـ: npm start\n');
  rl.close();
}

main().catch((error) => {
  console.error(`\n✗ فشل الإعداد: ${error.message}`);
  rl.close();
  process.exit(1);
});
