// Build serializer — converts a build into human-readable text for AI prompts

import type { IBuild, IBuildStats } from "@/lib/types";

/**
 * Serialize a build into a structured text summary suitable for AI analysis.
 * Includes gear pieces, weapons, skills, specialization, and computed stats.
 */
export function serializeBuildForAI(build: IBuild, stats?: IBuildStats): string {
  const sections: string[] = [];

  // Header
  sections.push(`BUILD: ${build.name}`);
  if (build.description) {
    sections.push(`Description: ${build.description}`);
  }
  sections.push("");

  // Specialization
  if (build.specialization) {
    sections.push(`SPECIALIZATION: ${build.specialization}`);
    sections.push("");
  }

  // Gear pieces
  sections.push("GEAR:");
  const gearSlots = ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"] as const;
  for (const slot of gearSlots) {
    const piece = build.gear[slot];
    if (!piece) {
      sections.push(`  ${slot}: (empty)`);
      continue;
    }

    // Format core attribute type as readable label
    const coreLabel = formatCoreAttribute(piece.coreAttribute?.type);
    const coreValue = piece.coreAttribute?.value ?? 0;
    let line = `  ${slot}: ${piece.itemId} [${piece.source}] — Core: ${coreLabel} ${coreValue}`;

    // Minor attributes
    if (piece.minorAttributes && piece.minorAttributes.length > 0) {
      const minors = piece.minorAttributes
        .map((a) => `${a.attributeId} ${a.value}`)
        .join(", ");
      line += ` | Minor: ${minors}`;
    }

    // Talent (chest/backpack only)
    if (piece.talent) {
      line += ` | Talent: ${piece.talent.talentId}`;
    }

    // Mod slot
    if (piece.modSlot) {
      line += ` | Mod: ${piece.modSlot.modId} ${piece.modSlot.value}`;
    }

    sections.push(line);
  }
  sections.push("");

  // Weapons
  sections.push("WEAPONS:");
  const weaponSlots = ["primary", "secondary", "sidearm"] as const;
  for (const slot of weaponSlots) {
    const weapon = build.weapons[slot];
    if (!weapon) {
      sections.push(`  ${slot}: (empty)`);
      continue;
    }
    let line = `  ${slot}: ${weapon.weaponId}`;
    if (weapon.talent) {
      line += ` — Talent: ${weapon.talent.talentId}`;
    }
    // Weapon mods
    const activeMods = Object.entries(weapon.mods || {}).filter(([, v]) => v);
    if (activeMods.length > 0) {
      const modStr = activeMods.map(([k, v]) => `${k}: ${v}`).join(", ");
      line += ` | Mods: ${modStr}`;
    }
    sections.push(line);
  }
  sections.push("");

  // Skills
  sections.push("SKILLS:");
  const skillSlots = ["skill1", "skill2"] as const;
  for (const slot of skillSlots) {
    const skill = build.skills[slot];
    if (!skill) {
      sections.push(`  ${slot}: (empty)`);
      continue;
    }
    let line = `  ${slot}: ${skill.skillVariantId}`;
    if (skill.mods && skill.mods.length > 0) {
      line += ` | Mods: ${skill.mods.join(", ")}`;
    }
    sections.push(line);
  }
  sections.push("");

  // SHD Watch
  if (build.shdWatch) {
    const watch = build.shdWatch;
    const watchParts = [
      `WD+${watch.weaponDamage}`,
      `Armor+${watch.armor}`,
      `ST+${watch.skillTier}`,
      `CHC+${watch.criticalHitChance}`,
      `CHD+${watch.criticalHitDamage}`,
      `HSD+${watch.headshotDamage}`,
      `HP+${watch.health}`,
    ];
    sections.push(`SHD WATCH: ${watchParts.join(", ")}`);
    sections.push("");
  }

  // Computed stats (if available)
  if (stats) {
    sections.push("COMPUTED STATS:");
    sections.push(`  Total Weapon Damage: ${formatPercent(stats.totalWeaponDamage)}`);
    sections.push(`  Total Armor: ${formatNumber(stats.totalArmor)}`);
    sections.push(`  Total Skill Tier: ${stats.totalSkillTier}`);
    sections.push(`  CHC: ${formatPercent(stats.criticalHitChance)} / 60% cap`);
    sections.push(`  CHD: ${formatPercent(stats.criticalHitDamage)}`);
    sections.push(`  HSD: ${formatPercent(stats.headshotDamage)}`);

    if (stats.dps) {
      sections.push(`  DPS (bodyshot): ${formatNumber(stats.dps.bodyshot)}`);
      sections.push(`  DPS (optimal): ${formatNumber(stats.dps.optimal)}`);
      sections.push(`  DPS (headshot): ${formatNumber(stats.dps.headshot)}`);
    }

    // Active brand bonuses
    if (stats.activeBrandBonuses && stats.activeBrandBonuses.length > 0) {
      sections.push("");
      sections.push("  ACTIVE BRAND BONUSES:");
      for (const brand of stats.activeBrandBonuses) {
        sections.push(`    ${brand.brandId}: ${brand.piecesEquipped}pc — ${brand.activeBonuses.map((b) => `${b.stat} ${b.value}${b.unit}`).join(", ")}`);
      }
    }

    // Active gear set bonuses
    if (stats.activeGearSetBonuses && stats.activeGearSetBonuses.length > 0) {
      sections.push("");
      sections.push("  ACTIVE GEAR SET BONUSES:");
      for (const set of stats.activeGearSetBonuses) {
        sections.push(`    ${set.setId}: ${set.piecesEquipped}pc — ${set.activeBonuses.map((b) => b.description ?? `${b.stat ?? ""} ${b.value ?? ""}`).join(", ")}`);
      }
    }

    // Active talents
    if (stats.activeTalents && stats.activeTalents.length > 0) {
      sections.push("");
      sections.push("  ACTIVE TALENTS:");
      for (const talent of stats.activeTalents) {
        sections.push(`    ${talent.talentId} (${talent.source}): ${talent.description}`);
      }
    }
  }

  return sections.join("\n");
}

/** Format a core attribute type as a readable label */
function formatCoreAttribute(type?: string): string {
  switch (type) {
    case "weaponDamage":
      return "Weapon Damage";
    case "armor":
      return "Armor";
    case "skillTier":
      return "Skill Tier";
    default:
      return type ?? "Unknown";
  }
}

/** Format a number with commas */
function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Format a decimal as a percentage */
function formatPercent(n: number): string {
  // If already a percentage (>1), show directly; otherwise convert
  const pct = n > 1 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
}
