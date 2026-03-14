"""Load and search Division 2 JSON knowledge base files."""

import copy
import json
from pathlib import Path
from functools import lru_cache

# Path to the data/ directory relative to this module
DATA_DIR = Path(__file__).parent.parent / "data"


@lru_cache(maxsize=20)
def load_data(filename: str) -> dict:
    """Load a JSON data file from the data/ directory."""
    filepath = DATA_DIR / f"{filename}.json"
    if not filepath.exists():
        raise FileNotFoundError(f"Data file not found: {filepath}")
    with open(filepath) as f:
        return copy.deepcopy(json.load(f))


def get_data_version(filename: str) -> dict:
    """Return the _metadata object from a data file."""
    data = load_data(filename)
    return data.get("_metadata", {})


def search_data(filename: str, query: str) -> list[dict]:
    """Search a data file for entries matching a query string."""
    # Guard against empty or whitespace-only queries to avoid matching everything
    if not query or not query.strip():
        return []
    data = load_data(filename)
    query_lower = query.lower()
    results = []
    for key, value in data.items():
        # Skip the _metadata key when iterating entries
        if key == "_metadata":
            continue
        if not isinstance(value, dict):
            continue
        # Build a searchable string from key and common fields
        searchable = " ".join([
            str(key),
            str(value.get("name", "")),
            str(value.get("abbreviation", "")),
            str(value.get("id", "")),
        ]).lower()
        if query_lower in searchable:
            results.append(value)
    return results
