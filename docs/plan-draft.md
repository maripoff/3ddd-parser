I need a few details to finalize the implementation plan. Please answer the numbered items (or say “use defaults” to accept my recommendations).

1) Check frequency: how often should the parser run? (examples: every 5m, 30m, 1h, daily, only manual)  
- Inteval should be configured manually via settings, default is 5 min

2) Storage: where store results/records? Options: JSON file (local), SQLite (single-file DB), Postgres (server), or “none — just emit to stdout / send notifications”.  
- JSON file.

3) Fields to extract: I propose: id (derived), title, url, short description/snippet, full description (HTML or text), publish/post date (if present), tags/categories, salary, company/author, location, scraped_at. Add/remove?  
- Will determine later, after we try parse this site and see what fields we have.

4) Parsing method: pages are likely server-rendered — recommend node-fetch + cheerio (fast, light). If you expect heavy client-side rendering, we should use Puppeteer. Which do you prefer?  
- fast, light

5) Pagination: should the parser follow pagination and fetch all pages, or only the first page of each section?  
- only first page

6) Notifications: when new/changed job appears, should we send notifications? Options: none, webhook (POST), email, or store only.  
- we will work on notification later, for now print to console

7) Scheduling environment: will this run on your PC (Windows) or on a server (Linux)? Do you want a simple cron-based deployment or an always-running Node process using node-schedule?  
- it should work on both windows and linux

8) Dedupe / history retention: how long to keep records (e.g., 30 days, 1 year, indefinitely)? Should we detect updates vs new items?  
- keep history for 30 days

If you’d rather I pick sensible defaults and write the plan, reply “use defaults.”