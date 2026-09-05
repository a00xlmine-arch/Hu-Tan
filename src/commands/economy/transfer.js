'use strict';
module.exports = { name: 'تحويل', aliases: ['اهداء', 'إهداء'], category: 'economy', description: 'تحويل عملات بالرد أو المنشن.', async execute(ctx) {
  const targetID = ctx.targetUserID();
  const amount = Number(ctx.args[0]);
  if (!targetID) return ctx.send('استخدمي .تحويل 100 بالرد على رسالة العضوة أو منشنها.');
  if (targetID === ctx.userID) return ctx.send('لا يمكنكِ تحويل المال إلى نفسكِ.');
  if (!Number.isSafeInteger(amount) || amount <= 0) return ctx.send('اكتبي مبلغًا صحيحًا موجبًا.');
  const target = ctx.db.getUser(targetID);
  const replyName = String(ctx.reply?.senderName || '').trim();
  if (replyName) target.name = replyName;
  const result = ctx.app.economy.transfer(ctx.user, target, amount);
  if (!result.ok) return ctx.send(result.message);
  await ctx.send(`تم تحويل ${amount} عملة إلى ${target.name}.`);
} };
