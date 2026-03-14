#!/usr/bin/env python3
"""Division 2 Build-Crafting Assistant MCP Server.

Provides 8 tools for querying Division 2 game data, analyzing builds,
detecting synergies, and validating stat allocations.
"""

from mcp.server.fastmcp import FastMCP
from tools.lookup import lookup_gear, lookup_weapon, lookup_talent, lookup_skill
from tools.build_analyzer import analyze_build, suggest_build
from tools.stat_calculator import check_stats, compare_items

# Create MCP server
mcp = FastMCP("shd-planner-cwd")


@mcp.tool()
def div2_lookup_gear(query: str) -> dict:
    """Look up any Division 2 gear set, brand set, exotic, or named item.

    Search by name, abbreviation, or keyword.
    Examples: "Striker", "SB", "Eclipse Protocol", "Coyote's Mask", "Fox's Prayer"
    """
    result = lookup_gear(query)
    if result is None:
        return {"error": f"No gear found matching '{query}'"}
    return result


@mcp.tool()
def div2_lookup_weapon(query: str) -> dict:
    """Look up Division 2 weapon stats, types, and archetypes.

    Search by weapon name, type, or archetype.
    Examples: "M4", "assault rifle", "LMG", "Pestilence", "Eagle Bearer"
    """
    result = lookup_weapon(query)
    if result is None:
        return {"error": f"No weapon found matching '{query}'"}
    return result


@mcp.tool()
def div2_lookup_talent(query: str) -> dict:
    """Look up a Division 2 gear or weapon talent.

    Search by talent name.
    Examples: "Obliterate", "Vigilance", "Glass Cannon", "Measured", "In Sync"
    """
    result = lookup_talent(query)
    if result is None:
        return {"error": f"No talent found matching '{query}'"}
    return result


@mcp.tool()
def div2_lookup_skill(query: str) -> dict:
    """Look up a Division 2 skill or skill variant.

    Search by skill name or variant name.
    Examples: "Assault Turret", "Striker Drone", "Restorer Hive", "Artificer"
    """
    result = lookup_skill(query)
    if result is None:
        return {"error": f"No skill found matching '{query}'"}
    return result


@mcp.tool()
def div2_analyze_build(
    gear: list[str],
    weapons: list[str],
    skills: list[str],
    specialization: str,
) -> dict:
    """Analyze a Division 2 build for set bonuses, synergies, and optimization opportunities.

    Args:
        gear: List of 6 gear piece IDs (gear set or brand set names)
        weapons: List of 2 weapon names/IDs
        skills: List of 2 skill variant names
        specialization: Specialization name
    """
    build = {
        "gear": gear,
        "weapons": weapons,
        "skills": skills,
        "specialization": specialization,
    }
    return analyze_build(build)


@mcp.tool()
def div2_suggest_build(
    role: str, mode: str, constraints: list[str] | None = None
) -> dict:
    """Suggest Division 2 builds for a given role and game mode.

    Args:
        role: Build role - dps, tank, healer, skill, hybrid, cc
        mode: Game mode - legendary, raid, pvp, countdown, descent, general
        constraints: Optional list of required gear/weapons to include
    """
    results = suggest_build(role, mode, constraints)
    if not results:
        return {
            "message": f"No pre-built suggestions for role='{role}' "
            f"mode='{mode}'. Try broader terms."
        }
    return {"suggestions": results}


@mcp.tool()
def div2_check_stats(stats: dict[str, float]) -> dict:
    """Validate Division 2 stat allocations against known caps.

    Check if stats exceed caps and identify wasted points.
    Example input: {"critical_hit_chance": 65, "critical_hit_damage": 180}
    """
    return check_stats(stats)


@mcp.tool()
def div2_compare(item_a: dict, item_b: dict) -> dict:
    """Compare two Division 2 items or builds side-by-side.

    Args:
        item_a: First item dict with name and stats
        item_b: Second item dict with name and stats
    """
    return compare_items(item_a, item_b)


def main():
    """Run the MCP server over stdio."""
    mcp.run()


if __name__ == "__main__":
    main()
