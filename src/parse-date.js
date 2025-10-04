/**
 * parse-date.js
 * Utility to parse short Russian date text from the site into a normalized
 * DD.MM.YYYY string and a timestamp (ms).
 *
 * Supported inputs:
 * - "3 сен."
 * - "28 авг."
 * - "сегодня", "вчера"
 * - "Москва, 28 авг." (will extract part after comma)
 *
 * If year is missing, current year is assumed. If the resulting date is in
 * the future (e.g. site shows "31 дек." but today is Jan 1), the year is
 * reduced by 1.
 */

const MONTH_MAP = {
  'янв': 1, 'фев': 2, 'мар': 3, 'апр': 4, 'май': 5, 'июн': 6,
  'июл': 7, 'авг': 8, 'сен': 9, 'окт': 10, 'ноя': 11, 'дек': 12
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function normalizeDateText(text) {
  if (!text) return null;
  // remove surrounding whitespace
  const t = String(text).trim().toLowerCase();
  // often "Город, 3 сен." -> take part after comma
  const parts = t.split(',');
  return parts.length > 1 ? parts.slice(1).join(',').trim() : t;
}

function parseDateTextToObj(text, opts = {}) {
  // opts.timeZone not used for now; assume local system TZ for Date creation
  const now = new Date();
  const normalized = normalizeDateText(text);
  if (!normalized) return null;

  // handle "сегодня" and "вчера"
  if (normalized === 'сегодня') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateStr = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
    return { date: dateStr, dateTs: d.getTime(), raw: text };
  }
  if (normalized === 'вчера') {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const dateStr = `${pad2(y.getDate())}.${pad2(y.getMonth() + 1)}.${y.getFullYear()}`;
    return { date: dateStr, dateTs: y.getTime(), raw: text };
  }

  // match formats like "3 сен." or "28 авг." possibly with trailing dot
  const m = normalized.match(/(\d{1,2})\s*([а-яё]{3})\.?/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const monAbbr = m[2].toLowerCase();
    const month = MONTH_MAP[monAbbr];
    if (!month) return null;

    let year = now.getFullYear();
    // create date with assumed year
    const d = new Date(year, month - 1, day);
    // if the date is in the future by more than 1 day, assume previous year
    if (d.getTime() - now.getTime() > 24 * 3600 * 1000) {
      year = year - 1;
    }
    const final = new Date(year, month - 1, day);
    const dateStr = `${pad2(final.getDate())}.${pad2(final.getMonth() + 1)}.${final.getFullYear()}`;
    return { date: dateStr, dateTs: final.getTime(), raw: text };
  }

  // fallback: try to parse any numeric date with month name
  return null;
}

module.exports = {
  parseDateTextToObj
};
