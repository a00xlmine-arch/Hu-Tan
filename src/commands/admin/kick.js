'use strict';
module.exports = { name: 'طرد', aliases: ['اخراج', 'إخراج'], category: 'admin', adminOnly: true, description: 'إخراج عضوة بالرد أو المنشن.', async execute(ctx) {
  const targetID = ctx.targetUserID(); if (!targetID) return ctx.send('استخدمي .طرد بالرد على رسالة العضوة أو منشنها.');
  if (targetID === ctx.userID) return ctx.send('لا يمكنكِ إخراج نفسكِ.');
  if (targetID === String(ctx.app.botID || '')) return ctx.send('لا أستطيع إخراج نفسي.');
  if (await ctx.app.isAdmin(targetID, ctx.threadID)) return ctx.send('لا أستطيع إخراج مشرفة من الغروب.');
  await ctx.app.services.removeUser(ctx.api, targetID, ctx.threadID);
  await ctx.send('تم إخراج العضوة من الغروب.');
} };
