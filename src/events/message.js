'use strict';

module.exports = async function messageEvent(app, event, dispatcher) {
  if (event.type !== 'message') return false;
  if (!event.senderID) return true;
  if (app.config.features.antiSpam !== false && !app.limiter.messageAllowed(event.senderID)) return true;

  const user = app.db.getUser(event.senderID);
  const oldLevel = user.level;
  app.db.touchUser(user, event.senderName);
  app.db.getThread().totalMessages += 1;
  const levelUp = app.config.features.rank !== false ? app.db.addXP(user, 3) : false;
  app.db.scheduleSave();

  if (levelUp && user.level > oldLevel) {
    await dispatcher.safeSend(`╭─〔 مستوى جديد 〕\n│ ${user.name} ارتفع مستواكِ إلى ${user.level}.\n│ استمري، تقدمكِ جميل.\n╰──────────────`, event.threadID);
  }

  const math = app.mathGames.get(String(event.senderID));
  const body = String(event.body || '').trim();
  if (math && math.expiresAt > Date.now() && /^-?\d+$/.test(body)) {
    app.mathGames.delete(String(event.senderID));
    if (Number(body) === math.answer) {
      user.coins += 50;
      user.gameWins += 1;
      app.db.touchGameWin(user);
      app.db.addTransaction(user.id, 'لعبة', 50, '', 'فوز الحساب السريع');
      app.db.scheduleSave();
      await dispatcher.safeSend('🧠 صحيح! +50 عملة. أسرعتِ في الحل.', event.threadID);
    } else {
      user.gameLosses += 1;
      app.db.scheduleSave();
      await dispatcher.safeSend(`ليست الإجابة الصحيحة. الإجابة هي ${math.answer}.`, event.threadID);
    }
    return true;
  }
  if (math && math.expiresAt <= Date.now()) app.mathGames.delete(String(event.senderID));

  const reply = event.messageReply || event.replyTo || event.reply_to;
  if (reply?.messageID) {
    const entry = app.replyManager.get(reply.messageID);
    if (entry && String(entry.threadID) === String(event.threadID)) {
      if (entry.userID && String(entry.userID) !== String(event.senderID) && !entry.allowEveryone) return true;
      if (entry.commandName === 'ذكاء') {
        await dispatcher.runCommand(event, { name: 'ذكاء', args: [], raw: body }, { fromReply: true, replyMode: true, parent: entry });
        return true;
      }
    }
  }

  const parsed = dispatcher.parseCommand(body);
  if (!parsed) return true;
  await dispatcher.runCommand(event, parsed);
  return true;
};
