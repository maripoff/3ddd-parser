// @ts-check
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Vacancy typedef — fields extracted from the main vacancies page.
 *
 * @typedef {Object} Vacancy
 * @property {string|null} path   Relative URL path (e.g. "/work/vacancy_show/9190")
 * @property {string|null} title  Vacancy title
 * @property {string|null} salary Salary text as displayed (raw)
 */
 
/**
 * Parse the /work/vacancies page HTML (server-rendered) and return an array
 * of Vacancy objects. This parser targets the site's table.result structure.
 *
 * @param {string} html HTML source of the vacancies page
 * @param {string} [baseUrl='https://3ddd.ru'] Base URL used to resolve relative paths
 * @returns {Vacancy[]}
 */

/**
 * Parse the /work/vacancies page HTML (server-rendered) and return an array
 * of normalized vacancy objects. This parser targets the site's table.result
 * structure to avoid capturing pagination/login links.
 * @returns {Vacancy[]}
 */
function parseVacancies(html) {
  const $ = cheerio.load(html);
  const items = [];

  // Each vacancy is rendered as <table class="result"> ... </table>
  $('table.result').each((i, table) => {
    const t = $(table);

    // Company and metadata are in the thead > tr > th > div
    const companyEl = t.find('thead tr th div .nickname a').first();
    const company = companyEl.text().trim() || null;

    const dateEl = t.find('thead tr th div .date').first();
    const dateText = dateEl.text().trim() || null;

    // location is often part before the comma in dateText (e.g. "Москва, 28 авг.")
    let location = null;
    if (dateText) {
      const parts = dateText.split(',');
      if (parts.length >= 1) location = parts[0].trim() || null;
    }

    // Main row is tbody > tr
    const row = t.find('tbody tr').first();
    const descTd = row.find('td.desc').first();
    const priceTd = row.find('td.price').first();

    const titleEl = descTd.find('p a').first();
    const title = titleEl.text().trim() || null;
    const href = titleEl.attr('href') || null;

    // categories / divisions in <p class="division">
    const divisionText = descTd.find('p.division').text().trim() || null;
    const tags = divisionText
      ? divisionText.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    // salary / price cell
    const salaryRaw = priceTd.text().trim() || null;
    const salary = salaryRaw ? salaryRaw.replace(/\s+/g, ' ').trim() : null;

    // Build minimal item with fields requested: absolute path (full URL), title, salary
    const fullPath = href
      ? (href.startsWith('http://') || href.startsWith('https://') ? href : new URL(href, 'https://3ddd.ru').toString())
      : null;
    const item = {
      path: fullPath,
      title: title || null,
      salary: salary || null
    };

    // Only include real vacancy rows (title + href)
    if (title && href) items.push(item);
  });

  return items;
}

module.exports = {
  parseVacancies
};
