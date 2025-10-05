// @ts-check
const path = require('path');
const fs = require('fs-extra');
const { fetchHtml } = require('./fetch-html');
const { parseVacancies } = require('./parse-vacancies');
const { parseTasks } = require('./parse-tasks');
const { sendTgNotification } = require('./send-tg-notification');
const { HISTORY_SIZE } = require('./config');

const INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '30000', 10);

const TARGETS = [
  {
    name: 'Вакансии',
    url: 'https://3ddd.ru/work/vacancies',
    parser: parseVacancies,
    outPath: path.join('data', 'vacancies.json'),
    newLabel: 'Новая вакансия!',
  },
  {
    name: 'Заказы',
    url: 'https://3ddd.ru/work/tasks',
    parser: parseTasks,
    outPath: path.join('data', 'tasks.json'),
    newLabel: 'Новый заказ!',
  },
];

async function readJsonSafe(p) {
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    return [];
  }
}

function extractLinks(items) {
  return items.map((i) => i.path).filter(Boolean);
}

async function handleTarget(target) {
  try {
    console.info(`Проверяю: ${target.url}`);
    const html = await fetchHtml(target.url);
    const items = target.parser(html);

    if (target.name === 'Вакансии') {
      console.info('Проверил новые вакансии.');
    } else {
      console.info('Проверил новые заказы.');
    }

    const oldItems = await readJsonSafe(target.outPath);
    const oldLinks = new Set(extractLinks(oldItems));

    const added = items.filter((i) => i.path && !oldLinks.has(i.path));

    if (added.length === 0) {
      console.log(
        `${target.name}: новых ${target.name === 'Вакансии' ? 'вакансий' : 'заказов'} нет`,
      );
    } else {
      const itemLabel = target.name === 'Вакансии' ? 'Вакансия' : 'Заказ';
      for (const a of added) {
        const payment =
          a.salary && a.salary.trim() ? a.salary : 'оплата не указана';
        const fullUrl =
          a.path &&
          (a.path.startsWith('http://') || a.path.startsWith('https://'))
            ? a.path
            : `https://3ddd.ru${a.path || ''}`;

        console.log('');
        console.log(`${target.newLabel}`);
        const cleanTitle = a.title
          ? a.title
              .replace(/https?:\/\/\S+/g, '')
              .replace(/\s+/g, ' ')
              .trim()
          : a.title;
        console.log(`${itemLabel}: ${cleanTitle}`);
        console.log(`Ссылка: ${fullUrl}`);
        console.log(`Оплата: ${payment}`);

        const emoji = target.name === 'Вакансии' ? '💼' : '📋';
        const telegramMessage = `${emoji} *${target.newLabel}*

*${itemLabel}:* ${cleanTitle}

*Оплата:* ${payment}

[Перейти к ${target.name === 'Вакансии' ? 'вакансии' : 'заказу'}](${fullUrl})`;

        await sendTgNotification(telegramMessage);
      }
    }

    // Add createdAt timestamp only to truly new items
    const now = new Date().toISOString();
    const newItemsWithTimestamp = added.map(item => ({
      ...item,
      createdAt: now
    }));

    // Update existing items with current data but preserve their original createdAt
    const currentItemsMap = new Map();
    items.forEach(item => {
      if (item.path) {
        currentItemsMap.set(item.path, item);
      }
    });

    const updatedExistingItems = oldItems.map(oldItem => {
      if (oldItem.path && currentItemsMap.has(oldItem.path)) {
        // Item still exists - update with current data but keep original createdAt
        const currentItem = currentItemsMap.get(oldItem.path);
        return {
          ...currentItem,
          createdAt: oldItem.createdAt || now // Preserve original createdAt, fallback to now if missing
        };
      }
      return oldItem; // Item no longer exists in current fetch, keep as is
    });

    // Merge updated existing items with new items
    const updatedHistory = [...updatedExistingItems, ...newItemsWithTimestamp];
    
    // Remove duplicates based on path and keep only the most recent HISTORY_SIZE items
    const uniqueHistory = [];
    const seenPaths = new Set();
    
    // Process in reverse order to keep the most recent items when deduplicating
    for (let i = updatedHistory.length - 1; i >= 0; i--) {
      const item = updatedHistory[i];
      if (item.path && !seenPaths.has(item.path)) {
        seenPaths.add(item.path);
        uniqueHistory.unshift(item);
        
        // Stop when we reach the history size limit
        if (uniqueHistory.length >= HISTORY_SIZE) {
          break;
        }
      }
    }

    // Save updated history
    await fs.mkdirp(path.dirname(target.outPath));
    await fs.writeFile(target.outPath, JSON.stringify(uniqueHistory, null, 2), 'utf8');

    return { addedCount: added.length, total: items.length };
  } catch (err) {
    console.error(
      `Error handling ${target.name}:`,
      err && err.message ? err.message : err,
    );
    return { addedCount: 0, total: 0 };
  }
}

async function runOnce() {
  for (const t of TARGETS) {
    // run sequentially
    // handleTarget will fetch, parse, compare and write file
    await handleTarget(t);
  }
}

async function loop({ once = false } = {}) {
  await runOnce();
  if (once) return;
  setTimeout(() => loop({ once: false }), INTERVAL_MS);
}

if (require.main === module) {
  const once = process.argv.includes('--once');
  loop({ once }).catch((err) => {
    console.error('Poller error:', err && err.message ? err.message : err);
    process.exit(2);
  });
}

module.exports = {
  runOnce,
  loop,
};
