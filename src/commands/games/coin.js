'use strict';
module.exports = { name: 'عملة', aliases: ['وجه_كتابة'], category: 'games', description: 'قلب عملة.', async execute(ctx) {
  await ctx.send(`🪙 النتيجة: ${Math.random() < 0.5 ? 'وجه' : 'كتابة'}.`);
} };
