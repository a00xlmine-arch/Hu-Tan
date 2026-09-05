'use strict';

function invoke(method, context, args = []) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (error, result) => {
      if (settled) return;
      settled = true;
      error ? reject(error) : resolve(result);
    };
    try {
      const result = method.call(context, ...args, done);
      if (result && typeof result.then === 'function') result.then((value) => done(null, value), done);
      else if (result !== undefined && method.length <= args.length) done(null, result);
    } catch (error) {
      done(error);
    }
  });
}

function send(api, message, threadID, messageID) {
  if (typeof api?.sendMessage !== 'function') return Promise.reject(new Error('واجهة إرسال الرسائل غير متاحة.'));
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (error, result) => {
      if (settled) return;
      settled = true;
      error ? reject(error) : resolve(result);
    };
    try {
      const result = messageID
        ? api.sendMessage(message, threadID, done, messageID)
        : api.sendMessage(message, threadID, done);
      if (result && typeof result.then === 'function') result.then((value) => done(null, value), done);
      else if (result !== undefined && api.sendMessage.length <= (messageID ? 3 : 2)) done(null, result);
    } catch (error) {
      done(error);
    }
  });
}

function getThreadInfo(api, threadID) {
  if (typeof api?.getThreadInfo !== 'function') return Promise.reject(new Error('واجهة معلومات الغروب غير متاحة.'));
  return invoke(api.getThreadInfo, api, [String(threadID)]);
}

function getUserInfo(api, userID) {
  if (typeof api?.getUserInfo !== 'function') return Promise.reject(new Error('واجهة معلومات العضوة غير متاحة.'));
  return invoke(api.getUserInfo, api, [String(userID)]);
}

function removeUser(api, userID, threadID) {
  if (typeof api?.removeUserFromGroup !== 'function') return Promise.reject(new Error('واجهة إزالة العضوة غير متاحة.'));
  return invoke(api.removeUserFromGroup, api, [String(userID), String(threadID)]);
}

function setReaction(api, reaction, messageID) {
  if (typeof api?.setMessageReaction !== 'function') return Promise.reject(new Error('واجهة التفاعل غير متاحة.'));
  return invoke(api.setMessageReaction, api, [reaction, String(messageID)]);
}

function getCurrentUserID(api) {
  return typeof api?.getCurrentUserID === 'function' ? String(api.getCurrentUserID() || '') : '';
}

module.exports = { invoke, send, getThreadInfo, getUserInfo, removeUser, setReaction, getCurrentUserID };
