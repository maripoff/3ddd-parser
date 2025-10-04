const fetch = require('node-fetch');
require('dotenv').config();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  if (!BOT_TOKEN) {
    console.error('Telegram bot token is not set (TELEGRAM_BOT_TOKEN or TG_BOT_TOKEN). Message not sent.');
    return;
  }
  if (!CHAT_ID) {
    console.error('Telegram chat id is not set (TELEGRAM_CHAT_ID). Message not sent.');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = new URLSearchParams({ chat_id: String(CHAT_ID), text });

  try {
    const res = await fetch(url, { method: 'POST', body });
    const json = await res.json();
    if (!json.ok) {
      console.error('Telegram send failed:', json);
    } else {
      console.info('Telegram message sent');
    }
    return json;
  } catch (err) {
    console.error('Telegram send error:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { sendTelegram };
