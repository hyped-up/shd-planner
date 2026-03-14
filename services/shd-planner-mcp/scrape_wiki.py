#!/usr/bin/env python3
"""
Scrape Division 2 data from the Fandom wiki and output JSON matching the existing data/ schema.

Usage:
    uv run python scrape_wiki.py [--category gear_sets|weapons|talents|all] [--dry-run] [--output-dir data/]

Options:
    --category      Which data category to scrape (default: all)
    --dry-run       Print what would be fetched without writing files
    --merge         Merge scraped data with existing JSON (preserving manual additions
                    like meta_rating, tips, best_with that the wiki doesn't have)
    --output-dir    Directory to write JSON output (default: data/)
    --verbose       Show detailed progress and debug info

NOTE: This scraper uses the MediaWiki API (api.php) to fetch structured wikitext,
avoiding Cloudflare bot protection that blocks direct HTML page requests. Wiki data
may be incomplete or formatted differently than our local schema. Always review
scraped output before committing.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from pathlib import Path
from typing import Any

import httpx

# MediaWiki API endpoint for the Division 2 Fandom wiki
WIKI_API_URL = "https://thedivision.fandom.com/api.php"

# Wiki page titles for each data category (used with action=parse&page=...)
# These use the actual Fandom wiki page titles (with subpage slash notation)
WIKI_PAGES: dict[str, list[str]] = {
    "gear_sets": [
        "Gear_Sets/Tom_Clancy's_The_Division_2",
    ],
    "weapons": [
        "Weapons_in_Tom_Clancy's_The_Division/Tom_Clancy's_The_Division_2",
    ],
    "talents": [
        "Talents/Tom_Clancy's_The_Division_2",
    ],
}

# Minimum delay between HTTP requests (seconds) for rate limiting
REQUEST_DELAY_SECONDS: float = 1.0

# Fields in our local JSON that are manually curated and should NOT be overwritten by wiki data
MANUAL_FIELDS_GEAR_SETS: set[str] = {
    "meta_rating",
    "tips",
    "synergies",
    "optimal_weapons",
    "playstyle",
    "modes",
    "abbreviation",
}
MANUAL_FIELDS_WEAPONS: set[str] = {
    "meta_tier",
    "meta_notes",
}
MANUAL_FIELDS_TALENTS: set[str] = {
    "meta_rating",
    "notes",
    "synergies",
}

# Configure logging
logger = logging.getLogger("scrape_wiki")


# ---------------------------------------------------------------------------
# Wikitext parsers (replace HTML parsers)
# ---------------------------------------------------------------------------
def strip_wikitext(text: str) -> str:
    """Remove wikitext markup and return plain text.

    Handles [[links]], {{templates}}, '''bold''', ''italic'', HTML tags,
    and <ref> tags.
    """
    # Remove <ref>...</ref> and <ref ... /> tags
    text = re.sub(r"<ref[^>]*>.*?</ref>", "", text, flags=re.DOTALL)
    text = re.sub(r"<ref[^/]*/\s*>", "", text)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Handle [[File:...]] and [[Image:...]] links — remove entirely
    text = re.sub(r"\[\[(?:File|Image):[^\]]*\]\]", "", text, flags=re.IGNORECASE)
    # Handle [[link|display text]] — keep display text
    text = re.sub(r"\[\[[^|\]]*\|([^\]]+)\]\]", r"\1", text)
    # Handle [[simple links]] — keep link text
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)
    # Remove {{templates}} — simple removal (nested templates handled iteratively)
    for _ in range(3):
        text = re.sub(r"\{\{[^{}]*\}\}", "", text)
    # Remove '''bold''' and ''italic''
    text = re.sub(r"'{2,3}", "", text)
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _strip_cell_attributes(cell_text: str) -> str:
    """Remove MediaWiki cell style attributes (e.g., 'valign="top"|' prefix)."""
    # Match attribute patterns like: valign="top"| or style="..."|
    # Only strip if the pipe is part of attribute syntax, not a wikilink
    attr_match = re.match(r'^[^[{]*?\|\s*', cell_text)
    if attr_match and "[[" not in attr_match.group(0) and "{{" not in attr_match.group(0):
        return cell_text[attr_match.end():]
    return cell_text


def parse_wikitext_table(wikitext: str) -> list[list[str]]:
    """Parse a single MediaWiki table ({| ... |}) into a list of rows.

    Each row is a list of cell strings with wikitext markup stripped.
    Handles |- row separators (including |-=== variants), ! header cells,
    | data cells, multi-line cells, and style attribute prefixes.
    """
    rows: list[list[str]] = []
    current_row: list[str] = []
    # Track whether we're accumulating continuation lines for a cell
    accumulating = False

    for line in wikitext.splitlines():
        stripped = line.strip()

        # Table start/end markers
        if stripped.startswith("{|"):
            continue
        if stripped.startswith("|}"):
            if accumulating and current_row:
                # Finalize the last cell's accumulated text
                current_row[-1] = strip_wikitext(current_row[-1]).strip()
            if current_row:
                rows.append(current_row)
                current_row = []
            accumulating = False
            continue

        # Row separator (handles |- and |-===... variants)
        if stripped.startswith("|-"):
            if accumulating and current_row:
                current_row[-1] = strip_wikitext(current_row[-1]).strip()
            if current_row:
                rows.append(current_row)
                current_row = []
            accumulating = False
            continue

        # Header cell(s) — ! cell1 !! cell2
        if stripped.startswith("!"):
            if accumulating and current_row:
                current_row[-1] = strip_wikitext(current_row[-1]).strip()
            accumulating = False

            cells = re.split(r"\s*!!\s*", stripped[1:])
            for cell in cells:
                cell = _strip_cell_attributes(cell)
                cell_clean = cell.strip()
                if cell_clean:
                    current_row.append(cell_clean)
                    accumulating = False
                else:
                    # Empty after stripping — content is on the next line
                    current_row.append("")
                    accumulating = True
            continue

        # Data cell(s) — | cell1 || cell2
        if stripped.startswith("|"):
            if accumulating and current_row:
                current_row[-1] = strip_wikitext(current_row[-1]).strip()
            accumulating = False

            cells = re.split(r"\s*\|\|\s*", stripped[1:])
            for cell in cells:
                cell = _strip_cell_attributes(cell)
                cell_clean = cell.strip()
                if cell_clean:
                    current_row.append(cell_clean)
                    accumulating = False
                else:
                    # Empty after stripping — content is on the next line
                    current_row.append("")
                    accumulating = True
            continue

        # Continuation line — append to current cell if accumulating
        if accumulating and current_row and stripped:
            if current_row[-1]:
                current_row[-1] += "\n" + stripped
            else:
                current_row[-1] = stripped
            continue

    # Flush last row
    if accumulating and current_row:
        current_row[-1] = strip_wikitext(current_row[-1]).strip()
    if current_row:
        rows.append(current_row)

    # Final pass: strip wikitext from all cells
    return [[strip_wikitext(cell).strip() for cell in row] for row in rows]


def parse_all_wikitext_tables(wikitext: str) -> list[list[list[str]]]:
    """Extract all MediaWiki tables from wikitext and parse each one."""
    tables: list[list[list[str]]] = []
    # Find all {| ... |} blocks
    table_pattern = re.compile(r"(\{\|.*?\|\})", re.DOTALL)
    for match in table_pattern.finditer(wikitext):
        table_text = match.group(1)
        parsed = parse_wikitext_table(table_text)
        if parsed:
            tables.append(parsed)
    return tables


def parse_wikitext_sections(wikitext: str) -> list[dict[str, Any]]:
    """Split wikitext on == heading == markers.

    Returns a list of dicts: [{heading, content, level}].
    Level 2 = ==heading==, level 3 = ===heading===, etc.
    """
    sections: list[dict[str, Any]] = []
    current_heading = ""
    current_level = 0
    current_lines: list[str] = []

    for line in wikitext.splitlines():
        heading_match = re.match(r"^(={2,})\s*(.+?)\s*\1\s*$", line)
        if heading_match:
            # Save previous section
            if current_heading or current_lines:
                sections.append({
                    "heading": current_heading,
                    "content": "\n".join(current_lines).strip(),
                    "level": current_level,
                })
            current_level = len(heading_match.group(1))
            current_heading = heading_match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    # Flush last section
    if current_heading or current_lines:
        sections.append({
            "heading": current_heading,
            "content": "\n".join(current_lines).strip(),
            "level": current_level,
        })

    return sections


# ---------------------------------------------------------------------------
# HTTP fetching with rate limiting (MediaWiki API)
# ---------------------------------------------------------------------------
class WikiFetcher:
    """HTTP client for fetching wiki data via the MediaWiki API with rate limiting."""

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run
        self._last_request_time: float = 0.0
        self._client = httpx.Client(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Division2AssistantScraper/2.0 (educational; rate-limited; MediaWiki API)"
            },
        )

    def fetch_wikitext(self, page_title: str) -> str | None:
        """Fetch wikitext for a wiki page via the MediaWiki API.

        Returns the raw wikitext content or None on error.
        """
        api_url = f"{WIKI_API_URL}?action=parse&page={page_title}&prop=wikitext&format=json"

        if self.dry_run:
            logger.info("[DRY-RUN] Would fetch: %s", api_url)
            return None

        # Enforce rate limiting
        elapsed = time.monotonic() - self._last_request_time
        if elapsed < REQUEST_DELAY_SECONDS:
            sleep_time = REQUEST_DELAY_SECONDS - elapsed
            logger.debug("Rate limiting: sleeping %.2fs", sleep_time)
            time.sleep(sleep_time)

        logger.info("Fetching: %s", api_url)
        try:
            response = self._client.get(api_url)
            self._last_request_time = time.monotonic()
            response.raise_for_status()

            data = response.json()

            # Check for API errors
            if "error" in data:
                logger.error("MediaWiki API error for '%s': %s", page_title, data["error"].get("info", "unknown"))
                return None

            # Extract wikitext from the response
            wikitext = data.get("parse", {}).get("wikitext", {}).get("*")
            if not wikitext:
                logger.warning("No wikitext found for page: %s", page_title)
                return None

            logger.debug("Fetched %d chars of wikitext for: %s", len(wikitext), page_title)
            return wikitext

        except httpx.HTTPStatusError as exc:
            logger.error("HTTP %d fetching %s: %s", exc.response.status_code, api_url, exc)
            return None
        except httpx.RequestError as exc:
            logger.error("Request error fetching %s: %s", api_url, exc)
            return None

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------
def slugify(name: str) -> str:
    """Convert a display name to a snake_case ID suitable for JSON keys."""
    slug = name.lower().strip()
    # Remove possessives
    slug = slug.replace("'s", "s").replace("\u2019s", "s")
    # Replace special characters with underscores
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    # Strip leading/trailing underscores
    slug = slug.strip("_")
    return slug


def load_existing_json(filepath: Path) -> dict[str, Any]:
    """Load an existing JSON file or return an empty dict if missing."""
    if filepath.exists():
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_json(data: Any, filepath: Path, dry_run: bool = False) -> None:
    """Write data to a JSON file with consistent formatting."""
    if dry_run:
        logger.info("[DRY-RUN] Would write %d bytes to %s", len(json.dumps(data)), filepath)
        return

    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    logger.info("Wrote %s", filepath)


def merge_data(
    existing: dict[str, Any],
    scraped: dict[str, Any],
    manual_fields: set[str],
) -> dict[str, Any]:
    """
    Merge scraped data into existing data, preserving manually curated fields.

    For each key in scraped:
    - If the key exists in existing, update wiki-sourced fields but keep manual_fields
    - If the key is new, add it as-is from scraped data
    """
    merged = dict(existing)

    for key, scraped_item in scraped.items():
        if key in merged and isinstance(merged[key], dict) and isinstance(scraped_item, dict):
            # Preserve manual fields from existing data
            for field in manual_fields:
                if field in merged[key]:
                    scraped_item[field] = merged[key][field]
            merged[key] = {**merged[key], **scraped_item}
        else:
            merged[key] = scraped_item

    return merged


# ---------------------------------------------------------------------------
# Gear set scraper
# ---------------------------------------------------------------------------
def scrape_gear_sets(fetcher: WikiFetcher) -> dict[str, Any]:
    """
    Scrape gear set data from the Division 2 Fandom wiki via MediaWiki API.

    Returns a dict keyed by snake_case gear set IDs matching the gear_sets.json schema.
    """
    result: dict[str, Any] = {}

    for page_title in WIKI_PAGES["gear_sets"]:
        wikitext = fetcher.fetch_wikitext(page_title)
        if wikitext is None:
            continue

        # Parse tables from the wikitext
        tables = parse_all_wikitext_tables(wikitext)

        for table in tables:
            if len(table) < 2:
                continue

            # Look for tables that have gear set-like headers
            headers = [cell.lower().strip() for cell in table[0]]

            # Try to identify gear set name and bonus columns
            name_col = _find_column(headers, ["name", "gear set", "set name", "set"])
            if name_col == -1:
                continue

            for row in table[1:]:
                if len(row) <= name_col:
                    continue

                name = row[name_col].strip()
                if not name or name.lower() in ("name", "gear set", "set name"):
                    continue

                gear_set_id = slugify(name)
                gear_set: dict[str, Any] = {
                    "id": gear_set_id,
                    "name": name,
                    "gear_slots": ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
                    "bonuses": {},
                }

                # Try to extract bonus columns
                bonus_2pc_col = _find_column(headers, ["2 piece", "2pc", "2-piece", "2 pc"])
                bonus_3pc_col = _find_column(headers, ["3 piece", "3pc", "3-piece", "3 pc"])
                bonus_4pc_col = _find_column(headers, ["4 piece", "4pc", "4-piece", "4 pc", "talent"])

                if bonus_2pc_col != -1 and len(row) > bonus_2pc_col:
                    gear_set["bonuses"]["2pc"] = row[bonus_2pc_col].strip()
                if bonus_3pc_col != -1 and len(row) > bonus_3pc_col:
                    gear_set["bonuses"]["3pc"] = row[bonus_3pc_col].strip()
                if bonus_4pc_col != -1 and len(row) > bonus_4pc_col:
                    four_pc_text = row[bonus_4pc_col].strip()
                    gear_set["bonuses"]["4pc"] = {
                        "name": _extract_talent_name(four_pc_text),
                        "description": four_pc_text,
                    }

                result[gear_set_id] = gear_set
                logger.debug("Parsed gear set: %s", name)

    # If the main table parse didn't yield results, try individual gear set pages
    if not result:
        logger.info("Main gear set table parse found no results; trying individual pages")
        result = _scrape_gear_sets_individual(fetcher)

    # Also try parsing sections for gear set detail blocks
    if not result:
        for page_title in WIKI_PAGES["gear_sets"]:
            wikitext = fetcher.fetch_wikitext(page_title)
            if wikitext is None:
                continue
            result = _parse_gear_sets_from_sections(wikitext)

    return result


def _parse_gear_sets_from_sections(wikitext: str) -> dict[str, Any]:
    """Parse gear set data from wikitext section headings and content."""
    result: dict[str, Any] = {}
    sections = parse_wikitext_sections(wikitext)

    for section in sections:
        heading = section["heading"]
        content = section["content"]
        level = section["level"]

        # Skip non-gear-set sections
        if level < 2 or not heading:
            continue

        # Skip TOC, references, navigation sections
        skip_headings = {"contents", "references", "navigation", "see also", "notes", "external links", "trivia"}
        if heading.lower() in skip_headings:
            continue

        name = strip_wikitext(heading)
        gear_set_id = slugify(name)

        if not gear_set_id or len(gear_set_id) < 2:
            continue

        gear_set: dict[str, Any] = {
            "id": gear_set_id,
            "name": name,
            "gear_slots": ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
            "bonuses": {},
        }

        # Extract bonuses from section content
        plain_content = strip_wikitext(content)
        bonus_patterns = [
            (r"2[\s-]*(?:piece|pc)[^:]*:\s*(.+?)(?=3[\s-]*(?:piece|pc)|$)", "2pc"),
            (r"3[\s-]*(?:piece|pc)[^:]*:\s*(.+?)(?=4[\s-]*(?:piece|pc)|$)", "3pc"),
            (r"4[\s-]*(?:piece|pc)[^:]*:\s*(.+?)(?=chest|backpack|$)", "4pc"),
        ]

        for pattern, key in bonus_patterns:
            match = re.search(pattern, plain_content, re.IGNORECASE | re.DOTALL)
            if match:
                bonus_text = re.sub(r"\s+", " ", match.group(1).strip())
                if key == "4pc":
                    gear_set["bonuses"][key] = {
                        "name": _extract_talent_name(bonus_text),
                        "description": bonus_text,
                    }
                else:
                    gear_set["bonuses"][key] = bonus_text

        result[gear_set_id] = gear_set
        logger.debug("Parsed gear set from section: %s", name)

    return result


def _scrape_gear_sets_individual(fetcher: WikiFetcher) -> dict[str, Any]:
    """
    Fallback: scrape individual gear set wiki pages via the MediaWiki API.
    """
    result: dict[str, Any] = {}

    # Known gear set page names (these are stable wiki page titles)
    known_sets = [
        "Striker%27s_Battlegear",
        "Eclipse_Protocol",
        "Hunter%27s_Fury",
        "Negotiator%27s_Dilemma",
        "Ongoing_Directive",
        "True_Patriot",
        "Future_Initiative",
        "Foundry_Bulwark",
        "Hard_Wired",
        "Heartbreaker",
        "Tip_of_the_Spear",
        "Aces_%26_Eights",
        "System_Corruption",
        "Rigger",
    ]

    for set_page in known_sets:
        wikitext = fetcher.fetch_wikitext(set_page)
        if wikitext is None:
            continue

        # Try to get the page title from the wikitext (first heading or fallback to page name)
        title_match = re.search(r"^=\s*(.+?)\s*=$", wikitext, re.MULTILINE)
        if title_match:
            name = strip_wikitext(title_match.group(1))
        else:
            name = set_page.replace("_", " ").replace("%27", "'").replace("%26", "&")

        gear_set_id = slugify(name)
        text = strip_wikitext(wikitext)

        gear_set: dict[str, Any] = {
            "id": gear_set_id,
            "name": name,
            "gear_slots": ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
            "bonuses": {},
        }

        # Extract 2pc, 3pc, 4pc bonuses from page text
        bonus_patterns = [
            (r"2[\s-]*(?:piece|pc)[^:]*:\s*(.+?)(?=3[\s-]*(?:piece|pc)|$)", "2pc"),
            (r"3[\s-]*(?:piece|pc)[^:]*:\s*(.+?)(?=4[\s-]*(?:piece|pc)|$)", "3pc"),
            (r"4[\s-]*(?:piece|pc)[^:]*:\s*(.+?)(?=chest|backpack|$)", "4pc"),
        ]

        for pattern, key in bonus_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                bonus_text = re.sub(r"\s+", " ", match.group(1).strip())
                if key == "4pc":
                    gear_set["bonuses"][key] = {
                        "name": _extract_talent_name(bonus_text),
                        "description": bonus_text,
                    }
                else:
                    gear_set["bonuses"][key] = bonus_text

        # Extract chest and backpack talents
        chest_match = re.search(
            r"chest\s*(?:talent)?[^:]*:\s*(.+?)(?=backpack|$)", text, re.IGNORECASE | re.DOTALL
        )
        if chest_match:
            chest_text = re.sub(r"\s+", " ", chest_match.group(1).strip())
            gear_set["chest_talent"] = {
                "name": _extract_talent_name(chest_text),
                "description": chest_text,
            }

        backpack_match = re.search(
            r"backpack\s*(?:talent)?[^:]*:\s*(.+?)(?=\n\n|gear\s*slots|$)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if backpack_match:
            bp_text = re.sub(r"\s+", " ", backpack_match.group(1).strip())
            gear_set["backpack_talent"] = {
                "name": _extract_talent_name(bp_text),
                "description": bp_text,
            }

        result[gear_set_id] = gear_set
        logger.debug("Parsed gear set (individual page): %s", name)

    return result


# ---------------------------------------------------------------------------
# Weapon scraper
# ---------------------------------------------------------------------------
def scrape_weapons(fetcher: WikiFetcher) -> dict[str, Any]:
    """
    Scrape weapon data from the Division 2 Fandom wiki via MediaWiki API.

    Returns a dict keyed by weapon class matching the weapons.json schema.
    """
    result: dict[str, Any] = {}

    for page_title in WIKI_PAGES["weapons"]:
        wikitext = fetcher.fetch_wikitext(page_title)
        if wikitext is None:
            continue

        # Parse all tables and sections from the wikitext
        tables = parse_all_wikitext_tables(wikitext)
        sections = parse_wikitext_sections(wikitext)

        # Try to match tables to weapon class sections
        for table in tables:
            if len(table) < 2:
                continue

            headers = [cell.lower().strip() for cell in table[0]]

            # Look for weapon stat columns
            name_col = _find_column(headers, ["name", "weapon", "model"])
            rpm_col = _find_column(headers, ["rpm", "rate of fire", "fire rate"])
            mag_col = _find_column(headers, ["mag", "magazine", "mag size", "capacity"])

            if name_col == -1:
                continue

            # Determine weapon class from nearby heading or table context
            weapon_class = _guess_weapon_class_from_table(table, sections)
            class_id = slugify(weapon_class) if weapon_class else "unknown"

            if class_id not in result:
                result[class_id] = {
                    "class": weapon_class or "Unknown",
                    "core_bonus": _get_core_bonus(class_id),
                    "archetypes": {},
                }

            for row in table[1:]:
                if len(row) <= name_col:
                    continue

                weapon_name = row[name_col].strip()
                if not weapon_name or weapon_name.lower() in ("name", "weapon", "model"):
                    continue

                weapon_id = slugify(weapon_name)
                weapon: dict[str, Any] = {
                    "name": weapon_name,
                    "variants": [],
                    "named_variant": None,
                    "exotic_variant": None,
                }

                # Extract RPM
                if rpm_col != -1 and len(row) > rpm_col:
                    try:
                        weapon["rpm"] = int(re.sub(r"[^\d]", "", row[rpm_col]))
                    except ValueError:
                        pass

                # Extract magazine size
                if mag_col != -1 and len(row) > mag_col:
                    try:
                        weapon["magazine"] = int(re.sub(r"[^\d]", "", row[mag_col]))
                    except ValueError:
                        pass

                result[class_id]["archetypes"][weapon_id] = weapon
                logger.debug("Parsed weapon: %s (%s)", weapon_name, weapon_class)

        # Also try extracting weapon info from section headings if tables didn't produce results
        if not result:
            result = _parse_weapons_from_sections(sections)

    return result


def _parse_weapons_from_sections(sections: list[dict[str, Any]]) -> dict[str, Any]:
    """Parse weapon classes from section headings when no tables are found."""
    result: dict[str, Any] = {}

    weapon_class_map = {
        "assault rifle": "Assault Rifles",
        "smg": "Submachine Guns",
        "submachine gun": "Submachine Guns",
        "lmg": "Light Machine Guns",
        "light machine gun": "Light Machine Guns",
        "rifle": "Rifles",
        "marksman rifle": "Marksman Rifles",
        "shotgun": "Shotguns",
        "pistol": "Pistols",
    }

    for section in sections:
        heading_lower = section["heading"].lower()
        matched_class = None
        for keyword, class_name in weapon_class_map.items():
            if keyword in heading_lower:
                matched_class = class_name
                break

        if not matched_class:
            continue

        class_id = slugify(matched_class)
        if class_id not in result:
            result[class_id] = {
                "class": matched_class,
                "core_bonus": _get_core_bonus(class_id),
                "archetypes": {},
            }

        # Extract weapon names from list items in the section content
        for line in section["content"].splitlines():
            line = line.strip()
            if line.startswith("*") or line.startswith("#"):
                weapon_name = strip_wikitext(line.lstrip("*# ")).strip()
                if weapon_name and len(weapon_name) > 1:
                    weapon_id = slugify(weapon_name)
                    result[class_id]["archetypes"][weapon_id] = {
                        "name": weapon_name,
                        "variants": [],
                        "named_variant": None,
                        "exotic_variant": None,
                    }
                    logger.debug("Parsed weapon from section: %s (%s)", weapon_name, matched_class)

    return result


# ---------------------------------------------------------------------------
# Talent scraper
# ---------------------------------------------------------------------------
def scrape_talents(fetcher: WikiFetcher) -> dict[str, Any]:
    """
    Scrape gear talent data from the Division 2 Fandom wiki via MediaWiki API.

    Returns a dict keyed by snake_case talent IDs matching the talents_gear.json schema.
    """
    result: dict[str, Any] = {}

    for page_title in WIKI_PAGES["talents"]:
        wikitext = fetcher.fetch_wikitext(page_title)
        if wikitext is None:
            continue

        # Parse sections to process each talent table with its slot context
        sections = parse_wikitext_sections(wikitext)

        for section in sections:
            heading = section["heading"].lower()
            content = section["content"]

            # Determine slot from section heading
            if "weapon" in heading:
                section_slot = "weapon"
            elif "chest" in heading:
                section_slot = "chest"
            elif "backpack" in heading:
                section_slot = "backpack"
            else:
                continue

            # Parse tables within this section
            tables = parse_all_wikitext_tables(content)

            for table in tables:
                if len(table) < 2:
                    continue

                headers = [cell.lower().strip() for cell in table[0]]

                # Try standard column detection first
                name_col = _find_column(headers, ["name", "talent", "weapon talent", "chestpiece talent", "backpack talent"])
                desc_col = _find_column(headers, ["description", "effect", "bonus", "normal", "desc"])
                perfect_col = _find_column(headers, ["perfect"])
                req_col = _find_column(headers, ["requirement", "requirements", "weapon type"])

                # If standard detection fails, assume fixed 4-column layout:
                # [talent_name, normal_desc, perfect_desc, requirements]
                if name_col == -1 and len(table[0]) >= 2:
                    name_col = 0
                    desc_col = 1
                    if len(table[0]) >= 3:
                        perfect_col = 2
                    if len(table[0]) >= 4:
                        req_col = 3

                if name_col == -1:
                    continue

                for row in table[1:]:
                    if len(row) <= name_col:
                        continue

                    talent_name = row[name_col].strip()
                    if not talent_name or talent_name.lower() in ("name", "talent"):
                        continue

                    # Remove slot suffix from talent names like "Braced (Chest)"
                    talent_name_clean = re.sub(r"\s*\((?:Chest|Backpack|Weapon)\)\s*$", "", talent_name, flags=re.IGNORECASE).strip()

                    talent_id = slugify(talent_name_clean)

                    # Get description (normal version)
                    description = ""
                    if desc_col != -1 and len(row) > desc_col:
                        description = row[desc_col].strip()

                    # Extract perfect version
                    perfect_text = ""
                    if perfect_col != -1 and len(row) > perfect_col:
                        perfect_text = row[perfect_col].strip()

                    # Fall back to perfect version text if normal description is empty
                    if not description and perfect_text:
                        description = perfect_text

                    talent: dict[str, Any] = {
                        "id": talent_id,
                        "name": talent_name_clean,
                        "description": description,
                        "slot": section_slot,
                        "requirement": "none",
                        "perfect_version": perfect_text if perfect_text else None,
                        "pvp_modifier": None,
                    }

                    # Extract requirements
                    if req_col != -1 and len(row) > req_col:
                        req_text = row[req_col].strip()
                        if req_text:
                            talent["requirement"] = req_text

                    result[talent_id] = talent
                    logger.debug("Parsed talent: %s (slot=%s)", talent_name_clean, section_slot)

    return result


def _guess_talent_slot_from_context(
    table: list[list[str]], sections: list[dict[str, Any]]
) -> str | None:
    """Guess talent slot (chest/backpack/weapon) from nearby section headings."""
    # Check all text in the table for slot hints
    all_text = " ".join(" ".join(row) for row in table).lower()

    if "chest" in all_text and "backpack" not in all_text:
        return "chest"
    if "backpack" in all_text and "chest" not in all_text:
        return "backpack"

    # Check section headings for context
    for section in sections:
        heading_lower = section["heading"].lower()
        if "weapon" in heading_lower:
            return "weapon"
        if "chest" in heading_lower:
            return "chest"
        if "backpack" in heading_lower:
            return "backpack"

    return None


# ---------------------------------------------------------------------------
# Helper functions for parsing
# ---------------------------------------------------------------------------
def _find_column(headers: list[str], candidates: list[str]) -> int:
    """Find the index of a column header matching any candidate string."""
    for i, header in enumerate(headers):
        for candidate in candidates:
            if candidate in header:
                return i
    return -1


def _extract_talent_name(text: str) -> str:
    """Try to extract a talent name from the beginning of a description text."""
    # Look for a pattern like "Talent Name: description..." or "Talent Name - description..."
    match = re.match(r"^([A-Z][^:.!?\n]{2,40})[:.!\-]\s*", text)
    if match:
        return match.group(1).strip()
    # If no clear separator, use the first few words
    words = text.split()
    if len(words) >= 2:
        return " ".join(words[:3])
    return text[:30]


def _guess_weapon_class_from_table(
    table: list[list[str]], sections: list[dict[str, Any]]
) -> str | None:
    """Guess weapon class from table content or nearby section headings."""
    weapon_classes = {
        "assault rifle": "Assault Rifles",
        "smg": "Submachine Guns",
        "submachine": "Submachine Guns",
        "lmg": "Light Machine Guns",
        "light machine": "Light Machine Guns",
        "rifle": "Rifles",
        "marksman": "Marksman Rifles",
        "shotgun": "Shotguns",
        "pistol": "Pistols",
    }

    # Search all cells in the table for class keywords
    all_text = " ".join(" ".join(row) for row in table).lower()
    for keyword, class_name in weapon_classes.items():
        if keyword in all_text:
            return class_name

    return None


def _get_core_bonus(class_id: str) -> str:
    """Return the core attribute bonus for a weapon class."""
    core_bonuses = {
        "assault_rifles": "Weapon Damage (Health Damage)",
        "submachine_guns": "Critical Hit Chance",
        "smgs": "Critical Hit Chance",
        "light_machine_guns": "Damage to Targets out of Cover",
        "lmgs": "Damage to Targets out of Cover",
        "rifles": "Critical Hit Damage",
        "marksman_rifles": "Headshot Damage",
        "shotguns": "Melee Damage",
        "pistols": "Damage to Targets out of Cover (varies by variant)",
    }
    return core_bonuses.get(class_id, "Unknown")


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def run_scraper(
    categories: list[str],
    output_dir: Path,
    dry_run: bool = False,
    merge: bool = False,
) -> None:
    """
    Run the wiki scraper for the specified categories.

    Args:
        categories: List of category names to scrape (gear_sets, weapons, talents).
        output_dir: Directory to write output JSON files.
        dry_run: If True, only show what would be fetched/written.
        merge: If True, merge with existing JSON preserving manual fields.
    """
    fetcher = WikiFetcher(dry_run=dry_run)

    # Map of category to (scraper function, output filename, manual fields)
    category_config: dict[str, tuple[Any, str, set[str]]] = {
        "gear_sets": (scrape_gear_sets, "gear_sets.json", MANUAL_FIELDS_GEAR_SETS),
        "weapons": (scrape_weapons, "weapons.json", MANUAL_FIELDS_WEAPONS),
        "talents": (scrape_talents, "talents_gear.json", MANUAL_FIELDS_TALENTS),
    }

    try:
        for category in categories:
            if category not in category_config:
                logger.warning("Unknown category: %s (skipping)", category)
                continue

            scraper_fn, filename, manual_fields = category_config[category]
            output_path = output_dir / filename

            logger.info("--- Scraping category: %s ---", category)
            scraped_data = scraper_fn(fetcher)

            if dry_run:
                logger.info("[DRY-RUN] Would produce %d entries for %s", len(scraped_data), category)
                if scraped_data:
                    # Show a sample of what was found
                    sample_keys = list(scraped_data.keys())[:3]
                    for key in sample_keys:
                        logger.info("[DRY-RUN] Sample entry: %s", key)
                continue

            if not scraped_data:
                logger.warning("No data scraped for %s -- skipping file write", category)
                continue

            # Preserve _metadata from existing file
            existing_data = load_existing_json(output_path)
            if "_metadata" in existing_data and "_metadata" not in scraped_data:
                scraped_data["_metadata"] = existing_data["_metadata"]

            # Merge with existing data if requested
            if merge:
                if existing_data:
                    logger.info(
                        "Merging %d scraped entries with %d existing entries for %s",
                        len(scraped_data),
                        len(existing_data),
                        category,
                    )
                    scraped_data = merge_data(existing_data, scraped_data, manual_fields)

            save_json(scraped_data, output_path, dry_run=dry_run)
            logger.info("Completed %s: %d entries", category, len(scraped_data))

    finally:
        fetcher.close()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Scrape Division 2 data from the Fandom wiki into JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  uv run python scrape_wiki.py --category all\n"
            "  uv run python scrape_wiki.py --category gear_sets --dry-run\n"
            "  uv run python scrape_wiki.py --category weapons --merge --output-dir data/\n"
            "  uv run python scrape_wiki.py --category talents --verbose\n"
        ),
    )
    parser.add_argument(
        "--category",
        choices=["gear_sets", "weapons", "talents", "all"],
        default="all",
        help="Which data category to scrape (default: all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be fetched without writing files",
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="Merge scraped data with existing JSON (preserving manual fields)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/"),
        help="Directory to write JSON output (default: data/)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed progress and debug info",
    )
    return parser.parse_args()


def main() -> None:
    """Main entry point for the wiki scraper."""
    args = parse_args()

    # Configure logging level
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    # Determine which categories to scrape
    if args.category == "all":
        categories = ["gear_sets", "weapons", "talents"]
    else:
        categories = [args.category]

    logger.info("Division 2 Wiki Scraper (MediaWiki API)")
    logger.info("Categories: %s", ", ".join(categories))
    logger.info("Output dir: %s", args.output_dir.resolve())
    if args.dry_run:
        logger.info("Mode: DRY-RUN (no files will be written)")
    if args.merge:
        logger.info("Mode: MERGE (preserving manual fields in existing data)")

    try:
        run_scraper(
            categories=categories,
            output_dir=args.output_dir,
            dry_run=args.dry_run,
            merge=args.merge,
        )
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(1)
    except Exception:
        logger.exception("Unhandled error during scraping")
        sys.exit(1)

    logger.info("Done.")


if __name__ == "__main__":
    main()
