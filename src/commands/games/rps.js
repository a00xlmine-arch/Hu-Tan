'use strict';
const choices = ['حجر', 'ورق', 'مقص'];
function result(a, b) { if (a === b) return 0; return ((a === 'حجر' && b === 'مقص') || (a === 'ورق' && b === 'حجر') || (a === 'مقص' && b === 'ورق')) ? 1 : -1; }
module.exports = { name: 'حجر_ورق_مقص', aliases: [], category: 'games', description: 'حجر ورق مقص.', async execute(ctx) {
  const user = String(ctx.args[0] || '').trim();
  if (!choices.includes(user)) return ctx.send('اكتبي: حجر، ورق، أو مقص.');
  const bot = choices[Math.floor(Math.random() * choices.length)];
  const outcome = result(user, bot);
  if (outcome > 0) { ctx.user.coins += 60; ctx.user.gameWins += 1; ctx.db.touchGameWin(ctx.user); ctx.db.addTransaction(ctx.userID, 'لعبة', 60, '', 'فوز حجر ورق مقص'); }
  else if (outcome < 0) ctx.user.gameLosses += 1; else ctx.user.gameDraws += 1;
  ctx.db.scheduleSave();
  const text = outcome > 0 ? 'فزتِ! +60 عملة.' : outcome < 0 ? 'فزتُ هذه المرة.' : 'تعادل.';
  await ctx.send(`🎮 أنتِ: ${user}\nHu Tan: ${bot}\n\n${text}`);
} };
