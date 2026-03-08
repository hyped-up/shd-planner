/**
 * Stat calculation engine — re-exports all calc modules.
 *
 * Usage:
 *   import { aggregateBuildStats, calculateDPS, validateBuild } from "@/lib/calc";
 */

// Types
export type {
  IBrandBonus,
  IGearSetBonus,
  IBuildGearPiece,
  IBuildWeapon,
  IBuildSkill,
  ISHDWatchConfig,
  IBuild,
  IBuildStats,
  IWeapon,
  ISkillVariant,
  IValidationError,
  IValidationResult,
} from "./types";

// Stat aggregation
export { aggregateBuildStats } from "./stat-aggregator";
export {
  ARMOR_PER_CORE,
  MAX_CORES,
  BASE_HEALTH,
  WEAPON_DAMAGE_PER_RED_CORE,
  CHC_CAP,
  BASE_CHD,
  BASE_HSD,
} from "./stat-aggregator";

// Damage calculation
export { calculateDPS, AMPLIFIED_TALENTS } from "./damage-calculator";
export type { IDPSBreakdown, IFormulaStep } from "./damage-calculator";

// Skill calculation
export { calculateSkillStats, MAX_SKILL_TIER, SKILL_TIER_SCALING_FACTOR } from "./skill-calculator";
export type { IEffectiveSkillStats } from "./skill-calculator";

// Build validation
export { validateBuild } from "./build-validator";
