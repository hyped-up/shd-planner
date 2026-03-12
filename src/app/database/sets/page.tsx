// Gear Sets database page — loads real data from data-loader
"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";
import { Badge } from "@/components/ui";
import { getAllGearSets } from "@/lib/data-loader";
import type { IGearSet } from "@/lib/types";

export default function GearSetsPage() {
  const [gearSets, setGearSets] = useState<IGearSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load real gear set data
  useEffect(() => {
    getAllGearSets().then((data) => {
      setGearSets(data);
      setLoading(false);
    });
  }, []);

  const filtered = gearSets.filter(
    (set) =>
      !search ||
      set.name.toLowerCase().includes(search.toLowerCase()) ||
      (set.chestTalent?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-surface" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-surface" />
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
          <h1 className="text-3xl font-bold text-foreground">Gear Sets</h1>
          <p className="mt-2 text-foreground-secondary">
            {gearSets.length} gear sets with 2/3/4-piece bonuses, chest talents, and backpack talents.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SearchBar
            placeholder="Search gear sets..."
            onChange={setSearch}
          />
        </div>

        {/* Results */}
        <p className="text-sm text-foreground-secondary mb-4">
          Showing {filtered.length} of {gearSets.length} gear sets
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((set) => (
            <EntityCard
              key={set.id}
              title={set.name}
              iconUrl={set.iconUrl}
              subtitle={`${set.pieces.length} pieces`}
              badges={[
                { label: "Gear Set", colorClass: "bg-core-blue/20 text-core-blue" },
              ]}
              expanded={expandedId === set.id}
              onToggle={() =>
                setExpandedId(expandedId === set.id ? null : set.id)
              }
            >
              {/* Piece bonuses */}
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  Set Bonuses
                </h4>
                {Object.entries(set.bonuses).map(([pc, bonus]) => (
                  <div key={pc} className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-shd-orange w-4">
                      {pc}
                    </span>
                    <span className="text-sm text-foreground">
                      {typeof bonus === "string" ? bonus : bonus.description}
                    </span>
                  </div>
                ))}
              </div>

              {/* Available pieces */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-2">
                  Available Slots
                </h4>
                <div className="flex flex-wrap gap-1">
                  {set.pieces.map((piece) => (
                    <Badge key={piece} variant="default">{piece}</Badge>
                  ))}
                </div>
              </div>

              {/* Chest talent */}
              {set.chestTalent && (
                <div className="mb-3 rounded-md bg-background-tertiary p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-core-red">Chest</span>
                    <span className="text-sm font-medium text-foreground">
                      {set.chestTalent.name}
                    </span>
                  </div>
                  {set.chestTalent.description && (
                    <p className="text-xs text-foreground-secondary">{set.chestTalent.description}</p>
                  )}
                </div>
              )}

              {/* Backpack talent */}
              {set.backpackTalent && (
                <div className="mb-4 rounded-md bg-background-tertiary p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-core-blue">Backpack</span>
                    <span className="text-sm font-medium text-foreground">
                      {set.backpackTalent.name}
                    </span>
                  </div>
                  {set.backpackTalent.description && (
                    <p className="text-xs text-foreground-secondary">{set.backpackTalent.description}</p>
                  )}
                </div>
              )}

              <UseInBuilderButton itemId={set.id} />
            </EntityCard>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">No gear sets match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
