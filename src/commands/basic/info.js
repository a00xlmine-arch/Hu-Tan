'use strict';
const { box } = require('../../utils/format');
module.exports = {
  name: 'معلومات', aliases: ['حول', 'اصدار', 'إصدار'], category: 'basic', description: 'معلومات Hu Tan.',
  async execute(ctx) {
    await ctx.send(box('Hu Tan', [
      'النوع: بوت Messenger عربي',
      `الإصدار: ${ctx.config.bot.version}`,
      'المطور: Rin Il',
      'البادئة: .',
      'النمط: Modular + غروب واحد',
      'الهوية: مؤنثة عند الحديث عن نفسها',
      `الأوامر: ${ctx.commands.list().length}`,
      'البيانات: محلية داخل الجهاز.'
    ]));
  }
};
