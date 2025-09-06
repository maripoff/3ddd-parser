const path = require('path');
const fs = require('fs-extra');
const { fetchHtml } = require('./fetch-html');
const { parseVacancies } = require('./parse-vacancies');

const TARGET = 'https://3ddd.ru/work/vacancies';
const OUT_PATH = path.join('data', 'vacancies.json');

async function main() {
  try {
    console.info('Fetching', TARGET);
    const html = await fetchHtml(TARGET);
    const items = parseVacancies(html);
    console.info(`Parsed ${items.length} items. Writing to ${OUT_PATH}`);
    // TODO: items нужно сравнить с локально сохранёнными
    // чтобы узнать появились ли новые вакансии
    let i = 1;
    for(let vacancy of items){
      console.log(`${i++}: ${vacancy.title}`); 
    }
    await fs.mkdirp(path.dirname(OUT_PATH));
    await fs.writeFile(OUT_PATH, JSON.stringify(items, null, 2), 'utf8');

    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}
