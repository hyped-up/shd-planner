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
- **DPS + Stat Calculator** — CHC/CHD caps, headshot, skill scaling, armor/health.
- **Database Browser** — brands, gear sets, exotics, named items, weapons, talents, skills.
- **Build Sharing** — compressed URL sharing + JSON import/export.
- **Build Compare** — side-by-side diff of up to 3 builds.
- **Optimizer** — heuristic DPS/Armor/Skill/Balanced optimization.
- **Auto-Updating Data** — scheduled data refresh (Docker).

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

# optional: Google Drive backup
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

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
