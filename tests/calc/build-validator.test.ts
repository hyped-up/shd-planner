/**
 * Tests for the Division 2 build validator.
 *
 * Covers all 8 validation rules: exotic gear limit, talent slot restrictions,
 * attribute bounds, gear set talent prohibition, CHC cap warning, skill tier
 * cap warning, empty gear slot warning, and missing weapon warning.
 */

import { describe, it, expect } from "vitest";
import { validateBuild } from "@/lib/calc/build-validator";
import type {
  IBuild,
  IBuildGearPiece,
  IBuildWeapon,
  ISHDWatchConfig,
  GearSlot,
} from "@/lib/calc/types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Returns a zeroed SHD Watch config */
function makeEmptySHDWatch(): ISHDWatchConfig {
  return {
    weaponDamage: 0,
    armor: 0,
    skillTier: 0,
    criticalHitChance: 0,
    criticalHitDamage: 0,
    headshotDamage: 0,
    health: 0,
  };
}

/** Returns a valid empty build with no gear, no weapons, and no skills */
function makeEmptyBuild(overrides?: Partial<IBuild>): IBuild {
  return {
    id: "test-build",
    name: "Test Build",
    description: "A test build",
    gear: {},
    weapons: {
      primary: null,
      secondary: null,
      sidearm: null,
    },
    skills: {
      skill1: null,
      skill2: null,
    },
    specialization: null,
    shdWatch: makeEmptySHDWatch(),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    dataVersion: "1.0.0",
    ...overrides,
  };
}

/** Creates a valid brand gear piece for the given slot */
function makeGearPiece(
  slot: GearSlot,
  overrides?: Partial<IBuildGearPiece>
): IBuildGearPiece {
  return {
    slotId: slot,
    source: "brand",
    itemId: `test-${slot.toLowerCase()}`,
    coreAttribute: { type: "weaponDamage", value: 15 },
    minorAttributes: [],
    modSlot: null,
    talent: null,
    ...overrides,
  };
}

/** Creates a basic weapon for a given slot */
function makeWeapon(
  slotId: "primary" | "secondary" | "sidearm"
): IBuildWeapon {
  return {
    slotId,
    weaponId: `test-${slotId}`,
    talent: { talentId: "measured" },
    mods: {},
  };
}

/** All six gear slot names */
const ALL_SLOTS: GearSlot[] = [
  "Mask",
  "Backpack",
  "Chest",
  "Gloves",
  "Holster",
  "Kneepads",
];

/** Builds a fully-filled gear record with brand pieces on every slot */
function makeFullGear(
  slotOverrides?: Partial<Record<GearSlot, Partial<IBuildGearPiece>>>
): Partial<Record<GearSlot, IBuildGearPiece>> {
  const gear: Partial<Record<GearSlot, IBuildGearPiece>> = {};
  for (const slot of ALL_SLOTS) {
    gear[slot] = makeGearPiece(slot, slotOverrides?.[slot]);
  }
  return gear;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validateBuild", () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  // A fully-equipped build with valid configuration should pass with no errors
  it("passes validation for a fully-equipped valid build", () => {
    const build = makeEmptyBuild({
      gear: makeFullGear({
        Chest: { talent: { talentId: "obliterate" } },
        Backpack: { talent: { talentId: "vigilance" } },
      }),
      weapons: {
        primary: makeWeapon("primary"),
        secondary: null,
        sidearm: null,
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Rule 1: Exotic gear limit (max 1)
  // -------------------------------------------------------------------------

  // Two exotic gear pieces should produce an error
  it("returns error when multiple exotic gear pieces are equipped", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", { source: "exotic", itemId: "coyotes-mask" }),
        Chest: makeGearPiece("Chest", { source: "exotic", itemId: "tardigrade" }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const exoticError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear" && e.message.includes("exotic")
    );
    expect(exoticError).toBeDefined();
  });

  // A single exotic gear piece should not trigger the exotic limit error
  it("allows exactly one exotic gear piece", () => {
    const build = makeEmptyBuild({
      gear: makeFullGear({
        Mask: { source: "exotic", itemId: "coyotes-mask" },
      }),
      weapons: {
        primary: makeWeapon("primary"),
        secondary: null,
        sidearm: null,
      },
    });
    const result = validateBuild(build);

    const exoticError = result.errors.find(
      (e) => e.severity === "error" && e.message.includes("exotic")
    );
    expect(exoticError).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Rule 2: Talent slot restrictions (only Chest/Backpack)
  // -------------------------------------------------------------------------

  // Talent on Chest should be valid
  it("allows talent on Chest", () => {
    const build = makeEmptyBuild({
      gear: {
        Chest: makeGearPiece("Chest", { talent: { talentId: "obliterate" } }),
      },
    });
    const result = validateBuild(build);

    const talentError = result.errors.find(
      (e) => e.severity === "error" && e.field.includes("Chest") && e.field.includes("talent")
    );
    expect(talentError).toBeUndefined();
  });

  // Talent on Backpack should be valid
  it("allows talent on Backpack", () => {
    const build = makeEmptyBuild({
      gear: {
        Backpack: makeGearPiece("Backpack", { talent: { talentId: "vigilance" } }),
      },
    });
    const result = validateBuild(build);

    const talentError = result.errors.find(
      (e) => e.severity === "error" && e.field.includes("Backpack") && e.field.includes("talent")
    );
    expect(talentError).toBeUndefined();
  });

  // Talent on Gloves should trigger an error
  it("returns error for talent on Gloves", () => {
    const build = makeEmptyBuild({
      gear: {
        Gloves: makeGearPiece("Gloves", { talent: { talentId: "clutch" } }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const talentError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear.Gloves.talent"
    );
    expect(talentError).toBeDefined();
  });

  // Talent on Mask should trigger an error
  it("returns error for talent on Mask", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", { talent: { talentId: "spotter" } }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const talentError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear.Mask.talent"
    );
    expect(talentError).toBeDefined();
  });

  // Talent on Holster should trigger an error
  it("returns error for talent on Holster", () => {
    const build = makeEmptyBuild({
      gear: {
        Holster: makeGearPiece("Holster", { talent: { talentId: "dodge-city" } }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const talentError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear.Holster.talent"
    );
    expect(talentError).toBeDefined();
  });

  // Talent on Kneepads should trigger an error
  it("returns error for talent on Kneepads", () => {
    const build = makeEmptyBuild({
      gear: {
        Kneepads: makeGearPiece("Kneepads", { talent: { talentId: "sawyers" } }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const talentError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear.Kneepads.talent"
    );
    expect(talentError).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Rule 3: Attribute values within max bounds
  // -------------------------------------------------------------------------

  // Minor attribute exceeding its cap should trigger an error
  it("returns error when minor attribute exceeds cap", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", {
          minorAttributes: [{ attributeId: "criticalHitChance", value: 7 }],
        }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const attrError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear.Mask.criticalHitChance"
    );
    expect(attrError).toBeDefined();
    expect(attrError!.message).toContain("7");
    expect(attrError!.message).toContain("6");
  });

  // Minor attribute at exactly its cap should be valid
  it("allows minor attribute exactly at its cap", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask", {
          minorAttributes: [{ attributeId: "criticalHitChance", value: 6 }],
        }),
      },
    });
    const result = validateBuild(build);

    const attrError = result.errors.find(
      (e) => e.severity === "error" && e.field === "gear.Mask.criticalHitChance"
    );
    expect(attrError).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Rule 4: Gear set pieces cannot have talents
  // -------------------------------------------------------------------------

  // Gear set piece with a talent should trigger an error
  it("returns error when gear set piece has a talent", () => {
    const build = makeEmptyBuild({
      gear: {
        Chest: makeGearPiece("Chest", {
          source: "gearset",
          itemId: "strikers-chest",
          talent: { talentId: "some-talent" },
        }),
      },
    });
    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    const gearSetError = result.errors.find(
      (e) =>
        e.severity === "error" &&
        e.message.includes("Gear set pieces cannot have individual talents")
    );
    expect(gearSetError).toBeDefined();
  });

  // Gear set piece without a talent should be valid
  it("allows gear set piece without a talent", () => {
    const build = makeEmptyBuild({
      gear: {
        Chest: makeGearPiece("Chest", {
          source: "gearset",
          itemId: "strikers-chest",
          talent: null,
        }),
      },
    });
    const result = validateBuild(build);

    const gearSetError = result.errors.find(
      (e) =>
        e.severity === "error" &&
        e.message.includes("Gear set pieces cannot have individual talents")
    );
    expect(gearSetError).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Rule 5: CHC cap warning (>60%)
  // -------------------------------------------------------------------------

  // CHC exceeding 60% from gear attributes and SHD watch should warn
  it("returns warning when total CHC exceeds 60%", () => {
    // 6 pieces each with 6% CHC minor = 36%, plus shdWatch CHC of 25 = 61%
    const gear = makeFullGear();
    for (const slot of ALL_SLOTS) {
      gear[slot]!.minorAttributes = [{ attributeId: "criticalHitChance", value: 6 }];
    }
    const build = makeEmptyBuild({
      gear,
      shdWatch: { ...makeEmptySHDWatch(), criticalHitChance: 25 },
      weapons: { primary: makeWeapon("primary"), secondary: null, sidearm: null },
    });
    const result = validateBuild(build);

    const chcWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "stats.criticalHitChance"
    );
    expect(chcWarning).toBeDefined();
    expect(chcWarning!.message).toContain("exceeds");
  });

  // CHC at exactly 60% should NOT trigger a warning
  it("does not warn when total CHC is exactly at 60% cap", () => {
    // 6 pieces with 6% CHC = 36%, shdWatch CHC = 24, total = 60%
    const gear = makeFullGear();
    for (const slot of ALL_SLOTS) {
      gear[slot]!.minorAttributes = [{ attributeId: "criticalHitChance", value: 6 }];
    }
    const build = makeEmptyBuild({
      gear,
      shdWatch: { ...makeEmptySHDWatch(), criticalHitChance: 24 },
      weapons: { primary: makeWeapon("primary"), secondary: null, sidearm: null },
    });
    const result = validateBuild(build);

    const chcWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "stats.criticalHitChance"
    );
    expect(chcWarning).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Rule 6: Skill tier cap warning (>6)
  // -------------------------------------------------------------------------

  // Skill tier exceeding 6 from core attributes and SHD watch should warn
  it("returns warning when total skill tier exceeds 6", () => {
    // 6 gear pieces all with skillTier core = 6, plus shdWatch skillTier = 1 = 7
    const gear = makeFullGear();
    for (const slot of ALL_SLOTS) {
      gear[slot]!.coreAttribute = { type: "skillTier", value: 1 };
    }
    const build = makeEmptyBuild({
      gear,
      shdWatch: { ...makeEmptySHDWatch(), skillTier: 1 },
      weapons: { primary: makeWeapon("primary"), secondary: null, sidearm: null },
    });
    const result = validateBuild(build);

    const stWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "stats.skillTier"
    );
    expect(stWarning).toBeDefined();
    expect(stWarning!.message).toContain("7");
  });

  // Skill tier at exactly 6 should NOT trigger a warning
  it("does not warn when total skill tier is exactly at cap of 6", () => {
    // 6 gear pieces all with skillTier core = 6 total, shdWatch = 0
    const gear = makeFullGear();
    for (const slot of ALL_SLOTS) {
      gear[slot]!.coreAttribute = { type: "skillTier", value: 1 };
    }
    const build = makeEmptyBuild({
      gear,
      shdWatch: makeEmptySHDWatch(),
      weapons: { primary: makeWeapon("primary"), secondary: null, sidearm: null },
    });
    const result = validateBuild(build);

    const stWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "stats.skillTier"
    );
    expect(stWarning).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Rule 7: All 6 gear slots filled (warning)
  // -------------------------------------------------------------------------

  // Empty gear slots should produce a warning listing the missing slots
  it("returns warning when gear slots are empty", () => {
    const build = makeEmptyBuild({
      gear: {
        Mask: makeGearPiece("Mask"),
        Chest: makeGearPiece("Chest"),
      },
    });
    const result = validateBuild(build);

    const slotWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "gear" && e.message.includes("Empty gear slots")
    );
    expect(slotWarning).toBeDefined();
    expect(slotWarning!.message).toContain("Backpack");
    expect(slotWarning!.message).toContain("Gloves");
    expect(slotWarning!.message).toContain("Holster");
    expect(slotWarning!.message).toContain("Kneepads");
  });

  // -------------------------------------------------------------------------
  // Rule 8: At least one weapon equipped (warning)
  // -------------------------------------------------------------------------

  // No weapons equipped should produce a warning
  it("returns warning when no weapons are equipped", () => {
    const build = makeEmptyBuild();
    const result = validateBuild(build);

    const weaponWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "weapons"
    );
    expect(weaponWarning).toBeDefined();
    expect(weaponWarning!.message).toContain("No weapons equipped");
  });

  // A build with one weapon equipped should not trigger the weapon warning
  it("does not warn when at least one weapon is equipped", () => {
    const build = makeEmptyBuild({
      weapons: {
        primary: makeWeapon("primary"),
        secondary: null,
        sidearm: null,
      },
    });
    const result = validateBuild(build);

    const weaponWarning = result.errors.find(
      (e) => e.severity === "warning" && e.field === "weapons"
    );
    expect(weaponWarning).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Combined / edge cases
  // -------------------------------------------------------------------------

  // Multiple validation errors and warnings can fire simultaneously
  it("returns multiple errors and warnings simultaneously", () => {
    const build = makeEmptyBuild({
      gear: {
        // Two exotics → exotic error
        Mask: makeGearPiece("Mask", { source: "exotic", itemId: "coyotes-mask" }),
        Gloves: makeGearPiece("Gloves", {
          source: "exotic",
          itemId: "btsu-gloves",
          // Talent on gloves → talent slot error
          talent: { talentId: "overcharge" },
          // Attribute over cap → attribute error
          minorAttributes: [{ attributeId: "criticalHitChance", value: 8 }],
        }),
      },
      // No weapons → weapon warning
      // Missing 4 gear slots → empty slot warning
    });
    const result = validateBuild(build);

    // Should be invalid due to errors
    expect(result.valid).toBe(false);

    // Count errors and warnings separately
    const errorCount = result.errors.filter((e) => e.severity === "error").length;
    const warningCount = result.errors.filter((e) => e.severity === "warning").length;

    // At least 3 errors: exotic limit, talent on gloves, attribute over cap
    expect(errorCount).toBeGreaterThanOrEqual(3);
    // At least 2 warnings: empty slots, no weapons
    expect(warningCount).toBeGreaterThanOrEqual(2);
  });

  // A build that only has warnings should still be marked as valid
  it("marks build as valid when only warnings are present (no errors)", () => {
    const build = makeEmptyBuild();
    const result = validateBuild(build);

    // Empty build has warnings (empty slots, no weapons) but no errors
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.every((e) => e.severity === "warning")).toBe(true);
  });
});
