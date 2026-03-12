// Data integrity tests for the data loader
// Verifies function signatures exist and return expected types
// Tests data-dependent integrity across all entity types

import { describe, test, expect } from "vitest";
import {
  getManifest,
  getAllBrands,
  getBrandById,
  getBrandsBySlot,
  getAllGearSets,
  getGearSetById,
  getAllWeapons,
  getWeaponsByType,
  getWeaponById,
  getAllTalents,
  getGearTalentsBySlot,
  getWeaponTalentsByWeaponType,
  getAllSkills,
  getSkillById,
  getSkillVariants,
  getAllExoticGear,
  getAllExoticWeapons,
  getExoticById,
  getAllNamedItems,
  getNamedItemsByBrand,
  getNamedItemsBySlot,
  getSpecializationById,
  getAllSpecializations,
  getAttributeMaxValue,
  searchEntities,
} from "@/lib/data-loader";

// --- Function existence tests ---

describe("Data loader exports", () => {
  test("all getter functions are exported", () => {
    expect(typeof getManifest).toBe("function");
    expect(typeof getAllBrands).toBe("function");
    expect(typeof getBrandById).toBe("function");
    expect(typeof getBrandsBySlot).toBe("function");
    expect(typeof getAllGearSets).toBe("function");
    expect(typeof getGearSetById).toBe("function");
    expect(typeof getAllWeapons).toBe("function");
    expect(typeof getWeaponsByType).toBe("function");
    expect(typeof getWeaponById).toBe("function");
    expect(typeof getAllTalents).toBe("function");
    expect(typeof getGearTalentsBySlot).toBe("function");
    expect(typeof getWeaponTalentsByWeaponType).toBe("function");
    expect(typeof getAllSkills).toBe("function");
    expect(typeof getSkillById).toBe("function");
    expect(typeof getSkillVariants).toBe("function");
    expect(typeof getAllExoticGear).toBe("function");
    expect(typeof getAllExoticWeapons).toBe("function");
    expect(typeof getExoticById).toBe("function");
    expect(typeof getAllNamedItems).toBe("function");
    expect(typeof getNamedItemsByBrand).toBe("function");
    expect(typeof getNamedItemsBySlot).toBe("function");
    expect(typeof getSpecializationById).toBe("function");
    expect(typeof getAllSpecializations).toBe("function");
    expect(typeof getAttributeMaxValue).toBe("function");
    expect(typeof searchEntities).toBe("function");
  });
});

// --- Return type tests (empty data, correct shapes) ---

describe("Data loader return types", () => {
  test("getAllBrands returns an array", async () => {
    const result = await getAllBrands();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllGearSets returns an array", async () => {
    const result = await getAllGearSets();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllWeapons returns an array", async () => {
    const result = await getAllWeapons();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllTalents returns object with gear and weapon arrays", async () => {
    const result = await getAllTalents();
    expect(result).toHaveProperty("gear");
    expect(result).toHaveProperty("weapon");
    expect(Array.isArray(result.gear)).toBe(true);
    expect(Array.isArray(result.weapon)).toBe(true);
  });

  test("getAllSkills returns an array", async () => {
    const result = await getAllSkills();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllExoticGear returns an array", async () => {
    const result = await getAllExoticGear();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllExoticWeapons returns an array", async () => {
    const result = await getAllExoticWeapons();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllNamedItems returns an array", async () => {
    const result = await getAllNamedItems();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getAllSpecializations returns an array", async () => {
    const result = await getAllSpecializations();
    expect(Array.isArray(result)).toBe(true);
  });

  test("getBrandById returns undefined for nonexistent ID", async () => {
    const result = await getBrandById("nonexistent");
    expect(result).toBeUndefined();
  });

  test("getGearSetById returns undefined for nonexistent ID", async () => {
    const result = await getGearSetById("nonexistent");
    expect(result).toBeUndefined();
  });

  test("getWeaponById returns undefined for nonexistent ID", async () => {
    const result = await getWeaponById("nonexistent");
    expect(result).toBeUndefined();
  });

  test("getSkillById returns undefined for nonexistent ID", async () => {
    const result = await getSkillById("nonexistent");
    expect(result).toBeUndefined();
  });

  test("getExoticById returns undefined for nonexistent ID", async () => {
    const result = await getExoticById("nonexistent");
    expect(result).toBeUndefined();
  });

  test("getSpecializationById returns undefined for nonexistent ID", async () => {
    const result = await getSpecializationById("nonexistent");
    expect(result).toBeUndefined();
  });

  test("getAttributeMaxValue returns undefined for nonexistent ID", async () => {
    const result = await getAttributeMaxValue("nonexistent");
    expect(result).toBeUndefined();
  });

  test("searchEntities returns empty array for empty query", async () => {
    const result = await searchEntities("");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("searchEntities returns empty array when no data matches", async () => {
    const result = await searchEntities("nonexistent_item_xyz");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("getBrandsBySlot returns an array", async () => {
    const result = await getBrandsBySlot("Mask");
    expect(Array.isArray(result)).toBe(true);
  });

  test("getGearTalentsBySlot returns an array", async () => {
    const result = await getGearTalentsBySlot("chest");
    expect(Array.isArray(result)).toBe(true);
  });

  test("getWeaponTalentsByWeaponType returns an array", async () => {
    const result = await getWeaponTalentsByWeaponType("Assault Rifles");
    expect(Array.isArray(result)).toBe(true);
  });

  test("getNamedItemsByBrand returns an array", async () => {
    const result = await getNamedItemsByBrand("providence");
    expect(Array.isArray(result)).toBe(true);
  });

  test("getNamedItemsBySlot returns an array", async () => {
    const result = await getNamedItemsBySlot("Chest");
    expect(Array.isArray(result)).toBe(true);
  });

  test("getSkillVariants returns an array", async () => {
    const result = await getSkillVariants("turret");
    expect(Array.isArray(result)).toBe(true);
  });
});

// --- Data-dependent tests ---

// Valid gear slot values for cross-checking brand slot data
const VALID_GEAR_SLOTS = ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"];

// Valid weapon type values for cross-checking weapon type data
const VALID_WEAPON_TYPES = [
  "Assault Rifles",
  "Submachine Guns",
  "Light Machine Guns",
  "Rifles",
  "Marksman Rifles",
  "Shotguns",
  "Pistols",
];

describe("Data integrity - brand sets", () => {
  // Verify all brand sets have valid IDs and names
  test("all brand sets have valid IDs and names", async () => {
    const brands = await getAllBrands();
    for (const brand of brands) {
      expect(brand.id).toBeTruthy();
      expect(brand.name).toBeTruthy();
      expect(brand.slots.length).toBeGreaterThan(0);
    }
  });

  // Verify all brand IDs are unique
  test("all brands have unique IDs", async () => {
    const brands = await getAllBrands();
    const ids = brands.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify all brands have a non-empty name
  test("all brands have non-empty name", async () => {
    const brands = await getAllBrands();
    for (const brand of brands) {
      expect(brand.name.trim().length).toBeGreaterThan(0);
    }
  });

  // Verify all brands have at least 1 slot
  test("all brands have at least 1 slot", async () => {
    const brands = await getAllBrands();
    for (const brand of brands) {
      expect(brand.slots.length).toBeGreaterThanOrEqual(1);
    }
  });

  // Verify brand slots are valid GearSlot values
  test("brand slots are valid GearSlot values", async () => {
    const brands = await getAllBrands();
    for (const brand of brands) {
      for (const slot of brand.slots) {
        expect(VALID_GEAR_SLOTS).toContain(slot);
      }
    }
  });
});

describe("Data integrity - gear sets", () => {
  // Verify all gear sets have at least 2 bonuses
  test("all gear sets have at least 2 bonuses", async () => {
    const sets = await getAllGearSets();
    for (const set of sets) {
      expect(Object.keys(set.bonuses).length).toBeGreaterThanOrEqual(2);
    }
  });

  // Verify all gear set IDs are unique
  test("all gear sets have unique IDs", async () => {
    const sets = await getAllGearSets();
    const ids = sets.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify all gear sets have a non-empty name
  test("all gear sets have non-empty name", async () => {
    const sets = await getAllGearSets();
    for (const set of sets) {
      expect(set.name.trim().length).toBeGreaterThan(0);
    }
  });

  // Verify gear sets have chest and/or backpack talent info
  test("gear sets have chest and/or backpack talent info", async () => {
    const sets = await getAllGearSets();
    for (const set of sets) {
      // Every gear set should define at least one of chestTalent or backpackTalent
      const hasChest = set.chestTalent !== undefined;
      const hasBackpack = set.backpackTalent !== undefined;
      expect(hasChest || hasBackpack).toBe(true);
    }
  });
});

describe("Data integrity - weapons", () => {
  // Verify all weapon IDs are unique
  test("all weapons have unique IDs", async () => {
    const weapons = await getAllWeapons();
    const ids = weapons.map((w) => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify all weapons have positive RPM
  test("all weapons have positive RPM", async () => {
    const weapons = await getAllWeapons();
    for (const weapon of weapons) {
      expect(weapon.rpm).toBeGreaterThan(0);
    }
  });

  // Verify all weapons have non-negative base damage (0 allowed for unverified entries)
  test("all weapons have non-negative base damage", async () => {
    const weapons = await getAllWeapons();
    for (const weapon of weapons) {
      expect(weapon.baseDamage).toBeGreaterThanOrEqual(0);
    }
  });

  // Verify all weapons have positive magazine size
  test("all weapons have positive mag size", async () => {
    const weapons = await getAllWeapons();
    for (const weapon of weapons) {
      expect(weapon.magSize).toBeGreaterThan(0);
    }
  });

  // Verify weapon types are valid WeaponType values
  test("weapon types are valid WeaponType values", async () => {
    const weapons = await getAllWeapons();
    for (const weapon of weapons) {
      expect(VALID_WEAPON_TYPES).toContain(weapon.type);
    }
  });
});

describe("Data integrity - talents", () => {
  // Verify all gear talents have unique IDs
  test("all gear talents have unique IDs", async () => {
    const { gear } = await getAllTalents();
    const ids = gear.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify all weapon talents have unique IDs
  test("all weapon talents have unique IDs", async () => {
    const { weapon } = await getAllTalents();
    const ids = weapon.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify gear talents have non-empty names and descriptions
  test("gear talents have non-empty names and descriptions", async () => {
    const { gear } = await getAllTalents();
    for (const talent of gear) {
      expect(talent.name.trim().length).toBeGreaterThan(0);
      expect(talent.description.trim().length).toBeGreaterThan(0);
    }
  });

  // Verify weapon talents have non-empty names and descriptions
  test("weapon talents have non-empty names and descriptions", async () => {
    const { weapon } = await getAllTalents();
    for (const talent of weapon) {
      expect(talent.name.trim().length).toBeGreaterThan(0);
      expect(talent.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Data integrity - skills", () => {
  // Verify all skills have unique IDs
  test("all skills have unique IDs", async () => {
    const skills = await getAllSkills();
    const ids = skills.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify skills have non-empty names
  test("skills have non-empty names", async () => {
    const skills = await getAllSkills();
    for (const skill of skills) {
      expect(skill.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Data integrity - exotics", () => {
  // Verify all exotic gear has unique IDs
  test("all exotic gear has unique IDs", async () => {
    const exotics = await getAllExoticGear();
    const ids = exotics.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify all exotic weapons have unique IDs
  test("all exotic weapons have unique IDs", async () => {
    const exotics = await getAllExoticWeapons();
    const ids = exotics.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // Verify exotic gear has non-empty names
  test("exotic gear has non-empty names", async () => {
    const exotics = await getAllExoticGear();
    for (const exotic of exotics) {
      expect(exotic.name.trim().length).toBeGreaterThan(0);
    }
  });

  // Verify exotic weapons have non-empty names
  test("exotic weapons have non-empty names", async () => {
    const exotics = await getAllExoticWeapons();
    for (const exotic of exotics) {
      expect(exotic.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Data integrity - cross-references", () => {
  // Verify named gear items (non-weapon) reference valid brand IDs
  test("named gear items reference valid brand IDs", async () => {
    const [items, brands] = await Promise.all([getAllNamedItems(), getAllBrands()]);
    const brandIds = new Set(brands.map((b) => b.id));
    // Filter out items with placeholder brand IDs (named-weapon, named-gear)
    const gearItems = items.filter(
      (i) => i.brand && i.brand.trim() !== "" && !i.brand.startsWith("brand-named-")
    );
    for (const item of gearItems) {
      expect(brandIds.has(item.brand)).toBe(true);
    }
  });

  // Verify named items reference existing brands via getNamedItemsByBrand
  test("named items reference existing brands", async () => {
    const brands = await getAllBrands();
    // Each brand that has named items should return them correctly
    for (const brand of brands) {
      const items = await getNamedItemsByBrand(brand.id);
      expect(Array.isArray(items)).toBe(true);
      for (const item of items) {
        expect(item.brand).toBe(brand.id);
      }
    }
  });

  // Verify search returns results for known entities
  test("search returns results for known entities", async () => {
    const brands = await getAllBrands();
    if (brands.length > 0) {
      // Search for the first brand name and expect at least 1 result
      const results = await searchEntities(brands[0].name);
      expect(results.length).toBeGreaterThan(0);
    }
  });
});

describe("Data integrity - search", () => {
  // Verify search with query "Providence" returns results
  test('search with query "Providence" returns results', async () => {
    const results = await searchEntities("Providence");
    expect(results.length).toBeGreaterThan(0);
    // All returned results should have a positive score
    for (const result of results) {
      expect(result.score).toBeGreaterThan(0);
    }
  });

  // Verify search with empty query returns empty array
  test('search with query "" returns empty', async () => {
    const results = await searchEntities("");
    expect(results).toHaveLength(0);
  });

  // Verify search is case-insensitive
  test("search is case-insensitive", async () => {
    const upperResults = await searchEntities("PROVIDENCE");
    const lowerResults = await searchEntities("providence");
    const mixedResults = await searchEntities("Providence");
    // All three searches should return the same number of results
    expect(upperResults.length).toBe(lowerResults.length);
    expect(upperResults.length).toBe(mixedResults.length);
    // Results should contain the same IDs
    const upperIds = new Set(upperResults.map((r) => r.id));
    const lowerIds = new Set(lowerResults.map((r) => r.id));
    expect(upperIds).toEqual(lowerIds);
  });
});
