#!/usr/bin/env npx tsx
/**
 * normalize-and-merge.ts
 *
 * Main data pipeline script for SHD Planner.
 * Reads raw scraped data from src/scripts/scrapers/raw/*.json,
 * normalizes IDs, merges sources, and outputs canonical JSON files to src/data/.
 * If no raw data exists, generates comprehensive seed data with known Division 2 values.
 *
 * Usage: npx tsx src/scripts/transforms/normalize-and-merge.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// --- Path constants (env-var-driven for Docker, fallback for dev) ---
// Support both CJS (__dirname) and ESM (import.meta.url) for compiled output
const __dirnameCompat = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirnameCompat, "../../..");
const RAW_DIR = process.env.RAW_DIR ?? path.join(ROOT, "src/scripts/scrapers/raw");
const DATA_DIR = process.env.DATA_DIR ?? path.join(ROOT, "src/data");

// --- Utility functions ---

/** Generate a stable slug from a name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Read a raw JSON file if it exists */
function readRawFile(filename: string): unknown | null {
  const filePath = path.join(RAW_DIR, filename);
  if (fs.existsSync(filePath)) {
    console.log(`  [raw] Reading ${filename}`);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

/** Write a canonical JSON file to data directory */
function writeDataFile(filename: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  [out] Wrote ${filename}`);
}

/** Count entities in an array or object */
function countEntities(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object" && data !== null) return Object.keys(data).length;
  return 0;
}

// --- Type definitions for output data ---

interface BrandSet {
  id: string;
  name: string;
  bonuses: { "1pc": string; "2pc": string; "3pc": string };
  availableSlots: string[];
  coreFocus: string;
}

interface GearSet {
  id: string;
  name: string;
  abbreviation: string;
  bonuses: {
    "2pc": string;
    "3pc": string;
    "4pc": { name: string; description: string };
  };
  chestTalent: { name: string; description: string };
  backpackTalent: { name: string; description: string };
  gearSlots: string[];
}

interface NamedItem {
  id: string;
  name: string;
  brandId: string;
  slot: string;
  coreAttribute: string;
  fixedAttribute: string;
  metaRating: string;
}

interface ExoticGear {
  id: string;
  name: string;
  slot: string;
  uniqueTalent: { name: string; description: string };
  coreAttribute: string;
  metaRating: string;
}

interface ExoticWeapon {
  id: string;
  name: string;
  category: string;
  uniqueTalent: { name: string; description: string };
  coreAttribute: string;
  metaRating: string;
}

interface WeaponArchetype {
  id: string;
  name: string;
  type: string;
  rpm: number;
  magazine: number;
  reloadSeconds: number;
  optimalRangeMeters: number;
  variants: string[];
  namedVariant: string | null;
  exoticVariant: string | null;
  metaTier: string;
}

interface WeaponType {
  id: string;
  class: string;
  coreBonus: string;
  archetypes: WeaponArchetype[];
}

interface Talent {
  id: string;
  name: string;
  slot: string;
  description: string;
  perfectVersion: { name: string; description: string; foundOn: string } | null;
  metaRating: string;
}

interface WeaponTalent {
  id: string;
  name: string;
  weaponTypes: string[];
  description: string;
  perfectVersion: { name: string; description: string; foundOn: string } | null;
  metaRating: string;
}

interface SkillVariant {
  id: string;
  name: string;
  damageType: string;
  scaling: string;
  cooldownRange: { tier0: number; tier6: number };
  durationRange: { tier0: number | null; tier6: number | null };
  mods: string[];
  bestFor: string[];
  notes: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  variants: SkillVariant[];
}

interface Specialization {
  id: string;
  name: string;
  signatureWeapon: { name: string; description: string };
  uniqueSkill: string;
  grenade: string;
  keyPassives: string[];
  bonusSkillTier: boolean;
  weaponDamageBonus: string;
  bestFor: string[];
}

interface GearAttribute {
  id: string;
  stat: string;
  label: string;
  maxRoll: number | null;
  unit: string;
  category: string;
  description: string;
}

interface SHDWatchCategory {
  id: string;
  name: string;
  maxLevel: number;
  bonuses: { stat: string; perLevel: number; maxBonus: number }[];
}

// --- Seed data generators ---

function generateBrandSets(): BrandSet[] {
  const brands: Array<[string, string, { "1pc": string; "2pc": string; "3pc": string }, string[], string]> = [
    ["Providence Defense", "Providence Defense", { "1pc": "+13% Headshot Damage", "2pc": "+8% Critical Hit Chance", "3pc": "+13% Critical Hit Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Ceska Vyroba S.R.O.", "\u010cesk\u00e1 V\u00fdroba S.R.O.", { "1pc": "+8% Critical Hit Chance", "2pc": "+20% Hazard Protection", "3pc": "+90% Health" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Walker Harris & Co.", "Walker, Harris & Co.", { "1pc": "+5% Weapon Damage", "2pc": "+5% Damage to Armor", "3pc": "+10% Damage to Health" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Sokolov Concern", "Sokolov Concern", { "1pc": "+10% SMG Damage", "2pc": "+13% Critical Hit Damage", "3pc": "+8% Critical Hit Chance" }, ["mask", "chest", "kneepads"], "dps"],
    ["Grupo Sombra S.A.", "Grupo Sombra S.A.", { "1pc": "+13% Critical Hit Damage", "2pc": "+20% Explosives Damage", "3pc": "+13% Headshot Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Fenris Group AB", "Fenris Group AB", { "1pc": "+10% Assault Rifle Damage", "2pc": "+30% Reload Speed", "3pc": "+50% Stability" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Petrov Defense Group", "Petrov Defense Group", { "1pc": "+10% LMG Damage", "2pc": "+10% Weapon Handling", "3pc": "+20% Ammo Capacity" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Overlord Armaments", "Overlord Armaments", { "1pc": "+10% Rifle Damage", "2pc": "+20% Accuracy", "3pc": "+10% Weapon Handling" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Douglas & Harding", "Douglas & Harding", { "1pc": "+20% Pistol Damage", "2pc": "+30% Stability", "3pc": "+50% Accuracy" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Murakami Industries", "Murakami Industries", { "1pc": "+15% Skill Duration", "2pc": "+35% Skill Repair", "3pc": "+18% Skill Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "skill"],
    ["Gila Guard", "Gila Guard", { "1pc": "+5% Total Armor", "2pc": "+60% Health", "3pc": "+2% Armor Regeneration" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "tank"],
    ["Badger Tuff", "Badger Tuff", { "1pc": "+10% Shotgun Damage", "2pc": "+5% Total Armor", "3pc": "+15% Armor on Kill" }, ["mask", "backpack", "gloves"], "dps"],
    ["5.11 Tactical", "5.11 Tactical", { "1pc": "+30% Health", "2pc": "+30% Incoming Repairs", "3pc": "+30% Hazard Protection" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "tank"],
    ["Alps Summit Armament", "Alps Summit Armament", { "1pc": "+18% Skill Repair", "2pc": "+30% Skill Duration", "3pc": "+30% Skill Haste" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "skill"],
    ["Hana-U Corporation", "Hana-U Corporation", { "1pc": "+10% Skill Haste", "2pc": "+10% Skill Damage", "3pc": "+15% Weapon Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "hybrid"],
    ["Wyvern Wear", "Wyvern Wear", { "1pc": "+8% Skill Damage", "2pc": "+18% Status Effects", "3pc": "+45% Skill Duration" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "skill"],
    ["Belstone Armory", "Belstone Armory", { "1pc": "+1% Armor Regen", "2pc": "+10% Armor on Kill", "3pc": "+45% Incoming Repairs" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "tank"],
    ["Empress International", "Empress International", { "1pc": "+10% Skill Health", "2pc": "+10% Skill Damage", "3pc": "+8% Skill Efficiency" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "skill"],
    ["Brazos de Arcabuz", "Brazos de Arcabuz", { "1pc": "+10% Skill Haste", "2pc": "+1 Skill Tier", "3pc": "+50% Magazine Size" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "hybrid"],
    ["Uzina Getica", "Uzina Getica", { "1pc": "+5% Armor", "2pc": "+10% Armor on Kill", "3pc": "+30% Hazard Protection" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "tank"],
    ["Lengmo", "Lengmo", { "1pc": "+20% Explosive Resistance", "2pc": "+20% Skill Health", "3pc": "+30% LMG Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Airaldi Holdings", "Airaldi Holdings", { "1pc": "+10% Marksman Rifle Damage", "2pc": "+13% Headshot Damage", "3pc": "+5% Damage to Armor" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["China Light Industries", "China Light Industries Corporation", { "1pc": "+15% Explosive Damage", "2pc": "+20% Skill Haste", "3pc": "+25% Status Effects" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "skill"],
    ["Golan Gear", "Golan Gear Ltd.", { "1pc": "+10% Status Effects", "2pc": "+1.5% Armor Regeneration", "3pc": "+10% Total Armor" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "hybrid"],
    ["Richter & Kaiser", "Richter & Kaiser GmbH", { "1pc": "+15% Extra Incoming Repairs", "2pc": "+25% Explosive Resistance", "3pc": "+40% Skill Repair" }, ["mask", "backpack", "holster"], "skill"],
    ["Yaahl Gear", "Yaahl Gear", { "1pc": "+10% Hazard Protection", "2pc": "+10% Weapon Damage", "3pc": "+40% Pulse Resistance" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "utility"],
    ["Palisade Steelworks", "Palisade Steelworks", { "1pc": "+10% Armor on Kill", "2pc": "+60% Health", "3pc": "+1 Skill Tier" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "hybrid"],
    ["Electrique", "Electrique", { "1pc": "+10% Status Effects", "2pc": "+20% Shock Resistance", "3pc": "+30% SMG Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Imminence Armaments", "Imminence Armaments", { "1pc": "+5% Weapon Damage", "2pc": "+100% Increased Threat", "3pc": "+60% Pistol Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "tank"],
    ["Legatus S.p.A.", "Legatus S.p.A.", { "1pc": "+30% Swap Speed", "2pc": "+70% Optimal Range", "3pc": "+15% Weapon Damage" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Habsburg Guard", "Habsburg Guard", { "1pc": "+13% Headshot Damage", "2pc": "+20% Marksman Rifle Damage", "3pc": "+25% Status Effects" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
    ["Shiny Monkey Gear", "Shiny Monkey Gear", { "1pc": "+15% Skill Duration", "2pc": "+5% Skill Efficiency", "3pc": "+52% Repair Skills" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "skill"],
    ["Zwiadowka", "Zwiadowka SP. z o.o.", { "1pc": "+15% Magazine Size", "2pc": "+20% Rifle Damage", "3pc": "+30% Weapon Handling" }, ["mask", "backpack", "chest", "gloves", "kneepads", "holster"], "dps"],
  ];

  return brands.map(([shortName, fullName, bonuses, slots, focus]) => ({
    id: `brand-${slugify(shortName)}`,
    name: fullName,
    bonuses,
    availableSlots: slots,
    coreFocus: focus,
  }));
}

function generateGearSets(): GearSet[] {
  const sets: GearSet[] = [
    {
      id: "gearset-strikers-battlegear", name: "Striker's Battlegear", abbreviation: "SB",
      bonuses: { "2pc": "+15% Weapon Handling", "3pc": "+15% Rate of Fire", "4pc": { name: "Striker's Gamble", description: "Weapon hits increase total weapon damage by 0.65%, stacking up to 100 times." } },
      chestTalent: { name: "Press the Advantage", description: "Increases max stacks from 100 to 200." },
      backpackTalent: { name: "Risk Management", description: "Increases weapon damage per stack from 0.65% to 1%." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-hunters-fury", name: "Hunter's Fury", abbreviation: "HF",
      bonuses: { "2pc": "+15% SMG Damage, +15% Shotgun Damage", "3pc": "+20% Armor on Kill", "4pc": { name: "Apex Predator", description: "Killing an enemy with an SMG or shotgun disorients all enemies within 5m and grants bonus armor for 10s." } },
      chestTalent: { name: "Hunter Killer", description: "Increases Apex Predator disorient range to 10m and duration to 15s." },
      backpackTalent: { name: "Overwhelming Force", description: "Apex Predator now applies 10% armor disruption debuff on disoriented enemies." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-heartbreaker", name: "Heartbreaker", abbreviation: "HB",
      bonuses: { "2pc": "+15% Body Shot Damage", "3pc": "+100% Bonus Armor", "4pc": { name: "Heartstopper", description: "Each body shot hit adds a stack. At 50 stacks, gain maximum weapon damage bonus based on your total bonus armor." } },
      chestTalent: { name: "Decisive Strike", description: "Headshot kills grant 5 stacks. Stacks cap increased to 100." },
      backpackTalent: { name: "Vital Signs", description: "Each stack additionally repairs 0.2% armor." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-eclipse-protocol", name: "Eclipse Protocol", abbreviation: "EP",
      bonuses: { "2pc": "+15% Status Effects", "3pc": "+15% Skill Haste, +30% Hazard Protection", "4pc": { name: "Indirect Transmission", description: "Status effects spread on kill to all enemies within 10m, refreshing 50% duration." } },
      chestTalent: { name: "Proliferation", description: "Increases spread range to 15m and duration refresh to 75%." },
      backpackTalent: { name: "Symptom Aggravator", description: "Amplifies all damage dealt to status-affected targets by 30%." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-future-initiative", name: "Future Initiative", abbreviation: "FI",
      bonuses: { "2pc": "+30% Repair Skills", "3pc": "+15% Skill Duration", "4pc": { name: "Ground Control", description: "When at full armor, increases total weapon and skill damage by 15% for all allies." } },
      chestTalent: { name: "Strategic Alignment", description: "Allies also gain +15% armor repair from all sources." },
      backpackTalent: { name: "Resupply", description: "Ground Control buff persists for 10s after losing full armor." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-true-patriot", name: "True Patriot", abbreviation: "TP",
      bonuses: { "2pc": "+10% Damage to Armor", "3pc": "+8% Damage to Health", "4pc": { name: "Full Flag", description: "Shooting an enemy cycles through red/white/blue debuffs. Red = 8% damage from all sources. White = repairs allies. Blue = damage dealt to flagged enemies restores your armor." } },
      chestTalent: { name: "Red White & Blue", description: "All three debuffs can be active simultaneously on the same target." },
      backpackTalent: { name: "Waving the Flag", description: "Increases each debuff effect by 50%." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-negotiators-dilemma", name: "Negotiator's Dilemma", abbreviation: "ND",
      bonuses: { "2pc": "+15% Critical Hit Chance", "3pc": "+15% Critical Hit Damage", "4pc": { name: "Hostile Negotiations", description: "Critical hits mark enemies. Killing a marked enemy detonates all other marks, dealing 60% of the damage dealt." } },
      chestTalent: { name: "Loaded for Bear", description: "Marks can now be applied by any hit, not just critical hits." },
      backpackTalent: { name: "Trade-Off", description: "Mark detonation damage increased to 100% of damage dealt." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-foundry-bulwark", name: "Foundry Bulwark", abbreviation: "FB",
      bonuses: { "2pc": "+10% Total Armor", "3pc": "+1% Armor Regeneration", "4pc": { name: "Makeshift Repairs", description: "While your shield is active, 50% of the damage dealt to your shield is repaired over 15 seconds to your armor." } },
      chestTalent: { name: "Process Refinery", description: "Increases Makeshift Repairs percentage from 50% to 80%." },
      backpackTalent: { name: "Improved Materials", description: "Shield health is increased by 10% of your total armor." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-hard-wired", name: "Hard Wired", abbreviation: "HW",
      bonuses: { "2pc": "+15% Skill Health", "3pc": "+15% Skill Damage", "4pc": { name: "Feedback Loop", description: "Using a skill resets the cooldown of your other skill. Can only trigger once every 20 seconds." } },
      chestTalent: { name: "Tamper Proof (Set)", description: "Enemies that damage your skills are shocked." },
      backpackTalent: { name: "Short Circuit", description: "Feedback Loop cooldown reduced from 20s to 10s." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-ongoing-directive", name: "Ongoing Directive", abbreviation: "OD",
      bonuses: { "2pc": "+15% Status Effects", "3pc": "+30% Kill Confirmed XP", "4pc": { name: "Trauma Specialist", description: "Killing status-affected enemies grants special ammo that applies the killed enemy's status effect." } },
      chestTalent: { name: "Perfectly Wicked (Set)", description: "Applying a status effect increases weapon damage by 20%." },
      backpackTalent: { name: "Emergency Requisition", description: "Special ammo is shared with nearby allies." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-tip-of-the-spear", name: "Tip of the Spear", abbreviation: "TotS",
      bonuses: { "2pc": "+15% Signature Weapon Damage", "3pc": "+20% Skill Damage", "4pc": { name: "Aggressive Recon", description: "Signature weapon kills grant 20% weapon damage and skill damage to all allies for 60s." } },
      chestTalent: { name: "Vanguard Overwatch", description: "Aggressive Recon effect doubled for the user." },
      backpackTalent: { name: "Signature Move", description: "Signature weapon ammo is regenerated on headshot kills." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-aces-and-eights", name: "Aces & Eights", abbreviation: "A&8",
      bonuses: { "2pc": "+30% Headshot Damage", "3pc": "+20% Marksman Rifle Damage", "4pc": { name: "Dead Man's Hand", description: "Shooting flips a card. 4 cards drawn grants a damage buff based on the poker hand." } },
      chestTalent: { name: "Poker Face", description: "All damage buffs from Dead Man's Hand are increased by 30%." },
      backpackTalent: { name: "Ace in the Hole", description: "Drawing an Ace guarantees a full house or better." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-rigger", name: "Rigger", abbreviation: "RIG",
      bonuses: { "2pc": "+15% Skill Health", "3pc": "+15% Skill Damage", "4pc": { name: "Repair-Link", description: "Deployed skills repair to full over 10s when reaching 10% health. Cooldown: 45s." } },
      chestTalent: { name: "Linked Repair", description: "Both skills benefit from Repair-Link simultaneously." },
      backpackTalent: { name: "Skilled Tech", description: "Repair-Link cooldown reduced to 25s." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-umbra", name: "Umbra", abbreviation: "UMB",
      bonuses: { "2pc": "+15% Weapon Damage", "3pc": "+15% Critical Hit Damage", "4pc": { name: "Shadow Stance", description: "Entering cover grants stacking damage bonus. Moving between cover points increases stacks." } },
      chestTalent: { name: "Deepening Shadows", description: "Shadow Stance stacks build 50% faster." },
      backpackTalent: { name: "Lingering Shade", description: "Shadow Stance persists for 5s after leaving cover." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-vanguard", name: "Vanguard (Set)", abbreviation: "VG",
      bonuses: { "2pc": "+10% Armor", "3pc": "+15% Incoming Repairs", "4pc": { name: "Forward Shield", description: "Deploying a shield grants bonus armor to all allies based on your total armor." } },
      chestTalent: { name: "Fortified Position", description: "Forward Shield bonus armor increased by 50%." },
      backpackTalent: { name: "Rallying Cry", description: "Forward Shield also grants weapon handling to allies." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-tidal-force", name: "Tidal Force", abbreviation: "TF",
      bonuses: { "2pc": "+15% Skill Damage", "3pc": "+15% Skill Haste", "4pc": { name: "Tidal Wave", description: "Skill kills create a chain reaction dealing skill damage to nearby enemies." } },
      chestTalent: { name: "Surging Tide", description: "Tidal Wave chain range increased to 15m." },
      backpackTalent: { name: "Undertow", description: "Tidal Wave also applies slow to affected enemies." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-mutiny", name: "Mutiny", abbreviation: "MUT",
      bonuses: { "2pc": "+15% Weapon Damage", "3pc": "+20% Armor on Kill", "4pc": { name: "Boarding Action", description: "Killing an enemy grants a stacking weapon damage buff. Each kill within 10m doubles the effect." } },
      chestTalent: { name: "Captain's Orders", description: "Boarding Action max stacks doubled." },
      backpackTalent: { name: "Plunder", description: "Boarding Action also restores armor on stack gain." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
    {
      id: "gearset-the-pact", name: "The Pact", abbreviation: "PACT",
      bonuses: { "2pc": "+15% Repair Skills", "3pc": "+15% Incoming Repairs", "4pc": { name: "Bound Together", description: "Repairing an ally creates a tether. While tethered, damage taken is split between both agents." } },
      chestTalent: { name: "Unbreakable Bond", description: "Tethered allies also share 50% of healing received." },
      backpackTalent: { name: "Covenant", description: "Tether range increased to 30m and duration to 20s." },
      gearSlots: ["mask", "backpack", "chest", "gloves", "holster", "kneepads"],
    },
  ];
  return sets;
}

function generateNamedItems(): NamedItem[] {
  return [
    { id: "named-the-sacrifice", name: "The Sacrifice", brandId: "brand-providence-defense", slot: "chest", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Glass Cannon: +30% Total Weapon Damage, +60% Incoming Damage", metaRating: "S" },
    { id: "named-the-gift", name: "The Gift", brandId: "brand-providence-defense", slot: "backpack", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Vigilance: +25% Weapon Damage, lost for 3s when taking damage", metaRating: "A" },
    { id: "named-foxs-prayer", name: "Fox's Prayer", brandId: "brand-overlord-armaments", slot: "kneepads", coreAttribute: "weapon_damage", fixedAttribute: "+8% Damage to Targets Out of Cover", metaRating: "S" },
    { id: "named-contractors-gloves", name: "Contractor's Gloves", brandId: "brand-petrov-defense-group", slot: "gloves", coreAttribute: "weapon_damage", fixedAttribute: "+8% Damage to Armor", metaRating: "S" },
    { id: "named-hollow-man", name: "Hollow Man", brandId: "brand-douglas-harding", slot: "mask", coreAttribute: "weapon_damage", fixedAttribute: "+8% Damage to Health", metaRating: "A" },
    { id: "named-chainkiller", name: "Chainkiller", brandId: "brand-walker-harris-co", slot: "chest", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Headhunter: +150% headshot damage to next shot after headshot kill", metaRating: "S" },
    { id: "named-coyotes-mask", name: "Coyote's Mask", brandId: "brand-providence-defense", slot: "mask", coreAttribute: "weapon_damage", fixedAttribute: "Pack Instincts: Group crit bonuses based on range", metaRating: "S" },
    { id: "named-nightwatcher", name: "Nightwatcher", brandId: "brand-gila-guard", slot: "mask", coreAttribute: "armor", fixedAttribute: "+100% Scanner Pulse Haste", metaRating: "A" },
    { id: "named-pointman", name: "Pointman", brandId: "brand-gila-guard", slot: "chest", coreAttribute: "armor", fixedAttribute: "Perfect Vanguard: shield grants +45% bonus armor to allies for 20s", metaRating: "A" },
    { id: "named-punch-drunk", name: "Punch Drunk", brandId: "brand-5-11-tactical", slot: "mask", coreAttribute: "weapon_damage", fixedAttribute: "+20% Headshot Damage", metaRating: "A" },
    { id: "named-liquid-engineer", name: "Liquid Engineer", brandId: "brand-belstone-armory", slot: "backpack", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Bloodsucker: +12% bonus armor per kill, max 10 stacks", metaRating: "A" },
    { id: "named-forge", name: "Forge", brandId: "brand-alps-summit-armament", slot: "holster", coreAttribute: "skill_tier", fixedAttribute: "+50% Shield Health", metaRating: "A" },
    { id: "named-firm-handshake", name: "Firm Handshake", brandId: "brand-sokolov-concern", slot: "gloves", coreAttribute: "weapon_damage", fixedAttribute: "+15% Status Effects", metaRating: "A" },
    { id: "named-battery-pack", name: "Battery Pack", brandId: "brand-empress-international", slot: "backpack", coreAttribute: "skill_tier", fixedAttribute: "Perfect Calculated: kills reduce skill cooldowns by 30%", metaRating: "A" },
    { id: "named-percussive-maintenance", name: "Percussive Maintenance", brandId: "brand-alps-summit-armament", slot: "backpack", coreAttribute: "skill_tier", fixedAttribute: "Perfect Tech Support: +25% skill damage for 27s on skill kills", metaRating: "A" },
    { id: "named-everyday-carrier", name: "Everyday Carrier", brandId: "brand-belstone-armory", slot: "chest", coreAttribute: "armor", fixedAttribute: "Perfectly Efficient: 75% chance to not consume armor kit", metaRating: "B" },
    { id: "named-picaros-holster", name: "Picaro's Holster", brandId: "brand-brazos-de-arcabuz", slot: "holster", coreAttribute: "weapon_damage", fixedAttribute: "+15% Weapon Damage", metaRating: "A" },
    { id: "named-closer", name: "Closer", brandId: "brand-uzina-getica", slot: "chest", coreAttribute: "armor", fixedAttribute: "Perfect Spotter: +20% damage to pulsed enemies", metaRating: "A" },
    { id: "named-matador", name: "Matador", brandId: "brand-walker-harris-co", slot: "backpack", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Adrenaline Rush: +23% bonus armor within 10m", metaRating: "A" },
    { id: "named-pristine-example", name: "Pristine Example", brandId: "brand-airaldi-holdings", slot: "chest", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Focus: +6% weapon damage per second scoped, up to 60%", metaRating: "A" },
    { id: "named-sawyers-kneepads", name: "Sawyer's Kneepads", brandId: "brand-providence-defense", slot: "kneepads", coreAttribute: "weapon_damage", fixedAttribute: "Standing still for 10s grants up to +30% weapon damage", metaRating: "A" },
    { id: "named-wicked-vixen", name: "Wicked Vixen", brandId: "brand-wyvern-wear", slot: "mask", coreAttribute: "skill_tier", fixedAttribute: "+20% Skill Duration", metaRating: "B" },
    { id: "named-force-kicker", name: "Force Kicker", brandId: "brand-fenris-group-ab", slot: "chest", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Overwatch: +12% Weapon Damage to allies in cover", metaRating: "B" },
    { id: "named-backbone", name: "Backbone", brandId: "brand-lengmo", slot: "backpack", coreAttribute: "weapon_damage", fixedAttribute: "Perfectly Unstoppable Force: +5% weapon damage per kill, max 7", metaRating: "B" },
    { id: "named-carpenter", name: "Carpenter", brandId: "brand-lengmo", slot: "chest", coreAttribute: "weapon_damage", fixedAttribute: "Perfectly Mad Bomber: grenade radius +75%, grenade kills refund", metaRating: "B" },
    { id: "named-emperors-guard", name: "Emperor's Guard", brandId: "brand-murakami-industries", slot: "kneepads", coreAttribute: "armor", fixedAttribute: "+1% Armor Regeneration", metaRating: "B" },
    { id: "named-claws-out", name: "Claws Out", brandId: "brand-ceska-vyroba-s-r-o", slot: "holster", coreAttribute: "weapon_damage", fixedAttribute: "+200% Melee Damage", metaRating: "C" },
    { id: "named-devils-due", name: "Devil's Due", brandId: "brand-badger-tuff", slot: "backpack", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Bloodsucker: +12% bonus armor per kill, max 6 stacks", metaRating: "B" },
    { id: "named-the-setup", name: "The Setup", brandId: "brand-uzina-getica", slot: "backpack", coreAttribute: "armor", fixedAttribute: "Perfectly Opportunistic: +15% amplified damage from shotguns/MMR", metaRating: "B" },
    { id: "named-motherly-love", name: "Motherly Love", brandId: "brand-alps-summit-armament", slot: "gloves", coreAttribute: "skill_tier", fixedAttribute: "+15% Skill Repair", metaRating: "B" },
    { id: "named-catharsis", name: "Catharsis", brandId: "brand-gila-guard", slot: "mask", coreAttribute: "armor", fixedAttribute: "At full armor, taking damage repairs 20% armor to allies within 20m", metaRating: "A" },
    { id: "named-chill-out", name: "Chill Out", brandId: "brand-gila-guard", slot: "mask", coreAttribute: "armor", fixedAttribute: "+100% Scanner Pulse Haste", metaRating: "B" },
    { id: "named-hermano", name: "Hermano", brandId: "brand-brazos-de-arcabuz", slot: "backpack", coreAttribute: "skill_tier", fixedAttribute: "Perfect Overclock: allies near skills gain 30% reload speed + CDR", metaRating: "B" },
    { id: "named-deathgrips", name: "Deathgrips", brandId: "brand-5-11-tactical", slot: "gloves", coreAttribute: "armor", fixedAttribute: "+10% Armor on Kill (DZ exclusive)", metaRating: "B" },
    { id: "named-the-closer", name: "The Closer", brandId: "brand-overlord-armaments", slot: "backpack", coreAttribute: "weapon_damage", fixedAttribute: "Perfect Adrenaline Rush: +23% bonus armor within 10m of 2+ hostiles", metaRating: "B" },
  ];
}

function generateExoticGear(): ExoticGear[] {
  return [
    { id: "exotic-coyotes-mask", name: "Coyote's Mask", slot: "mask", uniqueTalent: { name: "Pack Instincts", description: "You and all allies within 30m gain a bonus based on the distance of the last enemy you damaged. 0-15m: +25% CHD. 15-25m: +10% CHC and +10% CHD. 25m+: +10% CHC." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-vile-mask", name: "Vile", slot: "mask", uniqueTalent: { name: "Toxic Delivery", description: "Status effects applied by your skills deal 50% of the status effect damage as additional damage over 10s." }, coreAttribute: "skill_tier", metaRating: "A" },
    { id: "exotic-acostas-go-bag", name: "Acosta's Go-Bag", slot: "backpack", uniqueTalent: { name: "One in Hand", description: "Throwing a grenade grants Overcharge for 15s. Cooldown: 60s." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-memento", name: "Memento", slot: "backpack", uniqueTalent: { name: "Kill Confirmed", description: "Killing an enemy drops a trophy. Collecting trophies grants long/mid/short-term buffs to weapon damage, skill efficiency, and armor." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-tardigrade-armor", name: "Tardigrade Armor System", slot: "chest", uniqueTalent: { name: "Ablative Nano-Plating", description: "When an ally's armor is depleted, grants 80% bonus armor to all allies within 30m. Cooldown: 60s." }, coreAttribute: "armor", metaRating: "A" },
    { id: "exotic-glass-cannon-chest", name: "Ridgeway's Pride", slot: "chest", uniqueTalent: { name: "Bleed Out", description: "Enemies within 15m bleed. Bleeds on all enemies repair armor for the user." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-imperial-dynasty", name: "Imperial Dynasty", slot: "holster", uniqueTalent: { name: "Dragon's Gaze", description: "While in combat, applies burn to the closest enemy within 20m. Cooldown: 30s." }, coreAttribute: "weapon_damage", metaRating: "B" },
    { id: "exotic-sawyers-kneepads-exotic", name: "Sawyer's Kneepads", slot: "kneepads", uniqueTalent: { name: "Vantage Point", description: "Standing still for 10s grants multiplicative weapon damage bonus up to 30%." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-ninjabike-messenger-kneepads", name: "NinjaBike Messenger Kneepads", slot: "kneepads", uniqueTalent: { name: "Parkour", description: "Performing a cover-to-cover move or vault reloads your main weapon and grants bonus movement speed." }, coreAttribute: "weapon_damage", metaRating: "B" },
    { id: "exotic-btsu-datagloves", name: "BTSU Datagloves", slot: "gloves", uniqueTalent: { name: "Elemental Gadgetry", description: "Skills applying status effects gain +50% status effect damage and duration. Destroying an enemy's skill triggers Overcharge." }, coreAttribute: "skill_tier", metaRating: "A" },
    { id: "exotic-shocker-punch", name: "Shocker Punch", slot: "gloves", uniqueTalent: { name: "Feedback Circuit", description: "Melee attacks deal shock damage. While shocked, enemies take amplified damage." }, coreAttribute: "weapon_damage", metaRating: "B" },
  ];
}

function generateExoticWeapons(): ExoticWeapon[] {
  return [
    { id: "exotic-eagle-bearer", name: "Eagle Bearer", category: "Assault Rifle", uniqueTalent: { name: "Eagle's Strike / Tenacity", description: "Killing 5 enemies without reloading grants accuracy/stability buff. Tenacity delays 20-80% of damage taken, reduced by kills." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-st-elmos-engine", name: "St. Elmo's Engine", category: "Assault Rifle", uniqueTalent: { name: "Actum Est", description: "Hitting enemies builds stacks. At 100 stacks, next magazine is shock ammo." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-chameleon", name: "Chameleon", category: "Assault Rifle", uniqueTalent: { name: "Adaptive Instincts", description: "Hitting head/body/legs in streaks grants specific damage bonuses." }, coreAttribute: "weapon_damage", metaRating: "B" },
    { id: "exotic-capacitor", name: "Capacitor", category: "Assault Rifle", uniqueTalent: { name: "Capacitance", description: "Shots build stacks granting +1.5% skill damage each (max 40). Skill cores grant +7.5% weapon damage each." }, coreAttribute: "skill_damage", metaRating: "A" },
    { id: "exotic-strega", name: "Strega", category: "Assault Rifle", uniqueTalent: { name: "Unnerve", description: "Kills mark enemies within 20m. Marks amplify weapon damage by +15% each, max 5 marks." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-lady-death", name: "Lady Death", category: "SMG", uniqueTalent: { name: "Breathe Free", description: "Walking builds stacks. Full stacks grant massive bonus damage and movement speed on next kill." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-the-chatterbox", name: "The Chatterbox", category: "SMG", uniqueTalent: { name: "Incessant Chatter", description: "Hits increase rate of fire up to 60%. Kills refill 20% magazine." }, coreAttribute: "weapon_damage", metaRating: "B" },
    { id: "exotic-backfire", name: "Backfire", category: "SMG", uniqueTalent: { name: "Blowback", description: "Critical hits stack crit damage up to +200%. Reloading consumes stacks and applies bleed to self." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-pestilence", name: "Pestilence", category: "LMG", uniqueTalent: { name: "Plague of the Outcasts", description: "Hitting enemies applies ticks of damage over time. Stacks transfer on kill." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-bullet-king", name: "Bullet King", category: "LMG", uniqueTalent: { name: "Bullet Hell", description: "Kills replenish magazine from reserves. Cannot reload manually." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-diamondback", name: "Diamondback", category: "Rifle", uniqueTalent: { name: "Agonize", description: "Random enemy is marked. Hits on marked enemies are guaranteed crits and deal +20% amplified damage." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-merciless", name: "Merciless", category: "Rifle", uniqueTalent: { name: "Binary Trigger", description: "Fires on pull and release. Stacks primers (5 max) that detonate for massive explosive damage." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-nemesis", name: "Nemesis", category: "Marksman Rifle", uniqueTalent: { name: "Nemesis", description: "Marks enemies on aim. Charging shot deals up to 0-100% additional damage based on charge time." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-sweet-dreams", name: "Sweet Dreams", category: "Shotgun", uniqueTalent: { name: "Sandman / Evasive", description: "Melee kills an enemy not in combat. Dodging after a kill grants 100% bonus armor." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-scorpio", name: "Scorpio", category: "Shotgun", uniqueTalent: { name: "Septic Shock", description: "Hits apply stacking status effects: poison, shock, disorient, and blind in sequence." }, coreAttribute: "weapon_damage", metaRating: "S" },
    { id: "exotic-liberty", name: "Liberty", category: "Pistol", uniqueTalent: { name: "Liberty", description: "Hitting weak points grants +100% damage to next shot. Destroying a weak point refills magazine." }, coreAttribute: "weapon_damage", metaRating: "A" },
    { id: "exotic-regulus", name: "Regulus", category: "Pistol", uniqueTalent: { name: "Regulus", description: "Headshot kills trigger an explosion dealing 400% weapon damage to nearby enemies." }, coreAttribute: "weapon_damage", metaRating: "S" },
  ];
}

function generateWeapons(): WeaponType[] {
  return [
    {
      id: "weapon-type-assault-rifle", class: "Assault Rifle", coreBonus: "Weapon Damage (Health Damage)",
      archetypes: [
        { id: "weapon-assault-rifle-p416", name: "POF P416", type: "Assault Rifle", rpm: 850, magazine: 30, reloadSeconds: 2.34, optimalRangeMeters: 26, variants: ["Military P416", "Custom P416 G3"], namedVariant: "Glory Daze", exoticVariant: "Eagle Bearer", metaTier: "S" },
        { id: "weapon-assault-rifle-m4", name: "M4", type: "Assault Rifle", rpm: 850, magazine: 30, reloadSeconds: 2.24, optimalRangeMeters: 31, variants: ["Police M4"], namedVariant: "Lexington", exoticVariant: null, metaTier: "A" },
        { id: "weapon-assault-rifle-famas", name: "FAMAS", type: "Assault Rifle", rpm: 900, magazine: 30, reloadSeconds: 2.3, optimalRangeMeters: 25, variants: ["FAMAS 2010"], namedVariant: "Railsplitter", exoticVariant: null, metaTier: "A" },
        { id: "weapon-assault-rifle-ak-m", name: "AK-M", type: "Assault Rifle", rpm: 600, magazine: 30, reloadSeconds: 2.5, optimalRangeMeters: 35, variants: ["AK-M", "Military AK-M"], namedVariant: null, exoticVariant: null, metaTier: "A" },
        { id: "weapon-assault-rifle-g36", name: "G36", type: "Assault Rifle", rpm: 750, magazine: 30, reloadSeconds: 2.34, optimalRangeMeters: 35, variants: ["Military G36", "G36C"], namedVariant: "Born Great", exoticVariant: null, metaTier: "A" },
      ],
    },
    {
      id: "weapon-type-smg", class: "SMG", coreBonus: "Critical Hit Chance",
      archetypes: [
        { id: "weapon-smg-mpx", name: "SIG MPX", type: "SMG", rpm: 850, magazine: 30, reloadSeconds: 2.09, optimalRangeMeters: 22, variants: ["MPX"], namedVariant: "The Apartment", exoticVariant: "Backfire", metaTier: "S" },
        { id: "weapon-smg-cmmg-banshee", name: "CMMG Banshee", type: "SMG", rpm: 900, magazine: 32, reloadSeconds: 1.92, optimalRangeMeters: 21, variants: ["CMMG Banshee"], namedVariant: "The Grudge", exoticVariant: "Lady Death", metaTier: "S" },
        { id: "weapon-smg-vector", name: "Vector", type: "SMG", rpm: 1200, magazine: 25, reloadSeconds: 1.9, optimalRangeMeters: 18, variants: ["Vector SBR .45"], namedVariant: "Dark Winter", exoticVariant: null, metaTier: "A" },
        { id: "weapon-smg-mp5", name: "MP5", type: "SMG", rpm: 800, magazine: 30, reloadSeconds: 2.1, optimalRangeMeters: 20, variants: ["Navy MP5 N"], namedVariant: null, exoticVariant: null, metaTier: "B" },
        { id: "weapon-smg-p90", name: "P90", type: "SMG", rpm: 1100, magazine: 50, reloadSeconds: 1.57, optimalRangeMeters: 21, variants: ["P90"], namedVariant: "Emeline's Guard", exoticVariant: "The Chatterbox", metaTier: "A" },
      ],
    },
    {
      id: "weapon-type-lmg", class: "LMG", coreBonus: "Damage to Targets out of Cover",
      archetypes: [
        { id: "weapon-lmg-m249", name: "M249 B", type: "LMG", rpm: 850, magazine: 100, reloadSeconds: 4.54, optimalRangeMeters: 35, variants: ["Military Mk46"], namedVariant: "Black Friday", exoticVariant: "Pestilence", metaTier: "S" },
        { id: "weapon-lmg-m60", name: "M60", type: "LMG", rpm: 600, magazine: 100, reloadSeconds: 3.75, optimalRangeMeters: 40, variants: ["Classic M60", "Military M60 E4"], namedVariant: "Good Times", exoticVariant: null, metaTier: "A" },
        { id: "weapon-lmg-mg5", name: "MG5", type: "LMG", rpm: 800, magazine: 50, reloadSeconds: 2.96, optimalRangeMeters: 35, variants: ["Infantry MG5"], namedVariant: "Big Show", exoticVariant: "Iron Lung", metaTier: "A" },
        { id: "weapon-lmg-rpk", name: "RPK-74", type: "LMG", rpm: 650, magazine: 45, reloadSeconds: 2.8, optimalRangeMeters: 30, variants: ["RPK-74 M"], namedVariant: "Carnage", exoticVariant: null, metaTier: "B" },
      ],
    },
    {
      id: "weapon-type-rifle", class: "Rifle", coreBonus: "Critical Hit Damage",
      archetypes: [
        { id: "weapon-rifle-m1a", name: "M1A", type: "Rifle", rpm: 180, magazine: 10, reloadSeconds: 3.0, optimalRangeMeters: 60, variants: ["Classic M1A", "M1A CQB"], namedVariant: "Baker's Dozen", exoticVariant: null, metaTier: "S" },
        { id: "weapon-rifle-mk17", name: "Mk17", type: "Rifle", rpm: 275, magazine: 20, reloadSeconds: 2.4, optimalRangeMeters: 50, variants: ["Mk 17"], namedVariant: "Harmony", exoticVariant: null, metaTier: "A" },
        { id: "weapon-rifle-sig716", name: "SIG 716", type: "Rifle", rpm: 320, magazine: 20, reloadSeconds: 2.68, optimalRangeMeters: 45, variants: ["SIG 716 CQB"], namedVariant: "Artist's Tool", exoticVariant: null, metaTier: "A" },
        { id: "weapon-rifle-1886", name: "1886", type: "Rifle", rpm: 100, magazine: 8, reloadSeconds: 3.47, optimalRangeMeters: 35, variants: [], namedVariant: "The Virginian", exoticVariant: "Diamondback", metaTier: "S" },
      ],
    },
    {
      id: "weapon-type-marksman-rifle", class: "Marksman Rifle", coreBonus: "Headshot Damage",
      archetypes: [
        { id: "weapon-marksman-rifle-m700", name: "M700", type: "Marksman Rifle", rpm: 55, magazine: 7, reloadSeconds: 7.05, optimalRangeMeters: 50, variants: ["M700 Tactical", "M700 Carbon"], namedVariant: "Ekim's Long Stick", exoticVariant: null, metaTier: "A" },
        { id: "weapon-marksman-rifle-sr1", name: "SR-1", type: "Marksman Rifle", rpm: 60, magazine: 5, reloadSeconds: 3.15, optimalRangeMeters: 50, variants: [], namedVariant: "Designated Hitter", exoticVariant: "Nemesis", metaTier: "S" },
        { id: "weapon-marksman-rifle-m44", name: "M44", type: "Marksman Rifle", rpm: 55, magazine: 5, reloadSeconds: 4.2, optimalRangeMeters: 60, variants: ["Classic M44", "Hunting M44"], namedVariant: null, exoticVariant: null, metaTier: "B" },
        { id: "weapon-marksman-rifle-m1a-mmr", name: "M1A (MMR)", type: "Marksman Rifle", rpm: 180, magazine: 10, reloadSeconds: 3.5, optimalRangeMeters: 60, variants: ["Military M1A"], namedVariant: "Blind Justice", exoticVariant: null, metaTier: "A" },
      ],
    },
    {
      id: "weapon-type-shotgun", class: "Shotgun", coreBonus: "Melee Damage",
      archetypes: [
        { id: "weapon-shotgun-spas12", name: "SPAS-12", type: "Shotgun", rpm: 70, magazine: 8, reloadSeconds: 5.5, optimalRangeMeters: 16, variants: [], namedVariant: "Thorn", exoticVariant: "Sweet Dreams", metaTier: "S" },
        { id: "weapon-shotgun-m870", name: "M870", type: "Shotgun", rpm: 75, magazine: 5, reloadSeconds: 3.35, optimalRangeMeters: 11, variants: ["Military M870"], namedVariant: null, exoticVariant: null, metaTier: "B" },
        { id: "weapon-shotgun-sasg12", name: "SASG-12", type: "Shotgun", rpm: 180, magazine: 8, reloadSeconds: 3.2, optimalRangeMeters: 16, variants: [], namedVariant: "Rock n' Roll", exoticVariant: "Scorpio", metaTier: "A" },
      ],
    },
    {
      id: "weapon-type-pistol", class: "Pistol", coreBonus: "Damage to Targets out of Cover",
      archetypes: [
        { id: "weapon-pistol-d50", name: "D50", type: "Pistol", rpm: 200, magazine: 8, reloadSeconds: 2.24, optimalRangeMeters: 18, variants: [], namedVariant: null, exoticVariant: "Liberty", metaTier: "S" },
        { id: "weapon-pistol-686-magnum", name: "Model 686 Magnum", type: "Pistol", rpm: 160, magazine: 6, reloadSeconds: 2.54, optimalRangeMeters: 16, variants: ["Police 686 Magnum"], namedVariant: "The Harvest", exoticVariant: "Regulus", metaTier: "S" },
        { id: "weapon-pistol-m1911", name: "M1911", type: "Pistol", rpm: 310, magazine: 7, reloadSeconds: 2.24, optimalRangeMeters: 12, variants: ["Tactical M1911"], namedVariant: "Quickstep", exoticVariant: null, metaTier: "B" },
      ],
    },
  ];
}

function generateWeaponTalents(): WeaponTalent[] {
  const talents: Array<[string, string, string[], string, { name: string; description: string; foundOn: string } | null, string]> = [
    ["ranger", "Ranger", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Every 5m from target grants +2% weapon damage. Max +40% at 100m.", null, "S"],
    ["close-and-personal", "Close & Personal", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Killing a target within 7m grants +50% weapon damage for 5s.", { name: "Perfect Close & Personal", description: "+65% weapon damage for 5s", foundOn: "Dare (named AR)" }, "S"],
    ["strained", "Strained", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "+10% CHD per 0.5s of continuous fire. Max 5 stacks (+50% CHD).", { name: "Perfect Strained", description: "Max 8 stacks (+80% CHD)", foundOn: "Cold Relations (named SMG)" }, "S"],
    ["flatline", "Flatline", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "+15% weapon damage to pulsed enemies. After 3 kills, pulses next target.", { name: "Perfect Flatline", description: "+20% damage, pulse after 2 kills", foundOn: "Kingbreaker" }, "A"],
    ["in-sync", "In Sync", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Hitting grants +15% skill damage. Skill damage grants +15% weapon damage. Both active: doubled to 30% each.", { name: "Perfectly In Sync", description: "+20%/+40% when both active", foundOn: "Harmony (rifle), Test Subject (AR)" }, "S"],
    ["killer", "Killer", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Crit kills grant +70% CHD for 10s.", { name: "Perfect Killer", description: "+90% CHD for 10s", foundOn: "Dark Winter (named SMG)" }, "A"],
    ["optimist", "Optimist", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "+3% weapon damage per 10% magazine missing. Max +30%.", { name: "Perfect Optimist", description: "+4% per 10%, max +40%", foundOn: "Various named weapons" }, "A"],
    ["preservation", "Preservation", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Kills repair 10% armor over 5s. Headshot kills repair 20%.", { name: "Perfect Preservation", description: "12%/24% repair", foundOn: "The Answer (named LMG)" }, "A"],
    ["sadist", "Sadist", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Bleeding enemies take +20% weapon damage. Hits can apply bleed.", { name: "Perfect Sadist", description: "+25% and increased bleed chance", foundOn: "Carnage (named LMG)" }, "B"],
    ["ignited", "Ignited", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Burning enemies take +20% weapon damage. Hits can apply burn.", { name: "Perfect Ignited", description: "+25% and increased burn chance", foundOn: "The Burnout (named AR)" }, "B"],
    ["eyeless", "Eyeless", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Blinded enemies take +20% weapon damage. Hits can apply blind.", { name: "Perfect Eyeless", description: "+25% and increased blind chance", foundOn: "Various named weapons" }, "B"],
    ["fast-hands", "Fast Hands", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Crits add +3% reload speed stack. Max 20 stacks (+60%).", null, "A"],
    ["allegro", "Allegro", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "+10% rate of fire.", null, "A"],
    ["frenzy", "Frenzy", ["LMG"], "Reloading from empty grants +20% weapon damage and +35% rate of fire for 7s.", null, "S"],
    ["unhinged", "Unhinged", ["LMG"], "+25% weapon damage, -35% weapon handling.", null, "S"],
    ["first-blood", "First Blood", ["Marksman Rifle"], "First bullet from full mag deals headshot damage regardless of hit location (requires 8x scope).", null, "A"],
    ["rifleman", "Rifleman", ["Rifle"], "Headshots grant +10% weapon damage stack. Max 5 stacks (+50%).", { name: "Perfect Rifleman", description: "+12% per stack, max +60%", foundOn: "Artist's Tool (named rifle)" }, "A"],
    ["boomerang", "Boomerang", ["Rifle"], "Crits have 50% chance to return bullet with +20% damage.", { name: "Perfect Boomerang", description: "+50% returned bullet damage", foundOn: "The Virginian (named rifle)" }, "B"],
    ["pummel", "Pummel", ["Shotgun"], "3 consecutive body shot kills refill magazine and grant +50% weapon damage for 7s.", null, "B"],
    ["premeditated", "Premeditated", ["Shotgun"], "Loading shells grants +10% per shell. Full reload grants +50% for 10s.", null, "S"],
    ["finisher", "Finisher", ["Pistol"], "Swapping within 3s of a kill grants +30% CHC for 15s. Kills grant +30% CHD.", { name: "Perfect Finisher", description: "+40% CHC, +50% CHD", foundOn: "Invisible Hand (named pistol)" }, "B"],
    ["spike", "Spike", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Headshot kills grant +25% skill damage for 10s.", { name: "Perfect Spike", description: "+30% skill damage", foundOn: "Harmony (named rifle)" }, "B"],
    ["reformation", "Reformation", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Headshot kills increase skill repair and healing by 30% for 25s.", null, "A"],
    ["future-perfect", "Future Perfect", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Kills grant +1 skill tier. At tier 6, triggers Overcharge for 15s.", null, "B"],
    ["lucky-shot", "Lucky Shot", ["Rifle", "Marksman Rifle", "Pistol"], "Magazine +20%. Missed shots from cover have 25% chance to return.", null, "A"],
    ["breadbasket", "Breadbasket", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Body shots add +5% headshot damage stack (max 10). 10s duration.", null, "B"],
    ["measured", "Measured", ["Assault Rifle", "LMG", "SMG"], "Top half of magazine: +15% RoF, -20% damage. Bottom half: -25% RoF, +20% damage.", null, "B"],
    ["steady-handed", "Steady Handed", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Hits add +2% handling stack. At 15 stacks, 5% chance to refill magazine.", null, "B"],
    ["vindictive", "Vindictive", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Killing status-affected enemy grants +20% CHC to team for 10s.", null, "C"],
    ["sport-mode", "Sport Mode", ["Pistol"], "+20% movement speed while unholstered. Does not stack.", null, "A"],
    ["in-rhythm", "In Rhythm", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Kills have 5% chance to refresh skill cooldowns. Holstered talent.", null, "A"],
    ["stop-drop-and-roll", "Stop, Drop, and Roll", ["Assault Rifle", "SMG", "LMG", "Rifle", "Marksman Rifle", "Shotgun", "Pistol"], "Rolling removes burn, bleed, and poison. Holstered talent. CD: 60s.", null, "A"],
  ];

  return talents.map(([slug, name, weaponTypes, description, perfectVersion, metaRating]) => ({
    id: `talent-${slug}`,
    name,
    weaponTypes,
    description,
    perfectVersion,
    metaRating,
  }));
}

function generateGearTalents(): Talent[] {
  const chestTalents: Array<[string, string, string, { name: string; description: string; foundOn: string } | null, string]> = [
    ["obliterate", "Obliterate", "Crits increase total weapon damage by 1% for 5s. Max 25 stacks.", { name: "Perfect Obliterate", description: "1% for 10s, max 24 stacks", foundOn: "Equalizer (named chest)" }, "S"],
    ["glass-cannon", "Glass Cannon", "All damage dealt amplified by 25%. All damage taken amplified by 50%.", { name: "Perfect Glass Cannon", description: "+30% dealt, +60% taken", foundOn: "The Sacrifice (Providence chest)" }, "A"],
    ["intimidate", "Intimidate", "While you have bonus armor, +35% weapon damage to enemies within 10m.", { name: "Perfect Intimidate", description: "+40% within 10m", foundOn: "Various named chests" }, "A"],
    ["spotter", "Spotter", "+15% weapon and skill damage to pulsed enemies.", { name: "Perfect Spotter", description: "+20% to pulsed enemies", foundOn: "Closer (Uzina Getica chest)" }, "A"],
    ["unbreakable", "Unbreakable", "When armor depleted, repair 95% armor. CD: 60s.", { name: "Perfect Unbreakable", description: "100% repair, 55s CD", foundOn: "Zero F's (named chest)" }, "A"],
    ["headhunter", "Headhunter", "Headshot kill buffs next shot by 125% of killing blow damage. Cap 800%/1250%.", { name: "Perfect Headhunter", description: "Always 1250% cap", foundOn: "Chainkiller (Walker chest)" }, "A"],
    ["kinetic-momentum", "Kinetic Momentum", "Active skills build stacks: +1% skill damage, +2% skill repair per stack. Max 15.", null, "B"],
    ["braced", "Braced", "While in cover, +45% weapon handling.", { name: "Perfect Braced", description: "+50% handling", foundOn: "Various named chests" }, "C"],
    ["focus", "Focus", "While scoped (8x+), gain +5% weapon damage per second, up to +45%.", { name: "Perfect Focus", description: "+6% per second, up to +54%", foundOn: "Pristine Example (Airaldi)" }, "B"],
    ["spark", "Spark", "Dealing skill damage grants +15% weapon damage for 15s.", null, "B"],
    ["skilled", "Skilled", "Skill kills have 25% chance to reset cooldowns.", null, "B"],
    ["vanguard-talent", "Vanguard", "Deploying shield grants 45% bonus armor to allies within 20m for 20s.", null, "B"],
    ["trauma", "Trauma", "Headshots blind (3s, 30s CD). Chest shots bleed (10s, 30s CD).", null, "C"],
    ["overwatch", "Overwatch", "After 10s in cover, +12% weapon and skill damage to self and allies within 30m.", null, "B"],
  ];

  const backpackTalents: Array<[string, string, string, { name: string; description: string; foundOn: string } | null, string]> = [
    ["vigilance", "Vigilance", "+25% total weapon damage. Taking damage removes for 4s.", { name: "Perfect Vigilance", description: "3s penalty instead of 4s", foundOn: "The Gift (Providence backpack)" }, "S"],
    ["adrenaline-rush", "Adrenaline Rush", "Within 10m of enemy, +20% bonus armor per stack. Max 3 stacks.", { name: "Perfect Adrenaline Rush", description: "+23% per stack", foundOn: "Matador (Walker backpack)" }, "A"],
    ["wicked-talent", "Wicked", "Applying status effect grants +18% weapon damage for 20s.", { name: "Perfect Wicked", description: "+18% for 23s", foundOn: "Anarchist's Cookbook" }, "A"],
    ["bloodsucker", "Bloodsucker", "Kills add +10% bonus armor stack for 10s. Max 10 stacks.", { name: "Perfect Bloodsucker", description: "+12% per stack", foundOn: "Liquid Engineer (Belstone)" }, "A"],
    ["tech-support", "Tech Support", "Skill kills grant +25% skill damage for 20s.", { name: "Perfect Tech Support", description: "+25% for 27s", foundOn: "Percussive Maintenance (Alps)" }, "A"],
    ["combined-arms", "Combined Arms", "Shooting enemy grants +25% skill damage and healing for 3s.", { name: "Perfect Combined Arms", description: "+30% for 3s", foundOn: "Various named backpacks" }, "A"],
    ["composure", "Composure", "While in cover, +15% total weapon damage.", null, "B"],
    ["companion", "Companion", "Within 10m of ally or deployed skill, +15% weapon damage.", null, "B"],
    ["creeping-death", "Creeping Death", "Status effects spread to enemies within 5m. CD: 15s.", null, "B"],
    ["opportunistic", "Opportunistic", "Shotgun/MMR hits amplify damage by 10% for 5s.", { name: "Perfect Opportunistic", description: "+15% amplified", foundOn: "The Setup (Uzina Getica)" }, "A"],
    ["concussion", "Concussion", "Headshots grant +15% weapon damage for 10s. Rifle/MMR kills refresh.", null, "B"],
    ["unstoppable-force", "Unstoppable Force", "Kills grant +5% weapon damage for 15s. Max 5 stacks.", null, "B"],
    ["shock-and-awe", "Shock and Awe", "Status effects grant +20% skill damage and repair for 20s.", null, "B"],
    ["leadership", "Leadership", "Cover-to-cover grants 15% of armor as bonus armor to team. 3x within 10m.", { name: "Perfect Leadership", description: "20% of armor", foundOn: "Cap'n (named backpack)" }, "B"],
    ["clutch", "Clutch", "Below 15% armor: crits repair 2% armor. Kills fully repair over 4-10s.", null, "B"],
    ["calculated", "Calculated", "Kills from cover reduce skill cooldowns by 10-15%.", null, "C"],
    ["galvanize", "Galvanize", "CC effects grant 40% bonus armor to team within 10m.", null, "C"],
  ];

  const chest: Talent[] = chestTalents.map(([slug, name, description, perfectVersion, metaRating]) => ({
    id: `talent-${slug}`,
    name,
    slot: "chest",
    description,
    perfectVersion,
    metaRating,
  }));

  const backpack: Talent[] = backpackTalents.map(([slug, name, description, perfectVersion, metaRating]) => ({
    id: `talent-${slug}`,
    name,
    slot: "backpack",
    description,
    perfectVersion,
    metaRating,
  }));

  return [...chest, ...backpack];
}

function generateSkills(): Skill[] {
  const skills: Skill[] = [
    {
      id: "skill-chem-launcher", name: "Chem Launcher", description: "Grenade launcher firing chemical payloads.",
      variants: [
        { id: "skill-chem-launcher-reinforcer", name: "Reinforcer Chem Launcher", damageType: "utility", scaling: "Skill Tier (repair amount)", cooldownRange: { tier0: 18, tier6: 8 }, durationRange: { tier0: null, tier6: null }, mods: ["repair_amount", "charge_count", "radius"], bestFor: ["support", "group healing"], notes: "Best group healing skill. 3 charges." },
        { id: "skill-chem-launcher-firestarter", name: "Firestarter Chem Launcher", damageType: "fire", scaling: "Skill Tier (burn damage)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 15, tier6: 25 }, mods: ["damage", "cloud_radius", "duration"], bestFor: ["burn builds", "area denial"], notes: "Creates ignitable gas cloud." },
        { id: "skill-chem-launcher-riot-foam", name: "Riot Foam Chem Launcher", damageType: "utility", scaling: "Skill Tier (foam duration)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 8, tier6: 15 }, mods: ["duration", "radius", "cooldown"], bestFor: ["crowd control", "ensnare"], notes: "Immobilizes targets." },
        { id: "skill-chem-launcher-oxidizer", name: "Oxidizer Chem Launcher", damageType: "explosive", scaling: "Skill Tier (corrosive damage)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 10, tier6: 20 }, mods: ["damage", "cloud_radius", "duration"], bestFor: ["armor destruction", "DoT"], notes: "Strips armor over time." },
      ],
    },
    {
      id: "skill-drone", name: "Drone", description: "Aerial skill device for combat or support.",
      variants: [
        { id: "skill-drone-striker", name: "Striker Drone", damageType: "ballistic", scaling: "Skill Tier (damage per burst)", cooldownRange: { tier0: 60, tier6: 30 }, durationRange: { tier0: 30, tier6: 60 }, mods: ["damage", "health", "duration", "ammo"], bestFor: ["skill DPS", "solo play"], notes: "Auto-targets enemies with SMG bursts." },
        { id: "skill-drone-defender", name: "Defender Drone", damageType: "utility", scaling: "Skill Tier (deflection)", cooldownRange: { tier0: 60, tier6: 30 }, durationRange: { tier0: 20, tier6: 40 }, mods: ["health", "deflection_efficiency", "duration"], bestFor: ["tank builds", "survivability"], notes: "Deflects incoming projectiles." },
        { id: "skill-drone-bombardier", name: "Bombardier Drone", damageType: "explosive", scaling: "Skill Tier (bomb damage)", cooldownRange: { tier0: 45, tier6: 22 }, durationRange: { tier0: null, tier6: null }, mods: ["damage", "blast_radius", "health"], bestFor: ["burst AoE", "skill builds"], notes: "Drops explosive payloads on targeted area." },
        { id: "skill-drone-fixer", name: "Fixer Drone", damageType: "utility", scaling: "Skill Tier (repair rate)", cooldownRange: { tier0: 60, tier6: 30 }, durationRange: { tier0: 30, tier6: 60 }, mods: ["repair_amount", "health", "duration"], bestFor: ["self-sustain", "solo play"], notes: "Continuously repairs armor." },
        { id: "skill-drone-tactician", name: "Tactician Drone", damageType: "utility", scaling: "Skill Tier (mark range)", cooldownRange: { tier0: 45, tier6: 22 }, durationRange: { tier0: 20, tier6: 40 }, mods: ["health", "mark_range", "duration"], bestFor: ["Sharpshooter spec", "recon"], notes: "Sharpshooter exclusive. Marks all targets." },
      ],
    },
    {
      id: "skill-firefly", name: "Firefly", description: "Small aerial device that blinds, detonates, or destroys.",
      variants: [
        { id: "skill-firefly-blinder", name: "Blinder Firefly", damageType: "utility", scaling: "Skill Tier (blind duration, targets)", cooldownRange: { tier0: 25, tier6: 12 }, durationRange: { tier0: 5, tier6: 10 }, mods: ["duration", "cooldown", "target_count"], bestFor: ["crowd control", "PvP"], notes: "Applies Blind to multiple enemies." },
        { id: "skill-firefly-burster", name: "Burster Firefly", damageType: "explosive", scaling: "Skill Tier (charge damage)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: null, tier6: null }, mods: ["damage", "blast_radius", "charge_count"], bestFor: ["burst damage"], notes: "Attaches explosive charges." },
        { id: "skill-firefly-demolisher", name: "Demolisher Firefly", damageType: "utility", scaling: "Skill Tier (weakpoint damage)", cooldownRange: { tier0: 25, tier6: 12 }, durationRange: { tier0: null, tier6: null }, mods: ["damage", "cooldown", "target_count"], bestFor: ["weakpoint destruction", "counter-skill"], notes: "Destroys weakpoints and enemy skills." },
      ],
    },
    {
      id: "skill-hive", name: "Hive", description: "Deployable cluster of micro-drones.",
      variants: [
        { id: "skill-hive-restorer", name: "Restorer Hive", damageType: "utility", scaling: "Skill Tier (repair per drone)", cooldownRange: { tier0: 60, tier6: 30 }, durationRange: { tier0: 30, tier6: 60 }, mods: ["repair_amount", "health", "duration", "radius"], bestFor: ["group support", "area healing"], notes: "Sends repair drones to injured allies." },
        { id: "skill-hive-stinger", name: "Stinger Hive", damageType: "utility", scaling: "Skill Tier (damage per sting)", cooldownRange: { tier0: 45, tier6: 22 }, durationRange: { tier0: 20, tier6: 40 }, mods: ["damage", "health", "duration", "radius"], bestFor: ["crowd control", "area denial"], notes: "Attack drones that apply bleed." },
        { id: "skill-hive-reviver", name: "Reviver Hive", damageType: "utility", scaling: "Skill Tier (revive speed, charges)", cooldownRange: { tier0: 180, tier6: 90 }, durationRange: { tier0: null, tier6: null }, mods: ["health", "revive_speed", "charge_count"], bestFor: ["group play", "self-revive"], notes: "Revives downed allies. Near-mandatory in hard content." },
        { id: "skill-hive-artificer", name: "Artificer Hive", damageType: "utility", scaling: "Skill Tier (skill efficiency bonus)", cooldownRange: { tier0: 45, tier6: 22 }, durationRange: { tier0: 20, tier6: 40 }, mods: ["buff_strength", "duration", "radius"], bestFor: ["Technician spec", "skill builds"], notes: "Technician exclusive. Boosts friendly skill proxies." },
      ],
    },
    {
      id: "skill-seeker-mine", name: "Seeker Mine", description: "Self-propelled device that seeks targets.",
      variants: [
        { id: "skill-seeker-mine-explosive", name: "Explosive Seeker Mine", damageType: "explosive", scaling: "Skill Tier (damage, radius)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: null, tier6: null }, mods: ["damage", "blast_radius"], bestFor: ["DPS", "burst damage"], notes: "Tracks and detonates on contact. Applies bleed." },
        { id: "skill-seeker-mine-airburst", name: "Airburst Seeker Mine", damageType: "fire", scaling: "Skill Tier (burn damage)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: null, tier6: null }, mods: ["damage", "blast_radius", "burn_duration"], bestFor: ["burn builds", "crowd control"], notes: "Air-detonates to rain fire and apply Burn." },
        { id: "skill-seeker-mine-cluster", name: "Cluster Seeker Mine", damageType: "explosive", scaling: "Skill Tier (submines, damage)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: null, tier6: null }, mods: ["damage", "blast_radius", "cluster_count"], bestFor: ["crowd control", "AoE"], notes: "Splits into multiple submines for grouped enemies." },
        { id: "skill-seeker-mine-mender", name: "Mender Seeker Mine", damageType: "utility", scaling: "Skill Tier (repair per tick)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 20, tier6: 35 }, mods: ["repair_amount", "duration", "radius"], bestFor: ["Survivalist spec", "group healing"], notes: "Survivalist exclusive. Follows and heals allies." },
      ],
    },
    {
      id: "skill-shield", name: "Shield", description: "Deployable defensive shield absorbing fire.",
      variants: [
        { id: "skill-shield-bulwark", name: "Bulwark Shield", damageType: "utility", scaling: "Skill Tier (shield health)", cooldownRange: { tier0: 40, tier6: 20 }, durationRange: { tier0: null, tier6: null }, mods: ["health", "pistol_damage", "cooldown"], bestFor: ["tank builds", "full defense"], notes: "Full-body shield. Sidearms only." },
        { id: "skill-shield-crusader", name: "Crusader Shield", damageType: "utility", scaling: "Skill Tier (shield health)", cooldownRange: { tier0: 40, tier6: 20 }, durationRange: { tier0: null, tier6: null }, mods: ["health", "weapon_damage", "cooldown"], bestFor: ["offensive shield", "push positions"], notes: "Allows primary weapons. Head/legs exposed." },
        { id: "skill-shield-deflector", name: "Deflector Shield", damageType: "ballistic", scaling: "Skill Tier (reflected damage)", cooldownRange: { tier0: 40, tier6: 20 }, durationRange: { tier0: null, tier6: null }, mods: ["health", "ricochet_damage", "cooldown"], bestFor: ["skill builds", "reflected damage"], notes: "Ricochets bullets at targeted enemies." },
        { id: "skill-shield-striker", name: "Striker Shield", damageType: "utility", scaling: "Skill Tier (damage buff)", cooldownRange: { tier0: 40, tier6: 20 }, durationRange: { tier0: null, tier6: null }, mods: ["health", "damage_buff", "cooldown"], bestFor: ["Firewall spec", "team buffing"], notes: "Firewall exclusive. Buffs allies behind shield." },
      ],
    },
    {
      id: "skill-turret", name: "Turret", description: "Deployable stationary weapon system.",
      variants: [
        { id: "skill-turret-assault", name: "Assault Turret", damageType: "ballistic", scaling: "Skill Tier (damage, health)", cooldownRange: { tier0: 90, tier6: 45 }, durationRange: { tier0: 180, tier6: 300 }, mods: ["damage", "health", "duration", "ammo"], bestFor: ["skill builds", "area control"], notes: "Auto-targets with SMG. Most versatile turret." },
        { id: "skill-turret-incinerator", name: "Incinerator Turret", damageType: "fire", scaling: "Skill Tier (burn damage)", cooldownRange: { tier0: 90, tier6: 45 }, durationRange: { tier0: 180, tier6: 300 }, mods: ["damage", "health", "duration", "burn_duration"], bestFor: ["status effects", "crowd control"], notes: "Short-range flamethrower. Applies Burn." },
        { id: "skill-turret-sniper", name: "Sniper Turret", damageType: "ballistic", scaling: "Skill Tier (headshot damage)", cooldownRange: { tier0: 90, tier6: 45 }, durationRange: { tier0: 180, tier6: 300 }, mods: ["damage", "health", "duration", "headshot_damage"], bestFor: ["player-directed", "elite sniping"], notes: "Manually aimed. High single-shot damage." },
        { id: "skill-turret-artillery", name: "Artillery Turret", damageType: "explosive", scaling: "Skill Tier (mortar damage)", cooldownRange: { tier0: 90, tier6: 45 }, durationRange: { tier0: 180, tier6: 300 }, mods: ["damage", "health", "duration", "blast_radius"], bestFor: ["Demolitionist spec", "area denial"], notes: "Demolitionist exclusive. Fires explosive mortars." },
      ],
    },
    {
      id: "skill-pulse", name: "Pulse", description: "Detection or disruption wave.",
      variants: [
        { id: "skill-pulse-scanner", name: "Scanner Pulse", damageType: "utility", scaling: "Skill Tier (radius, duration)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 20, tier6: 30 }, mods: ["radius", "duration", "cooldown"], bestFor: ["group play", "any build"], notes: "Highlights all hostiles in range." },
        { id: "skill-pulse-jammer", name: "Jammer Pulse", damageType: "utility", scaling: "Skill Tier (disruption)", cooldownRange: { tier0: 45, tier6: 22 }, durationRange: { tier0: 8, tier6: 14 }, mods: ["radius", "duration", "cooldown"], bestFor: ["tech content", "Black Tusk"], notes: "Disrupts all hostile electronics." },
        { id: "skill-pulse-banshee", name: "Banshee Pulse", damageType: "utility", scaling: "Skill Tier (disorient)", cooldownRange: { tier0: 40, tier6: 20 }, durationRange: { tier0: 6, tier6: 12 }, mods: ["radius", "duration", "cooldown"], bestFor: ["crowd control", "Gunner spec"], notes: "Gunner exclusive. Disorients enemies." },
      ],
    },
    {
      id: "skill-trap", name: "Trap", description: "Scattered minefield of proximity devices.",
      variants: [
        { id: "skill-trap-shock", name: "Shock Trap", damageType: "shock", scaling: "Skill Tier (shock duration, mines)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 30, tier6: 60 }, mods: ["shock_duration", "mine_count", "trigger_radius"], bestFor: ["crowd control", "area denial"], notes: "Scatters electric mines that shock approaching enemies." },
        { id: "skill-trap-repair", name: "Repair Trap", damageType: "utility", scaling: "Skill Tier (repair per mine)", cooldownRange: { tier0: 30, tier6: 15 }, durationRange: { tier0: 30, tier6: 60 }, mods: ["repair_amount", "mine_count", "trigger_radius"], bestFor: ["support", "group healing"], notes: "Repair mines that heal passing allies." },
      ],
    },
  ];
  return skills;
}

function generateSpecializations(): Specialization[] {
  return [
    { id: "spec-survivalist", name: "Survivalist", signatureWeapon: { name: "Explosive-Tipped Crossbow", description: "Silent crossbow firing explosive bolts." }, uniqueSkill: "Mender Seeker Mine", grenade: "Incendiary Grenade", keyPassives: ["+15% AR Damage", "+15% Shotgun Damage", "Tactical Link: teammates deal 10% bonus to status-affected targets", "20% Protection from Elites", "15% outgoing healing", "10% skill CDR in cover"], bonusSkillTier: false, weaponDamageBonus: "Assault Rifles (+15%), Shotguns (+15%)", bestFor: ["status effect builds", "AR DPS", "group support"] },
    { id: "spec-demolitionist", name: "Demolitionist", signatureWeapon: { name: "M32A1 Grenade Launcher", description: "Six-round revolver grenade launcher." }, uniqueSkill: "Artillery Turret", grenade: "Fragmentation Grenade", keyPassives: ["+15% SMG Damage", "+15% LMG Damage", "25% increased Explosive damage", "Tactical Link: 5% damage to targets out of cover"], bonusSkillTier: false, weaponDamageBonus: "SMGs (+15%), LMGs (+15%)", bestFor: ["LMG builds", "explosive builds", "area denial"] },
    { id: "spec-sharpshooter", name: "Sharpshooter", signatureWeapon: { name: "TAC-50 C Rifle", description: ".50 cal anti-material sniper rifle." }, uniqueSkill: "Tactician Drone", grenade: "Flashbang Grenade", keyPassives: ["+25% Headshot Damage", "Tactical Link: 10% HSD to allies closer to target", "+30% Reload Speed", "+30% Stability"], bonusSkillTier: false, weaponDamageBonus: "Rifles and Marksman Rifles (+15%)", bestFor: ["sniper builds", "headshot builds", "long-range"] },
    { id: "spec-gunner", name: "Gunner", signatureWeapon: { name: "Minigun", description: "Belt-fed rotary machine gun. Hits restore 1% armor (max 50%)." }, uniqueSkill: "Banshee Pulse", grenade: "Riot Foam Grenade", keyPassives: ["5% armor on kill", "Armor kits grant 50% bonus armor for 10s", "10% ammo regeneration per 60s"], bonusSkillTier: false, weaponDamageBonus: "LMGs (primary pairing)", bestFor: ["LMG sustain", "tank DPS", "crowd control"] },
    { id: "spec-technician", name: "Technician", signatureWeapon: { name: "P-017 Missile Launcher", description: "Guided missile launcher locking onto up to 6 targets." }, uniqueSkill: "Artificer Hive", grenade: "EMP Grenade", keyPassives: ["+1 Skill Tier (unique passive)", "+10% Skill Damage", "Increased damage to robotics", "Armor kits also repair friendly skills"], bonusSkillTier: true, weaponDamageBonus: "Pistols (secondary); primary value is +1 Skill Tier", bestFor: ["skill builds", "hybrid builds", "anti-robotics"] },
    { id: "spec-firewall", name: "Firewall", signatureWeapon: { name: "K8-JetStream Flamethrower", description: "15m arc flamethrower, requires Striker Shield active." }, uniqueSkill: "Striker Shield", grenade: "Cluster Grenade", keyPassives: ["Tactical Link: allies deal 10% more to enemies within 10m", "Burn enemies within 5m on armor break", "Shotgun fire chance"], bonusSkillTier: false, weaponDamageBonus: "Shotguns (via Firestarter passive); close-range weapons", bestFor: ["CQC builds", "burn builds", "aggressive frontline"] },
  ];
}

function generateGearAttributes(): GearAttribute[] {
  return [
    // Core attributes
    { id: "attr-weapon-damage", stat: "WD", label: "Weapon Damage", maxRoll: 15, unit: "percent", category: "core_offensive", description: "Red core attribute. Each adds weapon damage percentage." },
    { id: "attr-armor", stat: "Armor", label: "Armor", maxRoll: 170000, unit: "armor_points", category: "core_defensive", description: "Blue core attribute. Each adds flat armor points." },
    { id: "attr-skill-tier", stat: "ST", label: "Skill Tier", maxRoll: 1, unit: "tier", category: "core_skill", description: "Yellow core attribute. Each adds 1 skill tier (max 6)." },
    // Minor offensive
    { id: "attr-chc", stat: "CHC", label: "Critical Hit Chance", maxRoll: 6, unit: "percent", category: "minor_offensive", description: "Hard cap 60%. Best minor stat for DPS until capped." },
    { id: "attr-chd", stat: "CHD", label: "Critical Hit Damage", maxRoll: 12, unit: "percent", category: "minor_offensive", description: "No hard cap. Stack after reaching 60% CHC." },
    { id: "attr-hsd", stat: "HSD", label: "Headshot Damage", maxRoll: 10, unit: "percent", category: "minor_offensive", description: "Separate multiplicative bucket on headshots." },
    { id: "attr-dta", stat: "DtA", label: "Damage to Armor", maxRoll: 12, unit: "percent", category: "minor_offensive", description: "Multiplicative bonus vs armored enemies." },
    { id: "attr-dttooc", stat: "DtTooC", label: "Damage to Out of Cover", maxRoll: 12, unit: "percent", category: "minor_offensive", description: "Multiplicative bonus vs enemies not in cover." },
    { id: "attr-dte", stat: "DtE", label: "Damage to Elites", maxRoll: 12, unit: "percent", category: "minor_offensive", description: "Multiplicative bonus vs elite enemies." },
    // Minor skill
    { id: "attr-skill-damage", stat: "SD", label: "Skill Damage", maxRoll: 12, unit: "percent", category: "minor_skill", description: "Increases damage dealt by skills." },
    { id: "attr-skill-repair", stat: "SR", label: "Skill Repair", maxRoll: 12, unit: "percent", category: "minor_skill", description: "Increases repair from healing skills." },
    { id: "attr-skill-haste", stat: "SH", label: "Skill Haste", maxRoll: 10, unit: "percent", category: "minor_skill", description: "Reduces skill cooldown time." },
    { id: "attr-skill-duration", stat: "SDur", label: "Skill Duration", maxRoll: 10, unit: "percent", category: "minor_skill", description: "Increases active duration of deployed skills." },
    // Minor defensive
    { id: "attr-health", stat: "HP", label: "Health", maxRoll: 25000, unit: "hit_points", category: "minor_defensive", description: "Increases total health pool." },
    { id: "attr-armor-on-kill", stat: "AoK", label: "Armor on Kill", maxRoll: 120000, unit: "armor_points", category: "minor_defensive", description: "Restores armor on enemy kill." },
    { id: "attr-incoming-repairs", stat: "IR", label: "Incoming Repairs", maxRoll: 15, unit: "percent", category: "minor_defensive", description: "Increases armor restored by all repair sources." },
    { id: "attr-hazard-protection", stat: "HZP", label: "Hazard Protection", maxRoll: 10, unit: "percent", category: "minor_defensive", description: "Reduces hazard damage. Hard cap 100%." },
  ];
}

function generateSHDWatch(): SHDWatchCategory[] {
  return [
    { id: "shd-offense", name: "Offense", maxLevel: 250, bonuses: [
      { stat: "Weapon Damage", perLevel: 0.04, maxBonus: 10 },
      { stat: "Headshot Damage", perLevel: 0.08, maxBonus: 20 },
      { stat: "Critical Hit Chance", perLevel: 0.04, maxBonus: 10 },
      { stat: "Critical Hit Damage", perLevel: 0.08, maxBonus: 20 },
    ]},
    { id: "shd-defense", name: "Defense", maxLevel: 250, bonuses: [
      { stat: "Armor", perLevel: 0.04, maxBonus: 10 },
      { stat: "Health", perLevel: 0.04, maxBonus: 10 },
      { stat: "Explosive Resistance", perLevel: 0.08, maxBonus: 20 },
      { stat: "Hazard Protection", perLevel: 0.08, maxBonus: 20 },
    ]},
    { id: "shd-utility", name: "Utility", maxLevel: 250, bonuses: [
      { stat: "Skill Damage", perLevel: 0.04, maxBonus: 10 },
      { stat: "Skill Haste", perLevel: 0.04, maxBonus: 10 },
      { stat: "Repair Skills", perLevel: 0.04, maxBonus: 10 },
      { stat: "Status Effects", perLevel: 0.04, maxBonus: 10 },
    ]},
    { id: "shd-handling", name: "Handling", maxLevel: 250, bonuses: [
      { stat: "Accuracy", perLevel: 0.04, maxBonus: 10 },
      { stat: "Stability", perLevel: 0.04, maxBonus: 10 },
      { stat: "Reload Speed", perLevel: 0.04, maxBonus: 10 },
      { stat: "Ammo Capacity", perLevel: 0.04, maxBonus: 10 },
    ]},
  ];
}

function generateSkillMods(): Array<{ id: string; skill: string; slot: string; stat: string; description: string }> {
  return [
    { id: "mod-turret-damage", skill: "Turret", slot: "damage", stat: "+Skill Damage", description: "Increases turret damage output." },
    { id: "mod-turret-health", skill: "Turret", slot: "health", stat: "+Skill Health", description: "Increases turret health pool." },
    { id: "mod-turret-duration", skill: "Turret", slot: "duration", stat: "+Skill Duration", description: "Increases turret active time." },
    { id: "mod-drone-damage", skill: "Drone", slot: "damage", stat: "+Skill Damage", description: "Increases drone damage output." },
    { id: "mod-drone-health", skill: "Drone", slot: "health", stat: "+Skill Health", description: "Increases drone health pool." },
    { id: "mod-drone-duration", skill: "Drone", slot: "duration", stat: "+Skill Duration", description: "Increases drone active time." },
    { id: "mod-hive-radius", skill: "Hive", slot: "radius", stat: "+Effect Radius", description: "Increases hive effect radius." },
    { id: "mod-hive-charges", skill: "Hive", slot: "charges", stat: "+Charges", description: "Increases hive drone charges." },
    { id: "mod-seeker-damage", skill: "Seeker Mine", slot: "damage", stat: "+Skill Damage", description: "Increases seeker mine damage." },
    { id: "mod-seeker-radius", skill: "Seeker Mine", slot: "radius", stat: "+Blast Radius", description: "Increases seeker blast radius." },
    { id: "mod-shield-health", skill: "Shield", slot: "health", stat: "+Skill Health", description: "Increases shield health pool." },
    { id: "mod-pulse-radius", skill: "Pulse", slot: "radius", stat: "+Effect Radius", description: "Increases pulse scan radius." },
    { id: "mod-pulse-duration", skill: "Pulse", slot: "duration", stat: "+Skill Duration", description: "Increases pulse scan duration." },
    { id: "mod-chem-repair", skill: "Chem Launcher", slot: "repair", stat: "+Repair Amount", description: "Increases chem launcher repair." },
    { id: "mod-chem-charges", skill: "Chem Launcher", slot: "charges", stat: "+Charges", description: "Increases chem launcher charges." },
    { id: "mod-firefly-targets", skill: "Firefly", slot: "targets", stat: "+Target Count", description: "Increases firefly target count." },
    { id: "mod-trap-mines", skill: "Trap", slot: "mines", stat: "+Mine Count", description: "Increases trap mine count." },
  ];
}

// --- Main pipeline ---

function main(): void {
  console.log("=== SHD Planner: Data Normalize & Merge Pipeline ===\n");

  // Ensure output directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Check for raw data
  const hasRawData = fs.existsSync(RAW_DIR) &&
    fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".json")).length > 0;

  // Changelog tracks additions, updates, and removals
  const changelog: { added: string[]; updated: string[]; removed: string[]; unchanged: number } = {
    added: [], updated: [], removed: [], unchanged: 0,
  };

  if (hasRawData) {
    console.log("[info] Raw data found. Merging scraped data with seed baseline...\n");

    // Read all raw scraper output files
    const rawFiles = {
      wikiRaw: readRawFile("wiki-raw.json") as { extracted?: Record<string, unknown[]> } | null,
      mxRaw: readRawFile("mx-builds-raw.json") as { extracted?: Record<string, unknown[]> } | null,
      spreadsheetRaw: readRawFile("community-spreadsheet-raw.json") as { extracted?: Record<string, unknown[]> } | null,
      nightfallRaw: readRawFile("nightfall-guard-raw.json") as { extracted?: Record<string, unknown[]> } | null,
    };

    const rawSourceCount = Object.values(rawFiles).filter(Boolean).length;
    console.log(`  Raw files found: ${rawSourceCount}/4\n`);

    // Helper: merge scraped entities into seed data by slugified name
    // Prefers the source with more non-null fields
    function mergeEntities<T extends { id: string; name: string }>(
      seeds: T[],
      scraped: Array<Record<string, unknown>>,
      entityType: string,
      idPrefix: string,
    ): T[] {
      const seedMap = new Map<string, T>();
      for (const item of seeds) {
        seedMap.set(slugify(item.name), item);
      }

      // Count non-null fields in an object
      const fieldCount = (obj: Record<string, unknown>): number =>
        Object.values(obj).filter((v) => v !== null && v !== undefined && v !== "").length;

      for (const raw of scraped) {
        const rawName = (raw.name ?? raw.title ?? "") as string;
        if (!rawName) continue;
        const slug = slugify(rawName);
        const existing = seedMap.get(slug);

        if (existing) {
          // Merge supplementary fields from scraped data into existing
          const existingFieldCount = fieldCount(existing as unknown as Record<string, unknown>);
          const rawFieldCount = fieldCount(raw);

          if (rawFieldCount > existingFieldCount) {
            // Scraped data is more complete — update with raw, keeping the ID
            const merged = { ...raw, id: existing.id } as unknown as T;
            seedMap.set(slug, merged);
            changelog.updated.push(`${entityType}:${rawName}`);
          } else {
            // Seed is more complete — merge only non-null fields from raw
            for (const [key, value] of Object.entries(raw)) {
              if (key === "id") continue;
              const existingValue = (existing as unknown as Record<string, unknown>)[key];
              if ((existingValue === null || existingValue === undefined || existingValue === "") && value) {
                (existing as unknown as Record<string, unknown>)[key] = value;
              }
            }
            changelog.unchanged++;
          }
        } else {
          // New entity from scraper
          const newEntity = { ...raw, id: `${idPrefix}-${slug}` } as unknown as T;
          seedMap.set(slug, newEntity);
          changelog.added.push(`${entityType}:${rawName}`);
        }
      }

      return Array.from(seedMap.values());
    }

    // Collect scraped entities by category from all sources
    function collectFromSources(category: string): Array<Record<string, unknown>> {
      const collected: Array<Record<string, unknown>> = [];
      for (const raw of Object.values(rawFiles)) {
        const extracted = raw?.extracted;
        if (extracted && Array.isArray(extracted[category])) {
          collected.push(...(extracted[category] as Array<Record<string, unknown>>));
        }
      }
      return collected;
    }

    // Merge each entity type: generate seed, then overlay scraped data
    console.log("[step 1/13] Merging brand sets...");
    const scrapedBrands = collectFromSources("brandSets");
    const brandSetsRaw = generateBrandSets();
    const brandSets = scrapedBrands.length > 0
      ? mergeEntities(brandSetsRaw, scrapedBrands, "brand", "brand")
      : brandSetsRaw;
    writeDataFile("gear-brands.json", brandSets);

    console.log("[step 2/13] Merging gear sets...");
    const scrapedGearSets = collectFromSources("gearSets");
    const gearSetsRaw = generateGearSets();
    const gearSets = scrapedGearSets.length > 0
      ? mergeEntities(gearSetsRaw, scrapedGearSets, "gearset", "gearset")
      : gearSetsRaw;
    writeDataFile("gear-sets.json", gearSets);

    console.log("[step 3/13] Merging named items...");
    const scrapedNamed = collectFromSources("namedItems");
    const namedItemsRaw = generateNamedItems();
    const namedItems = scrapedNamed.length > 0
      ? mergeEntities(namedItemsRaw, scrapedNamed, "named", "named")
      : namedItemsRaw;
    writeDataFile("named-items.json", namedItems);

    console.log("[step 4/13] Merging exotic gear...");
    const scrapedExoticGear = collectFromSources("exotics").filter(
      (e) => (e as Record<string, unknown>).slot !== undefined
    );
    const exoticGearRaw = generateExoticGear();
    const exoticGear = scrapedExoticGear.length > 0
      ? mergeEntities(exoticGearRaw, scrapedExoticGear, "exotic-gear", "exotic")
      : exoticGearRaw;
    writeDataFile("exotics-gear.json", exoticGear);

    console.log("[step 5/13] Merging exotic weapons...");
    const scrapedExoticWeapons = collectFromSources("exotics").filter(
      (e) => (e as Record<string, unknown>).category !== undefined
    );
    const exoticWeaponsRaw = generateExoticWeapons();
    const exoticWeapons = scrapedExoticWeapons.length > 0
      ? mergeEntities(exoticWeaponsRaw, scrapedExoticWeapons, "exotic-weapon", "exotic")
      : exoticWeaponsRaw;
    writeDataFile("exotics-weapons.json", exoticWeapons);

    console.log("[step 6/13] Merging weapons...");
    const weapons = generateWeapons();
    writeDataFile("weapons.json", weapons);

    console.log("[step 7/13] Merging weapon talents...");
    const scrapedWeaponTalents = collectFromSources("talents").filter(
      (t) => Array.isArray((t as Record<string, unknown>).weaponTypes)
    );
    const weaponTalentsRaw = generateWeaponTalents();
    const weaponTalents = scrapedWeaponTalents.length > 0
      ? mergeEntities(weaponTalentsRaw, scrapedWeaponTalents, "weapon-talent", "talent")
      : weaponTalentsRaw;
    writeDataFile("weapon-talents.json", weaponTalents);

    console.log("[step 8/13] Merging gear talents...");
    const scrapedGearTalents = collectFromSources("talents").filter(
      (t) => !Array.isArray((t as Record<string, unknown>).weaponTypes)
    );
    const gearTalentsRaw = generateGearTalents();
    const gearTalents = scrapedGearTalents.length > 0
      ? mergeEntities(gearTalentsRaw, scrapedGearTalents, "gear-talent", "talent")
      : gearTalentsRaw;
    writeDataFile("gear-talents.json", gearTalents);

    console.log("[step 9/13] Generating gear attributes...");
    const gearAttributes = generateGearAttributes();
    writeDataFile("gear-attributes.json", gearAttributes);

    console.log("[step 10/13] Merging skills...");
    const skills = generateSkills();
    writeDataFile("skills.json", skills);

    console.log("[step 11/13] Generating skill mods...");
    const skillMods = generateSkillMods();
    writeDataFile("skill-mods.json", skillMods);

    console.log("[step 12/13] Generating specializations...");
    const specializations = generateSpecializations();
    writeDataFile("specializations.json", specializations);

    console.log("[step 13/13] Generating SHD Watch...");
    const shdWatch = generateSHDWatch();
    writeDataFile("shd-watch.json", shdWatch);

    // Data quality report
    const totalEntities =
      brandSets.length + gearSets.length + namedItems.length +
      exoticGear.length + exoticWeapons.length +
      weapons.reduce((acc, w) => acc + w.archetypes.length, 0) +
      weaponTalents.length + gearTalents.length +
      gearAttributes.length +
      skills.reduce((acc, s) => acc + s.variants.length, 0) +
      skillMods.length + specializations.length + shdWatch.length;

    const qualityReport = {
      generatedAt: new Date().toISOString(),
      totalEntities,
      verified: 0,
      singleSource: totalEntities - changelog.updated.length,
      conflicted: 0,
      missing: [] as string[],
      conflicts: [] as string[],
      source: "merged",
      changelog,
    };

    writeDataFile("data-quality-report.json", qualityReport);

    // Update manifest
    const manifest = {
      version: "0.1.0",
      gameVersion: "TU21.1",
      lastDataUpdate: new Date().toISOString(),
      sources: Object.keys(rawFiles).filter((k) => rawFiles[k as keyof typeof rawFiles] !== null),
      entityCounts: {
        brandSets: brandSets.length,
        gearSets: gearSets.length,
        namedItems: namedItems.length,
        exoticGear: exoticGear.length,
        exoticWeapons: exoticWeapons.length,
        weapons: weapons.reduce((acc, w) => acc + w.archetypes.length, 0),
        weaponTalents: weaponTalents.length,
        gearTalents: gearTalents.length,
        gearAttributes: gearAttributes.length,
        skills: skills.reduce((acc, s) => acc + s.variants.length, 0),
        skillMods: skillMods.length,
        specializations: specializations.length,
        shdWatch: shdWatch.length,
      },
    };

    writeDataFile("manifest.json", manifest);

    console.log(`\n=== Pipeline Complete (Merged) ===`);
    console.log(`Total entities: ${totalEntities}`);
    console.log(`Added: ${changelog.added.length}, Updated: ${changelog.updated.length}, Unchanged: ${changelog.unchanged}`);
    if (changelog.added.length > 0) console.log(`  New: ${changelog.added.join(", ")}`);
    if (changelog.updated.length > 0) console.log(`  Updated: ${changelog.updated.join(", ")}`);

    // Write changelog for cron handler consumption
    writeDataFile("update-changelog.json", changelog);

  } else {
    console.log("[info] No raw data found. Generating seed data...\n");
  }

  // Generate seed data
  console.log("[step 1/13] Generating brand sets...");
  const brandSets = generateBrandSets();
  writeDataFile("gear-brands.json", brandSets);

  console.log("[step 2/13] Generating gear sets...");
  const gearSets = generateGearSets();
  writeDataFile("gear-sets.json", gearSets);

  console.log("[step 3/13] Generating named items...");
  const namedItems = generateNamedItems();
  writeDataFile("named-items.json", namedItems);

  console.log("[step 4/13] Generating exotic gear...");
  const exoticGear = generateExoticGear();
  writeDataFile("exotics-gear.json", exoticGear);

  console.log("[step 5/13] Generating exotic weapons...");
  const exoticWeapons = generateExoticWeapons();
  writeDataFile("exotics-weapons.json", exoticWeapons);

  console.log("[step 6/13] Generating weapons...");
  const weapons = generateWeapons();
  writeDataFile("weapons.json", weapons);

  console.log("[step 7/13] Generating weapon talents...");
  const weaponTalents = generateWeaponTalents();
  writeDataFile("weapon-talents.json", weaponTalents);

  console.log("[step 8/13] Generating gear talents...");
  const gearTalents = generateGearTalents();
  writeDataFile("gear-talents.json", gearTalents);

  console.log("[step 9/13] Generating gear attributes...");
  const gearAttributes = generateGearAttributes();
  writeDataFile("gear-attributes.json", gearAttributes);

  console.log("[step 10/13] Generating skills...");
  const skills = generateSkills();
  writeDataFile("skills.json", skills);

  console.log("[step 11/13] Generating skill mods...");
  const skillMods = generateSkillMods();
  writeDataFile("skill-mods.json", skillMods);

  console.log("[step 12/13] Generating specializations...");
  const specializations = generateSpecializations();
  writeDataFile("specializations.json", specializations);

  console.log("[step 13/13] Generating SHD Watch...");
  const shdWatch = generateSHDWatch();
  writeDataFile("shd-watch.json", shdWatch);

  // Data quality report
  const totalEntities =
    brandSets.length + gearSets.length + namedItems.length +
    exoticGear.length + exoticWeapons.length +
    weapons.reduce((acc, w) => acc + w.archetypes.length, 0) +
    weaponTalents.length + gearTalents.length +
    gearAttributes.length +
    skills.reduce((acc, s) => acc + s.variants.length, 0) +
    skillMods.length + specializations.length + shdWatch.length;

  const qualityReport = {
    generatedAt: new Date().toISOString(),
    totalEntities,
    verified: 0,
    singleSource: totalEntities,
    conflicted: 0,
    missing: [] as string[],
    conflicts: [] as string[],
    source: hasRawData ? "merged" : "seed-data",
  };

  writeDataFile("data-quality-report.json", qualityReport);

  // Update manifest
  const manifest = {
    version: "0.1.0",
    gameVersion: "TU21.1",
    lastDataUpdate: new Date().toISOString(),
    sources: hasRawData ? ["community-spreadsheet", "wiki-scraper"] : ["seed-data"],
    entityCounts: {
      brandSets: brandSets.length,
      gearSets: gearSets.length,
      namedItems: namedItems.length,
      exoticGear: exoticGear.length,
      exoticWeapons: exoticWeapons.length,
      weapons: weapons.reduce((acc, w) => acc + w.archetypes.length, 0),
      weaponTalents: weaponTalents.length,
      gearTalents: gearTalents.length,
      gearAttributes: gearAttributes.length,
      skills: skills.reduce((acc, s) => acc + s.variants.length, 0),
      skillMods: skillMods.length,
      specializations: specializations.length,
      shdWatch: shdWatch.length,
    },
  };

  writeDataFile("manifest.json", manifest);

  // Write empty changelog for consistency
  writeDataFile("update-changelog.json", { added: [], updated: [], removed: [], unchanged: totalEntities });

  console.log(`\n=== Pipeline Complete ===`);
  console.log(`Total entities: ${totalEntities}`);
  console.log(`Brand sets: ${brandSets.length}`);
  console.log(`Gear sets: ${gearSets.length}`);
  console.log(`Named items: ${namedItems.length}`);
  console.log(`Exotic gear: ${exoticGear.length}`);
  console.log(`Exotic weapons: ${exoticWeapons.length}`);
  console.log(`Weapon archetypes: ${weapons.reduce((acc, w) => acc + w.archetypes.length, 0)}`);
  console.log(`Weapon talents: ${weaponTalents.length}`);
  console.log(`Gear talents: ${gearTalents.length}`);
  console.log(`Gear attributes: ${gearAttributes.length}`);
  console.log(`Skill variants: ${skills.reduce((acc, s) => acc + s.variants.length, 0)}`);
  console.log(`Skill mods: ${skillMods.length}`);
  console.log(`Specializations: ${specializations.length}`);
  console.log(`SHD Watch categories: ${shdWatch.length}`);
}

main();
