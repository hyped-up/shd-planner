// Zod v4 validation schemas for user build import/URL decode

import { z } from "zod";

// --- Enum schemas for build validation ---

// Gear slot values
const gearSlotSchema = z.enum(["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"]);

// Weapon slot values
const weaponSlotSchema = z.enum(["primary", "secondary", "sidearm"]);

// Core attribute type values
const coreAttributeTypeSchema = z.enum(["weaponDamage", "armor", "skillTier"]);

// Specialization type values
const specializationTypeSchema = z.enum([
  "Survivalist",
  "Demolitionist",
  "Sharpshooter",
  "Gunner",
  "Technician",
  "Firewall",
]);

// Skill slot values
const skillSlotSchema = z.enum(["skill1", "skill2"]);

// --- Build piece schemas ---

// Gear piece schema (one of 6 armor slots in a build)
export const zodBuildGearPiece = z.object({
  slotId: gearSlotSchema,
  source: z.enum(["brand", "gearset", "named", "exotic"]),
  itemId: z.string(),
  coreAttribute: z.object({
    type: coreAttributeTypeSchema,
    value: z.number(),
  }),
  minorAttributes: z.array(
    z.object({
      attributeId: z.string(),
      value: z.number(),
    })
  ),
  modSlot: z
    .object({
      modId: z.string(),
      value: z.number(),
    })
    .nullable(),
  talent: z
    .object({
      talentId: z.string(),
    })
    .nullable(),
});

// Weapon schema (primary, secondary, or sidearm)
export const zodBuildWeapon = z.object({
  slotId: weaponSlotSchema,
  weaponId: z.string(),
  talent: z.object({
    talentId: z.string(),
  }),
  mods: z.object({
    optic: z.string().optional(),
    magazine: z.string().optional(),
    muzzle: z.string().optional(),
    underbarrel: z.string().optional(),
  }),
});

// Skill schema (skill1 or skill2)
export const zodBuildSkill = z.object({
  slotId: skillSlotSchema,
  skillVariantId: z.string(),
  mods: z.array(z.string()),
});

// SHD Watch configuration schema
export const zodSHDWatchConfig = z.object({
  weaponDamage: z.number(),
  armor: z.number(),
  skillTier: z.number(),
  criticalHitChance: z.number(),
  criticalHitDamage: z.number(),
  headshotDamage: z.number(),
  health: z.number(),
});

// Complete build schema for import validation
export const zodBuild = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  gear: z.record(gearSlotSchema, zodBuildGearPiece).optional(),
  weapons: z.object({
    primary: zodBuildWeapon.nullable(),
    secondary: zodBuildWeapon.nullable(),
    sidearm: zodBuildWeapon.nullable(),
  }),
  skills: z.object({
    skill1: zodBuildSkill.nullable(),
    skill2: zodBuildSkill.nullable(),
  }),
  specialization: specializationTypeSchema.nullable(),
  shdWatch: zodSHDWatchConfig,
  createdAt: z.string(),
  updatedAt: z.string(),
  dataVersion: z.string(),
});
