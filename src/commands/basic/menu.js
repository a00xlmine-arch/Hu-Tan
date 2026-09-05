'use strict';
const { box } = require('../../utils/format');
const titles = { basic: 'الأساسية', level: 'الرتب', economy: 'الاقتصاد', tasks: 'المهام', games: 'الألعاب', fun: 'الترفيه', ai: 'الذكاء', admin: 'الإدارة' };
module.exports = {
  name: 'القائمة', aliases: ['مساعدة', 'اوامر', 'أوامر'], category: 'basic', description: 'عرض أوامر Hu Tan.',
  async execute(ctx) {
    const sections = [];
    for (const [category, commands] of ctx.commands.categories()) {
      if (category === 'basic' || titles[category]) {
        sections.push(`├─〔 ${titles[category] || category} 〕`);
        for (const command of commands) sections.push(`│ ${ctx.config.bot.prefix}${command.name}${command.usage ? ` — ${command.usage}` : ` — ${command.description}`}`);
      }
    }
    await ctx.send(box('Hu Tan', [
      'بوت عربي منظم للمجموعة.',
      'المطور: Rin Il',
      `الإصدار: ${ctx.config.bot.version}`,
      '',
      ...sections,
      '',
      `اكتبي ${ctx.config.bot.prefix}معلومات للتفاصيل.`
    ]));
  }
};
