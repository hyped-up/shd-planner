/**
 * Sharing module types.
 * Re-exports build-related types from the canonical type definitions.
 */

export type {
  GearSlot,
  WeaponSlot,
  CoreAttributeType,
  SpecializationType,
} from "@/lib/types/enums";

export type {
  IBuildGearPiece,
  IBuildWeapon,
  IBuildSkill,
  ISHDWatchConfig,
  IBuild,
} from "@/lib/types/build";

/** Result of a build migration attempt */
export interface IMigrationResult {
  build: import("@/lib/types/build").IBuild;
  warnings: string[];
}

/** Result of importing a build from JSON */
export interface IImportResult {
  build: import("@/lib/types/build").IBuild | null;
  errors: string[];
}

/** Compact build representation for URL encoding */
export interface ICompactBuild {
  n: string; // name
  g: Record<string, unknown>; // gear
  w: Record<string, unknown>; // weapons
  s: Record<string, unknown>; // skills
  sp: string | null; // specialization
  sw: import("@/lib/types/build").ISHDWatchConfig; // shdWatch
  dv: string; // dataVersion
}
