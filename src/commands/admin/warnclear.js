'use strict';
module.exports = { name: 'تحذير_مسح', aliases: ['مسح_تحذير'], category: 'admin', adminOnly: true, description: 'تصفير تحذيرات عضوة.', async execute(ctx) {
  const targetID = ctx.targetUserID(); if (!targetID) return ctx.send('استخدمي .تحذير_مسح بالرد على رسالة العضوة.');
  const target = ctx.db.getUser(targetID); target.warnings = 0; ctx.db.scheduleSave();
  await ctx.send(`تم تصفير تحذيرات ${target.name}.`);
} };
