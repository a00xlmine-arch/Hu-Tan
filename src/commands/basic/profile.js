'use strict';
const { box, progress } = require('../../utils/format');
module.exports = {
  name: 'ملفي', aliases: ['حسابي_الشخصي', 'بروفايلي'], category: 'basic', description: 'عرض ملفكِ الكامل.',
  async execute(ctx) {
    const previous = 50 * Math.pow(Math.max(0, ctx.user.level - 1), 2);
    const next = 50 * Math.pow(ctx.user.level, 2);
    await ctx.send(box('ملفي', [
      `الاسم: ${ctx.user.name}`,
      `المستوى: ${ctx.user.level}`,
      `الخبرة: ${ctx.user.xp}`,
      `التقدم: ${progress(Math.max(0, ctx.user.xp - previous), Math.max(1, next - previous))}`,
      `العملات: ${ctx.user.coins}`,
      `البنك: ${ctx.user.bank}`,
      `التحذيرات: ${ctx.user.warnings}`,
      `فوز الألعاب: ${ctx.user.gameWins}`
    ]));
  }
};
