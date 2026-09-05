'use strict';
module.exports = { name: 'إيداع', aliases: [], category: 'economy', description: 'إيداع في البنك.', async execute(ctx) {
  const result = ctx.app.economy.deposit(ctx.user, Number(ctx.args[0]));
  if (!result.ok) return ctx.send(result.message);
  await ctx.send(`تم إيداع المبلغ.\nالنقد: ${ctx.user.coins}\nالبنك: ${ctx.user.bank}`);
} };
