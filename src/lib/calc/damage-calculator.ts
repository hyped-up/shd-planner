/**
 * Damage calculator — implements the Division 2 damage formula.
 *
 * The Division 2 uses a two-layer multiplicative system:
 *   Final Damage = Base Damage x (1 + Sum_of_Additive%) x Product_of_Amplified
 *
 * Additive sources all stack into a single bucket (weapon damage from cores,
 * brands, watch, gear attributes). Amplified sources each multiply independently
 * (Glass Cannon, Vigilance, Focus, Composure, etc.).
 */

import type { IWeapon, IBuildStats } from "./types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single step in the formula breakdown for transparency */
export interface IFormulaStep {
  name: string;
  value: number;
  type: "base" | "additive" | "amplified" | "multiplier";
}

/** Complete DPS breakdown with formula trace */
export interface IDPSBreakdown {
  bodyDPS: number;
  critDPS: number;
  headshotDPS: number;
  sustainedDPS: number;
  formulaSteps: IFormulaStep[];
}

// ---------------------------------------------------------------------------
// Well-known amplified talent multipliers
// ---------------------------------------------------------------------------

/** Known amplified talents and their multipliers (decimal form) */
export const AMPLIFIED_TALENTS: Record<string, number> = {
  glass_cannon: 0.25,
  vigilance: 0.25,
  focus: 0.60,
  composure: 0.15,
  concussion: 0.10,
  headhunter: 0.0, // Variable — depends on prior headshot kill; placeholder
  obliterate: 0.25, // Max stacks (5 x 5%)
  spark: 0.15,
  combined_arms: 0.30,
  tag_team: 0.40,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates DPS for a weapon given aggregated build stats.
 *
 * Formula:
 *   Hit Damage = baseDamage x (1 + totalAdditiveWD) x ampMultiplier
 *   Body DPS   = Hit Damage x (RPM / 60)
 *   Crit DPS   = (1 - CHC) x BodyDPS + CHC x BodyDPS x (1 + CHD)
 *   HS DPS     = BodyDPS x (1 + HSD)
 *   Sustained  = (BodyDPS x MagSize) / (MagSize / (RPM/60) + ReloadSpeed)
 *
 * @param weapon   - The weapon being fired (base damage, RPM, mag, reload)
 * @param stats    - Aggregated build stats (weapon damage %, CHC, CHD, HSD, talents)
 * @param ampOverrides - Optional map of amplified talent IDs to include
 */
export function calculateDPS(
  weapon: IWeapon,
  stats: IBuildStats,
  ampOverrides?: Record<string, number>
): IDPSBreakdown {
  const steps: IFormulaStep[] = [];

  // --- Step 1: Base weapon damage ---
  const baseDamage = weapon.baseDamage;
  steps.push({ name: "Base Weapon Damage", value: baseDamage, type: "base" });

  // --- Step 2: Total additive weapon damage ---
  // totalWeaponDamage is already a decimal (e.g. 0.90 for 6 red cores at 15% each)
  const additiveWD = stats.totalWeaponDamage;
  steps.push({
    name: "Total Additive Weapon Damage",
    value: additiveWD,
    type: "additive",
  });

  // --- Step 3: Amplified multipliers ---
  let ampMultiplier = 1.0;
  const ampSources = ampOverrides ?? collectAmplifiedFromTalents(stats);

  for (const [talentId, bonus] of Object.entries(ampSources)) {
    if (bonus > 0) {
      ampMultiplier *= 1 + bonus;
      steps.push({
        name: `Amplified: ${talentId}`,
        value: bonus,
        type: "amplified",
      });
    }
  }

  // --- Step 4: Final hit damage ---
  const hitDamage = baseDamage * (1 + additiveWD) * ampMultiplier;
  steps.push({ name: "Hit Damage (final)", value: hitDamage, type: "multiplier" });

  // --- Step 5: DPS variants ---
  const roundsPerSecond = weapon.rpm / 60;

  // Body DPS — no crits, no headshots
  const bodyDPS = hitDamage * roundsPerSecond;

  // Crit DPS — weighted average of body and crit hits
  const chc = stats.criticalHitChance; // Already a decimal (e.g. 0.60)
  const chd = stats.criticalHitDamage; // Already a decimal (e.g. 1.70)
  const critDPS = (1 - chc) * bodyDPS + chc * bodyDPS * (1 + chd);

  // Headshot DPS — every shot is a headshot
  const hsd = stats.headshotDamage; // Decimal
  const headshotDPS = bodyDPS * (1 + hsd);

  // Sustained DPS — factors in magazine dumps and reloads
  // Time to empty mag + reload = total cycle time
  const magDumpTime = weapon.magSize / roundsPerSecond;
  const cycleTime = magDumpTime + weapon.reloadSpeed;
  const sustainedDPS = (hitDamage * weapon.magSize) / cycleTime;

  steps.push({ name: "Body DPS", value: bodyDPS, type: "multiplier" });
  steps.push({ name: "Crit DPS", value: critDPS, type: "multiplier" });
  steps.push({ name: "Headshot DPS", value: headshotDPS, type: "multiplier" });
  steps.push({ name: "Sustained DPS", value: sustainedDPS, type: "multiplier" });

  return {
    bodyDPS,
    critDPS,
    headshotDPS,
    sustainedDPS,
    formulaSteps: steps,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extracts known amplified talent multipliers from the build's active talents.
 */
function collectAmplifiedFromTalents(stats: IBuildStats): Record<string, number> {
  const result: Record<string, number> = {};
  for (const talent of stats.activeTalents) {
    const ampValue = AMPLIFIED_TALENTS[talent.talentId];
    if (ampValue !== undefined && ampValue > 0) {
      result[talent.talentId] = ampValue;
    }
  }
  return result;
}
