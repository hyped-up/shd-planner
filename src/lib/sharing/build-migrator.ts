/**
 * Build migration utility.
 * Handles version mismatches and missing fields when importing builds
 * from older data versions or external sources.
 */

import type { IBuild, ISHDWatchConfig } from "@/lib/types/build";
import type { GearSlot, SpecializationType } from "@/lib/types/enums";
import type { IMigrationResult } from "./types";

// Valid gear slots for validation
const VALID_GEAR_SLOTS: ReadonlySet<string> = new Set([
  "Mask",
  "Backpack",
  "Chest",
  "Gloves",
  "Holster",
  "Kneepads",
]);

// Valid specializations for validation
const VALID_SPECIALIZATIONS: ReadonlySet<string> = new Set([
  "Survivalist",
  "Demolitionist",
  "Sharpshooter",
  "Gunner",
  "Technician",
  "Firewall",
]);

// Default SHD Watch config with all zeros
const DEFAULT_SHD_WATCH: ISHDWatchConfig = {
  weaponDamage: 0,
  armor: 0,
  skillTier: 0,
  criticalHitChance: 0,
  criticalHitDamage: 0,
  headshotDamage: 0,
  health: 0,
};

/**
 * Migrate a build object from any version to the current format.
 * Fills missing fields with sensible defaults and reports any issues as warnings.
 */
export function migrateBuild(
  build: unknown,
  currentDataVersion: string
): IMigrationResult {
  const warnings: string[] = [];
  const raw = build as Record<string, unknown>;

  // Ensure we have a valid object to work with
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      build: createEmptyBuild(currentDataVersion),
      warnings: ["Input was not a valid build object. Created empty build."],
    };
  }

  // Check data version mismatch
  const buildVersion = typeof raw.dataVersion === "string" ? raw.dataVersion : "";
  if (buildVersion && buildVersion !== currentDataVersion) {
    warnings.push(
      `Build data version "${buildVersion}" differs from current "${currentDataVersion}". Some items may have changed.`
    );
  }

  // Migrate ID
  const id = typeof raw.id === "string" && raw.id ? raw.id : crypto.randomUUID();

  // Migrate name
  const name = typeof raw.name === "string" && raw.name ? raw.name : "Imported Build";
  if (!raw.name) {
    warnings.push("Build name was missing. Set to 'Imported Build'.");
  }

  // Migrate description
  const description = typeof raw.description === "string" ? raw.description : "";

  // Migrate gear
  const gear = migrateGear(raw.gear, warnings);

  // Migrate weapons
  const weapons = migrateWeapons(raw.weapons, warnings);

  // Migrate skills
  const skills = migrateSkills(raw.skills, warnings);

  // Migrate specialization
  let specialization: SpecializationType | null = null;
  if (typeof raw.specialization === "string") {
    if (VALID_SPECIALIZATIONS.has(raw.specialization)) {
      specialization = raw.specialization as SpecializationType;
    } else {
      warnings.push(
        `Unknown specialization "${raw.specialization}". Cleared to null.`
      );
    }
  }

  // Migrate SHD Watch
  const shdWatch = migrateSHDWatch(raw.shdWatch, warnings);

  // Migrate timestamps
  const now = new Date().toISOString();
  const createdAt =
    typeof raw.createdAt === "string" ? raw.createdAt : now;
  const updatedAt = now;

  const migrated: IBuild = {
    id,
    name,
    description,
    gear,
    weapons,
    skills,
    specialization,
    shdWatch,
    createdAt,
    updatedAt,
    dataVersion: currentDataVersion,
  };

  return { build: migrated, warnings };
}

/** Migrate gear slots, validating each piece */
function migrateGear(
  rawGear: unknown,
  warnings: string[]
): Partial<Record<GearSlot, IBuild["gear"][GearSlot]>> {
  if (!rawGear || typeof rawGear !== "object") {
    if (rawGear !== undefined && rawGear !== null) {
      warnings.push("Gear data was invalid. Cleared to empty.");
    }
    return {};
  }

  const gear: Partial<Record<GearSlot, IBuild["gear"][GearSlot]>> = {};
  const rawObj = rawGear as Record<string, unknown>;

  for (const [slot, piece] of Object.entries(rawObj)) {
    if (!VALID_GEAR_SLOTS.has(slot)) {
      warnings.push(`Unknown gear slot "${slot}" removed.`);
      continue;
    }
    if (piece && typeof piece === "object") {
      gear[slot as GearSlot] = piece as IBuild["gear"][GearSlot];
    }
  }

  return gear;
}

/** Migrate weapon slots */
function migrateWeapons(
  rawWeapons: unknown,
  warnings: string[]
): IBuild["weapons"] {
  const defaults: IBuild["weapons"] = {
    primary: null,
    secondary: null,
    sidearm: null,
  };

  if (!rawWeapons || typeof rawWeapons !== "object") {
    if (rawWeapons !== undefined && rawWeapons !== null) {
      warnings.push("Weapons data was invalid. Cleared to empty.");
    }
    return defaults;
  }

  const raw = rawWeapons as Record<string, unknown>;
  return {
    primary: raw.primary && typeof raw.primary === "object"
      ? (raw.primary as IBuild["weapons"]["primary"])
      : null,
    secondary: raw.secondary && typeof raw.secondary === "object"
      ? (raw.secondary as IBuild["weapons"]["secondary"])
      : null,
    sidearm: raw.sidearm && typeof raw.sidearm === "object"
      ? (raw.sidearm as IBuild["weapons"]["sidearm"])
      : null,
  };
}

/** Migrate skill slots */
function migrateSkills(
  rawSkills: unknown,
  warnings: string[]
): IBuild["skills"] {
  const defaults: IBuild["skills"] = {
    skill1: null,
    skill2: null,
  };

  if (!rawSkills || typeof rawSkills !== "object") {
    if (rawSkills !== undefined && rawSkills !== null) {
      warnings.push("Skills data was invalid. Cleared to empty.");
    }
    return defaults;
  }

  const raw = rawSkills as Record<string, unknown>;
  return {
    skill1: raw.skill1 && typeof raw.skill1 === "object"
      ? (raw.skill1 as IBuild["skills"]["skill1"])
      : null,
    skill2: raw.skill2 && typeof raw.skill2 === "object"
      ? (raw.skill2 as IBuild["skills"]["skill2"])
      : null,
  };
}

/** Migrate SHD Watch configuration */
function migrateSHDWatch(
  rawWatch: unknown,
  warnings: string[]
): ISHDWatchConfig {
  if (!rawWatch || typeof rawWatch !== "object") {
    if (rawWatch !== undefined && rawWatch !== null) {
      warnings.push("SHD Watch data was invalid. Reset to defaults.");
    }
    return { ...DEFAULT_SHD_WATCH };
  }

  const raw = rawWatch as Record<string, unknown>;
  const watch = { ...DEFAULT_SHD_WATCH };

  for (const key of Object.keys(DEFAULT_SHD_WATCH)) {
    const value = raw[key];
    if (typeof value === "number" && isFinite(value) && value >= 0) {
      (watch as Record<string, number>)[key] = value;
    } else if (value !== undefined) {
      warnings.push(`SHD Watch "${key}" had invalid value. Reset to 0.`);
    }
  }

  return watch;
}

/** Create a completely empty build with defaults */
function createEmptyBuild(dataVersion: string): IBuild {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Imported Build",
    description: "",
    gear: {},
    weapons: { primary: null, secondary: null, sidearm: null },
    skills: { skill1: null, skill2: null },
    specialization: null,
    shdWatch: { ...DEFAULT_SHD_WATCH },
    createdAt: now,
    updatedAt: now,
    dataVersion,
  };
}
