'use strict';
module.exports = { name: 'تخمين', aliases: ['خمن', 'تخمين_رقم'], category: 'games', description: 'تخمين رقم من 1 إلى 5.', async execute(ctx) {
  const choice = Number(ctx.args[0]);
  if (!Number.isInteger(choice) || choice < 1 || choice > 5) return ctx.send('اكتبي رقمًا من 1 إلى 5، مثل: .تخمين 3');
  const answer = Math.floor(Math.random() * 5) + 1;
  if (choice === answer) {
    ctx.user.coins += 80; ctx.user.gameWins += 1; ctx.db.touchGameWin(ctx.user); ctx.db.addTransaction(ctx.userID, 'لعبة', 80, '', 'فوز التخمين'); ctx.db.scheduleSave();
    return ctx.send(`🎯 أصبتِ! الرقم كان ${answer}.\n+80 عملة.`);
  }
  ctx.user.gameLosses += 1; ctx.db.scheduleSave();
  await ctx.send(`لم تصيبي هذه المرة. الرقم كان ${answer}.`);
} };
