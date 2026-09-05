'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'مهامي', aliases: ['المهام'], category: 'tasks', description: 'مهام اليوم.', async execute(ctx) {
  if (ctx.config.features.tasks === false) return ctx.send('نظام المهام متوقف حاليًا.');
  await ctx.send(box('مهام اليوم', [ctx.app.tasks.render(ctx.user), '', `استخدمي ${ctx.config.bot.prefix}مهام_استلام عند الإكمال.`]));
} };
