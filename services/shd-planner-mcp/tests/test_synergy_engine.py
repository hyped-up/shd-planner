"""Tests for synergy engine."""
from tools.synergy_engine import detect_synergies


def test_detect_synergies_with_known_combo():
    """Verify synergy detection returns results for known build components."""
    # Use components that match synergies in the data (obliterate and foxs_prayer
    # appear in multiple synergy entries)
    build_components = ["obliterate", "foxs_prayer", "assault_rifle"]
    result = detect_synergies(build_components)
    assert isinstance(result, list)
    assert len(result) > 0


def test_detect_synergies_empty():
    """Verify empty input returns empty list."""
    result = detect_synergies([])
    assert isinstance(result, list)
    assert len(result) == 0


def test_detect_synergies_no_match():
    """Verify non-matching components return empty list."""
    result = detect_synergies(["zzz_fake_item_zzz"])
    assert isinstance(result, list)
    assert len(result) == 0


def test_detect_synergies_fuzzy_gear_set_match():
    """Verify fuzzy matching handles possessive-s and piece-count suffixes.

    Build IDs like 'strikers_battlegear' should match synergy components
    like 'striker_battlegear_4pc'.
    """
    result = detect_synergies(["strikers_battlegear", "ceska_vyroba", "grupo_sombra"])
    assert isinstance(result, list)
    assert len(result) > 0, "Expected fuzzy match for strikers_battlegear against striker_battlegear_4pc"


def test_detect_synergies_brand_set_match():
    """Verify brand set IDs match synergy components with piece-count suffixes."""
    result = detect_synergies(["providence_defense", "grupo_sombra", "ceska_vyroba"])
    assert isinstance(result, list)
    assert len(result) > 0, "Expected match for Providence/Grupo/Ceska brand components"


def test_detect_synergies_sorted_by_score():
    """Verify results are sorted by match_score descending."""
    build_components = ["obliterate", "foxs_prayer", "assault_rifle", "smg"]
    result = detect_synergies(build_components)
    if len(result) >= 2:
        scores = [r["match_score"] for r in result]
        assert scores == sorted(scores, reverse=True)
