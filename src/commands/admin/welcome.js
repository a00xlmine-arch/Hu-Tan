 'use strict';

module.exports = {
  name: 'الترحيب',
  aliases: ['ترحيب'],
  category: 'admin',
  adminOnly: true,
  description: 'تشغيل أو إيقاف ترحيب العضوات.',
  async execute(ctx) {
    const value = String(ctx.args[0] || '').trim();
    if (!['تشغيل', 'إيقاف'].includes(value)) {
      return ctx.send('الاستخدام: .الترحيب تشغيل أو .الترحيب إيقاف');
    }

    const thread = ctx.db.getThread();
    thread.welcome = value === 'تشغيل';
    ctx.db.scheduleSave();
    await ctx.send(`تم ${thread.welcome ? 'تفعيل' : 'إيقاف'} ترحيب العضوات.`);
  }
};
