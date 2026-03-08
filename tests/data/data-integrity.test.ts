// Data integrity tests for the data loader
// Verifies function signatures exist and return expected types
// TODO: Add data-dependent tests once Phase 1 data files are populated

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
    const result = await getWeaponTalentsByWeaponType("Assault Rifle");
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

// --- TODO: Data-dependent tests (uncomment when Phase 1 data exists) ---

// describe("Data integrity - brand sets", () => {
//   test("all brand sets have valid IDs and names", async () => {
//     const brands = await getAllBrands();
//     for (const brand of brands) {
//       expect(brand.id).toBeTruthy();
//       expect(brand.name).toBeTruthy();
//       expect(brand.slots.length).toBeGreaterThan(0);
//     }
//   });
// });

// describe("Data integrity - gear sets", () => {
//   test("all gear sets have at least 2 bonuses", async () => {
//     const sets = await getAllGearSets();
//     for (const set of sets) {
//       expect(Object.keys(set.bonuses).length).toBeGreaterThanOrEqual(2);
//     }
//   });
// });

// describe("Data integrity - cross-references", () => {
//   test("named items reference valid brand IDs", async () => {
//     const [items, brands] = await Promise.all([getAllNamedItems(), getAllBrands()]);
//     const brandIds = new Set(brands.map((b) => b.id));
//     for (const item of items) {
//       expect(brandIds.has(item.brand)).toBe(true);
//     }
//   });
// });
