'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const CommandManager = require('../src/core/command-manager'); const Database = require('../src/core/database'); const EconomyService = require('../src/services/economy'); const TaskService = require('../src/services/tasks'); const RateLimiter = require('../src/core/ratelimit');
const root = path.join(__dirname, '..');
const manager = new CommandManager(path.join(root, 'src', 'commands')); manager.load();
const required = ['القائمة','معلومات','فحص','رسائلي','ملفي','رتبتي','الترتيب','رصيدي','بنكي','يومية','عمل','تحويل','إيداع','سحب','معاملاتي','مهامي','مهام_استلام','نرد','عملة','حظ','تخمين','حجر_ورق_مقص','حساب','نكتة','مدح','اختيار','ذكاء','مسح_ذاكرة','حالة_الذكاء','إحصائيات','تحذير','تحذير_مسح','طرد','وضع_الهدوء','الترحيب','معلومات_عضوة','رسالة_بدء'];
for (const name of required) if (!manager.get(name)) throw new Error(`الأمر غير محمّل: ${name}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hutan-')); const db = new Database(path.join(temp, 'db.json')); db.load();
const a = db.getUser('1'); const b = db.getUser('2'); a.name = 'ألف'; b.name = 'باء'; a.coins = 1000; b.coins = 500;
const economy = new EconomyService(db, { dailyCooldownMs: 86400000, workCooldownMs: 1800000 });
if (!economy.transfer(a, b, 150).ok || a.coins !== 850 || b.coins !== 650) throw new Error('فشل اختبار التحويل.');
if (!economy.deposit(a, 200).ok || a.coins !== 650 || a.bank !== 200) throw new Error('فشل اختبار الإيداع.');
if (!economy.withdraw(a, 50).ok || a.coins !== 700 || a.bank !== 150) throw new Error('فشل اختبار السحب.');
const tasks = new TaskService(db); a.dailyStats.messages = 20; a.dailyStats.commands = 5; a.dailyStats.gameWins = 2; const claim = tasks.claim(a); if (!claim.ok || claim.total <= 0) throw new Error('فشل اختبار المهام.');
const limiter = new RateLimiter({ commandCooldownMs: 2500, maxCommandsPerMinute: 2, maxMessagesPer10Seconds: 2 }); if (!limiter.commandAllowed('1').ok || limiter.commandAllowed('1').ok) throw new Error('فشل اختبار cooldown.');
for (const group of fs.readdirSync(path.join(root, 'src', 'commands'))) if (fs.statSync(path.join(root, 'src', 'commands', group)).isDirectory()) { if (!fs.readdirSync(path.join(root, 'src', 'commands', group)).some((x) => x.endsWith('.js'))) throw new Error(`فئة أوامر فارغة: ${group}`); }
const eventsDir = path.join(root, 'src', 'events'); if (fs.readdirSync(eventsDir).filter((x) => x.endsWith('.js')).length < 2) throw new Error('دليل الأحداث غير مكتمل.');
fs.rmSync(temp, { recursive: true, force: true });
console.log(`✓ Smoke test ناجح — ${manager.list().length} أمرًا دون تعارضات.`);
