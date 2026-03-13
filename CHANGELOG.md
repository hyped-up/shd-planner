# Changelog

## [1.1.0] - 2026-03-13

### Added
- **Auto-Update System:** Automatic weekly game data refresh inside Docker containers via `node-cron` scheduler
- **Custom Server Entrypoint:** `server.ts` wraps Next.js + cron scheduler with Fandom Wiki change detection
- **Data Status API:** `GET /api/data-status` returns update status, changelog, and next check time
- **Data Update API:** `POST /api/data-update` triggers manual data refresh
- **Settings UI:** "Data Updates" section showing status indicator, change summary, next check, and "Check Now" button
- **Scraper Compilation:** `tsconfig.scripts.json` compiles scraper TS to JS during Docker build (no `tsx` at runtime)
- **Docker Volume:** `shd-data` volume persists updated game data across container restarts

### Changed
- **Data Loader:** Replaced `import()` with `fs.readFile` + `JSON.parse` — `clearDataCache()` now triggers actual disk re-reads for hot-reload
- **Scraper Execution:** Switched from blocking `execFileSync` to async `execFile` — web server stays responsive during updates
- **Merge Pipeline:** Completed raw-to-canonical merge logic with deduplication by slug, field completeness comparison, and changelog generation
- **Exit Codes:** `scrape-all.ts` now exits 1 when all scrapers fail or entity count regresses
- **Docker Memory:** Raised limit from 512MB to 768MB for scraper headroom
- **Docker Compose:** Added `shd-data` volume, `DATA_DIR`, `RAW_DIR`, and `DATA_UPDATE_INTERVAL` environment variables
- **Dockerfile:** Added scraper compilation stage, seed data copy, and writable directories

### Fixed
- `clearDataCache()` now actually works — previously, Node.js module cache prevented hot-reload of `import()`-loaded JSON

## [1.0.1] - 2026-03-12

### Added
- **Data Integrity Tests:** Expanded `data-integrity.test.ts` from 22 to 55 tests covering brand sets, gear sets, weapons, talents, skills, exotics, cross-references, and search functionality

## [1.0.0] - 2026-03-12

### Added
- **Design System:** Reusable UI component library (Button, Input, Dialog, Card, Badge, Slider, Tabs)
- **Data Caching:** Module-level caching layer for JSON data imports via `cachedLoader<T>()`
- **Error Boundaries:** Error and loading states for all route segments (builder, database, settings)
- **Database Browser:** All 6 database pages now load real data from JSON knowledge base (341 entities)
- **Item Detail Pages:** Individual pages for weapons, brands, gear sets, and exotics with `generateStaticParams()` SSG
- **Global Search:** Cross-entity search at `/database/search` with debounced input and grouped results
- **Settings Page:** Full AI configuration (provider, model, API key), Google Drive connect, preferences
- **Build Validation:** Real-time validation wired to builder UI via Zustand store
- **Build Comparison:** Side-by-side comparison of up to 3 builds with color-coded stat diffs at `/builder/compare`
- **Loadout Optimizer:** Heuristic gear optimizer with DPS/Armor/Skill/Balanced targets and constraints
- **Health Check:** `/api/health` endpoint for Docker and monitoring
- **CI/CD:** GitHub Actions pipeline (lint, test, build, Docker image)
- **Test Suite:** Expanded from 45 to 150+ tests covering calc engine, sharing, data integrity
- **Data Pipeline:** `npm run data:update` convenience script chaining scrape → merge → validate → build
- **Docker Hardening:** Resource limits, structured JSON logging, health check endpoint

### Changed
- Bumped version to 1.0.0 for production-ready release
- Docker health check now targets `/api/health` instead of root page
- Docker compose includes resource limits (512MB memory, 1 CPU) and log rotation

## [0.3.0] - 2026-03-12

### Added
- Item detail pages for weapons (`/database/weapons/[id]`), brand sets (`/database/gear/[id]`), gear sets (`/database/sets/[id]`), and exotics (`/database/exotics/[id]`)
- Full stat display for individual items with back navigation
- `generateStaticParams()` for SSG pre-rendering of all detail pages
- Dynamic metadata generation for each detail page

## [0.2.0] - 2026-03-12

### Added
- Global database search page at `/database/search` with fuzzy cross-entity search
- Results grouped by entity type with color-coded badges and score indicators
- Debounced search input (300ms) using shared SearchBar component

## [0.1.0] - 2026-03-08

### Added
- Interactive build planner with gear, weapons, and skills
- DPS calculator with additive vs amplified damage separation
- Game database browser for all item categories
- Build sharing via compressed URLs
- Local build storage with Zustand persist
- Google Drive backup/restore (optional OAuth)
- AI build advisor with streaming (BYOK)
- Icon scraper for Fandom Wiki game icons
- Stat validation and cap warnings
- Meta build templates
- Docker deployment support
- Comprehensive deployment documentation
