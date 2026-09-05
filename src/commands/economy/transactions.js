'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'معاملاتي', aliases: ['سجل_المال'], category: 'economy', description: 'آخر الحركات المالية.', async execute(ctx) {
  const list = ctx.db.getTransactions(ctx.userID).slice(0, 8);
  const lines = list.length ? list.map((item) => {
    const sign = item.amount >= 0 ? '+' : '';
    const date = new Date(item.at).toLocaleString('ar-MA', { hour12: false });
    return `${item.type}: ${sign}${item.amount} — ${date}`;
  }) : ['لا توجد معاملات بعد.'];
  await ctx.send(box('المعاملات', lines));
} };
