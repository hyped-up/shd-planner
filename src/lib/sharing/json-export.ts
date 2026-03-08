/**
 * JSON import/export utilities for builds.
 * Provides clean serialization and validated deserialization of IBuild objects.
 */

import type { IBuild } from "@/lib/types/build";
import type { IImportResult } from "./types";
import { migrateBuild } from "./build-migrator";

/**
 * Export a build as a formatted JSON string.
 * Includes all fields for full portability.
 */
export function exportBuildAsJSON(build: IBuild): string {
  return JSON.stringify(build, null, 2);
}

/**
 * Import a build from a raw JSON string.
 * Validates structure and migrates to current format.
 * Returns the parsed build or null with error messages.
 */
export function importBuildFromJSON(json: string): IImportResult {
  const errors: string[] = [];

  // Attempt to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown parse error";
    return {
      build: null,
      errors: [`Invalid JSON: ${message}`],
    };
  }

  // Validate top-level structure is an object
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      build: null,
      errors: ["JSON must contain a single build object."],
    };
  }

  const raw = parsed as Record<string, unknown>;

  // Check for required fields that indicate this is actually a build
  if (!raw.gear && !raw.weapons && !raw.name) {
    return {
      build: null,
      errors: [
        "JSON does not appear to be a valid build. Expected 'name', 'gear', or 'weapons' fields.",
      ],
    };
  }

  // Read the current data version from the manifest if available
  const currentDataVersion =
    typeof raw.dataVersion === "string" ? raw.dataVersion : "0.1.0";

  // Use the migrator to handle any version differences or missing fields
  const result = migrateBuild(parsed, currentDataVersion);

  // Convert migration warnings to import errors (non-fatal)
  if (result.warnings.length > 0) {
    errors.push(...result.warnings);
  }

  return {
    build: result.build,
    errors,
  };
}
