'use strict';
module.exports = { name: 'حظ', aliases: ['حظي'], category: 'games', description: 'نسبة حظ للترفيه.', async execute(ctx) {
  const value = Math.floor(Math.random() * 101);
  const text = value >= 85 ? 'الحظ يبتسم لكِ اليوم.' : value <= 20 ? 'الحظ هادئ اليوم.' : 'يبدو يومًا متوازنًا.';
  await ctx.send(`🍀 نسبة حظكِ: ${value}%\n${text}`);
} };
