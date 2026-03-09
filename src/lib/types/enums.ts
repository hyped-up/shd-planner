// Game enums derived from constants.ts values

/** Gear armor slot positions */
export type GearSlot = "Mask" | "Backpack" | "Chest" | "Gloves" | "Holster" | "Kneepads";

/** Weapon equip slots */
export type WeaponSlot = "primary" | "secondary" | "sidearm";

/** Weapon archetypes */
export type WeaponType =
  | "Assault Rifles"
  | "Submachine Guns"
  | "Light Machine Guns"
  | "Rifles"
  | "Marksman Rifles"
  | "Shotguns"
  | "Pistols";

/** Core attribute categories (red/blue/yellow) */
export type CoreAttributeType = "weaponDamage" | "armor" | "skillTier";

/** Attribute categories (core and minor) */
export type AttributeCategory =
  | "offensive" | "defensive" | "utility" | "skill"
  | "core_offensive" | "core_defensive" | "core_skill"
  | "minor_offensive" | "minor_defensive" | "minor_utility";

/** Skill family categories */
export type SkillCategory =
  | "Ballistic Shield"
  | "Chem Launcher"
  | "Decoy"
  | "Drone"
  | "Firefly"
  | "Hive"
  | "Pulse"
  | "Seeker Mine"
  | "Smart Cover"
  | "Sticky Bomb"
  | "Trap"
  | "Turret";

/** Agent specialization trees */
export type SpecializationType =
  | "Survivalist"
  | "Demolitionist"
  | "Sharpshooter"
  | "Gunner"
  | "Technician"
  | "Firewall";

/** Gear talent slots (only chest and backpack have talents) */
export type TalentSlot = "chest" | "backpack";

/** Damage bonus classification */
export type DamageType = "additive" | "amplified";
