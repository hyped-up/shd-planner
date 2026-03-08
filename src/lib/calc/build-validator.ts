/**
 * Build validator — checks a complete IBuild for rule violations and warnings.
 *
 * Validates gear slot rules, exotic limits, talent restrictions, attribute caps,
 * and completeness to help players catch build mistakes before they commit.
 */

import type { IBuild, IValidationError, IValidationResult } from "./types";
import type { GearSlot } from "@/lib/types/enums";
import { CHC_CAP } from "./stat-aggregator";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All six gear slots that should be filled */
const ALL_GEAR_SLOTS: GearSlot[] = [
  "Mask",
  "Backpack",
  "Chest",
  "Gloves",
  "Holster",
  "Kneepads",
];

/** Only chest and backpack can carry gear talents */
const TALENT_ELIGIBLE_SLOTS: GearSlot[] = ["Chest", "Backpack"];

/** Maximum skill tier value */
const MAX_SKILL_TIER = 6;

// ---------------------------------------------------------------------------
// Known attribute caps (value as displayed, e.g. 6 = 6%)
// ---------------------------------------------------------------------------

const ATTRIBUTE_CAPS: Record<string, number> = {
  criticalHitChance: 6,
  chc: 6,
  criticalHitDamage: 12,
  chd: 12,
  headshotDamage: 10,
  hsd: 10,
  weaponHandling: 8,
  skillDamage: 10,
  repairSkills: 20,
  skillHaste: 12,
  skillDuration: 12,
  hazardProtection: 10,
  explosiveResistance: 10,
  health: 18635,
  armor: 170370,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a complete build and returns all errors and warnings.
 *
 * Checks performed:
 * - No more than 1 exotic gear piece equipped
 * - Talents only on chest and backpack
 * - Minor attribute values within max bounds
 * - CHC total does not exceed 60% cap (warning)
 * - Skill tier does not exceed 6 (warning)
 * - All 6 gear slots filled (warning if not)
 * - At least one weapon equipped (warning if not)
 */
export function validateBuild(build: IBuild): IValidationResult {
  const errors: IValidationError[] = [];

  // -----------------------------------------------------------------------
  // Check 1: Exotic gear limit (max 1 exotic gear piece)
  // -----------------------------------------------------------------------
  const exoticGearPieces = Object.values(build.gear).filter(
    (p) => p !== undefined && p !== null && p.source === "exotic"
  );
  if (exoticGearPieces.length > 1) {
    errors.push({
      field: "gear",
      message: `Only 1 exotic gear piece allowed, but ${exoticGearPieces.length} are equipped`,
      severity: "error",
    });
  }

  // -----------------------------------------------------------------------
  // Check 2: Talent slot restrictions
  // -----------------------------------------------------------------------
  for (const [slotId, piece] of Object.entries(build.gear)) {
    if (!piece) continue;
    if (
      piece.talent &&
      !TALENT_ELIGIBLE_SLOTS.includes(slotId as GearSlot)
    ) {
      errors.push({
        field: `gear.${slotId}.talent`,
        message: `${slotId} cannot have a talent — only Chest and Backpack support talents`,
        severity: "error",
      });
    }
  }

  // -----------------------------------------------------------------------
  // Check 3: Attribute values within max bounds
  // -----------------------------------------------------------------------
  for (const [slotId, piece] of Object.entries(build.gear)) {
    if (!piece) continue;
    for (const attr of piece.minorAttributes) {
      const cap = ATTRIBUTE_CAPS[attr.attributeId];
      if (cap !== undefined && attr.value > cap) {
        errors.push({
          field: `gear.${slotId}.${attr.attributeId}`,
          message: `${attr.attributeId} value ${attr.value} exceeds max of ${cap}`,
          severity: "error",
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Check 4: Gear set pieces in valid slots (all 6 slots are valid for
  // gear sets, but gear set pieces cannot have talents — they use the
  // set 4pc talent instead)
  // -----------------------------------------------------------------------
  for (const [slotId, piece] of Object.entries(build.gear)) {
    if (!piece) continue;
    if (piece.source === "gearset" && piece.talent) {
      errors.push({
        field: `gear.${slotId}.talent`,
        message: `Gear set pieces cannot have individual talents — the 4-piece bonus replaces the talent`,
        severity: "error",
      });
    }
  }

  // -----------------------------------------------------------------------
  // Check 5: CHC cap warning
  // -----------------------------------------------------------------------
  const totalCHC = computeTotalCHC(build);
  if (totalCHC > CHC_CAP * 100) {
    errors.push({
      field: "stats.criticalHitChance",
      message: `Total CHC (${totalCHC.toFixed(1)}%) exceeds the 60% cap — ${(totalCHC - 60).toFixed(1)}% is wasted`,
      severity: "warning",
    });
  }

  // -----------------------------------------------------------------------
  // Check 6: Skill tier cap warning
  // -----------------------------------------------------------------------
  const totalSkillTier = computeTotalSkillTier(build);
  if (totalSkillTier > MAX_SKILL_TIER) {
    errors.push({
      field: "stats.skillTier",
      message: `Total Skill Tier (${totalSkillTier}) exceeds the cap of ${MAX_SKILL_TIER}`,
      severity: "warning",
    });
  }

  // -----------------------------------------------------------------------
  // Check 7: All 6 gear slots used (warning)
  // -----------------------------------------------------------------------
  const emptySlots = ALL_GEAR_SLOTS.filter(
    (slot) => !build.gear[slot]
  );
  if (emptySlots.length > 0) {
    errors.push({
      field: "gear",
      message: `Empty gear slots: ${emptySlots.join(", ")}`,
      severity: "warning",
    });
  }

  // -----------------------------------------------------------------------
  // Check 8: At least one weapon equipped (warning)
  // -----------------------------------------------------------------------
  const hasWeapon =
    build.weapons.primary !== null ||
    build.weapons.secondary !== null ||
    build.weapons.sidearm !== null;
  if (!hasWeapon) {
    errors.push({
      field: "weapons",
      message: "No weapons equipped",
      severity: "warning",
    });
  }

  // Build is valid if there are no "error" severity issues
  const valid = errors.filter((e) => e.severity === "error").length === 0;

  return { valid, errors };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Quick CHC summation across gear minor attributes and SHD watch.
 * Returns the total as a percentage number (e.g. 62.5 for 62.5%).
 */
function computeTotalCHC(build: IBuild): number {
  let total = 0;
  for (const piece of Object.values(build.gear)) {
    if (!piece) continue;
    for (const attr of piece.minorAttributes) {
      if (attr.attributeId === "criticalHitChance" || attr.attributeId === "chc") {
        total += attr.value;
      }
    }
    if (piece.modSlot) {
      if (piece.modSlot.modId === "criticalHitChance" || piece.modSlot.modId === "chc") {
        total += piece.modSlot.value;
      }
    }
  }
  total += build.shdWatch.criticalHitChance;
  return total;
}

/**
 * Quick skill tier count from core attributes and SHD watch.
 */
function computeTotalSkillTier(build: IBuild): number {
  let total = 0;
  for (const piece of Object.values(build.gear)) {
    if (!piece) continue;
    if (piece.coreAttribute.type === "skillTier") {
      total += 1;
    }
  }
  total += build.shdWatch.skillTier;
  return total;
}
