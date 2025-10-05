// @ts-check
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_DATA_PATH = path.join('data', 'jobs.json');

const parseIntEnv = (name, fallback) => {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

module.exports = {
  USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  DATA_PATH: process.env.DATA_PATH || DEFAULT_DATA_PATH,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  RETENTION_DAYS: parseIntEnv('RETENTION_DAYS', 30),
  TIMEOUT_MS: parseIntEnv('TIMEOUT_MS', 10000),
  HISTORY_SIZE: parseIntEnv('HISTORY_SIZE', 1000),
};
