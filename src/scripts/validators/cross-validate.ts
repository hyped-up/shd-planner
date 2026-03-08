#!/usr/bin/env npx tsx
/**
 * cross-validate.ts
 *
 * Checks referential integrity across SHD Planner data files.
 * Validates that IDs, references, and data ranges are consistent.
 * Outputs to /src/data/cross-validation-report.json.
 *
 * Usage: npx tsx src/scripts/validators/cross-validate.ts
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "../../data");

interface CrossValidationIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
}

interface CrossValidationReport {
  generatedAt: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  issues: CrossValidationIssue[];
}

/** Read and parse a JSON data file */
function readDataFile<T>(filename: string): T | null {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function main(): void {
  console.log("=== SHD Planner: Cross-Validation ===\n");

  const issues: CrossValidationIssue[] = [];
  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  let warningCount = 0;

  // Load all data files
  const brandSets = readDataFile<Array<{ id: string; name: string }>>("gear-brands.json") ?? [];
  const gearSets = readDataFile<Array<{ id: string; name: string }>>("gear-sets.json") ?? [];
  const namedItems = readDataFile<Array<{ id: string; name: string; brandId: string; slot: string; coreAttribute: string }>>("named-items.json") ?? [];
  const exoticGear = readDataFile<Array<{ id: string; name: string; slot: string }>>("exotics-gear.json") ?? [];
  const exoticWeapons = readDataFile<Array<{ id: string; name: string; category: string }>>("exotics-weapons.json") ?? [];
  const weapons = readDataFile<Array<{ id: string; class: string; archetypes: Array<{ id: string; name: string; type: string; rpm: number; magazine: number; reloadSeconds: number; optimalRangeMeters: number }> }>>("weapons.json") ?? [];
  const weaponTalents = readDataFile<Array<{ id: string; name: string; weaponTypes: string[] }>>("weapon-talents.json") ?? [];
  const gearTalents = readDataFile<Array<{ id: string; name: string; slot: string }>>("gear-talents.json") ?? [];
  const gearAttributes = readDataFile<Array<{ id: string; stat: string; maxRoll: number | null; unit: string }>>("gear-attributes.json") ?? [];
  const skills = readDataFile<Array<{ id: string; name: string; variants: Array<{ id: string; name: string }> }>>("skills.json") ?? [];
  const specializations = readDataFile<Array<{ id: string; name: string }>>("specializations.json") ?? [];

  // Build lookup sets
  const brandIds = new Set(brandSets.map((b) => b.id));
  const gearSetIds = new Set(gearSets.map((g) => g.id));
  const validSlots = new Set(["mask", "backpack", "chest", "gloves", "holster", "kneepads"]);
  const validCoreAttributes = new Set(["weapon_damage", "armor", "skill_tier", "skill_damage"]);
  const validWeaponTypes = new Set(["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"]);
  const validGearTalentSlots = new Set(["chest", "backpack"]);

  // --- Check 1: No duplicate IDs across all entities ---
  console.log("[check] No duplicate IDs...");
  const allIds = new Map<string, string>();
  const allEntities: Array<{ source: string; id: string }> = [
    ...brandSets.map((b) => ({ source: "gear-brands", id: b.id })),
    ...gearSets.map((g) => ({ source: "gear-sets", id: g.id })),
    ...namedItems.map((n) => ({ source: "named-items", id: n.id })),
    ...exoticGear.map((e) => ({ source: "exotics-gear", id: e.id })),
    ...exoticWeapons.map((e) => ({ source: "exotics-weapons", id: e.id })),
    ...weaponTalents.map((t) => ({ source: "weapon-talents", id: t.id })),
    ...gearTalents.map((t) => ({ source: "gear-talents", id: t.id })),
    ...gearAttributes.map((a) => ({ source: "gear-attributes", id: a.id })),
    ...specializations.map((s) => ({ source: "specializations", id: s.id })),
  ];

  // Add weapon archetypes
  for (const wt of weapons) {
    allEntities.push({ source: "weapons", id: wt.id });
    for (const arch of wt.archetypes) {
      allEntities.push({ source: "weapons/archetype", id: arch.id });
    }
  }

  // Add skill variants
  for (const skill of skills) {
    allEntities.push({ source: "skills", id: skill.id });
    for (const variant of skill.variants) {
      allEntities.push({ source: "skills/variant", id: variant.id });
    }
  }

  for (const entity of allEntities) {
    totalChecks++;
    if (allIds.has(entity.id)) {
      failed++;
      issues.push({
        severity: "error",
        category: "duplicate-id",
        message: `Duplicate ID "${entity.id}" found in ${entity.source} (first seen in ${allIds.get(entity.id)})`,
      });
    } else {
      passed++;
      allIds.set(entity.id, entity.source);
    }
  }

  // --- Check 2: Named item brand IDs reference valid brands ---
  console.log("[check] Named item brand ID references...");
  for (const item of namedItems) {
    totalChecks++;
    if (!brandIds.has(item.brandId)) {
      failed++;
      issues.push({
        severity: "error",
        category: "invalid-brand-ref",
        message: `Named item "${item.name}" (${item.id}) references brand "${item.brandId}" which does not exist`,
      });
    } else {
      passed++;
    }
  }

  // --- Check 3: Named item slots are valid ---
  console.log("[check] Named item slot validity...");
  for (const item of namedItems) {
    totalChecks++;
    if (!validSlots.has(item.slot)) {
      failed++;
      issues.push({
        severity: "error",
        category: "invalid-slot",
        message: `Named item "${item.name}" has invalid slot "${item.slot}"`,
      });
    } else {
      passed++;
    }
  }

  // --- Check 4: Named item core attributes are valid ---
  console.log("[check] Named item core attributes...");
  for (const item of namedItems) {
    totalChecks++;
    if (!validCoreAttributes.has(item.coreAttribute)) {
      failed++;
      issues.push({
        severity: "warning",
        category: "invalid-core-attr",
        message: `Named item "${item.name}" has unusual core attribute "${item.coreAttribute}"`,
      });
    } else {
      passed++;
    }
  }

  // --- Check 5: Exotic gear slots are valid ---
  console.log("[check] Exotic gear slot validity...");
  for (const exotic of exoticGear) {
    totalChecks++;
    if (!validSlots.has(exotic.slot)) {
      failed++;
      issues.push({
        severity: "error",
        category: "invalid-slot",
        message: `Exotic gear "${exotic.name}" has invalid slot "${exotic.slot}"`,
      });
    } else {
      passed++;
    }
  }

  // --- Check 6: Exotic weapon categories are valid weapon types ---
  console.log("[check] Exotic weapon category validity...");
  for (const exotic of exoticWeapons) {
    totalChecks++;
    if (!validWeaponTypes.has(exotic.category)) {
      failed++;
      issues.push({
        severity: "error",
        category: "invalid-weapon-type",
        message: `Exotic weapon "${exotic.name}" has invalid category "${exotic.category}"`,
      });
    } else {
      passed++;
    }
  }

  // --- Check 7: Weapon talent type restrictions use valid weapon types ---
  console.log("[check] Weapon talent type restrictions...");
  for (const talent of weaponTalents) {
    for (const wtype of talent.weaponTypes) {
      totalChecks++;
      if (!validWeaponTypes.has(wtype)) {
        failed++;
        issues.push({
          severity: "error",
          category: "invalid-weapon-type-ref",
          message: `Weapon talent "${talent.name}" references invalid weapon type "${wtype}"`,
        });
      } else {
        passed++;
      }
    }
  }

  // --- Check 8: Gear talent slots are valid ---
  console.log("[check] Gear talent slot validity...");
  for (const talent of gearTalents) {
    totalChecks++;
    if (!validGearTalentSlots.has(talent.slot)) {
      failed++;
      issues.push({
        severity: "error",
        category: "invalid-talent-slot",
        message: `Gear talent "${talent.name}" has invalid slot "${talent.slot}" (must be chest or backpack)`,
      });
    } else {
      passed++;
    }
  }

  // --- Check 9: Weapon RPM, magazine, and range are in reasonable ranges ---
  console.log("[check] Weapon stat ranges...");
  for (const wt of weapons) {
    for (const arch of wt.archetypes) {
      // RPM check (10-1500)
      totalChecks++;
      if (arch.rpm < 10 || arch.rpm > 1500) {
        warningCount++;
        issues.push({
          severity: "warning",
          category: "unreasonable-stat",
          message: `Weapon "${arch.name}" has unusual RPM: ${arch.rpm} (expected 10-1500)`,
        });
      } else {
        passed++;
      }

      // Magazine check (1-200)
      totalChecks++;
      if (arch.magazine < 1 || arch.magazine > 200) {
        warningCount++;
        issues.push({
          severity: "warning",
          category: "unreasonable-stat",
          message: `Weapon "${arch.name}" has unusual magazine size: ${arch.magazine} (expected 1-200)`,
        });
      } else {
        passed++;
      }

      // Range check (5-100)
      totalChecks++;
      if (arch.optimalRangeMeters < 5 || arch.optimalRangeMeters > 100) {
        warningCount++;
        issues.push({
          severity: "warning",
          category: "unreasonable-stat",
          message: `Weapon "${arch.name}" has unusual range: ${arch.optimalRangeMeters}m (expected 5-100)`,
        });
      } else {
        passed++;
      }

      // Reload check (0.5-10)
      totalChecks++;
      if (arch.reloadSeconds < 0.5 || arch.reloadSeconds > 10) {
        warningCount++;
        issues.push({
          severity: "warning",
          category: "unreasonable-stat",
          message: `Weapon "${arch.name}" has unusual reload: ${arch.reloadSeconds}s (expected 0.5-10)`,
        });
      } else {
        passed++;
      }
    }
  }

  // --- Check 10: Attribute max roll reasonableness ---
  console.log("[check] Attribute max roll ranges...");
  for (const attr of gearAttributes) {
    totalChecks++;
    if (attr.maxRoll !== null) {
      if (attr.unit === "percent" && (attr.maxRoll < 0 || attr.maxRoll > 100)) {
        warningCount++;
        issues.push({
          severity: "warning",
          category: "unreasonable-stat",
          message: `Attribute "${attr.stat}" has unusual max roll: ${attr.maxRoll}% (expected 0-100 for percent)`,
        });
      } else {
        passed++;
      }
    } else {
      passed++;
    }
  }

  // --- Check 11: Specialization count matches expected ---
  console.log("[check] Specialization count...");
  totalChecks++;
  if (specializations.length !== 6) {
    warningCount++;
    issues.push({
      severity: "warning",
      category: "count-mismatch",
      message: `Expected 6 specializations, found ${specializations.length}`,
    });
  } else {
    passed++;
  }

  // --- Check 12: All gear set slots contain valid values ---
  console.log("[check] Gear set slot validity...");
  for (const gs of gearSets) {
    const gsTyped = gs as unknown as { id: string; name: string; gearSlots: string[] };
    if (Array.isArray(gsTyped.gearSlots)) {
      for (const slot of gsTyped.gearSlots) {
        totalChecks++;
        if (!validSlots.has(slot)) {
          failed++;
          issues.push({
            severity: "error",
            category: "invalid-slot",
            message: `Gear set "${gsTyped.name}" has invalid slot "${slot}"`,
          });
        } else {
          passed++;
        }
      }
    }
  }

  // --- Check 13: ID format consistency ---
  console.log("[check] ID format consistency...");
  const idPatterns: Record<string, RegExp> = {
    "brand": /^brand-/,
    "gearset": /^gearset-/,
    "named": /^named-/,
    "exotic": /^exotic-/,
    "talent": /^talent-/,
    "attr": /^attr-/,
    "spec": /^spec-/,
    "weapon-type": /^weapon-type-/,
    "skill": /^skill-/,
    "shd": /^shd-/,
    "mod": /^mod-/,
  };

  for (const b of brandSets) {
    totalChecks++;
    if (!idPatterns["brand"].test(b.id)) {
      warningCount++;
      issues.push({ severity: "warning", category: "id-format", message: `Brand "${b.name}" ID "${b.id}" does not start with "brand-"` });
    } else { passed++; }
  }

  for (const g of gearSets) {
    totalChecks++;
    if (!idPatterns["gearset"].test(g.id)) {
      warningCount++;
      issues.push({ severity: "warning", category: "id-format", message: `Gear set "${g.name}" ID "${g.id}" does not start with "gearset-"` });
    } else { passed++; }
  }

  for (const n of namedItems) {
    totalChecks++;
    if (!idPatterns["named"].test(n.id)) {
      warningCount++;
      issues.push({ severity: "warning", category: "id-format", message: `Named item "${n.name}" ID "${n.id}" does not start with "named-"` });
    } else { passed++; }
  }

  for (const s of specializations) {
    totalChecks++;
    if (!idPatterns["spec"].test(s.id)) {
      warningCount++;
      issues.push({ severity: "warning", category: "id-format", message: `Specialization "${s.name}" ID "${s.id}" does not start with "spec-"` });
    } else { passed++; }
  }

  // Build report
  const report: CrossValidationReport = {
    generatedAt: new Date().toISOString(),
    totalChecks,
    passed,
    failed,
    warnings: warningCount,
    issues,
  };

  // Write report
  const reportPath = path.join(DATA_DIR, "cross-validation-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");

  // Console output
  const errorIssues = issues.filter((i) => i.severity === "error");
  const warnIssues = issues.filter((i) => i.severity === "warning");

  console.log(`\n=== Cross-Validation Summary ===`);
  console.log(`Total checks: ${totalChecks}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Warnings: ${warningCount}`);

  if (errorIssues.length > 0) {
    console.log(`\nErrors:`);
    for (const issue of errorIssues) {
      console.log(`  [ERROR] [${issue.category}] ${issue.message}`);
    }
  }

  if (warnIssues.length > 0) {
    console.log(`\nWarnings:`);
    for (const issue of warnIssues) {
      console.log(`  [WARN]  [${issue.category}] ${issue.message}`);
    }
  }

  console.log(`\nReport written to: ${reportPath}`);

  if (failed > 0) {
    console.log(`\n[FAIL] ${failed} cross-validation error(s) found.`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n[WARN] ${warningCount} warning(s). Review report for details.`);
  } else {
    console.log(`\n[PASS] All cross-validation checks passed.`);
  }
}

main();
