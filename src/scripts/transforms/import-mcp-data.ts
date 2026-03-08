#!/usr/bin/env npx tsx
/**
 * import-mcp-data.ts
 *
 * Reads JSON data files from the MCP server project (shd-planner-cwd/data/)
 * and transforms them into the web app's format, writing to src/data/.
 *
 * Source format (MCP/Python): object-keyed dicts, snake_case keys, _metadata top-level key
 * Target format (Web/TS): JSON arrays, camelCase keys, prefixed kebab-case IDs
 *
 * Usage: npx tsx src/scripts/transforms/import-mcp-data.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

// --- Path constants ---
// __dirname = .../shd-planner/src/scripts/transforms
// MCP source: sibling project at same level as shd-planner
const MCP_DATA_DIR = path.resolve(__dirname, "../../../../shd-planner-cwd/data");
// Web target: src/data/ in this project
const WEB_DATA_DIR = path.resolve(__dirname, "../../data");

// --- Tracking for summary table ---
const summary: Array<{ source: string; target: string; count: number }> = [];

// --- Utility functions ---

/** Generate a stable slug from a name: lowercase, replace non-alphanumerics with hyphens, collapse */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Read a JSON file from the MCP data directory, stripping _metadata */
function readMcpFile(filename: string): Record<string, unknown> {
  const filePath = path.join(MCP_DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`MCP data file not found: ${filePath}`);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  // Remove _metadata key — not part of entity data
  const { _metadata, ...entities } = raw;
  return entities;
}

/** Write a JSON file to the web data directory */
function writeWebFile(filename: string, data: unknown): void {
  const filePath = path.join(WEB_DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  [out] Wrote ${filename}`);
}

/** Add provenance fields to every entity */
function addProvenance<T extends Record<string, unknown>>(entity: T): T & { _verified: boolean; _sources: string[] } {
  return { ...entity, _verified: false, _sources: ["mcp-import"] };
}

/** Map weapon category snake_case to display name */
const WEAPON_CATEGORY_DISPLAY: Record<string, string> = {
  assault_rifles: "Assault Rifle",
  assault_rifle: "Assault Rifle",
  smg: "SMG",
  smgs: "SMG",
  lmg: "LMG",
  lmgs: "LMG",
  rifle: "Rifle",
  rifles: "Rifle",
  marksman_rifles: "Marksman Rifle",
  marksman_rifle: "Marksman Rifle",
  shotgun: "Shotgun",
  shotguns: "Shotgun",
  pistol: "Pistol",
  pistols: "Pistol",
};

/** Convert a snake_case weapon type to display name */
function weaponTypeDisplay(snakeCase: string): string {
  return WEAPON_CATEGORY_DISPLAY[snakeCase] || snakeCase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Transform functions ---

/** 1. brand_sets.json → gear-brands.json */
function transformBrandSets(): void {
  const data = readMcpFile("brand_sets.json");
  const result = Object.values(data).map((entry: any) =>
    addProvenance({
      id: `brand-${slugify(entry.name)}`,
      name: entry.name,
      bonuses: entry.bonuses,
      availableSlots: entry.available_slots,
      coreFocus: entry.core_focus,
    })
  );
  writeWebFile("gear-brands.json", result);
  summary.push({ source: "brand_sets.json", target: "gear-brands.json", count: result.length });
}

/** 2. gear_sets.json → gear-sets.json */
function transformGearSets(): void {
  const data = readMcpFile("gear_sets.json");
  const result = Object.values(data).map((entry: any) =>
    addProvenance({
      id: `gearset-${slugify(entry.name)}`,
      name: entry.name,
      abbreviation: entry.abbreviation,
      bonuses: entry.bonuses,
      chestTalent: entry.chest_talent,
      backpackTalent: entry.backpack_talent,
      gearSlots: entry.gear_slots,
    })
  );
  writeWebFile("gear-sets.json", result);
  summary.push({ source: "gear_sets.json", target: "gear-sets.json", count: result.length });
}

/** 3. exotics.json → exotics-gear.json + exotics-weapons.json (split by type) */
function transformExotics(): void {
  const data = readMcpFile("exotics.json");
  const gearItems: any[] = [];
  const weaponItems: any[] = [];

  for (const entry of Object.values(data) as any[]) {
    if (entry.type === "gear" || entry.type === "armor") {
      gearItems.push(
        addProvenance({
          id: `exotic-${slugify(entry.name)}`,
          name: entry.name,
          slot: entry.category || entry.slot,
          uniqueTalent: entry.unique_talent,
          coreAttribute: entry.core_attribute || "weapon_damage",
          metaRating: entry.meta_rating,
        })
      );
    } else if (entry.type === "weapon") {
      weaponItems.push(
        addProvenance({
          id: `exotic-${slugify(entry.name)}`,
          name: entry.name,
          category: weaponTypeDisplay(entry.category),
          uniqueTalent: entry.unique_talent,
          coreAttribute: entry.core_attribute || "weapon_damage",
          metaRating: entry.meta_rating,
        })
      );
    }
  }

  writeWebFile("exotics-gear.json", gearItems);
  summary.push({ source: "exotics.json", target: "exotics-gear.json", count: gearItems.length });

  writeWebFile("exotics-weapons.json", weaponItems);
  summary.push({ source: "exotics.json", target: "exotics-weapons.json", count: weaponItems.length });
}

/** 4. named_items.json → named-items.json */
function transformNamedItems(): void {
  const data = readMcpFile("named_items.json");
  const result = Object.values(data).map((entry: any) =>
    addProvenance({
      id: `named-${slugify(entry.name)}`,
      name: entry.name,
      brandId: `brand-${slugify(entry.brand)}`,
      slot: entry.slot,
      coreAttribute: entry.core_attribute || "weapon_damage",
      fixedAttribute: entry.fixed_attribute,
      metaRating: entry.meta_rating,
    })
  );
  writeWebFile("named-items.json", result);
  summary.push({ source: "named_items.json", target: "named-items.json", count: result.length });
}

/** 5. weapons.json → weapons.json */
function transformWeapons(): void {
  const data = readMcpFile("weapons.json");
  const result = Object.entries(data).map(([classKey, classData]: [string, any]) => {
    const className = classData.class;
    const archetypes = Object.entries(classData.archetypes || {}).map(([archKey, arch]: [string, any]) =>
      addProvenance({
        id: `weapon-${slugify(className)}-${slugify(arch.name)}`,
        name: arch.name,
        type: className,
        rpm: arch.rpm,
        magazine: arch.magazine,
        reloadSeconds: arch.reload_s,
        optimalRangeMeters: arch.optimal_range_m,
        variants: arch.variants || [],
        namedVariant: arch.named_variant || null,
        exoticVariant: arch.exotic_variant || null,
        metaTier: arch.meta_tier,
      })
    );

    return addProvenance({
      id: `weapon-type-${slugify(className)}`,
      class: className,
      coreBonus: classData.core_bonus,
      archetypes,
    });
  });
  writeWebFile("weapons.json", result);
  // Count total archetypes across all weapon classes
  const totalArchetypes = result.reduce((sum, wt) => sum + wt.archetypes.length, 0);
  summary.push({ source: "weapons.json", target: "weapons.json", count: `${result.length} classes / ${totalArchetypes} archetypes` as any });
}

/** 6. talents_gear.json → gear-talents.json */
function transformGearTalents(): void {
  const data = readMcpFile("talents_gear.json");
  const result = Object.values(data).map((entry: any) =>
    addProvenance({
      id: `talent-${slugify(entry.name)}`,
      name: entry.name,
      slot: entry.slot,
      description: entry.description,
      perfectVersion: entry.perfect_version
        ? {
            name: entry.perfect_version.name,
            description: entry.perfect_version.description,
            foundOn: entry.perfect_version.found_on,
          }
        : null,
      metaRating: entry.meta_rating,
    })
  );
  writeWebFile("gear-talents.json", result);
  summary.push({ source: "talents_gear.json", target: "gear-talents.json", count: result.length });
}

/** 7. talents_weapon.json → weapon-talents.json */
function transformWeaponTalents(): void {
  const data = readMcpFile("talents_weapon.json");
  const result = Object.values(data).map((entry: any) =>
    addProvenance({
      id: `talent-${slugify(entry.name)}`,
      name: entry.name,
      weaponTypes: (entry.weapon_types || []).map(weaponTypeDisplay),
      description: entry.description,
      perfectVersion: entry.perfect_version
        ? {
            name: entry.perfect_version.name,
            description: entry.perfect_version.description,
            foundOn: entry.perfect_version.found_on,
          }
        : null,
      metaRating: entry.meta_rating || null,
    })
  );
  writeWebFile("weapon-talents.json", result);
  summary.push({ source: "talents_weapon.json", target: "weapon-talents.json", count: result.length });
}

/** 8. skills.json → skills.json */
function transformSkills(): void {
  const data = readMcpFile("skills.json");
  const result = Object.entries(data).map(([familyKey, familyData]: [string, any]) => {
    const familyName = familyData.name;
    const variants = Object.entries(familyData.variants || {}).map(([varKey, variant]: [string, any]) =>
      addProvenance({
        id: `skill-${slugify(familyName)}-${slugify(variant.name)}`,
        name: variant.name,
        damageType: variant.damage_type,
        scaling: variant.scaling,
        cooldownRange: variant.cooldown_s
          ? { tier0: variant.cooldown_s.tier_0, tier6: variant.cooldown_s.tier_6 }
          : null,
        durationRange: variant.duration_s
          ? { tier0: variant.duration_s.tier_0, tier6: variant.duration_s.tier_6 }
          : null,
        mods: variant.mods || [],
        bestFor: variant.best_for || [],
        notes: variant.notes || "",
      })
    );

    return addProvenance({
      id: `skill-${slugify(familyName)}`,
      name: familyName,
      description: familyData.description || "",
      variants,
    });
  });
  writeWebFile("skills.json", result);
  // Count total variants across all skill families
  const totalVariants = result.reduce((sum, s) => sum + s.variants.length, 0);
  summary.push({ source: "skills.json", target: "skills.json", count: `${result.length} families / ${totalVariants} variants` as any });
}

/** 9. specializations.json → specializations.json */
function transformSpecializations(): void {
  const data = readMcpFile("specializations.json");
  const result = Object.values(data).map((entry: any) =>
    addProvenance({
      id: `spec-${slugify(entry.name)}`,
      name: entry.name,
      signatureWeapon: entry.signature_weapon,
      uniqueSkill: entry.unique_skill,
      grenade: entry.grenade,
      keyPassives: entry.key_passives || [],
      bonusSkillTier: entry.name === "Technician",
      weaponDamageBonus: entry.weapon_damage_bonus,
      bestFor: entry.best_for || [],
    })
  );
  writeWebFile("specializations.json", result);
  summary.push({ source: "specializations.json", target: "specializations.json", count: result.length });
}

/** Update manifest.json with new entity counts */
function updateManifest(): void {
  const manifestPath = path.join(WEB_DATA_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  // Read back the files we just wrote to get accurate counts
  const count = (file: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(WEB_DATA_DIR, file), "utf-8"));
    return Array.isArray(data) ? data.length : 0;
  };

  manifest.entityCounts.brandSets = count("gear-brands.json");
  manifest.entityCounts.gearSets = count("gear-sets.json");
  manifest.entityCounts.namedItems = count("named-items.json");
  manifest.entityCounts.exoticGear = count("exotics-gear.json");
  manifest.entityCounts.exoticWeapons = count("exotics-weapons.json");
  // For weapons, count total archetypes across all weapon type objects
  const weaponsData = JSON.parse(fs.readFileSync(path.join(WEB_DATA_DIR, "weapons.json"), "utf-8"));
  manifest.entityCounts.weapons = weaponsData.reduce((sum: number, wt: any) => sum + wt.archetypes.length, 0);
  manifest.entityCounts.weaponTalents = count("weapon-talents.json");
  manifest.entityCounts.gearTalents = count("gear-talents.json");
  // Count skill variants, not families
  const skillsData = JSON.parse(fs.readFileSync(path.join(WEB_DATA_DIR, "skills.json"), "utf-8"));
  manifest.entityCounts.skills = skillsData.reduce((sum: number, s: any) => sum + s.variants.length, 0);
  manifest.entityCounts.specializations = count("specializations.json");
  manifest.lastDataUpdate = new Date().toISOString();
  manifest.sources = [...new Set([...(manifest.sources || []), "mcp-import"])];

  writeWebFile("manifest.json", manifest);
}

/** Print a summary table of all transforms */
function printSummary(): void {
  console.log("\n" + "=".repeat(70));
  console.log("  MCP Data Import Summary");
  console.log("=".repeat(70));
  console.log(
    "  " +
      "Source File".padEnd(25) +
      "Target File".padEnd(25) +
      "Entries"
  );
  console.log("  " + "-".repeat(65));
  for (const row of summary) {
    console.log(
      "  " +
        row.source.padEnd(25) +
        row.target.padEnd(25) +
        String(row.count)
    );
  }
  console.log("=".repeat(70));
}

// --- Main entry point ---

function main(): void {
  console.log("MCP Data Import: shd-planner-cwd → shd-planner\n");
  console.log(`  Source: ${MCP_DATA_DIR}`);
  console.log(`  Target: ${WEB_DATA_DIR}\n`);

  // Verify directories exist
  if (!fs.existsSync(MCP_DATA_DIR)) {
    throw new Error(`MCP data directory not found: ${MCP_DATA_DIR}`);
  }
  if (!fs.existsSync(WEB_DATA_DIR)) {
    throw new Error(`Web data directory not found: ${WEB_DATA_DIR}`);
  }

  // Run all 9 transforms (13 output files counting splits)
  transformBrandSets();
  transformGearSets();
  transformExotics();
  transformNamedItems();
  transformWeapons();
  transformGearTalents();
  transformWeaponTalents();
  transformSkills();
  transformSpecializations();

  // Update manifest with new counts
  updateManifest();

  // Print summary
  printSummary();

  console.log("\nDone. Files NOT transformed (TS-only): gear-attributes.json, skill-mods.json, shd-watch.json, meta-builds.json");
}

main();
