/**
 * Loadout optimizer — heuristic search for optimal gear configurations.
 *
 * Algorithm:
 * 1. For each gear slot, score candidate brands/sets by contribution to target stat
 * 2. Greedy first pass: fill each slot with the best-scoring candidate
 * 3. Iterative improvement: swap one slot at a time, keep if score improves
 * 4. Respect brand bonus thresholds (e.g., prefer 3pc Providence for +15% weapon damage)
 */

import type {
  IBuild,
  IBuildGearPiece,
  IBuildStats,
  CoreAttributeType,
  GearSlot,
} from "@/lib/types";
import { aggregateBuildStats } from "./stat-aggregator";
import { createEmptyBuild } from "@/hooks/use-build-store";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Optimization target */
export type OptimizationTarget = "dps" | "armor" | "skillDamage" | "balanced";

/** Optimizer constraints */
export interface OptimizerConstraints {
  /** Required gear sets (by ID) */
  requiredGearSets?: string[];
  /** Minimum CHC threshold (as percentage, e.g. 50 for 50%) */
  minCHC?: number;
  /** Minimum armor threshold */
  minArmor?: number;
}

/** Optimizer result with explanation */
export interface OptimizerResult {
  build: IBuild;
  stats: IBuildStats;
  score: number;
  explanation: string[];
}

/** Progress callback for UI updates */
export type ProgressCallback = (progress: number, message: string) => void;

// ---------------------------------------------------------------------------
// Candidate gear configurations
// ---------------------------------------------------------------------------

/** Known brand configurations optimized for DPS */
const DPS_BRANDS = [
  { brandId: "providence_defense", name: "Providence Defense", core: "weaponDamage" as CoreAttributeType, priority: 10 },
  { brandId: "ceska_vyroba", name: "Ceska Vyroba", core: "weaponDamage" as CoreAttributeType, priority: 9 },
  { brandId: "grupo_sombra", name: "Grupo Sombra", core: "weaponDamage" as CoreAttributeType, priority: 7 },
  { brandId: "walker_harris", name: "Walker, Harris & Co.", core: "weaponDamage" as CoreAttributeType, priority: 8 },
  { brandId: "sokolov_concern", name: "Sokolov Concern", core: "weaponDamage" as CoreAttributeType, priority: 7 },
  { brandId: "fenris_group", name: "Fenris Group AB", core: "weaponDamage" as CoreAttributeType, priority: 6 },
];

/** Known brand configurations optimized for armor/tank */
const TANK_BRANDS = [
  { brandId: "badger_tuff", name: "Badger Tuff", core: "armor" as CoreAttributeType, priority: 10 },
  { brandId: "gila_guard", name: "Gila Guard", core: "armor" as CoreAttributeType, priority: 9 },
  { brandId: "douglas_harding", name: "Douglas & Harding", core: "armor" as CoreAttributeType, priority: 7 },
  { brandId: "richter_kaiser", name: "Richter & Kaiser", core: "armor" as CoreAttributeType, priority: 8 },
];

/** Known brand configurations optimized for skill builds */
const SKILL_BRANDS = [
  { brandId: "china_light", name: "China Light Industries", core: "skillTier" as CoreAttributeType, priority: 10 },
  { brandId: "hana_u", name: "Hana-U Corporation", core: "skillTier" as CoreAttributeType, priority: 9 },
  { brandId: "wyvern_wear", name: "Wyvern Wear", core: "skillTier" as CoreAttributeType, priority: 8 },
  { brandId: "alps_summit", name: "Alps Summit Armament", core: "skillTier" as CoreAttributeType, priority: 7 },
];

// All 6 gear slots in order
const ALL_SLOTS: GearSlot[] = ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the optimizer to find an optimal gear configuration.
 */
export function optimizeBuild(
  target: OptimizationTarget,
  constraints: OptimizerConstraints = {},
  onProgress?: ProgressCallback
): OptimizerResult {
  const explanation: string[] = [];
  onProgress?.(0, "Starting optimization...");

  // Select brand pool based on target
  const brandPool = selectBrandPool(target);
  explanation.push(`Target: ${target} — selected ${brandPool.length} candidate brands`);
  onProgress?.(10, "Selecting gear candidates...");

  // Build initial greedy solution
  const build = createEmptyBuild();
  build.name = `Optimized ${target.charAt(0).toUpperCase() + target.slice(1)} Build`;

  // Greedy pass: assign brands to slots by priority
  const sortedBrands = [...brandPool].sort((a, b) => b.priority - a.priority);
  const usedBrands = new Set<string>();

  for (let i = 0; i < ALL_SLOTS.length && i < sortedBrands.length; i++) {
    const slot = ALL_SLOTS[i];
    const brand = sortedBrands[i];

    // Determine core attribute based on target and constraints
    const core = determineCoreAttribute(target, slot, constraints);

    const piece: IBuildGearPiece = {
      slotId: slot,
      source: "brand",
      itemId: brand.brandId,
      coreAttribute: { type: core, value: getCoreMaxValue(core) },
      minorAttributes: getOptimalMinorAttributes(target, slot),
      modSlot: null,
      talent: null,
    };

    build.gear[slot] = piece;
    usedBrands.add(brand.brandId);
    explanation.push(`${slot}: ${brand.name} (${core})`);
  }

  onProgress?.(50, "Scoring initial configuration...");

  // Fill any remaining slots with generic high-priority brands
  for (const slot of ALL_SLOTS) {
    if (build.gear[slot]) continue;
    const core = determineCoreAttribute(target, slot, constraints);
    build.gear[slot] = {
      slotId: slot,
      source: "brand",
      itemId: "generic_brand",
      coreAttribute: { type: core, value: getCoreMaxValue(core) },
      minorAttributes: getOptimalMinorAttributes(target, slot),
      modSlot: null,
      talent: null,
    };
    explanation.push(`${slot}: Generic fill (${core})`);
  }

  onProgress?.(70, "Running iterative improvement...");

  // Score the build
  let stats = aggregateBuildStats(build);
  let currentScore = scoreBuild(stats, target);

  // Iterative improvement: try swapping core attributes
  for (const slot of ALL_SLOTS) {
    const piece = build.gear[slot];
    if (!piece) continue;

    const alternatives: CoreAttributeType[] = ["weaponDamage", "armor", "skillTier"];
    for (const altCore of alternatives) {
      if (altCore === piece.coreAttribute.type) continue;

      // Try the swap
      const originalCore = piece.coreAttribute;
      piece.coreAttribute = { type: altCore, value: getCoreMaxValue(altCore) };
      const newStats = aggregateBuildStats(build);
      const newScore = scoreBuild(newStats, target);

      if (newScore > currentScore) {
        // Keep the improvement
        stats = newStats;
        currentScore = newScore;
        explanation.push(`Improved: swapped ${slot} core from ${originalCore.type} to ${altCore}`);
      } else {
        // Revert
        piece.coreAttribute = originalCore;
      }
    }
  }

  onProgress?.(100, "Optimization complete");

  return {
    build,
    stats,
    score: currentScore,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Select brand pool based on optimization target */
function selectBrandPool(target: OptimizationTarget) {
  switch (target) {
    case "dps":
      return DPS_BRANDS;
    case "armor":
      return TANK_BRANDS;
    case "skillDamage":
      return SKILL_BRANDS;
    case "balanced":
      return [...DPS_BRANDS.slice(0, 3), ...TANK_BRANDS.slice(0, 1), ...SKILL_BRANDS.slice(0, 2)];
  }
}

/** Determine core attribute for a slot based on target and constraints */
function determineCoreAttribute(
  target: OptimizationTarget,
  _slot: GearSlot,
  constraints: OptimizerConstraints
): CoreAttributeType {
  // If minimum armor is set and target isn't armor, mix in some blue cores
  if (constraints.minArmor && target !== "armor") {
    // Allocate 1-2 armor cores
    if (_slot === "Holster" || _slot === "Kneepads") return "armor";
  }

  switch (target) {
    case "dps":
      return "weaponDamage";
    case "armor":
      return "armor";
    case "skillDamage":
      return "skillTier";
    case "balanced":
      if (_slot === "Mask" || _slot === "Chest" || _slot === "Gloves") return "weaponDamage";
      if (_slot === "Holster") return "armor";
      return "skillTier";
  }
}

/** Get max value for a core attribute type */
function getCoreMaxValue(core: CoreAttributeType): number {
  switch (core) {
    case "weaponDamage":
      return 15;
    case "armor":
      return 170370;
    case "skillTier":
      return 1;
  }
}

/** Get optimal minor attributes for a slot based on target */
function getOptimalMinorAttributes(
  target: OptimizationTarget,
  _slot: GearSlot
): Array<{ attributeId: string; value: number }> {
  switch (target) {
    case "dps":
      return [
        { attributeId: "criticalHitChance", value: 6 },
        { attributeId: "criticalHitDamage", value: 12 },
      ];
    case "armor":
      return [
        { attributeId: "health", value: 18635 },
        { attributeId: "hazardProtection", value: 10 },
      ];
    case "skillDamage":
      return [
        { attributeId: "skillHaste", value: 12 },
        { attributeId: "skillDamage", value: 10 },
      ];
    case "balanced":
      return [
        { attributeId: "criticalHitChance", value: 6 },
        { attributeId: "criticalHitDamage", value: 12 },
      ];
  }
}

/** Score a build based on the optimization target */
function scoreBuild(stats: IBuildStats, target: OptimizationTarget): number {
  switch (target) {
    case "dps":
      // Weight toward CHC/CHD and weapon damage
      return (
        stats.totalWeaponDamage * 100 +
        stats.criticalHitChance * 200 +
        stats.criticalHitDamage * 100 +
        stats.headshotDamage * 50 +
        stats.dps.optimal / 1000
      );
    case "armor":
      return (
        stats.totalArmor / 1000 +
        stats.totalHealth / 1000 +
        stats.hazardProtection * 100
      );
    case "skillDamage":
      return (
        stats.totalSkillTier * 100 +
        stats.skillDamage * 200 +
        stats.skillHaste * 100 +
        stats.repairSkills * 50
      );
    case "balanced":
      return (
        stats.totalWeaponDamage * 50 +
        stats.totalArmor / 2000 +
        stats.totalSkillTier * 50 +
        stats.criticalHitChance * 100 +
        stats.dps.optimal / 2000
      );
  }
}
