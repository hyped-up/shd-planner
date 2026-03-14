# Tom Clancy's The Division 2 - Build Showcase Repository

A comprehensive gaming reference repository for Division 2 containing optimized character builds, detailed guides, and automation tools.

## Repository Contents

### 📸 Build Showcase (96+ Builds)
- **Tiers 1-5**: Active meta builds organized by effectiveness
- **S-Series**: Specialized/situational builds (Purple variants, Improvised, PVP)
- **X-Series**: Archived builds for historical reference

### 📚 Comprehensive Guides (15+ Guides)
Located in `iKia.guides/` covering:
- Exotic and Named Item farming
- Loot system mechanics
- Weapon damage calculations
- Game modes (Countdown, Descent, Retaliation)
- Skills and Specializations
- Time-gated content tracking

### 🤖 AutoHotkey Macros
Automation scripts for repetitive in-game tasks:
- Expertise upgrades
- Vendor purchases
- Crafting automation
- Apparel cache opening

### 📁 Curated Build Collections
Pre-filtered builds organized by playstyle:
- `Strikers Recommended/` - AR/SMG damage stacking builds (10 builds)
- `Eclipse Recommended/` - Status effect builds
- `HF Recommended/` - Close-quarters combat builds
- `ND Recommended/` - Marksman/precision builds
- `Buff Builds Recommended/` - Group support builds
- `Conflict Recommended/` - PVP-optimized builds

## Quick Start

### Finding Builds

**By Tier and Number:**
```
Root directory: {Tier}.{Number} {Abbreviations} {Description}.jpg
Example: 1.01 TS OverD LMG.jpg
```

**By Playstyle:**
Navigate to curated subdirectories for ranked recommendations.

**By Gear Set or Weapon:**
Use file search for abbreviations:
- Gear Sets: TS, SB, HE, EP, ND, HF, UI, FI, etc.
- Weapons: LMG, AR, SMG, MMR, Shotty

### Build Abbreviations

**Common Gear Sets:**
- **SB/TS**: Striker (damage stacking)
- **EP**: Eclipse Protocol (status effects)
- **HF**: Hunter's Fury (close-quarters)
- **ND**: Negotiator's Dilemma (marksman)
- **HE**: High-End (exotics/named items)

**Common Talents:**
- **Obli/Vigi**: Obliterate/Vigilance
- **Tink**: Tinkerer
- **OverD**: Overdrive
- **Glass/PGlass**: Glass Cannon
- **Intimi/Adren**: Intimidate/Adrenaline Rush

Full abbreviation reference in [CLAUDE.md](CLAUDE.md#build-abbreviation-reference)

### Reference Documents

- **Build Showcase.xlsx**: Excel tracking for all builds with metadata
- **0.01 iKia_s Recommended Builds.docx**: Curated build recommendations
- **0.02 iKia_s Recommended Weapons & Talents.docx**: Weapon/talent tier lists

## Using AutoHotkey Macros

**Prerequisites:**
- AutoHotkey v1.1+ (not v2)
- Tom Clancy's The Division 2 running in windowed/borderless mode

**Execution:**
```bash
cd "iKia.guides/iKia_s Macros"
# Double-click .ahk file or run with AutoHotkey.exe
```

**Controls:**
- F2: Start macro
- F3: Reload macro
- F4: Exit macro (emergency stop)

**Safety:** Use only in appropriate contexts. Keep F4 accessible for emergency exit.

## Repository Structure

```
div_builds/
├── {Tier}.{Number} {Build}.jpg     # 96+ build screenshots (1920x1080)
├── Build Showcase.xlsx             # Build tracking spreadsheet
├── 0.00 AboutMe.docx              # Author introduction
├── 0.01 Recommended Builds.docx   # Build recommendations
├── 0.02 Recommended Weapons.docx  # Weapon/talent tier lists
├── Strikers Recommended/          # Curated Striker builds
├── Eclipse Recommended/           # Curated Eclipse builds
├── HF Recommended/                # Curated Hunter's Fury builds
├── ND Recommended/                # Curated Negotiator builds
├── Buff Builds Recommended/       # Curated support builds
├── Conflict Recommended/          # Curated PVP builds
└── iKia.guides/
    ├── 1.0-14.0 *.docx           # 15+ comprehensive guides
    ├── 98.0 Timeline Guide.docx   # Game history
    ├── 99.0 Wrong Texts.docx      # In-game text errors
    ├── Guide Images and Spreadsheets/
    └── iKia_s Macros/
        ├── *.ahk                  # Main macros
        └── Simplified Versions/   # Streamlined macros
```

## File Formats

- **Images**: .jpg (1920x1080 game screenshots)
- **Guides**: .docx (Microsoft Word documents)
- **Spreadsheets**: .xlsx (Microsoft Excel)
- **Macros**: .ahk (AutoHotkey v1 scripts)

## Important Notes

- **Build Context**: Builds reflect a specific game patch/meta state. Archived builds (X-Series) may no longer be viable.
- **Cross-References**: Guides reference each other by number (e.g., "See 3.0 Loot Sources Guide"). Maintain numbering.
- **Macro Safety**: AutoHotkey macros perform automated input. Use responsibly per game terms of service.
- **Resolution Dependency**: Macros calculate positions based on window size. Non-standard resolutions may require adjustment.

## Documentation

See [CLAUDE.md](CLAUDE.md) for comprehensive documentation including:
- Detailed tier system and naming conventions
- Complete abbreviation reference
- Build showcase management workflows
- Guide editing procedures
- Macro customization instructions

## Credits

Build showcase, guides, and macros created by **iKia** with contributions from **Dreamej** (macro configuration).

## Repository Location

Current path: `/home/lkeneston/projects/div_builds`
Previous path: `/home/lkeneston/projects/ikia`
