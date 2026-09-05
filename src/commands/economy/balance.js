'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'رصيدي', aliases: ['محفظتي', 'فلوسي'], category: 'economy', description: 'عرض المال.', async execute(ctx) {
  await ctx.send(box('المحفظة', [`النقد: ${ctx.user.coins}`, `البنك: ${ctx.user.bank}`, `المجموع: ${ctx.user.coins + ctx.user.bank}`]));
} };
