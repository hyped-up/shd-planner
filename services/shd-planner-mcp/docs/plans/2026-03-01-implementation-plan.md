# Division 2 Build-Crafting Assistant — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MCP server + Claude Code skill + standalone agentic pattern for Division 2 build theory-crafting with a comprehensive, self-owned JSON knowledge base.

**Architecture:** Python MCP server using FastMCP (stdio transport) with 12 JSON data files, 8 queryable tools, a Claude Code skill for auto-activation, and a standalone agentic pattern for use in any AI.

**Tech Stack:** Python 3.12+, `mcp[cli]` SDK, `pydantic` for structured returns, `uv` for environment management, `ruff` for linting, `pytest` for tests.

---

## Phase 1: Project Scaffolding

### Task 1: Initialize project structure

**Files:**
- Create: `pyproject.toml`
- Create: `.gitignore`
- Create: `.python-version`
- Create: `server.py` (minimal stub)
- Create: `data/` directory
- Create: `tools/__init__.py`
- Create: `tools/lookup.py` (stub)
- Create: `tools/build_analyzer.py` (stub)
- Create: `tools/synergy_engine.py` (stub)
- Create: `tools/stat_calculator.py` (stub)
- Create: `pattern/` directory
- Create: `skill/` directory
- Create: `tests/__init__.py`
- Create: `tests/test_lookup.py` (stub)

**Step 1: Create pyproject.toml**

```toml
[project]
name = "shd-planner-cwd"
version = "0.1.0"
description = "MCP server for Division 2 build-crafting theory"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "mcp[cli]>=1.0.0",
    "pydantic>=2.0",
]

[project.scripts]
shd-planner-cwd = "server:main"

[tool.ruff]
line-length = 120
target-version = "py312"

[tool.pytest.ini_options]
testpaths = ["tests"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**Step 2: Create .gitignore**

```
__pycache__/
*.pyc
.venv/
*.egg-info/
dist/
.ruff_cache/
.pytest_cache/
.env
CLAUDE.md
*_prompt.md
```

**Step 3: Create .python-version**

```
3.12
```

**Step 4: Create minimal server.py stub**

```python
#!/usr/bin/env python3
"""Division 2 Build-Crafting Assistant MCP Server."""

from mcp.server.fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("shd-planner-cwd")


@mcp.tool()
def div2_ping() -> str:
    """Health check - returns server status."""
    return "Division 2 Assistant MCP server is running."


def main():
    mcp.run()


if __name__ == "__main__":
    main()
```

**Step 5: Create directory structure and stubs**

```bash
mkdir -p data tools pattern skill tests
touch tools/__init__.py tests/__init__.py
touch tools/lookup.py tools/build_analyzer.py tools/synergy_engine.py tools/stat_calculator.py
touch tests/test_lookup.py
```

**Step 6: Initialize uv environment and install dependencies**

```bash
cd /home/lkeneston/projects/shd-planner-cwd
uv sync
```

**Step 7: Verify server starts**

```bash
uv run python -c "from mcp.server.fastmcp import FastMCP; print('MCP SDK loaded OK')"
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Division 2 assistant project scaffolding"
```

---

## Phase 2: Build JSON Knowledge Base

Research agents will populate these files in parallel. Each task produces one JSON data file.

### Task 2: Create gear_sets.json

**Files:**
- Create: `data/gear_sets.json`

**Step 1: Research and write gear_sets.json**

Dispatch a research agent to fetch data from `https://thedivision.fandom.com/wiki/Gear_Sets/Tom_Clancy's_The_Division_2` and cross-reference with web searches. The file must contain all 20 gear sets:

Aces & Eights, Aegis, Breaking Point, Cavalier, Eclipse Protocol, Foundry Bulwark, Future Initiative, Hard Wired, Heartbreaker, Hotshot, Hunter's Fury, Negotiator's Dilemma, Ongoing Directive, Ortiz: Exuro, Rigger, Striker's Battlegear, System Corruption, Tip of the Spear, True Patriot, Umbra Initiative.

Schema per entry:
```json
{
  "id": "strikers_battlegear",
  "name": "Striker's Battlegear",
  "abbreviation": "SB",
  "bonuses": {
    "2pc": "+15% Weapon Handling",
    "3pc": "+15% Rate of Fire",
    "4pc": "Striker's Gamble - description"
  },
  "chest_talent": { "name": "Press the Advantage", "description": "..." },
  "backpack_talent": { "name": "Risk Assessment", "description": "..." },
  "gear_slots": ["mask", "vest", "holster", "backpack", "gloves", "kneepads"],
  "optimal_weapons": ["AR", "LMG", "SMG"],
  "playstyle": ["sustained_dps"],
  "modes": ["pve_legendary", "raid", "pvp", "countdown"],
  "synergies": ["obliterate", "vigilance", "coyotes_mask"],
  "tips": "High RPM weapons maximize stack building."
}
```

**Step 2: Validate JSON is parseable**

```bash
uv run python -c "import json; data=json.load(open('data/gear_sets.json')); print(f'{len(data)} gear sets loaded')"
```
Expected: `20 gear sets loaded`

### Task 3: Create brand_sets.json

**Files:**
- Create: `data/brand_sets.json`

**Step 1: Research and write brand_sets.json**

Dispatch a research agent to fetch from `https://thedivision.fandom.com/wiki/Brand_Sets/Tom_Clancy's_The_Division_2`. Must contain all 33 brand sets with 1pc/2pc/3pc bonuses.

Schema per entry:
```json
{
  "id": "providence_defense",
  "name": "Providence Defense",
  "bonuses": {
    "1pc": "+13% Headshot Damage",
    "2pc": "+8% Critical Hit Chance",
    "3pc": "+13% Critical Hit Damage"
  },
  "available_slots": ["mask", "vest", "holster", "backpack", "gloves", "kneepads"],
  "core_focus": "dps",
  "meta_notes": "Best-in-slot DPS brand. 1pc is almost mandatory for any red build."
}
```

**Step 2: Validate**

```bash
uv run python -c "import json; data=json.load(open('data/brand_sets.json')); print(f'{len(data)} brand sets loaded')"
```
Expected: `33 brand sets loaded`

### Task 4: Create exotics.json

**Files:**
- Create: `data/exotics.json`

**Step 1: Research and write exotics.json**

Dispatch a research agent using `https://blog.lfcarry.com/division-2-exotics-list/` and Fandom wiki individual exotic pages. Must contain all 58 exotics (32 weapons + 26 armor).

Schema per entry:
```json
{
  "id": "coyotes_mask",
  "name": "Coyote's Mask",
  "type": "armor",
  "slot": "mask",
  "unique_talent": {
    "name": "Pack Instincts",
    "description": "0-15m: +25% CHD. 15-25m: +10% CHC +10% CHD. 25m+: +25% CHC. Applies to group."
  },
  "core_attribute": "weapon_damage",
  "source": "Legendary missions, Season Cache, Exotic Cache",
  "meta_rating": "S",
  "best_with": ["dps_builds", "group_play", "any_weapon"],
  "notes": "Best-in-slot mask for almost all DPS builds. Group-wide buff makes it even stronger in teams."
}
```

**Step 2: Validate**

```bash
uv run python -c "import json; data=json.load(open('data/exotics.json')); print(f'{len(data)} exotics loaded')"
```
Expected: `58 exotics loaded` (approximately)

### Task 5: Create named_items.json

**Files:**
- Create: `data/named_items.json`

**Step 1: Research and write named_items.json**

Research all named items — these are brand set pieces with a fixed, unique talent. Sources: Fandom wiki, community spreadsheets.

Schema per entry:
```json
{
  "id": "fox_prayer",
  "name": "Fox's Prayer",
  "brand": "overlord_armaments",
  "slot": "kneepads",
  "fixed_talent": "Damage to Targets out of Cover +8%",
  "core_attribute": "weapon_damage",
  "source": "Named item caches, Targeted Loot: Overlord Armaments",
  "meta_rating": "S",
  "notes": "Best-in-slot kneepads for nearly all DPS builds. 8% DtTooC is multiplicative."
}
```

**Step 2: Validate**

```bash
uv run python -c "import json; data=json.load(open('data/named_items.json')); print(f'{len(data)} named items loaded')"
```

### Task 6: Create talents_gear.json and talents_weapon.json

**Files:**
- Create: `data/talents_gear.json`
- Create: `data/talents_weapon.json`

**Step 1: Research and write both talent files**

Dispatch a research agent to fetch from `https://thedivision.fandom.com/wiki/Talents/Tom_Clancy's_The_Division_2`. Separate gear talents (chest/backpack) from weapon talents.

Gear talent schema:
```json
{
  "id": "obliterate",
  "name": "Obliterate",
  "slot": "chest",
  "requirement": "4+ red cores",
  "description": "Critical hits increase total weapon damage by 1% for 5s. Stacks up to 25.",
  "pvp_modifier": "Max stacks reduced to 15 in PvP",
  "synergies": ["high_chc_builds", "smg", "ar"],
  "meta_rating": "S",
  "notes": "Best general-purpose chest talent for DPS. Easy to maintain at 60% CHC."
}
```

Weapon talent schema:
```json
{
  "id": "measured",
  "name": "Measured",
  "weapon_type": ["AR", "LMG", "SMG"],
  "description": "First half of magazine: +15% RoF, -20% Weapon Damage. Second half: -15% RoF, +20% Weapon Damage.",
  "meta_notes": "Strong on high-RPM weapons. Good for Striker stack building."
}
```

**Step 2: Validate**

```bash
uv run python -c "import json; g=json.load(open('data/talents_gear.json')); w=json.load(open('data/talents_weapon.json')); print(f'{len(g)} gear talents, {len(w)} weapon talents loaded')"
```

### Task 7: Create weapons.json

**Files:**
- Create: `data/weapons.json`

**Step 1: Research and write weapons.json**

Research all weapon types, archetypes, and key stats. Organized by weapon class (AR, SMG, LMG, Rifle, MMR, Shotgun, Pistol).

Schema:
```json
{
  "assault_rifles": {
    "class": "Assault Rifle",
    "core_bonus": "Health Damage",
    "archetypes": {
      "military_m4": {
        "name": "Military M4",
        "rpm": 850,
        "magazine": 30,
        "reload_s": 2.4,
        "optimal_range_m": 35,
        "variants": ["Police M4"],
        "named_variant": "The Apartment",
        "meta_notes": "Best all-around AR. High RPM, manageable recoil."
      }
    }
  }
}
```

**Step 2: Validate**

```bash
uv run python -c "import json; data=json.load(open('data/weapons.json')); print(f'{len(data)} weapon classes loaded')"
```
Expected: `7 weapon classes loaded`

### Task 8: Create skills.json and specializations.json

**Files:**
- Create: `data/skills.json`
- Create: `data/specializations.json`

**Step 1: Research and write skills.json**

Source: `https://thedivision.fandom.com/wiki/Skills/Tom_Clancy's_The_Division_2`. All 12 skill types with all variants.

Schema:
```json
{
  "turret": {
    "name": "Turret",
    "variants": {
      "assault": {
        "name": "Assault Turret",
        "damage_type": "ballistic",
        "base_damage_tier0": 5000,
        "scaling_per_tier": "+15% per skill tier",
        "duration_s": 120,
        "cooldown_s": 240,
        "mods": ["damage", "health", "duration"],
        "notes": "Best general-purpose skill DPS. Scales with skill damage and skill tier."
      }
    }
  }
}
```

**Step 2: Research and write specializations.json**

Source: `https://thedivision.fandom.com/wiki/Specializations`. All 6 specializations.

Schema:
```json
{
  "technician": {
    "name": "Technician",
    "signature_weapon": "P-017 Missile Launcher",
    "unique_skill": "Artificer Hive",
    "grenade": "EMP Grenade",
    "bonus_skill_tier": true,
    "key_passives": ["+1 Skill Tier", "+10% Skill Damage", "Linked Laser Pointer"],
    "best_for": ["skill_builds", "turret_drone", "hybrid_tech"],
    "notes": "The +1 Skill Tier passive allows running 5 yellow cores + reaching Tier 6."
  }
}
```

**Step 3: Validate both**

```bash
uv run python -c "import json; s=json.load(open('data/skills.json')); sp=json.load(open('data/specializations.json')); print(f'{len(s)} skill types, {len(sp)} specializations loaded')"
```
Expected: `12 skill types, 6 specializations loaded`

### Task 9: Create stats.json, synergies.json, and modes.json

**Files:**
- Create: `data/stats.json`
- Create: `data/synergies.json`
- Create: `data/modes.json`

**Step 1: Research and write stats.json**

Contains stat caps, damage formulas, diminishing returns, core attribute values, and recalibration rules.

```json
{
  "caps": {
    "critical_hit_chance": { "cap": 60, "unit": "%" },
    "critical_hit_damage": { "cap": null, "unit": "%", "soft_cap_note": "Diminishing value above ~180%" },
    "skill_tier": { "cap": 6, "unit": "tier" },
    "hazard_protection": { "cap": 100, "unit": "%" },
    "headshot_damage": { "cap": null, "unit": "%" },
    "weapon_damage": { "cap": null, "unit": "%" },
    "armor_regen": { "cap": null, "unit": "per_second" }
  },
  "core_attributes": {
    "red": { "name": "Weapon Damage", "max_roll": 15, "unit": "%" },
    "blue": { "name": "Armor", "max_roll": 170000, "unit": "flat" },
    "yellow": { "name": "Skill Tier", "max_roll": 1, "unit": "tier" }
  },
  "minor_attributes": {
    "critical_hit_chance": { "max_roll": 6.0, "unit": "%" },
    "critical_hit_damage": { "max_roll": 12.0, "unit": "%" },
    "headshot_damage": { "max_roll": 10.0, "unit": "%" },
    "weapon_handling": { "max_roll": 8.0, "unit": "%" },
    "hazard_protection": { "max_roll": 10.0, "unit": "%" },
    "health": { "max_roll": 18935, "unit": "flat" },
    "armor_regen": { "max_roll": 4925, "unit": "per_second" },
    "explosive_resistance": { "max_roll": 10.0, "unit": "%" },
    "skill_damage": { "max_roll": 10.0, "unit": "%" },
    "skill_haste": { "max_roll": 12.0, "unit": "%" },
    "skill_repair": { "max_roll": 20.0, "unit": "%" },
    "status_effects": { "max_roll": 10.0, "unit": "%" },
    "incoming_repairs": { "max_roll": 20.0, "unit": "%" }
  },
  "formulas": {
    "total_weapon_damage": "base_damage * (1 + sum_additive_bonuses) * product_multiplicative_bonuses * crit_multiplier * headshot_multiplier",
    "crit_multiplier": "1 + (CHD% / 100) when crit hits",
    "effective_hp": "armor * (1 + bonus_armor%) + health",
    "skill_damage": "base_skill_damage * (1 + skill_damage%) * skill_tier_multiplier",
    "dps_simplified": "damage_per_bullet * rpm / 60 * accuracy_factor * (1 + CHC * CHD)"
  },
  "damage_types": {
    "additive": ["weapon_damage%", "ar_damage%", "damage_to_armor%"],
    "multiplicative": ["obliterate_stacks", "glass_cannon", "vigilance", "fox_prayer_dttoc", "headshot_damage"]
  },
  "recalibration": {
    "rules": "Can recalibrate ONE attribute per gear piece. Core or one minor. Cannot recalibrate mod slots or talent on gear set pieces.",
    "library": "Extract attributes from deconstructed gear to recalibration library. Library is permanent per character."
  }
}
```

**Step 2: Research and write synergies.json**

Known high-value build synergy combinations.

```json
{
  "dps_core": {
    "name": "Red DPS Core",
    "components": ["providence_3pc", "grupo_sombra_1pc", "ceska_1pc", "fox_prayer_kneepads"],
    "talents": ["obliterate_chest", "vigilance_backpack"],
    "stat_target": { "CHC": 60, "CHD": "180+" },
    "mode": "all",
    "notes": "The foundation of every DPS build. 3pc Providence + Grupo + Ceska hits CHC cap with CHD stacking."
  },
  "striker_sustained": {
    "name": "Striker Sustained DPS",
    "components": ["strikers_4pc", "ceska_1pc", "grupo_sombra_1pc"],
    "talents": ["press_advantage_chest", "risk_assessment_backpack"],
    "weapons": ["ar", "lmg"],
    "stat_target": { "CHC": 50, "CHD": "140+" },
    "mode": "pve_legendary",
    "notes": "High RPM ARs (M4, FAMAS) for max stack building. LMGs for sustained fire. Avoid shotguns/MMRs."
  }
}
```

**Step 3: Research and write modes.json**

```json
{
  "legendary": {
    "name": "Legendary Missions",
    "difficulty": "legendary",
    "players": "1-4",
    "enemy_tier": "legendary",
    "key_mechanics": "All enemies are elite/named. Heavy armor. Aggressive AI. One-shot potential.",
    "recommended_roles": ["2 dps", "1 cc", "1 healer_or_hybrid"],
    "build_priorities": ["survivability", "crowd_control", "sustained_dps"],
    "tips": "Eclipse Protocol or status builds essential for crowd control. Reviver hive recommended."
  },
  "raid_dark_hours": {
    "name": "Operation Dark Hours",
    "difficulty": "raid",
    "players": "8",
    "key_mechanics": "Boss mechanics, DPS checks, coordination required.",
    "recommended_roles": ["6 dps", "1 tank", "1 healer"],
    "build_priorities": ["raw_dps", "communication", "mechanic_awareness"]
  }
}
```

**Step 4: Validate all three**

```bash
uv run python -c "
import json
st=json.load(open('data/stats.json'))
sy=json.load(open('data/synergies.json'))
m=json.load(open('data/modes.json'))
print(f'stats: {len(st)} sections, synergies: {len(sy)} combos, modes: {len(m)} modes')
"
```

### Task 10: Commit all knowledge base files

```bash
git add data/
git commit -m "feat: add comprehensive Division 2 knowledge base (12 JSON files)"
```

---

## Phase 3: Implement MCP Server Tools

### Task 11: Implement data loader module

**Files:**
- Create: `tools/data_loader.py`
- Create: `tests/test_data_loader.py`

**Step 1: Write the failing test**

```python
# tests/test_data_loader.py
"""Tests for data loader module."""
import pytest
from tools.data_loader import load_data, search_data


def test_load_gear_sets():
    data = load_data("gear_sets")
    assert isinstance(data, dict)
    assert len(data) > 0
    assert "strikers_battlegear" in data or any("striker" in k for k in data)


def test_load_nonexistent_file():
    with pytest.raises(FileNotFoundError):
        load_data("nonexistent_file")


def test_search_data_by_name():
    results = search_data("gear_sets", "striker")
    assert len(results) > 0


def test_search_data_by_abbreviation():
    results = search_data("gear_sets", "SB")
    assert len(results) > 0


def test_search_data_no_results():
    results = search_data("gear_sets", "zzz_nonexistent_zzz")
    assert len(results) == 0
```

**Step 2: Run tests to verify they fail**

```bash
uv run pytest tests/test_data_loader.py -v
```
Expected: FAIL — module not found

**Step 3: Write implementation**

```python
# tools/data_loader.py
"""Load and search Division 2 JSON knowledge base files."""

import json
from pathlib import Path
from functools import lru_cache

DATA_DIR = Path(__file__).parent.parent / "data"


@lru_cache(maxsize=20)
def load_data(filename: str) -> dict:
    """Load a JSON data file from the data/ directory.

    Args:
        filename: Name without .json extension (e.g., "gear_sets")

    Returns:
        Parsed JSON data as dict

    Raises:
        FileNotFoundError: If the data file doesn't exist
    """
    filepath = DATA_DIR / f"{filename}.json"
    if not filepath.exists():
        raise FileNotFoundError(f"Data file not found: {filepath}")
    with open(filepath) as f:
        return json.load(f)


def search_data(filename: str, query: str) -> list[dict]:
    """Search a data file for entries matching a query string.

    Searches across id, name, and abbreviation fields (case-insensitive).

    Args:
        filename: Data file to search
        query: Search term

    Returns:
        List of matching entries
    """
    data = load_data(filename)
    query_lower = query.lower()
    results = []

    for key, value in data.items():
        if not isinstance(value, dict):
            continue
        # Search across common fields
        searchable = " ".join([
            str(key),
            str(value.get("name", "")),
            str(value.get("abbreviation", "")),
            str(value.get("id", "")),
        ]).lower()

        if query_lower in searchable:
            results.append(value)

    return results
```

**Step 4: Run tests to verify they pass**

```bash
uv run pytest tests/test_data_loader.py -v
```
Expected: All PASS

**Step 5: Commit**

```bash
git add tools/data_loader.py tests/test_data_loader.py
git commit -m "feat: add data loader with search functionality"
```

### Task 12: Implement lookup tools

**Files:**
- Modify: `tools/lookup.py`
- Create: `tests/test_lookup.py`

**Step 1: Write the failing tests**

```python
# tests/test_lookup.py
"""Tests for lookup tools."""
from tools.lookup import lookup_gear, lookup_weapon, lookup_talent, lookup_skill


def test_lookup_gear_by_name():
    result = lookup_gear("Striker")
    assert result is not None
    assert "Striker" in result["name"] or "striker" in result.get("id", "")


def test_lookup_gear_by_abbreviation():
    result = lookup_gear("SB")
    assert result is not None


def test_lookup_gear_not_found():
    result = lookup_gear("zzz_fake_gear_zzz")
    assert result is None or "not found" in str(result).lower()


def test_lookup_weapon_by_type():
    result = lookup_weapon("assault rifle")
    assert result is not None


def test_lookup_talent():
    result = lookup_talent("Obliterate")
    assert result is not None


def test_lookup_skill():
    result = lookup_skill("Assault Turret")
    assert result is not None
```

**Step 2: Run to verify failure**

```bash
uv run pytest tests/test_lookup.py -v
```

**Step 3: Implement lookup functions**

```python
# tools/lookup.py
"""Lookup tools for Division 2 gear, weapons, talents, and skills."""

from tools.data_loader import load_data, search_data


def lookup_gear(query: str) -> dict | None:
    """Look up a gear set, brand set, exotic, or named item.

    Searches gear_sets, brand_sets, exotics, and named_items in order.
    """
    for source in ["gear_sets", "brand_sets", "exotics", "named_items"]:
        results = search_data(source, query)
        if results:
            return {"source": source, "results": results}
    return None


def lookup_weapon(query: str) -> dict | None:
    """Look up a weapon by name, type, or archetype."""
    # Search weapons file
    data = load_data("weapons")
    query_lower = query.lower()
    results = []

    for class_key, class_data in data.items():
        if not isinstance(class_data, dict):
            continue
        # Match on class name
        class_name = class_data.get("class", class_key).lower()
        if query_lower in class_name or query_lower in class_key:
            results.append(class_data)
            continue
        # Match on archetype names
        archetypes = class_data.get("archetypes", {})
        for arch_key, arch_data in archetypes.items():
            arch_name = arch_data.get("name", arch_key).lower()
            if query_lower in arch_name or query_lower in arch_key:
                results.append({"class": class_data.get("class"), "archetype": arch_data})

    # Also check exotics for exotic weapons
    exotic_results = search_data("exotics", query)
    weapon_exotics = [e for e in exotic_results if e.get("type") == "weapon"]
    if weapon_exotics:
        results.extend(weapon_exotics)

    return {"results": results} if results else None


def lookup_talent(query: str) -> dict | None:
    """Look up a gear or weapon talent."""
    for source in ["talents_gear", "talents_weapon"]:
        results = search_data(source, query)
        if results:
            return {"source": source, "results": results}
    return None


def lookup_skill(query: str) -> dict | None:
    """Look up a skill or skill variant."""
    data = load_data("skills")
    query_lower = query.lower()
    results = []

    for skill_key, skill_data in data.items():
        if not isinstance(skill_data, dict):
            continue
        skill_name = skill_data.get("name", skill_key).lower()
        if query_lower in skill_name:
            results.append(skill_data)
            continue
        # Search variants
        variants = skill_data.get("variants", {})
        for var_key, var_data in variants.items():
            var_name = var_data.get("name", var_key).lower()
            if query_lower in var_name or query_lower in var_key:
                results.append({"skill": skill_data.get("name"), "variant": var_data})

    return {"results": results} if results else None
```

**Step 4: Run tests**

```bash
uv run pytest tests/test_lookup.py -v
```

**Step 5: Commit**

```bash
git add tools/lookup.py tests/test_lookup.py
git commit -m "feat: implement gear/weapon/talent/skill lookup tools"
```

### Task 13: Implement stat calculator

**Files:**
- Modify: `tools/stat_calculator.py`
- Create: `tests/test_stat_calculator.py`

**Step 1: Write the failing tests**

```python
# tests/test_stat_calculator.py
"""Tests for stat calculator."""
from tools.stat_calculator import check_stats, compare_items


def test_check_stats_within_cap():
    result = check_stats({"critical_hit_chance": 55})
    assert result["critical_hit_chance"]["within_cap"] is True


def test_check_stats_over_cap():
    result = check_stats({"critical_hit_chance": 75})
    assert result["critical_hit_chance"]["within_cap"] is False
    assert result["critical_hit_chance"]["wasted"] == 15


def test_check_stats_no_cap():
    result = check_stats({"critical_hit_damage": 200})
    assert result["critical_hit_damage"]["within_cap"] is True


def test_compare_items():
    item_a = {"name": "Striker", "weapon_damage": 15, "rate_of_fire": 15}
    item_b = {"name": "Heartbreaker", "weapon_damage": 0, "armor_regen": True}
    result = compare_items(item_a, item_b)
    assert "comparison" in result
```

**Step 2: Run tests, verify failure**

```bash
uv run pytest tests/test_stat_calculator.py -v
```

**Step 3: Implement**

```python
# tools/stat_calculator.py
"""Stat calculation and validation tools for Division 2 builds."""

from tools.data_loader import load_data


def check_stats(stats: dict[str, float]) -> dict:
    """Validate stat allocations against known caps.

    Args:
        stats: Dict of stat_name -> value

    Returns:
        Dict with validation results per stat
    """
    data = load_data("stats")
    caps = data.get("caps", {})
    results = {}

    for stat_name, value in stats.items():
        cap_info = caps.get(stat_name, {})
        cap = cap_info.get("cap")

        if cap is None:
            # No hard cap
            results[stat_name] = {
                "value": value,
                "cap": None,
                "within_cap": True,
                "wasted": 0,
                "note": cap_info.get("soft_cap_note", "No hard cap"),
            }
        else:
            over = max(0, value - cap)
            results[stat_name] = {
                "value": value,
                "cap": cap,
                "within_cap": value <= cap,
                "wasted": over,
                "note": f"Over cap by {over}" if over > 0 else "OK",
            }

    return results


def compare_items(item_a: dict, item_b: dict) -> dict:
    """Compare two items or builds side-by-side.

    Args:
        item_a: First item/build dict
        item_b: Second item/build dict

    Returns:
        Comparison dict with advantages for each
    """
    all_keys = set(list(item_a.keys()) + list(item_b.keys()))
    comparison = {}

    for key in all_keys:
        val_a = item_a.get(key)
        val_b = item_b.get(key)
        comparison[key] = {"item_a": val_a, "item_b": val_b}

    return {"item_a_name": item_a.get("name", "A"), "item_b_name": item_b.get("name", "B"), "comparison": comparison}
```

**Step 4: Run tests**

```bash
uv run pytest tests/test_stat_calculator.py -v
```

**Step 5: Commit**

```bash
git add tools/stat_calculator.py tests/test_stat_calculator.py
git commit -m "feat: implement stat calculator with cap validation"
```

### Task 14: Implement synergy engine

**Files:**
- Modify: `tools/synergy_engine.py`
- Create: `tests/test_synergy_engine.py`

**Step 1: Write the failing tests**

```python
# tests/test_synergy_engine.py
"""Tests for synergy engine."""
from tools.synergy_engine import detect_synergies


def test_detect_synergies_with_known_combo():
    build_components = ["strikers_battlegear", "obliterate", "vigilance"]
    result = detect_synergies(build_components)
    assert isinstance(result, list)


def test_detect_synergies_empty():
    result = detect_synergies([])
    assert isinstance(result, list)
    assert len(result) == 0
```

**Step 2: Run tests, verify failure**

**Step 3: Implement**

```python
# tools/synergy_engine.py
"""Synergy detection engine for Division 2 builds."""

from tools.data_loader import load_data


def detect_synergies(build_components: list[str]) -> list[dict]:
    """Detect known synergies in a build's component list.

    Args:
        build_components: List of gear set IDs, talent IDs, weapon types, etc.

    Returns:
        List of matched synergy dicts with name, description, and match score
    """
    if not build_components:
        return []

    synergies_data = load_data("synergies")
    components_lower = {c.lower() for c in build_components}
    matched = []

    for syn_key, syn_data in synergies_data.items():
        if not isinstance(syn_data, dict):
            continue
        syn_components = syn_data.get("components", []) + syn_data.get("talents", []) + syn_data.get("weapons", [])
        syn_set = {c.lower() for c in syn_components}

        overlap = components_lower & syn_set
        if overlap:
            match_score = len(overlap) / len(syn_set) if syn_set else 0
            matched.append({
                "synergy": syn_data.get("name", syn_key),
                "matched_components": list(overlap),
                "total_components": len(syn_set),
                "match_score": round(match_score, 2),
                "notes": syn_data.get("notes", ""),
            })

    # Sort by match score descending
    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched
```

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git add tools/synergy_engine.py tests/test_synergy_engine.py
git commit -m "feat: implement synergy detection engine"
```

### Task 15: Implement build analyzer

**Files:**
- Modify: `tools/build_analyzer.py`
- Create: `tests/test_build_analyzer.py`

**Step 1: Write the failing tests**

```python
# tests/test_build_analyzer.py
"""Tests for build analyzer."""
from tools.build_analyzer import analyze_build, suggest_build


def test_analyze_build_basic():
    build = {
        "gear": ["strikers_battlegear", "strikers_battlegear", "strikers_battlegear",
                 "strikers_battlegear", "ceska", "grupo_sombra"],
        "weapons": ["military_m4", "police_m4"],
        "skills": ["assault_turret", "striker_drone"],
        "specialization": "technician",
    }
    result = analyze_build(build)
    assert "gear_set_bonuses" in result
    assert "suggestions" in result


def test_suggest_build():
    result = suggest_build(role="dps", mode="legendary")
    assert isinstance(result, list)
    assert len(result) > 0
```

**Step 2: Run tests, verify failure**

**Step 3: Implement**

```python
# tools/build_analyzer.py
"""Build analysis and suggestion tools for Division 2."""

from tools.data_loader import load_data, search_data
from tools.synergy_engine import detect_synergies


def analyze_build(build: dict) -> dict:
    """Analyze a build composition for set bonuses, synergies, and gaps.

    Args:
        build: Dict with keys: gear (list of IDs), weapons, skills, specialization

    Returns:
        Analysis dict with bonuses, synergies, strengths, weaknesses, suggestions
    """
    gear = build.get("gear", [])
    weapons = build.get("weapons", [])
    skills = build.get("skills", [])
    spec = build.get("specialization", "")

    # Count gear set pieces
    gear_counts = {}
    for piece in gear:
        gear_counts[piece] = gear_counts.get(piece, 0) + 1

    # Determine active set bonuses
    gear_sets = load_data("gear_sets")
    active_bonuses = []
    for gear_id, count in gear_counts.items():
        set_data = gear_sets.get(gear_id)
        if set_data:
            bonuses = set_data.get("bonuses", {})
            for threshold in ["2pc", "3pc", "4pc"]:
                needed = int(threshold[0])
                if count >= needed and threshold in bonuses:
                    active_bonuses.append({"set": set_data.get("name", gear_id), "bonus": threshold, "effect": bonuses[threshold]})

    # Detect synergies
    all_components = gear + weapons + skills + [spec]
    synergies = detect_synergies(all_components)

    # Generate suggestions
    suggestions = []
    if not any(b["bonus"] == "4pc" for b in active_bonuses) and len(set(gear)) > 4:
        suggestions.append("Consider consolidating to a 4-piece gear set for the 4pc talent.")
    if len(gear) == 6 and len(set(gear)) == 6:
        suggestions.append("All different brands — verify brand set bonuses are being activated (need 2-3pc of same brand).")

    return {
        "gear_set_bonuses": active_bonuses,
        "synergies": synergies,
        "suggestions": suggestions,
        "component_count": {"gear_pieces": len(gear), "weapons": len(weapons), "skills": len(skills)},
    }


def suggest_build(role: str, mode: str, constraints: list[str] | None = None) -> list[dict]:
    """Suggest builds for a given role and game mode.

    Args:
        role: Build role (dps, tank, healer, skill, hybrid)
        mode: Game mode (legendary, raid, pvp, countdown, etc.)
        constraints: Optional list of required gear/weapons

    Returns:
        List of suggested build dicts
    """
    synergies = load_data("synergies")
    suggestions = []

    role_lower = role.lower()
    mode_lower = mode.lower()

    for syn_key, syn_data in synergies.items():
        if not isinstance(syn_data, dict):
            continue
        syn_mode = str(syn_data.get("mode", "all")).lower()
        syn_notes = str(syn_data.get("notes", "")).lower()

        # Match on mode
        mode_match = mode_lower in syn_mode or syn_mode == "all"
        # Match on role (check components and notes)
        role_match = role_lower in syn_notes or role_lower in syn_key

        if mode_match and role_match:
            suggestions.append(syn_data)

    # If no exact matches, return all synergies for the mode
    if not suggestions:
        for syn_key, syn_data in synergies.items():
            if not isinstance(syn_data, dict):
                continue
            syn_mode = str(syn_data.get("mode", "all")).lower()
            if mode_lower in syn_mode or syn_mode == "all":
                suggestions.append(syn_data)

    return suggestions[:5]
```

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git add tools/build_analyzer.py tests/test_build_analyzer.py
git commit -m "feat: implement build analyzer and suggestion engine"
```

### Task 16: Wire all tools into MCP server

**Files:**
- Modify: `server.py`

**Step 1: Write full server.py with all 8 MCP tools**

```python
#!/usr/bin/env python3
"""Division 2 Build-Crafting Assistant MCP Server.

Provides 8 tools for querying Division 2 game data, analyzing builds,
detecting synergies, and validating stat allocations.
"""

from mcp.server.fastmcp import FastMCP
from tools.lookup import lookup_gear, lookup_weapon, lookup_talent, lookup_skill
from tools.build_analyzer import analyze_build, suggest_build
from tools.stat_calculator import check_stats, compare_items
from tools.synergy_engine import detect_synergies

# Create MCP server
mcp = FastMCP("shd-planner-cwd")


@mcp.tool()
def div2_lookup_gear(query: str) -> dict:
    """Look up any Division 2 gear set, brand set, exotic, or named item.

    Search by name, abbreviation, or keyword.
    Examples: "Striker", "SB", "Eclipse Protocol", "Coyote's Mask", "Fox's Prayer"
    """
    result = lookup_gear(query)
    if result is None:
        return {"error": f"No gear found matching '{query}'"}
    return result


@mcp.tool()
def div2_lookup_weapon(query: str) -> dict:
    """Look up Division 2 weapon stats, types, and archetypes.

    Search by weapon name, type, or archetype.
    Examples: "M4", "assault rifle", "LMG", "Pestilence", "Eagle Bearer"
    """
    result = lookup_weapon(query)
    if result is None:
        return {"error": f"No weapon found matching '{query}'"}
    return result


@mcp.tool()
def div2_lookup_talent(query: str) -> dict:
    """Look up a Division 2 gear or weapon talent.

    Search by talent name.
    Examples: "Obliterate", "Vigilance", "Glass Cannon", "Measured", "In Sync"
    """
    result = lookup_talent(query)
    if result is None:
        return {"error": f"No talent found matching '{query}'"}
    return result


@mcp.tool()
def div2_lookup_skill(query: str) -> dict:
    """Look up a Division 2 skill or skill variant.

    Search by skill name or variant name.
    Examples: "Assault Turret", "Striker Drone", "Restorer Hive", "Artificer"
    """
    result = lookup_skill(query)
    if result is None:
        return {"error": f"No skill found matching '{query}'"}
    return result


@mcp.tool()
def div2_analyze_build(
    gear: list[str],
    weapons: list[str],
    skills: list[str],
    specialization: str,
) -> dict:
    """Analyze a Division 2 build for set bonuses, synergies, and optimization opportunities.

    Args:
        gear: List of 6 gear piece IDs (gear set or brand set names)
        weapons: List of 2 weapon names/IDs
        skills: List of 2 skill variant names
        specialization: Specialization name
    """
    build = {
        "gear": gear,
        "weapons": weapons,
        "skills": skills,
        "specialization": specialization,
    }
    return analyze_build(build)


@mcp.tool()
def div2_suggest_build(role: str, mode: str, constraints: list[str] | None = None) -> dict:
    """Suggest Division 2 builds for a given role and game mode.

    Args:
        role: Build role - dps, tank, healer, skill, hybrid, cc
        mode: Game mode - legendary, raid, pvp, countdown, descent, general
        constraints: Optional list of required gear/weapons to include
    """
    results = suggest_build(role, mode, constraints)
    if not results:
        return {"message": f"No pre-built suggestions for role='{role}' mode='{mode}'. Try broader terms."}
    return {"suggestions": results}


@mcp.tool()
def div2_check_stats(stats: dict[str, float]) -> dict:
    """Validate Division 2 stat allocations against known caps.

    Check if stats exceed caps and identify wasted points.
    Example input: {"critical_hit_chance": 65, "critical_hit_damage": 180}
    """
    return check_stats(stats)


@mcp.tool()
def div2_compare(item_a: dict, item_b: dict) -> dict:
    """Compare two Division 2 items or builds side-by-side.

    Args:
        item_a: First item dict with name and stats
        item_b: Second item dict with name and stats
    """
    return compare_items(item_a, item_b)


def main():
    """Run the MCP server over stdio."""
    mcp.run()


if __name__ == "__main__":
    main()
```

**Step 2: Verify server loads without errors**

```bash
uv run python -c "import server; print('Server module loaded OK')"
```

**Step 3: Commit**

```bash
git add server.py
git commit -m "feat: wire all 8 tools into MCP server"
```

---

## Phase 4: Write Skill + Pattern

### Task 17: Write Claude Code skill

**Files:**
- Create: `skill/shd-planner-cwd.md`

**Step 1: Write the skill file**

The skill should define the expert persona, instruct use of MCP tools, and provide the build-crafting workflow. This is a Claude Code skill markdown file.

**Step 2: Commit**

```bash
git add skill/
git commit -m "feat: add Claude Code skill for Division 2 assistant"
```

### Task 18: Write standalone agentic pattern

**Files:**
- Create: `pattern/division2_buildcraft_v1.0_prompt.md`

**Step 1: Write the comprehensive pattern**

The pattern should work without the MCP server — containing embedded reference tables, build-crafting methodology, stat optimization framework, mode-specific advice, and synergy heuristics.

**Step 2: Commit**

```bash
git add pattern/
git commit -m "feat: add standalone Division 2 build-crafting agentic pattern"
```

---

## Phase 5: Registration + Documentation

### Task 19: Register MCP server in Claude Code

**Step 1: Register the server**

```bash
claude mcp add shd-planner-cwd -- uv run --directory /home/lkeneston/projects/shd-planner-cwd python server.py
```

**Step 2: Verify registration**

```bash
claude mcp list
```
Expected: `shd-planner-cwd` appears in the list

**Step 3: Test a tool call from Claude Code**

Start a new Claude Code session and ask: "Look up Striker's Battlegear gear set" — verify the `div2_lookup_gear` tool is called and returns data.

### Task 20: Write README.md, CHANGELOG.md, CLAUDE.md

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `CLAUDE.md`

**Step 1: Write README.md** with project overview, setup instructions, tool descriptions, usage examples

**Step 2: Write CHANGELOG.md** with initial v0.1.0 entry

**Step 3: Write CLAUDE.md** with project-specific instructions for Claude Code

**Step 4: Commit**

```bash
git add README.md CHANGELOG.md CLAUDE.md
git commit -m "docs: add README, CHANGELOG, and CLAUDE.md"
```

### Task 21: Run full test suite and final commit

**Step 1: Run all tests**

```bash
uv run pytest tests/ -v --tb=short
```
Expected: All pass

**Step 2: Run ruff lint**

```bash
uv run ruff check .
uv run ruff format --check .
```

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: lint fixes and final cleanup"
```

---

## Execution Notes

- **Tasks 2-9 (knowledge base)** should be dispatched as parallel research agents — they are independent
- **Tasks 11-15 (tools)** can be partially parallelized but task 11 (data_loader) must complete first
- **Task 16 (server wiring)** depends on all tool implementations
- **Tasks 17-18 (skill + pattern)** can run in parallel with Phase 3
- **Tasks 19-21 (registration + docs)** are sequential and final
