#!/usr/bin/env npx tsx
/**
 * merge-icons.ts
 *
 * Scans downloaded icons in public/icons/ and patches JSON data files
 * in src/data/ with iconUrl fields pointing to matching local icon paths.
 *
 * Usage: npx tsx src/scripts/transforms/merge-icons.ts
 */

import * as fs from "fs";
import * as path from "path";

// --- Path constants ---
const ROOT = path.resolve(__dirname, "../../..");
const ICONS_DIR = path.join(ROOT, "public/icons");
const DATA_DIR = path.join(ROOT, "src/data");

/**
 * Mapping from JSON data files to their corresponding icon subdirectory.
 * Multiple data files can map to the same icon directory.
 */
const FILE_ICON_MAP: Array<{ dataFile: string; iconDir: string }> = [
  { dataFile: "gear-brands.json", iconDir: "brands" },
  { dataFile: "gear-sets.json", iconDir: "gear-sets" },
  { dataFile: "exotics-gear.json", iconDir: "exotics" },
  { dataFile: "exotics-weapons.json", iconDir: "exotics" },
  { dataFile: "gear-talents.json", iconDir: "talents" },
  { dataFile: "weapon-talents.json", iconDir: "talents" },
  { dataFile: "weapons.json", iconDir: "weapons" },
  { dataFile: "skills.json", iconDir: "skills" },
  { dataFile: "specializations.json", iconDir: "specializations" },
];

/**
 * Collect all .png filenames (without extension) from a directory.
 * Returns an empty set if the directory does not exist.
 */
function getAvailableIcons(iconDirPath: string): Set<string> {
  const icons = new Set<string>();
  if (!fs.existsSync(iconDirPath)) {
    return icons;
  }
  for (const file of fs.readdirSync(iconDirPath)) {
    if (file.toLowerCase().endsWith(".png")) {
      // Strip the .png extension to get the icon id
      icons.add(file.slice(0, -4));
    }
  }
  return icons;
}

/**
 * Patch a single JSON data file with iconUrl fields for items that
 * have a matching icon file on disk.
 * Returns { patched, missing, total } counts.
 */
function patchDataFile(
  dataFile: string,
  iconDir: string
): { patched: number; missing: number; total: number } {
  const dataPath = path.join(DATA_DIR, dataFile);
  const iconDirPath = path.join(ICONS_DIR, iconDir);

  // Read the JSON data file
  if (!fs.existsSync(dataPath)) {
    console.log(`  [skip] ${dataFile} — file not found`);
    return { patched: 0, missing: 0, total: 0 };
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const data: unknown = JSON.parse(raw);

  // Only handle arrays of objects with id fields
  if (!Array.isArray(data)) {
    console.log(`  [skip] ${dataFile} — not an array`);
    return { patched: 0, missing: 0, total: 0 };
  }

  // Collect available icons from the target directory
  const availableIcons = getAvailableIcons(iconDirPath);

  let patched = 0;
  let missing = 0;
  const total = data.length;

  for (const item of data) {
    if (typeof item !== "object" || item === null || !("id" in item)) {
      continue;
    }

    const id = (item as Record<string, unknown>).id as string;
    if (availableIcons.has(id)) {
      // Add or update the iconUrl field
      (item as Record<string, unknown>).iconUrl = `/icons/${iconDir}/${id}.png`;
      patched++;
    } else {
      missing++;
    }
  }

  // Only write if we actually patched something
  if (patched > 0) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }

  return { patched, missing, total };
}

/** Main entry point — iterates all mappings and prints a summary */
function main(): void {
  console.log("=== merge-icons: patching JSON data with icon paths ===\n");

  // Check if icons directory exists at all
  if (!fs.existsSync(ICONS_DIR)) {
    console.log(`Icons directory not found: ${ICONS_DIR}`);
    console.log("Run the icon scraper first, then re-run this script.\n");
  }

  let totalPatched = 0;
  let totalMissing = 0;

  for (const { dataFile, iconDir } of FILE_ICON_MAP) {
    const { patched, missing, total } = patchDataFile(dataFile, iconDir);
    totalPatched += patched;
    totalMissing += missing;

    const status = patched > 0 ? "✓" : "–";
    console.log(
      `  ${status} ${dataFile}: ${patched}/${total} patched, ${missing} missing icons (dir: ${iconDir}/)`
    );
  }

  console.log(`\n=== Summary: ${totalPatched} patched, ${totalMissing} missing ===\n`);
}

// Run
main();
