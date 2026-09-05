'use strict';
const { box } = require('../../utils/format');
module.exports = {
  name: 'الترتيب', aliases: ['المتصدرون', 'ليدر'], category: 'level', description: 'أفضل العضوات في XP.',
  async execute(ctx) {
    const list = Object.values(ctx.db.data.users).sort((a, b) => (b.xp - a.xp) || (b.messages - a.messages)).slice(0, 10);
    await ctx.send(box('المتصدرون', list.length ? list.map((u, i) => `${i + 1}. ${u.name || 'عضوة'} — مستوى ${u.level} — ${u.xp} XP`) : ['لا توجد بيانات بعد.']));
  }
};
