# Implementation Plan — 3ddd.ru Job Parser

Purpose
- Build a small Node.js scraper (plain JavaScript) that periodically checks two pages on 3ddd.ru and extracts job offerings:
  - https://3ddd.ru/work/tasks
  - https://3ddd.ru/work/vacancies

Summary
- Technology: Node.js + plain JavaScript, lightweight HTTP fetch + Cheerio for HTML parsing.
- Storage: single JSON snapshot file (data/jobs.json) plus per-change history files kept in data/history.
- Scheduling: long-running Node process using node-schedule (configurable interval, default 5 minutes).
- Notifications: for now, print new/updated items to the console; notifications can be added later.
- Scope: only the first page of each section (no pagination).
- Retention: keep history for 30 days (configurable).

Assumptions (from requirements)
- Default check interval: 5 minutes (configurable via .env).
- Storage: JSON file snapshot.
- Fields: final list of fields will be determined after an initial parsing pass; parser will extract common fields and be defensive about missing values.
- Parsing method: fetch + Cheerio (fast and light). Puppeteer fallback only if pages require client-side rendering.
- Scheduler: cross-platform long-running Node process.
- Dedupe: id will be SHA1 hash of the job URL, falling back to a hash of title+snippet if URL missing.
- Update detection: compare content hash to detect updates; store updated_at.
- Retention: delete history older than 30 days.

High-level architecture (files)
- src/
  - index.js — application entry point, CLI flags (e.g., --once)
  - config.js — loads .env (dotenv) and validates settings
  - fetcher.js — HTTP fetch helper with timeouts, retries, user-agent
  - parsers/
    - tasksParser.js — extracts items from /work/tasks
    - vacanciesParser.js — extracts items from /work/vacancies
  - storage/
    - jsonStore.js — read/write snapshot atomically, write history files, retention cleanup
  - scheduler.js — scheduling logic using node-schedule or setInterval fallback
  - utils/
    - hash.js — SHA1 hashing utilities
    - compare.js — compute content_hash and detect changes
    - retention.js — cleanup old history files
- data/
  - jobs.json — current snapshot (overwritten atomically each successful run)
  - history/ — per-item previous versions (id_timestamp.json)
- .env — runtime configuration
- package.json — scripts & dependencies
- README.md — usage, configuration, examples

Suggested .env variables
- INTERVAL_MIN=5
- DATA_PATH=data/jobs.json
- HISTORY_DIR=data/history
- RETENTION_DAYS=30
- USER_AGENT="3ddd-parser (+https://yourdomain.example)"
- TIMEOUT_MS=10000
- RUN_ONCE=false
- LOG_LEVEL=info

Data model (per item — example JSON)
{
  "id": "sha1-of-url-or-fallback",
  "source": "3ddd.ru",
  "section": "tasks" | "vacancies",
  "title": "Job title",
  "url": "https://3ddd.ru/....",
  "snippet": "short description if available",
  "description": "full HTML or text",
  "date_posted": "2025-09-06T12:00:00Z", // optional
  "salary": "string or null",
  "company": "string or null",
  "location": "string or null",
  "tags": ["tag1","tag2"],
  "scraped_at": "2025-09-06T12:05:00Z",
  "updated_at": "2025-09-06T12:07:00Z",   // when changes detected
  "content_hash": "sha1-of-main-fields"    // for detecting content changes
}

Run flow (behavior)
1. Load configuration and existing snapshot (data/jobs.json) if present.
2. For each target page:
   - Fetch page (with retries, timeout, custom User-Agent).
   - Parse the page with the appropriate parser (Cheerio) into item objects that match the data model.
3. For each parsed item:
   - Derive id = SHA1(url) when URL exists; fallback to SHA1(title + snippet).
   - Compute content_hash = SHA1(title + snippet + description + date_posted + salary) (or similar canonicalization).
   - Compare with snapshot:
     - If id is new -> mark as new, set scraped_at, add to snapshot.
     - If id exists and content_hash changed -> mark as updated, set updated_at, write previous version to history/{id}_{timestamp}.json.
     - If exists and unchanged -> no action.
4. After processing all pages:
   - Write new snapshot atomically to data/jobs.json (write to temp -> rename).
   - Print concise console summaries of new/updated items (title, url, status).
5. Retention:
   - Periodic (daily) job deletes history files older than RETENTION_DAYS.

Resilience & safety
- Atomic writes: write a temporary file and rename to avoid partial/corrupt snapshots.
- Retries: exponential backoff retry (e.g., 3 attempts) for transient HTTP errors.
- Respectful scraping: low request rate, friendly User-Agent, default 5-minute interval.
- Fail-safe: do not overwrite current snapshot if the run fails mid-processing.
- Parsers should be defensive and tolerate missing fields and minor DOM changes.

Parsing strategy / selectors (Act phase notes)
- Implement two separate parsers (tasksParser.js, vacanciesParser.js) because DOM structures may differ.
- Parsers will:
  - Select list/container elements for job items (by class, article/list item, etc.).
  - Extract URL, title, snippet, and any metadata present.
  - Optionally fetch the job detail page only if necessary (avoid extra requests where possible).
  - Normalize dates to ISO-8601 where possible (attempt common Russian date formats).
- First Act run: run in run-once mode to inspect parsed items and tune selectors and field extraction.

Storage details
- Primary snapshot: data/jobs.json — single object mapping id -> item or array of items (choose consistent representation).
- History: for each updated item save previous item JSON as HISTORY_DIR/{id}_{timestamp}.json.
- Optionally keep per-run snapshot copies if desired (not required by default).
- Retention cleanup: remove history files older than configured retention days.

CLI & scheduling
- Provide CLI flag `--once` to run a single scrape and exit for testing.
- Default behavior: long-running process that schedules a job every INTERVAL_MIN using node-schedule or setInterval.
- Cross-platform: long-running Node approach avoids relying on platform-specific cron/task-scheduler.

Logging & errors
- Start with console logging only (info/warn/error).
- Use structured logs for key events: run start/finish, item new/updated counts, fetch errors, parse errors.
- Optionally add file-based rotating logs later.

Testing & usage
- Example commands:
  - npm install
  - node src/index.js --once           # run once for testing
  - npm run start                      # start long-running scheduler
- During development: run `--once`, inspect console output, open data/jobs.json and data/history to verify correct behavior.

Implementation steps (detailed)
1. Project setup
   - Add dependencies: cheerio, dotenv, node-schedule (or node-cron), (node-fetch or use native fetch if Node >=18), fs-extra (optional).
   - Add npm scripts: start, run-once.
2. Configuration and utilities
   - Implement config.js to read and validate .env.
   - Implement utils/hash.js for SHA1 hashing (crypto).
3. Storage
   - Implement storage/jsonStore.js with atomic writes, snapshot read/write, history writer, and retention cleanup.
4. Fetcher
   - Implement fetcher.js with timeout, retries, and UA header.
5. Parsers
   - Implement parsers/tasksParser.js and parsers/vacanciesParser.js that return normalized item objects.
   - Run `node src/index.js --once` to inspect actual pages and tune selectors.
6. Scheduler and index
   - Implement scheduler.js to schedule periodic runs.
   - Implement src/index.js to wire everything together and support `--once`.
7. Retention & cleanup
   - Implement retention job (daily) to delete old history files.
8. Documentation
   - Add README.md with usage, configuration, and examples.
9. Optional next-phase
   - Add notifications (webhook/email).
   - Add Puppeteer fallback if client-side rendering is required.
   - Add unit tests for parsers.

Legal & ethical notes
- Use polite scraping practices (limited request rate, friendly user-agent).
- Check site terms of service and robots.txt before frequent runs or scaling.

Deliverables
- implementation-plan.md (this file)
- Source files described above (to be created in Act phase)
- README with run instructions
- Example data/jobs.json produced by a test run
- Sample history files in data/history

Estimated effort (rough)
- Scaffolding & config: 1–2 hours
- Parsers + storage + scheduler: 2–4 hours (depends on DOM complexity and selectors)
- Iteration & testing: 1–2 hours
- Optional features (notifications, Puppeteer): +2–4 hours

Next steps
- I will implement the project files and run an initial test run if you want me to proceed. To begin writing files and code, toggle to Act mode (you already toggled) and reply "go" so I can start creating files and implement the scraper.
- If you want any changes to this plan before implementation (storage, notifications, pagination, Puppeteer fallback), list them and I will update the plan.
