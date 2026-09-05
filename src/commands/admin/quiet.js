'use strict';
module.exports = { name: 'وضع_الهدوء', aliases: ['الهدوء'], category: 'admin', adminOnly: true, description: 'إيقاف الأوامر غير الإدارية.', async execute(ctx) {
  const value = String(ctx.args[0] || '').trim(); if (!['تشغيل', 'إيقاف'].includes(value)) return ctx.send('الاستخدام: .وضع_الهدوء تشغيل أو .وضع_الهدوء إيقاف');
  ctx.db.getThread().quiet = value === 'تشغيل'; ctx.db.scheduleSave(); await ctx.send(`تم ${ctx.db.getThread().quiet ? 'تفعيل' : 'إيقاف'} وضع الهدوء.`);
} };
