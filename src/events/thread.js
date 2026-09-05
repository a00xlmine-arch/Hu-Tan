'use strict';

const { box, cleanName } = require('../utils/format');

function extractParticipants(event) {
  const data = event.logMessageData || {};
  const raw = Array.isArray(data.addedParticipants) ? data.addedParticipants : [];
  return raw.map((item) => ({
    id: String(item.userFbId || item.id || ''),
    name: cleanName(item.fullName || item.name, 'عضوة')
  })).filter((item) => item.id);
}

module.exports = async function threadEvent(app, event, dispatcher) {
  if (event.type !== 'event') return false;
  const type = String(event.logMessageType || event.subtype || event.eventType || '');
  if (!['log:subscribe', 'participantAdded'].includes(type)) return false;
  if (!app.config.features.welcome) return true;
  const participants = extractParticipants(event);
  const botID = app.botID;
  const human = participants.filter((person) => !botID || person.id !== String(botID));
  if (!human.length) return true;
  for (const person of human) {
    const user = app.db.getUser(person.id);
    user.name = person.name;
    app.db.scheduleSave();
  }
  const names = human.map((person) => person.name).join('، ');
  await dispatcher.safeSend(box('أهلًا بكِ', [
    `${names}، نورتِ الغروب.`,
    'أنا Hu Tan، سعيدة بانضمامكِ معنا.',
    `اكتبي ${app.config.bot.prefix}القائمة لرؤية الأوامر.`,
    'المطور: Rin Il'
  ]), event.threadID);
  return true;
};
