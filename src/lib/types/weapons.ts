// Weapon-related interfaces: weapons, weapon talents, weapon mods

import type { DamageType, WeaponType } from "./enums";

/** Weapon archetype or specific weapon definition */
export interface IWeapon {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  type: WeaponType;
  rpm: number;
  magSize: number;
  reloadSpeed: number;
  baseDamage: number;
  nativeAttribute: string;
  modSlots: string[];
  _verified: boolean;
  _sources: string[];
}

/** Weapon talent (e.g., Ranger, Optimist, Strained) */
export interface IWeaponTalent {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  description: string;
  weaponTypeRestrictions: WeaponType[];
  damageType?: DamageType;
  values?: Record<string, number>;
  _verified: boolean;
  _sources: string[];
}

/** Weapon mod attachment (optic, magazine, muzzle, underbarrel) */
export interface IWeaponMod {
  id: string;
  name: string;
  slot: string;
  stats: Record<string, number>;
}
