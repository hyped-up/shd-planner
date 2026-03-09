/**
 * Tests for the Division 2 damage calculator.
 *
 * Uses known values to verify body DPS, crit DPS, headshot DPS,
 * sustained DPS, and edge cases (0% CHC, 60% CHC cap).
 */

import { describe, it, expect } from "vitest";
import { calculateDPS } from "@/lib/calc/damage-calculator";
import type { IWeapon, IBuildStats } from "@/lib/calc/types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** A generic AR for predictable math: 100k base, 600 RPM, 30 mag, 2s reload */
function makeTestWeapon(overrides?: Partial<IWeapon>): IWeapon {
  return {
    id: "test_ar",
    name: "Test AR",
    type: "Assault Rifles",
    rpm: 600,
    magSize: 30,
    reloadSpeed: 2,
    baseDamage: 100_000,
    nativeAttribute: "healthDamage",
    modSlots: ["optic", "magazine", "muzzle", "underbarrel"],
    ...overrides,
  };
}

/** Minimal build stats — zeroed bonuses for baseline calculations */
function makeBaseStats(overrides?: Partial<IBuildStats>): IBuildStats {
  return {
    totalWeaponDamage: 0,
    totalArmor: 0,
    totalSkillTier: 0,
    totalHealth: 245_000,
    criticalHitChance: 0,
    criticalHitDamage: 0.25, // 25% base CHD
    headshotDamage: 0,
    weaponHandlingBonus: 0,
    skillDamage: 0,
    repairSkills: 0,
    skillHaste: 0,
    skillDuration: 0,
    hazardProtection: 0,
    explosiveResistance: 0,
    activeBrandBonuses: [],
    activeGearSetBonuses: [],
    activeTalents: [],
    dps: { bodyshot: 0, optimal: 0, headshot: 0 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calculateDPS", () => {
  it("calculates body DPS with no bonuses", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats();
    const result = calculateDPS(weapon, stats);

    // Body DPS = 100,000 * (600/60) = 1,000,000
    expect(result.bodyDPS).toBeCloseTo(1_000_000, 0);
  });

  it("applies additive weapon damage correctly", () => {
    const weapon = makeTestWeapon();
    // 6 red cores at 15% each = 90% total additive WD
    const stats = makeBaseStats({ totalWeaponDamage: 0.9 });
    const result = calculateDPS(weapon, stats);

    // Hit = 100,000 * (1 + 0.9) = 190,000
    // Body DPS = 190,000 * 10 = 1,900,000
    expect(result.bodyDPS).toBeCloseTo(1_900_000, 0);
  });

  it("calculates crit DPS with 50% CHC and 100% CHD", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats({
      criticalHitChance: 0.50,
      criticalHitDamage: 1.00, // 100% CHD
    });
    const result = calculateDPS(weapon, stats);

    // Body DPS = 1,000,000
    // Crit DPS = (0.5 * 1,000,000) + (0.5 * 1,000,000 * (1 + 1.0))
    //          = 500,000 + 1,000,000 = 1,500,000
    expect(result.critDPS).toBeCloseTo(1_500_000, 0);
  });

  it("calculates headshot DPS", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats({
      headshotDamage: 0.50, // 50% HSD
    });
    const result = calculateDPS(weapon, stats);

    // Headshot DPS = 1,000,000 * (1 + 0.50) = 1,500,000
    expect(result.headshotDPS).toBeCloseTo(1_500_000, 0);
  });

  it("calculates sustained DPS with reload factored in", () => {
    const weapon = makeTestWeapon(); // 30 mag, 600 RPM, 2s reload
    const stats = makeBaseStats();
    const result = calculateDPS(weapon, stats);

    // Mag dump time = 30 / 10 = 3 seconds
    // Cycle time = 3 + 2 = 5 seconds
    // Sustained = (100,000 * 30) / 5 = 600,000
    expect(result.sustainedDPS).toBeCloseTo(600_000, 0);
  });

  it("returns bodyDPS equal to critDPS when CHC is 0%", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats({
      criticalHitChance: 0,
      criticalHitDamage: 1.50, // CHD doesn't matter with 0 CHC
    });
    const result = calculateDPS(weapon, stats);

    // With 0% CHC, crit formula: (1-0)*body + 0*body*(1+CHD) = body
    expect(result.critDPS).toBeCloseTo(result.bodyDPS, 0);
  });

  it("calculates correctly at 60% CHC cap with high CHD", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats({
      criticalHitChance: 0.60,
      criticalHitDamage: 1.70, // 170% CHD (realistic high-end build)
    });
    const result = calculateDPS(weapon, stats);

    // Body DPS = 1,000,000
    // Crit DPS = (0.4 * 1,000,000) + (0.6 * 1,000,000 * (1 + 1.70))
    //          = 400,000 + 1,620,000 = 2,020,000
    expect(result.critDPS).toBeCloseTo(2_020_000, 0);
  });

  it("applies amplified multipliers independently", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats({ totalWeaponDamage: 0.9 });

    // Glass Cannon (+25%) and Vigilance (+25%)
    const ampOverrides = {
      glass_cannon: 0.25,
      vigilance: 0.25,
    };
    const result = calculateDPS(weapon, stats, ampOverrides);

    // Hit = 100,000 * (1 + 0.9) * 1.25 * 1.25 = 100,000 * 1.9 * 1.5625
    //     = 296,875
    // Body DPS = 296,875 * 10 = 2,968,750
    expect(result.bodyDPS).toBeCloseTo(2_968_750, 0);
  });

  it("includes formula steps for transparency", () => {
    const weapon = makeTestWeapon();
    const stats = makeBaseStats();
    const result = calculateDPS(weapon, stats);

    // Should have at minimum: base, additive, hit damage, body/crit/hs/sustained
    expect(result.formulaSteps.length).toBeGreaterThanOrEqual(4);
    expect(result.formulaSteps[0].name).toBe("Base Weapon Damage");
    expect(result.formulaSteps[0].type).toBe("base");
  });
});
