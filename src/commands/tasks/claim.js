'use strict';
module.exports = { name: 'مهام_استلام', aliases: ['استلام_المهام'], category: 'tasks', description: 'استلام مكافآت المهام.', async execute(ctx) {
  const result = ctx.app.tasks.claim(ctx.user);
  if (!result.ok) return ctx.send(result.message);
  await ctx.send(`تم استلام ${result.total} عملة عن ${result.claimed.length} مهمة.`);
} };
