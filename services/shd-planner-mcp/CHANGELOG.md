# Changelog

## [0.3.0] - 2026-03-07

### Added

- Nate Jones AI methodology framework (`nate_framework/`) -- 10 new files across 5 directories:

| Directory | Files | Purpose |
|---|---|---|
| `intent/` | `build_intent.md`, `decision_priorities.md` | 6 build intents (Maximum Output, Consistency, Farmability, Fun Factor, Team Synergy, Versatility), ordered decision priorities for trade-off resolution |
| `anti_patterns/` | `when_not_to_trust.md`, `common_mistakes.md` | 9-category trust matrix, 5 scenario guardrails, 13 common build mistakes across 4 categories |
| `boundaries/` | `capability_map.md`, `data_freshness.md` | 3-tier capability boundary map (delegate/collaborate/own), 12-category data staleness risk table |
| `learning/` | `teach_mode.md`, `damage_formula_guide.md` | Answer vs teach mode toggle, 7-step Build Logic Chain, full 8-category damage formula with worked examples |
| `effectiveness/` | `build_tracker.md`, `feedback_loop.md` | Build tracking template with performance metrics, 4 feedback loops, outcome vs vanity metrics |

- Enhanced `skill/shd-planner-cwd.md` with 4 new sections: Build Intent, Teaching Mode, Data Freshness Awareness, Common Mistakes (items 8-11 in Response Guidelines)
- `CLAUDE.md` updated with Nate Framework Integration section documenting all 5 key principles

## [0.2.3] - 2026-03-07

### Added

- Quickstep named pistol (Tactical M1911) to `named_items.json` — event-limited item from Halloween 2025
- Sport Mode weapon talent to `talents_weapon.json` — +20% movement speed while unholstered, unique to Quickstep

## [0.2.2] - 2026-03-02

### Fixed

- `named_items.json` — Corrected 8 entries with wrong brands, slots, talents, or core attributes:
  - Chainkiller: Airaldi Holdings → Walker, Harris & Co.
  - Pristine Example: was keyed as `the_sacrifice` with Providence/Braced → Airaldi Holdings/Perfect Focus
  - Emperor's Guard: Providence Defense → Murakami Industries
  - Liquid Engineer: Gila Guard holster → Belstone Armory backpack with Perfect Bloodsucker
  - Chill Out: Česká Výroba chest → Gila Guard mask with +100% Scanner Pulse Haste
  - The Gift: Alps Summit Armament → Providence Defense
  - The Setup: Hana-U/Combined Arms → Uzina Getica/Perfectly Opportunistic
  - Firm Handshake: Murakami/+20% Status Duration/skill_tier → Sokolov/+15% Status Effects/weapon_damage
  - The Sacrifice: was keyed as `grupo_sombra_sacrifice` with Grupo Sombra → Providence Defense
- `brand_sets.json` — Removed non-existent Caballeria from Brazos de Arcabuz named items
- `brand_sets.json` — Fixed Battery Pack talent (was Perfect Kinetic Momentum, now Perfect Calculated)
- `brand_sets.json` — Fixed Percussive Maintenance talent (was Perfect Trauma, now Perfect Tech Support)
- `brand_sets.json` — Added 8 named items missing from brand named_items arrays (Hollow Man, Forge, Force Kicker, Punch Drunk, The Closer, Claws Out, Devil's Due, Wicked Vixen)
- `talents_gear.json` — Removed stray comments from creeping_death and overclock synergies
- `talents_gear.json` — Fixed unstoppable_force synergy: "Wicked chest" → "Wicked backpack"
- `talents_weapon.json` — Removed duplicate "sidearms" from finisher and salvage weapon_types
- `talents_weapon.json` — Removed "Holstered talent." suffix from zen description

### Added

- 13 missing named items to `named_items.json`: Deathgrips, Percussive Maintenance, Motherly Love, Everyday Carrier, Picaro's Holster, Hermano, Battery Pack, Pointman, Nightwatcher, Carpenter, Backbone, Closer, Matador
- Cross-reference validation tests in `test_data_validation.py`:
  - Brand named items exist in named_items.json (and vice versa)
  - No duplicate named items across brands
  - Weapon talent types use consistent names
  - Gear talent slots are valid (chest/backpack only)

## [0.2.1] - 2026-03-02

### Changed

- `scrape_wiki.py` — Migrated from direct HTML scraping to MediaWiki API (`/api.php`)
  - Replaces `TableParser`, `ContentParser`, `SectionParser` HTML classes with wikitext parsers
  - `WikiFetcher.fetch()` replaced by `WikiFetcher.fetch_wikitext()` using `action=parse&prop=wikitext`
  - Bypasses Fandom's Cloudflare bot protection (API returns 200 OK vs 403 for HTML pages)
  - New module-level functions: `strip_wikitext()`, `parse_wikitext_table()`, `parse_all_wikitext_tables()`, `parse_wikitext_sections()`
  - CLI interface, merge logic, output schemas, and rate limiting unchanged

### Fixed

- `export_to_sheets.py` — `_metadata` rows no longer exported as data (affected 7 of 10 tabs)
- `export_to_sheets.py` — Gear Sets and Weapons tabs: split IMAGE() formula column from data columns to prevent `+`-prefixed bonus text (e.g., "+15% Weapon Handling") from being misinterpreted as formulas (#ERROR!)
- Gear Talents tab: fixed `meta_notes` → `notes` field reference, added `meta_rating` color coding
- Weapon Talents tab: removed phantom `named_item` column (field doesn't exist in JSON)
- Weapons tab: fixed icon key mismatch for Submachine Guns and Light Machine Guns

### Added

- Weapons tab: Named Variant and Exotic Variant columns
- Gear Talents tab: Meta Rating (color-coded), PvP Modifier, and Found On columns
- Weapon Talents tab: Found On column (which named item has the perfect version)
- Skills tab: Duration (T0/T6) and Mods columns
- Specializations tab: Signature Weapon Description and Bonus Skill Tier columns
- Stats tab: Core Attributes, Minor Attributes (22 entries with max rolls), and Damage Types sections
- Text wrapping on all data cells across all tabs
- Brand Sets tab: named items now show slot and talent detail
- `iter_entries()` helper in export script to filter `_metadata` from all data iteration

### Removed

- `html.parser` dependency from `scrape_wiki.py` (no longer needed)

## [0.2.0] - 2026-03-01

### Added

- `_metadata` object to all 12 JSON data files with `game_version`, `last_updated`, and `source` fields
- `get_data_version(filename)` function in `data_loader.py` to retrieve metadata from any data file
- `scrape_wiki.py` — Fandom wiki scraper that pulls Division 2 data into JSON matching existing `data/` schema
  - Supports `--category gear_sets|weapons|talents|all` selection
  - `--dry-run` mode shows what would be fetched without writing files
  - `--merge` mode merges scraped data with existing JSON, preserving manually curated fields (tips, meta_rating, synergies, etc.)
  - Rate limiting (1 request/second minimum) to be respectful to the wiki
  - Uses httpx + stdlib html.parser only (no new dependencies)
- `tests/test_data_validation.py` — 83 validation tests covering structural integrity, cross-references, and metadata presence across all 12 JSON files
- Patch note tracking workflow (`patch_notes/README.md`) with step-by-step checklist for applying game updates
- Update history tracker (`patch_notes/update_history.json`) for logging applied patches

### Changed

- `search_data()` now skips the `_metadata` key when iterating entries, preventing it from appearing in search results

### Fixed

- Named items referencing "Alps Summit Armaments" (plural) corrected to "Alps Summit Armament" to match `brand_sets.json`

## [0.1.0] - 2026-03-01

### Added

- MCP server with 8 queryable tools (gear lookup, weapon lookup, talent lookup, skill lookup, build analyzer, build suggester, stat checker, item comparator)
- Comprehensive JSON knowledge base (12 files):
  - 22 gear sets, 33 brand sets, 49 exotics, 44 named items
  - 46 gear talents, 59 weapon talents
  - 7 weapon classes with 45 archetypes
  - 12 skill types with 42 variants, 6 specializations
  - Stat caps, damage formulas, synergies, game modes
- Data loader with LRU caching and fuzzy search
- Synergy detection engine with component matching and scoring
- Build analyzer with gear set bonus detection and optimization suggestions
- Stat calculator with cap validation and item comparison
- Claude Code skill for auto-activation on Division 2 queries
- Standalone agentic pattern with embedded reference tables (works without MCP)
- 23 passing tests across all modules
- Design document and implementation plan
