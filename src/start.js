const path = require('path');
const fs = require('fs-extra');
const { fetchHtml } = require('./fetch-html');
const { parseVacancies } = require('./parse-vacancies');
const { parseTasks } = require('./parse-tasks');
const { sendTelegram } = require('./telegram');
const TARGET = 'https://3ddd.ru/work/vacancies';
const OUT_PATH = path.join('data', 'vacancies.json');

const TARGET_TASKS = 'https://3ddd.ru/work/tasks';
const OUT_PATH_TASKS = path.join('data', 'tasks.json');

async function main() {
  try {
    await sendTelegram('Готов к работе!');
    // === Vacancies ===
    console.info(`Проверяю: ${TARGET}`);
    const html = await fetchHtml(TARGET);
    const items = parseVacancies(html);
    console.info(`${items.length} последних вакансий:`);

    // Print first 10 vacancies with title, full URL, payment and date (or note if none)
    let i = 1;
    for (const vacancy of items.slice(0, 10)) {
      const url = vacancy.path && (vacancy.path.startsWith('http://') || vacancy.path.startsWith('https://'))
        ? vacancy.path
        : `https://3ddd.ru${vacancy.path || ''}`;
      const payment = vacancy.salary && vacancy.salary.trim() ? vacancy.salary : 'оплата не указана';
      const cleanVacancyTitle = vacancy.title ? vacancy.title.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim() : vacancy.title;
      console.log(`${i++}: Вакансия: ${cleanVacancyTitle}`);
      console.log(`   Ссылка: ${url}`);
      console.log(`   Оплата: ${payment}`);
      console.log(`   Дата: ${vacancy.date || vacancy.dateText || 'неизвестно'}`);
    }

    await fs.mkdirp(path.dirname(OUT_PATH));
    await fs.writeFile(OUT_PATH, JSON.stringify(items, null, 2), 'utf8');

    // === Tasks (orders) ===
    console.info(`Проверяю: ${TARGET_TASKS}`);
    const htmlTasks = await fetchHtml(TARGET_TASKS);
    const tasks = parseTasks(htmlTasks);
    console.info(`${tasks.length} последних задач:`);

    // Print first 10 tasks with title, full URL, payment and date (or note if none)
    i = 1;
    for (const task of tasks.slice(0, 10)) {
      const url = task.path && (task.path.startsWith('http://') || task.path.startsWith('https://'))
        ? task.path
        : `https://3ddd.ru${task.path || ''}`;
      const payment = task.salary && task.salary.trim() ? task.salary : 'оплата не указана';
      const cleanTaskTitle = task.title ? task.title.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim() : task.title;
      console.log(`${i++}: Заказ: ${cleanTaskTitle}`);
      console.log(`   Ссылка: ${url}`);
      console.log(`   Оплата: ${payment}`);
      console.log(`   Дата: ${task.date || task.dateText || 'неизвестно'}`);
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
