#!/usr/bin/env npx tsx
/**
 * validate-data.ts
 *
 * Validates data completeness for the SHD Planner knowledge base.
 * Checks expected counts per category and logs what is missing or incomplete.
 * Outputs a validation report to /src/data/validation-report.json.
 *
 * Usage: npx tsx src/scripts/validators/validate-data.ts
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "../../data");

// --- Expected minimum counts ---
const EXPECTED_COUNTS: Record<string, number> = {
  "gear-brands.json": 22,
  "gear-sets.json": 18,
  "named-items.json": 20,
  "exotics-gear.json": 10,
  "exotics-weapons.json": 15,
  "weapons.json": 7,           // 7 weapon types
  "weapon-talents.json": 30,
  "gear-talents.json": 25,
  "gear-attributes.json": 15,
  "skills.json": 9,            // 9 skill categories
  "skill-mods.json": 10,
  "specializations.json": 6,
  "shd-watch.json": 4,
};

// --- Required fields per entity type ---
const REQUIRED_FIELDS: Record<string, string[]> = {
  "gear-brands.json": ["id", "name", "bonuses", "availableSlots", "coreFocus"],
  "gear-sets.json": ["id", "name", "bonuses", "chestTalent", "backpackTalent", "gearSlots"],
  "named-items.json": ["id", "name", "brandId", "slot", "coreAttribute", "fixedAttribute"],
  "exotics-gear.json": ["id", "name", "slot", "uniqueTalent", "coreAttribute"],
  "exotics-weapons.json": ["id", "name", "category", "uniqueTalent", "coreAttribute"],
  "weapon-talents.json": ["id", "name", "weaponTypes", "description"],
  "gear-talents.json": ["id", "name", "slot", "description"],
  "gear-attributes.json": ["id", "stat", "label", "category"],
  "specializations.json": ["id", "name", "signatureWeapon", "uniqueSkill", "grenade"],
  "shd-watch.json": ["id", "name", "maxLevel", "bonuses"],
};

interface ValidationIssue {
  file: string;
  severity: "error" | "warning" | "info";
  message: string;
}

interface ValidationReport {
  generatedAt: string;
  totalFiles: number;
  filesFound: number;
  filesMissing: string[];
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: ValidationIssue[];
  entityCounts: Record<string, { expected: number; actual: number; status: string }>;
}

/** Read a JSON data file */
function readDataFile(filename: string): unknown[] | null {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** Check if an entity has all required fields */
function checkRequiredFields(entity: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (entity[field] === undefined || entity[field] === null || entity[field] === "") {
      missing.push(field);
    }
  }
  return missing;
}

function main(): void {
  console.log("=== SHD Planner: Data Validation ===\n");

  const issues: ValidationIssue[] = [];
  const filesMissing: string[] = [];
  const entityCounts: Record<string, { expected: number; actual: number; status: string }> = {};

  // Check each expected file
  for (const [filename, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
    const data = readDataFile(filename);

    if (data === null) {
      filesMissing.push(filename);
      issues.push({
        file: filename,
        severity: "error",
        message: `File missing or not a valid JSON array`,
      });
      entityCounts[filename] = { expected: expectedCount, actual: 0, status: "MISSING" };
      continue;
    }

    const actualCount = data.length;
    let status = "OK";

    if (actualCount < expectedCount) {
      status = "LOW";
      issues.push({
        file: filename,
        severity: "warning",
        message: `Expected at least ${expectedCount} entries, found ${actualCount} (${expectedCount - actualCount} short)`,
      });
    } else if (actualCount === expectedCount) {
      status = "OK";
      issues.push({
        file: filename,
        severity: "info",
        message: `${actualCount} entries (meets minimum)`,
      });
    } else {
      status = "GOOD";
      issues.push({
        file: filename,
        severity: "info",
        message: `${actualCount} entries (exceeds minimum of ${expectedCount})`,
      });
    }

    entityCounts[filename] = { expected: expectedCount, actual: actualCount, status };

    // Check required fields for each entity
    const requiredFields = REQUIRED_FIELDS[filename];
    if (requiredFields) {
      for (const entity of data) {
        if (typeof entity !== "object" || entity === null) {
          issues.push({
            file: filename,
            severity: "error",
            message: `Invalid entity: not an object`,
          });
          continue;
        }

        const missingFields = checkRequiredFields(entity as Record<string, unknown>, requiredFields);
        if (missingFields.length > 0) {
          const entityId = (entity as Record<string, unknown>).id || (entity as Record<string, unknown>).name || "unknown";
          issues.push({
            file: filename,
            severity: "warning",
            message: `Entity "${entityId}" missing fields: ${missingFields.join(", ")}`,
          });
        }
      }
    }
  }

  // Check for weapons.json archetypes (nested structure)
  const weaponsData = readDataFile("weapons.json");
  if (weaponsData) {
    let totalArchetypes = 0;
    for (const weaponType of weaponsData) {
      const wt = weaponType as Record<string, unknown>;
      const archetypes = wt.archetypes as unknown[];
      if (Array.isArray(archetypes)) {
        totalArchetypes += archetypes.length;
        for (const arch of archetypes) {
          const a = arch as Record<string, unknown>;
          if (!a.id || !a.name || !a.rpm || !a.magazine) {
            issues.push({
              file: "weapons.json",
              severity: "warning",
              message: `Archetype "${a.name || a.id || "unknown"}" missing required fields (id, name, rpm, magazine)`,
            });
          }
        }
      }
    }
    if (totalArchetypes < 25) {
      issues.push({
        file: "weapons.json",
        severity: "warning",
        message: `Expected at least 25 weapon archetypes, found ${totalArchetypes}`,
      });
    } else {
      issues.push({
        file: "weapons.json",
        severity: "info",
        message: `${totalArchetypes} weapon archetypes found`,
      });
    }
  }

  // Check for skills.json variants (nested structure)
  const skillsData = readDataFile("skills.json");
  if (skillsData) {
    let totalVariants = 0;
    for (const skill of skillsData) {
      const s = skill as Record<string, unknown>;
      const variants = s.variants as unknown[];
      if (Array.isArray(variants)) {
        totalVariants += variants.length;
        for (const variant of variants) {
          const v = variant as Record<string, unknown>;
          if (!v.id || !v.name || !v.damageType) {
            issues.push({
              file: "skills.json",
              severity: "warning",
              message: `Skill variant "${v.name || v.id || "unknown"}" missing required fields (id, name, damageType)`,
            });
          }
        }
      }
    }
    if (totalVariants < 30) {
      issues.push({
        file: "skills.json",
        severity: "warning",
        message: `Expected at least 30 skill variants, found ${totalVariants}`,
      });
    } else {
      issues.push({
        file: "skills.json",
        severity: "info",
        message: `${totalVariants} skill variants found`,
      });
    }
  }

  // Build report
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;

  const report: ValidationReport = {
    generatedAt: new Date().toISOString(),
    totalFiles: Object.keys(EXPECTED_COUNTS).length,
    filesFound: Object.keys(EXPECTED_COUNTS).length - filesMissing.length,
    filesMissing,
    totalIssues: issues.length,
    errors,
    warnings,
    infos,
    issues,
    entityCounts,
  };

  // Write report
  const reportPath = path.join(DATA_DIR, "validation-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");

  // Console output
  console.log("Entity Counts:");
  console.log("-".repeat(60));
  for (const [file, counts] of Object.entries(entityCounts)) {
    const statusIcon = counts.status === "MISSING" ? "X" : counts.status === "LOW" ? "!" : "+";
    console.log(`  [${statusIcon}] ${file.padEnd(25)} ${String(counts.actual).padStart(4)} / ${counts.expected} (${counts.status})`);
  }

  console.log(`\nValidation Summary:`);
  console.log(`  Files: ${report.filesFound}/${report.totalFiles} found`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`  Info: ${infos}`);
  console.log(`\nReport written to: ${reportPath}`);

  // Exit with error code if there are errors
  if (errors > 0) {
    console.log(`\n[FAIL] ${errors} error(s) found.`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`\n[WARN] ${warnings} warning(s) found. Review report for details.`);
  } else {
    console.log(`\n[PASS] All checks passed.`);
  }
}

main();
