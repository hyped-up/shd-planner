/**
 * Tests for the build migrator.
 *
 * Verifies that migrateBuild() gracefully handles arbitrary input,
 * fills missing fields with sensible defaults, validates gear slots,
 * specializations, SHD Watch values, and reports warnings for anything
 * that was corrected during migration.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { migrateBuild } from "@/lib/sharing/build-migrator";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Current data version used across all tests */
const CURRENT_VERSION = "2.0.0";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Build a minimal valid build object that should migrate with zero warnings */
function makeValidBuild(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "test-build-001",
    name: "My DPS Build",
    description: "All-red Heartbreaker build",
    gear: {
      Mask: { slotId: "Mask", source: "brand", itemId: "mask-001" },
      Chest: { slotId: "Chest", source: "brand", itemId: "chest-001" },
    },
    weapons: {
      primary: { slotId: "primary", weaponId: "weapon-001" },
      secondary: null,
      sidearm: null,
    },
    skills: {
      skill1: { slotId: "skill1", skillVariantId: "reviver-hive" },
      skill2: null,
    },
    specialization: "Gunner",
    shdWatch: {
      weaponDamage: 10,
      armor: 5,
      skillTier: 0,
      criticalHitChance: 8,
      criticalHitDamage: 20,
      headshotDamage: 15,
      health: 3,
    },
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-02-01T12:00:00.000Z",
    dataVersion: CURRENT_VERSION,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("migrateBuild", () => {
  // -------------------------------------------------------------------------
  // Valid input
  // -------------------------------------------------------------------------

  it("should migrate a valid build with no warnings", () => {
    const input = makeValidBuild();
    const result = migrateBuild(input, CURRENT_VERSION);

    // No warnings when everything is valid and versions match
    expect(result.warnings).toHaveLength(0);
    expect(result.build.name).toBe("My DPS Build");
    expect(result.build.specialization).toBe("Gunner");
    expect(result.build.dataVersion).toBe(CURRENT_VERSION);
  });

  // -------------------------------------------------------------------------
  // Non-object / garbage input
  // -------------------------------------------------------------------------

  it("should create an empty build with warning for null input", () => {
    const result = migrateBuild(null, CURRENT_VERSION);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/not a valid build object/i);
    expect(result.build.name).toBe("Imported Build");
    expect(result.build.dataVersion).toBe(CURRENT_VERSION);
  });

  it("should create an empty build with warning for array input", () => {
    const result = migrateBuild([1, 2, 3], CURRENT_VERSION);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/not a valid build object/i);
    expect(result.build.name).toBe("Imported Build");
  });

  // -------------------------------------------------------------------------
  // Missing name
  // -------------------------------------------------------------------------

  it("should default name to 'Imported Build' when missing", () => {
    const input = makeValidBuild({ name: undefined });
    // Remove the name property entirely
    delete input.name;
    const result = migrateBuild(input, CURRENT_VERSION);

    expect(result.build.name).toBe("Imported Build");
    expect(result.warnings).toContain(
      "Build name was missing. Set to 'Imported Build'."
    );
  });

  // -------------------------------------------------------------------------
  // Gear slot validation
  // -------------------------------------------------------------------------

  it("should remove unknown gear slots with warning", () => {
    const input = makeValidBuild({
      gear: {
        Mask: { slotId: "Mask", source: "brand", itemId: "m-001" },
        Helmet: { slotId: "Helmet", source: "brand", itemId: "h-001" }, // invalid
      },
    });
    const result = migrateBuild(input, CURRENT_VERSION);

    // Valid slot preserved, invalid slot removed
    expect(result.build.gear).toHaveProperty("Mask");
    expect(result.build.gear).not.toHaveProperty("Helmet");
    expect(result.warnings).toContain('Unknown gear slot "Helmet" removed.');
  });

  it("should preserve all valid gear slots", () => {
    const validSlots = ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"];
    const gear: Record<string, unknown> = {};
    for (const slot of validSlots) {
      gear[slot] = { slotId: slot, source: "brand", itemId: `${slot.toLowerCase()}-001` };
    }

    const input = makeValidBuild({ gear });
    const result = migrateBuild(input, CURRENT_VERSION);

    // All six valid slots should be present
    for (const slot of validSlots) {
      expect(result.build.gear).toHaveProperty(slot);
    }
  });

  // -------------------------------------------------------------------------
  // Specialization validation
  // -------------------------------------------------------------------------

  it("should clear invalid specialization to null with warning", () => {
    const input = makeValidBuild({ specialization: "Medic" });
    const result = migrateBuild(input, CURRENT_VERSION);

    expect(result.build.specialization).toBeNull();
    expect(result.warnings).toContain(
      'Unknown specialization "Medic". Cleared to null.'
    );
  });

  it("should preserve a valid specialization", () => {
    const input = makeValidBuild({ specialization: "Gunner" });
    const result = migrateBuild(input, CURRENT_VERSION);

    expect(result.build.specialization).toBe("Gunner");
    // No specialization-related warnings
    const specWarnings = result.warnings.filter((w) => w.includes("specialization"));
    expect(specWarnings).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // SHD Watch validation
  // -------------------------------------------------------------------------

  it("should reset negative SHD Watch values to 0 with warning", () => {
    const input = makeValidBuild({
      shdWatch: {
        weaponDamage: -5,
        armor: 10,
        skillTier: 0,
        criticalHitChance: 8,
        criticalHitDamage: 20,
        headshotDamage: 15,
        health: -1,
      },
    });
    const result = migrateBuild(input, CURRENT_VERSION);

    // Negative values should be reset to 0
    expect(result.build.shdWatch.weaponDamage).toBe(0);
    expect(result.build.shdWatch.health).toBe(0);
    // Valid values should be preserved
    expect(result.build.shdWatch.armor).toBe(10);
    expect(result.build.shdWatch.criticalHitDamage).toBe(20);
    // Should have warnings for the invalid fields
    expect(result.warnings.some((w) => w.includes("weaponDamage"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("health"))).toBe(true);
  });

  it("should reset NaN SHD Watch values to 0 with warning", () => {
    const input = makeValidBuild({
      shdWatch: {
        weaponDamage: NaN,
        armor: 10,
        skillTier: 0,
        criticalHitChance: NaN,
        criticalHitDamage: 20,
        headshotDamage: 15,
        health: 3,
      },
    });
    const result = migrateBuild(input, CURRENT_VERSION);

    // NaN values should be reset to 0
    expect(result.build.shdWatch.weaponDamage).toBe(0);
    expect(result.build.shdWatch.criticalHitChance).toBe(0);
    // Valid values preserved
    expect(result.build.shdWatch.armor).toBe(10);
    // Warnings generated for NaN fields
    expect(result.warnings.some((w) => w.includes("weaponDamage"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("criticalHitChance"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Version mismatch
  // -------------------------------------------------------------------------

  it("should add warning on version mismatch", () => {
    const input = makeValidBuild({ dataVersion: "1.0.0" });
    const result = migrateBuild(input, CURRENT_VERSION);

    expect(result.warnings.some((w) => w.includes("1.0.0") && w.includes(CURRENT_VERSION))).toBe(
      true
    );
  });

  it("should produce no version warning when versions match", () => {
    const input = makeValidBuild({ dataVersion: CURRENT_VERSION });
    const result = migrateBuild(input, CURRENT_VERSION);

    const versionWarnings = result.warnings.filter((w) => w.includes("version"));
    expect(versionWarnings).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Invalid weapons
  // -------------------------------------------------------------------------

  it("should clear invalid weapons object to null defaults with warning", () => {
    // Pass a non-object value for weapons
    const input = makeValidBuild({ weapons: "not-an-object" });
    const result = migrateBuild(input, CURRENT_VERSION);

    expect(result.build.weapons.primary).toBeNull();
    expect(result.build.weapons.secondary).toBeNull();
    expect(result.build.weapons.sidearm).toBeNull();
    expect(result.warnings.some((w) => w.includes("Weapons"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Result always has current data version
  // -------------------------------------------------------------------------

  it("should always stamp the result with the current data version", () => {
    // Build with an old version
    const input = makeValidBuild({ dataVersion: "0.5.0" });
    const result = migrateBuild(input, CURRENT_VERSION);

    expect(result.build.dataVersion).toBe(CURRENT_VERSION);
  });

  // -------------------------------------------------------------------------
  // Timestamps
  // -------------------------------------------------------------------------

  it("should preserve createdAt if present and refresh updatedAt", () => {
    const originalCreatedAt = "2024-06-01T08:00:00.000Z";
    const originalUpdatedAt = "2024-06-10T08:00:00.000Z";
    const input = makeValidBuild({
      createdAt: originalCreatedAt,
      updatedAt: originalUpdatedAt,
    });

    const beforeMigration = new Date().toISOString();
    const result = migrateBuild(input, CURRENT_VERSION);

    // createdAt should be preserved from input
    expect(result.build.createdAt).toBe(originalCreatedAt);
    // updatedAt should be refreshed to now (at or after test start)
    expect(result.build.updatedAt >= beforeMigration).toBe(true);
    expect(result.build.updatedAt).not.toBe(originalUpdatedAt);
  });
});
