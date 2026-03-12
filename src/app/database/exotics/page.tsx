// Exotics database page — loads real data from data-loader
"use client";

import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";
import { getAllExoticGear, getAllExoticWeapons } from "@/lib/data-loader";
import type { IExoticGear, IExoticWeapon } from "@/lib/types";

// Obtain method badge colors
const obtainColors: Record<string, string> = {
  Raid: "bg-core-red/20 text-core-red",
  Legendary: "bg-core-yellow/20 text-core-yellow",
  "Dark Zone": "bg-core-red/20 text-core-red",
  Targeted: "bg-core-blue/20 text-core-blue",
  Season: "bg-core-yellow/20 text-core-yellow",
  Crafted: "bg-success/20 text-success",
  "Open World": "bg-shd-orange/20 text-shd-orange",
  Exotic: "bg-shd-orange/20 text-shd-orange",
};

// Match obtain method to color by checking if key is contained in the method string
function getObtainColor(method: string): string {
  for (const [key, color] of Object.entries(obtainColors)) {
    if (method.includes(key)) return color;
  }
  return "bg-surface-hover text-foreground-secondary";
}

export default function ExoticsPage() {
  const [exoticGearData, setExoticGearData] = useState<IExoticGear[]>([]);
  const [exoticWeaponsData, setExoticWeaponsData] = useState<IExoticWeapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load real data
  useEffect(() => {
    Promise.all([getAllExoticGear(), getAllExoticWeapons()]).then(([gear, weapons]) => {
      setExoticGearData(gear);
      setExoticWeaponsData(weapons);
      setLoading(false);
    });
  }, []);

  const exoticGear = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return exoticGearData;
    return exoticGearData.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.talent.name.toLowerCase().includes(q) ||
        e.slot.toLowerCase().includes(q)
    );
  }, [exoticGearData, search]);

  const exoticWeapons = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return exoticWeaponsData;
    return exoticWeaponsData.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.talent.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
    );
  }, [exoticWeaponsData, search]);

  const totalExotics = exoticGearData.length + exoticWeaponsData.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-surface" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-lg bg-surface" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Exotics</h1>
          <p className="mt-2 text-foreground-secondary">
            {totalExotics} exotic items — {exoticGearData.length} gear and {exoticWeaponsData.length} weapons with unique talents.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar
            placeholder="Search exotics by name, talent, or type..."
            onChange={setSearch}
          />
        </div>

        {/* Exotic Gear Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-shd-orange" />
            Exotic Gear
            <span className="text-sm font-normal text-foreground-secondary">
              ({exoticGear.length})
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exoticGear.map((item) => (
              <EntityCard
                key={item.id}
                title={item.name}
                iconUrl={item.iconUrl}
                subtitle={item.slot}
                badges={[
                  { label: "Exotic", colorClass: "bg-shd-orange/20 text-shd-orange" },
                  { label: item.obtainMethod, colorClass: getObtainColor(item.obtainMethod) },
                ]}
                expanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                {/* Talent info */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-shd-orange mb-1">
                    {item.talent.name}
                  </h4>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {item.talent.description}
                  </p>
                </div>

                {/* How to obtain */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    How to Obtain:
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getObtainColor(item.obtainMethod)}`}>
                    {item.obtainMethod}
                  </span>
                </div>

                <UseInBuilderButton itemId={item.id} />
              </EntityCard>
            ))}
          </div>

          {exoticGear.length === 0 && (
            <p className="text-sm text-foreground-secondary py-4">
              No exotic gear matches your search.
            </p>
          )}
        </section>

        {/* Exotic Weapons Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-core-red" />
            Exotic Weapons
            <span className="text-sm font-normal text-foreground-secondary">
              ({exoticWeapons.length})
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exoticWeapons.map((item) => (
              <EntityCard
                key={item.id}
                title={item.name}
                iconUrl={item.iconUrl}
                subtitle={item.type}
                badges={[
                  { label: "Exotic", colorClass: "bg-shd-orange/20 text-shd-orange" },
                  { label: item.type, colorClass: "bg-surface-hover text-foreground-secondary" },
                  { label: item.obtainMethod, colorClass: getObtainColor(item.obtainMethod) },
                ]}
                expanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                {/* Talent info */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-shd-orange mb-1">
                    {item.talent.name}
                  </h4>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {item.talent.description}
                  </p>
                </div>

                {/* Stats */}
                {(item.rpm > 0 || item.magSize > 0) && (
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="rounded bg-background-secondary px-2 py-1.5">
                      <p className="text-[10px] text-foreground-secondary uppercase">RPM</p>
                      <p className="text-sm font-mono text-foreground">{item.rpm.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-background-secondary px-2 py-1.5">
                      <p className="text-[10px] text-foreground-secondary uppercase">MAG</p>
                      <p className="text-sm font-mono text-foreground">{item.magSize}</p>
                    </div>
                    <div className="rounded bg-background-secondary px-2 py-1.5">
                      <p className="text-[10px] text-foreground-secondary uppercase">DMG</p>
                      <p className="text-sm font-mono text-foreground">{item.baseDamage.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* How to obtain */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    How to Obtain:
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getObtainColor(item.obtainMethod)}`}>
                    {item.obtainMethod}
                  </span>
                </div>

                <UseInBuilderButton itemId={item.id} />
              </EntityCard>
            ))}
          </div>

          {exoticWeapons.length === 0 && (
            <p className="text-sm text-foreground-secondary py-4">
              No exotic weapons match your search.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
