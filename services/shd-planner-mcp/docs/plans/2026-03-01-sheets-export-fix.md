# Google Sheets Export Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical data quality bugs and medium-severity missing fields in `export_to_sheets.py`.

**Architecture:** Surgical edits to the existing export script. Each `create_*_tab()` function gets a `_metadata` filter, corrected field references, and additional columns for missing high-value data. No structural changes to auth, retry, or rate-limit logic.

**Tech Stack:** Python 3.12, gspread, gspread-formatting (all already installed)

---

### Task 1: Add global `_metadata` filter helper and fix `safe_str`

**Files:**
- Modify: `export_to_sheets.py:73-95` (utility functions section)

**Step 1: Add `iter_entries()` helper after `load_json()`**

Add a helper that filters `_metadata` from data iteration. All tab functions will call this instead of `data.items()`.

```python
def iter_entries(data: dict):
    """Iterate data entries, skipping internal keys like _metadata."""
    for key, value in data.items():
        if key.startswith("_"):
            continue
        yield key, value
```

**Step 2: Run existing tests to confirm no regressions**

Run: `uv run pytest -v`
Expected: 106 passed

**Step 3: Commit**

```
feat(export): add iter_entries helper to filter _metadata keys
```

---

### Task 2: Fix Gear Sets tab

**Files:**
- Modify: `export_to_sheets.py` — `create_gear_sets_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)`
2. No other structural changes needed — this tab's field access is correct

```python
def create_gear_sets_tab(spreadsheet, data: dict):
    """Create the Gear Sets tab."""
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Gear Sets", rows=len(entries) + 1, cols=12)
    headers = ["Logo", "Name", "Abbrev", "2pc Bonus", "3pc Bonus", "4pc Talent", "4pc Description",
               "Chest Talent", "Backpack Talent", "Best Weapons", "Modes", "Tips"]
    ws.update(range_name="A1:L1", values=[headers])

    rows = []
    for key, gs in entries:
        # ... rest unchanged
```

**Step 1: Apply the change**
**Step 2: Verify lint clean** — `uv run ruff check export_to_sheets.py`
**Step 3: Commit** — `fix(export): filter _metadata from Gear Sets tab`

---

### Task 3: Fix Brand Sets tab

**Files:**
- Modify: `export_to_sheets.py` — `create_brand_sets_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)`
2. Include named item slot + talent detail: change `named_str` to show `"Name (Slot — Talent)"` format

```python
def create_brand_sets_tab(spreadsheet, data: dict):
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Brand Sets", rows=len(entries) + 1, cols=8)
    # headers unchanged
    ws.update(range_name="A1:H1", values=[headers])

    rows = []
    for key, bs in entries:
        bonuses = bs.get("bonuses", {})
        named = bs.get("named_items", [])
        # Include slot and talent in named item display
        named_parts = []
        for n in named:
            if isinstance(n, dict):
                name = n.get("name", "")
                slot = n.get("slot", "")
                talent = n.get("fixed_talent", "")
                detail = f"{name} ({slot}" + (f" — {talent})" if talent else ")")
                named_parts.append(detail)
            else:
                named_parts.append(str(n))
        named_str = ", ".join(named_parts)
        # ... rest unchanged, use named_str
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): filter _metadata and add named item details in Brand Sets tab`

---

### Task 4: Fix Exotics tab

**Files:**
- Modify: `export_to_sheets.py` — `create_exotics_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)`

The existing field access is correct (Exotics have `type`, `category`/`slot`, `unique_talent.name`, `unique_talent.description`, `core_attribute`, `source`, `meta_rating`, `best_with`, `notes`). No other changes needed.

```python
def create_exotics_tab(spreadsheet, data: dict):
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Exotics", rows=len(entries) + 1, cols=10)
    # ... rest unchanged, iterate `entries` instead of `data.items()`
```

**Step 1: Apply change**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): filter _metadata from Exotics tab`

---

### Task 5: Fix Named Items tab

**Files:**
- Modify: `export_to_sheets.py` — `create_named_items_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)`

Field access is already correct. No other changes.

**Step 1: Apply change**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): filter _metadata from Named Items tab`

---

### Task 6: Fix Weapons tab — icon keys + missing columns

**Files:**
- Modify: `export_to_sheets.py` — `WEAPON_CLASS_ICONS` dict and `create_weapons_tab()` function

**Changes:**
1. Fix `WEAPON_CLASS_ICONS` keys to match JSON `class` values (`"Submachine Guns"` not `"SMGs"`, `"Light Machine Guns"` not `"LMGs"`)
2. Replace `data.items()` with `iter_entries(data)` (though Weapons tab is safe since _metadata has no archetypes — do it for consistency)
3. Add columns: Named Variant, Exotic Variant
4. Update column count, headers, range, and widths

```python
WEAPON_CLASS_ICONS = {
    "Assault Rifles": "https://static.wikia.nocookie.net/thedivision/images/3/39/Assault_Rifle_icon.png",
    "Submachine Guns": "https://static.wikia.nocookie.net/thedivision/images/7/7d/SMG_icon.png",
    "Light Machine Guns": "https://static.wikia.nocookie.net/thedivision/images/0/0d/LMG_icon.png",
    "Marksman Rifles": "https://static.wikia.nocookie.net/thedivision/images/f/fa/Marksman_Rifle_icon.png",
    "Rifles": "https://static.wikia.nocookie.net/thedivision/images/a/a6/Rifle_icon.png",
    "Shotguns": "https://static.wikia.nocookie.net/thedivision/images/d/d7/Shotgun_icon.png",
    "Pistols": "https://static.wikia.nocookie.net/thedivision/images/4/47/Pistol_icon.png",
}
```

Updated `create_weapons_tab`:
```python
def create_weapons_tab(spreadsheet, data: dict):
    total = sum(len(cls.get("archetypes", {})) for _, cls in iter_entries(data))
    ws = spreadsheet.add_worksheet("Weapons", rows=total + 1, cols=12)
    headers = ["Class Icon", "Weapon Class", "Core Bonus", "Archetype", "RPM", "Magazine",
               "Reload (s)", "Range (m)", "Named Variant", "Exotic Variant", "Meta Tier", "Notes"]
    ws.update(range_name="A1:L1", values=[headers])

    rows = []
    for class_key, cls in iter_entries(data):
        # ...
        for arch_key, arch in cls.get("archetypes", {}).items():
            if not isinstance(arch, dict):
                continue
            rows.append([
                icon,
                class_name,
                core_bonus,
                arch.get("name", arch_key),
                arch.get("rpm", ""),
                arch.get("magazine", ""),
                arch.get("reload_s", ""),
                arch.get("optimal_range_m", ""),
                arch.get("named_variant", "") or "",
                arch.get("exotic_variant", "") or "",
                arch.get("meta_tier", ""),
                arch.get("meta_notes", ""),
            ])

    ws.update(range_name=f"A2:L{len(rows) + 1}", values=rows, value_input_option="USER_ENTERED")
    # Update column widths to include new columns
    set_column_widths(ws, [("A", 50), ("B", 140), ("C", 200), ("D", 160), ("E", 60),
                           ("F", 70), ("G", 80), ("H", 80), ("I", 140), ("J", 140), ("K", 70), ("L", 350)])
    apply_meta_rating_colors(ws, "K", rows, 10)
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): fix weapon icon keys and add named/exotic variant columns`

---

### Task 7: Fix Gear Talents tab — field mismatches + missing columns

**Files:**
- Modify: `export_to_sheets.py` — `create_gear_talents_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)`
2. Fix `meta_notes` → `notes` (correct field name)
3. Add `meta_rating` column with color coding
4. Add `pvp_modifier` column
5. Show `perfect_version.found_on` in perfect version column
6. Update column count, headers, range, widths

```python
def create_gear_talents_tab(spreadsheet, data: dict):
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Gear Talents", rows=len(entries) + 1, cols=9)
    headers = ["Name", "Slot", "Requirement", "Description", "Perfect Version",
               "Perfect Effect", "Found On", "Meta Rating", "PvP Modifier"]
    ws.update(range_name="A1:I1", values=[headers])

    rows = []
    for key, talent in entries:
        perfect = talent.get("perfect_version", {})
        rows.append([
            talent.get("name", key),
            talent.get("slot", ""),
            talent.get("requirement", ""),
            talent.get("description", ""),
            perfect.get("name", "") if isinstance(perfect, dict) else safe_str(perfect),
            perfect.get("description", "") if isinstance(perfect, dict) else "",
            perfect.get("found_on", "") if isinstance(perfect, dict) else "",
            talent.get("meta_rating", ""),
            talent.get("pvp_modifier", "") or "",
        ])

    ws.update(range_name=f"A2:I{len(rows) + 1}", values=rows)

    apply_header_format(ws, 9, TANK_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 160), ("B", 80), ("C", 150), ("D", 400), ("E", 160),
                           ("F", 400), ("G", 140), ("H", 80), ("I", 200)])
    apply_alternating_rows(ws, len(rows), 9)
    apply_meta_rating_colors(ws, "H", rows, 7)
    return ws
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): fix gear talent field names, add meta_rating/pvp_modifier columns`

---

### Task 8: Fix Weapon Talents tab — remove phantom column

**Files:**
- Modify: `export_to_sheets.py` — `create_weapon_talents_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)`
2. Remove `named_item` column (field doesn't exist)
3. Add `perfect_version.found_on` column instead
4. Update column count, headers, range, widths

```python
def create_weapon_talents_tab(spreadsheet, data: dict):
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Weapon Talents", rows=len(entries) + 1, cols=7)
    headers = ["Name", "Weapon Types", "Description", "Perfect Version",
               "Perfect Effect", "Found On", "Meta Notes"]
    ws.update(range_name="A1:G1", values=[headers])

    rows = []
    for key, talent in entries:
        perfect = talent.get("perfect_version", {})
        rows.append([
            talent.get("name", key),
            safe_str(talent.get("weapon_types", [])),
            talent.get("description", ""),
            perfect.get("name", "") if isinstance(perfect, dict) else safe_str(perfect),
            perfect.get("description", "") if isinstance(perfect, dict) else "",
            perfect.get("found_on", "") if isinstance(perfect, dict) else "",
            talent.get("meta_notes", ""),
        ])

    ws.update(range_name=f"A2:G{len(rows) + 1}", values=rows)

    apply_header_format(ws, 7, HEADER_BG)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 140), ("B", 200), ("C", 400), ("D", 160),
                           ("E", 400), ("F", 140), ("G", 300)])
    apply_alternating_rows(ws, len(rows), 7)
    return ws
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): remove phantom named_item column, add found_on for weapon talents`

---

### Task 9: Fix Skills tab — add mods + duration columns

**Files:**
- Modify: `export_to_sheets.py` — `create_skills_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)` (safe already but for consistency)
2. Add `Duration (T0)` and `Duration (T6)` columns
3. Add `Mods` column
4. Update column count, headers, range, widths

```python
def create_skills_tab(spreadsheet, data: dict):
    total = sum(len(sk.get("variants", {})) for _, sk in iter_entries(data))
    ws = spreadsheet.add_worksheet("Skills", rows=total + 1, cols=11)
    headers = ["Skill Type", "Variant Name", "Damage Type", "Scaling",
               "Cooldown (T0)", "Cooldown (T6)", "Duration (T0)", "Duration (T6)",
               "Mods", "Best For", "Notes"]
    ws.update(range_name="A1:K1", values=[headers])

    rows = []
    for skill_key, skill in iter_entries(data):
        skill_name = skill.get("name", skill_key)
        for var_key, var in skill.get("variants", {}).items():
            if not isinstance(var, dict):
                continue
            cooldown = var.get("cooldown_s", {})
            duration = var.get("duration_s", {})
            rows.append([
                skill_name,
                var.get("name", var_key),
                var.get("damage_type", ""),
                var.get("scaling", ""),
                cooldown.get("tier_0", "") if isinstance(cooldown, dict) else safe_str(cooldown),
                cooldown.get("tier_6", "") if isinstance(cooldown, dict) else "",
                duration.get("tier_0", "") if isinstance(duration, dict) else safe_str(duration) if duration else "",
                duration.get("tier_6", "") if isinstance(duration, dict) else "",
                safe_str(var.get("mods", [])),
                safe_str(var.get("best_for", [])),
                var.get("notes", ""),
            ])

    ws.update(range_name=f"A2:K{len(rows) + 1}", values=rows)

    apply_header_format(ws, 11, SKILL_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 120), ("B", 160), ("C", 80), ("D", 250), ("E", 90),
                           ("F", 90), ("G", 90), ("H", 90), ("I", 200), ("J", 250), ("K", 400)])
    apply_alternating_rows(ws, len(rows), 11)
    return ws
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): add duration and mods columns to Skills tab`

---

### Task 10: Fix Specializations tab

**Files:**
- Modify: `export_to_sheets.py` — `create_specializations_tab()` function

**Changes:**
1. Replace `data.items()` with `iter_entries(data)` — this tab actually produces a garbage row since _metadata has no inner loop to gate it
2. Add `Bonus Skill Tier` column
3. Show signature weapon description
4. Remove notes truncation (300 char limit)

```python
def create_specializations_tab(spreadsheet, data: dict):
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Specializations", rows=len(entries) + 1, cols=9)
    headers = ["Name", "Signature Weapon", "Sig Weapon Description", "Unique Skill", "Grenade",
               "Key Passives", "Weapon Damage Bonus", "Bonus Skill Tier", "Best For"]
    ws.update(range_name="A1:I1", values=[headers])

    rows = []
    for key, spec in entries:
        sig = spec.get("signature_weapon", {})
        rows.append([
            spec.get("name", key),
            sig.get("name", "") if isinstance(sig, dict) else safe_str(sig),
            sig.get("description", "") if isinstance(sig, dict) else "",
            safe_str(spec.get("unique_skill", "")),
            safe_str(spec.get("grenade", "")),
            safe_str(spec.get("key_passives", [])),
            spec.get("weapon_damage_bonus", ""),
            "Yes" if spec.get("bonus_skill_tier") else "No",
            safe_str(spec.get("best_for", [])),
        ])

    ws.update(range_name=f"A2:I{len(rows) + 1}", values=rows)

    apply_header_format(ws, 9, GENERAL_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 120), ("B", 180), ("C", 350), ("D", 160), ("E", 250),
                           ("F", 400), ("G", 200), ("H", 100), ("I", 250)])
    apply_alternating_rows(ws, len(rows), 9)
    return ws
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `fix(export): filter _metadata, add sig weapon desc and bonus skill tier to Specializations`

---

### Task 11: Expand Stats & Caps tab — add core/minor attributes and damage types

**Files:**
- Modify: `export_to_sheets.py` — `create_stats_tab()` function

**Changes:**
1. Add core attributes section (3 rows: red/blue/yellow)
2. Add minor attributes section (22 rows with max_roll, category, description)
3. Add damage types section (additive vs multiplicative lists)
4. Use section header rows to separate the sections visually

```python
def create_stats_tab(spreadsheet, data: dict):
    """Create the Stats & Caps tab with caps, core attrs, minor attrs, and damage types."""
    caps = data.get("caps", {})
    core_attrs = data.get("core_attributes", {})
    minor_attrs = data.get("minor_attributes", {})
    damage_types = data.get("damage_types", {})

    # === Section 1: Stat Caps ===
    cap_rows = []
    for key, cap_info in caps.items():
        if not isinstance(cap_info, dict):
            continue
        cap_val = cap_info.get("cap")
        cap_rows.append([
            cap_info.get("stat", key),
            key.replace("_", " ").title(),
            str(cap_val) + ("%" if cap_info.get("unit") == "percent" else "") if cap_val is not None else "No Cap",
            cap_info.get("unit", ""),
            cap_info.get("notes", ""),
        ])

    # === Section 2: Core Attributes ===
    core_rows = []
    for key, attr in core_attrs.items():
        if not isinstance(attr, dict):
            continue
        core_rows.append([
            attr.get("label", key),
            attr.get("stat", ""),
            str(attr.get("max_roll_per_piece", "")) + ("%" if attr.get("unit") == "percent" else ""),
            attr.get("icon_color", ""),
            attr.get("description", ""),
        ])

    # === Section 3: Minor Attributes ===
    minor_rows = []
    for key, attr in minor_attrs.items():
        if not isinstance(attr, dict):
            continue
        minor_rows.append([
            attr.get("stat", key),
            key.replace("_", " ").title(),
            str(attr.get("max_roll", "")) + ("%" if attr.get("unit") == "percent" else ""),
            attr.get("category", ""),
            attr.get("description", ""),
        ])

    # === Section 4: Damage Types ===
    additive = damage_types.get("additive", [])
    multiplicative = damage_types.get("multiplicative", [])
    dmg_rows = []
    for item in additive:
        if isinstance(item, dict):
            dmg_rows.append(["Additive", item.get("name", ""), item.get("description", ""), "", ""])
        elif isinstance(item, str):
            dmg_rows.append(["Additive", item, "", "", ""])
    for item in multiplicative:
        if isinstance(item, dict):
            dmg_rows.append(["Multiplicative", item.get("name", ""), item.get("description", ""), "", ""])
        elif isinstance(item, str):
            dmg_rows.append(["Multiplicative", item, "", "", ""])

    # Calculate total rows: section headers + data rows + spacing
    total = len(cap_rows) + len(core_rows) + len(minor_rows) + len(dmg_rows) + 8
    ws = spreadsheet.add_worksheet("Stats & Caps", rows=total + 1, cols=5)

    # Build all rows with section headers
    all_rows = []
    # Section 1 header
    all_rows.append(["=== STAT CAPS ===", "", "", "", ""])
    section1_headers = ["Abbreviation", "Stat Name", "Cap", "Unit", "Notes"]
    all_rows.append(section1_headers)
    all_rows.extend(cap_rows)
    all_rows.append(["", "", "", "", ""])

    # Section 2 header
    all_rows.append(["=== CORE ATTRIBUTES ===", "", "", "", ""])
    section2_headers = ["Label", "Stat", "Max Roll / Piece", "Color", "Description"]
    all_rows.append(section2_headers)
    all_rows.extend(core_rows)
    all_rows.append(["", "", "", "", ""])

    # Section 3 header
    all_rows.append(["=== MINOR ATTRIBUTES ===", "", "", "", ""])
    section3_headers = ["Abbreviation", "Stat Name", "Max Roll", "Category", "Description"]
    all_rows.append(section3_headers)
    all_rows.extend(minor_rows)
    all_rows.append(["", "", "", "", ""])

    # Section 4 header
    all_rows.append(["=== DAMAGE TYPES ===", "", "", "", ""])
    section4_headers = ["Type", "Bonus Name", "Description", "", ""]
    all_rows.append(section4_headers)
    all_rows.extend(dmg_rows)

    # Write header row (overarching)
    ws.update(range_name="A1:E1", values=[["Division 2 — Stats Reference", "", "", "", ""]])
    ws.update(range_name=f"A2:E{len(all_rows) + 1}", values=all_rows)

    apply_header_format(ws, 5, HEADER_BG)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 160), ("B", 200), ("C", 100), ("D", 100), ("E", 500)])

    # Format section header rows with accent color
    section_fmt = CellFormat(
        backgroundColor=Color(0.2, 0.2, 0.3),
        textFormat=TextFormat(bold=True, foregroundColor=HEADER_FG, fontSize=11),
    )
    from gspread_formatting import batch_updater
    row_offset = 2  # first data row
    section_header_positions = []
    r = row_offset
    section_header_positions.append(r); r += 1  # "=== STAT CAPS ==="
    r += 1 + len(cap_rows) + 1  # sub-header + data + blank
    section_header_positions.append(r); r += 1  # "=== CORE ATTRIBUTES ==="
    r += 1 + len(core_rows) + 1
    section_header_positions.append(r); r += 1  # "=== MINOR ATTRIBUTES ==="
    r += 1 + len(minor_rows) + 1
    section_header_positions.append(r)  # "=== DAMAGE TYPES ==="

    with batch_updater(ws.spreadsheet) as batch:
        for pos in section_header_positions:
            batch.format_cell_range(ws, f"{pos}:{pos}", section_fmt)

    return ws
```

**Step 1: Apply changes**
**Step 2: Lint check**
**Step 3: Commit** — `feat(export): expand Stats tab with core/minor attributes and damage types`

---

### Task 12: Add global text wrapping

**Files:**
- Modify: `export_to_sheets.py` — `apply_header_format()` or add new utility

**Changes:**
Add text wrapping to all data cells. Apply a `wrapStrategy: "WRAP"` format to the entire data range after writing rows.

```python
def apply_text_wrap(worksheet, num_rows: int, num_cols: int):
    """Apply text wrapping to all data cells."""
    last_col = chr(ord("A") + num_cols - 1) if num_cols <= 26 else "Z"
    wrap_fmt = CellFormat(wrapStrategy="WRAP")
    format_cell_range(worksheet, f"A2:{last_col}{num_rows + 1}", wrap_fmt)
```

Call `apply_text_wrap(ws, len(rows), num_cols)` at the end of every `create_*_tab()` function.

**Step 1: Add `apply_text_wrap` helper function**
**Step 2: Add `apply_text_wrap()` call to all 10 tab functions**
**Step 3: Lint check**
**Step 4: Commit** — `feat(export): add text wrapping to all tab data cells`

---

### Task 13: Update CHANGELOG.md and README.md

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md` (if tab counts or column lists changed)

**Changes to CHANGELOG.md:**
Add entry under v0.2.1 (or create v0.2.2):

```markdown
### Fixed

- `export_to_sheets.py` — `_metadata` rows no longer exported as data (affected 7 of 10 tabs)
- Gear Talents tab: fixed `meta_notes` → `notes` field reference, added `meta_rating` color coding
- Weapon Talents tab: removed phantom `named_item` column (field doesn't exist)
- Weapons tab: fixed icon key mismatch for Submachine Guns and Light Machine Guns

### Added

- Weapons tab: Named Variant and Exotic Variant columns
- Gear Talents tab: Meta Rating (color-coded) and PvP Modifier columns
- Weapon Talents tab: Found On column (which named item has the perfect version)
- Skills tab: Duration (T0/T6) and Mods columns
- Specializations tab: Signature Weapon Description and Bonus Skill Tier columns
- Stats tab: Core Attributes, Minor Attributes (22 entries with max rolls), and Damage Types sections
- Text wrapping on all data cells across all tabs
- Brand Sets tab: named items now show slot and talent detail
```

**Step 1: Apply CHANGELOG changes**
**Step 2: Update README if needed (tab column counts)**
**Step 3: Commit** — `docs: update changelog and readme for sheets export fixes`

---

### Task 14: Run the export and verify

**Step 1: Run full export**

```bash
uv run python export_to_sheets.py
```

Expected: Creates/updates "Division 2 — Complete Reference" with 10 tabs, no `_metadata` rows, all columns populated.

**Step 2: Run tests to confirm no regressions**

```bash
uv run pytest -v
```

Expected: 106 passed

**Step 3: Lint check**

```bash
uv run ruff check export_to_sheets.py
```

Expected: All checks passed

**Step 4: Final commit** — `chore: verify sheets export produces clean output`
