"""Stat calculation and validation tools for Division 2 builds."""

from tools.data_loader import load_data


def check_stats(stats: dict[str, float]) -> dict:
    """Validate stat allocations against known caps."""
    data = load_data("stats")
    caps = data.get("caps", {})
    results = {}
    for stat_name, value in stats.items():
        cap_info = caps.get(stat_name, {})
        cap = cap_info.get("cap")
        if cap is None:
            # No hard cap or stat not found in caps data
            results[stat_name] = {
                "value": value,
                "cap": None,
                "within_cap": True,
                "wasted": 0,
                "note": cap_info.get("soft_cap_note", "No hard cap"),
            }
        else:
            over = max(0, value - cap)
            results[stat_name] = {
                "value": value,
                "cap": cap,
                "within_cap": value <= cap,
                "wasted": over,
                "note": f"Over cap by {over}" if over > 0 else "OK",
            }
    return results


def compare_items(item_a: dict, item_b: dict) -> dict:
    """Compare two items or builds side-by-side."""
    all_keys = set(list(item_a.keys()) + list(item_b.keys()))
    comparison = {}
    for key in all_keys:
        val_a = item_a.get(key)
        val_b = item_b.get(key)
        comparison[key] = {"item_a": val_a, "item_b": val_b}
    return {
        "item_a_name": item_a.get("name", "A"),
        "item_b_name": item_b.get("name", "B"),
        "comparison": comparison,
    }
