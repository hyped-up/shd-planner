"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, FilterPanel } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";

// --- Placeholder Data ---

type CoreType = "red" | "blue" | "yellow";

interface NamedItem {
  id: string;
  name: string;
  slot: string;
  talent: string;
}

interface BrandSet {
  id: string;
  name: string;
  coreType: CoreType;
  slots: string[];
  bonuses: { pieces: number; bonus: string }[];
  namedItems: NamedItem[];
  iconUrl?: string;
}

const BRAND_SETS: BrandSet[] = [
  {
    id: "providence_defense",
    name: "Providence Defense",
    coreType: "red",
    slots: ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"],
    bonuses: [
      { pieces: 1, bonus: "15% Headshot Damage" },
      { pieces: 2, bonus: "10% Critical Hit Damage" },
      { pieces: 3, bonus: "10% Critical Hit Chance" },
    ],
    namedItems: [
      { id: "contractors_gloves", name: "Contractor's Gloves", slot: "Gloves", talent: "11% Damage to Armor" },
      { id: "foxs_prayer", name: "Fox's Prayer", slot: "Kneepads", talent: "8% Damage to Out of Cover" },
    ],
  },
  {
    id: "ceska_vyroba",
    name: "Ceska Vyroba s.r.o.",
    coreType: "red",
    slots: ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"],
    bonuses: [
      { pieces: 1, bonus: "10% Critical Hit Chance" },
      { pieces: 2, bonus: "10% Critical Hit Damage" },
      { pieces: 3, bonus: "10% Headshot Damage" },
    ],
    namedItems: [
      { id: "hollow_man", name: "Hollow Man", slot: "Mask", talent: "21% Damage to Health" },
    ],
  },
  {
    id: "walker_harris",
    name: "Walker, Harris & Co.",
    coreType: "red",
    slots: ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"],
    bonuses: [
      { pieces: 1, bonus: "5% Weapon Damage" },
      { pieces: 2, bonus: "5% Damage to Armor" },
      { pieces: 3, bonus: "5% Damage to Out of Cover" },
    ],
    namedItems: [
      { id: "the_sacrifice", name: "The Sacrifice", slot: "Chest", talent: "Glass Cannon (named variant)" },
    ],
  },
  {
    id: "sokolov_concern",
    name: "Sokolov Concern",
    coreType: "red",
    slots: ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"],
    bonuses: [
      { pieces: 1, bonus: "10% SMG Damage" },
      { pieces: 2, bonus: "15% Critical Hit Damage" },
      { pieces: 3, bonus: "10% Critical Hit Chance" },
    ],
    namedItems: [
      { id: "the_apartment", name: "The Apartment", slot: "Backpack", talent: "Perfectly Vigilance" },
    ],
  },
  {
    id: "grupo_sombra",
    name: "Grupo Sombra S.A.",
    coreType: "yellow",
    slots: ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"],
    bonuses: [
      { pieces: 1, bonus: "15% Explosive Damage" },
      { pieces: 2, bonus: "15% Explosive Damage" },
      { pieces: 3, bonus: "15% Explosive Damage" },
    ],
    namedItems: [
      { id: "china_light_vest", name: "Wicked (Named Chest)", slot: "Chest", talent: "Perfectly Wicked" },
    ],
  },
];

// Color mappings for core attribute badges
const coreColors: Record<CoreType, { bg: string; text: string; label: string }> = {
  red: { bg: "bg-core-red/20", text: "text-core-red", label: "Weapon Damage" },
  blue: { bg: "bg-core-blue/20", text: "text-core-blue", label: "Armor" },
  yellow: { bg: "bg-core-yellow/20", text: "text-core-yellow", label: "Skill Tier" },
};

const CORE_FILTER_OPTIONS = ["Weapon Damage", "Armor", "Skill Tier"];

export default function GearPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-foreground-secondary">Loading...</div>}>
      <GearPage />
    </Suspense>
  );
}

function GearPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL state
  const initialCore = searchParams.get("core")?.split(",").filter(Boolean) || [];
  const initialSearch = searchParams.get("q") || "";

  const [search, setSearch] = useState(initialSearch);
  const [coreFilter, setCoreFilter] = useState<string[]>(initialCore);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sync filters to URL
  const updateUrl = (newSearch: string, newCore: string[]) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("q", newSearch);
    if (newCore.length > 0) params.set("core", newCore.join(","));
    const qs = params.toString();
    router.replace(`/database/gear${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateUrl(value, coreFilter);
  };

  const handleCoreFilterChange = (selected: string[]) => {
    setCoreFilter(selected);
    updateUrl(search, selected);
  };

  // Map display labels back to core type keys
  const coreTypeFromLabel = (label: string): CoreType | null => {
    if (label === "Weapon Damage") return "red";
    if (label === "Armor") return "blue";
    if (label === "Skill Tier") return "yellow";
    return null;
  };

  // Filter brand sets
  const filtered = useMemo(() => {
    return BRAND_SETS.filter((brand) => {
      // Search filter
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        brand.name.toLowerCase().includes(q) ||
        brand.namedItems.some((ni) => ni.name.toLowerCase().includes(q));

      // Core attribute filter
      const matchesCore =
        coreFilter.length === 0 ||
        coreFilter.some((label) => coreTypeFromLabel(label) === brand.coreType);

      return matchesSearch && matchesCore;
    });
  }, [search, coreFilter]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Brand Sets & Named Items</h1>
          <p className="mt-2 text-foreground-secondary">
            {BRAND_SETS.length} brand sets with their piece bonuses and associated named items.
          </p>
        </div>

        {/* Search + Filters layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="w-full md:w-56 shrink-0">
            <FilterPanel
              title="Core Attribute"
              options={CORE_FILTER_OPTIONS}
              selected={coreFilter}
              onChange={handleCoreFilterChange}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-4">
            <SearchBar
              placeholder="Search brand sets or named items..."
              onChange={handleSearchChange}
              defaultValue={initialSearch}
            />

            {/* Results count */}
            <p className="text-sm text-foreground-secondary">
              Showing {filtered.length} of {BRAND_SETS.length} brand sets
            </p>

            {/* Brand set cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((brand) => {
                const core = coreColors[brand.coreType];
                return (
                  <EntityCard
                    key={brand.id}
                    title={brand.name}
                    iconUrl={brand.iconUrl}
                    subtitle={`${brand.slots.length} slots available`}
                    badges={[
                      { label: core.label, colorClass: `${core.bg} ${core.text}` },
                    ]}
                    expanded={expandedId === brand.id}
                    onToggle={() =>
                      setExpandedId(expandedId === brand.id ? null : brand.id)
                    }
                  >
                    {/* Piece bonuses */}
                    <div className="space-y-2 mb-4">
                      <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                        Set Bonuses
                      </h4>
                      {brand.bonuses.map((b) => (
                        <div key={b.pieces} className="flex items-baseline gap-2">
                          <span className="text-xs font-mono text-shd-orange w-4">
                            {b.pieces}
                          </span>
                          <span className="text-sm text-foreground">{b.bonus}</span>
                        </div>
                      ))}
                    </div>

                    {/* Named items */}
                    {brand.namedItems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                          Named Items
                        </h4>
                        {brand.namedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md bg-background-secondary px-3 py-2"
                          >
                            <div>
                              <span className="text-sm font-medium text-shd-orange">
                                {item.name}
                              </span>
                              <span className="text-xs text-foreground-secondary ml-2">
                                ({item.slot}) — {item.talent}
                              </span>
                            </div>
                            <UseInBuilderButton itemId={item.id} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Use in builder for the brand itself */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <UseInBuilderButton itemId={brand.id} />
                    </div>
                  </EntityCard>
                );
              })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-foreground-secondary">
                  No brand sets match your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
