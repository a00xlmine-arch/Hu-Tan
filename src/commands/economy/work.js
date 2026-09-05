'use strict';
const { box } = require('../../utils/format');
const jobs = ['مترجمة', 'مصممة', 'كاتبة', 'مبرمجة', 'محررة', 'مديرة مشروع', 'فنانة', 'مذيعة'];
module.exports = { name: 'عمل', aliases: ['وظيفة', 'وظائف'], category: 'economy', description: 'العمل للحصول على عملات.', async execute(ctx) {
  const result = ctx.app.economy.work(ctx.user);
  if (!result.ok) return ctx.send(result.message);
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  await ctx.send(box('العمل', [`عملتِ اليوم كـ ${job}.`, `المكافأة: ${result.reward} عملة.`, `الرصيد النقدي: ${ctx.user.coins}`]));
} };
