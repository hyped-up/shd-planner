"""Tests for stat calculator."""
from tools.stat_calculator import check_stats, compare_items


def test_check_stats_within_cap():
    """Verify a stat within cap is reported correctly."""
    result = check_stats({"critical_hit_chance": 55})
    assert result["critical_hit_chance"]["within_cap"] is True
    assert result["critical_hit_chance"]["wasted"] == 0


def test_check_stats_over_cap():
    """Verify a stat over cap reports wasted amount correctly."""
    # CHC cap is 60, so 75 is 15 over
    result = check_stats({"critical_hit_chance": 75})
    assert result["critical_hit_chance"]["within_cap"] is False
    assert result["critical_hit_chance"]["wasted"] == 15


def test_check_stats_no_cap():
    """Verify stats without hard caps are always within_cap."""
    result = check_stats({"critical_hit_damage": 200})
    assert result["critical_hit_damage"]["within_cap"] is True
    assert result["critical_hit_damage"]["cap"] is None


def test_compare_items():
    """Verify item comparison returns comparison dict with both items."""
    item_a = {"name": "Striker", "weapon_damage": 15, "rate_of_fire": 15}
    item_b = {"name": "Heartbreaker", "weapon_damage": 0, "armor_regen": True}
    result = compare_items(item_a, item_b)
    assert "comparison" in result
    assert result["item_a_name"] == "Striker"
    assert result["item_b_name"] == "Heartbreaker"
