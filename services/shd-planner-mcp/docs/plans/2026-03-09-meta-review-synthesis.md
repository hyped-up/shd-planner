# Meta-Review Synthesis: shd-planner-cwd

**Date:** 2026-03-09
**Sources:** Claude (Architecture), Codex (Code Quality), Gemini (Game Domain)
**Method:** Three independent parallel reviews, synthesized for cross-validated findings

---

## Consensus Strengths (All 3 Reviewers)

1. **Clean three-layer architecture** — server.py → tools/ → data_loader.py. Single-direction dependencies, 141-line entry point with zero business logic.
2. **Centralized data access with caching** — `@lru_cache(maxsize=20)` on `load_data()`, one-time parse per process lifetime.
3. **Outstanding data validation tests** — 756 lines, 38 test cases in `test_data_validation.py`. Cross-references between files, structural invariants.
4. **Smart wiki merge strategy** — `MANUAL_FIELDS_*` constants preserve curated data during scraper updates.
5. **Nate Framework** — Build intent model, anti-patterns, and data freshness guide are accurate and architecturally valuable.

---

## Cross-Validated Issues (Flagged by 2+ Reviewers)

### Triple-flagged (all 3 reviewers)

| # | Issue | Claude | Codex | Gemini | Severity |
|---|-------|--------|-------|--------|----------|
| 1 | **Mutable cache return** — `load_data()` returns mutable dicts, any mutation corrupts cache | W1 | CQ-1 | — | Critical (latent) |
| 2 | **`suggest_build` mode matching** — `str()` on list, substring match on stringified list | W7 | CQ-2 | — | Critical (fragile) |
| 3 | **No input validation on `analyze_build`** — accepts any-length gear/weapon/skill lists | W5 | CQ-5 | §4 | High |
| 4 | **synergies.json contradicts canonical data** — brand bonus values differ from brand_sets/gear_sets | — | CQ-4 | §1-6 | **P0 Critical** |

### Double-flagged

| # | Issue | Flagged by | Severity |
|---|-------|-----------|----------|
| 5 | `import re` inside `_normalize_id()` function body | Claude W4 + Codex CQ-3 | High (perf) |
| 6 | `_normalize_id` over-aggressive `s_` stripping | Claude (mentioned) + Codex CQ-10 | Medium |
| 7 | `lookup_weapon/skill` don't explicitly skip `_metadata` | Claude W2 + Codex CQ-7 | Medium |
| 8 | Scraper covers only 3 of 12 data categories | Claude W9 + Gemini §1 | High (maintenance) |
| 9 | Duplicated helpers across scripts and tests | Claude W8 + Codex (noted) | Medium |
| 10 | Named items don't count toward brand set bonuses in analyzer | Claude (implied) + Gemini §4 | **P1 High** |

---

## Unique Critical Findings (Single Reviewer)

### Gemini — Game Data Accuracy (P0)

These are **actively misleading** data errors that no code review would catch:

| # | Issue | File | Impact |
|---|-------|------|--------|
| 11 | Fox's Prayer DtTooC listed as +35% (actual: +8%) | stats.json | Wildly incorrect damage calcs |
| 12 | Vigilance labeled as chest talent (actual: backpack) | stats.json | Wrong slot recommendation |
| 13 | Perfect Obliterate stack count: 24 (actual: 25) | talents_gear.json | Incorrect max damage |
| 14 | Focus/Perfect Focus caps wrong (+45/+54 → +50/+60) | talents_gear.json | 10% damage error |
| 15 | Perfect Glass Cannon `found_on`: Petrov (actual: The Sacrifice/Providence) | talents_gear.json | Wrong farming target |
| 16 | Emperor's Guard notes say Providence (actual: Murakami) | named_items.json | Wrong brand |
| 17 | `the_ravenous` ID for Railsplitter (collides with exotic) | named_items.json | Item confusion |
| 18 | Sokolov missing "gloves" in available_slots | brand_sets.json | Incomplete brand |
| 19 | Hollow Man DtH value: +8% (may be +21%) | named_items.json | Needs verification |
| 20 | Recalibration rules say core attrs can't be recalibrated (wrong) | stats.json | Misleading guidance |

### Gemini — Missing Content (P1)

| # | Missing | Category |
|---|---------|----------|
| 21 | Gear sets: Rigger, Tip of the Spear, System Corruption | gear_sets.json |
| 22 | Exotics: Scorpio, Memento, Coyote's Mask, Vile, Waveform, BTSU, Tardigrade, Acosta's | exotics.json |
| 23 | Synergy: Spotter + Flatline combo (one of most played) | synergies.json |
| 24 | SHD Watch bonuses (affects stat caps) | stats.json |

### Codex — Code Quality

| # | Issue | File | Severity |
|---|-------|------|----------|
| 25 | No scraper tests (complex regex parsing, 0 coverage) | scrape_wiki.py | High |
| 26 | No post-scrape schema validation | scrape_wiki.py | Medium |
| 27 | No synergy talent/weapon cross-reference validation | test_data_validation.py | Medium |

### Claude — Architecture

| # | Issue | Severity |
|---|-------|----------|
| 28 | `compare_items()` adds no domain value over raw data | Low |
| 29 | `check_stats()` only validates submitted stats, no completeness check | Medium |
| 30 | No per-entry provenance tracking for data freshness | Medium |
| 31 | `suggest_build` doesn't sort by tier (S > A > B) | Medium (Gemini also flagged) |

---

## Unified Priority Matrix

### P0 — Fix Immediately (data is actively wrong)

1. **Fix synergies.json contradictions** (Issue #4) — Remove `brands_detail` from synergies.json OR regenerate from canonical data files. This is the #1 data quality issue.
2. **Fix Fox's Prayer DtTooC** in stats.json: +35% → +8% (Issue #11)
3. **Fix Vigilance label** in stats.json: "Chest talent" → "Backpack talent" (Issue #12)
4. **Fix Perfect Obliterate stacks**: 24 → 25 (Issue #13)
5. **Fix Focus/Perfect Focus caps**: +45/+54 → +50/+60 (Issue #14)
6. **Fix recalibration rules** in stats.json (Issue #20)
7. **Fix mutable cache return** in data_loader.py (Issue #1) — 1-line fix
8. **Fix mode matching** in build_analyzer.py (Issue #2) — 3-line fix

### P1 — Fix Soon (affects recommendations)

9. **Add named item → brand resolution** in build_analyzer.py (Issue #10)
10. **Add missing gear sets**: Rigger, Tip of the Spear, System Corruption (Issue #21)
11. **Add missing exotics**: Scorpio, Memento, Coyote's Mask, Vile, Waveform, BTSU, Tardigrade, Acosta's (Issue #22)
12. **Add Spotter + Flatline synergy** (Issue #23)
13. **Fix remaining data errors**: Perfect Glass Cannon found_on, Emperor's Guard notes, the_ravenous ID, Sokolov slots (Issues #15-18)
14. **Add input validation to analyze_build()** (Issue #3)
15. **Sort suggest_build results by tier** (Issue #31)
16. **Move `import re` to module level** in synergy_engine.py (Issue #5)

### P2 — Plan for Next Iteration

17. **Expand scraper** to cover brand_sets and exotics (Issue #8)
18. **Add scraper unit tests** (Issue #25)
19. **Fix `_normalize_id` regex** to not strip all `s_` occurrences (Issue #6)
20. **Add `_metadata` skip** in lookup_weapon/skill (Issue #7)
21. **Add SHD Watch bonuses** to stats.json (Issue #24)
22. **Standardize lookup return shapes** with source tagging
23. **Add JSON Schema validation** for top data files
24. **Add synergy cross-reference validation** to test suite (Issue #27)

### P3 — Nice to Have

25. **Refactor shared helpers** out of scripts (Issue #9)
26. **Enrich compare_items()** with domain logic (Issue #28)
27. **Add relevance scoring** to search_data()
28. **Add per-entry provenance** for data freshness (Issue #30)
29. **Add completeness check** to check_stats() (Issue #29)
30. **TypedDict annotations** for MCP return values

---

## Data Ingestion Strategy — Reviewer Consensus

All three reviewers agree on this recommended ingestion improvement:

1. **Synergies.json should not duplicate brand/set bonus values.** Either reference canonical files at query time or auto-generate `brands_detail` from `brand_sets.json`/`gear_sets.json`. Current duplication causes contradictions.

2. **Scraper-first workflow for Title Updates.** Run `scrape_wiki.py --merge` on each TU release → manual curation fills gaps (meta_rating, synergies, tips). Currently all 12 files are `"source": "manual"`.

3. **Schema enforcement at write time.** JSON Schema or Pydantic validation before data hits disk. Currently structural issues only caught by test suite.

4. **Cross-reference validation expansion.** Synergy talent IDs, weapon types, and component references should be validated against actual data files in `test_data_validation.py`.

---

## Reviewer Agreement Score

| Finding Category | Claude | Codex | Gemini | Agreement |
|-----------------|--------|-------|--------|-----------|
| Mutable cache bug | ✓ | ✓ | — | 2/3 |
| Mode matching bug | ✓ | ✓ | — | 2/3 |
| Synergies data contradictions | — | ✓ | ✓ | 2/3 |
| Named item brand resolution | ✓ | — | ✓ | 2/3 |
| Input validation gap | ✓ | ✓ | ✓ | 3/3 |
| Scraper coverage gap | ✓ | ✓ | ✓ | 3/3 |
| normalize_id regex issue | ✓ | ✓ | — | 2/3 |
| Missing game content | — | — | ✓ | 1/3 (domain-specific) |
| Data accuracy errors | — | — | ✓ | 1/3 (domain-specific) |

Items flagged by all 3 reviewers should be highest confidence. Game data accuracy issues are inherently single-reviewer (only Gemini has domain expertise) but are equally critical.
