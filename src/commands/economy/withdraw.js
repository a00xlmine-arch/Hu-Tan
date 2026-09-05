'use strict';
module.exports = { name: 'سحب', aliases: [], category: 'economy', description: 'سحب من البنك.', async execute(ctx) {
  const result = ctx.app.economy.withdraw(ctx.user, Number(ctx.args[0]));
  if (!result.ok) return ctx.send(result.message);
  await ctx.send(`تم سحب المبلغ.\nالنقد: ${ctx.user.coins}\nالبنك: ${ctx.user.bank}`);
} };
