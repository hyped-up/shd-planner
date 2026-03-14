// Data loader for Division 2 game data JSON files
// Uses fs.readFile on server (supports hot-reload via clearDataCache)
// Uses fetch() on client (loads from public data endpoint or bundled JSON)
// DATA_DIR env var configures the server-side path (Docker: /app/data)

import type {
  GearSlot,
  WeaponType,
  SpecializationType,
  TalentSlot,
  IBrandSet,
  IGearSet,
  IWeapon,
  IWeaponTalent,
  IGearTalent,
  ISkill,
  ISkillVariant,
  IExoticGear,
  IExoticWeapon,
  INamedItem,
  ISpecialization,
  IGearAttribute,
} from "./types";
import { cachedLoader } from "./data-cache";

// --- Helpers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawJson = any;

// Detect server vs client at module load time
const isServer = typeof window === "undefined";

/**
 * Read and parse a JSON data file.
 * Server: uses fs.readFile from DATA_DIR (supports hot-reload when cache cleared)
 * Client: uses dynamic import (bundled by Next.js at build time)
 */
async function readDataFile<T>(filename: string): Promise<T> {
  if (isServer) {
    // Dynamic import of fs to avoid bundler issues on client
    const fs = await import("fs/promises");
    const path = await import("path");
    const dataDir = process.env.DATA_DIR ?? path.resolve(process.cwd(), "src/data");
    const filePath = path.join(dataDir, filename);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } else {
    // Client-side: use dynamic import which Next.js handles at build time
    const base = filename.endsWith(".json") ? filename.slice(0, -5) : filename;
    const mod = await import(`@/data/${base}.json`);
    return mod.default as T;
  }
}

/** Convert lowercase slot ("mask") to PascalCase GearSlot ("Mask") */
function toGearSlot(s: string): GearSlot {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as GearSlot;
}

/** Map coreFocus string to CoreAttributeType */
function toCoreAttribute(focus: string): "weaponDamage" | "armor" | "skillTier" {
  const map: Record<string, "weaponDamage" | "armor" | "skillTier"> = {
    dps: "weaponDamage",
    tank: "armor",
    skill: "skillTier",
    hybrid: "weaponDamage",
    utility: "skillTier",
  };
  return map[focus?.toLowerCase()] ?? "weaponDamage";
}

// --- Manifest ---

/** Data manifest shape */
export interface IManifest {
  version: string;
  gameVersion: string;
  lastDataUpdate: string;
  sources: string[];
  entityCounts: Record<string, number>;
}

/** Load the data manifest */
export const getManifest: () => Promise<IManifest | null> = cachedLoader("manifest", async () => {
  try {
    return await readDataFile<IManifest>("manifest.json");
  } catch {
    return null;
  }
});

// --- Brand Sets ---

/** Get all brand sets */
export const getAllBrands: () => Promise<IBrandSet[]> = cachedLoader("brands", async () => {
  const data = await readDataFile<RawJson[]>("gear-brands.json");
  return data.map((b) => ({
    id: b.id,
    name: b.name,
    iconUrl: b.iconUrl,
    slots: (b.availableSlots ?? []).map(toGearSlot),
    coreAttribute: toCoreAttribute(b.coreFocus),
    // Wrap plain string bonuses into IBrandBonus shape
    bonuses: Object.fromEntries(
      Object.entries(b.bonuses ?? {}).map(([k, v]) => [k, { stat: v as string, value: 0, unit: "%" }])
    ),
    modSlot: true,
    minorAttributes: 2,
    _verified: b._verified ?? false,
    _sources: b._sources ?? [],
  }));
});

/** Get a brand set by its ID */
export async function getBrandById(id: string): Promise<IBrandSet | undefined> {
  const brands = await getAllBrands();
  return brands.find((b) => b.id === id);
}

/** Get brand sets that include a specific gear slot */
export async function getBrandsBySlot(slot: GearSlot): Promise<IBrandSet[]> {
  const brands = await getAllBrands();
  return brands.filter((b) => b.slots.includes(slot));
}

// --- Gear Sets ---

/** Get all gear sets */
export const getAllGearSets: () => Promise<IGearSet[]> = cachedLoader("gearsets", async () => {
  const data = await readDataFile<RawJson[]>("gear-sets.json");
  return data.map((g) => ({
    id: g.id,
    name: g.name,
    iconUrl: g.iconUrl,
    pieces: (g.gearSlots ?? []).map(toGearSlot),
    // Normalize bonuses: strings become {description}, objects stay as-is
    bonuses: Object.fromEntries(
      Object.entries(g.bonuses ?? {}).map(([k, v]) => [
        k,
        typeof v === "string" ? { description: v } : v as { description: string },
      ])
    ),
    chestTalent: g.chestTalent ?? undefined,
    backpackTalent: g.backpackTalent ?? undefined,
    _verified: g._verified ?? false,
    _sources: g._sources ?? [],
  }));
});

/** Get a gear set by its ID */
export async function getGearSetById(id: string): Promise<IGearSet | undefined> {
  const sets = await getAllGearSets();
  return sets.find((s) => s.id === id);
}

// --- Weapons ---

/** Get all weapons (flattened from class/archetype structure) */
export const getAllWeapons: () => Promise<IWeapon[]> = cachedLoader("weapons", async () => {
  const data = await readDataFile<RawJson[]>("weapons.json");
  const weapons: IWeapon[] = [];
  for (const cls of data) {
    for (const arch of cls.archetypes ?? []) {
      weapons.push({
        id: arch.id,
        name: arch.name,
        iconUrl: arch.iconUrl,
        type: (arch.type ?? cls.class) as WeaponType,
        rpm: arch.rpm ?? 0,
        magSize: arch.magazine ?? 0,
        reloadSpeed: arch.reloadSeconds ?? 0,
        baseDamage: arch.baseDamage ?? 0,
        nativeAttribute: arch.nativeAttribute ?? "",
        modSlots: arch.modSlots ?? [],
        _verified: arch._verified ?? false,
        _sources: arch._sources ?? cls._sources ?? [],
      });
    }
  }
  return weapons;
});

/** Get weapons by type (e.g., "Assault Rifles") */
export async function getWeaponsByType(type: WeaponType): Promise<IWeapon[]> {
  const weapons = await getAllWeapons();
  return weapons.filter((w) => w.type === type);
}

/** Get a weapon by its ID */
export async function getWeaponById(id: string): Promise<IWeapon | undefined> {
  const weapons = await getAllWeapons();
  return weapons.find((w) => w.id === id);
}

// --- Talents ---

/** Get all gear and weapon talents */
export const getAllTalents: () => Promise<{ gear: IGearTalent[]; weapon: IWeaponTalent[] }> = cachedLoader("talents", async () => {
  const [gearData, weaponData] = await Promise.all([
    readDataFile<RawJson[]>("gear-talents.json"),
    readDataFile<RawJson[]>("weapon-talents.json"),
  ]);

  const gear: IGearTalent[] = gearData.map((t) => ({
    id: t.id,
    name: t.name,
    iconUrl: t.iconUrl,
    slot: (t.slot ?? "chest") as TalentSlot,
    description: t.description ?? "",
    isPerfect: false,
    perfectVersion: t.perfectVersion?.name,
    namedItem: t.perfectVersion?.foundOn,
    _verified: t._verified ?? false,
    _sources: t._sources ?? [],
  }));

  const weapon: IWeaponTalent[] = weaponData.map((t) => ({
    id: t.id,
    name: t.name,
    iconUrl: t.iconUrl,
    description: t.description ?? "",
    weaponTypeRestrictions: (t.weaponTypes ?? []) as WeaponType[],
    _verified: t._verified ?? false,
    _sources: t._sources ?? [],
  }));

  return { gear, weapon };
});

/** Get gear talents filtered by slot (chest or backpack) */
export async function getGearTalentsBySlot(slot: TalentSlot): Promise<IGearTalent[]> {
  const { gear } = await getAllTalents();
  return gear.filter((t) => t.slot === slot);
}

/** Get weapon talents compatible with a given weapon type */
export async function getWeaponTalentsByWeaponType(
  type: WeaponType
): Promise<IWeaponTalent[]> {
  const { weapon } = await getAllTalents();
  return weapon.filter(
    (t) => t.weaponTypeRestrictions.length === 0 || t.weaponTypeRestrictions.includes(type)
  );
}

// --- Skills ---

/** Get all skills */
export const getAllSkills: () => Promise<ISkill[]> = cachedLoader("skills", async () => {
  const data = await readDataFile<RawJson[]>("skills.json");
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    iconUrl: s.iconUrl,
    category: s.name as ISkill["category"],
    variants: (s.variants ?? []).map((v: RawJson): ISkillVariant => ({
      id: v.id,
      name: v.name,
      description: v.notes ?? v.scaling ?? "",
      baseStats: {
        cooldown: v.cooldownRange?.tier0 ?? 0,
        duration: v.durationRange?.tier0 ?? 0,
      },
      tierScaling: {
        cooldown: [v.cooldownRange?.tier0 ?? 0, v.cooldownRange?.tier6 ?? 0],
        duration: [v.durationRange?.tier0 ?? 0, v.durationRange?.tier6 ?? 0],
      },
    })),
    _verified: s._verified ?? false,
    _sources: s._sources ?? [],
  }));
});

/** Get a skill by its ID */
export async function getSkillById(id: string): Promise<ISkill | undefined> {
  const skills = await getAllSkills();
  return skills.find((s) => s.id === id);
}

/** Get all variants for a specific skill */
export async function getSkillVariants(skillId: string): Promise<ISkillVariant[]> {
  const skill = await getSkillById(skillId);
  return skill?.variants ?? [];
}

// --- Exotics ---

/** Get all exotic gear pieces */
export const getAllExoticGear: () => Promise<IExoticGear[]> = cachedLoader("exoticGear", async () => {
  const data = await readDataFile<RawJson[]>("exotics-gear.json");
  return data.map((e) => ({
    id: e.id,
    name: e.name,
    iconUrl: e.iconUrl,
    slot: toGearSlot(e.slot ?? "mask"),
    talent: {
      name: e.uniqueTalent?.name ?? "",
      description: e.uniqueTalent?.description ?? "",
    },
    uniqueAttributes: [],
    obtainMethod: e.source ?? "Exotic cache / targeted loot",
    _verified: e._verified ?? false,
    _sources: e._sources ?? [],
  }));
});

/** Get all exotic weapons */
export const getAllExoticWeapons: () => Promise<IExoticWeapon[]> = cachedLoader("exoticWeapons", async () => {
  const data = await readDataFile<RawJson[]>("exotics-weapons.json");
  return data.map((e) => ({
    id: e.id,
    name: e.name,
    iconUrl: e.iconUrl,
    type: (e.category ?? "Assault Rifles") as WeaponType,
    rpm: e.rpm ?? 0,
    magSize: e.magSize ?? 0,
    baseDamage: e.baseDamage ?? 0,
    talent: {
      name: e.uniqueTalent?.name ?? "",
      description: e.uniqueTalent?.description ?? "",
    },
    obtainMethod: e.source ?? "Exotic cache / targeted loot",
    _verified: e._verified ?? false,
    _sources: e._sources ?? [],
  }));
});

/** Get an exotic by its ID (searches both gear and weapons) */
export async function getExoticById(
  id: string
): Promise<IExoticGear | IExoticWeapon | undefined> {
  const [gear, weapons] = await Promise.all([getAllExoticGear(), getAllExoticWeapons()]);
  return gear.find((e) => e.id === id) ?? weapons.find((e) => e.id === id);
}

// --- Named Items ---

/** Get all named items */
export const getAllNamedItems: () => Promise<INamedItem[]> = cachedLoader("namedItems", async () => {
  const data = await readDataFile<RawJson[]>("named-items.json");
  return data.map((n) => ({
    id: n.id,
    name: n.name,
    iconUrl: n.iconUrl,
    brand: n.brandId ?? "",
    slot: toGearSlot(n.slot ?? "mask"),
    perfectTalent: {
      name: n.name,
      description: n.fixedAttribute ?? "",
    },
    uniqueAttributes: n.fixedAttribute ? [n.fixedAttribute] : [],
    _verified: n._verified ?? false,
    _sources: n._sources ?? [],
  }));
});

/** Get named items that belong to a specific brand */
export async function getNamedItemsByBrand(brandId: string): Promise<INamedItem[]> {
  const items = await getAllNamedItems();
  return items.filter((i) => i.brand === brandId);
}

/** Get named items for a specific gear slot */
export async function getNamedItemsBySlot(slot: GearSlot): Promise<INamedItem[]> {
  const items = await getAllNamedItems();
  return items.filter((i) => i.slot === slot);
}

// --- Specializations ---

/** Get a specialization by its ID */
export async function getSpecializationById(
  id: string
): Promise<ISpecialization | undefined> {
  const specs = await getAllSpecializations();
  return specs.find((s) => s.id === id);
}

/** Get all specializations */
export const getAllSpecializations: () => Promise<ISpecialization[]> = cachedLoader("specializations", async () => {
  const data = await readDataFile<RawJson[]>("specializations.json");
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    iconUrl: s.iconUrl,
    type: s.name as SpecializationType,
    signatureWeapon: s.signatureWeapon?.name ?? "",
    passives: (s.keyPassives ?? []).map((p: string) => ({ name: p, description: p })),
    bonusSkillTier: s.bonusSkillTier ? 1 : undefined,
    _verified: s._verified ?? false,
    _sources: s._sources ?? [],
  }));
});

// --- Attributes ---

/** Get the max value for a gear attribute by its ID */
export async function getAttributeMaxValue(
  attributeId: string
): Promise<number | undefined> {
  const data = await readDataFile<RawJson[]>("gear-attributes.json");
  const attr = data.find(
    (a: RawJson) => a.id === attributeId || a.stat === attributeId
  );
  return attr?.maxRoll ?? undefined;
}

/** Get all minor attributes (excludes core attributes) */
export const getAllMinorAttributes: () => Promise<IGearAttribute[]> = cachedLoader("minorAttributes", async () => {
  const data = await readDataFile<RawJson[]>("gear-attributes.json");
  return data
    .filter((a) => a.category?.startsWith("minor_"))
    .map((a) => ({
      id: a.id,
      stat: a.stat ?? "",
      label: a.label ?? a.id,
      maxRoll: a.maxRoll ?? 0,
      unit: a.unit ?? "percent",
      category: a.category ?? "minor_offensive",
    }));
});

// --- Search ---

/** Search result from cross-entity fuzzy search */
interface ISearchResult {
  type: "brand" | "gearset" | "weapon" | "talent" | "skill" | "exotic" | "named";
  id: string;
  name: string;
  score: number;
}

/** Fuzzy search across all entity types by name */
export async function searchEntities(query: string): Promise<ISearchResult[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: ISearchResult[] = [];

  // Helper to score a match (simple substring-based scoring)
  const scoreMatch = (name: string): number => {
    const lowerName = name.toLowerCase();
    if (lowerName === lowerQuery) return 1.0;
    if (lowerName.startsWith(lowerQuery)) return 0.8;
    if (lowerName.includes(lowerQuery)) return 0.5;
    return 0;
  };

  // Search all entity types in parallel
  const [brands, gearSets, weapons, talents, skills, exoticGear, exoticWeapons, namedItems] =
    await Promise.all([
      getAllBrands(),
      getAllGearSets(),
      getAllWeapons(),
      getAllTalents(),
      getAllSkills(),
      getAllExoticGear(),
      getAllExoticWeapons(),
      getAllNamedItems(),
    ]);

  // Score each entity type
  for (const b of brands) {
    const score = scoreMatch(b.name);
    if (score > 0) results.push({ type: "brand", id: b.id, name: b.name, score });
  }

  for (const g of gearSets) {
    const score = scoreMatch(g.name);
    if (score > 0) results.push({ type: "gearset", id: g.id, name: g.name, score });
  }

  for (const w of weapons) {
    const score = scoreMatch(w.name);
    if (score > 0) results.push({ type: "weapon", id: w.id, name: w.name, score });
  }

  for (const t of talents.gear) {
    const score = scoreMatch(t.name);
    if (score > 0) results.push({ type: "talent", id: t.id, name: t.name, score });
  }

  for (const t of talents.weapon) {
    const score = scoreMatch(t.name);
    if (score > 0) results.push({ type: "talent", id: t.id, name: t.name, score });
  }

  for (const s of skills) {
    const score = scoreMatch(s.name);
    if (score > 0) results.push({ type: "skill", id: s.id, name: s.name, score });
  }

  for (const e of exoticGear) {
    const score = scoreMatch(e.name);
    if (score > 0) results.push({ type: "exotic", id: e.id, name: e.name, score });
  }

  for (const e of exoticWeapons) {
    const score = scoreMatch(e.name);
    if (score > 0) results.push({ type: "exotic", id: e.id, name: e.name, score });
  }

  for (const n of namedItems) {
    const score = scoreMatch(n.name);
    if (score > 0) results.push({ type: "named", id: n.id, name: n.name, score });
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
