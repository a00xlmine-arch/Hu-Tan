'use strict';
const { box } = require('../../utils/format');
module.exports = { name: 'حالة_الذكاء', aliases: ['ذكاء_حالة'], category: 'ai', description: 'حالة خدمة AI.', async execute(ctx) { const info = ctx.app.ai.info(); await ctx.send(box('الذكاء الاصطناعي', [`الحالة: ${info.enabled ? 'مفعّل' : 'متوقف'}`, `النموذج: ${info.model}`])); } };
