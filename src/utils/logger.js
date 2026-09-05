'use strict';

function stamp() { return new Date().toLocaleString('ar-MA', { hour12: false }); }
function write(level, message) { console.log(`[${stamp()}] [${level}] ${message}`); }
module.exports = {
  info: (m) => write('معلومة', m),
  warn: (m) => write('تحذير', m),
  error: (m) => write('خطأ', m),
  debug: (m) => { if (process.env.HUTAN_DEBUG === '1') write('تصحيح', m); }
};
