'use strict';
module.exports = { name: 'تحذير', aliases: ['انذار', 'إنذار'], category: 'admin', adminOnly: true, description: 'إضافة تحذير بالرد أو المنشن.', async execute(ctx) {
  const targetID = ctx.targetUserID(); if (!targetID) return ctx.send('استخدمي .تحذير بالرد على رسالة العضوة أو منشنها.');
  if (targetID === ctx.userID) return ctx.send('لا يمكنكِ تحذير نفسكِ.');
  if (targetID === String(ctx.app.botID || '')) return ctx.send('لا أستطيع تسجيل تحذير على نفسي.');
  const target = ctx.db.getUser(targetID); target.warnings += 1; ctx.db.scheduleSave();
  await ctx.send(`تم تسجيل تحذير على ${target.name}.\nعدد التحذيرات: ${target.warnings}`);
} };
