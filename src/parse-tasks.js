// @ts-check
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Parse the /work/tasks page HTML and return an array
 * of normalized task objects. This parser targets the site's table.result
 * structure similarly to parse-vacancies.
 *
 * @param {string} html HTML source of the tasks page
 * @returns {Array<{path: string|null, title: string|null, salary: string|null}>}
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

    // payment / price cell
    const salaryRaw = priceTd.text().trim() || null;
    const salary = salaryRaw ? salaryRaw.replace(/\s+/g, ' ').trim() : null;

    // Build minimal item with fields requested: relative path, title, salary
    const item = {
      path: href || null,
      title: title || null,
      salary: salary || null
    };

    // Only include real task rows (title + href)
    if (title && href) items.push(item);
  });

  return items;
}

module.exports = {
  parseTasks
};
