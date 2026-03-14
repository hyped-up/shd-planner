#!/usr/bin/env python3
"""Export Division 2 knowledge base to a formatted Google Sheet.

Reads all 12 JSON data files and creates a multi-tab Google Sheet with
color-coded headers, IMAGE() logo formulas, and meta rating highlighting.

Usage:
    uv run python export_to_sheets.py
"""

import json
import time
from pathlib import Path

import gspread
from gspread_formatting import (
    CellFormat,
    Color,
    TextFormat,
    format_cell_range,
    set_frozen,
    set_column_widths,
)

DATA_DIR = Path(__file__).parent / "data"

# Division 2 Fandom Wiki icon URLs for IMAGE() formulas
GEAR_SET_ICONS = {
    "strikers_battlegear": "https://static.wikia.nocookie.net/thedivision/images/a/a0/Striker%27s_Battlegear_icon.png",
    "eclipse_protocol": "https://static.wikia.nocookie.net/thedivision/images/9/94/Eclipse_Protocol_icon.png",
    "heartbreaker": "https://static.wikia.nocookie.net/thedivision/images/b/b3/Heartbreaker_icon.png",
    "hunters_fury": "https://static.wikia.nocookie.net/thedivision/images/c/c5/Hunter%27s_Fury_icon.png",
    "foundry_bulwark": "https://static.wikia.nocookie.net/thedivision/images/7/71/Foundry_Bulwark_icon.png",
    "future_initiative": "https://static.wikia.nocookie.net/thedivision/images/6/66/Future_Initiative_icon.png",
    "negotiators_dilemma": "https://static.wikia.nocookie.net/thedivision/images/d/df/Negotiator%27s_Dilemma_icon.png",
    "true_patriot": "https://static.wikia.nocookie.net/thedivision/images/e/e5/True_Patriot_icon.png",
    "ongoing_directive": "https://static.wikia.nocookie.net/thedivision/images/d/d4/Ongoing_Directive_icon.png",
    "rigger": "https://static.wikia.nocookie.net/thedivision/images/0/0f/Rigger_icon.png",
    "tip_of_the_spear": "https://static.wikia.nocookie.net/thedivision/images/3/39/Tip_of_the_Spear_icon.png",
    "hard_wired": "https://static.wikia.nocookie.net/thedivision/images/f/f2/Hard_Wired_icon.png",
    "aces_and_eights": "https://static.wikia.nocookie.net/thedivision/images/5/59/Aces_%26_Eights_icon.png",
}

# Keys match the JSON "class" field values (e.g., "Submachine Guns" not "SMGs")
WEAPON_CLASS_ICONS = {
    "Assault Rifles": "https://static.wikia.nocookie.net/thedivision/images/3/39/Assault_Rifle_icon.png",
    "Submachine Guns": "https://static.wikia.nocookie.net/thedivision/images/7/7d/SMG_icon.png",
    "Light Machine Guns": "https://static.wikia.nocookie.net/thedivision/images/0/0d/LMG_icon.png",
    "Marksman Rifles": "https://static.wikia.nocookie.net/thedivision/images/f/fa/Marksman_Rifle_icon.png",
    "Rifles": "https://static.wikia.nocookie.net/thedivision/images/a/a6/Rifle_icon.png",
    "Shotguns": "https://static.wikia.nocookie.net/thedivision/images/d/d7/Shotgun_icon.png",
    "Pistols": "https://static.wikia.nocookie.net/thedivision/images/4/47/Pistol_icon.png",
}

# Color constants
HEADER_BG = Color(0.1, 0.1, 0.18)       # Dark navy (#1a1a2e)
HEADER_FG = Color(1, 1, 1)               # White
DPS_ACCENT = Color(0.9, 0.2, 0.2)       # Red
TANK_ACCENT = Color(0.2, 0.4, 0.9)      # Blue
SKILL_ACCENT = Color(0.9, 0.75, 0.1)    # Yellow
GENERAL_ACCENT = Color(0.95, 0.5, 0.1)  # Orange
ALT_ROW = Color(0.95, 0.95, 0.97)       # Light gray

# Meta rating colors
META_COLORS = {
    "S": Color(1, 0.84, 0),       # Gold
    "A": Color(0.3, 0.69, 0.31),  # Green
    "B": Color(0.13, 0.59, 0.95), # Blue
    "C": Color(0.62, 0.62, 0.62), # Gray
    "D": Color(0.96, 0.26, 0.21), # Red
}


def load_json(filename: str) -> dict:
    """Load a JSON data file."""
    with open(DATA_DIR / f"{filename}.json") as f:
        return json.load(f)


def iter_entries(data: dict):
    """Iterate data entries, skipping internal keys like _metadata."""
    for key, value in data.items():
        if key.startswith("_"):
            continue
        yield key, value


def safe_str(value, default="") -> str:
    """Convert a value to string safely."""
    if value is None:
        return default
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    if isinstance(value, dict):
        name = value.get("name", "")
        desc = value.get("description", "")
        return f"{name}: {desc}" if name else str(value)
    return str(value)


def image_formula(url: str) -> str:
    """Create a Google Sheets IMAGE() formula."""
    return f'=IMAGE("{url}", 1)'


def apply_header_format(worksheet, num_cols: int, accent: Color = HEADER_BG):
    """Apply formatting to the header row."""
    header_fmt = CellFormat(
        backgroundColor=accent,
        textFormat=TextFormat(bold=True, foregroundColor=HEADER_FG, fontSize=11),
        horizontalAlignment="CENTER",
    )
    format_cell_range(worksheet, "1:1", header_fmt)


def apply_alternating_rows(worksheet, num_rows: int, num_cols: int):
    """Apply alternating row colors using a single batch request."""
    from gspread_formatting import batch_updater

    with batch_updater(worksheet.spreadsheet) as batch:
        alt_fmt = CellFormat(backgroundColor=ALT_ROW)
        for row in range(3, num_rows + 2, 2):
            batch.format_cell_range(worksheet, f"{row}:{row}", alt_fmt)


def apply_text_wrap(worksheet, num_rows: int, num_cols: int):
    """Apply text wrapping to all data cells."""
    last_col = chr(ord("A") + min(num_cols, 26) - 1)
    wrap_fmt = CellFormat(wrapStrategy="WRAP")
    format_cell_range(worksheet, f"A2:{last_col}{num_rows + 1}", wrap_fmt)


def apply_meta_rating_colors(worksheet, col_letter: str, rows_data: list, col_index: int):
    """Color-code meta rating cells using a single batch request."""
    from gspread_formatting import batch_updater

    # Collect formatting requests; skip batch if none to avoid gspread empty-batch error.
    requests = []
    for i, row in enumerate(rows_data, start=2):
        rating = row[col_index] if col_index < len(row) else ""
        if rating in META_COLORS:
            requests.append((i, rating))

    if not requests:
        return

    with batch_updater(worksheet.spreadsheet) as batch:
        for i, rating in requests:
            color = META_COLORS[rating]
            fg = Color(0, 0, 0) if rating == "S" else Color(1, 1, 1)
            fmt = CellFormat(backgroundColor=color, textFormat=TextFormat(bold=True, foregroundColor=fg))
            batch.format_cell_range(worksheet, f"{col_letter}{i}", fmt)


# ---------------------------------------------------------------------------
# Tab creation functions
# ---------------------------------------------------------------------------
def create_gear_sets_tab(spreadsheet, data: dict):
    """Create the Gear Sets tab."""
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Gear Sets", rows=len(entries) + 1, cols=12)
    headers = ["Logo", "Name", "Abbrev", "2pc Bonus", "3pc Bonus", "4pc Talent", "4pc Description",
               "Chest Talent", "Backpack Talent", "Best Weapons", "Modes", "Tips"]
    ws.update(range_name="A1:L1", values=[headers])

    rows = []
    logos = []
    for key, gs in entries:
        bonuses = gs.get("bonuses", {})
        four_pc = bonuses.get("4pc", {})
        chest = gs.get("chest_talent", {})
        backpack = gs.get("backpack_talent", {})
        icon_url = GEAR_SET_ICONS.get(key, "")
        logo = image_formula(icon_url) if icon_url else ""

        rows.append([
            gs.get("name", key),
            gs.get("abbreviation", ""),
            safe_str(bonuses.get("2pc", "")),
            safe_str(bonuses.get("3pc", "")),
            safe_str(four_pc.get("name", "")) if isinstance(four_pc, dict) else safe_str(four_pc),
            safe_str(four_pc.get("description", "")) if isinstance(four_pc, dict) else "",
            f"{chest.get('name', '')}: {chest.get('description', '')}" if chest else "",
            f"{backpack.get('name', '')}: {backpack.get('description', '')}" if backpack else "",
            safe_str(gs.get("optimal_weapons", [])),
            safe_str(gs.get("modes", [])),
            safe_str(gs.get("tips", [])),
        ])
        logos.append([logo])

    # Logo column uses USER_ENTERED for =IMAGE() formulas; data columns use RAW to avoid
    # Sheets misinterpreting values like "+15% Weapon Handling" as formulas.
    ws.update(range_name=f"A2:A{len(logos) + 1}", values=logos, value_input_option="USER_ENTERED")
    ws.update(range_name=f"B2:L{len(rows) + 1}", values=rows, value_input_option="RAW")

    apply_header_format(ws, 12, DPS_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 50), ("B", 180), ("C", 60), ("D", 200), ("E", 200),
                           ("F", 180), ("G", 350), ("H", 350), ("I", 350), ("J", 200), ("K", 200), ("L", 350)])
    apply_alternating_rows(ws, len(rows), 12)
    apply_text_wrap(ws, len(rows), 12)
    return ws


def create_brand_sets_tab(spreadsheet, data: dict):
    """Create the Brand Sets tab."""
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Brand Sets", rows=len(entries) + 1, cols=8)
    headers = ["Name", "1pc Bonus", "2pc Bonus", "3pc Bonus", "Core Focus", "Named Items", "Available Slots", "Meta Notes"]
    ws.update(range_name="A1:H1", values=[headers])

    rows = []
    for key, bs in entries:
        bonuses = bs.get("bonuses", {})
        named = bs.get("named_items", [])
        # Include slot and talent detail for each named item
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

        rows.append([
            bs.get("name", key),
            safe_str(bonuses.get("1pc", "")),
            safe_str(bonuses.get("2pc", "")),
            safe_str(bonuses.get("3pc", "")),
            bs.get("core_focus", ""),
            named_str,
            safe_str(bs.get("available_slots", [])),
            bs.get("meta_notes", ""),
        ])

    ws.update(range_name=f"A2:H{len(rows) + 1}", values=rows)

    apply_header_format(ws, 8, DPS_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 180), ("B", 200), ("C", 200), ("D", 200), ("E", 80),
                           ("F", 350), ("G", 250), ("H", 350)])
    apply_alternating_rows(ws, len(rows), 8)
    apply_text_wrap(ws, len(rows), 8)
    return ws


def create_exotics_tab(spreadsheet, data: dict):
    """Create the Exotics tab."""
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Exotics", rows=len(entries) + 1, cols=10)
    headers = ["Name", "Type", "Category/Slot", "Talent Name", "Talent Description",
               "Core Attribute", "Source", "Meta Rating", "Best With", "Notes"]
    ws.update(range_name="A1:J1", values=[headers])

    rows = []
    for key, ex in entries:
        talent = ex.get("unique_talent", {})
        rows.append([
            ex.get("name", key),
            ex.get("type", ""),
            ex.get("category", ex.get("slot", "")),
            talent.get("name", "") if isinstance(talent, dict) else safe_str(talent),
            talent.get("description", "") if isinstance(talent, dict) else "",
            safe_str(ex.get("core_attribute", "")),
            ex.get("source", ""),
            ex.get("meta_rating", ""),
            safe_str(ex.get("best_with", [])),
            ex.get("notes", ""),
        ])

    ws.update(range_name=f"A2:J{len(rows) + 1}", values=rows)

    apply_header_format(ws, 10, GENERAL_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 180), ("B", 70), ("C", 120), ("D", 180), ("E", 400),
                           ("F", 120), ("G", 300), ("H", 80), ("I", 250), ("J", 350)])
    apply_alternating_rows(ws, len(rows), 10)
    apply_text_wrap(ws, len(rows), 10)
    apply_meta_rating_colors(ws, "H", rows, 7)
    return ws


def create_named_items_tab(spreadsheet, data: dict):
    """Create the Named Items tab."""
    entries = list(iter_entries(data))
    ws = spreadsheet.add_worksheet("Named Items", rows=len(entries) + 1, cols=9)
    headers = ["Name", "Brand", "Type", "Slot", "Fixed Attribute", "Core Attribute", "Source", "Meta Rating", "Notes"]
    ws.update(range_name="A1:I1", values=[headers])

    rows = []
    for key, ni in entries:
        rows.append([
            ni.get("name", key),
            ni.get("brand", ""),
            ni.get("type", ""),
            ni.get("slot", ""),
            ni.get("fixed_attribute", ""),
            safe_str(ni.get("core_attribute", "")),
            ni.get("source", ""),
            ni.get("meta_rating", ""),
            ni.get("notes", ""),
        ])

    ws.update(range_name=f"A2:I{len(rows) + 1}", values=rows)

    apply_header_format(ws, 9, DPS_ACCENT)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 180), ("B", 160), ("C", 70), ("D", 100), ("E", 350),
                           ("F", 120), ("G", 300), ("H", 80), ("I", 350)])
    apply_alternating_rows(ws, len(rows), 9)
    apply_text_wrap(ws, len(rows), 9)
    apply_meta_rating_colors(ws, "H", rows, 7)
    return ws


def create_weapons_tab(spreadsheet, data: dict):
    """Create the Weapons tab with flattened archetypes."""
    # Count total archetypes (skip _metadata)
    total = sum(len(cls.get("archetypes", {})) for _, cls in iter_entries(data))
    ws = spreadsheet.add_worksheet("Weapons", rows=total + 1, cols=12)
    headers = ["Class Icon", "Weapon Class", "Core Bonus", "Archetype", "RPM", "Magazine",
               "Reload (s)", "Range (m)", "Named Variant", "Exotic Variant", "Meta Tier", "Notes"]
    ws.update(range_name="A1:L1", values=[headers])

    rows = []
    icons = []
    for class_key, cls in iter_entries(data):
        class_name = cls.get("class", class_key)
        core_bonus = cls.get("core_bonus", "")
        icon_url = WEAPON_CLASS_ICONS.get(class_name, "")
        icon = image_formula(icon_url) if icon_url else ""

        for arch_key, arch in cls.get("archetypes", {}).items():
            if not isinstance(arch, dict):
                continue
            rows.append([
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
            icons.append([icon])

    # Icon column uses USER_ENTERED for =IMAGE() formulas; data columns use RAW.
    ws.update(range_name=f"A2:A{len(icons) + 1}", values=icons, value_input_option="USER_ENTERED")
    ws.update(range_name=f"B2:L{len(rows) + 1}", values=rows, value_input_option="RAW")

    apply_header_format(ws, 12, HEADER_BG)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 50), ("B", 140), ("C", 200), ("D", 160), ("E", 60),
                           ("F", 70), ("G", 80), ("H", 80), ("I", 140), ("J", 140), ("K", 70), ("L", 350)])
    apply_alternating_rows(ws, len(rows), 12)
    apply_text_wrap(ws, len(rows), 12)
    apply_meta_rating_colors(ws, "K", rows, 9)
    return ws


def create_gear_talents_tab(spreadsheet, data: dict):
    """Create the Gear Talents tab."""
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
    apply_text_wrap(ws, len(rows), 9)
    apply_meta_rating_colors(ws, "H", rows, 7)
    return ws


def create_weapon_talents_tab(spreadsheet, data: dict):
    """Create the Weapon Talents tab."""
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
    apply_text_wrap(ws, len(rows), 7)
    return ws


def create_skills_tab(spreadsheet, data: dict):
    """Create the Skills tab with flattened variants."""
    # Count total variants (skip _metadata)
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
                duration.get("tier_0", "") if isinstance(duration, dict) else (safe_str(duration) if duration else ""),
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
    apply_text_wrap(ws, len(rows), 11)
    return ws


def create_specializations_tab(spreadsheet, data: dict):
    """Create the Specializations tab."""
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
    apply_text_wrap(ws, len(rows), 9)
    return ws


def create_stats_tab(spreadsheet, data: dict):
    """Create the Stats & Caps tab with caps, core attributes, minor attributes, and damage types."""
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
        max_roll = attr.get("max_roll_per_piece", "")
        unit = attr.get("unit", "")
        core_rows.append([
            attr.get("label", key),
            attr.get("stat", ""),
            f"{max_roll}{'%' if unit == 'percent' else ''}" if max_roll != "" else "",
            attr.get("icon_color", ""),
            attr.get("description", ""),
        ])

    # === Section 3: Minor Attributes ===
    minor_rows = []
    for key, attr in minor_attrs.items():
        if not isinstance(attr, dict):
            continue
        max_roll = attr.get("max_roll", "")
        unit = attr.get("unit", "")
        minor_rows.append([
            attr.get("stat", key),
            key.replace("_", " ").title(),
            f"{max_roll}{'%' if unit == 'percent' else ''}" if max_roll != "" else "",
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

    # Build all rows with section dividers
    all_rows = []
    all_rows.append(["STAT CAPS", "", "", "", ""])
    all_rows.append(["Abbreviation", "Stat Name", "Cap", "Unit", "Notes"])
    all_rows.extend(cap_rows)
    all_rows.append(["", "", "", "", ""])

    all_rows.append(["CORE ATTRIBUTES", "", "", "", ""])
    all_rows.append(["Label", "Stat", "Max Roll / Piece", "Color", "Description"])
    all_rows.extend(core_rows)
    all_rows.append(["", "", "", "", ""])

    all_rows.append(["MINOR ATTRIBUTES", "", "", "", ""])
    all_rows.append(["Abbreviation", "Stat Name", "Max Roll", "Category", "Description"])
    all_rows.extend(minor_rows)
    all_rows.append(["", "", "", "", ""])

    all_rows.append(["DAMAGE TYPES", "", "", "", ""])
    all_rows.append(["Type", "Bonus Name", "Description", "", ""])
    all_rows.extend(dmg_rows)

    total = len(all_rows)
    ws = spreadsheet.add_worksheet("Stats & Caps", rows=total + 1, cols=5)

    # Top-level header
    ws.update(range_name="A1:E1", values=[["Division 2 — Stats Reference", "", "", "", ""]])
    ws.update(range_name=f"A2:E{total + 1}", values=all_rows)

    apply_header_format(ws, 5, HEADER_BG)
    set_frozen(ws, rows=1)
    set_column_widths(ws, [("A", 160), ("B", 200), ("C", 100), ("D", 100), ("E", 500)])

    # Format section divider rows with accent color
    section_fmt = CellFormat(
        backgroundColor=Color(0.2, 0.2, 0.3),
        textFormat=TextFormat(bold=True, foregroundColor=HEADER_FG, fontSize=11),
    )
    # Sub-header rows (column labels within each section)
    subheader_fmt = CellFormat(
        backgroundColor=Color(0.85, 0.85, 0.9),
        textFormat=TextFormat(bold=True, fontSize=10),
    )

    from gspread_formatting import batch_updater

    # Calculate section divider row positions (1-indexed, offset by header row + data start at row 2)
    section_positions = []
    subheader_positions = []
    r = 2  # first all_rows entry is at spreadsheet row 2
    # Section 1: STAT CAPS
    section_positions.append(r)
    r += 1
    subheader_positions.append(r)
    r += 1
    r += len(cap_rows) + 1  # data rows + blank
    # Section 2: CORE ATTRIBUTES
    section_positions.append(r)
    r += 1
    subheader_positions.append(r)
    r += 1
    r += len(core_rows) + 1
    # Section 3: MINOR ATTRIBUTES
    section_positions.append(r)
    r += 1
    subheader_positions.append(r)
    r += 1
    r += len(minor_rows) + 1
    # Section 4: DAMAGE TYPES
    section_positions.append(r)
    r += 1
    subheader_positions.append(r)

    with batch_updater(ws.spreadsheet) as batch:
        for pos in section_positions:
            batch.format_cell_range(ws, f"{pos}:{pos}", section_fmt)
        for pos in subheader_positions:
            batch.format_cell_range(ws, f"{pos}:{pos}", subheader_fmt)

    apply_text_wrap(ws, total, 5)
    return ws


# ---------------------------------------------------------------------------
# Auth and main
# ---------------------------------------------------------------------------
def authenticate():
    """Authenticate with Google using OAuth with local redirect server."""
    creds_file = Path.home() / ".config/gspread" / "credentials.json"
    token_file = Path.home() / ".config/gspread" / "authorized_user.json"

    # If we already have a saved token, use it
    if token_file.exists():
        gc = gspread.oauth(
            credentials_filename=str(creds_file),
            authorized_user_filename=str(token_file),
        )
        return gc

    # OAuth flow using local server on port 8080
    from google_auth_oauthlib.flow import InstalledAppFlow

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    flow = InstalledAppFlow.from_client_secrets_file(str(creds_file), scopes)
    print()
    print("A browser window should open. If not, copy the URL below and open it manually.")
    print("After signing in, you'll be redirected back automatically.")
    print()
    creds = flow.run_local_server(port=8080, open_browser=True)

    # Save the token for future runs
    token_data = {
        "type": "authorized_user",
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "refresh_token": creds.refresh_token,
    }
    with open(token_file, "w") as f:
        json.dump(token_data, f)
    print(f"Token saved to {token_file}")

    return gspread.authorize(creds)


def main():
    """Main export function."""
    print("Authenticating with Google Sheets...")
    gc = authenticate()

    print("Loading knowledge base...")
    gear_sets = load_json("gear_sets")
    brand_sets = load_json("brand_sets")
    exotics = load_json("exotics")
    named_items = load_json("named_items")
    weapons = load_json("weapons")
    talents_gear = load_json("talents_gear")
    talents_weapon = load_json("talents_weapon")
    skills = load_json("skills")
    specializations = load_json("specializations")
    stats = load_json("stats")

    # Create or open spreadsheet
    sheet_name = "Division 2 — Complete Reference"
    try:
        spreadsheet = gc.open(sheet_name)
        print(f"Updating existing spreadsheet: {sheet_name}")
        # Delete all existing non-default worksheets, keep one alive
        worksheets = spreadsheet.worksheets()
        if len(worksheets) > 1:
            # Keep last sheet temporarily so we don't delete all sheets
            for ws in worksheets[:-1]:
                try:
                    spreadsheet.del_worksheet(ws)
                    time.sleep(2)
                except Exception:
                    pass
            # Rename last remaining sheet to Sheet1 as placeholder
            remaining = spreadsheet.worksheets()[0]
            try:
                remaining.update_title("Sheet1")
            except Exception:
                pass
        elif worksheets:
            try:
                worksheets[0].update_title("Sheet1")
            except Exception:
                pass
    except gspread.SpreadsheetNotFound:
        print(f"Creating new spreadsheet: {sheet_name}")
        spreadsheet = gc.create(sheet_name)

    time.sleep(5)  # Let API settle after cleanup

    # Create all tabs with small delays to avoid rate limits
    tabs = [
        ("Gear Sets", create_gear_sets_tab, gear_sets),
        ("Brand Sets", create_brand_sets_tab, brand_sets),
        ("Exotics", create_exotics_tab, exotics),
        ("Named Items", create_named_items_tab, named_items),
        ("Weapons", create_weapons_tab, weapons),
        ("Gear Talents", create_gear_talents_tab, talents_gear),
        ("Weapon Talents", create_weapon_talents_tab, talents_weapon),
        ("Skills", create_skills_tab, skills),
        ("Specializations", create_specializations_tab, specializations),
        ("Stats & Caps", create_stats_tab, stats),
    ]

    for i, (name, func, data) in enumerate(tabs):
        print(f"Creating {name} tab... ({i + 1}/{len(tabs)})")
        # Retry with backoff on rate limit errors
        for attempt in range(3):
            try:
                func(spreadsheet, data)
                break
            except gspread.exceptions.APIError as e:
                if "429" in str(e) and attempt < 2:
                    wait = 30 * (attempt + 1)
                    print(f"  Rate limited, waiting {wait}s before retry...")
                    time.sleep(wait)
                else:
                    raise
        # Pause between tabs to stay under API rate limits (60 writes/min)
        time.sleep(10)

    # Remove the default Sheet1 if it still exists
    try:
        default_sheet = spreadsheet.worksheet("Sheet1")
        spreadsheet.del_worksheet(default_sheet)
    except gspread.WorksheetNotFound:
        pass

    print()
    print("=" * 60)
    print("EXPORT COMPLETE")
    print("=" * 60)
    print(f"Spreadsheet: {sheet_name}")
    print(f"URL: {spreadsheet.url}")
    print(f"Tabs: {len(spreadsheet.worksheets())}")
    print()
    print("Tabs created:")
    for ws in spreadsheet.worksheets():
        print(f"  - {ws.title} ({ws.row_count - 1} rows)")
    print()


if __name__ == "__main__":
    main()
