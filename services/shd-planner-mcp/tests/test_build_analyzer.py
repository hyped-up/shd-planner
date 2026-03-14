"""Tests for build analyzer."""
from tools.build_analyzer import analyze_build, suggest_build


def test_analyze_build_basic():
    """Verify a 4pc Striker build produces expected analysis structure."""
    build = {
        "gear": [
            "strikers_battlegear", "strikers_battlegear",
            "strikers_battlegear", "strikers_battlegear",
            "ceska_vyroba", "grupo_sombra",
        ],
        "weapons": ["military_m4", "police_m4"],
        "skills": ["assault_turret", "striker_drone"],
        "specialization": "technician",
    }
    result = analyze_build(build)
    assert "gear_set_bonuses" in result
    assert "synergies" in result
    assert "suggestions" in result
    assert "component_count" in result
    assert result["component_count"]["gear_pieces"] == 6


def test_analyze_build_detects_set_bonus():
    """Verify gear set bonuses are detected for 4pc Striker."""
    build = {
        "gear": [
            "strikers_battlegear", "strikers_battlegear",
            "strikers_battlegear", "strikers_battlegear",
            "ceska_vyroba", "grupo_sombra",
        ],
        "weapons": ["military_m4"],
        "skills": [],
        "specialization": "",
    }
    result = analyze_build(build)
    bonuses = result["gear_set_bonuses"]
    assert len(bonuses) > 0
    # Should detect 2pc, 3pc, and 4pc bonuses
    bonus_types = [b["bonus"] for b in bonuses]
    assert "2pc" in bonus_types
    assert "4pc" in bonus_types


def test_analyze_build_detects_brand_set_bonus():
    """Verify brand set bonuses are detected (e.g., Ceska 1pc, Grupo 1pc)."""
    build = {
        "gear": [
            "strikers_battlegear", "strikers_battlegear",
            "strikers_battlegear", "strikers_battlegear",
            "ceska_vyroba", "grupo_sombra",
        ],
        "weapons": ["military_m4"],
        "skills": [],
        "specialization": "",
    }
    result = analyze_build(build)
    bonuses = result["gear_set_bonuses"]
    # Should detect brand set 1pc bonuses for Ceska and Grupo
    bonus_names = [b["set"] for b in bonuses]
    # Brand names may use diacritics (e.g., "Česká Výroba S.R.O."), so match case-insensitively
    bonus_names_lower = [n.lower() for n in bonus_names]
    assert any("esk" in name for name in bonus_names_lower), f"Expected Ceska brand bonus, got: {bonus_names}"
    assert any("grupo" in name for name in bonus_names_lower), f"Expected Grupo brand bonus, got: {bonus_names}"
    # Verify 1pc bonuses are present
    one_pc_bonuses = [b for b in bonuses if b["bonus"] == "1pc"]
    assert len(one_pc_bonuses) >= 2, f"Expected at least 2 brand 1pc bonuses, got: {one_pc_bonuses}"


def test_analyze_build_detects_multi_piece_brand_bonus():
    """Verify multi-piece brand bonuses (2pc, 3pc) are detected."""
    build = {
        "gear": [
            "providence_defense", "providence_defense", "providence_defense",
            "grupo_sombra", "grupo_sombra",
            "ceska_vyroba",
        ],
        "weapons": ["military_m4"],
        "skills": [],
        "specialization": "",
    }
    result = analyze_build(build)
    bonuses = result["gear_set_bonuses"]
    # Providence should have 1pc, 2pc, and 3pc bonuses
    prov_bonuses = [b for b in bonuses if "Providence" in b["set"]]
    prov_types = [b["bonus"] for b in prov_bonuses]
    assert "1pc" in prov_types, f"Expected Providence 1pc, got: {prov_types}"
    assert "2pc" in prov_types, f"Expected Providence 2pc, got: {prov_types}"
    assert "3pc" in prov_types, f"Expected Providence 3pc, got: {prov_types}"
    # Grupo should have 1pc and 2pc
    grupo_bonuses = [b for b in bonuses if "Grupo" in b["set"]]
    grupo_types = [b["bonus"] for b in grupo_bonuses]
    assert "1pc" in grupo_types
    assert "2pc" in grupo_types


def test_analyze_build_synergies_detected():
    """Verify synergies are detected for a standard DPS build with gear set pieces."""
    build = {
        "gear": [
            "strikers_battlegear", "strikers_battlegear",
            "strikers_battlegear", "strikers_battlegear",
            "ceska_vyroba", "grupo_sombra",
        ],
        "weapons": ["assault_rifle"],
        "skills": [],
        "specialization": "",
    }
    result = analyze_build(build)
    synergies = result["synergies"]
    assert len(synergies) > 0, "Expected synergies to be detected for a Striker build with Ceska/Grupo"


def test_suggest_build():
    """Verify build suggestions return results for dps + legendary."""
    result = suggest_build(role="dps", mode="legendary")
    assert isinstance(result, list)
    assert len(result) > 0


def test_suggest_build_healer():
    """Verify build suggestions return results for healer role."""
    result = suggest_build(role="healer", mode="raid")
    assert isinstance(result, list)
    assert len(result) > 0
