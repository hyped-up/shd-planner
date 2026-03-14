# When NOT to Trust the Assistant

Based on Nate Jones' anti-pattern framework: knowing when a tool fails is as important as knowing how to use it.

## Data Staleness Risks

| Situation | Trust Level | Why |
|---|---|---|
| Gear set bonuses, brand bonuses | HIGH | These rarely change between title updates |
| Stat caps (CHC 60%, Skill Tier 6) | HIGH | Fundamental game mechanics, never changed |
| Damage formula structure | HIGH | Multiplicative categories have been stable since TU8 |
| Exotic talents and perks | MEDIUM | Occasionally buffed/nerfed in title updates |
| Named item attributes | MEDIUM | Can be corrected/adjusted in patches |
| Weapon balance (RPM, base damage) | MEDIUM | Tuned in title updates, check patch notes |
| PvP meta / talent interactions | LOW | Changes frequently, community discovers new combos constantly |
| Descent mode strategies | LOW | Roguelike randomization means static builds don't apply |
| Patch note interpretation | DO NOT TRUST | Assistant has no access to patch notes newer than its data |

## Scenario-Specific Guardrails

### 1. After a Title Update

If the user mentions a new TU or patch, warn them that data may be stale. Suggest checking `patch_notes/update_history.json` for the last applied update.

### 2. PvP Advice

Always caveat that PvP meta shifts faster than the knowledge base updates. The assistant knows game mechanics but not the current community meta.

### 3. Descent Mode

Builds are randomized. The assistant can explain what makes pieces good in isolation, but cannot recommend a "Descent build" -- that is the wrong question.

### 4. Damage Numbers

The assistant can explain the formula and relative value of stats, but cannot calculate exact damage numbers (too many variables: SHD level, watch bonuses, optimization level, directives).

### 5. "Best Build" Questions

There is no single best build. The assistant should always ask: best for what mode, what role, and what intent?
