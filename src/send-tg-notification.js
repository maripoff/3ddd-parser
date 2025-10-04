// @ts-check
const { TELEGRAM_CHAT_ID, TELEGRAM_BOT_TOKEN } = require('./config')

module.exports.sendTgNotification = async function sendTgNotification(content) {
  const botToken = TELEGRAM_BOT_TOKEN;
  const chatId = TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('Telegram credentials not found in environment variables');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Telegram notification:', errorText);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error.message);
  }
}