'use strict';

function cleanName(name, fallback = 'عضوة') {
  const value = String(name || '').replace(/\s+/g, ' ').trim();
  return value || fallback;
}

function box(title, lines = []) {
  const body = Array.isArray(lines) ? lines : [String(lines)];
  return [`╭─〔 ${title} 〕`, ...body.map((line) => `│ ${line}`), '╰──────────────'].join('\n');
}

function progress(current, required, size = 10) {
  const ratio = required <= 0 ? 1 : Math.max(0, Math.min(1, current / required));
  const filled = Math.round(ratio * size);
  return `${'█'.repeat(filled)}${'░'.repeat(size - filled)} ${Math.floor(ratio * 100)}%`;
}

function msToText(ms) {
  if (ms <= 0) return 'الآن';
  let seconds = Math.ceil(ms / 1000);
  const days = Math.floor(seconds / 86400); seconds %= 86400;
  const hours = Math.floor(seconds / 3600); seconds %= 3600;
  const minutes = Math.floor(seconds / 60); seconds %= 60;
  const parts = [];
  if (days) parts.push(`${days}ي`);
  if (hours) parts.push(`${hours}س`);
  if (minutes) parts.push(`${minutes}د`);
  if (seconds && !days && !hours) parts.push(`${seconds}ث`);
  return parts.join(' ') || 'ثانية';
}

function dateKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

module.exports = { cleanName, box, progress, msToText, dateKey };
