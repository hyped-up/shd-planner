# Data Freshness Guide

Map of how quickly different data categories go stale after a Title Update.

| Data Category | Staleness Risk | Check Frequency | Validation Method |
|---|---|---|---|
| Stat caps (CHC, Skill Tier) | Never changes | Never | N/A |
| Damage formula structure | Never changes | Never | N/A |
| Gear set bonuses | Very low | Per title update | Compare to patch notes |
| Brand set bonuses | Very low | Per title update | Compare to patch notes |
| Exotic talents | Low-medium | Per title update | Check for balance adjustments |
| Named items | Low-medium | Per title update | Check for new additions |
| Weapon stats (RPM, base damage) | Medium | Per title update | Check balance patch |
| Talent values (damage %, duration) | Medium | Per title update | Check balance patch |
| Skill cooldowns and damage | Medium | Per title update | Check balance patch |
| Synergy archetypes | Medium-high | Per title update + community meta | Monitor community builds |
| Mode-specific recommendations | High | Monthly | Community meta changes independently |
| PvP-specific advice | Very high | Weekly | PvP meta shifts constantly |

## Freshness Workflow

1. Check `data/_metadata` fields in each JSON file for `game_version` and `last_updated`
2. Compare against current title update number
3. If data is >1 TU behind, warn the user before making recommendations
4. Use `patch_notes/update_history.json` to see what was last applied

## Automated Staleness Check

The assistant should check metadata dates when `div2_suggest_build` or `div2_analyze_build` is called. If any data file's `game_version` is older than what the user mentions (or if the last_updated is >90 days ago), prepend a freshness warning to the response.
