'use strict';
const { box, progress } = require('../../utils/format');
module.exports = {
  name: 'رتبتي', aliases: ['رتبة', 'مستواي'], category: 'level', description: 'عرض مستواكِ.',
  async execute(ctx) {
    const previous = 50 * Math.pow(Math.max(0, ctx.user.level - 1), 2);
    const next = 50 * Math.pow(ctx.user.level, 2);
    await ctx.send(box('رتبتي', [
      `المستوى: ${ctx.user.level}`,
      `الخبرة: ${ctx.user.xp} XP`,
      `التقدم: ${progress(Math.max(0, ctx.user.xp - previous), Math.max(1, next - previous))}`,
      `الرسائل: ${ctx.user.messages}`
    ]));
  }
};
