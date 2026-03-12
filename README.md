# 🟠 SHD Planner

```
  ██████╗██╗  ██╗██████╗   ██████╗ ██╗      █████╗ ███╗  ██╗
  ██╔════╝██║  ██║██╔══██╗  ██╔══██╗██║     ██╔══██╗████╗ ██║
  ███████╗███████║██║  ██║  ██████╔╝██║     ███████║██╔██╗██║
  ╚════██║██╔══██║██║  ██║  ██╔═══╝ ██║     ██╔══██║██║╚████║
  ███████║██║  ██║██████╔╝  ██║     ███████╗██║  ██║██║ ╚███║
  ╚══════╝╚═╝  ╚═╝╚═════╝   ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚══╝

  ░░ STRATEGIC HOMELAND DIVISION ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░░ BUILD PLANNER v1.0.0  //  ISAC NETWORK ONLINE ░░░░░░░░░░░
  ░░ STATUS: OPERATIONAL  //  KNOWLEDGE BASE: 341 ENTITIES ░░░
```

> 🎯 **Division 2 build-crafting companion** — plan builds, calculate DPS, browse the complete game database, and share loadouts. All in the browser. No account required.

---

## 📡 ISAC Systems Online

```
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ALL ONLINE

  ISAC: "All systems operational, Agent."
```

| System | Status | Details |
|--------|--------|---------|
| 🔧 Build Planner | 🟢 `ONLINE` | 6 gear slots, 3 weapons, 2 skills — full attribute configuration |
| 📊 DPS Calculator | 🟢 `ONLINE` | Additive vs amplified damage separation, sustained/crit/headshot breakdowns |
| 🔍 Database Browser | 🟢 `ONLINE` | 341 searchable entities across brands, gear sets, weapons, talents, exotics, skills |
| ✅ Stat Validator | 🟢 `ONLINE` | CHC cap warnings, over-investment detection, build completeness checks |
| 🔗 Build Sharing | 🟢 `ONLINE` | Compressed URLs for Discord + JSON import/export |
| 💾 Local Storage | 🟢 `ONLINE` | Unlimited builds saved in-browser with undo/redo |
| ☁️ Google Drive | 🟡 `STANDBY` | Optional OAuth-based backup/restore |
| 🤖 AI Advisor | 🟡 `STANDBY` | BYOK streaming (Anthropic/OpenAI) — disabled by default |
| 🏆 Meta Templates | 🟢 `ONLINE` | Pre-built loadouts for DPS, tank, healer, skill roles |
| ⚡ Loadout Optimizer | 🟢 `ONLINE` | Heuristic gear optimizer with DPS/Armor/Skill/Balanced targets |
| 📈 Build Compare | 🟢 `ONLINE` | Side-by-side comparison of up to 3 builds with color-coded diffs |
| 🩺 Health Check | 🟢 `ONLINE` | `/api/health` endpoint for Docker and monitoring |
| 🔄 CI/CD Pipeline | 🟢 `ONLINE` | GitHub Actions: lint, test, build, Docker image |

---

## 🚀 Quick Deploy

### 🐳 Docker (Recommended)

```bash
git clone https://github.com/hyped-up/shd-planner.git
cd shd-planner
docker build -t shd-planner .
docker run -p 3000:3000 shd-planner
```

```
  ISAC: "Connection established. Welcome back, Agent."
  >> http://localhost:3000
```

### 💻 Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 🌐 Remote Docker Host

```bash
# Build and push to your registry
docker build -t your-registry/shd-planner:latest .
docker push your-registry/shd-planner:latest

# On remote host
docker pull your-registry/shd-planner:latest
docker run -d --name shd-planner --restart unless-stopped -p 3000:3000 your-registry/shd-planner:latest
```

> 💡 No database required. No external APIs required. No environment variables required for core functionality. The app is fully self-contained — all game data bundled at build time.

---

## 🗄️ Knowledge Base

```
  SCANNING DIVISION NETWORK...

   22 Gear Sets          ████████████████████ 100%
   33 Brand Sets         ████████████████████ 100%
   49 Exotics            ████████████████████ 100%
   58 Named Items        ████████████████████ 100%
   45 Weapon Archetypes  ████████████████████ 100%
  106 Talents            ████████████████████ 100%
   42 Skill Variants     ████████████████████ 100%
    6 Specializations    ████████████████████ 100%

  TOTAL: 341 entities indexed
  LAST UPDATE: Title Update 21.1
  STATUS: COMPLETE -- ALL CATEGORIES AT 100%
```

📖 Data sourced from the [Division 2 Fandom Wiki](https://thedivision.fandom.com/), community guides, and in-game verification. Maintained via a shared canonical data pipeline with the [SHD Planner MCP Server](https://github.com/hyped-up/shd-planner-cwd).

---

## 🏗️ Architecture

```
  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
  ▒  S H D   P L A N N E R   W E B   A P P                               ▒
  ▒                                                                      ▒
  ▒   [Builder]    [Database]    [DPS Calc]    [Share Codec]             ▒
  ▒       |            |            |              |                     ▒
  ▒       +------------+------------+--------------+                     ▒
  ▒                         |                                            ▒
  ▒              Zustand Store + Data Loader                             ▒
  ▒                         |                                            ▒
  ▒              JSON Knowledge Base (341 entities)                      ▒
  ▒              brands / gear sets / exotics / weapons                  ▒
  ▒              talents / skills / specs / meta builds                  ▒
  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
                            |
                     Data Pipeline
                            |
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░  S H D   P L A N N E R   M C P   S E R V E R                         ░
  ░                                                                      ░
  ░   Canonical JSON --> import-mcp-data.ts --> Web App                  ░
  ░   12 files * 300+ entries * snake_case * _metadata per file          ░
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| 🖥️ Framework | Next.js 16 (App Router) + React 19 |
| 📝 Language | TypeScript 5 (strict mode) |
| 🎨 Styling | Tailwind CSS v4 — Division 2 dark theme (SHD orange `#FF6A00`) |
| 🧠 State | Zustand 5 with localStorage persistence |
| ✅ Validation | Zod v4 |
| 🔗 Sharing | lz-string URL compression |
| 🧪 Testing | Vitest |
| 🐳 Container | Docker (Alpine, multi-stage, non-root) |
| 🤖 AI (optional) | Anthropic / OpenAI streaming (BYOK) |

---

## 🔄 Data Management

```bash
# Import data from the MCP canonical knowledge base
npm run data:import-mcp

# Refresh from community sources
npm run scrape:all && npm run data:merge

# Refresh item icons from Fandom Wiki
npm run scrape:icons && npm run data:merge-icons

# Validate data integrity
npm run data:validate && npm run data:cross-validate

# Full pipeline: scrape → merge → validate → build
npm run data:update
```

> 📡 The canonical data source is [shd-planner-cwd](https://github.com/hyped-up/shd-planner-cwd) (Python MCP server). Run `npm run data:import-mcp` to sync. This transforms snake_case MCP data into camelCase TypeScript-friendly JSON, splits exotics by type, prefixes IDs, and updates the manifest.

---

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── builder/         #   Build planner page
│   │   └── compare/     #   Side-by-side build comparison
│   ├── database/        #   Database browser (gear, weapons, talents, etc.)
│   │   ├── search/      #   Global cross-entity search page
│   │   └── */[id]/      #   SSG detail pages for each entity type
│   ├── api/health/      #   Health check endpoint
│   └── settings/        #   AI configuration + preferences
├── components/
│   ├── builder/         # Build planner UI (gear config, stats panel, validation)
│   ├── database/        # Database browser (search, filter, sort)
│   ├── shared/          # Reusable (ItemIcon, Toast, SearchBar, FilterPanel)
│   └── ai/              # AI advisor components
├── data/                # JSON knowledge base (341 entities)
├── hooks/               # Zustand store, custom hooks
├── lib/
│   ├── calc/            # DPS calculator, stat aggregator, build validator
│   ├── types/           # TypeScript interfaces for all game entities
│   ├── schemas/         # Zod v4 validation schemas
│   ├── sharing/         # URL codec, JSON export, build migration
│   ├── ai/              # AI client, prompts, config
│   └── export/          # Google Drive integration
├── scripts/
│   ├── scrapers/        # Data + icon scrapers (wiki, community sites)
│   ├── transforms/      # Data normalization, MCP import, icon merge
│   └── validators/      # Cross-reference and integrity checks
public/icons/            # Cached item icons
tests/                   # Vitest test suite
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Required: None — core app works without any env vars

# Optional: Google Drive backup
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Optional: AI Build Advisor (BYOK — your key, your cost)
NEXT_PUBLIC_AI_ENABLED=false
AI_API_KEY=
AI_MODEL=claude-sonnet-4-5-20250514
```

---

## 🚢 Deployment

### 🐳 Docker (Production)

```bash
docker build -t shd-planner .
docker run -d \
  --name shd-planner \
  --restart unless-stopped \
  -p 3000:3000 \
  shd-planner
```

> 📋 Multi-stage build (deps → build → runner) with Alpine Linux, non-root `nextjs` user, ~400MB standalone image.

### ▲ Vercel

```bash
npx vercel --prod
```

Set Root Directory to `.` and Framework Preset to `Next.js`.

### 🖥️ Self-Hosted (PM2 / systemd / nginx)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guides.

---

## 🔗 Related Projects

| Project | Purpose |
|---------|---------|
| 🐍 [shd-planner-cwd](https://github.com/hyped-up/shd-planner-cwd) | Python MCP server — canonical knowledge base, 8 queryable tools for Claude Code |
| 🧠 [agentic_patterns](https://github.com/hyped-up/agentic_patterns) | AI agentic pattern library including standalone Division 2 build-crafting prompt |

---

## 📚 Additional Documentation

- 📖 [Deployment Guide](docs/DEPLOYMENT.md) — Vercel, Docker, PM2, and self-hosted instructions
- 🧮 [Damage Formulas](docs/FORMULAS.md) — Division 2 damage calculation reference
- ☁️ [Google Drive Setup](docs/GOOGLE-DRIVE-SETUP.md) — OAuth configuration guide

---

```
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░                                                                   ░
  ░   ISAC: "Build optimization complete, Agent.                      ░
  ░          Stay safe out there."                                    ░
  ░                                                                   ░
  ░   "Exotics aren't farmed. They're earned."                        ░
  ░                                                                   ░
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```
