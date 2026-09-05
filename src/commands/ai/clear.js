'use strict';
module.exports = { name: 'مسح_ذاكرة', aliases: ['نسيان'], category: 'ai', description: 'مسح ذاكرة AI الحالية.', async execute(ctx) { ctx.app.ai.clear(ctx.threadID); await ctx.send('تم مسح ذاكرة محادثة Hu Tan الحالية.'); } };
