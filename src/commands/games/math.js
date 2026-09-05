'use strict';
module.exports = { name: 'حساب', aliases: ['رياضيات'], category: 'games', description: 'سؤال حساب سريع.', async execute(ctx) {
  const a = Math.floor(Math.random() * 20) + 1; const b = Math.floor(Math.random() * 20) + 1; const op = Math.random() < 0.5 ? '+' : '-'; const answer = op === '+' ? a + b : a - b;
  ctx.app.mathGames = ctx.app.mathGames || new Map();
  ctx.app.mathGames.set(ctx.userID, { answer, expiresAt: Date.now() + 30000 });
  await ctx.send(`🧠 ما نتيجة: ${a} ${op} ${b} ؟\nأجيبي برقم واحد خلال 30 ثانية.`);
} };
