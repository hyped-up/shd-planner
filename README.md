# 🟠 SHD Planner

```
███████╗██╗  ██╗██████╗      ██████╗ ██╗      █████╗ ███╗  ██╗███╗   ██╗███████╗██████╗
██╔════╝██║  ██║██╔══██╗     ██╔══██╗██║     ██╔══██╗████╗ ██║████╗  ██║██╔════╝██╔══██╗
███████╗███████║██║  ██║     ██████╔╝██║     ███████║██╔██╗██║██╔██╗ ██║█████╗  ██████╔╝
╚════██║██╔══██║██║  ██║     ██╔═══╝ ██║     ██╔══██║██║╚████║██║╚██╗██║██╔══╝  ██╔══██╗
███████║██║  ██║██████╔╝     ██║     ███████╗██║  ██║██║ ╚███║██║ ╚████║███████╗██║  ██║
╚══════╝╚═╝  ╚═╝╚═════╝      ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚══╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝

░░ STRATEGIC HOMELAND DIVISION ░░  BUILD PLANNER + DATABASE ░░  ISAC ONLINE ░░
```

> **Division 2 build-crafting command center** — plan builds, calculate DPS, browse the full gear/weapon database, and share loadouts. All in the browser. No account required.

---

## ⚡ Quick Start

### Docker (recommended)
```bash
git clone https://github.com/hyped-up/shd-planner.git
cd shd-planner
docker compose up -d
```
Open: **http://localhost:3000**

### Local Dev
```bash
npm install
npm run dev
```

---

## ✨ Feature Highlights

- **Build Planner** — 6 gear slots, 3 weapons, 2 skills, specialization, SHD watch.
- **DPS + Stat Calculator** — CHC/CHD caps, weapon-type headshot multipliers, skill scaling, armor/health.
- **Database Browser** — brands, gear sets, exotics, named items, weapons, talents, skills.
- **Build Sharing** — compressed URL sharing + JSON import/export.
- **Build Compare** — side-by-side diff of up to 3 builds.
- **Optimizer** — heuristic DPS/Armor/Skill/Balanced optimization.
- **MCP Build Suggestions** — Builder page `Suggest improvements` button with graceful fallback when MCP is unavailable.
- **Data-Cron Publishing** — dedicated data-cron container refreshes and atomically publishes data (app-side updater disabled by default).
- **Runtime Data Validation** — Zod schema validation on all game data at load time.

---

## 🧠 Architecture (High Level)

```
[ UI: Builder / Database / Compare / Settings ]
          |        |        |
          +--------+--------+
                   |
        Zustand Store + Data Loader
                   |
        JSON Knowledge Base (src/data)
                   |
         Data Pipeline (scrape → merge → validate)
```

---

## 🧪 Tests & Lint

```bash
npm test
npm run lint
```

---

## 🔄 Data Pipeline

```bash
npm run scrape:all        # Scrape community sources
npm run data:merge        # Normalize + merge scraped data
npm run data:validate     # Data integrity checks
npm run data:cross-validate
npm run data:update       # Full pipeline
```

---

## 🔐 Environment

Copy `.env.example` → `.env.local`.

```bash
# optional: AI build advisor (BYOK)
NEXT_PUBLIC_AI_ENABLED=false
AI_API_KEY=
AI_MODEL=claude-sonnet-4-5-20250514
AI_SUGGEST_TIMEOUT_MS=8000

# optional: Google Drive backup
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# optional: data update endpoint auth/rate limit
DATA_UPDATE_TOKEN=
DATA_UPDATE_RATE_WINDOW_MS=60000
DATA_UPDATE_RATE_MAX=5

# optional: legacy app-side updater (disabled by default)
ENABLE_APP_SIDE_UPDATES=false
```

## 🔌 API Notes

- `POST /api/ai/suggest-build`
  - Request: `{ "build": <current build json>, "role?": "dps|tank|healer|skill|hybrid|cc", "mode?": "general|legendary|raid|pvp|countdown|descent", "constraints?": ["itemA"] }`
  - Response: structured JSON with `success`, `available`, inferred/explicit `role` + `mode`, and `suggestions[]`.
  - Behavior: returns graceful error payloads (no app crash) when Python/MCP is unavailable or times out.
- `POST /api/data-update`
  - Requires `Authorization: Bearer <DATA_UPDATE_TOKEN>`
  - Basic in-memory rate limit (defaults: 5 requests / 60s per client IP)
  - Intended for orchestrated/manual trigger requests; app-side updater remains disabled unless `ENABLE_APP_SIDE_UPDATES=true`.

---

## 🐳 Deployment

### Docker (production)
```bash
docker build -t shd-planner .
docker run -d --name shd-planner --restart unless-stopped -p 3000:3000 shd-planner
```

### Vercel
```bash
npx vercel --prod
```

---

## 📁 Project Layout

```
src/
├── app/                 # Next.js App Router pages
├── components/          # UI components
├── data/                # JSON knowledge base
├── hooks/               # Zustand store + custom hooks
├── lib/                 # calc engine + data loader + sharing
├── scripts/             # scrapers + transforms + validators
├── tests/               # Vitest test suite
```

---

## 🔗 Related

- **shd-planner-cwd** (canonical data MCP server)
  https://github.com/hyped-up/shd-planner-cwd

---

## 🛡️ License

TBD

---

```
ISAC: "All systems operational, Agent."
```
