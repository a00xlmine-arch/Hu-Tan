'use strict';

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = __dirname;
const CONFIG_PATH = path.join(ROOT, 'config', 'config.json');
const APPSTATE_PATH = path.join(ROOT, 'data', 'appstate.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ready() {
  if (!fs.existsSync(CONFIG_PATH) || !fs.existsSync(APPSTATE_PATH)) return false;
  try {
    const config = readJSON(CONFIG_PATH);
    const appState = readJSON(APPSTATE_PATH);
    return Array.isArray(appState)
      && appState.length > 0
      && /^\d+$/.test(String(config?.facebook?.allowedThreadID || ''));
  } catch (_) {
    return false;
  }
}

function runSetup() {
  console.log('\nلم يكتمل إعداد Hu Tan. سيتم فتح معالج الإعداد.\n');
  const child = spawn(process.execPath, [path.join(ROOT, 'setup.js')], { stdio: 'inherit' });
  child.once('exit', (code) => {
    if (code === 0) require(path.join(ROOT, 'src', 'bot.js'));
    else process.exit(code ?? 1);
  });
  child.once('error', (error) => {
    console.error(`فشل تشغيل معالج الإعداد: ${error.message}`);
    process.exit(1);
  });
}

if (ready()) require(path.join(ROOT, 'src', 'bot.js'));
else runSetup();
