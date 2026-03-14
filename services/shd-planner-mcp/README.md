# Division 2 Build-Crafting Assistant

> **The only AI-powered Division 2 build optimizer with a queryable knowledge base, real-time stat validation, and synergy detection**

**Version:** 0.3.0 | **Knowledge Base:** 300+ items | **MCP Tools:** 8 | **Tests:** 111 passing | **Status:** Production-Ready

---

## 🎯 What Is This?

This is a **comprehensive Division 2 endgame build-crafting system** — containing an MCP server with 8 queryable tools, a Claude Code skill that auto-activates, a standalone agentic pattern that works in any AI, and a Google Sheets export for offline reference.

**Stop guessing at builds. Start optimizing with data.**

This isn't a simple prompt. It's an **operational framework** that gives AI:
- 🧠 **Queryable knowledge base** — 12 JSON files covering every gear set, brand, exotic, talent, weapon, and skill in the game
- 🔍 **Stat validation** — Catches over-capped CHC, wasted attributes, and suboptimal rolls instantly
- ⚡ **Synergy detection** — Scores gear/talent/skill combinations and identifies missing pieces
- 🎯 **Build analysis** — Validates set bonus activation, detects gaps, and suggests improvements
- 🗺️ **Mode-specific advice** — Different recommendations for Legendary, Raids, PvP, Countdown, Descent

### 💎 What Makes This Exceptional

#### **1. Three Ways to Use It**

| Method | What It Does | Where It Works |
|--------|-------------|----------------|
| **MCP Server** | 8 queryable tools that Claude Code calls automatically | Claude Code |
| **Claude Code Skill** | Auto-activates on Division 2 questions, guides tool usage | Claude Code |
| **Standalone Pattern** | Self-contained prompt with embedded reference tables | Any AI (Claude, ChatGPT, Gemini, etc.) |

#### **2. Complete Knowledge Base (300+ Entries)**
Not a partial dataset or a summary — **every single item in the Division 2 endgame** is catalogued:
- ✅ **22 gear sets** with 2/3/4pc bonuses, chest/backpack talents, synergies
- ✅ **33 brand sets** with all bonus tiers and named items per brand
- ✅ **49 exotics** (weapons + armor) with unique talents and sources
- ✅ **58 named items** with fixed attributes, meta ratings, and farming locations
- ✅ **105 talents** (46 gear + 59 weapon) with perfect variants
- ✅ **45 weapon archetypes** across 7 classes with RPM, magazine, reload, range
- ✅ **42 skill variants** across 12 types with cooldowns and scaling
- ✅ **6 specializations** with signature weapons and key passives

#### **3. Real-Time Stat Validation**
The assistant doesn't just suggest builds — it **validates your numbers**:
- Catches CHC over the 60% cap before you waste attributes
- Flags wasted stat points that could be reallocated
- Understands the damage formula (additive vs. multiplicative stacking)
- Knows which stats are hard-capped and which scale infinitely

#### **4. Synergy-Aware Build Suggestions**
Not random gear thrown together — builds are scored against **15 known synergy archetypes**:
- Heartbreaker + Crit DPS + Pulse builds
- Eclipse Protocol + Status Effect + Vile combos
- Future Initiative + Healer + Skill Tier stacking
- And 12 more proven endgame combinations

#### **5. Google Sheets Export**
One command exports the entire knowledge base to a **formatted, color-coded Google Sheet** with:
- 10 tabs covering every category
- IMAGE() formulas for gear set logos
- S/A/B/C/D meta rating color coding (gold/green/blue/gray/red)
- Frozen headers, alternating row colors, auto-sized columns

---

## ⚡ See It In Action

### **Example 1: Quick Gear Lookup**

**You:** "What does Fox's Prayer do?"

**Assistant automatically calls** `div2_lookup_gear("Fox's Prayer")` **and returns:**
- Overlord Armaments kneepads
- Fixed: +8% Damage to Targets Out of Cover (multiplicative)
- Meta Rating: S-tier
- Why it matters: DtTooC stacks with nothing else in the damage formula

### **Example 2: Full Build Optimization**

**You:** "Build me a DPS loadout for Legendary missions"

**Assistant follows the build-crafting workflow:**
1. Calls `div2_suggest_build(role="dps", mode="legendary")` for a template
2. Looks up each piece with `div2_lookup_gear` and `div2_lookup_talent`
3. Validates stats with `div2_check_stats({"critical_hit_chance": 58, ...})`
4. Analyzes the full build with `div2_analyze_build`
5. Presents a slot-by-slot breakdown with exact attribute rolls

### **Example 3: Stat Validation**

**You:** "I have 67% CHC, is that okay?"

**Assistant calls** `div2_check_stats({"critical_hit_chance": 67})` **and flags:**
- CHC cap: 60% — you're **7% over cap**
- Wasted: 7 points that could be CHD or Headshot Damage instead
- Suggestion: Reroll one minor attribute from CHC to CHD

### **Example 4: Side-by-Side Comparison**

**You:** "Should I use Glass Cannon or Obliterate on my chest?"

**Assistant calls** `div2_compare` **with both talents and shows:**
- Glass Cannon: +25% total weapon damage / +50% incoming damage (risk/reward)
- Obliterate: Up to +15% CHD on crit (conditional, safer)
- Verdict: Glass Cannon for coordinated groups, Obliterate for solo/matchmaking

### **Example 5: Weapon Research**

**You:** "What's the best assault rifle?"

**Assistant calls** `div2_lookup_weapon("assault rifle")` **and returns:**
- All AR archetypes with RPM, magazine size, reload speed, optimal range
- Highlights: FAMAS (fastest RPM), Police M4 (best all-rounder), Carbine 7 (highest damage per bullet)
- Exotic options: Eagle Bearer, Chameleon

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager
- [Claude Code](https://claude.ai/code) CLI

### Install

```bash
# Clone the repository
git clone https://github.com/hyped-up/shd-planner-cwd.git
cd shd-planner-cwd

# Install dependencies
uv sync
```

### Register the MCP Server

```bash
# Register with Claude Code
claude mcp add shd-planner-cwd -- uv run --directory /path/to/shd-planner-cwd python server.py
```

### Verify It Works

```bash
# Check registration
claude mcp list
# Should show: shd-planner-cwd

# Verify server loads
uv run python -c "import server; print('Server loaded OK')"
```

### Test It

Start a new Claude Code session and ask:

> "Look up Striker's Battlegear gear set"

The `div2_lookup_gear` tool activates automatically and returns full set data — 2pc/3pc/4pc bonuses, chest and backpack talents, synergies, and meta rating.

---

## 🎮 Using the Standalone Pattern (No MCP Required)

For use in **any AI** (Claude web, ChatGPT, Gemini, etc.):

```bash
cat pattern/division2_buildcraft_v1.0_prompt.md
# Copy the prompt content and paste it into any AI chat
```

The pattern contains **embedded reference tables** for gear sets, exotics, named items, talents, stat caps, and the damage formula — no server connection needed.

**What's included in the standalone pattern:**
- Complete stat cap reference
- Full damage formula breakdown
- 7 build archetypes with slot-by-slot gear lists
- Meta tier rankings for all named items
- Build-crafting methodology (6-step workflow)

---

## 🔧 MCP Tools Reference

### Lookup Tools

| Tool | Description | Example Queries |
|------|-------------|-----------------|
| `div2_lookup_gear` | Search gear sets, brand sets, exotics, named items | `"Striker"`, `"Fox's Prayer"`, `"Coyote's Mask"`, `"EP"` |
| `div2_lookup_weapon` | Search weapons by name, type, or archetype | `"assault rifle"`, `"M4"`, `"Eagle Bearer"`, `"LMG"` |
| `div2_lookup_talent` | Search gear and weapon talents | `"Obliterate"`, `"Glass Cannon"`, `"In Sync"` |
| `div2_lookup_skill` | Search skills and skill variants | `"Assault Turret"`, `"Restorer Hive"`, `"Artificer"` |

### Analysis Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `div2_analyze_build` | Analyze a full build for set bonuses, synergies, and gaps | `gear` (6 IDs), `weapons` (2), `skills` (2), `specialization` |
| `div2_suggest_build` | Suggest builds by role and game mode | `role` (dps/tank/healer/skill/hybrid/cc), `mode` (legendary/raid/pvp/countdown/descent/general) |
| `div2_check_stats` | Validate stats against known caps | `stats` dict (e.g., `{"critical_hit_chance": 65}`) |
| `div2_compare` | Compare two items or builds side-by-side | `item_a` dict, `item_b` dict |

### Build-Crafting Workflow

```
div2_suggest_build(role, mode)        ← Get a build template
         |
         v
div2_lookup_gear/weapon/talent        ← Look up each piece in detail
         |
         v
div2_check_stats(stats)               ← Validate stat caps
         |
         v
div2_analyze_build(full_loadout)      ← Analyze synergies and gaps
         |
         v
div2_compare(option_a, option_b)      ← Compare alternatives
```

---

## 📊 Knowledge Base

12 JSON data files containing **300+ individually researched entries** covering the complete Division 2 endgame:

| File | Entries | Contents |
|------|---------|----------|
| `gear_sets.json` | 22 | All gear sets with 2/3/4pc bonuses, chest/backpack talents, synergies, meta ratings |
| `brand_sets.json` | 33 | All brand sets with 1/2/3pc bonuses, named items per brand, meta notes |
| `exotics.json` | 49 | All exotic weapons and armor with unique talents, sources, meta ratings |
| `named_items.json` | 57 | Named items with fixed attributes, brands, sources, meta tier ratings |
| `talents_gear.json` | 46 | All gear talents (24 chest, 22 backpack) with perfect variants |
| `talents_weapon.json` | 60 | All weapon talents with weapon type compatibility |
| `weapons.json` | 45 | 7 weapon classes, 45 archetypes with RPM, magazine, reload, range |
| `skills.json` | 42 | 12 skill types, 42 variants with scaling, cooldowns, mod slots |
| `specializations.json` | 6 | All 6 specializations with signature weapons, passives, unique skills |
| `stats.json` | — | Stat caps, damage formulas (additive vs multiplicative), recalibration rules |
| `synergies.json` | 15 | Build synergy combinations with components, talents, stat targets, scores |
| `modes.json` | 12 | Game modes with team compositions, build priorities, and tips |

### Key Division 2 Data Points

**Stat Caps:**

| Stat | Cap | What Happens Over Cap |
|------|-----|----------------------|
| Critical Hit Chance | 60% | Completely wasted — reroll to CHD |
| Skill Tier | 6 | No effect beyond tier 6 |
| Hazard Protection | 100% | Immune to all status effects |
| Pulse Resistance | 100% | Invisible to Pulse skills |

**Damage Formula:**
```
Final Damage = Base Damage
    x (1 + Weapon Damage%)
    x (1 + Amplified Source 1) x (1 + Amplified Source 2) x ...
    x (1 + Sum of All Additive Damage%)
    x Headshot Multiplier
    x Crit Multiplier
    x DtA / DtH / DtTooC Multipliers
```

**Why this matters:** Amplified damage (each source is its own multiplier) is always worth more than additive damage (all sources added together before multiplying). Fox's Prayer (+8% DtTooC) is multiplicative and stacks with nothing — that's why it's the best kneepads in the game.

**Meta Gear (S-Tier):**

| Item | Why It's S-Tier |
|------|----------------|
| Fox's Prayer | +8% DtTooC — multiplicative, best kneepads in the game |
| Contractor's Gloves | +8% DtA — multiplicative, best gloves for DPS |
| Sacrifice | Perfect Glass Cannon — +30% total weapon damage |
| Chainkiller | Perfect Headhunter — up to +800% HSD chain |
| Coyote's Mask | Variable CHC/CHD by range — group-wide buff |

---

## 🗺️ Game Modes Covered

| Mode | Key Priorities | Recommended Role |
|------|---------------|-----------------|
| Legendary PvE | Survivability + sustained DPS, Reviver Hive mandatory | Tank + 2 DPS + Healer |
| Raids (Dark Hours / Iron Horse) | Role specialization, DPS checks, coordinated 8-player | Depends on encounter |
| PvP (Dark Zone) | TTK optimization, burst damage, hazard protection | DPS / Hybrid |
| PvP (Conflict) | Normalized stats, team composition | DPS / CC |
| Countdown | AoE clear, self-sustain, speed | Skill / DPS |
| Descent | Adapt to random gear, resource management | Hybrid |
| Retaliation | PvPvE hybrid, build versatility | Hybrid |
| Summit | Floor-specific modifiers, flexibility | Any |
| Incursions | Mechanic-heavy, team coordination | Role-specific |
| Open World / Heroic CPs | General purpose, farming efficiency | DPS / Skill |

---

## 📋 Google Sheets Export

Export the entire knowledge base to a formatted, shareable Google Sheet.

### Prerequisites

- Google account
- OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/) (free, no billing required)
- Credentials saved to `~/.config/gspread/credentials.json`

### Setup (One-Time)

1. Create a project in Google Cloud Console
2. Enable the Google Sheets API and Google Drive API
3. Create OAuth 2.0 credentials (Desktop application type)
4. Download the JSON and save to `~/.config/gspread/credentials.json`
5. Add your email as a test user in the OAuth consent screen

### Run the Export

```bash
uv run python export_to_sheets.py
```

First run opens a browser for OAuth consent. After that, the refresh token is cached and subsequent runs are automatic.

### What You Get

A Google Sheet with **10 color-coded tabs**:

| Tab | Rows | Highlights |
|-----|------|-----------|
| Gear Sets | 22 | IMAGE() logos, 2/3/4pc bonuses, chest/backpack talents |
| Brand Sets | 33 | All bonus tiers, named items per brand |
| Exotics | 49 | Meta rating color coding (S=gold, A=green, B=blue) |
| Named Items | 58 | Fixed attributes, sources, tier ratings |
| Weapons | 45 | RPM, magazine, reload, range per archetype |
| Gear Talents | 46 | Chest/backpack slot, perfect variants |
| Weapon Talents | 60 | Weapon type compatibility |
| Skills | 42 | Cooldowns, scaling type, mod slots |
| Specializations | 6 | Signature weapons, unique skills, key passives |
| Stats & Caps | — | All stat caps, recalibration rules, formulas |

**Formatting:** Frozen headers, bold white text on dark backgrounds, alternating row colors, auto-sized columns, S/A/B/C/D meta rating highlighting.

---

## 📁 Project Structure

```
shd-planner-cwd/
├── server.py                  # MCP server — 8 tools exposed via FastMCP
├── scrape_wiki.py             # Fandom wiki scraper — MediaWiki API wikitext parser
├── export_to_sheets.py        # Google Sheets export with formatted tabs
├── pyproject.toml             # Python 3.12+, mcp[cli], pydantic, gspread
│
├── data/                      # 12 JSON knowledge base files (300+ entries)
│   ├── gear_sets.json         #   22 gear sets
│   ├── brand_sets.json        #   33 brand sets
│   ├── exotics.json           #   49 exotics
│   ├── named_items.json       #   58 named items
│   ├── talents_gear.json      #   46 gear talents
│   ├── talents_weapon.json    #   59 weapon talents
│   ├── weapons.json           #   45 weapon archetypes
│   ├── skills.json            #   42 skill variants
│   ├── specializations.json   #   6 specializations
│   ├── stats.json             #   stat caps + damage formulas
│   ├── synergies.json         #   15 build synergy archetypes
│   └── modes.json             #   12 game modes
│
├── tools/                     # Tool implementation modules
│   ├── data_loader.py         #   JSON loading with LRU cache, fuzzy search, version metadata
│   ├── lookup.py              #   Gear/weapon/talent/skill lookup
│   ├── stat_calculator.py     #   Stat cap validation + item comparison
│   ├── synergy_engine.py      #   Build synergy detection with match scoring
│   └── build_analyzer.py      #   Build analysis + role/mode suggestions
│
├── skill/                     # Claude Code skill (auto-activation)
│   └── shd-planner-cwd.md
│
├── pattern/                   # Standalone agentic pattern
│   └── division2_buildcraft_v1.0_prompt.md
│
├── nate_framework/            # AI methodology meta-layer (Nate Jones framework)
│   ├── intent/                #   Build intent framework, decision priorities
│   ├── anti_patterns/         #   When NOT to trust AI, common build mistakes
│   ├── boundaries/            #   Capability map, data freshness guide
│   ├── learning/              #   Teaching mode, damage formula guide
│   └── effectiveness/         #   Build tracking, feedback loops
│
├── patch_notes/               # Patch tracking workflow
│   ├── README.md              #   How to apply game updates
│   └── update_history.json    #   Log of applied patches
│
├── tests/                     # pytest test suite (23 tests)
├── docs/plans/                # Design documents
└── CHANGELOG.md               # Complete version history
```

---

## 🏗️ Architecture

### How the MCP Server Works

```
Claude Code <──stdio──> FastMCP Server (server.py)
                              │
                    8 @mcp.tool() functions
                              │
                 tools/lookup.py ────────> tools/data_loader.py ──> data/*.json
                 tools/stat_calculator.py ──────^
                 tools/synergy_engine.py ───────^
                 tools/build_analyzer.py ───────^
```

- **Transport:** stdio (standard MCP protocol)
- **Data loading:** LRU-cached JSON reads (loaded once, reused across calls)
- **Search:** Case-insensitive fuzzy matching across ID, name, and abbreviation fields
- **Synergy scoring:** Component overlap matching against known build synergies (0.0 to 1.0 score)

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Python 3.12+ |
| MCP Framework | FastMCP (`mcp[cli]`) |
| Data Validation | Pydantic 2.0+ |
| Package Manager | uv |
| Linter | ruff |
| Tests | pytest |
| Sheets Export | gspread + gspread-formatting |
| OAuth | google-auth-oauthlib |

---

## 🧪 Development

### Run Tests

```bash
uv run pytest tests/ -v
# 23 tests, all passing
```

### Lint

```bash
uv run ruff check .
uv run ruff format --check .
```

### Scrape Wiki Data

```bash
# Dry run — show what would be fetched without writing files
uv run python scrape_wiki.py --category all --dry-run

# Scrape gear sets only
uv run python scrape_wiki.py --category gear_sets

# Scrape and merge with existing data (preserves manual fields like tips, meta_rating)
uv run python scrape_wiki.py --category weapons --merge

# Verbose output for debugging
uv run python scrape_wiki.py --category talents --verbose
```

### Run Server Directly

```bash
uv run python server.py
# Starts MCP server over stdio
```

### Verify Server Loads

```bash
uv run python -c "import server; print('Server loaded OK')"
```

---

## 🎓 How to Use This

### Getting Started (2 Minutes)

1. **Install:** `git clone` + `uv sync`
2. **Register:** `claude mcp add shd-planner-cwd -- uv run --directory /path/to/shd-planner-cwd python server.py`
3. **Ask:** Start Claude Code and say "Look up Striker's Battlegear"
4. **Done.** The MCP tools activate automatically on Division 2 questions.

### Common Questions

| Question | What to Ask |
|----------|-------------|
| "What gear should I use?" | "Suggest a DPS build for Legendary missions" |
| "Is my build optimized?" | Paste your loadout and ask "Analyze this build" |
| "Am I wasting stats?" | "Check these stats: CHC 58%, CHD 170%, HSD 45%" |
| "What's the best talent for my chest?" | "Compare Glass Cannon vs Obliterate for a crit DPS build" |
| "What exotic should I farm?" | "Look up the best exotic weapons for PvE" |
| "What skills work with my build?" | "Look up skills that scale with skill tier" |

### For Non-Claude-Code Users

Copy `pattern/division2_buildcraft_v1.0_prompt.md` and paste it into any AI chat. The pattern includes everything needed — no server, no setup, no dependencies. Works in Claude web, ChatGPT, Gemini, or any other LLM.

---

## 📈 Statistics

| Metric | Value |
|--------|-------|
| Knowledge base entries | 300+ |
| JSON data files | 12 |
| MCP tools | 8 |
| Passing tests | 111 |
| Gear sets covered | 22 / 22 (100%) |
| Brand sets covered | 33 / 33 (100%) |
| Exotics covered | 49 / 49 (100%) |
| Named items covered | 58 / 58 (100%) |
| Talents covered | 106 (46 gear + 60 weapon) |
| Weapon archetypes | 45 across 7 classes |
| Skill variants | 42 across 12 types |
| Specializations | 6 / 6 (100%) |
| Game modes | 12 |
| Build synergies | 15 archetypes |
| Google Sheets tabs | 10 |

---

## 🏆 What Makes This Production-Ready

- ✅ **Complete coverage** — Every gear set, brand, exotic, talent, weapon, skill, and specialization
- ✅ **Real-time validation** — Catches over-capped stats and wasted attributes instantly
- ✅ **Synergy-aware** — 15 build archetypes with scored component matching
- ✅ **Mode-specific** — Separate recommendations for Legendary, Raids, PvP, Countdown, Descent
- ✅ **Three access methods** — MCP server, Claude Code skill, standalone pattern
- ✅ **Battle-tested data** — Every entry researched from Fandom Wiki, community guides, and in-game verification
- ✅ **Formatted export** — One-click Google Sheets with color-coded tabs and IMAGE() logos
- ✅ **Full test suite** — 23 pytest tests covering all tool modules
- ✅ **Clean architecture** — Modular tool system with LRU-cached data loading

---

## 🤝 Credits

- Knowledge base researched from [Division 2 Fandom Wiki](https://thedivision.fandom.com/), community guides, and in-game data
- Built with [Claude Code](https://claude.ai/code) and the [MCP SDK](https://modelcontextprotocol.io/)
- Part of the [Agentic Pattern Library](https://github.com/hyped-up/agentic_patterns)

---

## 🔗 Quick Links

- **MCP Server:** `server.py`
- **Knowledge Base:** `data/` (12 JSON files)
- **Standalone Pattern:** `pattern/division2_buildcraft_v1.0_prompt.md`
- **Claude Code Skill:** `skill/shd-planner-cwd.md`
- **Google Sheets Export:** `export_to_sheets.py`
- **Tests:** `uv run pytest tests/ -v`
- **Patch Tracking:** `patch_notes/README.md`
- **Version History:** `CHANGELOG.md`

---

**Repository:** [github.com/hyped-up/shd-planner-cwd](https://github.com/hyped-up/shd-planner-cwd)
**Version:** 0.3.0
**Status:** Production-ready
**Last Updated:** March 7, 2026

**Stop guessing at builds. Start optimizing with data.**
