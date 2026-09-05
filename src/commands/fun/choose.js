'use strict';
module.exports = { name: 'اختيار', aliases: ['اختر'], category: 'fun', description: 'اختيار عشوائي من قائمة.', async execute(ctx) {
  const items = ctx.args.join(' ').split(/\s*[،,|/]\s*/).map((x) => x.trim()).filter(Boolean);
  if (items.length < 2) return ctx.send('اكتبي خيارين على الأقل، مثل: .اختيار شاي، قهوة، عصير');
  await ctx.send(`🎯 اختياري لكِ: ${items[Math.floor(Math.random() * items.length)]}`);
} };
