'use strict';
const jokes = [
  'مرة مبرمجة قالت للكود: اشتقت لك. قال لها: عندي خطأ في المشاعر.',
  'لماذا الكمبيوتر هادئ؟ لأنه أغلق كل النوافذ.',
  'قالت له: لماذا تتأخر؟ قال: كنت أعمل في الخلفية.'
];
module.exports = { name: 'نكتة', aliases: ['نكت'], category: 'fun', description: 'نكتة قصيرة.', async execute(ctx) { await ctx.send(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`); } };
