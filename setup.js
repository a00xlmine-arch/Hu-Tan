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
          try { stdin.setRawMode(oldRaw || false); } catch (_) {}
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value.trim());
          return;
        }
        if (ch === '\u0003') {
          try { stdin.setRawMode(oldRaw || false); } catch (_) {}
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
    try { stdin.setRawMode(true); } catch (_) {}
    stdin.resume();
    stdin.on('data', onData);
  });
}

function parseAppState(raw) {
  let parsed;
  try {
    parsed = JSON.parse(String(raw).replace(/^\uFEFF/, '').trim());
  } catch (error) {
    throw new Error(`تعذر تحليل AppState كـ JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AppState يجب أن يكون مصفوفة JSON غير فارغة.');
  }
  const valid = parsed.every((item) => item && typeof item === 'object' && !Array.isArray(item));
  if (!valid) throw new Error('كل عنصر في AppState يجب أن يكون كائن JSON.');
  return parsed;
}

function parseYesNo(value, fallback = true) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  return !['لا', 'no', 'n', '0', 'false'].includes(normalized);
}

function writeSecure(filePath, value) {
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, payload, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch (_) {}
}

function readExistingAppState() {
  if (!fs.existsSync(APPSTATE_PATH)) return null;
  try {
    return parseAppState(fs.readFileSync(APPSTATE_PATH, 'utf8'));
  } catch (_) {
    return null;
  }
}

async function getAppState() {
  const existing = readExistingAppState();
  if (existing) {
    const useExisting = parseYesNo(await ask('وُجد AppState محفوظ. هل تريدين استخدامه؟ [نعم/لا]: '), true);
    if (useExisting) return existing;
  }

  while (true) {
    try {
      const source = await ask('مسار ملف AppState (مثال: data/appstate.json): ');
      if (!source) throw new Error('أدخلي مسار ملف AppState.');
      const filePath = path.resolve(ROOT, source);
      if (!fs.existsSync(filePath)) throw new Error(`الملف غير موجود: ${filePath}`);
      return parseAppState(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.log(`✗ ${error.message}\n`);
    }
  }
}

async function askNumeric(label, allowEmpty = false) {
  while (true) {
    const value = await ask(label);
    if (allowEmpty && !value) return '';
    if (/^\d+$/.test(value)) return value;
    console.log('✗ يجب أن يكون الرقم مكوّنًا من أرقام فقط.\n');
  }
}

async function main() {
  console.log('╭────────────────────────────────────╮');
  console.log('│              HU TAN                │');
  console.log('│            0.2.1-beta              │');
  console.log('│            المطور: Rin Il          │');
  console.log('╰────────────────────────────────────╯\n');
  console.log('كل الأسرار تُحفظ محليًا فقط. لا ترفعي AppState أو config.json إلى GitHub.\n');

  const appState = await getAppState();
  const groupID = await askNumeric('ID الغروب المسموح به: ');
  const ownerID = await askNumeric('ID المالك الإداري (Enter للاعتماد على حساب البوت): ', true);

  const aiURL = await ask('رابط API للذكاء الاصطناعي (Enter للتخطي): ');
  let aiKey = '';
  let aiModel = '';
  if (aiURL) {
    aiKey = await askSecret('مفتاح API (Enter إن لم يوجد): ');
    aiModel = await ask('اسم النموذج (اختياري): ');
  }

  const welcome = parseYesNo(await ask('تفعيل ترحيب العضوات؟ [نعم/لا]: '), true);
  const startupGreeting = parseYesNo(await ask('إرسال رسالة التعريف عند أول تشغيل؟ [نعم/لا]: '), true);

  const config = {
    bot: {
      name: 'Hu Tan',
      developer: 'Rin Il',
      version: '0.2.1-beta',
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
      maxPromptChars: 4000,
      feminineSystemPrompt: 'أنتِ Hu Tan، فتاة عربية طبيعية وهادئة ولطيفة داخل دردشة جماعية. استخدمي صيغة المؤنث عند الحديث عن نفسك. تحدثي بعفوية وباختصار مناسب للسياق، ولا تستخدمي اعتذارات آلية أو عبارات روبوتية. لا تدّعي تنفيذ أشياء لم تنفذيها، ولا تقدمي نفسك على أنك تملكين حياة حقيقية خارج المحادثة. لا تذكري تفاصيل تقنية عن النموذج أو واجهة API إلا عند السؤال عنها مباشرة.'
    }
  };

  writeSecure(APPSTATE_PATH, appState);
  writeSecure(CONFIG_PATH, config);

  const dbPath = path.join(DATA_DIR, 'database.json');
  if (!fs.existsSync(dbPath)) {
    writeSecure(dbPath, { meta: { version: 3 }, users: {}, thread: {}, transactions: {} });
  }

  console.log('\n✓ تم حفظ AppState محليًا.');
  console.log('✓ تم حفظ إعدادات Hu Tan محليًا.');
  console.log('✓ تم قفل البوت على غروب واحد.');
  console.log('\nشغّلي البوت بـ: npm start\n');
  rl.close();
}

main().catch((error) => {
  console.error(`\n✗ فشل الإعداد: ${error.stack || error.message}`);
  try { rl.close(); } catch (_) {}
  process.exit(1);
});
