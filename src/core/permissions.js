'use strict';

const cache = new Map();

function invoke(method, context, args = []) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (error, result) => {
      if (settled) return;
      settled = true;
      if (error) reject(error); else resolve(result);
    };
    try {
      const result = method.call(context, ...args, done);
      if (result && typeof result.then === 'function') result.then((value) => done(null, value), done);
      else if (result !== undefined && method.length <= args.length) done(null, result);
    } catch (error) { done(error); }
  });
}

async function getThreadInfo(api, threadID) {
  return invoke(api.getThreadInfo, api, [threadID]);
}

async function isAdmin(api, threadID, userID, ownerID, ttlMs = 30000) {
  const uid = String(userID);
  const tid = String(threadID);
  if (ownerID && String(ownerID) === uid) return true;
  const now = Date.now();
  const cached = cache.get(tid);
  if (cached && cached.expiresAt > now) return cached.adminIDs.includes(uid);
  const info = await getThreadInfo(api, tid);
  const adminIDs = Array.isArray(info?.adminIDs) ? info.adminIDs.map(String) : [];
  cache.set(tid, { expiresAt: now + ttlMs, adminIDs });
  return adminIDs.includes(uid);
}

function invalidate(threadID) { cache.delete(String(threadID)); }

module.exports = { invoke, getThreadInfo, isAdmin, invalidate };
