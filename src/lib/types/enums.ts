// Game enums derived from constants.ts values

/** Gear armor slot positions */
export type GearSlot = "Mask" | "Backpack" | "Chest" | "Gloves" | "Holster" | "Kneepads";

/** Weapon equip slots */
export type WeaponSlot = "primary" | "secondary" | "sidearm";

/** Weapon archetypes */
export type WeaponType =
  | "Assault Rifle"
  | "LMG"
  | "SMG"
  | "Rifle"
  | "Marksman Rifle"
  | "Shotgun"
  | "Pistol";

/** Core attribute categories (red/blue/yellow) */
export type CoreAttributeType = "weaponDamage" | "armor" | "skillTier";

/** Minor attribute categories */
export type AttributeCategory = "offensive" | "defensive" | "utility" | "skill";

/** Skill family categories */
export type SkillCategory =
  | "Chem Launcher"
  | "Drone"
  | "Firefly"
  | "Hive"
  | "Seeker Mine"
  | "Shield"
  | "Turret"
  | "Pulse"
  | "Trap";

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
