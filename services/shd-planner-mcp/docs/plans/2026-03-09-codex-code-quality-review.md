# Codex Code Quality Review - shd-planner-cwd

**Reviewer:** Codex (Code Quality / Performance / Maintainability)
**Date:** 2026-03-09
**Scope:** Full codebase review - server.py, tools/, tests/, data/, scrape_wiki.py, export_to_sheets.py
**Test suite status:** 122/122 passing (0.14s)

---

## Strengths

1. **Clean MCP server entry point.** `server.py` is minimal and well-structured. Tool registration is declarative with proper docstrings that serve as MCP tool descriptions. Each tool delegates immediately to a focused module function.

2. **Centralized data loading with caching.** `tools/data_loader.py` uses `@lru_cache(maxsize=20)` on `load_data()`, ensuring each JSON file is parsed exactly once per process lifetime. All data access is routed through this module.

3. **Strong data validation test suite.** `tests/test_data_validation.py` (75+ assertions) is comprehensive -- it validates schema structure, cross-references between files (named items against brand sets, synergy gear references against gear_sets), and enforces naming conventions. This is above average for a knowledge base project.

4. **Defensive query handling.** `search_data()` guards against empty/whitespace queries at line 30-31, preventing false-positive matches.

5. **Well-designed merge system in the scraper.** `scrape_wiki.py` has a clean `merge_data()` function with explicit `MANUAL_FIELDS_*` sets, preventing wiki scrapes from overwriting curated content like `meta_rating`, `tips`, and `synergies`.

6. **Rate limiting and error handling in scraper.** `WikiFetcher` implements monotonic time-based rate limiting and gracefully handles HTTP errors, API errors, and missing wikitext.

7. **Consistent JSON schema.** All 12 data files follow the `_metadata` convention with `game_version` and `last_updated`. Entry structures are consistent within each file.

8. **Google Sheets export uses batch formatting.** `export_to_sheets.py` uses `batch_updater` for formatting operations, minimizing API calls.

---

## Code Quality Issues

### Critical

**CQ-1: `lru_cache` returns mutable dicts -- callers can corrupt the cache** (Severity: Critical)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/data_loader.py:12`
- `load_data()` returns the raw `dict` from `json.load()`, cached by `@lru_cache`. Any caller that mutates the returned dict (e.g., `scraped_data["_metadata"] = existing_data["_metadata"]` in `scrape_wiki.py:1025`) permanently corrupts the cached copy for all subsequent callers in the same process.
- Currently the MCP server tools only read the data, so this is latent. But `lookup.py:13` does `{"source": source, **r}` which creates a new dict, and `build_analyzer.py` only reads. The risk is low today but will bite on the first mutation.
- **Fix:** Return `copy.deepcopy(json.load(f))` inside `load_data()`, or document the contract and add a `_load_data_uncached()` for write paths.

### High

**CQ-2: `suggest_build` coerces list `mode` field to string, matching by accident** (Severity: High)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/build_analyzer.py:92`
- `syn_mode = str(syn_data.get("mode", "all")).lower()` converts the list `["heroic", "legendary", "raid"]` to the string `"['heroic', 'legendary', 'raid']"`. The subsequent `mode_lower in syn_mode` check works only because Python substring matching finds `"legendary"` inside the stringified list representation.
- This will break if mode values contain commas, quotes, or brackets, or if someone adds a mode value like `"all"` as a list entry.
- **Fix:** Properly iterate the list:
  ```python
  syn_modes = syn_data.get("mode", ["all"])
  if isinstance(syn_modes, str):
      syn_modes = [syn_modes]
  mode_match = mode_lower in [m.lower() for m in syn_modes] or "all" in [m.lower() for m in syn_modes]
  ```

**CQ-3: Regex import inside function body on every call** (Severity: High -- performance)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/synergy_engine.py:13`
- `import re` is inside `_normalize_id()`, which is called in a nested loop (for every synergy component x every build component). While Python caches module imports, the lookup still adds overhead per call.
- **Fix:** Move `import re` to the module top level (line 1-3).

**CQ-4: `synergies.json` has redundant top-level fields outside `_metadata`** (Severity: Medium)
- File: `/home/lkeneston/projects/shd-planner-cwd/data/synergies.json:7-9`
- Top-level `"version"`, `"last_updated"`, and `"description"` duplicate information that belongs in `_metadata`. The `search_data` function in `data_loader.py` skips these because they're not dicts, but they're misleading metadata that could diverge from `_metadata`.
- Same issue in `modes.json:7-9`.

**CQ-5: No input validation on `analyze_build` gear list length** (Severity: Medium)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/build_analyzer.py:7-12`
- The function accepts any-length gear list without validation. A build with 0 gear or 10 gear pieces produces silent incorrect output (e.g., the suggestion at line 56 checks `len(set(gear)) > 4` which is meaningless for short lists). Weapon and skill lists are also unchecked.
- **Fix:** Validate `len(gear) == 6`, `len(weapons) <= 2`, `len(skills) <= 2` and return early with error dict if invalid.

### Medium

**CQ-6: `compare_items` uses `set(list(a.keys()) + list(b.keys()))` instead of set union** (Severity: Low -- style)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/stat_calculator.py:37`
- `set(list(item_a.keys()) + list(item_b.keys()))` creates an intermediate list. Idiomatic: `item_a.keys() | item_b.keys()` (Python 3.9+, and this project targets 3.12).

**CQ-7: `lookup_weapon` skips `_metadata` only implicitly** (Severity: Medium)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/lookup.py:22-23`
- `for class_key, class_data in data.items()` iterates all top-level keys including `_metadata`. The `isinstance(class_data, dict)` check lets `_metadata` through (it is a dict). If `_metadata` happens to contain a `class` key or an `archetypes` key in the future, it would be returned as a weapon result.
- Same pattern in `lookup_skill` at line 60-62.
- **Fix:** Add `if class_key.startswith("_"): continue` at the start of the loop.

**CQ-8: No type hints on `export_to_sheets.py` functions** (Severity: Low)
- File: `/home/lkeneston/projects/shd-planner-cwd/export_to_sheets.py`
- Functions like `create_gear_sets_tab`, `create_brand_sets_tab`, etc. lack return type annotations and parameter type hints. While this file is a standalone script, adding hints would improve IDE support and catch errors.

**CQ-9: Magic column letter computation breaks beyond 26 columns** (Severity: Low)
- File: `/home/lkeneston/projects/shd-planner-cwd/export_to_sheets.py:128`
- `last_col = chr(ord("A") + min(num_cols, 26) - 1)` caps at "Z". If a tab ever has more than 26 columns, the `min` silently truncates. Current max is 12 columns, so this is safe today.

**CQ-10: `_normalize_id` strips "s_" globally, causing false positive matches** (Severity: Medium)
- File: `/home/lkeneston/projects/shd-planner-cwd/tools/synergy_engine.py:20`
- `re.sub(r"s_", "_", normalized)` replaces *every* occurrence of `s_` in the string, not just possessive suffixes. For example, `"aces_and_eights"` becomes `"ace_and_eight"`, and `"tips_of_the_spear"` becomes `"tip_of_the_spear"`. This could cause incorrect matches between unrelated items that differ only by an `s_` in the middle.
- **Fix:** Be more targeted -- only strip trailing `s` before the first underscore: `re.sub(r"^(\w+?)s_", r"\1_", normalized)`.

---

## Performance Analysis

### Current Profile

The codebase is efficient for its use case. Key observations:

1. **JSON loading (cold start): ~0.14s for all 12 files** (measured by test suite). `@lru_cache` ensures this is a one-time cost. The total data set is small (estimated <500KB combined), so parse time is negligible.

2. **Search is linear O(n) per file.** `search_data()` iterates every entry in a file for each query. With ~15-50 entries per file and queries happening one at a time over MCP stdio, this is fine. No indexing needed.

3. **Synergy detection is O(S * C * B)** where S = synergy count (~15), C = components per synergy (~5), B = build components (~11). The nested loop with fuzzy matching and regex normalization runs ~800 iterations worst case. Fast enough.

4. **No async.** The MCP server is synchronous. `FastMCP` handles stdio messaging. Since all data is in-memory after first load, there's no I/O-bound bottleneck. Async would not help here.

### Optimization Opportunities (low priority)

- **Pre-compute normalized IDs.** `_normalize_id()` recompiles the same regex patterns on every call. Moving them to module-level `re.compile()` saves ~5us per call. Negligible but clean.
- **Pre-build search index.** If the data set grows 10x, building a reverse index (name -> entry) at load time would eliminate linear scans. Not needed now.
- **`suggest_build` iterates synergy list twice** (lines 89-113) in the fallback path. Could combine into one pass with separate buckets. Negligible impact with 15 entries.

### Export Script Performance

- `export_to_sheets.py` is I/O-bound on Google Sheets API. The 10-second sleep between tabs (line 785) and retry backoff (line 779) are appropriate for the 60 writes/min rate limit.
- The `apply_alternating_rows` function creates one formatting request per alternating row. For a 50-row tab, this is 25 batch items -- well within Sheets API limits.

---

## Data Quality & Ingestion

### Schema Gaps

1. **`synergies.json` has inconsistent `mode` field type vs. code expectations.** Data uses a list, code coerces to string (CQ-2 above). The schema should be documented as `list[str]` and the code should handle it correctly.

2. **`synergies.json` and `modes.json` have redundant top-level metadata fields** (`version`, `last_updated`, `description`) outside of `_metadata` (CQ-4 above). These should be consolidated into `_metadata` for consistency with the other 10 data files.

3. **Exotics `type` field uses "gear" and "armor" inconsistently.** The test at `test_data_validation.py:191` accepts both `"gear"` and `"armor"`, but semantically these might be the same thing. If they're distinct categories, the distinction should be documented; if not, one should be standardized.

4. **`weapons.json` archetypes lack a `type` field** linking them back to the weapon class. The relationship is only implied by nesting. If an archetype is returned in isolation (as `lookup_weapon` does at line 35), the weapon class context depends on the caller wrapping it.

5. **No validation that synergy `components`, `talents`, and `weapons` arrays reference real data entries.** `test_data_validation.py` cross-references gear set names in synergy components, but doesn't validate talent IDs (`obliterate`, `foxs_prayer`) or weapon types (`assault_rifle`) against `talents_gear.json` or `weapons.json`.

### Scraper Robustness

6. **No scraper tests.** `scrape_wiki.py` has 0 test coverage. The wikitext parsing functions (`strip_wikitext`, `parse_wikitext_table`, `parse_wikitext_sections`) are complex regex-heavy code that should have unit tests with sample wikitext inputs. Regressions here would silently corrupt the knowledge base.

7. **Scraper `_extract_talent_name` fallback is weak.** At line 924-926, if no colon/dash separator is found, it returns the first 3 words or first 30 chars. This often produces nonsensical talent names.

8. **No scraper validation step.** After scraping, there's no automatic comparison against the expected schema (e.g., "every gear set must have 2pc/3pc/4pc bonuses"). A post-scrape validation pass using the same logic as `test_data_validation.py` would catch corrupt data before it's written.

9. **Scraper does not use `WikiFetcher` as a context manager.** The `close()` method is called in a `finally` block, but making `WikiFetcher` a proper context manager (`__enter__`/`__exit__`) would be more Pythonic and prevent resource leaks if used elsewhere.

10. **No retry logic on transient HTTP errors.** `WikiFetcher.fetch_wikitext()` fails immediately on any HTTP error. A simple retry with exponential backoff for 429/503 errors would improve reliability.

### Export Quality

11. **`export_to_sheets.py` silently swallows exceptions during worksheet cleanup.** Lines 734-748 catch and discard `Exception` during worksheet deletion and renaming. If cleanup fails, the export continues in an unknown state.

12. **No export validation.** After creating all tabs, there's no verification that row counts match the source data. A simple `assert ws.row_count - 1 == len(rows)` per tab would catch partial writes.

---

## Recommendations (Prioritized by Impact)

### P0 - Fix Before Next Release

1. **Fix `suggest_build` mode matching** (CQ-2). This is functionally correct by accident but will break under minor data changes. Change the string coercion to proper list iteration.

2. **Add `_metadata` skip in `lookup_weapon` and `lookup_skill`** (CQ-7). A single `if key.startswith("_"): continue` line in each function prevents potential false matches.

3. **Move `import re` to module top level in `synergy_engine.py`** (CQ-3). Trivial fix, avoids repeated module lookup overhead in a hot path.

### P1 - Near-Term Improvements

4. **Add input validation to `analyze_build`** (CQ-5). Validate gear/weapon/skill counts and return meaningful error dicts for invalid inputs. This prevents silent incorrect analysis.

5. **Fix `_normalize_id` over-aggressive `s_` stripping** (CQ-10). Restrict the regex to only strip possessive-s at word boundaries.

6. **Add scraper unit tests.** Write tests for `strip_wikitext()`, `parse_wikitext_table()`, and `slugify()` with known wiki markup samples. These are the highest-risk untested functions.

7. **Consolidate redundant metadata in `synergies.json` and `modes.json`** (CQ-4). Move `version`, `last_updated`, `description` into `_metadata`.

### P2 - Quality of Life

8. **Document the `load_data()` immutability contract** (CQ-1). Either add a docstring warning "Do not mutate returned data" or return a frozen/deep-copied dict.

9. **Add cross-reference validation for synergy talent and weapon IDs** (item 5 above). Extend `test_data_validation.py` to validate that `talents` arrays in synergies reference real talent IDs.

10. **Make `WikiFetcher` a context manager** (item 9 above). Add `__enter__`/`__exit__` methods for cleaner resource management.

11. **Add type hints to `export_to_sheets.py`** (CQ-8). Low effort, improves maintainability.

12. **Pre-compile regex patterns in `synergy_engine.py`** at module level. Minor performance gain but improves code clarity.
