const { fetchHtml } = require('./fetch-html');
const cheerio = require('cheerio');

const TARGET = 'https://3ddd.ru/work/tasks';

async function run() {
  try {
    console.info(`Fetching: ${TARGET}`);
    const html = await fetchHtml(TARGET);
    const $ = cheerio.load(html);
    const dates = [];

    $('table.result').each((i, table) => {
      const t = $(table);
      const dateEl = t.find('thead tr th div .date').first();
      const dateText = dateEl.text().trim() || null;
      dates.push(dateText);
    });

    console.log('Last task dates (up to first 10):');
    dates.slice(0, 10).forEach((d, i) => {
      console.log(`${i + 1}: ${d || '(no date found)'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error fetching/parsing task dates:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

run();
