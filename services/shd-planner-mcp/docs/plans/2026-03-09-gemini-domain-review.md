# Gemini Domain Expert Review -- Game Data Accuracy & UX

**Date:** 2026-03-09
**Reviewer role:** Division 2 domain expert (game mechanics, meta, data accuracy)
**Scope:** All 12 data JSON files, 5 tool modules, server.py, nate_framework/

---

## Strengths

### Comprehensive Knowledge Base
The 12-file JSON knowledge base is remarkably thorough for a manually curated dataset. Coverage includes all 16 gear sets (including the newer Hotshot set), 30 brand sets, 40+ exotics, 50+ named items, 7 weapon classes with archetypes, 60+ gear/weapon talents, 10 skill families with all variants (including the newer Smart Cover from Battle for Brooklyn), 6 specializations, and 12 synergy archetypes. This is significantly more complete than most community-built databases.

### Damage Formula Documentation
The `stats.json` damage formula section and the `nate_framework/learning/damage_formula_guide.md` correctly distinguish additive vs. multiplicative damage categories. The practical teaching table (showing Fox's Prayer as Category H, Contractor's Gloves as Category F, Obliterate as Category C) is accurate and would genuinely help players understand why spreading bonuses across categories beats stacking a single category.

### Build Intent Framework
The Nate Framework's six build intents (Maximum Output, Consistency, Farmability, Fun Factor, Team Synergy, Versatility) and the "Klarna Trap" concept are excellent. The observation that a Glass Cannon build with zero survivability produces zero real DPS when the player is dead is precisely the kind of domain insight that separates useful recommendations from purely theoretical ones.

### Gear Set Talent Accuracy
Gear set 4-piece talents, chest talents, and backpack talents are accurately documented across all sets. Striker's Gamble (0.65% per stack, 100 max, decay rates), Heartbreaker's Heartstopper (headshot pulse, +1% armor/damage per stack, 50 max), Negotiator's Hostile Negotiations (60% splash, 3 marks, +2% CHD on mark kills) -- all match in-game values.

### Anti-Pattern Documentation
The 13 common build mistakes in `nate_framework/anti_patterns/common_mistakes.md` are all real and commonly observed in the Division 2 community. The over-capping CHC warning, the "using exotic for the name not the talent" trap, and the "solo build in group content" mistake (Memento in 4-player Legendary) are all accurate and actionable.

### MCP Tool Design
The 8-tool surface area is well-scoped. Each tool has a clear purpose, the parameter types are appropriate (list[str] for gear, dict for stats), and the docstrings include concrete examples that a language model consumer would find useful. The `div2_suggest_build` role/mode/constraints pattern is a natural way for players to query.

---

## Game Data Accuracy Issues

### 1. Striker's Battlegear Bonus Values (gear_sets.json)

The 2pc bonus is listed as `+15% Weapon Handling` and 3pc as `+15% Rate of Fire`. These are not standard Striker bonuses. In TU21.1, Striker's 2pc is `+15% Weapon Handling` (correct) but the 3pc should verify whether it is `+15% Rate of Fire` or another stat -- some community sources report different values after balancing passes. The synergy entry in `synergies.json` for `striker_sustained_dps` claims the 2pc is `+10% CHD` and 3pc is `+5% CHC`, which directly contradicts `gear_sets.json`. **This is an internal data inconsistency that will confuse users.**

**Fix:** Reconcile `synergies.json` `striker_sustained_dps.brands_detail.striker_battlegear` with `gear_sets.json` `strikers_battlegear.bonuses`. The gear_sets.json values should be the canonical source.

### 2. Heartbreaker Bonus Values (synergies.json vs. gear_sets.json)

Similar inconsistency: `synergies.json` `heartbreaker_ar` claims the 2pc is `+10% AR damage` and 3pc is `+10% LMG damage`. But `gear_sets.json` lists `2pc: +15% Assault Rifle Damage, +15% LMG Damage` and `3pc: +15% Weapon Handling`. **The synergies.json entry has incorrect and split bonus values.**

### 3. Negotiator's Dilemma Bonus Values (synergies.json)

`synergies.json` claims ND 2pc is `+10% CHD` and 3pc is `+10% CHC`. The actual values in `gear_sets.json` are `2pc: +15% Critical Hit Chance` and `3pc: +20% Critical Hit Damage`. The synergies file has them reversed and at wrong values.

### 4. Providence Defense Brand Bonus Mismatch (synergies.json)

Multiple synergy entries describe Providence Defense bonuses inconsistently. The `dps_core_providence` entry says the key bonus is `+15% weapon damage when all attributes are blue-rolled OR all orange-talent` -- this is not an accurate description of Providence's bonuses. The actual Providence bonuses in `brand_sets.json` are 1pc: +13% HSD, 2pc: +8% CHC, 3pc: +13% CHD. The synergies file appears to confuse Providence's brand bonuses with a talent description.

### 5. Grupo Sombra Values in Synergies

`synergies.json` lists Grupo Sombra 2pc as `+5% weapon damage, +10% CHD`. The actual `brand_sets.json` has Grupo 1pc: +13% CHD, 2pc: +20% Explosives Damage, 3pc: +13% HSD. The synergies file incorrectly states the bonus values.

### 6. Ceska Vyroba CHC Value in Synergies

`synergies.json` lists Ceska 1pc as `+5.5% CHC`. The actual value in `brand_sets.json` is `+8% Critical Hit Chance`. The synergies file has the wrong value.

### 7. Perfect Glass Cannon Source (talents_gear.json)

The `glass_cannon` talent entry claims Perfect Glass Cannon is `found_on: "Petrov Defense Group named chest items"`. It is actually found on The Sacrifice (Providence Defense chest). The named_items.json correctly identifies The Sacrifice with Perfect Glass Cannon, but the talent file's `found_on` field is wrong.

### 8. Named Item ID Mismatch: the_ravenous vs. Railsplitter (named_items.json)

Entry `the_ravenous` has `"name": "Railsplitter"`. The Ravenous is a separate exotic rifle from the Iron Horse raid. Railsplitter is a named FAMAS with Perfect Steady Handed. The ID `the_ravenous` should be `railsplitter` to avoid confusion with the actual Ravenous exotic in exotics.json.

### 9. Emperor's Guard Brand Error (named_items.json)

The `emperors_guard` entry says `"brand": "Murakami Industries"` (correct) but the notes say "Named Providence kneepads with armor regeneration." Emperor's Guard is a Murakami item, not Providence. The notes field is incorrect.

### 10. Sokolov Concern Available Slots (brand_sets.json)

Sokolov is listed with `available_slots: ["mask", "chest", "kneepads"]` and its named item Firm Handshake is listed as gloves. But gloves is not in the available_slots list. **Either the slots need to include gloves, or Firm Handshake's slot is wrong.** In-game, Sokolov does have a gloves slot available, so the available_slots array is incomplete.

### 11. Hollow Man Damage Value (brand_sets.json / named_items.json)

Douglas & Harding's named item Hollow Man is listed with `+8% Damage to Health`. In-game the value is `+21% Damage to Health` on the mask. The +8% appears to be confusing the brand set's 3pc bonus with the named item's unique attribute. Named_items.json also lists `+8% Damage to Health` -- this should be verified against in-game values.

### 12. Focus Talent Max Value (talents_gear.json)

Focus is described as `+5% weapon damage every second, up to +45%`. The Perfect version says `+6% per second, up to +54%`. In-game, standard Focus caps at +50% (10 seconds at +5%) and Perfect Focus caps at +60% (10 seconds at +6%). The values in the data are incorrect.

### 13. Obliterate Stacks Description Inconsistency

`talents_gear.json` says Obliterate stacks to 25 times at 1% each. The Perfect version says "stacks up to 24 times" with 10s duration. Standard Obliterate in-game stacks to 25 at 1% for 5s duration. Perfect Obliterate stacks to 25 at 1% for 10s. The max stack count for Perfect being listed as 24 instead of 25 appears to be a data entry error.

### 14. Fox's Prayer DtTooC Value in stats.json

The `damage_types.multiplicative` section lists `foxs_prayer_dttooc` as `+35% damage to targets out of cover`. The actual Fox's Prayer value is `+8% Damage to Targets Out of Cover` (matching named_items.json). The 35% figure in stats.json is fabricated and would significantly mislead damage calculations.

### 15. Vigilance Described as Chest Talent in stats.json

In `stats.json` `damage_types.multiplicative`, Vigilance is labeled as a "Chest talent." It is actually a backpack talent. This is correctly categorized in `talents_gear.json` but incorrectly labeled in the damage formula reference.

### 16. Missing Weapon Class: Bows (Descent Mode)

The weapons.json file does not include any Descent-mode-specific weapon archetypes or the signature weapon bows. While Descent is a roguelike mode where loadouts are randomized, signature weapons from specializations (TAC-50, Minigun, Missile Launcher, Crossbow, Flamethrower) are not documented with stats in weapons.json.

---

## Synergy & Build Logic Gaps

### 1. Synergies.json Internal Data Contradictions

As documented above, `synergies.json` has its own `brands_detail` sections that frequently contradict the canonical data in `brand_sets.json` and `gear_sets.json`. This is the single highest-priority data quality issue. The synergies file should either reference canonical data files or be regenerated from them.

**Recommendation:** Remove `brands_detail` from synergies.json entries and have the `suggest_build` function pull brand/set bonus details from the canonical data files at query time.

### 2. Missing Synergy Archetypes

The 12 synergy entries cover the major meta builds but are missing several commonly played archetypes:

- **Spotter + Flatline combo** -- One of the most popular and accessible combos in the game (Nightwatcher mask + Flatline weapon + Spotter chest). Not represented as a synergy entry.
- **Rigger gear set** -- Not in gear_sets.json at all. Rigger (skill set with skill recall/redeploy mechanic) is a commonly used set for turret/drone builds.
- **Tip of the Spear** -- Missing from gear_sets.json. TotS is a specialization-amplifying set used in sniper and support builds.
- **System Corruption** -- Missing from gear_sets.json. DZ-exclusive set focused on bonus armor manipulation.
- **Umbra Initiative** -- If added in TU21+, should be documented.

### 3. Exotic Coverage Gaps

Reading the exotics.json file, several notable exotics appear to be missing:

- **Scorpio** (shotgun) -- Referenced in gear set synergies but not present as an exotics entry. One of the most meta shotgun exotics.
- **Memento** (backpack) -- Has a synergy entry but no exotics entry with talent details.
- **Coyote's Mask** -- Referenced extensively but may lack an exotics entry (verify).
- **Vile** (mask) -- Referenced in Eclipse synergies but may lack an entry.
- **Waveform** (holster) -- Key skill build exotic, may be missing.
- **BTSU Datagloves** -- Referenced in Heartbreaker synergies but may lack an entry.
- **Tardigrade** (chest) -- Team armor exotic, missing.
- **Acosta's Go-Bag** (backpack) -- Grenade-focused exotic, missing.

### 4. Build Analyzer Logic Gap: Named Items Not Counted as Brand Pieces

The `build_analyzer.py` `analyze_build()` function counts gear pieces by ID to detect set bonuses. If a player submits `["foxs_prayer", "foxs_prayer"]`, the analyzer would count it as 2 pieces of "foxs_prayer" and look for it in gear_sets/brand_sets -- but "foxs_prayer" is in named_items.json, not brand_sets.json. The analyzer does not resolve named items to their parent brand (Fox's Prayer -> Overlord Armaments). **This means named items do not contribute to brand set bonus detection.**

**Fix:** Add a resolution step in `analyze_build()` that maps named item IDs to their parent brand before counting brand pieces.

### 5. Build Analyzer: Missing Exotic Weapon Synergy Detection

The analyzer passes weapon names to `detect_synergies()` but does not look up exotic weapon talents or verify exotic + gear set interactions. For example, Capacitor's Capacitance talent grants +7.5% weapon damage per skill core equipped -- this interacts with the build's skill tier count, but the analyzer cannot detect this.

### 6. Synergy Scoring: All-or-Nothing Component Matching

The synergy engine uses set intersection with fuzzy matching, but the scoring is a simple overlap ratio. This means a build with 3 of 6 components matching a synergy scores 0.50, while a build with 2 of 3 components matching a different synergy also scores 0.67. The engine does not weight by component importance -- having the 4pc gear set talent matters far more than having a recommended weapon type.

### 7. suggest_build Does Not Filter by Tier

The `suggest_build()` function returns the first 5 matching synergies but does not sort by tier (S > A > B). A B-tier synergy that happens to match role+mode earlier in the list will be returned before an S-tier one.

**Fix:** Sort `suggestions` by `syn_data.get("tier")` before returning.

---

## Data Ingestion & Freshness

### 1. Scraper Coverage vs. Manual Data

The `_metadata` fields show all 12 data files have `"source": "manual"` with `last_updated: "2026-03-01"`. The wiki scraper (`scrape_wiki.py`) exists but the data appears to be entirely manually curated. This creates a maintenance bottleneck -- any title update requires manual edits across 12 files.

**Recommendation:** Establish a scraper-first workflow where `scrape_wiki.py --merge` is run on each TU release, then manual curation fills gaps the wiki does not cover (meta_rating, synergies, tips).

### 2. No Patch Notes Tracking

The data freshness guide references `patch_notes/update_history.json` but this file does not appear to exist in the repository. Without it, the automated staleness check described in the nate_framework cannot function.

### 3. Missing Data Categories

Several game systems are not represented in any data file:

- **SHD Watch bonuses** -- The watch provides up to 10% CHC, 20% CHD, 10% HSD, 10% weapon damage. These affect stat cap calculations and are not documented.
- **Gear mods** -- Mod slots and available mod types (protocol, system) are not tracked.
- **Weapon mods** -- Optics, magazines, muzzles, underbarrel attachments and their stat effects.
- **Directives** -- Mission modifiers that alter gameplay significantly.
- **Exotic gear armor pieces** (non-weapon exotics) appear partially covered but several are missing as noted above.

### 4. Recalibration Rules Inaccuracy (stats.json)

The recalibration section states "You cannot recalibrate core attributes (red/blue/yellow) -- only minor attributes and talents." This is incorrect. In Division 2, you CAN recalibrate core attributes. The restriction is that you can only recalibrate ONE attribute OR talent per piece, and it must be the same type (core for core, minor for minor, talent for talent).

---

## Recommendations (Prioritized by Player Impact)

### P0 -- Critical (Actively Misleading)

1. **Fix synergies.json brand bonus contradictions.** The internal inconsistencies between synergies.json and the canonical brand_sets.json/gear_sets.json will cause the assistant to give contradictory answers depending on which tool is called. Either remove brands_detail from synergies.json or generate it programmatically from the canonical files.

2. **Fix Fox's Prayer DtTooC value in stats.json** from +35% to +8%. The current value would produce wildly incorrect damage calculations.

3. **Fix Vigilance label in stats.json** from "Chest talent" to "Backpack talent."

4. **Fix Perfect Obliterate stack count** from 24 to 25.

### P1 -- High (Missing or Wrong Data That Affects Recommendations)

5. **Add named item -> brand resolution in build_analyzer.py.** Without this, named items (Fox's Prayer, Contractor's Gloves, The Sacrifice, etc.) do not count toward brand set bonuses, producing incorrect analysis for the most commonly used items in the game.

6. **Add missing gear sets:** Rigger, Tip of the Spear, System Corruption, and any TU21+ additions.

7. **Add missing exotics:** Scorpio, Memento, Coyote's Mask, Vile, Waveform, BTSU Datagloves, Tardigrade, Acosta's Go-Bag, and others.

8. **Fix Sokolov available_slots** to include "gloves" (for Firm Handshake).

9. **Sort suggest_build results by tier** (S before A before B) to ensure the best suggestions surface first.

10. **Add Spotter + Flatline synergy archetype** -- this is one of the most played combos in the game and currently has no synergy entry.

### P2 -- Medium (Accuracy & Completeness)

11. **Fix Focus/Perfect Focus cap values** to +50%/+60%.

12. **Fix the_ravenous named item ID** to `railsplitter` to avoid collision with the Ravenous exotic.

13. **Fix Emperor's Guard notes** from "Providence kneepads" to "Murakami kneepads."

14. **Fix Perfect Glass Cannon found_on** from "Petrov Defense Group" to "The Sacrifice (Providence Defense)."

15. **Verify Hollow Man Damage to Health value** -- +8% vs. +21% in-game.

16. **Add SHD Watch bonuses to stats.json** to enable accurate stat cap calculations.

17. **Create `patch_notes/update_history.json`** as described in the nate_framework.

### P3 -- Low (Nice to Have)

18. **Add weapon/gear mod data** for complete build optimization.

19. **Add Descent-mode-specific guidance** beyond "builds adapt dynamically."

20. **Add Directive descriptions** for Summit and open-world content.

21. **Consider adding a `lookup_exotic()` dedicated function** -- currently exotics are found via `lookup_gear()` and `lookup_weapon()` but a dedicated exotic search could surface both gear and weapon exotics in one call.

22. **Add Nate Framework anti-pattern: "Running Memento in 8-player raids"** -- trophy competition with 7 other players makes Memento significantly weaker.

23. **Fix recalibration rules in stats.json** to correctly state that core attributes CAN be recalibrated (one slot per piece, same type restriction).

---

## Nate Framework Assessment

The framework is well-structured and addresses the right concerns. Specific observations:

**Complete and well-done:**
- Build intent framework (6 intents cover the spectrum)
- Decision priorities (safety > achievability > explanation > mode-awareness > identity)
- Common mistakes list (13 mistakes are all real and commonly observed)
- Data freshness guide (staleness risk ratings are accurate)
- Teaching mode vs. answer mode distinction

**Gaps to address:**

- **Missing anti-pattern: "Stacking the same multiplicative source"** -- Players sometimes try to run both Glass Cannon chest AND Vigilance backpack thinking they are separate multipliers. They are, but the framework should explicitly call out that Amplified sources (Glass Cannon, Vigilance, Memento) occupy the same "amplified" bucket and have diminishing relative value when stacked vs. adding a new multiplicative category.

- **Missing anti-pattern: "Not accounting for talent uptime"** -- Vigilance's downtime (4s after being hit) is not factored into paper DPS. In Legendary where you take constant damage, Vigilance effective uptime may be only 50-60%, making Composure (always active in cover) competitive. The framework mentions talent uptime in the teaching guide but does not explicitly flag it as an anti-pattern.

- **Missing boundary: Weapon mod optimization** -- The capability map lists "Mod allocation" as a "Human Sweet Spot" but the assistant currently has no mod data to even discuss. This should be flagged as a data gap in the boundaries document.

- **Missing learning topic: Armor vs. damage trade-off calculator** -- The teaching guide covers damage formula but not the EHP (effective health points) vs. DPS trade-off. A simple teaching example showing "1 blue core = X armor, which means Y% more survivability but Z% less damage" would significantly improve build advice quality.
