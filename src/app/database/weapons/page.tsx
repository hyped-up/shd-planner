"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, SortControls } from "@/components/shared";
import { UseInBuilderButton } from "@/components/database";

// --- Placeholder Data ---

interface Weapon {
  id: string;
  name: string;
  type: string;
  rpm: number;
  magSize: number;
  baseDamage: string;
  isExotic: boolean;
  iconUrl?: string;
}

const WEAPONS: Weapon[] = [
  { id: "police_m4", name: "Police M4", type: "Assault Rifle", rpm: 780, magSize: 30, baseDamage: "44,892", isExotic: false },
  { id: "mpx", name: "MPX", type: "SMG", rpm: 850, magSize: 30, baseDamage: "38,214", isExotic: false },
  { id: "m60", name: "M60", type: "LMG", rpm: 500, magSize: 100, baseDamage: "49,721", isExotic: false },
  { id: "m1a_cqb", name: "M1A CQB", type: "Rifle", rpm: 320, magSize: 20, baseDamage: "104,533", isExotic: false },
  { id: "nemesis", name: "Nemesis", type: "Marksman Rifle", rpm: 30, magSize: 7, baseDamage: "489,120", isExotic: true },
  { id: "m870_express", name: "M870 Express", type: "Shotgun", rpm: 75, magSize: 8, baseDamage: "218,907", isExotic: false },
  { id: "diceros_special", name: "Diceros Special", type: "Pistol", rpm: 150, magSize: 6, baseDamage: "156,330", isExotic: false },
];

const WEAPON_TYPES = [
  "All",
  "Assault Rifle",
  "SMG",
  "LMG",
  "Rifle",
  "Marksman Rifle",
  "Shotgun",
  "Pistol",
];

const SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "RPM", value: "rpm" },
  { label: "Magazine", value: "magSize" },
  { label: "Type", value: "type" },
];

export default function WeaponsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-foreground-secondary">Loading...</div>}>
      <WeaponsPage />
    </Suspense>
  );
}

function WeaponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    let list = [...WEAPONS];

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
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [search, activeType, sortField, sortDir]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Weapons</h1>
          <p className="mt-2 text-foreground-secondary">
            {WEAPONS.length} weapons across {WEAPON_TYPES.length - 1} categories.
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
        <div className="mb-6 flex flex-wrap gap-2">
          {WEAPON_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeType === type
                  ? "bg-shd-orange text-white"
                  : "bg-surface text-foreground-secondary border border-border hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-foreground-secondary mb-4">
          Showing {results.length} of {WEAPONS.length} weapons
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
                    <span className={`text-sm font-medium ${weapon.isExotic ? "text-shd-orange" : "text-foreground"}`}>
                      {weapon.name}
                    </span>
                    {weapon.isExotic && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-shd-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-shd-orange">
                        EXOTIC
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-secondary">
                    {weapon.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.rpm}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.magSize}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                    {weapon.baseDamage}
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
                  <h3 className={`text-base font-semibold ${weapon.isExotic ? "text-shd-orange" : "text-foreground"}`}>
                    {weapon.name}
                  </h3>
                  <p className="text-xs text-foreground-secondary">{weapon.type}</p>
                </div>
                {weapon.isExotic && (
                  <span className="inline-flex items-center rounded-full bg-shd-orange/15 px-2 py-0.5 text-[10px] font-semibold text-shd-orange">
                    EXOTIC
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="rounded bg-background-secondary px-2 py-1.5">
                  <p className="text-[10px] text-foreground-secondary uppercase">RPM</p>
                  <p className="text-sm font-mono text-foreground">{weapon.rpm}</p>
                </div>
                <div className="rounded bg-background-secondary px-2 py-1.5">
                  <p className="text-[10px] text-foreground-secondary uppercase">MAG</p>
                  <p className="text-sm font-mono text-foreground">{weapon.magSize}</p>
                </div>
                <div className="rounded bg-background-secondary px-2 py-1.5">
                  <p className="text-[10px] text-foreground-secondary uppercase">DMG</p>
                  <p className="text-sm font-mono text-foreground">{weapon.baseDamage}</p>
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
