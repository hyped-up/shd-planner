// Talents database page — loads real data from data-loader
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, FilterPanel } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";
import { getAllTalents } from "@/lib/data-loader";
import type { IGearTalent, IWeaponTalent } from "@/lib/types";

const SLOT_OPTIONS = ["chest", "backpack"];

// Color mapping for damage type badges
const damageTypeColors: Record<string, { bg: string; text: string }> = {
  additive: { bg: "bg-core-blue/20", text: "text-core-blue" },
  amplified: { bg: "bg-core-red/20", text: "text-core-red" },
  multiplicative: { bg: "bg-core-yellow/20", text: "text-core-yellow" },
};

export default function TalentsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-foreground-secondary">Loading talents...</div>}>
      <TalentsPage />
    </Suspense>
  );
}

function TalentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load real data
  const [gearTalentsData, setGearTalentsData] = useState<IGearTalent[]>([]);
  const [weaponTalentsData, setWeaponTalentsData] = useState<IWeaponTalent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTalents().then(({ gear, weapon }) => {
      setGearTalentsData(gear);
      setWeaponTalentsData(weapon);
      setLoading(false);
    });
  }, []);

  const initialSearch = searchParams.get("q") || "";
  const initialSlots = searchParams.get("slot")?.split(",").filter(Boolean) || [];

  const [search, setSearch] = useState(initialSearch);
  const [slotFilter, setSlotFilter] = useState<string[]>(initialSlots);

  // URL sync
  const updateUrl = (q: string, slots: string[]) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (slots.length > 0) params.set("slot", slots.join(","));
    const qs = params.toString();
    router.replace(`/database/talents${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateUrl(value, slotFilter);
  };

  const handleSlotChange = (selected: string[]) => {
    setSlotFilter(selected);
    updateUrl(search, selected);
  };

  // Filter gear talents
  const gearTalents = useMemo(() => {
    return gearTalentsData.filter((t) => {
      const q = search.toLowerCase();
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (slotFilter.length > 0 && !slotFilter.includes(t.slot)) return false;
      return true;
    });
  }, [gearTalentsData, search, slotFilter]);

  // Filter weapon talents
  const weaponTalents = useMemo(() => {
    return weaponTalentsData.filter((t) => {
      const q = search.toLowerCase();
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [weaponTalentsData, search]);

  const totalTalents = gearTalentsData.length + weaponTalentsData.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-surface" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-surface" />
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
          <h1 className="text-3xl font-bold text-foreground">Talents</h1>
          <p className="mt-2 text-foreground-secondary">
            {totalTalents} talents — {gearTalentsData.length} gear and {weaponTalentsData.length} weapon talents.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-56 shrink-0">
            <FilterPanel
              title="Gear Slot"
              options={SLOT_OPTIONS}
              selected={slotFilter}
              onChange={handleSlotChange}
            />
          </aside>

          <div className="flex-1 space-y-8">
            <SearchBar
              placeholder="Search talents by name or keyword..."
              onChange={handleSearchChange}
              defaultValue={initialSearch}
            />

            {/* Gear Talents Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-core-red" />
                Gear Talents
                <span className="text-sm font-normal text-foreground-secondary">
                  ({gearTalents.length})
                </span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {gearTalents.map((talent) => (
                  <EntityCard
                    key={talent.id}
                    title={talent.name}
                    iconUrl={talent.iconUrl}
                    subtitle={`${talent.slot} only`}
                    badges={[
                      { label: talent.slot.charAt(0).toUpperCase() + talent.slot.slice(1), colorClass: "bg-surface-hover text-foreground-secondary" },
                      ...(talent.isPerfect
                        ? [{ label: "Perfect", colorClass: "bg-shd-orange/20 text-shd-orange" }]
                        : []),
                    ]}
                  >
                    <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
                      {talent.description}
                    </p>
                    {talent.perfectVersion && (
                      <p className="text-xs text-foreground-secondary mb-2">
                        Perfect version: <span className="text-shd-orange">{talent.perfectVersion}</span>
                        {talent.namedItem && ` (found on ${talent.namedItem})`}
                      </p>
                    )}
                    <UseInBuilderButton itemId={talent.id} />
                  </EntityCard>
                ))}
              </div>

              {gearTalents.length === 0 && (
                <p className="text-sm text-foreground-secondary py-4">
                  No gear talents match your filters.
                </p>
              )}
            </section>

            {/* Weapon Talents Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-shd-orange" />
                Weapon Talents
                <span className="text-sm font-normal text-foreground-secondary">
                  ({weaponTalents.length})
                </span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {weaponTalents.map((talent) => {
                  const restrictions = talent.weaponTypeRestrictions;
                  return (
                    <EntityCard
                      key={talent.id}
                      title={talent.name}
                      iconUrl={talent.iconUrl}
                      subtitle={
                        restrictions.length > 0
                          ? `${restrictions.join(", ")} only`
                          : "All weapon types"
                      }
                      badges={
                        restrictions.length > 0
                          ? restrictions.map((r) => ({
                              label: r,
                              colorClass: "bg-surface-hover text-foreground-secondary",
                            }))
                          : [{ label: "All Types", colorClass: "bg-surface-hover text-foreground-secondary" }]
                      }
                    >
                      <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
                        {talent.description}
                      </p>
                      <UseInBuilderButton itemId={talent.id} />
                    </EntityCard>
                  );
                })}
              </div>

              {weaponTalents.length === 0 && (
                <p className="text-sm text-foreground-secondary py-4">
                  No weapon talents match your search.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
