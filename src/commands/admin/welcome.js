'use strict';
module.exports = { name: 'الترحيب', aliases: ['ترحيب'], category: 'admin', adminOnly: true, description: 'تشغيل أو إيقاف الترحيب.', async execute(ctx) {
  const value = String(ctx.args[0] || '').trim(); if (!['تشغيل', 'إيقاف'].includes(value)) return ctx.send('الاستخدام: .الترحيب تشغيل أو .الترحيب إيقاف');
  ctx.db.getThread().welcome = value === 'تشغيل'; ctx.db.scheduleSave(); await ctx.send(`تم ${ctx.db.getThread().welcome ? 'تفعيل' : 'إيقاف'} الترحيب.`);
} };
