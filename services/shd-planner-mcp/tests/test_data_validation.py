"""Data validation tests for Division 2 JSON knowledge base.

Validates structural integrity, cross-references, and content quality
across all 12 JSON data files.
"""

import json
import re
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent.parent / "data"

# All 12 expected JSON data files
ALL_DATA_FILES = [
    "brand_sets",
    "exotics",
    "gear_sets",
    "modes",
    "named_items",
    "skills",
    "specializations",
    "stats",
    "synergies",
    "talents_gear",
    "talents_weapon",
    "weapons",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(filename: str) -> dict:
    """Load a JSON file from the data directory."""
    filepath = DATA_DIR / f"{filename}.json"
    with open(filepath) as f:
        return json.load(f)


def iter_entries(data: dict):
    """Yield (key, value) pairs, skipping non-dict entries and _metadata."""
    for key, value in data.items():
        if key.startswith("_") or not isinstance(value, dict):
            continue
        yield key, value


# ===================================================================
# Section 1: All 12 JSON files load successfully
# ===================================================================

@pytest.mark.parametrize("filename", ALL_DATA_FILES)
def test_json_file_loads(filename):
    """Each data file must exist and be valid JSON."""
    filepath = DATA_DIR / f"{filename}.json"
    assert filepath.exists(), f"Missing data file: {filepath}"
    data = load_json(filename)
    assert isinstance(data, dict), f"{filename}.json root must be a dict"


# ===================================================================
# Section 2: No empty files or empty top-level dicts
# ===================================================================

@pytest.mark.parametrize("filename", ALL_DATA_FILES)
def test_not_empty(filename):
    """Data files must not be empty or contain only _metadata."""
    data = load_json(filename)
    # At least one key beyond _metadata
    content_keys = [k for k in data.keys() if not k.startswith("_")]
    assert len(content_keys) > 0, f"{filename}.json has no content keys"


# ===================================================================
# Section 3: _metadata key with game_version and last_updated
# ===================================================================

@pytest.mark.parametrize("filename", ALL_DATA_FILES)
def test_metadata_present(filename):
    """Each data file should have a _metadata key with required fields."""
    data = load_json(filename)
    assert "_metadata" in data, f"{filename}.json missing _metadata key"
    meta = data["_metadata"]
    assert "game_version" in meta, f"{filename}.json _metadata missing game_version"
    assert "last_updated" in meta, f"{filename}.json _metadata missing last_updated"


# ===================================================================
# Section 4: Structural validation — gear_sets.json
# ===================================================================

class TestGearSets:
    """Validate gear_sets.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("gear_sets")

    def test_has_entries(self, data):
        """gear_sets.json must contain at least one gear set entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    @pytest.fixture(scope="class")
    def entries(self, data):
        return list(iter_entries(data))

    # Parametrize over entries at collection time
    def test_each_entry_has_name(self, data):
        """Each gear set entry must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"gear_sets[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"gear_sets[{key}] name must be a non-empty string"

    def test_each_entry_has_bonuses_with_required_keys(self, data):
        """Each gear set must have bonuses with 2pc, 3pc, and 4pc keys."""
        for key, entry in iter_entries(data):
            assert "bonuses" in entry, f"gear_sets[{key}] missing 'bonuses'"
            bonuses = entry["bonuses"]
            for pc_key in ["2pc", "3pc", "4pc"]:
                assert pc_key in bonuses, \
                    f"gear_sets[{key}].bonuses missing '{pc_key}'"


# ===================================================================
# Section 5: Structural validation — brand_sets.json
# ===================================================================

class TestBrandSets:
    """Validate brand_sets.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("brand_sets")

    def test_has_entries(self, data):
        """brand_sets.json must contain at least one brand set entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each brand set entry must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"brand_sets[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"brand_sets[{key}] name must be a non-empty string"

    def test_each_entry_has_bonuses_with_required_keys(self, data):
        """Each brand set must have bonuses with 1pc, 2pc, and 3pc keys."""
        for key, entry in iter_entries(data):
            assert "bonuses" in entry, f"brand_sets[{key}] missing 'bonuses'"
            bonuses = entry["bonuses"]
            for pc_key in ["1pc", "2pc", "3pc"]:
                assert pc_key in bonuses, \
                    f"brand_sets[{key}].bonuses missing '{pc_key}'"


# ===================================================================
# Section 6: Structural validation — exotics.json
# ===================================================================

class TestExotics:
    """Validate exotics.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("exotics")

    def test_has_entries(self, data):
        """exotics.json must contain at least one exotic entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each exotic entry must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"exotics[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"exotics[{key}] name must be a non-empty string"

    def test_each_entry_has_type(self, data):
        """Each exotic must have a type field of 'weapon', 'gear', or 'armor'."""
        valid_types = ("weapon", "gear", "armor")
        for key, entry in iter_entries(data):
            assert "type" in entry, f"exotics[{key}] missing 'type'"
            assert entry["type"] in valid_types, \
                f"exotics[{key}] type must be one of {valid_types}, got '{entry['type']}'"

    def test_each_entry_has_unique_talent(self, data):
        """Each exotic must have a unique_talent field."""
        for key, entry in iter_entries(data):
            assert "unique_talent" in entry, \
                f"exotics[{key}] missing 'unique_talent'"


# ===================================================================
# Section 7: Structural validation — named_items.json
# ===================================================================

class TestNamedItems:
    """Validate named_items.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("named_items")

    def test_has_entries(self, data):
        """named_items.json must contain at least one named item entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each named item must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"named_items[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"named_items[{key}] name must be a non-empty string"

    def test_each_entry_has_brand(self, data):
        """Each named item must have a brand field."""
        for key, entry in iter_entries(data):
            assert "brand" in entry, f"named_items[{key}] missing 'brand'"
            assert isinstance(entry["brand"], str) and entry["brand"], \
                f"named_items[{key}] brand must be a non-empty string"

    def test_each_entry_has_slot(self, data):
        """Each named item must have a slot field."""
        for key, entry in iter_entries(data):
            assert "slot" in entry, f"named_items[{key}] missing 'slot'"
            assert isinstance(entry["slot"], str) and entry["slot"], \
                f"named_items[{key}] slot must be a non-empty string"


# ===================================================================
# Section 8: Structural validation — weapons.json
# ===================================================================

class TestWeapons:
    """Validate weapons.json weapon class and archetype structure."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("weapons")

    def test_has_weapon_classes(self, data):
        """weapons.json must contain at least one weapon class."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_class_has_class_field(self, data):
        """Each weapon class must have a 'class' field."""
        for key, entry in iter_entries(data):
            assert "class" in entry, f"weapons[{key}] missing 'class'"
            assert isinstance(entry["class"], str) and entry["class"], \
                f"weapons[{key}] class must be a non-empty string"

    def test_each_class_has_archetypes_dict(self, data):
        """Each weapon class must have an 'archetypes' dict."""
        for key, entry in iter_entries(data):
            assert "archetypes" in entry, \
                f"weapons[{key}] missing 'archetypes'"
            assert isinstance(entry["archetypes"], dict), \
                f"weapons[{key}].archetypes must be a dict"

    def test_each_archetype_has_rpm_and_magazine(self, data):
        """Each weapon archetype must have rpm and magazine fields."""
        for class_key, class_data in iter_entries(data):
            archetypes = class_data.get("archetypes", {})
            for arch_key, arch_data in archetypes.items():
                assert "rpm" in arch_data, \
                    f"weapons[{class_key}].archetypes[{arch_key}] missing 'rpm'"
                assert "magazine" in arch_data, \
                    f"weapons[{class_key}].archetypes[{arch_key}] missing 'magazine'"
                assert isinstance(arch_data["rpm"], (int, float)), \
                    f"weapons[{class_key}].archetypes[{arch_key}].rpm must be numeric"
                assert isinstance(arch_data["magazine"], (int, float)), \
                    f"weapons[{class_key}].archetypes[{arch_key}].magazine must be numeric"


# ===================================================================
# Section 9: Structural validation — talents_gear.json
# ===================================================================

class TestTalentsGear:
    """Validate talents_gear.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("talents_gear")

    def test_has_entries(self, data):
        """talents_gear.json must contain at least one talent entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each gear talent must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"talents_gear[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"talents_gear[{key}] name must be a non-empty string"

    def test_each_entry_has_slot(self, data):
        """Each gear talent must have a slot field."""
        for key, entry in iter_entries(data):
            assert "slot" in entry, f"talents_gear[{key}] missing 'slot'"
            assert isinstance(entry["slot"], str) and entry["slot"], \
                f"talents_gear[{key}] slot must be a non-empty string"

    def test_each_entry_has_description(self, data):
        """Each gear talent must have a description field."""
        for key, entry in iter_entries(data):
            assert "description" in entry, \
                f"talents_gear[{key}] missing 'description'"
            assert isinstance(entry["description"], str) and entry["description"], \
                f"talents_gear[{key}] description must be a non-empty string"


# ===================================================================
# Section 10: Structural validation — talents_weapon.json
# ===================================================================

class TestTalentsWeapon:
    """Validate talents_weapon.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("talents_weapon")

    def test_has_entries(self, data):
        """talents_weapon.json must contain at least one weapon talent entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each weapon talent must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"talents_weapon[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"talents_weapon[{key}] name must be a non-empty string"

    def test_each_entry_has_description(self, data):
        """Each weapon talent must have a description field."""
        for key, entry in iter_entries(data):
            assert "description" in entry, \
                f"talents_weapon[{key}] missing 'description'"
            assert isinstance(entry["description"], str) and entry["description"], \
                f"talents_weapon[{key}] description must be a non-empty string"


# ===================================================================
# Section 11: Structural validation — skills.json
# ===================================================================

class TestSkills:
    """Validate skills.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("skills")

    def test_has_entries(self, data):
        """skills.json must contain at least one skill entry."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each skill must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"skills[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"skills[{key}] name must be a non-empty string"

    def test_each_entry_has_variants_dict(self, data):
        """Each skill must have a variants dict."""
        for key, entry in iter_entries(data):
            assert "variants" in entry, f"skills[{key}] missing 'variants'"
            assert isinstance(entry["variants"], dict), \
                f"skills[{key}].variants must be a dict"

    def test_each_variant_has_name(self, data):
        """Each skill variant must have a name field."""
        for skill_key, skill_data in iter_entries(data):
            variants = skill_data.get("variants", {})
            for var_key, var_data in variants.items():
                assert "name" in var_data, \
                    f"skills[{skill_key}].variants[{var_key}] missing 'name'"
                assert isinstance(var_data["name"], str) and var_data["name"], \
                    f"skills[{skill_key}].variants[{var_key}] name must be non-empty"


# ===================================================================
# Section 12: Structural validation — specializations.json
# ===================================================================

class TestSpecializations:
    """Validate specializations.json entries."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("specializations")

    def test_has_entries(self, data):
        """specializations.json must contain at least one specialization."""
        entries = list(iter_entries(data))
        assert len(entries) > 0

    def test_each_entry_has_name(self, data):
        """Each specialization must have a non-empty string name."""
        for key, entry in iter_entries(data):
            assert "name" in entry, f"specializations[{key}] missing 'name'"
            assert isinstance(entry["name"], str) and entry["name"], \
                f"specializations[{key}] name must be a non-empty string"

    def test_each_entry_has_signature_weapon(self, data):
        """Each specialization must have a signature_weapon field."""
        for key, entry in iter_entries(data):
            assert "signature_weapon" in entry, \
                f"specializations[{key}] missing 'signature_weapon'"


# ===================================================================
# Section 13: Structural validation — stats.json
# ===================================================================

class TestStats:
    """Validate stats.json structure."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("stats")

    def test_has_caps_key(self, data):
        """stats.json must have a 'caps' key."""
        assert "caps" in data, "stats.json missing 'caps' key"

    def test_caps_has_nested_objects(self, data):
        """Each entry in caps must be a dict with stat information."""
        caps = data.get("caps", {})
        assert len(caps) > 0, "stats.caps is empty"
        for cap_key, cap_data in caps.items():
            assert isinstance(cap_data, dict), \
                f"stats.caps[{cap_key}] must be a dict"


# ===================================================================
# Section 14: Structural validation — synergies.json
# ===================================================================

class TestSynergies:
    """Validate synergies.json structure."""

    @pytest.fixture(scope="class")
    def data(self):
        return load_json("synergies")

    def test_has_synergies_key(self, data):
        """synergies.json must have a 'synergies' key."""
        assert "synergies" in data, "synergies.json missing 'synergies' key"

    def test_synergies_is_a_list(self, data):
        """The synergies key must contain a list."""
        syn_list = data.get("synergies", None)
        assert isinstance(syn_list, list), "synergies.synergies must be a list"
        assert len(syn_list) > 0, "synergies.synergies list is empty"


# ===================================================================
# Section 15: Structural validation — modes.json
# ===================================================================

class TestModes:
    """Validate modes.json loads without error."""

    def test_modes_loads(self):
        """modes.json must load successfully."""
        data = load_json("modes")
        assert isinstance(data, dict)
        # modes.json has a top-level "modes" key
        content_keys = [k for k in data.keys() if not k.startswith("_")]
        assert len(content_keys) > 0, "modes.json has no content"


# ===================================================================
# Section 16: Cross-reference — gear set names in synergies exist
# ===================================================================

class TestCrossRefSynergiesGearSets:
    """Verify gear set references in synergies.json exist in gear_sets.json."""

    def test_synergy_gear_set_references_exist(self):
        """Gear set IDs referenced in synergies should exist in gear_sets.json."""
        synergies_data = load_json("synergies")
        gear_sets_data = load_json("gear_sets")

        # Build a set of gear set keys (IDs) from gear_sets.json
        gear_set_keys = {
            k for k in gear_sets_data.keys() if not k.startswith("_")
        }

        # Extract gear set references from synergy components
        # Components use patterns like "striker_battlegear_4pc" or "eclipse_protocol_4pc"
        # Strip the trailing _Npc suffix to get the base gear set ID
        piece_count_pattern = re.compile(r"_\d+pc$")
        synergy_list = synergies_data.get("synergies", [])
        missing = []
        for syn in synergy_list:
            for component in syn.get("components", []):
                base_id = piece_count_pattern.sub("", component)
                # Skip components that are clearly not gear set references
                # (brand refs, exotic refs, generic placeholders)
                if base_id in gear_set_keys:
                    continue
                # Also check with common ID transformations
                # e.g. "striker_battlegear" vs "strikers_battlegear"
                # Handle singular/plural differences in component words
                found = False
                base_words = set(base_id.split("_"))
                for gs_key in gear_set_keys:
                    gs_words = set(gs_key.split("_"))
                    # Substring match
                    if base_id in gs_key or gs_key in base_id:
                        found = True
                        break
                    # Word overlap: strip trailing 's' from each word
                    base_stems = {w.rstrip("s") for w in base_words}
                    gs_stems = {w.rstrip("s") for w in gs_words}
                    if base_stems == gs_stems:
                        found = True
                        break
                # Only flag items that look like gear set refs (contain known set words)
                known_set_words = [
                    "striker", "heartbreaker", "eclipse", "foundry",
                    "future_initiative", "hunters_fury", "negotiators",
                    "ongoing_directive", "true_patriot", "aces",
                    "hard_wired", "tip_of_the_spear", "rigger",
                    "system_corruption", "aegis", "umbra",
                ]
                looks_like_gear_set = any(
                    word in base_id for word in known_set_words
                )
                if looks_like_gear_set and not found:
                    missing.append(
                        f"Synergy '{syn.get('id', '?')}' references "
                        f"'{component}' (base='{base_id}') not found in gear_sets"
                    )
        assert not missing, \
            "Gear set cross-reference failures:\n" + "\n".join(missing)


# ===================================================================
# Section 17: Cross-reference — named item brands exist in brand_sets
# ===================================================================

class TestCrossRefNamedItemBrands:
    """Verify named item brand references exist in brand_sets.json."""

    def test_named_item_brands_exist_in_brand_sets(self):
        """Each named item's brand should exist in brand_sets.json (case-insensitive)."""
        named_items_data = load_json("named_items")
        brand_sets_data = load_json("brand_sets")

        # Build a set of brand names from brand_sets.json (lowercase)
        brand_names = set()
        for key, value in iter_entries(brand_sets_data):
            brand_names.add(value.get("name", "").lower())

        # Check each named item's brand
        missing = []
        for key, entry in iter_entries(named_items_data):
            brand = entry.get("brand", "")
            # Skip non-brand references like "Named Gear" or "Named Weapon"
            if brand.lower() in ("named gear", "named weapon"):
                continue
            if brand.lower() not in brand_names:
                missing.append(
                    f"named_items[{key}].brand = '{brand}' not found in brand_sets"
                )
        assert not missing, \
            "Named item brand cross-reference failures:\n" + "\n".join(missing)


# ===================================================================
# Section 18: All entries have string names (not None or empty)
# ===================================================================

# Files where each top-level dict entry should have a "name" field
_NAME_REQUIRED_FILES = [
    "gear_sets",
    "brand_sets",
    "exotics",
    "named_items",
    "talents_gear",
    "talents_weapon",
    "skills",
    "specializations",
]


# ===================================================================
# Section 18a: Cross-reference — brand_sets named_items exist in named_items.json
# ===================================================================

class TestCrossRefBrandNamedItems:
    """Verify named items listed in brand_sets exist in named_items.json."""

    def test_brand_set_named_items_exist_in_named_items_json(self):
        """Every item name in brand_sets[x].named_items[] must have a
        matching entry in named_items.json."""
        brand_sets = load_json("brand_sets")
        named_items = load_json("named_items")

        # Build set of named item names from named_items.json (lowercase)
        ni_names = set()
        for key, entry in iter_entries(named_items):
            ni_names.add(entry.get("name", "").lower())

        missing = []
        for brand_key, brand_data in iter_entries(brand_sets):
            for ni in brand_data.get("named_items", []):
                ni_name = ni.get("name", "")
                if ni_name.lower() not in ni_names:
                    missing.append(
                        f"brand_sets[{brand_key}] lists '{ni_name}' "
                        f"but it's missing from named_items.json"
                    )
        assert not missing, \
            "Brand set named item cross-reference failures:\n" + "\n".join(missing)

    def test_named_item_brands_match_brand_sets(self):
        """For each gear named item with a real brand, the brand's
        named_items array must include it."""
        brand_sets = load_json("brand_sets")
        named_items = load_json("named_items")

        # Build brand name -> list of named item names (lowercase)
        brand_ni_map: dict[str, set[str]] = {}
        for brand_key, brand_data in iter_entries(brand_sets):
            brand_name = brand_data.get("name", "").lower()
            items = {
                ni.get("name", "").lower()
                for ni in brand_data.get("named_items", [])
            }
            brand_ni_map[brand_name] = items

        missing = []
        for ni_key, ni_data in iter_entries(named_items):
            # Skip weapons and non-brand entries
            if ni_data.get("type") != "gear":
                continue
            brand = ni_data.get("brand", "")
            if brand.lower() in ("named gear", "named weapon"):
                continue
            ni_name = ni_data.get("name", "").lower()
            brand_lower = brand.lower()
            if brand_lower in brand_ni_map:
                if ni_name not in brand_ni_map[brand_lower]:
                    missing.append(
                        f"named_items[{ni_key}] (name='{ni_data.get('name')}', "
                        f"brand='{brand}') not listed in brand_sets"
                    )
        assert not missing, \
            "Named items missing from brand_sets:\n" + "\n".join(missing)

    def test_no_duplicate_named_items_across_brands(self):
        """No named item name should appear in more than one brand."""
        brand_sets = load_json("brand_sets")

        seen: dict[str, str] = {}  # name -> brand_key
        duplicates = []
        for brand_key, brand_data in iter_entries(brand_sets):
            for ni in brand_data.get("named_items", []):
                ni_name = ni.get("name", "").lower()
                if ni_name in seen:
                    duplicates.append(
                        f"'{ni.get('name')}' appears in both "
                        f"'{seen[ni_name]}' and '{brand_key}'"
                    )
                else:
                    seen[ni_name] = brand_key
        assert not duplicates, \
            "Duplicate named items across brands:\n" + "\n".join(duplicates)


# ===================================================================
# Section 18b: Weapon talent types and gear talent slots validation
# ===================================================================

# Valid weapon type values used in talents_weapon.json
VALID_WEAPON_TYPES = {
    "assault_rifles",
    "smgs",
    "lmgs",
    "rifles",
    "marksman_rifles",
    "shotguns",
    "pistols",
}

# Valid gear talent slots
VALID_GEAR_TALENT_SLOTS = {"chest", "backpack"}


def test_weapon_talent_types_use_consistent_names():
    """All weapon_types values must come from a fixed valid set."""
    data = load_json("talents_weapon")
    bad = []
    for key, entry in iter_entries(data):
        for wtype in entry.get("weapon_types", []):
            if wtype not in VALID_WEAPON_TYPES:
                bad.append(
                    f"talents_weapon[{key}] has invalid weapon_type '{wtype}'"
                )
    assert not bad, \
        "Invalid weapon types found:\n" + "\n".join(bad)


def test_gear_talent_slots_are_valid():
    """Gear talent slots must be 'chest' or 'backpack'."""
    data = load_json("talents_gear")
    bad = []
    for key, entry in iter_entries(data):
        slot = entry.get("slot", "")
        if slot not in VALID_GEAR_TALENT_SLOTS:
            bad.append(
                f"talents_gear[{key}] has invalid slot '{slot}'"
            )
    assert not bad, \
        "Invalid gear talent slots found:\n" + "\n".join(bad)


# ===================================================================
# Section 19: All entries have string names (not None or empty)
# ===================================================================


@pytest.mark.parametrize("filename", _NAME_REQUIRED_FILES)
def test_all_entries_have_string_names(filename):
    """Every entry in name-required files must have a non-empty string name."""
    data = load_json(filename)
    bad_entries = []
    for key, entry in iter_entries(data):
        name = entry.get("name")
        if not isinstance(name, str) or not name.strip():
            bad_entries.append(key)
    assert not bad_entries, \
        f"{filename}.json entries with missing/empty name: {bad_entries}"
