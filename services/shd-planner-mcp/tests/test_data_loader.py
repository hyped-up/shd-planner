"""Tests for data loader module."""
import pytest
from tools.data_loader import load_data, search_data


def test_load_gear_sets():
    """Verify gear_sets.json loads and contains expected entries."""
    data = load_data("gear_sets")
    assert isinstance(data, dict)
    assert len(data) > 0
    assert "strikers_battlegear" in data


def test_load_nonexistent_file():
    """Verify FileNotFoundError is raised for missing data files."""
    with pytest.raises(FileNotFoundError):
        load_data("nonexistent_file")


def test_search_data_by_name():
    """Verify search returns results for known gear set names."""
    results = search_data("gear_sets", "striker")
    assert len(results) > 0


def test_search_data_no_results():
    """Verify search returns empty list for non-matching queries."""
    results = search_data("gear_sets", "zzz_nonexistent_zzz")
    assert len(results) == 0


def test_search_data_by_abbreviation():
    """Verify search finds entries by abbreviation."""
    results = search_data("gear_sets", "SB")
    assert len(results) > 0
    assert any("Striker" in r.get("name", "") for r in results)


def test_search_data_empty_query():
    """Verify empty query returns no results instead of matching everything."""
    results = search_data("gear_sets", "")
    assert results == []


def test_search_data_whitespace_query():
    """Verify whitespace-only query returns no results."""
    results = search_data("gear_sets", "   ")
    assert results == []
