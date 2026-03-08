/**
 * Stat aggregator — computes all aggregated build stats from a complete IBuild.
 *
 * Walks every equipped gear piece, weapon, and SHD watch config to produce
 * a single IBuildStats snapshot covering cores, minors, brand/gear set bonuses,
 * active talents, and preliminary DPS estimates.
 */

import type {
  IBuild,
  IBuildStats,
  IBuildGearPiece,
  IBrandBonus,
  IGearSetBonus,
} from "./types";

// ---------------------------------------------------------------------------
// Division 2 base values
// ---------------------------------------------------------------------------

/** Base armor granted per blue (armor) core attribute */
export const ARMOR_PER_CORE = 170_370;

/** Maximum number of core attributes on gear (6 slots) */
export const MAX_CORES = 6;

/** Base agent health before bonuses */
export const BASE_HEALTH = 245_000;

/** Weapon damage bonus per red core (as a decimal, e.g. 0.15 = 15%) */
export const WEAPON_DAMAGE_PER_RED_CORE = 0.15;

/** Critical hit chance hard cap (60%) */
export const CHC_CAP = 0.60;

/** Base critical hit damage (25%) */
export const BASE_CHD = 0.25;

/** Base headshot damage (0% — weapon-type natives applied separately) */
export const BASE_HSD = 0.0;

// ---------------------------------------------------------------------------
// Minor attribute ID → stat field mapping
// ---------------------------------------------------------------------------

/** Maps known minor attribute IDs to their corresponding IBuildStats field */
const MINOR_STAT_MAP: Record<string, keyof IBuildStats> = {
  criticalHitChance: "criticalHitChance",
  chc: "criticalHitChance",
  criticalHitDamage: "criticalHitDamage",
  chd: "criticalHitDamage",
  headshotDamage: "headshotDamage",
  hsd: "headshotDamage",
  weaponHandling: "weaponHandlingBonus",
  skillDamage: "skillDamage",
  repairSkills: "repairSkills",
  skillHaste: "skillHaste",
  skillDuration: "skillDuration",
  hazardProtection: "hazardProtection",
  explosiveResistance: "explosiveResistance",
  health: "totalHealth",
  armor: "totalArmor",
};

// ---------------------------------------------------------------------------
// Helper: count pieces per brand / gear set
// ---------------------------------------------------------------------------

interface PieceCount {
  id: string;
  source: "brand" | "gearset";
  count: number;
}

/**
 * Counts how many pieces of each brand or gear set are equipped.
 */
function countPieceSets(pieces: IBuildGearPiece[]): PieceCount[] {
  const map = new Map<string, PieceCount>();

  for (const piece of pieces) {
    // Named items count toward their parent brand
    const source = piece.source === "named" ? "brand" : piece.source;
    if (source !== "brand" && source !== "gearset") continue;

    const existing = map.get(piece.itemId);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(piece.itemId, { id: piece.itemId, source, count: 1 });
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Aggregates all stats from a complete build into a single IBuildStats object.
 *
 * Processing order:
 * 1. Sum core attributes (weapon damage %, armor flat, skill tier count)
 * 2. Sum minor attributes into their respective stat buckets
 * 3. Count brand pieces and resolve active brand bonuses
 * 4. Count gear set pieces and resolve active gear set bonuses
 * 5. Collect active talents from chest and backpack
 * 6. Apply SHD watch bonuses
 * 7. Enforce caps (CHC 60%, skill tier 6)
 */
export function aggregateBuildStats(build: IBuild): IBuildStats {
  // Initialize zeroed stats
  const stats: IBuildStats = {
    totalWeaponDamage: 0,
    totalArmor: 0,
    totalSkillTier: 0,
    totalHealth: BASE_HEALTH,
    criticalHitChance: 0,
    criticalHitDamage: BASE_CHD,
    headshotDamage: BASE_HSD,
    weaponHandlingBonus: 0,
    skillDamage: 0,
    repairSkills: 0,
    skillHaste: 0,
    skillDuration: 0,
    hazardProtection: 0,
    explosiveResistance: 0,
    activeBrandBonuses: [],
    activeGearSetBonuses: [],
    activeTalents: [],
    dps: { bodyshot: 0, optimal: 0, headshot: 0 },
  };

  // Collect all equipped gear pieces
  const equippedPieces: IBuildGearPiece[] = Object.values(build.gear).filter(
    (p): p is IBuildGearPiece => p !== undefined && p !== null
  );

  // -----------------------------------------------------------------------
  // Step 1 & 2: Sum core and minor attributes from gear
  // -----------------------------------------------------------------------
  let redCores = 0;
  let blueCores = 0;
  let yellowCores = 0;

  for (const piece of equippedPieces) {
    // Core attributes
    switch (piece.coreAttribute.type) {
      case "weaponDamage":
        redCores += 1;
        // Value is stored as a percentage (e.g. 15 for 15%)
        stats.totalWeaponDamage += piece.coreAttribute.value / 100;
        break;
      case "armor":
        blueCores += 1;
        stats.totalArmor += ARMOR_PER_CORE;
        break;
      case "skillTier":
        yellowCores += 1;
        stats.totalSkillTier += 1;
        break;
    }

    // Minor attributes
    for (const attr of piece.minorAttributes) {
      const field = MINOR_STAT_MAP[attr.attributeId];
      if (field && typeof stats[field] === "number") {
        // Minor attribute values stored as percentages (e.g. 6 for 6% CHC)
        (stats[field] as number) += attr.value / 100;
      }
    }

    // Mod slot bonus (treated like a minor attribute)
    if (piece.modSlot) {
      const field = MINOR_STAT_MAP[piece.modSlot.modId];
      if (field && typeof stats[field] === "number") {
        (stats[field] as number) += piece.modSlot.value / 100;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Step 3: Brand set bonuses
  // -----------------------------------------------------------------------
  const pieceCounts = countPieceSets(equippedPieces);

  for (const entry of pieceCounts) {
    if (entry.source === "brand") {
      // Brand bonuses activate at 1pc, 2pc, 3pc thresholds
      // Since we don't have the brand data files loaded here, we record
      // the counts so the UI or a higher-level layer can resolve them.
      const activeBonuses: IBrandBonus[] = [];
      // Placeholder: actual bonus resolution requires data lookup
      stats.activeBrandBonuses.push({
        brandId: entry.id,
        piecesEquipped: entry.count,
        activeBonuses,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Step 4: Gear set bonuses
  // -----------------------------------------------------------------------
  for (const entry of pieceCounts) {
    if (entry.source === "gearset") {
      const activeBonuses: IGearSetBonus[] = [];
      // Gear sets activate at 2pc, 3pc, 4pc thresholds
      stats.activeGearSetBonuses.push({
        setId: entry.id,
        piecesEquipped: entry.count,
        activeBonuses,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Step 5: Active talents (only chest and backpack have talents)
  // -----------------------------------------------------------------------
  for (const piece of equippedPieces) {
    if (piece.talent && (piece.slotId === "Chest" || piece.slotId === "Backpack")) {
      stats.activeTalents.push({
        talentId: piece.talent.talentId,
        source: piece.slotId,
        description: "", // Resolved by data lookup layer
      });
    }
  }

  // -----------------------------------------------------------------------
  // Step 6: SHD watch bonuses
  // -----------------------------------------------------------------------
  const watch = build.shdWatch;
  stats.totalWeaponDamage += watch.weaponDamage / 100;
  stats.totalArmor += watch.armor; // Watch armor is flat
  stats.totalSkillTier += watch.skillTier;
  stats.criticalHitChance += watch.criticalHitChance / 100;
  stats.criticalHitDamage += watch.criticalHitDamage / 100;
  stats.headshotDamage += watch.headshotDamage / 100;
  stats.totalHealth += watch.health;

  // -----------------------------------------------------------------------
  // Step 7: Enforce caps
  // -----------------------------------------------------------------------

  // CHC hard cap at 60%
  if (stats.criticalHitChance > CHC_CAP) {
    stats.criticalHitChance = CHC_CAP;
  }

  // Skill tier capped at 6
  if (stats.totalSkillTier > 6) {
    stats.totalSkillTier = 6;
  }

  return stats;
}
