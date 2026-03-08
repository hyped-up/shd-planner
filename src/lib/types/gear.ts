// Gear-related interfaces: brands, gear sets, named items, talents, attributes

import type { AttributeCategory, CoreAttributeType, GearSlot, TalentSlot } from "./enums";

/** Single brand set bonus (e.g., "+15% weapon damage") */
export interface IBrandBonus {
  stat: string;
  value: number;
  unit: string;
}

/** Brand set definition (e.g., Providence Defense, Grupo Sombra) */
export interface IBrandSet {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  slots: GearSlot[];
  coreAttribute: CoreAttributeType;
  bonuses: Record<string, IBrandBonus>;
  modSlot: boolean;
  minorAttributes: number;
  _verified: boolean;
  _sources: string[];
}

/** Gear set bonus at a piece threshold (e.g., "2-piece: +15% weapon damage") */
export interface IGearSetBonus {
  description: string;
  stat?: string;
  value?: number;
}

/** Gear set chest/backpack talent */
export interface IGearSetTalent {
  name: string;
  description: string;
}

/** Gear set definition (e.g., Striker's Battlegear, True Patriot) */
export interface IGearSet {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  pieces: GearSlot[];
  bonuses: Record<string, IGearSetBonus>;
  chestTalent?: IGearSetTalent;
  backpackTalent?: IGearSetTalent;
  _verified: boolean;
  _sources: string[];
}

/** Named item with perfect talent and unique attributes */
export interface INamedItem {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  brand: string;
  slot: GearSlot;
  perfectTalent: { name: string; description: string };
  uniqueAttributes: string[];
  _verified: boolean;
  _sources: string[];
}

/** Gear talent (chest or backpack) */
export interface IGearTalent {
  id: string;
  name: string;
  /** Optional icon image path (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  slot: TalentSlot;
  description: string;
  isPerfect: boolean;
  perfectVersion?: string;
  namedItem?: string;
  _verified: boolean;
  _sources: string[];
}

/** Gear minor attribute definition with max roll value */
export interface IGearAttribute {
  id: string;
  name: string;
  maxValue: number;
  unit: string;
  category: AttributeCategory;
}
