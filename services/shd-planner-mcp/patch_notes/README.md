# Patch Note Tracking Workflow

How to keep the Division 2 Assistant knowledge base current when Massive Entertainment releases game updates.

## Where to Find Official Patch Notes

- **Ubisoft Forums** — [forums.ubisoft.com/category/the-division-2](https://forums.ubisoft.com/category/the-division-2) (primary source, posted by Community Managers)
- **Reddit r/thedivision** — [reddit.com/r/thedivision](https://www.reddit.com/r/thedivision/) (patch threads pinned by moderators, often includes undocumented changes in comments)
- **In-game News Feed** — Check the title screen news panel after each maintenance window
- **Twitter/X @TheDivisionGame** — Maintenance announcements and patch links

## Patch Update Checklist

Follow these steps each time a Title Update or maintenance patch drops.

### 1. Read and categorize

Read the full patch notes. Identify which data categories are affected:

| Patch Change Type | JSON Files to Update |
|---|---|
| Weapon damage/RPM/handling | `weapons.json` |
| Gear set bonus changes | `gear_sets.json` |
| Brand set bonus changes | `brand_sets.json` |
| Exotic rework or addition | `exotics.json` |
| Named item changes | `named_items.json` |
| Gear talent adjustments | `talents_gear.json` |
| Weapon talent adjustments | `talents_weapon.json` |
| Skill damage/cooldown/behavior | `skills.json` |
| Specialization changes | `specializations.json` |
| Stat cap or scaling changes | `stats.json` |
| New synergies or meta shifts | `synergies.json` |
| Game mode changes (directives, etc.) | `modes.json` |

### 2. Update the JSON data files

Edit each affected file in `data/`. Match the existing structure and key naming conventions (snake_case IDs, nested objects for bonuses/variants).

### 3. Bump metadata in every changed file

Update the `_metadata` block at the top of each modified JSON file:

```json
{
    "_metadata": {
        "game_version": "TU21.2",
        "last_updated": "2026-04-15",
        "source": "manual"
    }
}
```

- `game_version` — the Title Update version from the patch notes header
- `last_updated` — the date you applied the changes (YYYY-MM-DD)

### 4. Run data validation tests

```bash
# Validate JSON structure and metadata across all data files
uv run pytest tests/test_data_validation.py -v
```

### 5. Run full test suite

```bash
# Ensure nothing is broken end-to-end
uv run pytest
```

Fix any failures before moving on.

### 6. Update the tracker

Add an entry to `patch_notes/update_history.json` recording what you changed. See the schema below.

### 7. Update CHANGELOG.md

Add a section to the project CHANGELOG under the current version or a new version heading.

## Tips by Patch Type

### Balance changes (weapon damage, talent values, stat caps)

These are the most common updates. Focus on numeric fields: `rpm`, `magazine`, `damage`, `bonus`, `cap`, `cooldown`. Grep the data files for the item name to find the exact location.

```bash
# Find where a specific item lives in the data files
grep -rl "eagle_bearer" data/
```

### New gear (sets, brands, exotics, named items)

Add a new top-level key in the appropriate JSON file using the same structure as existing entries. If the new gear introduces a talent, also add it to `talents_gear.json` or `talents_weapon.json`. Update `synergies.json` if the new gear enables recognized build archetypes.

### New specializations

Add the specialization to `specializations.json` with all fields: `name`, `weapon`, `grenade`, `tree`, `signature_weapon_damage`. Update `synergies.json` if the specialization unlocks new build strategies.

### Undocumented or stealth changes

Reddit threads often surface changes not in the official notes. Verify in-game before updating the knowledge base. Add a note in the `update_history.json` entry's `notes` field.

## Tracker Schema

Each entry in `patch_notes/update_history.json` follows this format:

```json
{
    "game_version": "TU21.2",
    "date_applied": "2026-04-15",
    "description": "Short summary of what changed",
    "files_changed": ["weapons.json", "talents_weapon.json"],
    "notes": "Optional context or caveats"
}
```

- `files_changed` — list the JSON filenames (without `data/` prefix), or `["all"]` for initial loads
- `notes` — mention sources, undocumented changes, or anything the next person should know
