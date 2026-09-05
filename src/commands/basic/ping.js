'use strict';
const { box, msToText } = require('../../utils/format');
module.exports = {
  name: 'فحص', aliases: ['بنغ'], category: 'basic', description: 'فحص حالة Hu Tan.',
  async execute(ctx) {
    await ctx.send(box('الفحص', [
      'الحالة: تعمل',
      `زمن التشغيل: ${msToText(process.uptime() * 1000)}`,
      `الأوامر: ${ctx.commands.list().length}`,
      `الغروب: ${ctx.threadID === ctx.config.facebook.allowedThreadID ? 'مسموح' : 'غير مسموح'}`
    ]));
  }
};
