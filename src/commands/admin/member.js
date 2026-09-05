'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'معلومات_عضوة', aliases: ['بيانات_عضوة'], category: 'admin', adminOnly: true, description: 'عرض بيانات عضوة.', async execute(ctx) {
  const targetID = ctx.targetUserID() || ctx.userID; const target = ctx.db.getUser(targetID);
  await ctx.send(box('بيانات العضوة', [`الاسم: ${target.name}`, `الرسائل: ${target.messages}`, `الأوامر: ${target.commands}`, `المستوى: ${target.level}`, `XP: ${target.xp}`, `العملات: ${target.coins}`, `البنك: ${target.bank}`, `التحذيرات: ${target.warnings}`]));
} };
