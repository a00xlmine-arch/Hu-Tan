'use strict';
module.exports = { name: 'ذكاء', aliases: ['سؤال'], category: 'ai', description: 'محادثة Hu Tan مع خدمة AI.', async execute(ctx, options = {}) {
  if (!ctx.app.ai.enabled()) return ctx.send('الذكاء الاصطناعي غير مفعّل حاليًا في إعدادات Hu Tan.');
  const prompt = String(options.replyMode ? ctx.text : ctx.args.join(' ')).trim();
  if (!prompt) return ctx.send(`اكتبي سؤالكِ، مثل: ${ctx.config.bot.prefix}ذكاء كيف حالكِ؟`);
  try {
    const answer = await ctx.app.ai.ask({ threadID: ctx.threadID, userName: ctx.name, text: prompt });
    const result = await ctx.send(answer);
    const messageID = result?.messageID || result;
    if (messageID) ctx.app.replyManager.set(messageID, { commandName: 'ذكاء', threadID: ctx.threadID, userID: ctx.userID, allowEveryone: Boolean(ctx.config.ai.allowEveryoneReply) });
  } catch (error) {
    await ctx.send(`تعذر الوصول إلى خدمة الذكاء الاصطناعي.\n${error.message}`);
  }
} };
