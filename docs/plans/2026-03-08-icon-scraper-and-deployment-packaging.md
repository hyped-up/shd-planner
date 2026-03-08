# Icon Scraper & Deployment Packaging — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scrape ~188 Division 2 item icons from the Fandom Wiki, cache them locally in `public/icons/`, integrate them into the UI, then package the entire SHD Planner into `/home/lkeneston/projects/division2_assistant/div` with deployment documentation.

**Architecture:** A new scraper script queries the MediaWiki `imageinfo` API to resolve CDN URLs for all item categories, downloads PNGs to `public/icons/` organized by category, and a merge script patches the JSON data files with local `/icons/...` paths. A reusable `<ItemIcon>` component renders icons with letter-badge fallback. Finally, the entire app is packaged into the division2_assistant repo as a deployable subdirectory.

**Tech Stack:** TypeScript (tsx), MediaWiki API, Node.js fs/fetch, Next.js Image component, Tailwind CSS

---

## Task 1: Create Icon Scraper Script

**Files:**
- Create: `src/scripts/scrapers/scrape-icons.ts`

**Step 1: Create the scraper with wiki API integration**

The scraper should:
- Use the MediaWiki API at `https://thedivision.fandom.com/api.php`
- For each item category, query category pages to find item pages
- For each item page, extract the infobox image filename
- Query `action=query&titles=File:{filename}&prop=imageinfo&iiprop=url` to get the CDN URL
- Download each icon PNG to `public/icons/{category}/{item-id}.png`
- Rate-limit to 1500ms between requests (matching existing scraper)
- Seed with the 20 known URLs from export_to_sheets.py as guaranteed fallbacks
- Output a summary of downloaded/failed/skipped icons

```typescript
// Key API calls:
// 1. List category pages: action=query&list=categorymembers&cmtitle=Category:{cat}&cmlimit=50
// 2. Parse page for image: action=parse&page={title}&prop=wikitext — extract [[File:xxx.png]] from infobox
// 3. Resolve image URL: action=query&titles=File:{filename}&prop=imageinfo&iiprop=url
// 4. Download: fetch(cdnUrl) → write to public/icons/{category}/{id}.png
```

Target categories and their wiki category names:
- `brands/` — "Brand Sets" wiki category + manual seed list
- `gear-sets/` — "Gear Sets" wiki category + 13 known URLs
- `exotics/` — "Exotic" wiki category
- `talents/` — "Talents" wiki category (gear + weapon)
- `weapons/` — 7 known weapon class URLs (no wiki scrape needed)
- `skills/` — "Skills" wiki category
- `specializations/` — "Specializations" wiki category

**Step 2: Add npm script to package.json**

```json
"scrape:icons": "npx tsx src/scripts/scrapers/scrape-icons.ts"
```

**Step 3: Run the scraper and verify icons download**

Run: `npm run scrape:icons`
Expected: Icons downloaded to `public/icons/` with summary output

**Step 4: Commit**

```bash
git add src/scripts/scrapers/scrape-icons.ts package.json public/icons/
git commit -m "feat: add icon scraper — downloads ~188 Division 2 icons from Fandom Wiki"
```

---

## Task 2: Create Icon Merge Script

**Files:**
- Create: `src/scripts/transforms/merge-icons.ts`

**Step 1: Create merge script that patches JSON data files**

The script should:
- Scan `public/icons/` for downloaded icon files
- For each JSON data file (gear-brands.json, gear-sets.json, etc.), match items by ID
- Add `iconUrl: "/icons/{category}/{id}.png"` to each matched item
- Write updated JSON back to `src/data/`
- Report how many items were patched vs. missing icons

**Step 2: Add npm script**

```json
"data:merge-icons": "npx tsx src/scripts/transforms/merge-icons.ts"
```

**Step 3: Run merge and verify JSON updates**

Run: `npm run data:merge-icons`
Expected: JSON files now contain `iconUrl` fields

**Step 4: Commit**

```bash
git add src/scripts/transforms/merge-icons.ts src/data/*.json package.json
git commit -m "feat: add icon merge script — patches JSON data files with local icon paths"
```

---

## Task 3: Add iconUrl to TypeScript Types

**Files:**
- Modify: `src/lib/types/gear.ts` — add `iconUrl?: string` to IBrandSet, IGearSet, INamedItem, IGearTalent
- Modify: `src/lib/types/weapons.ts` — add `iconUrl?: string` to IWeapon, IWeaponTalent
- Modify: `src/lib/types/skills.ts` — add `iconUrl?: string` to ISkill, ISpecialization
- Modify: `src/lib/types/exotics.ts` — add `iconUrl?: string` to IExoticGear, IExoticWeapon

**Step 1: Add optional iconUrl field to all entity interfaces**

Add `iconUrl?: string;` after the `name` field in each interface. This is optional so existing data without icons still validates.

**Step 2: Verify build passes**

Run: `npm run build`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/types/*.ts
git commit -m "feat: add optional iconUrl field to all game entity type interfaces"
```

---

## Task 4: Create ItemIcon Component

**Files:**
- Create: `src/components/shared/ItemIcon.tsx`

**Step 1: Build the reusable icon component**

```typescript
// Props: iconUrl (optional), fallbackLetter (string), size (sm/md/lg), alt (string)
// If iconUrl exists: render <Image> with the local path
// If no iconUrl: render a styled div with the fallbackLetter
// Use next/image for automatic optimization
// Style: rounded, bg-background-tertiary, border
```

Sizes: `sm` = 24px, `md` = 36px, `lg` = 48px

**Step 2: Verify component renders**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/shared/ItemIcon.tsx
git commit -m "feat: add ItemIcon component with image and letter-badge fallback"
```

---

## Task 5: Integrate Icons into UI Components

**Files:**
- Modify: `src/components/database/EntityCard.tsx` — add optional iconUrl prop, render ItemIcon
- Modify: `src/components/builder/GearSlotCard.tsx` — replace letter badge with ItemIcon
- Modify: `src/components/builder/WeaponSlotCard.tsx` — add ItemIcon
- Modify: database pages (gear, sets, weapons, talents, skills, exotics) — pass iconUrl to EntityCard

**Step 1: Update EntityCard to accept and render an icon**

Add `iconUrl?: string` and `iconFallback?: string` to EntityCardProps. Render `<ItemIcon>` before the title.

**Step 2: Update GearSlotCard to use ItemIcon**

Replace the letter badge `<div>` with `<ItemIcon iconUrl={iconUrl} fallbackLetter={SLOT_ICONS[slot]} size="md" />`.

**Step 3: Update WeaponSlotCard similarly**

**Step 4: Update database pages to pass iconUrl from data**

Each database page loads items from JSON data — pass the `iconUrl` field through to EntityCard.

**Step 5: Verify build**

Run: `npm run build`
Expected: No errors, icons render in UI

**Step 6: Commit**

```bash
git add src/components/ src/app/database/
git commit -m "feat: integrate item icons across builder and database UI"
```

---

## Task 6: Package into division2_assistant/div

**Files:**
- Create: `/home/lkeneston/projects/division2_assistant/div/` — full deployable copy of shd-planner

**Step 1: Create the div directory and copy project files**

Copy the following from `/home/lkeneston/projects/shd-planner/` to `/home/lkeneston/projects/division2_assistant/div/`:
- `src/` — all source code
- `public/` — static assets including icons
- `tests/` — test suite
- `docs/` — documentation (FORMULAS.md, GOOGLE-DRIVE-SETUP.md)
- `package.json`, `package-lock.json` — dependencies
- `tsconfig.json` — TypeScript config
- `next.config.ts` — Next.js config
- `postcss.config.mjs` — PostCSS config
- `vitest.config.ts` — test config
- `.env.example` — environment template
- `.gitignore` — git ignore rules
- `.python-version` — if present
- `eslint.config.mjs` — linting config

Do NOT copy:
- `node_modules/` — installed via `npm install`
- `.next/` — build output
- `.git/` — version history
- `CLAUDE.md` — AI instructions
- `.env` — secrets
- `.vercel/` — deployment cache

**Step 2: Verify the packaged project builds**

```bash
cd /home/lkeneston/projects/division2_assistant/div
npm install
npm run build
```

Expected: Clean build with no errors

**Step 3: Commit**

```bash
cd /home/lkeneston/projects/division2_assistant
git add div/
git commit -m "feat: package SHD Planner as deployable subdirectory"
```

---

## Task 7: Write Deployment Documentation

**Files:**
- Create: `/home/lkeneston/projects/division2_assistant/div/README.md`
- Create: `/home/lkeneston/projects/division2_assistant/div/docs/DEPLOYMENT.md`

**Step 1: Write README.md**

Cover:
- What the app is (Division 2 build planner companion app)
- Features list (build planner, database browser, stat calculator, sharing, AI advisor)
- Quick start (npm install, npm run dev)
- Project structure overview
- Links to detailed docs

**Step 2: Write DEPLOYMENT.md**

Cover:
- Prerequisites (Node.js 20+, npm 10+)
- Local development setup (clone, install, dev server)
- Production build (`npm run build && npm start`)
- Vercel deployment (one-click, env vars)
- Docker deployment (Dockerfile, compose)
- Self-hosted deployment (PM2, systemd, nginx reverse proxy)
- Environment variables reference (.env.example breakdown)
- Google Drive OAuth setup (link to existing doc)
- AI integration setup (BYOK, provider config)
- Data management:
  - How to refresh game data (run scrapers)
  - How to refresh icons (`npm run scrape:icons`)
  - How to validate data (`npm run data:validate`)
- Troubleshooting common issues

**Step 3: Write a Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Step 4: Update CHANGELOG.md**

Add entry for icon scraper and deployment packaging.

**Step 5: Commit**

```bash
git add div/README.md div/docs/DEPLOYMENT.md div/Dockerfile div/CHANGELOG.md
git commit -m "docs: add comprehensive deployment documentation and Dockerfile"
```

---

## Execution Order

Tasks 1-2 (scraper + merge) must run first. Task 3 (types) can run in parallel with 1-2. Task 4 (ItemIcon component) depends on Task 3. Task 5 (UI integration) depends on Tasks 2+4. Task 6 (packaging) depends on all prior tasks. Task 7 (docs) can partially run in parallel with Task 6.

```
Task 1 (scraper) ──→ Task 2 (merge) ──┐
Task 3 (types) ──→ Task 4 (component) ─┤──→ Task 5 (UI) ──→ Task 6 (package) ──→ Task 7 (docs)
```
