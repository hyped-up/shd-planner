"""Build analysis and suggestion tools for Division 2."""

from tools.data_loader import load_data
from tools.synergy_engine import detect_synergies


def analyze_build(build: dict) -> dict:
    """Analyze a build composition for set bonuses, synergies, and gaps."""
    gear = build.get("gear", [])
    weapons = build.get("weapons", [])
    skills = build.get("skills", [])
    spec = build.get("specialization", "")

    # Validate input counts
    errors = []
    if len(gear) != 6:
        errors.append(f"Expected 6 gear pieces, got {len(gear)}")
    if not 1 <= len(weapons) <= 2:
        errors.append(f"Expected 1-2 weapons, got {len(weapons)}")
    if len(skills) > 2:
        errors.append(f"Expected 0-2 skills, got {len(skills)}")
    if errors:
        return {"error": "Invalid build", "details": errors}

    # Resolve named items to their parent brand for accurate set bonus counting
    named_items = load_data("named_items")
    resolved_gear = []
    for gear_id in gear:
        if gear_id in named_items:
            # Convert display name brand (e.g., "Overlord Armaments") to snake_case key
            brand_name = named_items[gear_id].get("brand", gear_id)
            brand_key = brand_name.lower().replace(" ", "_")
            resolved_gear.append(brand_key)
        else:
            resolved_gear.append(gear_id)

    # Count how many of each gear piece are in the build
    gear_counts = {}
    for piece in resolved_gear:
        gear_counts[piece] = gear_counts.get(piece, 0) + 1

    # Check for active gear set bonuses
    gear_sets = load_data("gear_sets")
    active_bonuses = []
    for gear_id, count in gear_counts.items():
        set_data = gear_sets.get(gear_id)
        if set_data:
            bonuses = set_data.get("bonuses", {})
            for threshold in ["2pc", "3pc", "4pc"]:
                needed = int(threshold[0])
                if count >= needed and threshold in bonuses:
                    active_bonuses.append({
                        "set": set_data.get("name", gear_id),
                        "bonus": threshold,
                        "effect": bonuses[threshold],
                    })

    # Check for active brand set bonuses (1pc, 2pc, 3pc thresholds)
    brand_sets = load_data("brand_sets")
    for gear_id, count in gear_counts.items():
        brand_data = brand_sets.get(gear_id)
        if brand_data:
            bonuses = brand_data.get("bonuses", {})
            for threshold in ["1pc", "2pc", "3pc"]:
                needed = int(threshold[0])
                if count >= needed and threshold in bonuses:
                    active_bonuses.append({
                        "set": brand_data.get("name", gear_id),
                        "bonus": threshold,
                        "effect": bonuses[threshold],
                    })

    # Detect synergies across all build components
    all_components = gear + weapons + skills + [spec]
    synergies = detect_synergies(all_components)

    # Generate optimization suggestions
    suggestions = []
    if not any(b["bonus"] == "4pc" for b in active_bonuses) and len(set(gear)) > 4:
        suggestions.append(
            "Consider consolidating to a 4-piece gear set for the 4pc talent."
        )
    if len(gear) == 6 and len(set(gear)) == 6:
        suggestions.append(
            "All different brands — verify brand set bonuses are being "
            "activated (need 2-3pc of same brand)."
        )

    return {
        "gear_set_bonuses": active_bonuses,
        "synergies": synergies,
        "suggestions": suggestions,
        "component_count": {
            "gear_pieces": len(gear),
            "weapons": len(weapons),
            "skills": len(skills),
        },
    }


def suggest_build(
    role: str, mode: str, constraints: list[str] | None = None
) -> list[dict]:
    """Suggest builds for a given role and game mode."""
    synergies_data = load_data("synergies")
    synergy_list = synergies_data.get("synergies", [])
    suggestions = []
    role_lower = role.lower()
    mode_lower = mode.lower()

    # First pass: match both role and mode
    for syn_data in synergy_list:
        if not isinstance(syn_data, dict):
            continue
        # Handle mode as a list (may be string or list in data)
        syn_modes = syn_data.get("mode", ["all"])
        if isinstance(syn_modes, str):
            syn_modes = [syn_modes]
        mode_match = mode_lower in [m.lower() for m in syn_modes] or "all" in [m.lower() for m in syn_modes]
        syn_role = str(syn_data.get("role", "")).lower()
        syn_notes = str(syn_data.get("notes", "")).lower()
        syn_id = str(syn_data.get("id", "")).lower()
        role_match = (
            role_lower in syn_role
            or role_lower in syn_notes
            or role_lower in syn_id
        )
        if mode_match and role_match:
            suggestions.append(syn_data)

    # Fallback: match mode only if no role+mode matches
    if not suggestions:
        for syn_data in synergy_list:
            if not isinstance(syn_data, dict):
                continue
            # Handle mode as a list (may be string or list in data)
            syn_modes = syn_data.get("mode", ["all"])
            if isinstance(syn_modes, str):
                syn_modes = [syn_modes]
            mode_match = mode_lower in [m.lower() for m in syn_modes] or "all" in [m.lower() for m in syn_modes]
            if mode_match:
                suggestions.append(syn_data)

    # Sort suggestions by tier priority: S > A > B > C
    tier_priority = {"S": 0, "A": 1, "B": 2, "C": 3}
    suggestions.sort(key=lambda s: tier_priority.get(str(s.get("tier", "C")).upper(), 4))

    return suggestions[:5]
