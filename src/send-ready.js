require('dotenv').config();
const { sendTelegram } = require('./telegram');

(async () => {
  try {
    await sendTelegram('Готов к работе!');

    // Печатаем время по часовому поясу Екатеринбурга (часы:минуты)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Yekaterinburg',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const timeStr = formatter.format(now);
    console.log(`Сообщение отправлено в ${timeStr} (Екатеринбург)`);

    process.exit(0);
  } catch (err) {
    console.error('Error sending Telegram message:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
