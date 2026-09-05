'use strict';
module.exports = { name: 'نرد', aliases: ['زهر'], category: 'games', description: 'رمي نرد.', async execute(ctx) {
  const value = Math.floor(Math.random() * 6) + 1;
  await ctx.send(`🎲 رميتِ النرد وظهرت النتيجة: ${value}`);
} };
