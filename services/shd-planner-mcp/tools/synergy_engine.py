"""Synergy detection engine for Division 2 builds."""

import re

from tools.data_loader import load_data


def _normalize_id(component_id: str) -> str:
    """Normalize a component ID by stripping possessive 's' suffixes and piece-count tags.

    For example: "strikers_battlegear" -> "striker_battlegear",
                 "striker_battlegear_4pc" -> "striker_battlegear",
                 "ceska_vyroba_1pc_or_2pc" -> "ceska_vyroba".
    """
    # Strip trailing piece-count suffixes like _4pc, _1pc_or_2pc, _optional
    normalized = re.sub(r"_\d+pc(?:_or_\d+pc)?$", "", component_id)
    normalized = re.sub(r"_optional$", "", normalized)
    # Remove possessive 's' before underscores (e.g., "strikers_" -> "striker_",
    # "hunters_" -> "hunter_", "negotiators_" -> "negotiator_")
    normalized = re.sub(r"(?<=[a-z])s_", "_", normalized)
    return normalized


def _fuzzy_match_components(build_components: set[str], synergy_components: set[str]) -> set[str]:
    """Match build components against synergy components using normalized prefix matching.

    Handles mismatches between build IDs (e.g., "strikers_battlegear") and synergy IDs
    (e.g., "striker_battlegear_4pc") by normalizing both sides and checking for substring overlap.
    Returns the set of synergy component IDs that were matched.
    """
    # First try exact matches
    exact = build_components & synergy_components
    remaining_syn = synergy_components - exact

    # For unmatched synergy components, try normalized prefix matching
    fuzzy = set()
    for syn_comp in remaining_syn:
        syn_norm = _normalize_id(syn_comp)
        for build_comp in build_components:
            build_norm = _normalize_id(build_comp)
            # Match if normalized forms are equal, or one is a prefix/substring of the other
            if syn_norm == build_norm or syn_norm.startswith(build_norm) or build_norm.startswith(syn_norm):
                fuzzy.add(syn_comp)
                break

    return exact | fuzzy


def detect_synergies(build_components: list[str]) -> list[dict]:
    """Detect known synergies in a build's component list.

    Compares build components against the synergies knowledge base
    and returns matching synergies sorted by match score.
    """
    if not build_components:
        return []
    synergies_data = load_data("synergies")
    # synergies.json has a top-level "synergies" key containing a list
    synergy_list = synergies_data.get("synergies", [])
    components_lower = {c.lower() for c in build_components}
    matched = []
    for syn_data in synergy_list:
        if not isinstance(syn_data, dict):
            continue
        # Gather all component references from the synergy entry
        syn_components = (
            syn_data.get("components", [])
            + syn_data.get("talents", [])
            + syn_data.get("weapons", [])
        )
        syn_set = {c.lower() for c in syn_components}

        # Use fuzzy prefix matching to handle ID format differences:
        # Build components use base IDs like "strikers_battlegear" while synergy
        # components use suffixed IDs like "striker_battlegear_4pc". Also handles
        # possessive-s mismatches (strikers vs striker) by normalizing away trailing 's'.
        overlap = _fuzzy_match_components(components_lower, syn_set)
        if overlap:
            match_score = len(overlap) / len(syn_set) if syn_set else 0
            matched.append({
                "synergy": syn_data.get("name", syn_data.get("id", "unknown")),
                "matched_components": list(overlap),
                "total_components": len(syn_set),
                "match_score": round(match_score, 2),
                "notes": syn_data.get("notes", ""),
            })
    # Sort by match score descending
    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched
