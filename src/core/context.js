'use strict';

function pickReply(event) {
  return event.messageReply || event.replyTo || event.reply_to || null;
}

function pickMentions(event) {
  const mentions = event.mentions || {};
  return Object.keys(mentions).map(String);
}

function createContext(app, event, commandName, args) {
  const threadID = String(event.threadID || '');
  const userID = String(event.senderID || event.author || '');
  const user = app.db.getUser(userID);
  const reply = pickReply(event);
  const mentions = pickMentions(event);
  const name = String(event.senderName || user.name || 'عضوة').replace(/\s+/g, ' ').trim() || 'عضوة';
  user.name = name;
  return {
    app,
    api: app.api,
    config: app.config,
    db: app.db,
    event,
    threadID,
    userID,
    user,
    name,
    args,
    commandName,
    text: String(event.body || ''),
    mentions,
    reply,
    commands: app.commandManager,
    send: (message, messageID) => app.send(message, threadID, messageID),
    replyToMessage: (message) => app.send(message, threadID, event.messageID),
    isAdmin: () => app.isAdmin(userID, threadID),
    requireAdmin: async () => app.requireAdmin(userID, threadID),
    targetUserID: () => String(reply?.senderID || mentions[0] || '') || null
  };
}

module.exports = { createContext, pickReply };
