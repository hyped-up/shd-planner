// Re-export all game entity types

export type {
  GearSlot,
  WeaponSlot,
  WeaponType,
  CoreAttributeType,
  AttributeCategory,
  SkillCategory,
  SpecializationType,
  TalentSlot,
  DamageType,
} from "./enums";

export type {
  IBrandBonus,
  IBrandSet,
  IGearSetBonus,
  IGearSetTalent,
  IGearSet,
  INamedItem,
  IGearTalent,
  IGearAttribute,
} from "./gear";

export type {
  IWeapon,
  IWeaponTalent,
  IWeaponMod,
} from "./weapons";

export type {
  ISkillVariant,
  ISkill,
  ISkillMod,
  ISpecializationPassive,
  ISpecialization,
} from "./skills";

export type {
  IExoticTalent,
  IExoticGear,
  IExoticWeapon,
} from "./exotics";

export type {
  IBuildGearPiece,
  IBuildWeapon,
  IBuildSkill,
  ISHDWatchConfig,
  IBuild,
  IBuildStats,
  IValidationError,
  IValidationResult,
} from "./build";
