# Division 2 Google Sheets Export — Design Document

## Goal

Create a Python script (`export_to_sheets.py`) that reads all 12 JSON knowledge base files and exports them to a formatted Google Sheet with 10 tabs, color-coded headers, IMAGE() logo formulas, and meta rating highlighting.

## Auth Strategy

- **gspread + OAuth** — one-time browser login, refresh token persists indefinitely
- OAuth client ID created in Google Cloud Console (free, no billing)
- Credentials stored in `~/.config/gspread/` (never committed)

## Sheet Structure

**Sheet Name:** `Division 2 — Complete Reference`

### Tab 1: Gear Sets (22 rows)
Columns: Logo, Name, Abbreviation, 2pc Bonus, 3pc Bonus, 4pc Talent Name, 4pc Talent Description, Chest Talent, Backpack Talent, Best Weapons, Modes, Tips

### Tab 2: Brand Sets (33 rows)
Columns: Logo, Name, 1pc Bonus, 2pc Bonus, 3pc Bonus, Core Focus, Named Items, Meta Notes

### Tab 3: Exotics (49 rows)
Columns: Logo, Name, Type (weapon/armor), Slot, Unique Talent Name, Unique Talent Description, Core Attribute, Source, Meta Rating, Best With, Notes

### Tab 4: Named Items (44 rows)
Columns: Name, Brand, Type, Slot, Fixed Attribute, Core Attribute, Source, Meta Rating, Notes

### Tab 5: Weapons (45 rows — flattened archetypes)
Columns: Class Icon, Weapon Class, Archetype, RPM, Magazine, Reload Speed, Range, Notes

### Tab 6: Gear Talents (46 rows)
Columns: Name, Slot (Chest/Backpack), Requirement, Description, Perfect Version Name, Perfect Version Effect, Meta Notes

### Tab 7: Weapon Talents (59 rows)
Columns: Name, Weapon Types, Description, Perfect Version Name, Perfect Version Effect, Meta Notes

### Tab 8: Skills (42 rows — flattened variants)
Columns: Skill Icon, Skill Type, Variant Name, Description, Cooldown, Scaling Type, Mod Slots

### Tab 9: Specializations (6 rows)
Columns: Logo, Name, Signature Weapon, Unique Skill, Grenade, Key Passives

### Tab 10: Stats & Caps
Columns: Stat Name, Cap Value, Notes, Formula Reference

## Formatting

- Frozen Row 1 (headers) on all tabs
- Header style: bold white text, dark background (#1a1a2e for general, role-specific accents)
- Meta ratings: S=gold (#FFD700), A=green (#4CAF50), B=blue (#2196F3), C=gray (#9E9E9E), D=red (#F44336)
- Auto column widths with text wrapping
- `=IMAGE()` formulas for Division 2 Fandom Wiki icon URLs where available
- Alternating row colors for readability

## Tech Stack

- `gspread` — Google Sheets API wrapper
- `gspread-formatting` — cell formatting (colors, bold, borders)
- `google-auth-oauthlib` — OAuth browser flow
- `openpyxl` — not needed (direct to Sheets)

## Script Behavior

1. Load all JSON data files
2. Authenticate via OAuth (cached token or browser flow)
3. Create new spreadsheet (or update existing by name)
4. Create 10 tabs with headers
5. Populate data rows
6. Apply formatting (colors, freeze, filters, column widths)
7. Insert IMAGE() formulas for logos
8. Print shareable link

## File Location

`/home/lkeneston/projects/shd-planner-cwd/export_to_sheets.py`

## Dependencies (add to pyproject.toml)

```
gspread>=6.0
gspread-formatting>=1.2
google-auth-oauthlib>=1.0
```
