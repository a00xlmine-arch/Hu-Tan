'use strict';
module.exports = { name: 'رسالة_بدء', aliases: ['بدء'], category: 'admin', adminOnly: true, description: 'تحديد ما إذا كانت رسالة التشغيل سترسل مرة أخرى.', async execute(ctx) {
  const value = String(ctx.args[0] || '').trim();
  if (!['تشغيل', 'إيقاف', 'إعادة'].includes(value)) return ctx.send('الاستخدام: .رسالة_بدء تشغيل أو .رسالة_بدء إيقاف أو .رسالة_بدء إعادة');
  if (value === 'إعادة') { ctx.db.getThread().startupGreetingSent = false; ctx.db.scheduleSave(); return ctx.send('تمت إعادة ضبط رسالة بدء Hu Tan. ستظهر في التشغيل التالي.'); }
  ctx.config.features.startupGreeting = value === 'تشغيل';
  await ctx.send(`تم ${ctx.config.features.startupGreeting ? 'تفعيل' : 'إيقاف'} رسالة البدء حتى إعادة تشغيل البوت.`);
} };
