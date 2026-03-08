// Exotic gear and weapon interfaces

import type { GearSlot, WeaponType } from "./enums";

/** Exotic talent with unique named effect */
export interface IExoticTalent {
  name: string;
  description: string;
}

/** Exotic gear piece (e.g., Coyote's Mask, Tardigrade) */
export interface IExoticGear {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  slot: GearSlot;
  talent: IExoticTalent;
  uniqueAttributes: Record<string, number | string>[];
  obtainMethod: string;
  _verified: boolean;
  _sources: string[];
}

/** Exotic weapon (e.g., Eagle Bearer, Bullet King) */
export interface IExoticWeapon {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  type: WeaponType;
  rpm: number;
  magSize: number;
  baseDamage: number;
  talent: IExoticTalent;
  obtainMethod: string;
  _verified: boolean;
  _sources: string[];
}
