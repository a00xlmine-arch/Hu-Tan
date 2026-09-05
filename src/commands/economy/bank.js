'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'بنكي', aliases: ['البنك'], category: 'economy', description: 'عرض البنك.', async execute(ctx) {
  await ctx.send(box('البنك', [`النقد: ${ctx.user.coins}`, `البنك: ${ctx.user.bank}`, `إيداع: ${ctx.config.bot.prefix}إيداع 100`, `سحب: ${ctx.config.bot.prefix}سحب 100`]));
} };
