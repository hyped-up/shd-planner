"""Lookup tools for Division 2 gear, weapons, talents, and skills."""

from tools.data_loader import load_data, search_data


def lookup_gear(query: str) -> dict | None:
    """Look up a gear set, brand set, exotic, or named item across all sources."""
    all_results = []
    for source in ["gear_sets", "brand_sets", "exotics", "named_items"]:
        results = search_data(source, query)
        # Tag each result with its source file for cross-source disambiguation
        for r in results:
            all_results.append({"source": source, **r})
    return {"results": all_results} if all_results else None


def lookup_weapon(query: str) -> dict | None:
    """Look up a weapon by name, type, or archetype."""
    data = load_data("weapons")
    query_lower = query.lower()
    results = []
    for class_key, class_data in data.items():
        # Skip internal metadata keys
        if class_key.startswith("_"):
            continue
        if not isinstance(class_data, dict):
            continue
        # Check weapon class name (e.g. "Assault Rifles", "assault_rifles")
        class_name = class_data.get("class", class_key).lower()
        if query_lower in class_name or query_lower in class_key:
            results.append(class_data)
            continue
        # Check individual archetypes within the class
        archetypes = class_data.get("archetypes", {})
        for arch_key, arch_data in archetypes.items():
            arch_name = arch_data.get("name", arch_key).lower()
            if query_lower in arch_name or query_lower in arch_key:
                results.append({"class": class_data.get("class"), "archetype": arch_data})
    # Also check exotics for weapon-type exotics
    exotic_results = search_data("exotics", query)
    weapon_exotics = [e for e in exotic_results if e.get("type") == "weapon"]
    if weapon_exotics:
        results.extend(weapon_exotics)
    return {"results": results} if results else None


def lookup_talent(query: str) -> dict | None:
    """Look up a gear or weapon talent across all talent sources."""
    all_results = []
    for source in ["talents_gear", "talents_weapon"]:
        results = search_data(source, query)
        # Tag each result with its source file for cross-source disambiguation
        for r in results:
            all_results.append({"source": source, **r})
    return {"results": all_results} if all_results else None


def lookup_skill(query: str) -> dict | None:
    """Look up a skill or skill variant."""
    data = load_data("skills")
    query_lower = query.lower()
    results = []
    for skill_key, skill_data in data.items():
        # Skip internal metadata keys
        if skill_key.startswith("_"):
            continue
        if not isinstance(skill_data, dict):
            continue
        skill_name = skill_data.get("name", skill_key).lower()
        if query_lower in skill_name:
            results.append(skill_data)
            continue
        # Search within variants
        variants = skill_data.get("variants", {})
        for var_key, var_data in variants.items():
            var_name = var_data.get("name", var_key).lower()
            if query_lower in var_name or query_lower in var_key:
                results.append({"skill": skill_data.get("name"), "variant": var_data})
    return {"results": results} if results else None
