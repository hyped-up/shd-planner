# Division 2 Build-Crafting Assistant — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Author:** lkeneston + Claude

---

## Problem Statement

The Division 2 has deep build-crafting mechanics — 18 gear sets, 30+ brand sets, 50+ exotics, hundreds of talents, weapons, skills, and stat interactions. Making intelligent build decisions requires cross-referencing dozens of variables. No single tool exists that provides structured, queryable access to this data integrated into an AI workflow.

## Goals

1. **Comprehensive knowledge base** — All gear sets, brand sets, exotics, named items, talents, weapons, skills, specializations, stat caps, formulas, and synergies as structured JSON
2. **MCP server** — 8 queryable tools for lookups, build analysis, synergy detection, stat calculations, and build suggestions
3. **Claude Code skill** — Auto-activating expert persona that uses MCP tools for Division 2 conversations
4. **Standalone agentic pattern** — Usable in any AI (ChatGPT, Gemini, raw Claude) without the MCP server
5. **Self-owned data** — All game knowledge researched from primary sources, no third-party data dependencies

## Non-Goals

- Live player stat lookups (Tracker.gg API — can be added later)
- Vendor reset tracking (rubenalamina — can be added later)
- In-game overlay or companion app
- Build image generation or screenshot parsing

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Monolith MCP server + skill + pattern in one repo | Single install, everything together, easy to maintain |
| Project location | `/home/lkeneston/projects/shd-planner-cwd/` | Fresh directory, clean start |
| Knowledge base source | Research from scratch via parallel agents | Own the data, no third-party dependency risk |
| Data scope | Comprehensive (all gear, weapons, talents, skills, mods, exotics, named items) | Full coverage for any build-crafting question |
| Game mode coverage | All modes (Legendary PvE, Raids, PvP/DZ, Countdown, Descent, Retaliation) | User plays everything |
| Python tooling | uv for env management, ruff for linting | Modern Python 3.12+ stack |
| MCP framework | Python MCP SDK (`mcp` package) | Standard Claude Code MCP integration |

## Project Structure

```
shd-planner-cwd/
├── README.md
├── CHANGELOG.md
├── CLAUDE.md
├── .gitignore
├── pyproject.toml                          # uv project config
├── server.py                               # MCP server entry point
├── data/
│   ├── gear_sets.json                      # 18 gear sets + bonuses + chest/backpack talents
│   ├── brand_sets.json                     # All brand sets + 1/2/3pc bonuses
│   ├── exotics.json                        # All exotic weapons + gear + unique perks
│   ├── named_items.json                    # Named items + fixed talents + sources
│   ├── talents_gear.json                   # Chest + backpack talents
│   ├── talents_weapon.json                 # Weapon talents + requirements
│   ├── weapons.json                        # Weapon types, archetypes, RPM, base dmg ranges
│   ├── skills.json                         # All skills + variants + mods + scaling
│   ├── specializations.json                # 6 specs + signature weapons + trees
│   ├── stats.json                          # Stat caps, formulas, diminishing returns
│   ├── synergies.json                      # Known high-value synergy combinations
│   └── modes.json                          # Mode-specific mechanics
├── tools/
│   ├── __init__.py
│   ├── lookup.py                           # div2_lookup_* tools
│   ├── build_analyzer.py                   # div2_analyze_build, div2_suggest_build
│   ├── synergy_engine.py                   # Synergy detection + scoring
│   └── stat_calculator.py                  # DPS/EHP/skill damage math
├── pattern/
│   └── division2_buildcraft_v1.0_prompt.md # Standalone agentic pattern
├── skill/
│   └── shd-planner-cwd.md              # Claude Code skill
└── tests/
    └── test_tools.py
```

## MCP Server Tools

### Tool Definitions

#### 1. `div2_lookup_gear`
- **Input:** Gear name, abbreviation, or search term
- **Output:** Full gear set or brand set info — name, abbreviation, type, all bonuses (1pc/2pc/3pc/4pc), chest talent, backpack talent, optimal weapons, playstyle tags, mode suitability
- **Examples:** "Striker", "SB", "Eclipse Protocol", "brand:Grupo Sombra"

#### 2. `div2_lookup_weapon`
- **Input:** Weapon name, type, or archetype
- **Output:** Weapon stats — type, archetype, RPM, base damage range, magazine size, reload speed, optimal range, available talents, named/exotic variants
- **Examples:** "M4", "Police M4", "assault rifle", "LMG"

#### 3. `div2_lookup_talent`
- **Input:** Talent name
- **Output:** Description, requirements (gear slot/weapon type/core attribute), activation conditions, synergies, interactions, PvP modifications if any
- **Examples:** "Obliterate", "Vigilance", "Glass Cannon", "Flatline"

#### 4. `div2_lookup_skill`
- **Input:** Skill name + optional variant
- **Output:** Skill type, variants, base damage/healing/duration per skill tier, cooldown, mods (damage, duration, health, etc.), scaling formula, specialization interactions
- **Examples:** "Assault Turret", "Striker Drone", "Restorer Hive"

#### 5. `div2_analyze_build`
- **Input:** Build specification — 6 gear pieces (with brand/set + core + attributes), 2 weapons (with talents), 2 skills, specialization
- **Output:** Total stat summary (weapon damage%, armor, skill tier, CHC, CHD, etc.), gear set bonus activation, synergy score, identified strengths, identified weaknesses, improvement suggestions
- **Processing:** Cross-references gear_sets, brand_sets, talents, stats, synergies data

#### 6. `div2_suggest_build`
- **Input:** Role (DPS, tank, healer, hybrid, skill), mode (legendary, raid, pvp, countdown, etc.), optional constraints (must use X weapon, must include Y gear set)
- **Output:** 2-3 recommended builds with full loadouts, stat projections, playstyle notes, difficulty rating
- **Processing:** Queries synergies.json for proven combinations, validates against stat caps

#### 7. `div2_check_stats`
- **Input:** Stat allocations (CHC%, CHD%, weapon damage%, armor, skill tier, etc.)
- **Output:** Validates against known caps, shows effective values after diminishing returns, highlights over-cap waste, suggests reallocation
- **Key caps:** CHC 60%, CHD uncapped, Skill Tier 6, Hazard Protection 100%, etc.

#### 8. `div2_compare`
- **Input:** Two items (gear sets, weapons, talents) or two full builds
- **Output:** Side-by-side comparison table with analysis of when each is better, mode-specific recommendations

## Knowledge Base Schema

### gear_sets.json
```json
{
  "striker_battlegear": {
    "name": "Striker's Battlegear",
    "abbreviation": "SB",
    "type": "gear_set",
    "bonuses": {
      "2pc": "+15% Weapon Damage",
      "3pc": "+15% Rate of Fire",
      "4pc": "Striker's Gamble - Each hit adds 1 stack (max 200). Each stack grants 0.5% weapon damage. Missing removes 2 stacks."
    },
    "chest_talent": "Press the Advantage - Headshot kills grant +20% weapon damage for 45s. Max 3 stacks.",
    "backpack_talent": "Risk Assessment - Total weapon damage increased by 1-100% based on your critical hit chance.",
    "gear_slots": ["mask", "vest", "holster", "backpack", "gloves", "kneepads"],
    "optimal_weapons": ["AR", "LMG", "SMG"],
    "playstyle": ["sustained_dps"],
    "modes": ["pve_legendary", "pve_raid", "pvp", "countdown"],
    "synergies": ["obliterate", "vigilance", "coyotes_mask", "fox_prayer"],
    "counters": ["blind", "disrupted", "high_mobility_targets"],
    "tips": "High RPM weapons maximize stack building. ARs ideal for accuracy at range. LMGs for sustained fire. Avoid shotguns/MMRs."
  }
}
```

### weapons.json
```json
{
  "assault_rifles": {
    "type": "Assault Rifle",
    "core_attribute": "Health Damage",
    "archetypes": {
      "m4": {
        "name": "Military M4",
        "rpm": 850,
        "magazine": 30,
        "reload_speed_s": 2.4,
        "optimal_range_m": 35,
        "base_damage_range": [15234, 18612],
        "variants": ["Police M4 (named: The Apartment)"],
        "notes": "Best all-around AR. High RPM, manageable recoil."
      }
    }
  }
}
```

### stats.json
```json
{
  "caps": {
    "critical_hit_chance": { "cap": 60, "unit": "%", "sources": ["watch", "gear_attributes", "mods", "brand_bonuses"] },
    "critical_hit_damage": { "cap": null, "unit": "%", "notes": "No hard cap. Diminishing returns above ~180%" },
    "skill_tier": { "cap": 6, "unit": "tier", "notes": "Each yellow core = 1 tier" },
    "hazard_protection": { "cap": 100, "unit": "%", "notes": "100% = immune to all status effects" },
    "protection_from_elites": { "cap": null, "unit": "%", "notes": "No hard cap. Stacks additively." }
  },
  "formulas": {
    "weapon_damage": "base_damage * (1 + total_weapon_damage%) * (1 + amplifying_talents) * headshot_multiplier * crit_multiplier",
    "effective_hp": "total_armor * (1 + total_armor_bonus%) / (1 - damage_reduction%)",
    "skill_damage": "base_skill_damage * (1 + skill_damage%) * (1 + status_effects%) * skill_tier_multiplier"
  }
}
```

## Claude Code Skill

**File:** `skill/shd-planner-cwd.md`

The skill will:
1. Set the expert persona — 15+ year looter-shooter veteran, Division 2 endgame optimizer, raid-experienced, PvP-competent
2. Instruct Claude to use MCP tools for all structured lookups (never guess gear stats)
3. Define the build-crafting workflow:
   - Assess player's goal (mode, role, playstyle, constraints)
   - Check stat caps and budget
   - Suggest gear composition (set bonuses, brand bonuses, exotics)
   - Analyze talent synergies
   - Validate weapon choice
   - Optimize attribute rolls
   - Provide mode-specific tuning advice
4. Cover all modes with mode-specific knowledge
5. Reference the standalone pattern for deep methodology

## Standalone Agentic Pattern

**File:** `pattern/division2_buildcraft_v1.0_prompt.md`

A comprehensive prompt that works without the MCP server. Contains:
- Expert persona definition
- Embedded reference tables (gear sets, key talents, weapon archetypes, stat caps)
- Build-crafting methodology (systematic approach to build design)
- Mode-specific optimization frameworks
- Synergy detection heuristics
- Common build archetypes and templates
- Anti-patterns and common mistakes
- Stat budget optimization guide

## Implementation Phases

### Phase 1: Research + Build JSON Knowledge Base
- Dispatch 8 parallel research agents covering:
  1. Gear sets (18 sets)
  2. Brand sets (all brands + bonuses)
  3. Exotic weapons
  4. Exotic gear + named items
  5. Gear + weapon talents
  6. Weapons (all types, archetypes, stats)
  7. Skills + specializations
  8. Stats, formulas, caps, modes
- Primary source: Reddit wiki (`r/thedivision/wiki/thedivision2/`)
- Cross-reference with web searches for accuracy
- Output: 12 verified JSON data files

### Phase 2: Build MCP Server
- Set up uv project with `mcp` SDK dependency
- Implement `server.py` with 8 tools
- Implement `tools/lookup.py` (4 lookup tools)
- Implement `tools/build_analyzer.py` (analyze + suggest)
- Implement `tools/synergy_engine.py`
- Implement `tools/stat_calculator.py` (check_stats + compare)

### Phase 3: Write Skill + Pattern
- Write `skill/shd-planner-cwd.md` Claude Code skill
- Write `pattern/division2_buildcraft_v1.0_prompt.md` standalone pattern
- Register MCP server in Claude Code settings
- Register skill in Claude Code settings

### Phase 4: Test + Document
- Write tests for tool functions
- Write CLAUDE.md for the project
- Write README.md with setup/usage instructions
- Write CHANGELOG.md
- Commit and push

## Future Enhancements (Out of Scope for v1.0)
- Tracker.gg API integration for live player stat lookups
- rubenalamina vendor reset integration
- iKia build showcase parsing and indexing
- Build image recognition (parse screenshot → identify gear)
- DPS calculator with detailed breakdowns
- Build sharing/export format
