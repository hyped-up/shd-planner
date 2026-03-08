/**
 * Skill calculator — computes effective skill stats based on skill tier and bonuses.
 *
 * Division 2 skill tier scaling:
 *   Each skill tier (0-6) adds roughly 10% to base skill stats.
 *   Additional bonuses from gear attributes (skill damage, skill haste,
 *   skill duration, repair skills) stack additively on top.
 */

import type { ISkillVariant } from "./types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Effective stats for a deployed skill after all bonuses */
export interface IEffectiveSkillStats {
  damage: number;
  duration: number;
  cooldown: number;
  health: number;
  radius?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum skill tier */
export const MAX_SKILL_TIER = 6;

/** Base skill tier scaling factor per tier (10% per tier) */
export const SKILL_TIER_SCALING_FACTOR = 0.10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates effective skill stats after applying tier scaling and gear bonuses.
 *
 * For each stat in the skill variant:
 * 1. Start with the base value from the variant definition
 * 2. Apply tier scaling: if `tierScaling` array exists for the stat, use the
 *    value at the given tier index; otherwise multiply by (1 + tier * 10%)
 * 3. Apply additive bonuses from gear (skill damage %, skill haste %, etc.)
 *
 * Cooldown is reduced by skill haste using the formula:
 *   effectiveCooldown = baseCooldown / (1 + skillHasteBonus)
 *
 * @param skillVariant     - The skill variant definition with base stats and tier scaling
 * @param skillTier        - Current skill tier (0-6), clamped to MAX_SKILL_TIER
 * @param skillDamageBonus - Total skill damage bonus from gear (decimal, e.g. 0.30 = 30%)
 * @param skillHasteBonus  - Total skill haste bonus from gear (decimal, e.g. 0.20 = 20%)
 * @param skillDurationBonus - Total skill duration bonus from gear (decimal)
 * @param skillRepairBonus - Total repair skills bonus from gear (decimal)
 */
export function calculateSkillStats(
  skillVariant: ISkillVariant,
  skillTier: number,
  skillDamageBonus: number,
  skillHasteBonus: number,
  skillDurationBonus: number,
  skillRepairBonus: number
): IEffectiveSkillStats {
  // Clamp tier to valid range
  const tier = Math.min(Math.max(Math.round(skillTier), 0), MAX_SKILL_TIER);

  const base = skillVariant.baseStats;
  const scaling = skillVariant.tierScaling;

  // Helper: resolve a stat's tier-scaled value
  const tierScaled = (statKey: string): number => {
    const baseVal = base[statKey] ?? 0;
    if (baseVal === 0) return 0;

    // If explicit tier scaling array exists, use the value at the tier index
    if (scaling[statKey] && scaling[statKey].length > tier) {
      return scaling[statKey][tier];
    }

    // Fallback: linear 10% per tier
    return baseVal * (1 + tier * SKILL_TIER_SCALING_FACTOR);
  };

  // Calculate each effective stat
  const baseDamage = tierScaled("damage");
  const effectiveDamage = baseDamage * (1 + skillDamageBonus);

  const baseDuration = tierScaled("duration");
  const effectiveDuration = baseDuration * (1 + skillDurationBonus);

  const baseCooldown = tierScaled("cooldown");
  // Skill haste reduces cooldown: cooldown / (1 + haste%)
  const effectiveCooldown =
    skillHasteBonus > 0 ? baseCooldown / (1 + skillHasteBonus) : baseCooldown;

  const baseHealth = tierScaled("health");
  // Repair skills increases skill health/healing
  const effectiveHealth = baseHealth * (1 + skillRepairBonus);

  // Optional: radius (some skills have area of effect)
  const baseRadius = base["radius"];
  const effectiveRadius = baseRadius !== undefined ? tierScaled("radius") : undefined;

  return {
    damage: Math.round(effectiveDamage),
    duration: parseFloat(effectiveDuration.toFixed(2)),
    cooldown: parseFloat(effectiveCooldown.toFixed(2)),
    health: Math.round(effectiveHealth),
    ...(effectiveRadius !== undefined && { radius: parseFloat(effectiveRadius.toFixed(2)) }),
  };
}
