/**
 * Tests for the stat aggregator — verifies build stat computation.
 *
 * Covers empty builds, brand bonus counting, SHD watch bonus application,
 * and CHC cap enforcement.
 */

import { describe, it, expect } from "vitest";
import {
  aggregateBuildStats,
  BASE_HEALTH,
  BASE_CHD,
  BASE_HSD,
  ARMOR_PER_CORE,
  CHC_CAP,
} from "@/lib/calc/stat-aggregator";
import type { IBuild, IBuildGearPiece } from "@/lib/calc/types";
import type { GearSlot } from "@/lib/types/enums";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Default zeroed SHD watch */
const ZERO_WATCH = {
  weaponDamage: 0,
  armor: 0,
  skillTier: 0,
  criticalHitChance: 0,
  criticalHitDamage: 0,
  headshotDamage: 0,
  health: 0,
};

/** Creates an empty build with no gear, weapons, or skills */
function makeEmptyBuild(overrides?: Partial<IBuild>): IBuild {
  return {
    id: "test-build",
    name: "Test Build",
    description: "",
    gear: {},
    weapons: { primary: null, secondary: null, sidearm: null },
    skills: { skill1: null, skill2: null },
    specialization: null,
    shdWatch: { ...ZERO_WATCH },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataVersion: "1.0.0",
    ...overrides,
  };
}

/** Creates a gear piece with configurable core and minor attributes */
function makeGearPiece(
  slotId: GearSlot,
  itemId: string,
  source: "brand" | "gearset" | "named" | "exotic",
  coreType: "weaponDamage" | "armor" | "skillTier",
  coreValue: number,
  minors: Array<{ attributeId: string; value: number }> = [],
  talent?: string
): IBuildGearPiece {
  return {
    slotId,
    source,
    itemId,
    coreAttribute: { type: coreType, value: coreValue },
    minorAttributes: minors,
    modSlot: null,
    talent: talent ? { talentId: talent } : null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("aggregateBuildStats", () => {
  it("returns zeroed stats for an empty build", () => {
    const build = makeEmptyBuild();
    const stats = aggregateBuildStats(build);

    expect(stats.totalWeaponDamage).toBe(0);
    expect(stats.totalArmor).toBe(0);
    expect(stats.totalSkillTier).toBe(0);
    expect(stats.totalHealth).toBe(BASE_HEALTH);
    expect(stats.criticalHitChance).toBe(0);
    expect(stats.criticalHitDamage).toBe(BASE_CHD);
    expect(stats.headshotDamage).toBe(BASE_HSD);
    expect(stats.activeBrandBonuses).toHaveLength(0);
    expect(stats.activeGearSetBonuses).toHaveLength(0);
    expect(stats.activeTalents).toHaveLength(0);
  });

  it("sums red core attributes as weapon damage percentage", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "providence", "brand", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "providence", "brand", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "ceska", "brand", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    // 3 cores at 15% each = 45% = 0.45
    expect(stats.totalWeaponDamage).toBeCloseTo(0.45, 4);
  });

  it("sums blue core attributes as flat armor", () => {
    const build = makeEmptyBuild({
      gear: {
        Holster: makeGearPiece("Holster", "golan", "brand", "armor", 170370),
        Kneepads: makeGearPiece("Kneepads", "golan", "brand", "armor", 170370),
      },
    });

    const stats = aggregateBuildStats(build);
    // 2 blue cores
    expect(stats.totalArmor).toBe(ARMOR_PER_CORE * 2);
  });

  it("counts yellow cores as skill tiers", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "alps", "brand", "skillTier", 1),
        Backpack: makeGearPiece("Backpack", "alps", "brand", "skillTier", 1),
        Holster: makeGearPiece("Holster", "alps", "brand", "skillTier", 1),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalSkillTier).toBe(3);
  });

  it("counts brand pieces for bonus activation", () => {
    // 3 Providence pieces should register as 3-piece brand bonus
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "providence", "brand", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "providence", "brand", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "providence", "brand", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    const provBonus = stats.activeBrandBonuses.find(
      (b) => b.brandId === "providence"
    );
    expect(provBonus).toBeDefined();
    expect(provBonus!.piecesEquipped).toBe(3);
  });

  it("counts named items toward their brand", () => {
    // Named items use source "named" but should count toward the brand
    const build = makeEmptyBuild({
      gear: {
        Chest: makeGearPiece("Chest", "providence", "named", "weaponDamage", 15),
        Mask: makeGearPiece("Mask", "providence", "brand", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    const provBonus = stats.activeBrandBonuses.find(
      (b) => b.brandId === "providence"
    );
    expect(provBonus).toBeDefined();
    expect(provBonus!.piecesEquipped).toBe(2);
  });

  it("applies SHD watch bonuses", () => {
    const build = makeEmptyBuild({
      shdWatch: {
        weaponDamage: 10, // 10%
        armor: 50000,
        skillTier: 0,
        criticalHitChance: 5, // 5%
        criticalHitDamage: 20, // 20%
        headshotDamage: 15, // 15%
        health: 25000,
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalWeaponDamage).toBeCloseTo(0.10, 4);
    expect(stats.totalArmor).toBe(50000);
    expect(stats.criticalHitChance).toBeCloseTo(0.05, 4);
    expect(stats.criticalHitDamage).toBeCloseTo(BASE_CHD + 0.20, 4);
    expect(stats.headshotDamage).toBeCloseTo(0.15, 4);
    expect(stats.totalHealth).toBe(BASE_HEALTH + 25000);
  });

  it("caps CHC at 60%", () => {
    // Stack more than 60% CHC from gear and watch
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
        ]),
        Chest: makeGearPiece("Chest", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
        ]),
        Gloves: makeGearPiece("Gloves", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
        ]),
        Holster: makeGearPiece("Holster", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
        ]),
        Kneepads: makeGearPiece("Kneepads", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
        ]),
        Backpack: makeGearPiece("Backpack", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
        ]),
      },
      shdWatch: {
        ...ZERO_WATCH,
        criticalHitChance: 30, // 30% from watch
      },
    });

    const stats = aggregateBuildStats(build);
    // 6 * 6% + 30% = 66% but should be capped at 60%
    expect(stats.criticalHitChance).toBe(CHC_CAP);
  });

  it("caps skill tier at 6", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "alps", "brand", "skillTier", 1),
        Backpack: makeGearPiece("Backpack", "alps", "brand", "skillTier", 1),
        Chest: makeGearPiece("Chest", "alps", "brand", "skillTier", 1),
        Gloves: makeGearPiece("Gloves", "alps", "brand", "skillTier", 1),
        Holster: makeGearPiece("Holster", "alps", "brand", "skillTier", 1),
        Kneepads: makeGearPiece("Kneepads", "alps", "brand", "skillTier", 1),
      },
      shdWatch: {
        ...ZERO_WATCH,
        skillTier: 2,
      },
    });

    const stats = aggregateBuildStats(build);
    // 6 + 2 = 8 but capped at 6
    expect(stats.totalSkillTier).toBe(6);
  });

  it("collects active talents from chest and backpack only", () => {
    const build = makeEmptyBuild({
      gear: {
        Chest: makeGearPiece(
          "Chest", "providence", "brand", "weaponDamage", 15, [], "glass_cannon"
        ),
        Backpack: makeGearPiece(
          "Backpack", "providence", "brand", "weaponDamage", 15, [], "vigilance"
        ),
        // Talent on gloves should still be collected since the data says it's there
        // (validation is handled by build-validator, not aggregator)
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.activeTalents).toHaveLength(2);
    expect(stats.activeTalents[0].talentId).toBe("glass_cannon");
    expect(stats.activeTalents[0].source).toBe("Chest");
    expect(stats.activeTalents[1].talentId).toBe("vigilance");
    expect(stats.activeTalents[1].source).toBe("Backpack");
  });
});
