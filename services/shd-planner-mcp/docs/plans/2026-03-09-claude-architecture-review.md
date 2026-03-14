# Architecture Review: shd-planner-cwd

**Reviewer:** Claude (architecture reviewer)
**Date:** 2026-03-09
**Scope:** Full codebase — MCP server, tool modules, data layer, tests, scraper, exporter, nate_framework

---

## Strengths

### Clean module boundaries and layered architecture

The project follows a textbook three-layer architecture: MCP transport (`server.py`) -> tool logic (`tools/*.py`) -> data access (`tools/data_loader.py`). Each layer has a single responsibility and dependencies flow in one direction. The `server.py` file is 141 lines of pure delegation with no business logic — exactly what an entry point should be.

### Centralized data access through `data_loader.py`

All JSON access is funneled through `load_data()` and `search_data()`. No tool module reads files directly. This makes it trivial to swap the storage backend (e.g., SQLite, API) by changing one 50-line module. The `@lru_cache(maxsize=20)` on `load_data()` means each file is parsed exactly once per process lifetime, which is correct for a long-running MCP stdio server with static data.

### Comprehensive data validation test suite

`tests/test_data_validation.py` (756 lines, 38 test cases) is the standout test file. It cross-references named items against brand sets, validates structural invariants (every gear set has 2pc/3pc/4pc, every exotic has a type and unique_talent), and catches data quality regressions. This is more thorough than most projects at this stage.

### Well-designed merge strategy in the scraper

`scrape_wiki.py:merge_data()` (lines 369-393) correctly separates machine-scraped fields from manually-curated fields (`meta_rating`, `tips`, `synergies`). The `MANUAL_FIELDS_*` constants at module level make the boundary explicit. This prevents wiki scraping from destroying the hand-tuned knowledge that makes the data valuable.

### Nate framework as an architectural constraint layer

The `nate_framework/` directory is not code but it shapes the system's behavior through CLAUDE.md integration. `intent/build_intent.md` defines six intents that prevent the "Klarna trap" (technically optimal builds that fail in practice). `boundaries/data_freshness.md` maps staleness risk per data category. This is a sophisticated approach to encoding domain expertise as system-level guidance.

### Synergy engine fuzzy matching

`tools/synergy_engine.py:_fuzzy_match_components()` (lines 24-46) handles the real-world mismatch between user-facing IDs (`strikers_battlegear`) and synergy entry IDs (`striker_battlegear_4pc`). The normalization approach (strip possessive-s, strip piece-count suffixes, prefix matching) is pragmatic and correctly bidirectional.

### Empty query guard

`data_loader.py:search_data()` lines 29-31 guard against empty/whitespace queries, preventing the common bug where `"" in searchable` matches everything. Simple but important.

---

## Weaknesses

### W1: `lru_cache` on `load_data()` returns mutable dicts — callers can corrupt the cache

**File:** `tools/data_loader.py:12-18`

`load_data()` is `@lru_cache`-decorated and returns the parsed dict directly. Any caller that mutates the returned dict (e.g., `result["new_key"] = value`) modifies the cached object, corrupting all future reads. This is a latent bug — no current caller mutates the return value, but:

- `tools/synergy_engine.py:60` assigns `components_lower` from the return, but builds a new set so it is safe.
- `tools/build_analyzer.py:20-22` reads `gear_sets.get(gear_id)` which returns inner dicts that ARE cached references. If any downstream code mutated these, the cache would be poisoned.

The `scrape_wiki.py:merge_data()` function (line 389) does `merged[key] = {**merged[key], **scraped_item}` which creates new dicts, so it is safe. But this safety is accidental, not enforced.

**Recommendation:** Return `copy.deepcopy(json.load(f))` or use `@lru_cache` with a frozen/immutable wrapper. Alternatively, document the contract that returned data must not be mutated.

### W2: `lookup_gear()` changed from short-circuit to aggregation but `lookup_weapon()` and `lookup_skill()` use inconsistent patterns

**File:** `tools/lookup.py:6-14` vs `tools/lookup.py:17-41` vs `tools/lookup.py:55-73`

`lookup_gear()` aggregates across all four sources and tags results with `source`. `lookup_talent()` does the same. But `lookup_weapon()` (lines 17-41) manually iterates weapon class data with custom matching logic, and `lookup_skill()` (lines 55-73) has its own nested variant search. Neither tags results with a `source` key.

This inconsistency means:
- Weapon lookups do not benefit from `search_data()`'s standardized matching.
- Skill variant results have a different shape (`{"skill": ..., "variant": ...}`) than top-level skill results.
- No `source` tagging on weapon/skill results makes disambiguation harder for the MCP client.

### W3: `search_data()` uses substring matching with no ranking or relevance scoring

**File:** `tools/data_loader.py:27-50`

The search function checks `if query_lower in searchable` which means a query for "m" matches every entry containing the letter "m". There is no ranking: an exact name match ("Striker") is weighted the same as a partial match buried in an abbreviation. For an MCP server where the LLM constructs queries, this is tolerable — but for edge cases like `lookup_weapon("m4")`, the results could include unrelated entries.

### W4: `synergy_engine.py` imports `re` inside a function body on every call

**File:** `tools/synergy_engine.py:13`

`_normalize_id()` has `import re` at line 13 inside the function body. While Python caches module imports, this is unconventional and inconsistent with the rest of the codebase (all other modules import at the top level). It suggests the function was added incrementally without refactoring.

### W5: No input validation on `analyze_build()` parameters

**File:** `tools/build_analyzer.py:7-13`

`analyze_build()` accepts arbitrary dicts with no validation. If `gear` contains 5 or 7 items instead of 6, the function silently produces results. If `weapons` contains invalid IDs, no warning is raised. The MCP tool definition in `server.py:70-90` says "List of 6 gear piece IDs" and "List of 2 weapon names" but nothing enforces these constraints.

The nate_framework explicitly warns about common mistakes (over-capped CHC, wrong exotic), but the code does not implement these checks.

### W6: `compare_items()` is a trivial key-union with no domain logic

**File:** `tools/stat_calculator.py:35-47`

`compare_items()` does a generic key union and returns `{key: {item_a: ..., item_b: ...}}`. It has no Division 2 domain logic: it does not highlight which item is better per stat, does not flag stat cap interactions, does not compute an overall score. For an MCP tool, the LLM can do this comparison itself from raw data — the tool adds minimal value.

### W7: `suggest_build()` mode matching compares a string against what could be a list

**File:** `tools/build_analyzer.py:92`

`syn_mode = str(syn_data.get("mode", "all")).lower()` converts the mode field to a string. But in `synergies.json`, the `mode` field is a **list** (e.g., `["heroic", "legendary", "raid", "summit", "countdown"]`). Calling `str()` on a list produces `"['heroic', 'legendary', ...]"`, and then `mode_lower in syn_mode` does substring matching against the stringified list representation. This works by accident (e.g., `"legendary"` is a substring of the stringified list) but is fragile and would break for modes containing square brackets or commas.

### W8: Export script (`export_to_sheets.py`) has duplicated `load_json()` and `iter_entries()` helpers

**File:** `export_to_sheets.py:74-85`

Both `export_to_sheets.py` and `test_data_validation.py` define their own `load_json()` and `iter_entries()` functions that duplicate `tools/data_loader.py`. The export script cannot use `data_loader.py` because it is not packaged as an importable module outside the MCP server context (the `pyproject.toml` wheel only includes `tools/`). This is a packaging smell — the data loader should be usable by standalone scripts.

### W9: Scraper does not cover brand_sets, exotics, named_items, skills, or specializations

**File:** `scrape_wiki.py:40-50`

`WIKI_PAGES` only maps `gear_sets`, `weapons`, and `talents`. The CLAUDE.md `--category` docs say `gear_sets | weapons | talents | all`, confirming 9 of the 12 data categories have no automated scraping. For a project that emphasizes data freshness (nate_framework/boundaries/data_freshness.md), this is a significant gap — brand_sets and exotics change with every title update.

### W10: No type annotations on return values for MCP tool functions

**File:** `server.py:18-131`

All 8 MCP tool functions are annotated with `-> dict`, but the dict structure is undocumented. FastMCP can surface these type annotations to the client LLM. Using `TypedDict` or at minimum docstring-level schema documentation would help the LLM understand response shape without trial-and-error.

### W11: `check_stats()` only validates stats present in user input — no proactive completeness check

**File:** `tools/stat_calculator.py:6-32`

If a user submits `{"critical_hit_chance": 55}`, the function only validates CHC. It does not flag that CHD, weapon damage, and other critical stats are missing. For a build validation tool, a "completeness score" or "missing stats" field would be more useful.

---

## Data Ingestion Analysis

### Current Approach

The data pipeline has three ingestion paths:

1. **Manual curation** (primary): All 12 JSON files in `data/` are hand-maintained. The `_metadata.source` field reads `"manual"` across all files. Entries include curated fields like `tips`, `synergies`, `meta_rating`, `optimal_weapons`, and `playstyle` that do not exist on the wiki.

2. **Wiki scraper** (supplementary): `scrape_wiki.py` fetches wikitext via MediaWiki API for gear_sets, weapons, and talents. It parses wikitext tables, normalizes names via `slugify()`, and optionally merges with existing data preserving manual fields. Rate-limited at 1 request/second.

3. **Google Sheets export** (output only): `export_to_sheets.py` reads all 12 JSON files and writes a formatted multi-tab spreadsheet. This is a read-only export, not an ingestion path.

### Data Flow

```
Fandom Wiki --[scrape_wiki.py]--> data/*.json <--[manual edits]
                                       |
                                       v
                              data_loader.py (@lru_cache)
                                       |
                                       v
                     lookup.py / build_analyzer.py / synergy_engine.py
                                       |
                                       v
                                  server.py (MCP)
                                       |
                                       v
                              export_to_sheets.py (out)
```

### Gaps

1. **No schema enforcement at write time.** The `test_data_validation.py` tests catch structural issues at test time, but there is no JSON Schema or Pydantic model that validates data before it is written to disk. A manual edit that drops a `bonuses` key would only be caught by running the test suite.

2. **No incremental update tracking.** The `_metadata.last_updated` is a coarse date string. There is no per-entry provenance (which entries came from the wiki vs. manual, when each entry was last verified). This makes it hard to know which entries are stale after a title update.

3. **Synergies data is the weakest link.** `synergies.json` is 100% manually curated with no scraping support. It is also the most complex data structure (nested components, brands_detail, stat_targets, mode lists). It has the highest staleness risk per `data_freshness.md` but no automated refresh path.

4. **No deduplication across data files.** Exotics can appear in both `exotics.json` and `weapons.json` (via `lookup_weapon()` line 37-40). Named items reference brands by display name string, not by key — the cross-reference test in `test_data_validation.py:566-588` handles this via case-insensitive string matching, which is fragile.

### Improvement Recommendations

1. **Add JSON Schema files** alongside each `data/*.json` file (e.g., `data/schemas/gear_sets.schema.json`). Validate on write in `scrape_wiki.py:save_json()` and in a pre-commit hook. This catches structural regressions before they hit tests.

2. **Add per-entry provenance** with `_source` and `_last_verified` fields on each entry (not just `_metadata`). This enables targeted re-scraping of stale entries rather than full-category refreshes.

3. **Normalize cross-references to use keys, not display names.** Named items should reference brand sets by key (`"brand_key": "ceska_vyroba"`) rather than display name (`"brand": "Ceska Vyroba S.R.O."`). This eliminates the need for case-insensitive fuzzy matching in cross-reference validation.

---

## Recommendations

### Critical (fix soon)

1. **Fix mutable cache return in `data_loader.py`** (W1). Either `deepcopy` the return or document and enforce immutability. A single mutation from any caller (including future code) silently corrupts all subsequent queries. Cost: 1 line change.

2. **Fix list-to-string mode matching in `suggest_build()`** (W7). Replace `str(syn_data.get("mode", "all")).lower()` with proper list handling:
   ```python
   syn_modes = syn_data.get("mode", ["all"])
   if isinstance(syn_modes, str):
       syn_modes = [syn_modes]
   mode_match = mode_lower in [m.lower() for m in syn_modes] or "all" in [m.lower() for m in syn_modes]
   ```

### High (implement soon)

3. **Add input validation to `analyze_build()`** (W5). Validate gear list length (exactly 6), weapon list length (1-2), skill list length (0-2). Return structured error responses for invalid inputs rather than silently producing wrong results. This also enables the nate_framework anti-pattern checks (over-capped CHC warning, glass cannon without survival talent).

4. **Move `import re` to module level in `synergy_engine.py`** (W4). Trivial fix, improves readability and consistency.

5. **Expand scraper coverage** (W9). Add `brand_sets` and `exotics` categories to `scrape_wiki.py`. These are the most frequently updated data categories after talent balance changes. Named items and skills would follow as a second phase.

### Medium (plan for next iteration)

6. **Standardize lookup return shapes** (W2). All lookup functions should return `{"results": [...], "source": "..."}` with consistent result object shapes. Weapon and skill lookups should tag results with source and use `search_data()` where possible.

7. **Add JSON Schema validation** (Data Ingestion gap 1). Create schema files for the top 4 data files (gear_sets, brand_sets, exotics, named_items) and validate in `save_json()`. Use `jsonschema` library.

8. **Refactor shared helpers out of scripts** (W8). Move `load_json()` and `iter_entries()` from `export_to_sheets.py` and `test_data_validation.py` into `tools/data_loader.py` (they already exist there in slightly different form). Update `pyproject.toml` to make `tools/` importable by standalone scripts.

### Low (nice-to-have)

9. **Enrich `compare_items()` with domain logic** (W6). Add stat cap awareness, compute a weighted score difference, and flag items that push a build over cap. Currently the tool is generic enough that the LLM gains little from calling it.

10. **Add relevance scoring to `search_data()`** (W3). Score exact matches higher than substring matches. Return results sorted by relevance. This would improve lookup quality for ambiguous queries.

11. **Implement data freshness warnings** (nate_framework aspiration). The `data_freshness.md` describes automated staleness checks but they are not implemented in code. Add a `check_freshness()` function that compares `_metadata.game_version` against a configurable current version, and include freshness warnings in `analyze_build()` and `suggest_build()` responses.

12. **Add type annotations with `TypedDict`** (W10). Define response shapes as `TypedDict` classes for MCP tool return values. This improves both IDE support and LLM comprehension of the API surface.
