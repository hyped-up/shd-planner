"use client";

import { useState } from "react";
import { SearchBar } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";

// --- Placeholder Data ---

interface GearSet {
  id: string;
  name: string;
  bonuses: { pieces: number; bonus: string }[];
  fourPieceTalent: string;
  fourPieceDescription: string;
  chestTalent: string;
  chestDescription: string;
  backpackTalent: string;
  backpackDescription: string;
  iconUrl?: string;
}

const GEAR_SETS: GearSet[] = [
  {
    id: "strikers_battlegear",
    name: "Striker's Battlegear",
    bonuses: [
      { pieces: 2, bonus: "15% Weapon Damage" },
      { pieces: 3, bonus: "15% Rate of Fire" },
    ],
    fourPieceTalent: "Striker's Gamble",
    fourPieceDescription:
      "Hitting an enemy adds a stack of +0.5% weapon damage. Stacks up to 100 times. Missing removes 2 stacks.",
    chestTalent: "Press the Advantage",
    chestDescription: "Increases max stacks to 200 and adds +20% armor on full stacks.",
    backpackTalent: "Risk Management",
    backpackDescription: "Missing shots only removes 1 stack instead of 2.",
  },
  {
    id: "hunters_fury",
    name: "Hunter's Fury",
    bonuses: [
      { pieces: 2, bonus: "15% SMG and Shotgun Damage" },
      { pieces: 3, bonus: "20% Armor on Kill" },
    ],
    fourPieceTalent: "Apex Predator",
    fourPieceDescription:
      "Killing an enemy within 15m applies a disorient to all enemies within 10m and grants +5% weapon damage for 10s, stacking up to 5 times.",
    chestTalent: "Endless Hunger",
    chestDescription: "Increases the range of the disorient from 10m to 20m.",
    backpackTalent: "Overwhelming Force",
    backpackDescription: "Increases weapon damage bonus from 5% to 10% per stack.",
  },
  {
    id: "heartbreaker",
    name: "Heartbreaker",
    bonuses: [
      { pieces: 2, bonus: "15% Body Shot Damage" },
      { pieces: 3, bonus: "+100% Bonus Armor" },
    ],
    fourPieceTalent: "Heartstopper",
    fourPieceDescription:
      "Body shots add stacks (max 50). Each stack grants bonus armor based on your total armor. Headshots consume all stacks to deal amplified damage.",
    chestTalent: "Headhunter",
    chestDescription: "Headshot damage consumes all stacks, dealing amplified damage per stack consumed.",
    backpackTalent: "Aggressive Reaction",
    backpackDescription: "Doubles the rate of stack accumulation from body shots.",
  },
  {
    id: "eclipse_protocol",
    name: "Eclipse Protocol",
    bonuses: [
      { pieces: 2, bonus: "15% Status Effects" },
      { pieces: 3, bonus: "30% Status Effects" },
    ],
    fourPieceTalent: "Indirect Transmission",
    fourPieceDescription:
      "Killing an enemy affected by a status effect spreads that status to all enemies within 15m.",
    chestTalent: "Caldera",
    chestDescription: "Enemies affected by your status effects take 15% more damage from all sources.",
    backpackTalent: "Proliferation",
    backpackDescription: "Status effects spread on enemy death now also refresh duration.",
  },
  {
    id: "future_initiative",
    name: "Future Initiative",
    bonuses: [
      { pieces: 2, bonus: "30% Repair Skills" },
      { pieces: 3, bonus: "15% Incoming Repairs" },
    ],
    fourPieceTalent: "Ground Control",
    fourPieceDescription:
      "When you repair an ally, they gain +25% total weapon and skill damage for 20s. When at full armor, you also grant this to yourself.",
    chestTalent: "Strategic Support",
    chestDescription: "Increases the damage bonus from 25% to 32% and extends the duration to 30s.",
    backpackTalent: "Shared Wealth",
    backpackDescription: "Repairing an ally also repairs other allies within 10m for 60% of the heal.",
  },
];

export default function GearSetsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = GEAR_SETS.filter(
    (set) =>
      !search ||
      set.name.toLowerCase().includes(search.toLowerCase()) ||
      set.fourPieceTalent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gear Sets</h1>
          <p className="mt-2 text-foreground-secondary">
            {GEAR_SETS.length} gear sets with 2/3/4-piece bonuses, chest talents, and backpack talents.
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
          Showing {filtered.length} of {GEAR_SETS.length} gear sets
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((set) => (
            <EntityCard
              key={set.id}
              title={set.name}
              iconUrl={set.iconUrl}
              subtitle={`4pc: ${set.fourPieceTalent}`}
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
                {set.bonuses.map((b) => (
                  <div key={b.pieces} className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-shd-orange w-4">
                      {b.pieces}
                    </span>
                    <span className="text-sm text-foreground">{b.bonus}</span>
                  </div>
                ))}
              </div>

              {/* 4-piece talent */}
              <div className="mb-4 rounded-md bg-background-secondary p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-shd-orange">4</span>
                  <span className="text-sm font-semibold text-shd-orange">
                    {set.fourPieceTalent}
                  </span>
                </div>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  {set.fourPieceDescription}
                </p>
              </div>

              {/* Chest talent */}
              <div className="mb-3 rounded-md bg-background-tertiary p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-core-red">Chest</span>
                  <span className="text-sm font-medium text-foreground">
                    {set.chestTalent}
                  </span>
                </div>
                <p className="text-xs text-foreground-secondary">{set.chestDescription}</p>
              </div>

              {/* Backpack talent */}
              <div className="mb-4 rounded-md bg-background-tertiary p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-core-blue">Backpack</span>
                  <span className="text-sm font-medium text-foreground">
                    {set.backpackTalent}
                  </span>
                </div>
                <p className="text-xs text-foreground-secondary">{set.backpackDescription}</p>
              </div>

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
