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

// ---------------------------------------------------------------------------
// Extended edge-case tests
// ---------------------------------------------------------------------------

describe("aggregateBuildStats — edge cases", () => {
  // Empty build returns all base/zero values
  it("returns BASE_HEALTH, BASE_CHD, and zero for all other stats on empty build", () => {
    const build = makeEmptyBuild();
    const stats = aggregateBuildStats(build);

    expect(stats.totalHealth).toBe(BASE_HEALTH);
    expect(stats.criticalHitDamage).toBe(BASE_CHD);
    expect(stats.totalWeaponDamage).toBe(0);
    expect(stats.totalArmor).toBe(0);
    expect(stats.totalSkillTier).toBe(0);
    expect(stats.criticalHitChance).toBe(0);
    expect(stats.headshotDamage).toBe(0);
    expect(stats.weaponHandlingBonus).toBe(0);
    expect(stats.skillDamage).toBe(0);
    expect(stats.repairSkills).toBe(0);
    expect(stats.skillHaste).toBe(0);
    expect(stats.skillDuration).toBe(0);
    expect(stats.hazardProtection).toBe(0);
    expect(stats.explosiveResistance).toBe(0);
    expect(stats.dps.bodyshot).toBe(0);
    expect(stats.dps.optimal).toBe(0);
    expect(stats.dps.headshot).toBe(0);
  });

  // 6 red cores should yield 90% total weapon damage
  it("6 red cores at 15% each give 90% total weapon damage", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "prov", "brand", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "prov", "brand", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "ceska", "brand", "weaponDamage", 15),
        Holster: makeGearPiece("Holster", "ceska", "brand", "weaponDamage", 15),
        Backpack: makeGearPiece("Backpack", "grupo", "brand", "weaponDamage", 15),
        Kneepads: makeGearPiece("Kneepads", "grupo", "brand", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    // 6 * 15 / 100 = 0.90
    expect(stats.totalWeaponDamage).toBeCloseTo(0.90, 4);
  });

  // 6 blue cores should yield 6 * ARMOR_PER_CORE total armor
  it("6 blue cores give 6 * ARMOR_PER_CORE total armor", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "golan", "brand", "armor", 170370),
        Chest: makeGearPiece("Chest", "golan", "brand", "armor", 170370),
        Gloves: makeGearPiece("Gloves", "golan", "brand", "armor", 170370),
        Holster: makeGearPiece("Holster", "badger", "brand", "armor", 170370),
        Backpack: makeGearPiece("Backpack", "badger", "brand", "armor", 170370),
        Kneepads: makeGearPiece("Kneepads", "badger", "brand", "armor", 170370),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalArmor).toBe(ARMOR_PER_CORE * 6);
  });

  // 6 yellow cores give exactly skill tier 6
  it("6 yellow cores give skill tier 6", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "alps", "brand", "skillTier", 1),
        Chest: makeGearPiece("Chest", "alps", "brand", "skillTier", 1),
        Gloves: makeGearPiece("Gloves", "alps", "brand", "skillTier", 1),
        Holster: makeGearPiece("Holster", "hana", "brand", "skillTier", 1),
        Backpack: makeGearPiece("Backpack", "hana", "brand", "skillTier", 1),
        Kneepads: makeGearPiece("Kneepads", "hana", "brand", "skillTier", 1),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalSkillTier).toBe(6);
  });

  // CHC from minor attributes sums correctly below cap
  it("CHC from minor attributes sums correctly when under cap", () => {
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
      },
    });

    const stats = aggregateBuildStats(build);
    // 3 * 6 / 100 = 0.18
    expect(stats.criticalHitChance).toBeCloseTo(0.18, 4);
  });

  // CHC is capped at 0.60 even with excessive gear minors alone (no watch)
  it("CHC is capped at 0.60 with excessive minor attributes alone", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "chc", value: 15 },
        ]),
        Chest: makeGearPiece("Chest", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "chc", value: 15 },
        ]),
        Gloves: makeGearPiece("Gloves", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "chc", value: 15 },
        ]),
        Holster: makeGearPiece("Holster", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "chc", value: 15 },
        ]),
        Backpack: makeGearPiece("Backpack", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "chc", value: 15 },
        ]),
      },
    });

    const stats = aggregateBuildStats(build);
    // 5 * 15% = 75% but capped at 60%
    expect(stats.criticalHitChance).toBe(CHC_CAP);
  });

  // Skill tier is capped at 6 even with SHD watch adding extra tiers
  it("skill tier is capped at 6 even with SHD watch adding extra", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "alps", "brand", "skillTier", 1),
        Chest: makeGearPiece("Chest", "alps", "brand", "skillTier", 1),
        Gloves: makeGearPiece("Gloves", "alps", "brand", "skillTier", 1),
        Holster: makeGearPiece("Holster", "alps", "brand", "skillTier", 1),
        Backpack: makeGearPiece("Backpack", "alps", "brand", "skillTier", 1),
      },
      shdWatch: {
        ...ZERO_WATCH,
        skillTier: 3,
      },
    });

    const stats = aggregateBuildStats(build);
    // 5 gear + 3 watch = 8, capped at 6
    expect(stats.totalSkillTier).toBe(6);
  });

  // SHD watch weapon damage adds correctly (divided by 100)
  it("SHD watch weapon damage is divided by 100 and added", () => {
    const build = makeEmptyBuild({
      shdWatch: {
        ...ZERO_WATCH,
        weaponDamage: 10, // 10% → 0.10
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalWeaponDamage).toBeCloseTo(0.10, 4);
  });

  // SHD watch armor adds as flat value (not divided)
  it("SHD watch armor adds as a flat value", () => {
    const build = makeEmptyBuild({
      shdWatch: {
        ...ZERO_WATCH,
        armor: 100000,
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalArmor).toBe(100000);
  });

  // SHD watch CHC adds and respects cap
  it("SHD watch CHC adds and respects CHC cap", () => {
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
      },
      shdWatch: {
        ...ZERO_WATCH,
        criticalHitChance: 50, // 50% from watch → 0.50
      },
    });

    const stats = aggregateBuildStats(build);
    // 3 * 6% + 50% = 68%, capped at 60%
    expect(stats.criticalHitChance).toBe(CHC_CAP);
  });

  // Mod slot values are added to the correct stat
  it("mod slot values are added to stats like minor attributes", () => {
    const piece = makeGearPiece("Mask", "ceska", "brand", "weaponDamage", 15);
    // Manually assign a mod slot
    piece.modSlot = { modId: "criticalHitDamage", value: 12 };

    const build = makeEmptyBuild({
      gear: { Mask: piece },
    });

    const stats = aggregateBuildStats(build);
    // Mod 12 / 100 = 0.12, plus BASE_CHD of 0.25
    expect(stats.criticalHitDamage).toBeCloseTo(BASE_CHD + 0.12, 4);
  });

  // Named items count as brand pieces for bonus counting
  it("named items with source 'named' count toward parent brand for bonus counting", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "providence", "named", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "providence", "named", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "providence", "brand", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    const provBonus = stats.activeBrandBonuses.find(
      (b) => b.brandId === "providence"
    );
    expect(provBonus).toBeDefined();
    // 2 named + 1 brand = 3 pieces for providence
    expect(provBonus!.piecesEquipped).toBe(3);
  });

  // Talent on Mask is NOT collected (only Chest and Backpack)
  it("talent on Mask is NOT collected", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece(
          "Mask", "ceska", "brand", "weaponDamage", 15, [], "intimidate"
        ),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.activeTalents).toHaveLength(0);
  });

  // Talent on Gloves, Holster, and Kneepads are NOT collected
  it("talents on Gloves, Holster, and Kneepads are NOT collected", () => {
    const build = makeEmptyBuild({
      gear: {
        Gloves: makeGearPiece(
          "Gloves", "ceska", "brand", "weaponDamage", 15, [], "clutch"
        ),
        Holster: makeGearPiece(
          "Holster", "ceska", "brand", "weaponDamage", 15, [], "adrenaline_rush"
        ),
        Kneepads: makeGearPiece(
          "Kneepads", "ceska", "brand", "weaponDamage", 15, [], "sawyers_kneepads"
        ),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.activeTalents).toHaveLength(0);
  });

  // Mix of core types (3 red, 2 blue, 1 yellow) calculates correctly
  it("mixed core types (3 red, 2 blue, 1 yellow) are calculated correctly", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "prov", "brand", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "prov", "brand", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "prov", "brand", "weaponDamage", 15),
        Holster: makeGearPiece("Holster", "golan", "brand", "armor", 170370),
        Backpack: makeGearPiece("Backpack", "golan", "brand", "armor", 170370),
        Kneepads: makeGearPiece("Kneepads", "alps", "brand", "skillTier", 1),
      },
    });

    const stats = aggregateBuildStats(build);
    // 3 red cores at 15% = 0.45
    expect(stats.totalWeaponDamage).toBeCloseTo(0.45, 4);
    // 2 blue cores
    expect(stats.totalArmor).toBe(ARMOR_PER_CORE * 2);
    // 1 yellow core
    expect(stats.totalSkillTier).toBe(1);
    // Health stays at base
    expect(stats.totalHealth).toBe(BASE_HEALTH);
  });

  // Brand piece counting groups by itemId
  it("brand piece counting groups by itemId, not by slot", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "providence", "brand", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "ceska", "brand", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "ceska", "brand", "weaponDamage", 15),
        Holster: makeGearPiece("Holster", "grupo", "brand", "weaponDamage", 15),
        Backpack: makeGearPiece("Backpack", "grupo", "brand", "weaponDamage", 15),
        Kneepads: makeGearPiece("Kneepads", "grupo", "brand", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    // 3 distinct brands
    expect(stats.activeBrandBonuses).toHaveLength(3);
    // Verify counts per brand
    const prov = stats.activeBrandBonuses.find((b) => b.brandId === "providence");
    const ceska = stats.activeBrandBonuses.find((b) => b.brandId === "ceska");
    const grupo = stats.activeBrandBonuses.find((b) => b.brandId === "grupo");
    expect(prov!.piecesEquipped).toBe(1);
    expect(ceska!.piecesEquipped).toBe(2);
    expect(grupo!.piecesEquipped).toBe(3);
  });

  // Gear set pieces are tracked separately from brand pieces
  it("gear set pieces are tracked in activeGearSetBonuses, not brand bonuses", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "strikers", "gearset", "weaponDamage", 15),
        Chest: makeGearPiece("Chest", "strikers", "gearset", "weaponDamage", 15),
        Gloves: makeGearPiece("Gloves", "strikers", "gearset", "weaponDamage", 15),
        Holster: makeGearPiece("Holster", "strikers", "gearset", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.activeBrandBonuses).toHaveLength(0);
    expect(stats.activeGearSetBonuses).toHaveLength(1);
    expect(stats.activeGearSetBonuses[0].setId).toBe("strikers");
    expect(stats.activeGearSetBonuses[0].piecesEquipped).toBe(4);
  });

  // Multiple minor attributes on a single piece sum independently
  it("multiple minor attributes on one piece are each added to their respective stats", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", "ceska", "brand", "weaponDamage", 15, [
          { attributeId: "criticalHitChance", value: 6 },
          { attributeId: "criticalHitDamage", value: 12 },
        ]),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.criticalHitChance).toBeCloseTo(0.06, 4);
    // CHD = BASE_CHD + 12/100
    expect(stats.criticalHitDamage).toBeCloseTo(BASE_CHD + 0.12, 4);
  });

  // SHD watch health adds to BASE_HEALTH
  it("SHD watch health is added to BASE_HEALTH", () => {
    const build = makeEmptyBuild({
      shdWatch: {
        ...ZERO_WATCH,
        health: 50000,
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.totalHealth).toBe(BASE_HEALTH + 50000);
  });

  // SHD watch CHD adds on top of BASE_CHD
  it("SHD watch CHD is divided by 100 and added to BASE_CHD", () => {
    const build = makeEmptyBuild({
      shdWatch: {
        ...ZERO_WATCH,
        criticalHitDamage: 20,
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.criticalHitDamage).toBeCloseTo(BASE_CHD + 0.20, 4);
  });

  // Exotic source pieces do not count toward brand or gear set bonuses
  it("exotic source pieces are not counted in brand or gear set bonuses", () => {
    const build = makeEmptyBuild({
      gear: {
        Chest: makeGearPiece("Chest", "exotic_chest", "exotic", "weaponDamage", 15),
      },
    });

    const stats = aggregateBuildStats(build);
    expect(stats.activeBrandBonuses).toHaveLength(0);
    expect(stats.activeGearSetBonuses).toHaveLength(0);
    // But the core attribute should still be aggregated
    expect(stats.totalWeaponDamage).toBeCloseTo(0.15, 4);
  });
});
