// Stats panel — always-visible computed build statistics from the Zustand store
"use client";

import { useBuildStore } from "@/hooks/use-build-store";

/** Format a number with optional unit suffix */
function fmt(value: number, unit: string = ""): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

/** Single stat row with label and value */
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-foreground-secondary">{label}</span>
      <span className={`text-sm font-medium ${color ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

/** Section header with colored left bar */
function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 mt-4 mb-2 first:mt-0`}>
      <div className={`w-1 h-4 rounded-full ${color}`} />
      <h3 className="text-xs uppercase tracking-wider text-foreground-secondary font-semibold">{title}</h3>
    </div>
  );
}

export default function StatsPanel() {
  const stats = useBuildStore((s) => s.computedStats);

  return (
    <div className="rounded-md border border-border bg-surface p-4 space-y-1">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Build Stats</h2>

      {/* Offensive stats (red) */}
      <SectionHeader title="Offensive" color="bg-core-red" />
      <StatRow label="Weapon Damage" value={fmt(stats.totalWeaponDamage, "%")} color="text-core-red" />
      <StatRow label="Critical Hit Chance" value={fmt(stats.criticalHitChance, "%")} color="text-core-red" />
      <StatRow label="Critical Hit Damage" value={fmt(stats.criticalHitDamage, "%")} color="text-core-red" />
      <StatRow label="Headshot Damage" value={fmt(stats.headshotDamage, "%")} color="text-core-red" />
      <StatRow label="Weapon Handling" value={fmt(stats.weaponHandlingBonus, "%")} />

      {/* Defensive stats (blue) */}
      <SectionHeader title="Defensive" color="bg-core-blue" />
      <StatRow label="Total Armor" value={fmt(stats.totalArmor)} color="text-core-blue" />
      <StatRow label="Total Health" value={fmt(stats.totalHealth)} color="text-core-blue" />
      <StatRow label="Hazard Protection" value={fmt(stats.hazardProtection, "%")} />
      <StatRow label="Explosive Resistance" value={fmt(stats.explosiveResistance, "%")} />

      {/* Skill stats (yellow) */}
      <SectionHeader title="Skill" color="bg-core-yellow" />
      <StatRow label="Skill Tier" value={stats.totalSkillTier.toFixed(0)} color="text-core-yellow" />
      <StatRow label="Skill Damage" value={fmt(stats.skillDamage, "%")} color="text-core-yellow" />
      <StatRow label="Repair Skills" value={fmt(stats.repairSkills, "%")} />
      <StatRow label="Skill Haste" value={fmt(stats.skillHaste, "%")} />
      <StatRow label="Skill Duration" value={fmt(stats.skillDuration, "%")} />

      {/* DPS Estimates */}
      <SectionHeader title="DPS Estimate" color="bg-shd-orange" />
      <StatRow label="Bodyshot DPS" value={fmt(stats.dps.bodyshot)} />
      <StatRow label="Optimal DPS" value={fmt(stats.dps.optimal)} />
      <StatRow label="Headshot DPS" value={fmt(stats.dps.headshot)} />

      {/* Active Brand Bonuses */}
      {stats.activeBrandBonuses.length > 0 && (
        <>
          <SectionHeader title="Brand Bonuses" color="bg-shd-orange" />
          {stats.activeBrandBonuses.map((brand) => (
            <div key={brand.brandId} className="py-1">
              <div className="text-xs font-medium text-foreground">
                {brand.brandId}{" "}
                <span className="text-foreground-secondary">({brand.piecesEquipped}pc)</span>
              </div>
              {brand.activeBonuses.map((bonus, i) => (
                <div key={i} className="text-xs text-foreground-secondary pl-2">
                  +{bonus.value}{bonus.unit} {bonus.stat}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Active Gear Set Bonuses */}
      {stats.activeGearSetBonuses.length > 0 && (
        <>
          <SectionHeader title="Gear Set Bonuses" color="bg-shd-orange" />
          {stats.activeGearSetBonuses.map((gs) => (
            <div key={gs.setId} className="py-1">
              <div className="text-xs font-medium text-foreground">
                {gs.setId}{" "}
                <span className="text-foreground-secondary">({gs.piecesEquipped}pc)</span>
              </div>
              {gs.activeBonuses.map((bonus, i) => (
                <div key={i} className="text-xs text-foreground-secondary pl-2">
                  {bonus.description}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Active Talents */}
      {stats.activeTalents.length > 0 && (
        <>
          <SectionHeader title="Active Talents" color="bg-shd-orange" />
          {stats.activeTalents.map((talent) => (
            <div key={`${talent.talentId}-${talent.source}`} className="py-1">
              <div className="text-xs font-medium text-shd-orange">{talent.talentId}</div>
              <div className="text-xs text-foreground-secondary pl-2">{talent.description}</div>
              <div className="text-xs text-foreground-secondary pl-2 italic">Source: {talent.source}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
