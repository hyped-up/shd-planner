// Zod v4 validation schemas for all game data JSON files

import { z } from "zod";

// --- Shared enum schemas ---

// Gear slot enum schema
const gearSlotSchema = z.enum(["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"]);

// Weapon type enum schema
const weaponTypeSchema = z.enum([
  "Assault Rifle",
  "LMG",
  "SMG",
  "Rifle",
  "Marksman Rifle",
  "Shotgun",
  "Pistol",
]);

// Core attribute type enum schema
const coreAttributeTypeSchema = z.enum(["weaponDamage", "armor", "skillTier"]);

// Attribute category enum schema
const attributeCategorySchema = z.enum(["offensive", "defensive", "utility", "skill"]);

// Talent slot enum schema
const talentSlotSchema = z.enum(["chest", "backpack"]);

// Damage type enum schema
const damageTypeSchema = z.enum(["additive", "amplified"]);

// Skill category enum schema
const skillCategorySchema = z.enum([
  "Chem Launcher",
  "Drone",
  "Firefly",
  "Hive",
  "Seeker Mine",
  "Shield",
  "Turret",
  "Pulse",
  "Trap",
]);

// Specialization type enum schema
const specializationTypeSchema = z.enum([
  "Survivalist",
  "Demolitionist",
  "Sharpshooter",
  "Gunner",
  "Technician",
  "Firewall",
]);

// --- Data file verification fields (common to most entities) ---

const verificationFields = {
  _verified: z.boolean(),
  _sources: z.array(z.string()),
};

// --- Brand Set ---

// Brand bonus schema (e.g., "+15% weapon damage")
export const zodBrandBonus = z.object({
  stat: z.string(),
  value: z.number(),
  unit: z.string(),
});

// Brand set schema (e.g., Providence Defense)
export const zodBrandSet = z.object({
  id: z.string(),
  name: z.string(),
  slots: z.array(gearSlotSchema),
  coreAttribute: coreAttributeTypeSchema,
  bonuses: z.record(z.string(), zodBrandBonus),
  modSlot: z.boolean(),
  minorAttributes: z.number(),
  ...verificationFields,
});

// --- Gear Set ---

// Gear set bonus schema
const zodGearSetBonus = z.object({
  description: z.string(),
  stat: z.string().optional(),
  value: z.number().optional(),
});

// Gear set talent schema
const zodGearSetTalent = z.object({
  name: z.string(),
  description: z.string(),
});

// Gear set schema (e.g., Striker's Battlegear)
export const zodGearSet = z.object({
  id: z.string(),
  name: z.string(),
  pieces: z.array(gearSlotSchema),
  bonuses: z.record(z.string(), zodGearSetBonus),
  chestTalent: zodGearSetTalent.optional(),
  backpackTalent: zodGearSetTalent.optional(),
  ...verificationFields,
});

// --- Weapon ---

// Weapon schema
export const zodWeapon = z.object({
  id: z.string(),
  name: z.string(),
  type: weaponTypeSchema,
  rpm: z.number(),
  magSize: z.number(),
  reloadSpeed: z.number(),
  baseDamage: z.number(),
  nativeAttribute: z.string(),
  modSlots: z.array(z.string()),
  ...verificationFields,
});

// --- Weapon Talent ---

// Weapon talent schema (e.g., Ranger, Optimist)
export const zodWeaponTalent = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weaponTypeRestrictions: z.array(weaponTypeSchema),
  damageType: damageTypeSchema.optional(),
  values: z.record(z.string(), z.number()).optional(),
  ...verificationFields,
});

// --- Gear Talent ---

// Gear talent schema (chest/backpack talents)
export const zodGearTalent = z.object({
  id: z.string(),
  name: z.string(),
  slot: talentSlotSchema,
  description: z.string(),
  isPerfect: z.boolean(),
  perfectVersion: z.string().optional(),
  namedItem: z.string().optional(),
  ...verificationFields,
});

// --- Gear Attribute ---

// Gear attribute schema
export const zodGearAttribute = z.object({
  id: z.string(),
  name: z.string(),
  maxValue: z.number(),
  unit: z.string(),
  category: attributeCategorySchema,
});

// --- Skill ---

// Skill variant schema (e.g., Striker Drone)
const zodSkillVariant = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  baseStats: z.record(z.string(), z.number()),
  tierScaling: z.record(z.string(), z.array(z.number())),
});

// Skill schema
export const zodSkill = z.object({
  id: z.string(),
  name: z.string(),
  category: skillCategorySchema,
  variants: z.array(zodSkillVariant),
  ...verificationFields,
});

// --- Exotic ---

// Exotic talent schema
const zodExoticTalent = z.object({
  name: z.string(),
  description: z.string(),
});

// Exotic gear schema (e.g., Coyote's Mask)
export const zodExoticGear = z.object({
  id: z.string(),
  name: z.string(),
  slot: gearSlotSchema,
  talent: zodExoticTalent,
  uniqueAttributes: z.array(z.record(z.string(), z.union([z.number(), z.string()]))),
  obtainMethod: z.string(),
  ...verificationFields,
});

// Exotic weapon schema (e.g., Eagle Bearer)
export const zodExoticWeapon = z.object({
  id: z.string(),
  name: z.string(),
  type: weaponTypeSchema,
  rpm: z.number(),
  magSize: z.number(),
  baseDamage: z.number(),
  talent: zodExoticTalent,
  obtainMethod: z.string(),
  ...verificationFields,
});

// --- Named Item ---

// Named item schema
export const zodNamedItem = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  slot: gearSlotSchema,
  perfectTalent: z.object({
    name: z.string(),
    description: z.string(),
  }),
  uniqueAttributes: z.array(z.string()),
  ...verificationFields,
});

// --- Specialization ---

// Specialization passive schema
const zodSpecializationPassive = z.object({
  name: z.string(),
  description: z.string(),
  value: z.number().optional(),
});

// Specialization schema (e.g., Sharpshooter)
export const zodSpecialization = z.object({
  id: z.string(),
  name: z.string(),
  type: specializationTypeSchema,
  signatureWeapon: z.string(),
  passives: z.array(zodSpecializationPassive),
  bonusSkillTier: z.number().optional(),
  ...verificationFields,
});
