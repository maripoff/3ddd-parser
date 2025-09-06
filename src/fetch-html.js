const fetch = require('node-fetch');
const config = require('./config');

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Fetch a URL with timeout, retries and a custom User-Agent.
 * Returns response.text() on success.
 */
module.exports.fetchHtml = async function fetchHtml(url, opts = {}) {
  const retries = typeof opts.retries === 'number' ? opts.retries : 3;
  const timeout = opts.timeout || config.TIMEOUT_MS;
  const ua = opts.userAgent || config.USER_AGENT;

  let attempt = 0;
  let lastErr = null;

  while (attempt < retries) {
    attempt += 1;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal,
        redirect: 'follow',
        timeout: timeout
      });

      clearTimeout(id);

      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
        // For 4xx errors, don't retry
        if (res.status >= 400 && res.status < 500) {
          throw lastErr;
        }
        // otherwise fallthrough to retry
        throw lastErr;
      }

      const text = await res.text();
      return text;
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      const shouldRetry = attempt < retries;
      if (!shouldRetry) break;
      // exponential backoff with jitter
      const backoff = Math.min(2000 * 2 ** (attempt - 1), 15000);
      const jitter = Math.floor(Math.random() * 500);
      await sleep(backoff + jitter);
    }
  }

  throw lastErr || new Error('Failed to fetch');
}
