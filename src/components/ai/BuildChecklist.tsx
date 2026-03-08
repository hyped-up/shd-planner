"use client";

// Build Checklist — AI-free build validation that works without any API key
// Evaluates a build against common Division 2 optimization rules

import { useMemo } from "react";
import type { IBuild, IBuildStats } from "@/lib/types";

/** Individual checklist item result */
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "good" | "warning" | "issue";
  currentValue: string;
  targetValue: string;
}

interface BuildChecklistProps {
  build: IBuild;
  stats?: IBuildStats;
}

export default function BuildChecklist({ build, stats }: BuildChecklistProps) {
  // Evaluate all checklist items based on the current build and stats
  const items = useMemo(() => evaluateBuild(build, stats), [build, stats]);

  // Count statuses for summary
  const counts = useMemo(() => {
    const c = { good: 0, warning: 0, issue: 0 };
    for (const item of items) c[item.status]++;
    return c;
  }, [items]);

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-100">Build Checklist</h3>
        {/* Status summary pills */}
        <div className="flex items-center gap-2 text-xs">
          {counts.good > 0 && (
            <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-green-400">
              {counts.good} good
            </span>
          )}
          {counts.warning > 0 && (
            <span className="rounded-full bg-yellow-900/50 px-2 py-0.5 text-yellow-400">
              {counts.warning} warn
            </span>
          )}
          {counts.issue > 0 && (
            <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-red-400">
              {counts.issue} issue
            </span>
          )}
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </div>

      <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
        This checklist runs locally with no AI required. It checks your build against common
        Division 2 optimization rules.
      </p>
    </div>
  );
}

/** Single checklist row with status indicator */
function ChecklistRow({ item }: { item: ChecklistItem }) {
  // Color mapping for status
  const statusColors = {
    good: { bg: "bg-green-900/30", border: "border-green-800", text: "text-green-400", icon: "text-green-500" },
    warning: { bg: "bg-yellow-900/20", border: "border-yellow-800/50", text: "text-yellow-400", icon: "text-yellow-500" },
    issue: { bg: "bg-red-900/20", border: "border-red-800/50", text: "text-red-400", icon: "text-red-500" },
  };
  const colors = statusColors[item.status];

  return (
    <div className={`rounded-md border ${colors.border} ${colors.bg} p-3`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={`mt-0.5 ${colors.icon}`}>
          {item.status === "good" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : item.status === "warning" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-neutral-200">{item.label}</span>
            <span className={`text-xs font-mono ${colors.text}`}>
              {item.currentValue}
              {item.targetValue ? ` / ${item.targetValue}` : ""}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Evaluate a build against common optimization rules.
 * Returns checklist items with status and current values.
 */
function evaluateBuild(build: IBuild, stats?: IBuildStats): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Count gear slots filled
  const filledSlots = Object.values(build.gear).filter(Boolean).length;

  // Count core attribute types
  const coreCounts = { weaponDamage: 0, armor: 0, skillTier: 0 };
  for (const piece of Object.values(build.gear)) {
    if (piece?.coreAttribute?.type && piece.coreAttribute.type in coreCounts) {
      coreCounts[piece.coreAttribute.type as keyof typeof coreCounts]++;
    }
  }

  // 1. CHC cap check
  const chc = stats?.criticalHitChance ?? 0;
  // Normalize: if stored as decimal (0-1), convert to percentage
  const chcPct = chc > 1 ? chc : chc * 100;
  items.push({
    id: "chc-cap",
    label: "Critical Hit Chance near 60% cap",
    description:
      chcPct > 60
        ? "You are over the 60% cap. Reroll excess CHC to CHD or another stat."
        : chcPct >= 50
          ? "Good CHC level. Close to the cap without wasting stats."
          : chcPct >= 30
            ? "CHC is moderate. Consider adding more if running a crit build."
            : "CHC is low. Fine for non-crit builds, otherwise add more.",
    status: chcPct > 60 ? "issue" : chcPct >= 50 ? "good" : chcPct >= 30 ? "warning" : "good",
    currentValue: `${chcPct.toFixed(1)}%`,
    targetValue: "60%",
  });

  // 2. Brand bonus alignment
  const brandPieces: Record<string, number> = {};
  for (const piece of Object.values(build.gear)) {
    if (piece?.source === "brand" || piece?.source === "named") {
      const brandId = piece.itemId?.split("-")[0] ?? piece.itemId;
      brandPieces[brandId] = (brandPieces[brandId] ?? 0) + 1;
    }
  }
  const maxBrandCount = Math.max(0, ...Object.values(brandPieces));
  // Check if brand bonuses are offensive for red builds, defensive for blue, etc.
  const brandAligned = maxBrandCount >= 3 || coreCounts.weaponDamage === 0;
  items.push({
    id: "brand-alignment",
    label: "Brand bonuses aligned with build goal",
    description: brandAligned
      ? "Your brand selection supports your core attribute focus."
      : "Consider consolidating brands to activate 3-piece bonuses.",
    status: brandAligned ? "good" : "warning",
    currentValue: `${Object.keys(brandPieces).length} brands`,
    targetValue: "",
  });

  // 3. Three-piece brand bonus
  const hasThreePiece = maxBrandCount >= 3;
  items.push({
    id: "three-piece-brand",
    label: "3+ piece brand bonus on main brand",
    description: hasThreePiece
      ? `Your highest brand has ${maxBrandCount} pieces, activating all brand bonuses.`
      : "No brand has 3 pieces. You are missing the strongest brand bonus tier.",
    status: hasThreePiece ? "good" : "warning",
    currentValue: `${maxBrandCount}pc max`,
    targetValue: "3pc",
  });

  // 4. Exotic slot check
  const exoticPieces = Object.values(build.gear).filter((p) => p?.source === "exotic");
  const hasExotic = exoticPieces.length > 0;
  items.push({
    id: "exotic-slot",
    label: "Exotic in the right slot",
    description: hasExotic
      ? `Exotic equipped: ${exoticPieces.map((p) => p!.itemId).join(", ")}`
      : "No exotic gear equipped. Consider adding one for a powerful unique talent.",
    status: hasExotic ? "good" : "warning",
    currentValue: hasExotic ? `${exoticPieces.length} exotic` : "None",
    targetValue: "",
  });

  // 5. Chest and backpack talent synergy
  const chestTalent = build.gear.Chest?.talent?.talentId;
  const backpackTalent = build.gear.Backpack?.talent?.talentId;
  const hasBothTalents = !!chestTalent && !!backpackTalent;
  // Known synergy pairs
  const synergyPairs: Record<string, string[]> = {
    glass_cannon: ["vigilance", "composure", "companion"],
    obliterate: ["vigilance", "composure", "companion"],
    spotter: ["vigilance", "combined_arms", "companion"],
    kinetic_momentum: ["tech_support", "combined_arms", "shock_and_awe"],
    unbreakable: ["protector", "adrenaline_rush"],
  };
  let talentsSynergize = false;
  if (chestTalent && backpackTalent) {
    const chestKey = chestTalent.toLowerCase().replace(/\s+/g, "_");
    const bpKey = backpackTalent.toLowerCase().replace(/\s+/g, "_");
    talentsSynergize =
      synergyPairs[chestKey]?.includes(bpKey) || synergyPairs[bpKey]?.includes(chestKey) || false;
  }
  items.push({
    id: "talent-synergy",
    label: "Chest and backpack talents synergize",
    description: !hasBothTalents
      ? "Missing chest or backpack talent. Both slots should have a talent."
      : talentsSynergize
        ? `${chestTalent} + ${backpackTalent} is a strong pairing.`
        : `${chestTalent} + ${backpackTalent} — verify these talents complement each other.`,
    status: !hasBothTalents ? "issue" : talentsSynergize ? "good" : "warning",
    currentValue: hasBothTalents ? `${chestTalent} + ${backpackTalent}` : "Incomplete",
    targetValue: "",
  });

  // 6. Specialization alignment
  const spec = build.specialization;
  // Recommended specializations by dominant core type
  const specRecommendations: Record<string, string[]> = {
    weaponDamage: ["Sharpshooter", "Gunner", "Demolitionist"],
    armor: ["Firewall", "Gunner", "Survivalist"],
    skillTier: ["Technician", "Demolitionist", "Survivalist"],
  };
  const dominantCore = (Object.entries(coreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "weaponDamage") as keyof typeof specRecommendations;
  const specAligned = spec ? specRecommendations[dominantCore]?.includes(spec) ?? false : false;
  items.push({
    id: "spec-alignment",
    label: "Specialization matches build type",
    description: !spec
      ? "No specialization selected. Choose one to gain passive bonuses and a signature weapon."
      : specAligned
        ? `${spec} is a strong choice for your ${dominantCore === "weaponDamage" ? "DPS" : dominantCore === "armor" ? "tank" : "skill"} build.`
        : `${spec} may not be optimal for your build. Consider: ${specRecommendations[dominantCore]?.join(", ")}.`,
    status: !spec ? "issue" : specAligned ? "good" : "warning",
    currentValue: spec ?? "None",
    targetValue: "",
  });

  // 7. Survivability check
  const blueCount = coreCounts.armor;
  // Check if running glass cannon with no blues
  const isGlassCannon = chestTalent?.toLowerCase().replace(/\s+/g, "_") === "glass_cannon";
  items.push({
    id: "survivability",
    label: "Sufficient survivability for content level",
    description: isGlassCannon && blueCount === 0
      ? "Running Glass Cannon with zero armor cores. Very high risk in Legendary/Raid content."
      : blueCount >= 2
        ? `${blueCount} blue cores provide solid survivability.`
        : blueCount === 1
          ? "1 blue core offers minimal survivability. Sufficient for Heroic with good positioning."
          : "Zero armor cores. This is a glass cannon setup — play carefully.",
    status: isGlassCannon && blueCount === 0 ? "issue" : blueCount >= 1 ? "good" : "warning",
    currentValue: `${blueCount} blue cores`,
    targetValue: "",
  });

  // 8. Gear slots filled
  items.push({
    id: "slots-filled",
    label: "All gear slots filled",
    description:
      filledSlots === 6
        ? "All 6 gear slots are equipped."
        : `${6 - filledSlots} empty slot(s). Fill all slots for maximum stats.`,
    status: filledSlots === 6 ? "good" : filledSlots >= 4 ? "warning" : "issue",
    currentValue: `${filledSlots}/6`,
    targetValue: "6/6",
  });

  return items;
}
