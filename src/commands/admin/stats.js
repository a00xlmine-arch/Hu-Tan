'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'إحصائيات', aliases: ['احصائيات'], category: 'admin', adminOnly: true, description: 'إحصائيات الغروب.', async execute(ctx) {
  const users = Object.values(ctx.db.data.users); const totalCoins = users.reduce((sum, u) => sum + u.coins + u.bank, 0); const top = users.sort((a, b) => b.xp - a.xp)[0];
  await ctx.send(box('إحصائيات الغروب', [`الأعضاء المسجلون: ${users.length}`, `الرسائل: ${ctx.db.getThread().totalMessages}`, `الأوامر: ${ctx.db.getThread().totalCommands}`, `إجمالي العملات: ${totalCoins}`, `المتصدرة: ${top?.name || 'لا توجد'}`, `الوضع: ${ctx.db.getThread().quiet ? 'هادئ' : 'عادي'}`]));
} };
