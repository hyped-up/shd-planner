/**
 * Tests for the URL codec module.
 *
 * Validates encode/decode roundtrip fidelity, field stripping behavior,
 * compact key mapping, and error handling for malformed input.
 */

import { describe, it, expect } from "vitest";
import { compressToEncodedURIComponent } from "lz-string";
import { encodeBuild, decodeBuild } from "@/lib/sharing/url-codec";
import type { IBuild } from "@/lib/types/build";

/**
 * Returns a minimal valid IBuild fixture with all required fields populated.
 * Uses deterministic values so roundtrip assertions are straightforward.
 */
function makeTestBuild(): IBuild {
  return {
    id: "original-id-12345",
    name: "Heartbreaker DPS",
    description: "A red-core DPS build for raids",
    gear: {
      Mask: {
        slotId: "Mask",
        source: "brand",
        itemId: "ceska-vyroba",
        coreAttribute: { type: "weaponDamage", value: 15 },
        minorAttributes: [{ attributeId: "criticalHitChance", value: 6 }],
        modSlot: null,
        talent: null,
      },
      Chest: {
        slotId: "Chest",
        source: "gearset",
        itemId: "heartbreaker-chest",
        coreAttribute: { type: "armor", value: 170370 },
        minorAttributes: [],
        modSlot: { modId: "chc-mod", value: 4 },
        talent: { talentId: "spotter" },
      },
    },
    weapons: {
      primary: {
        slotId: "primary",
        weaponId: "eagle-bearer",
        talent: { talentId: "eagle-strike" },
        mods: { optic: "cqbss-scope" },
      },
      secondary: null,
      sidearm: null,
    },
    skills: {
      skill1: {
        slotId: "skill1",
        skillVariantId: "assault-turret",
        mods: ["duration-mod"],
      },
      skill2: null,
    },
    specialization: "Sharpshooter",
    shdWatch: {
      weaponDamage: 10,
      armor: 10,
      skillTier: 0,
      criticalHitChance: 10,
      criticalHitDamage: 10,
      headshotDamage: 20,
      health: 0,
    },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-15T12:00:00.000Z",
    dataVersion: "1.2.0",
  };
}

describe("url-codec", () => {
  // --- Roundtrip tests ---

  it("roundtrip preserves build name", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.name).toBe(build.name);
  });

  it("roundtrip preserves gear data", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    // Verify gear slots match the original
    expect(decoded!.gear).toEqual(build.gear);
  });

  it("roundtrip preserves weapons data", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.weapons).toEqual(build.weapons);
  });

  it("roundtrip preserves skills data", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.skills).toEqual(build.skills);
  });

  it("roundtrip preserves specialization", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.specialization).toBe(build.specialization);
  });

  it("roundtrip preserves shdWatch configuration", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.shdWatch).toEqual(build.shdWatch);
  });

  it("roundtrip preserves dataVersion", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.dataVersion).toBe(build.dataVersion);
  });

  // --- Field stripping and defaults ---

  it("decoded build gets a new id (not the original)", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    // The id should be regenerated, not carried over from the original
    expect(decoded!.id).not.toBe(build.id);
    // Should be a valid UUID format
    expect(decoded!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("decoded build has empty description", () => {
    const build = makeTestBuild();
    // Original has a non-empty description
    expect(build.description).not.toBe("");

    const encoded = encodeBuild(build);
    const decoded = decodeBuild(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.description).toBe("");
  });

  // --- Error handling ---

  it("returns null for empty string input", () => {
    const result = decodeBuild("");

    expect(result).toBeNull();
  });

  it("returns null for random garbage string", () => {
    const result = decodeBuild("!@#$%^&*()_+not-a-valid-build-string");

    expect(result).toBeNull();
  });

  it("returns null for valid lz-string but missing required fields", () => {
    // Compress an object that lacks name, gear, weapons, and skills
    const incomplete = JSON.stringify({ n: "test" });
    const encoded = compressToEncodedURIComponent(incomplete);

    const result = decodeBuild(encoded);

    expect(result).toBeNull();
  });

  // --- Encoding output properties ---

  it("encoded output is a non-empty string", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);

    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("encoded output is URL-safe (no characters that require percent-encoding)", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);

    // lz-string's compressToEncodedURIComponent uses A-Z, a-z, 0-9,
    // plus the URL-safe characters: +, -, /, =, and $
    // These are all valid in URI components without additional encoding
    expect(encoded).toMatch(/^[A-Za-z0-9+\-/$=]*$/);
  });

  // --- Edge cases ---

  it("two successive decodes of the same encoded string produce different ids", () => {
    const build = makeTestBuild();
    const encoded = encodeBuild(build);

    const decoded1 = decodeBuild(encoded);
    const decoded2 = decodeBuild(encoded);

    expect(decoded1).not.toBeNull();
    expect(decoded2).not.toBeNull();
    // Each decode should generate a fresh UUID
    expect(decoded1!.id).not.toBe(decoded2!.id);
  });
});
