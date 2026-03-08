// Build model — the core data structure for saved agent loadouts

import type { CoreAttributeType, GearSlot, SpecializationType, WeaponSlot } from "./enums";
import type { IBrandBonus, IGearSetBonus } from "./gear";

/** Single gear piece in a build with attributes, mod, and talent */
export interface IBuildGearPiece {
  slotId: GearSlot;
  source: "brand" | "gearset" | "named" | "exotic";
  itemId: string;
  coreAttribute: { type: CoreAttributeType; value: number };
  minorAttributes: Array<{ attributeId: string; value: number }>;
  modSlot: { modId: string; value: number } | null;
  talent: { talentId: string } | null;
}

/** Weapon equipped in a build slot */
export interface IBuildWeapon {
  slotId: WeaponSlot;
  weaponId: string;
  talent: { talentId: string };
  mods: {
    optic?: string;
    magazine?: string;
    muzzle?: string;
    underbarrel?: string;
  };
}

/** Skill equipped in a build slot */
export interface IBuildSkill {
  slotId: "skill1" | "skill2";
  skillVariantId: string;
  mods: string[];
}

/** SHD Watch bonus allocation (levels 1-1000) */
export interface ISHDWatchConfig {
  weaponDamage: number;
  armor: number;
  skillTier: number;
  criticalHitChance: number;
  criticalHitDamage: number;
  headshotDamage: number;
  health: number;
}

/** Complete agent build definition */
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

/** Computed build statistics and totals */
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

/** Single validation error for a build field */
export interface IValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

/** Result of validating a build */
export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
}
