const path = require('path');
const fs = require('fs-extra');
const { fetchHtml } = require('./fetch-html');
const { parseVacancies } = require('./parse-vacancies');
const { parseTasks } = require('./parse-tasks');

const TARGET = 'https://3ddd.ru/work/vacancies';
const OUT_PATH = path.join('data', 'vacancies.json');

const TARGET_TASKS = 'https://3ddd.ru/work/tasks';
const OUT_PATH_TASKS = path.join('data', 'tasks.json');

async function main() {
  try {
    // === Vacancies ===
    console.info('Fetching', TARGET);
    const html = await fetchHtml(TARGET);
    const items = parseVacancies(html);
    console.info(`Parsed ${items.length} vacancies.`);

    // Print first 10 vacancies
    let i = 1;
    for (const vacancy of items.slice(0, 10)) {
      console.log(`${i++}: ${vacancy.title}`);
    }

    await fs.mkdirp(path.dirname(OUT_PATH));
    await fs.writeFile(OUT_PATH, JSON.stringify(items, null, 2), 'utf8');

    // === Tasks (orders) ===
    console.info('Fetching', TARGET_TASKS);
    const htmlTasks = await fetchHtml(TARGET_TASKS);
    const tasks = parseTasks(htmlTasks);
    console.info(`Parsed ${tasks.length} tasks.`);

    // Print first 10 tasks with title, full URL and payment (or note if none)
    i = 1;
    for (const task of tasks.slice(0, 10)) {
      const url = task.path && (task.path.startsWith('http://') || task.path.startsWith('https://'))
        ? task.path
        : `https://3ddd.ru${task.path || ''}`;
      const payment = task.salary && task.salary.trim() ? task.salary : 'оплата не указана';
      console.log(`${i++}: ${task.title}`);
      console.log(`   ${url}`);
      console.log(`   ${payment}`);
    }

    await fs.mkdirp(path.dirname(OUT_PATH_TASKS));
    await fs.writeFile(OUT_PATH_TASKS, JSON.stringify(tasks, null, 2), 'utf8');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}
