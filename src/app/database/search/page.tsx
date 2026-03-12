// Global database search page — fuzzy search across all Division 2 entities
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/shared";
import { Badge } from "@/components/ui";
import { searchEntities } from "@/lib/data-loader";

/** Search result shape returned by the data loader */
interface ISearchResult {
  type: "brand" | "gearset" | "weapon" | "talent" | "skill" | "exotic" | "named";
  id: string;
  name: string;
  score: number;
}

/** Human-readable labels for each entity type */
const TYPE_LABELS: Record<ISearchResult["type"], string> = {
  brand: "Brand",
  gearset: "Gear Set",
  weapon: "Weapon",
  talent: "Talent",
  skill: "Skill",
  exotic: "Exotic",
  named: "Named Item",
};

/** Badge variant per entity type for visual distinction */
const TYPE_BADGE_VARIANT: Record<ISearchResult["type"], "default" | "exotic" | "red" | "blue" | "yellow" | "success"> = {
  brand: "blue",
  gearset: "yellow",
  weapon: "red",
  talent: "default",
  skill: "success",
  exotic: "exotic",
  named: "blue",
};

/** Build the detail page URL for a given search result */
function getResultHref(result: ISearchResult): string {
  switch (result.type) {
    case "brand":
      return `/database/gear/${result.id}`;
    case "gearset":
      return `/database/sets/${result.id}`;
    case "weapon":
      return `/database/weapons/${result.id}`;
    case "talent":
      return `/database/talents`;
    case "skill":
      return `/database/skills`;
    case "exotic":
      return `/database/exotics/${result.id}`;
    case "named":
      return `/database/gear`;
  }
}

/** Group search results by entity type for organized display */
function groupByType(results: ISearchResult[]): Record<string, ISearchResult[]> {
  const groups: Record<string, ISearchResult[]> = {};
  for (const result of results) {
    const label = TYPE_LABELS[result.type];
    if (!groups[label]) groups[label] = [];
    groups[label].push(result);
  }
  return groups;
}

/** Render a score indicator bar (0.0 – 1.0 mapped to width) */
function ScoreIndicator({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-surface-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-shd-orange transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-foreground-secondary">{pct}%</span>
    </div>
  );
}

export default function DatabaseSearchPage() {
  const [results, setResults] = useState<ISearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle debounced search input from SearchBar (already debounced at 300ms)
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await searchEntities(query);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Group results by entity type for display
  const grouped = groupByType(results);
  const groupEntries = Object.entries(grouped);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Search Database</h1>
          <p className="mt-2 text-foreground-secondary">
            Search across all game data — brands, gear sets, weapons, talents, skills, and exotics.
          </p>
        </div>

        {/* Search input (debounce handled by SearchBar at 300ms) */}
        <div className="mb-8">
          <SearchBar
            placeholder="Search across all game data..."
            onChange={handleSearch}
            debounceMs={300}
          />
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">Searching...</p>
          </div>
        )}

        {/* Initial state — no search yet */}
        {!hasSearched && !loading && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-foreground-secondary/40"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <p className="mt-4 text-foreground-secondary">
              Search across all game data...
            </p>
          </div>
        )}

        {/* No results state */}
        {hasSearched && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">No results found.</p>
          </div>
        )}

        {/* Grouped results */}
        {!loading && groupEntries.length > 0 && (
          <div className="space-y-8">
            {/* Result count summary */}
            <p className="text-sm text-foreground-secondary">
              {results.length} result{results.length !== 1 ? "s" : ""} found across{" "}
              {groupEntries.length} categor{groupEntries.length !== 1 ? "ies" : "y"}
            </p>

            {groupEntries.map(([groupLabel, items]) => (
              <div key={groupLabel}>
                {/* Group heading */}
                <h2 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
                  {groupLabel}
                  <span className="ml-2 text-sm font-normal text-foreground-secondary">
                    ({items.length})
                  </span>
                </h2>

                {/* Result list */}
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={getResultHref(item)}
                        className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-all hover:bg-surface-hover hover:border-shd-orange/60"
                      >
                        <div className="flex items-center gap-3">
                          {/* Item name */}
                          <span className="text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                          {/* Type badge */}
                          <Badge variant={TYPE_BADGE_VARIANT[item.type]}>
                            {TYPE_LABELS[item.type]}
                          </Badge>
                        </div>
                        {/* Score indicator */}
                        <ScoreIndicator score={item.score} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
