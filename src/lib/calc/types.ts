/**
 * Types for the stat calculation engine.
 * Re-exports enums from @/lib/types/enums and defines calc-specific interfaces.
 */

// Re-export enum types from the shared enums module
export type {
  GearSlot,
  WeaponSlot,
  WeaponType,
  CoreAttributeType,
  DamageType,
  SpecializationType,
  TalentSlot,
  AttributeCategory,
  SkillCategory,
} from "@/lib/types/enums";

// Import the types locally for use in interface definitions
import type {
  GearSlot,
  WeaponSlot,
  WeaponType,
  CoreAttributeType,
  SpecializationType,
} from "@/lib/types/enums";

// ---------------------------------------------------------------------------
// Brand & Gear Set bonus interfaces
// ---------------------------------------------------------------------------

/** A single brand set bonus entry (e.g., +15% LMG Damage) */
export interface IBrandBonus {
  stat: string;
  value: number;
  unit: string; // "%" or "flat"
}

/** A single gear set bonus entry (2pc, 3pc, 4pc description) */
export interface IGearSetBonus {
  description: string;
  stat?: string;
  value?: number;
}

// ---------------------------------------------------------------------------
// Build composition interfaces
// ---------------------------------------------------------------------------

/** A single gear piece equipped in a build */
export interface IBuildGearPiece {
  slotId: GearSlot;
  source: "brand" | "gearset" | "named" | "exotic";
  itemId: string;
  coreAttribute: {
    type: CoreAttributeType;
    value: number;
  };
  minorAttributes: Array<{
    attributeId: string;
    value: number;
  }>;
  modSlot: {
    modId: string;
    value: number;
  } | null;
  talent: {
    talentId: string;
  } | null;
}

/** A weapon equipped in a build */
export interface IBuildWeapon {
  slotId: WeaponSlot;
  weaponId: string;
  talent: {
    talentId: string;
  };
  mods: {
    optic?: string;
    magazine?: string;
    muzzle?: string;
    underbarrel?: string;
  };
}

/** A skill equipped in a build */
export interface IBuildSkill {
  slotId: "skill1" | "skill2";
  skillVariantId: string;
  mods: string[];
}

/** SHD Watch configuration (levels 1-1000 distribute points) */
export interface ISHDWatchConfig {
  weaponDamage: number;
  armor: number;
  skillTier: number;
  criticalHitChance: number;
  criticalHitDamage: number;
  headshotDamage: number;
  health: number;
}

/** A complete agent build */
export interface IBuild {
  id: string;
  name: string;
  description: string;
  gear: Partial<Record<GearSlot, IBuildGearPiece>>;
  weapons: {
    primary: IBuildWeapon | null;
    secondary: IBuildWeapon | null;
    sidearm: IBuildWeapon | null;
  };
  skills: {
    skill1: IBuildSkill | null;
    skill2: IBuildSkill | null;
  };
  specialization: SpecializationType | null;
  shdWatch: ISHDWatchConfig;
  createdAt: string;
  updatedAt: string;
  dataVersion: string;
}

// ---------------------------------------------------------------------------
// Aggregated build stats
// ---------------------------------------------------------------------------

/** Full aggregated stats computed from a build */
export interface IBuildStats {
  totalWeaponDamage: number;
  totalArmor: number;
  totalSkillTier: number;
  totalHealth: number;
  criticalHitChance: number;
  criticalHitDamage: number;
  headshotDamage: number;
  weaponHandlingBonus: number;
  skillDamage: number;
  repairSkills: number;
  skillHaste: number;
  skillDuration: number;
  hazardProtection: number;
  explosiveResistance: number;
  activeBrandBonuses: Array<{
    brandId: string;
    piecesEquipped: number;
    activeBonuses: IBrandBonus[];
  }>;
  activeGearSetBonuses: Array<{
    setId: string;
    piecesEquipped: number;
    activeBonuses: IGearSetBonus[];
  }>;
  activeTalents: Array<{
    talentId: string;
    source: string;
    description: string;
  }>;
  dps: {
    bodyshot: number;
    optimal: number;
    headshot: number;
  };
}

// ---------------------------------------------------------------------------
// Game entity interfaces (weapons, skills)
// ---------------------------------------------------------------------------

/** A weapon definition from the data layer */
export interface IWeapon {
  id: string;
  name: string;
  type: WeaponType;
  rpm: number;
  magSize: number;
  reloadSpeed: number;
  baseDamage: number;
  nativeAttribute: string;
  modSlots: string[];
}

/** A skill variant definition from the data layer */
export interface ISkillVariant {
  id: string;
  name: string;
  description: string;
  baseStats: Record<string, number>;
  tierScaling: Record<string, number[]>;
}

// ---------------------------------------------------------------------------
// Validation interfaces
// ---------------------------------------------------------------------------

/** A single validation issue */
export interface IValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

/** Result of build validation */
export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
}
