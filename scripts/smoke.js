 'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const CommandManager = require('../src/core/command-manager');
const Database = require('../src/core/database');
const EconomyService = require('../src/services/economy');
const TaskService = require('../src/services/tasks');
const RateLimiter = require('../src/core/ratelimit');
const ReplyManager = require('../src/core/reply-manager');
const AIService = require('../src/services/ai');

(async () => {
  const root = path.join(__dirname, '..');
  const manager = new CommandManager(path.join(root, 'src', 'commands'));
  manager.load();

  const required = [
    'القائمة', 'معلومات', 'فحص', 'رسائلي', 'ملفي', 'رتبتي', 'الترتيب',
    'رصيدي', 'بنكي', 'يومية', 'عمل', 'تحويل', 'إيداع', 'سحب', 'معاملاتي',
    'مهامي', 'مهام_استلام', 'نرد', 'عملة', 'حظ', 'تخمين', 'حجر_ورق_مقص', 'حساب',
    'نكتة', 'مدح', 'اختيار', 'ذكاء', 'مسح_ذاكرة', 'حالة_الذكاء', 'إحصائيات',
    'تحذير', 'تحذير_مسح', 'طرد', 'وضع_الهدوء', 'الترحيب', 'معلومات_عضوة', 'رسالة_بدء'
  ];

  for (const name of required) {
    if (!manager.get(name)) throw new Error(`الأمر غير محمّل: ${name}`);
  }

  const commands = manager.list();
  const names = new Map();
  for (const command of commands) {
    const aliases = Array.isArray(command.aliases) ? command.aliases : [];
    for (const rawName of [command.name, ...aliases]) {
      const name = String(rawName).trim().toLowerCase();
      const previous = names.get(name);
      if (previous && previous !== command) throw new Error(`تعارض أمر: ${name}`);
      names.set(name, command);
    }
  }

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hutan-'));
  try {
    const db = new Database(path.join(temp, 'db.json'));
    db.load();
    const a = db.getUser('1');
    const b = db.getUser('2');
    a.name = 'ألف';
    b.name = 'باء';
    a.coins = 1000;
    b.coins = 500;

    const economy = new EconomyService(db, { dailyCooldownMs: 86400000, workCooldownMs: 1800000 });
    if (!economy.transfer(a, b, 150).ok || a.coins !== 850 || b.coins !== 650) throw new Error('فشل اختبار التحويل.');
    if (!economy.deposit(a, 200).ok || a.coins !== 650 || a.bank !== 200) throw new Error('فشل اختبار الإيداع.');
    if (!economy.withdraw(a, 50).ok || a.coins !== 700 || a.bank !== 150) throw new Error('فشل اختبار السحب.');

    const tasks = new TaskService(db);
    a.dailyStats.messages = 20;
    a.dailyStats.commands = 5;
    a.dailyStats.gameWins = 2;
    const claim = tasks.claim(a);
    if (!claim.ok || claim.total <= 0) throw new Error('فشل اختبار المهام.');

    const limiter = new RateLimiter({ commandCooldownMs: 2500, maxCommandsPerMinute: 2, maxMessagesPer10Seconds: 2 });
    if (!limiter.commandAllowed('1').ok || limiter.commandAllowed('1').ok) throw new Error('فشل اختبار cooldown.');

    const replyManager = new ReplyManager(20);
    replyManager.set('m1', { commandName: 'ذكاء', threadID: '123', userID: '1' });
    if (!replyManager.get('m1')) throw new Error('فشل تخزين Reply.');
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (replyManager.get('m1')) throw new Error('فشل انتهاء Reply TTL.');

    const aiConfig = {
      ai: {
        enabled: true,
        url: 'http://127.0.0.1:9/test',
        apiKey: '',
        model: '',
        timeoutMs: 50,
        maxPromptChars: 100
      }
    };
    const ai = new AIService(aiConfig);
    if (!ai.enabled()) throw new Error('فشل تفعيل AI في الاختبار.');
    if (ai.info().queuedThreads !== 0) throw new Error('قائمة AI ليست فارغة قبل الاختبار.');

    const thread = db.getThread({ welcome: true, startupGreetingEnabled: false });
    if (thread.welcome !== true || thread.startupGreetingEnabled !== false) throw new Error('فشل القيم الافتراضية لإعدادات الغروب.');
    thread.welcome = false;
    thread.startupGreetingEnabled = false;
    if (thread.welcome !== false || thread.startupGreetingEnabled !== false) throw new Error('فشل إعدادات الغروب.');

    const groups = fs.readdirSync(path.join(root, 'src', 'commands'));
    for (const group of groups) {
      const full = path.join(root, 'src', 'commands', group);
      if (!fs.statSync(full).isDirectory()) continue;
      if (!fs.readdirSync(full).some((file) => file.endsWith('.js'))) throw new Error(`فئة أوامر فارغة: ${group}`);
    }

    const eventsDir = path.join(root, 'src', 'events');
    if (fs.readdirSync(eventsDir).filter((x) => x.endsWith('.js')).length < 2) throw new Error('دليل الأحداث غير مكتمل.');
    if (fs.statSync(path.join(eventsDir, 'message.js')).size < 500) throw new Error('message.js غير مكتمل.');
    if (fs.statSync(path.join(eventsDir, 'thread.js')).size < 500) throw new Error('thread.js غير مكتمل.');

    db.close();
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }

  console.log(`✓ Smoke test ناجح — ${commands.length} أمرًا و${names.size} اسم/مرادف دون تعارضات.`);
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
