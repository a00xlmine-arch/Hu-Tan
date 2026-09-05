'use strict';
module.exports = {
  name: 'مسح_بياناتي', aliases: ['احذف_بياناتي'], category: 'basic', description: 'حذف بيانات حسابكِ المحلية.',
  async execute(ctx) {
    const name = ctx.user.name;
    ctx.db.resetUser(ctx.userID, name);
    ctx.db.scheduleSave();
    await ctx.send('تم حذف بياناتكِ المحلية وإعادة حسابكِ إلى البداية.');
  }
};
