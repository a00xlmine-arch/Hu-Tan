'use strict';
module.exports = { name: 'يومية', aliases: ['مكافأة'], category: 'economy', description: 'المكافأة اليومية.', async execute(ctx) {
  const result = ctx.app.economy.daily(ctx.user);
  if (!result.ok) return ctx.send(result.message);
  await ctx.send(`🎁 حصلتِ على ${result.reward} عملة.\nإجمالي ممتلكاتكِ: ${ctx.user.coins + ctx.user.bank}`);
} };
