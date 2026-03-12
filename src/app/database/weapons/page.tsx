// Weapons database page — loads real data from data-loader
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, SortControls } from "@/components/shared";
import { UseInBuilderButton } from "@/components/database";
import { Tabs, Badge } from "@/components/ui";
import { getAllWeapons } from "@/lib/data-loader";
import type { IWeapon } from "@/lib/types";

const WEAPON_TYPES = [
  "All",
  "Assault Rifles",
  "Submachine Guns",
  "Light Machine Guns",
  "Rifles",
  "Marksman Rifles",
  "Shotguns",
  "Pistols",
];

const SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "RPM", value: "rpm" },
  { label: "Magazine", value: "magSize" },
  { label: "Type", value: "type" },
  { label: "Base Damage", value: "baseDamage" },
];

export default function WeaponsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-foreground-secondary">Loading weapons...</div>}>
      <WeaponsPage />
    </Suspense>
  );
}

function WeaponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load real weapon data
  const [weapons, setWeapons] = useState<IWeapon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllWeapons().then((data) => {
      setWeapons(data);
      setLoading(false);
    });
  }, []);

  // Read URL state
  const initialType = searchParams.get("type") || "All";
  const initialSort = searchParams.get("sort") || "name";
  const initialDir = (searchParams.get("dir") as "asc" | "desc") || "asc";
  const initialSearch = searchParams.get("q") || "";

  const [search, setSearch] = useState(initialSearch);
  const [activeType, setActiveType] = useState(initialType);
  const [sortField, setSortField] = useState(initialSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialDir);

  // Update URL on filter/sort changes
  const updateUrl = (type: string, sort: string, dir: string, q: string) => {
    const params = new URLSearchParams();
    if (type !== "All") params.set("type", type);
    if (sort !== "name") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    if (q) params.set("q", q);
    const qs = params.toString();
    router.replace(`/database/weapons${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    updateUrl(type, sortField, sortDir, search);
  };

  const handleSortChange = (sort: string, dir: "asc" | "desc") => {
    setSortField(sort);
    setSortDir(dir);
    updateUrl(activeType, sort, dir, search);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateUrl(activeType, sortField, sortDir, value);
  };

  // Filter and sort
  const results = useMemo(() => {
    let list = [...weapons];

    // Type filter
    if (activeType !== "All") {
      list = list.filter((w) => w.type === activeType);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) || w.type.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "rpm") cmp = a.rpm - b.rpm;
      else if (sortField === "magSize") cmp = a.magSize - b.magSize;
      else if (sortField === "type") cmp = a.type.localeCompare(b.type);
      else if (sortField === "baseDamage") cmp = a.baseDamage - b.baseDamage;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [weapons, search, activeType, sortField, sortDir]);

  // Build tab items from weapon types
  const typeTabs = WEAPON_TYPES.map((t) => ({ key: t, label: t }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-surface" />
          <div className="h-10 w-full rounded bg-surface" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-surface" />
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
          <h1 className="text-3xl font-bold text-foreground">Weapons</h1>
          <p className="mt-2 text-foreground-secondary">
            {weapons.length} weapons across {WEAPON_TYPES.length - 1} categories.
          </p>
        </div>

        {/* Search + Sort row */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchBar
            placeholder="Search weapons..."
            onChange={handleSearchChange}
            defaultValue={initialSearch}
          />
          <SortControls
            options={SORT_OPTIONS}
            currentSort={sortField}
            direction={sortDir}
            onChange={handleSortChange}
          />
        </div>

        {/* Type filter tabs */}
        <div className="mb-6">
          <Tabs tabs={typeTabs} activeKey={activeType} onChange={handleTypeChange} />
        </div>

        {/* Results count */}
        <p className="text-sm text-foreground-secondary mb-4">
          Showing {results.length} of {weapons.length} weapons
        </p>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background-secondary">
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  RPM
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Mag
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Base DMG
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Reload
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((weapon, idx) => (
                <tr
                  key={weapon.id}
                  className={`border-b border-border transition-colors hover:bg-surface-hover ${
                    idx % 2 === 0 ? "bg-surface" : "bg-background-secondary"
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      {weapon.name}
                    </span>
                    {weapon.nativeAttribute && (
                      <Badge variant="default" colorClass="ml-2 bg-surface-hover text-foreground-secondary">
                        {weapon.nativeAttribute}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-secondary">
                    {weapon.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.rpm.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.magSize}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.baseDamage.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.reloadSpeed > 0 ? `${weapon.reloadSpeed.toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UseInBuilderButton itemId={weapon.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          {results.map((weapon) => (
            <div
              key={weapon.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {weapon.name}
                  </h3>
                  <p className="text-xs text-foreground-secondary">{weapon.type}</p>
                </div>
                {weapon.nativeAttribute && (
                  <Badge variant="default">{weapon.nativeAttribute}</Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="rounded bg-background-secondary px-2 py-1.5">
                  <p className="text-[10px] text-foreground-secondary uppercase">RPM</p>
                  <p className="text-sm font-mono text-foreground">{weapon.rpm.toLocaleString()}</p>
                </div>
                <div className="rounded bg-background-secondary px-2 py-1.5">
                  <p className="text-[10px] text-foreground-secondary uppercase">MAG</p>
                  <p className="text-sm font-mono text-foreground">{weapon.magSize}</p>
                </div>
                <div className="rounded bg-background-secondary px-2 py-1.5">
                  <p className="text-[10px] text-foreground-secondary uppercase">DMG</p>
                  <p className="text-sm font-mono text-foreground">{weapon.baseDamage.toLocaleString()}</p>
                </div>
              </div>
              <UseInBuilderButton itemId={weapon.id} />
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">No weapons match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
