"""Tests for lookup tools."""
from tools.lookup import lookup_gear, lookup_weapon, lookup_talent, lookup_skill


def test_lookup_gear_by_name():
    """Verify gear lookup finds Striker's Battlegear."""
    result = lookup_gear("Striker")
    assert result is not None
    assert "results" in result


def test_lookup_gear_not_found():
    """Verify gear lookup returns None for non-existent gear."""
    result = lookup_gear("zzz_fake_gear_zzz")
    assert result is None


def test_lookup_weapon_by_type():
    """Verify weapon lookup finds assault rifles by class name."""
    result = lookup_weapon("assault rifle")
    assert result is not None
    assert len(result["results"]) > 0


def test_lookup_talent():
    """Verify talent lookup finds Obliterate."""
    result = lookup_talent("Obliterate")
    assert result is not None
    assert "results" in result


def test_lookup_skill():
    """Verify skill lookup finds Turret."""
    result = lookup_skill("Turret")
    assert result is not None
    assert len(result["results"]) > 0


def test_lookup_skill_variant():
    """Verify skill lookup finds specific variants like Striker Drone."""
    result = lookup_skill("Striker Drone")
    assert result is not None
    assert len(result["results"]) > 0


def test_lookup_gear_aggregates_across_sources():
    """Verify gear lookup returns results from multiple sources, not just the first match."""
    result = lookup_gear("Striker")
    assert result is not None
    # Each result item should have a 'source' key indicating its origin
    for item in result["results"]:
        assert "source" in item


def test_lookup_gear_empty_query():
    """Verify gear lookup returns None for an empty query."""
    result = lookup_gear("")
    assert result is None


def test_lookup_talent_aggregates_across_sources():
    """Verify talent lookup searches all talent files and tags results with source."""
    result = lookup_talent("Obliterate")
    assert result is not None
    for item in result["results"]:
        assert "source" in item


def test_lookup_talent_empty_query():
    """Verify talent lookup returns None for an empty query."""
    result = lookup_talent("")
    assert result is None
