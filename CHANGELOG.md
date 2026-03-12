# Changelog

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
