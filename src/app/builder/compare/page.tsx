// Build comparison page — side-by-side stat comparison of saved builds
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useBuildStore } from "@/hooks/use-build-store";
import { aggregateBuildStats } from "@/lib/calc";
import type { IBuild, IBuildStats } from "@/lib/types";
import { Card, Badge } from "@/components/ui";

/** Stat row definition for comparison grid */
interface StatRow {
  label: string;
  key: keyof IBuildStats | string;
  format: (value: number) => string;
  higherIsBetter: boolean;
}

// Stats to compare
const STAT_ROWS: StatRow[] = [
  { label: "Weapon Damage", key: "totalWeaponDamage", format: (v) => `${(v * 100).toFixed(0)}%`, higherIsBetter: true },
  { label: "Armor", key: "totalArmor", format: (v) => v.toLocaleString(), higherIsBetter: true },
  { label: "Health", key: "totalHealth", format: (v) => v.toLocaleString(), higherIsBetter: true },
  { label: "Skill Tier", key: "totalSkillTier", format: (v) => v.toFixed(0), higherIsBetter: true },
  { label: "CHC", key: "criticalHitChance", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { label: "CHD", key: "criticalHitDamage", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { label: "HSD", key: "headshotDamage", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { label: "Skill Damage", key: "skillDamage", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { label: "Skill Haste", key: "skillHaste", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { label: "Repair Skills", key: "repairSkills", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  { label: "Hazard Protection", key: "hazardProtection", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
];

// DPS stats to compare
const DPS_ROWS: { label: string; key: string }[] = [
  { label: "Body DPS", key: "bodyshot" },
  { label: "Optimal DPS", key: "optimal" },
  { label: "Headshot DPS", key: "headshot" },
];

export default function ComparePage() {
  const savedBuilds = useBuildStore((s) => s.savedBuilds);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Compute stats for selected builds
  const selectedBuilds = useMemo(() => {
    return selectedIds
      .map((id) => savedBuilds.find((b) => b.id === id))
      .filter((b): b is IBuild => b !== undefined);
  }, [selectedIds, savedBuilds]);

  const computedStats = useMemo(() => {
    return selectedBuilds.map((build) => aggregateBuildStats(build));
  }, [selectedBuilds]);

  // Toggle build selection
  const toggleBuild = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // Max 3 builds
      return [...prev, id];
    });
  };

  /** Get diff color class for a stat value relative to the best value */
  const getDiffColor = (value: number, allValues: number[], higherIsBetter: boolean): string => {
    if (allValues.length < 2) return "text-foreground";
    const best = higherIsBetter ? Math.max(...allValues) : Math.min(...allValues);
    const worst = higherIsBetter ? Math.min(...allValues) : Math.max(...allValues);
    if (value === best && best !== worst) return "text-success";
    if (value === worst && best !== worst) return "text-core-red";
    return "text-foreground";
  };

  /** Get stat value from IBuildStats by key */
  const getStatValue = (stats: IBuildStats, key: string): number => {
    return (stats as unknown as Record<string, number>)[key] ?? 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compare Builds</h1>
            <p className="mt-2 text-foreground-secondary">
              Select 2-3 saved builds to compare stats side-by-side.
            </p>
          </div>
          <Link
            href="/builder"
            className="text-sm text-shd-orange hover:text-shd-orange-hover transition-colors"
          >
            Back to Builder
          </Link>
        </div>

        {/* Build selector */}
        <Card className="mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Select Builds ({selectedIds.length}/3)
          </h3>

          {savedBuilds.length === 0 ? (
            <p className="text-sm text-foreground-secondary">
              No saved builds yet.{" "}
              <Link href="/builder" className="text-shd-orange hover:text-shd-orange-hover">
                Create one first
              </Link>.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {savedBuilds.map((build) => {
                const isSelected = selectedIds.includes(build.id);
                const isDisabled = !isSelected && selectedIds.length >= 3;
                return (
                  <button
                    key={build.id}
                    type="button"
                    onClick={() => toggleBuild(build.id)}
                    disabled={isDisabled}
                    className={`text-left rounded-lg border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-shd-orange bg-shd-orange/10"
                        : isDisabled
                          ? "border-border bg-surface opacity-40 cursor-not-allowed"
                          : "border-border bg-surface hover:border-shd-orange/50 hover:bg-surface-hover"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {build.name}
                    </p>
                    <p className="text-xs text-foreground-secondary truncate">
                      {build.description || "No description"}
                    </p>
                    <p className="text-[10px] text-foreground-secondary mt-1">
                      {new Date(build.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Comparison grid */}
        {selectedBuilds.length >= 2 && (
          <>
            {/* Stat comparison table */}
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Stat Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider w-36">
                        Stat
                      </th>
                      {selectedBuilds.map((build) => (
                        <th
                          key={build.id}
                          className="py-2 text-right text-xs font-semibold text-shd-orange uppercase tracking-wider"
                        >
                          {build.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STAT_ROWS.map((row) => {
                      const values = computedStats.map((s) => getStatValue(s, row.key));
                      return (
                        <tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 text-sm text-foreground-secondary">
                            {row.label}
                          </td>
                          {values.map((value, i) => (
                            <td
                              key={selectedBuilds[i].id}
                              className={`py-2 text-sm font-mono text-right ${getDiffColor(value, values, row.higherIsBetter)}`}
                            >
                              {row.format(value)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* DPS comparison bars */}
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">DPS Comparison</h3>
              {DPS_ROWS.map((dpsRow) => {
                const values = computedStats.map(
                  (s) => (s.dps as Record<string, number>)[dpsRow.key] ?? 0
                );
                const maxValue = Math.max(...values, 1);

                return (
                  <div key={dpsRow.key} className="mb-4">
                    <p className="text-xs text-foreground-secondary uppercase tracking-wider mb-2">
                      {dpsRow.label}
                    </p>
                    {selectedBuilds.map((build, i) => (
                      <div key={build.id} className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-foreground w-28 truncate">
                          {build.name}
                        </span>
                        <div className="flex-1 h-5 bg-background-tertiary rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${
                              values[i] === Math.max(...values)
                                ? "bg-shd-orange"
                                : "bg-shd-orange/40"
                            }`}
                            style={{ width: `${(values[i] / maxValue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-foreground w-24 text-right">
                          {values[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </Card>

            {/* Gear slot comparison */}
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-4">Gear Slots</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider w-24">
                        Slot
                      </th>
                      {selectedBuilds.map((build) => (
                        <th
                          key={build.id}
                          className="py-2 text-left text-xs font-semibold text-shd-orange uppercase tracking-wider"
                        >
                          {build.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"] as const).map((slot) => (
                      <tr key={slot} className="border-b border-border/50">
                        <td className="py-2 text-sm text-foreground-secondary">{slot}</td>
                        {selectedBuilds.map((build) => {
                          const piece = build.gear[slot];
                          return (
                            <td key={build.id} className="py-2 text-sm">
                              {piece ? (
                                <span className="text-foreground">
                                  {piece.itemId}
                                  <Badge
                                    variant={
                                      piece.coreAttribute.type === "weaponDamage"
                                        ? "red"
                                        : piece.coreAttribute.type === "armor"
                                          ? "blue"
                                          : "yellow"
                                    }
                                  >
                                    {piece.coreAttribute.type === "weaponDamage"
                                      ? "DPS"
                                      : piece.coreAttribute.type === "armor"
                                        ? "Tank"
                                        : "Skill"}
                                  </Badge>
                                </span>
                              ) : (
                                <span className="text-foreground-secondary italic">Empty</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Prompt to select more builds */}
        {selectedBuilds.length === 1 && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">Select at least one more build to begin comparison.</p>
          </div>
        )}

        {selectedBuilds.length === 0 && savedBuilds.length > 0 && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">Select 2-3 builds above to compare their stats.</p>
          </div>
        )}
      </div>
    </div>
  );
}
