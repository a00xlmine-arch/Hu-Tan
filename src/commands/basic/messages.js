'use strict';
const { box } = require('../../utils/format');
module.exports = {
  name: 'رسائلي', aliases: ['عدد_رسائلي', 'نشاطي'], category: 'basic', description: 'عرض نشاطكِ.',
  async execute(ctx) {
    await ctx.send(box('نشاطكِ', [
      `الرسائل: ${ctx.user.messages}`,
      `الأوامر: ${ctx.user.commands}`,
      `رسائل اليوم: ${ctx.user.dailyStats.messages}`,
      `أوامر اليوم: ${ctx.user.dailyStats.commands}`,
      `المستوى: ${ctx.user.level}`,
      `الخبرة: ${ctx.user.xp}`
    ]));
  }
};
