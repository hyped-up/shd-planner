// Brand Sets & Named Items database page — loads real data from data-loader
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, FilterPanel } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";
import { Badge } from "@/components/ui";
import { getAllBrands, getAllNamedItems } from "@/lib/data-loader";
import type { IBrandSet, INamedItem, CoreAttributeType } from "@/lib/types";

// Color mappings for core attribute badges
const coreColors: Record<CoreAttributeType, { bg: string; text: string; label: string }> = {
  weaponDamage: { bg: "bg-core-red/20", text: "text-core-red", label: "Weapon Damage" },
  armor: { bg: "bg-core-blue/20", text: "text-core-blue", label: "Armor" },
  skillTier: { bg: "bg-core-yellow/20", text: "text-core-yellow", label: "Skill Tier" },
};

const CORE_FILTER_OPTIONS = ["Weapon Damage", "Armor", "Skill Tier"];

// Map display labels back to core type keys
function coreTypeFromLabel(label: string): CoreAttributeType | null {
  if (label === "Weapon Damage") return "weaponDamage";
  if (label === "Armor") return "armor";
  if (label === "Skill Tier") return "skillTier";
  return null;
}

export default function GearPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-foreground-secondary">Loading gear...</div>}>
      <GearPage />
    </Suspense>
  );
}

function GearPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load real data
  const [brands, setBrands] = useState<IBrandSet[]>([]);
  const [namedItems, setNamedItems] = useState<INamedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllBrands(), getAllNamedItems()]).then(([b, n]) => {
      setBrands(b);
      setNamedItems(n);
      setLoading(false);
    });
  }, []);

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

  // Get named items for a specific brand
  const getNamedForBrand = (brandId: string) =>
    namedItems.filter((ni) => ni.brand === brandId);

  // Filter brand sets
  const filtered = useMemo(() => {
    return brands.filter((brand) => {
      // Search filter — match brand name or named item names
      const q = search.toLowerCase();
      const brandNamedItems = getNamedForBrand(brand.id);
      const matchesSearch =
        !q ||
        brand.name.toLowerCase().includes(q) ||
        brandNamedItems.some((ni) => ni.name.toLowerCase().includes(q));

      // Core attribute filter
      const matchesCore =
        coreFilter.length === 0 ||
        coreFilter.some((label) => coreTypeFromLabel(label) === brand.coreAttribute);

      return matchesSearch && matchesCore;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, namedItems, search, coreFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-surface" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-lg bg-surface" />
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
          <h1 className="text-3xl font-bold text-foreground">Brand Sets & Named Items</h1>
          <p className="mt-2 text-foreground-secondary">
            {brands.length} brand sets with their piece bonuses and {namedItems.length} associated named items.
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
              Showing {filtered.length} of {brands.length} brand sets
            </p>

            {/* Brand set cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((brand) => {
                const core = coreColors[brand.coreAttribute];
                const brandNamedItems = getNamedForBrand(brand.id);
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
                      {Object.entries(brand.bonuses).map(([pc, bonus]) => (
                        <div key={pc} className="flex items-baseline gap-2">
                          <span className="text-xs font-mono text-shd-orange w-4">
                            {pc}
                          </span>
                          <span className="text-sm text-foreground">
                            {typeof bonus === "string" ? bonus : bonus.stat}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Available slots */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-2">
                        Available Slots
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {brand.slots.map((slot) => (
                          <Badge key={slot} variant="default">{slot}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Named items */}
                    {brandNamedItems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                          Named Items
                        </h4>
                        {brandNamedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md bg-background-secondary px-3 py-2"
                          >
                            <div>
                              <span className="text-sm font-medium text-shd-orange">
                                {item.name}
                              </span>
                              <span className="text-xs text-foreground-secondary ml-2">
                                ({item.slot})
                                {item.uniqueAttributes[0] && ` — ${item.uniqueAttributes[0]}`}
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
