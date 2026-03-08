/**
 * URL codec for build sharing.
 * Compresses IBuild into a URL-safe string using lz-string and compact keys.
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { IBuild } from "@/lib/types/build";
import type { ICompactBuild } from "./types";

// Mapping of full keys to compact keys for URL compression
const KEY_MAP = {
  name: "n",
  gear: "g",
  weapons: "w",
  skills: "s",
  specialization: "sp",
  shdWatch: "sw",
  dataVersion: "dv",
} as const;

// Reverse mapping for decompression
const REVERSE_KEY_MAP: Record<string, string> = {
  n: "name",
  g: "gear",
  w: "weapons",
  s: "skills",
  sp: "specialization",
  sw: "shdWatch",
  dv: "dataVersion",
};

/**
 * Encode a build into a URL-safe compressed string.
 * Strips non-essential fields (id, description, createdAt, updatedAt)
 * and uses compact JSON keys before compressing with lz-string.
 */
export function encodeBuild(build: IBuild): string {
  // Create compact representation, stripping non-essential fields
  const compact: ICompactBuild = {
    [KEY_MAP.name]: build.name,
    [KEY_MAP.gear]: build.gear,
    [KEY_MAP.weapons]: build.weapons,
    [KEY_MAP.skills]: build.skills,
    [KEY_MAP.specialization]: build.specialization,
    [KEY_MAP.shdWatch]: build.shdWatch,
    [KEY_MAP.dataVersion]: build.dataVersion,
  };

  const json = JSON.stringify(compact);
  return compressToEncodedURIComponent(json);
}

/**
 * Decode a URL-safe compressed string back into an IBuild.
 * Expands compact keys and fills in default values for stripped fields.
 * Returns null if decompression or parsing fails.
 */
export function decodeBuild(encoded: string): IBuild | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) {
      return null;
    }

    const compact = JSON.parse(json) as Record<string, unknown>;

    // Expand compact keys back to full names
    const expanded: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(compact)) {
      const fullKey = REVERSE_KEY_MAP[key] ?? key;
      expanded[fullKey] = value;
    }

    // Validate required fields exist
    if (!expanded.name || !expanded.gear || !expanded.weapons || !expanded.skills) {
      return null;
    }

    // Reconstruct full IBuild with defaults for stripped fields
    const build: IBuild = {
      id: crypto.randomUUID(),
      name: expanded.name as string,
      description: "",
      gear: expanded.gear as IBuild["gear"],
      weapons: expanded.weapons as IBuild["weapons"],
      skills: expanded.skills as IBuild["skills"],
      specialization: (expanded.specialization as IBuild["specialization"]) ?? null,
      shdWatch: (expanded.shdWatch as IBuild["shdWatch"]) ?? {
        weaponDamage: 0,
        armor: 0,
        skillTier: 0,
        criticalHitChance: 0,
        criticalHitDamage: 0,
        headshotDamage: 0,
        health: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataVersion: (expanded.dataVersion as string) ?? "0.0.0",
    };

    return build;
  } catch {
    return null;
  }
}
