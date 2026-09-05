 'use strict';

module.exports = {
  name: 'رسالة_بدء',
  aliases: ['بدء'],
  category: 'admin',
  adminOnly: true,
  description: 'التحكم في رسالة تعريف Hu Tan عند تشغيلها.',
  async execute(ctx) {
    const value = String(ctx.args[0] || '').trim();
    if (!['تشغيل', 'إيقاف', 'إعادة'].includes(value)) {
      return ctx.send('الاستخدام: .رسالة_بدء تشغيل أو .رسالة_بدء إيقاف أو .رسالة_بدء إعادة');
    }

    const thread = ctx.db.getThread();

    if (value === 'إعادة') {
      thread.startupGreetingSent = false;
      thread.startupGreetingEnabled = true;
      ctx.db.scheduleSave();
      return ctx.send('تمت إعادة ضبط رسالة البدء؛ ستظهر في التشغيل التالي.');
    }

    thread.startupGreetingEnabled = value === 'تشغيل';
    ctx.db.scheduleSave();
    await ctx.send(`تم ${thread.startupGreetingEnabled ? 'تفعيل' : 'إيقاف'} رسالة البدء بشكل دائم.`);
  }
};
