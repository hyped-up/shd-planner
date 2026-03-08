// Skill and specialization interfaces

import type { SkillCategory, SpecializationType } from "./enums";

/** Individual skill variant (e.g., Striker Drone, Assault Turret) */
export interface ISkillVariant {
  id: string;
  name: string;
  description: string;
  baseStats: Record<string, number>;
  tierScaling: Record<string, number[]>;
}

/** Skill family with all variants */
export interface ISkill {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  category: SkillCategory;
  variants: ISkillVariant[];
  _verified: boolean;
  _sources: string[];
}

/** Skill mod that boosts a specific stat */
export interface ISkillMod {
  id: string;
  name: string;
  skillId: string;
  stat: string;
  value: number;
}

/** Specialization passive perk */
export interface ISpecializationPassive {
  name: string;
  description: string;
  value?: number;
}

/** Agent specialization tree (e.g., Sharpshooter, Technician) */
export interface ISpecialization {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  type: SpecializationType;
  signatureWeapon: string;
  passives: ISpecializationPassive[];
  bonusSkillTier?: number;
  _verified: boolean;
  _sources: string[];
}
