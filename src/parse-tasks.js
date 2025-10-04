const cheerio = require('cheerio');
const { URL } = require('url');
const { parseDateTextToObj } = require('./parse-date');

/**
 * Parse the /work/tasks page HTML and return an array
 * of normalized task objects.
 *
 * Each item will include:
 *  - path: absolute or relative URL (as string)
 *  - title: string
 *  - salary: string|null
 *  - dateText: raw date text from the list (e.g. "3 сен." or "Москва, 3 сен.")
 *  - date: normalized "DD.MM.YYYY" string or null
 *  - dateTs: numeric timestamp (ms) or null
 */
function parseTasks(html) {
  const $ = cheerio.load(html);
  const items = [];

  // Each task is rendered as <table class="result"> ... </table>
  $('table.result').each((i, table) => {
    const t = $(table);

    // Main row is tbody > tr
    const row = t.find('tbody tr').first();
    const descTd = row.find('td.desc').first();
    const priceTd = row.find('td.price').first();

    const titleEl = descTd.find('p a').first();
    const title = titleEl.text().trim() || null;
    const href = titleEl.attr('href') || null;

    // date on list (may be like "3 сен." or "Москва, 3 сен.")
    const dateEl = t.find('thead tr th div .date').first();
    const dateText = dateEl.text().trim() || null;
    const dateObj = parseDateTextToObj(dateText);

    // payment / price cell
    const salaryRaw = priceTd.text().trim() || null;
    const salary = salaryRaw ? salaryRaw.replace(/\s+/g, ' ').trim() : null;

    // Build minimal item with fields requested: relative path, title, salary, date
    const fullPath = href
      ? (href.startsWith('http://') || href.startsWith('https://') ? href : new URL(href, 'https://3ddd.ru').toString())
      : null;

    const item = {
      path: fullPath,
      title: title || null,
      salary: salary || null,
      dateText: dateText || null,
      date: dateObj ? dateObj.date : null,
      dateTs: dateObj ? dateObj.dateTs : null
    };

    // Only include real task rows (title + href)
    if (title && href) items.push(item);
  });

  return items;
}

module.exports = {
  parseTasks
};
