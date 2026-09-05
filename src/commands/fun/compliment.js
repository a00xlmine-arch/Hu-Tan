'use strict';
const lines = ['أسلوبكِ لطيف اليوم.', 'عندكِ حضور جميل في الغروب.', 'واضح أنكِ تعرفين كيف تجعلين الجو أخف.', 'وجودكِ يعطي للمحادثة حياة.'];
module.exports = { name: 'مدح', aliases: ['مجاملة'], category: 'fun', description: 'مجاملة عشوائية.', async execute(ctx) { await ctx.send(`✨ ${ctx.name}، ${lines[Math.floor(Math.random() * lines.length)]}`); } };
