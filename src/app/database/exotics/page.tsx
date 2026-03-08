"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";

// --- Placeholder Data ---

interface ExoticItem {
  id: string;
  name: string;
  category: "gear" | "weapon";
  slotOrType: string;
  talentName: string;
  talentDescription: string;
  obtainMethod: string;
  iconUrl?: string;
}

const EXOTICS: ExoticItem[] = [
  // Exotic Gear
  {
    id: "memento",
    name: "Memento",
    category: "gear",
    slotOrType: "Backpack",
    talentName: "Kill Confirmed",
    talentDescription:
      "Killing an enemy drops a trophy that grants +3% bonus armor, +3% skill damage, and +3% weapon damage for 300s. Trophies stack up to 30 times. Short-term bonus grants a larger buff for 10s.",
    obtainMethod: "Targeted Loot",
  },
  {
    id: "coyotes_mask",
    name: "Coyote's Mask",
    category: "gear",
    slotOrType: "Mask",
    talentName: "Pack Instincts",
    talentDescription:
      "Grants you and all allies bonuses depending on distance to targets: 0-15m: +25% CHD, 15-25m: +10% CHC, 25m+: +10% HSD.",
    obtainMethod: "Season / Targeted Loot",
  },
  {
    id: "tardigrade",
    name: "Tardigrade Armor System",
    category: "gear",
    slotOrType: "Chest",
    talentName: "Ablative Nano-Plating",
    talentDescription:
      "When an ally's armor breaks, grants 80% of your total armor as bonus armor to all allies within 40m. Cooldown: 45s.",
    obtainMethod: "Targeted Loot",
  },
  // Exotic Weapons
  {
    id: "eagle_bearer",
    name: "Eagle Bearer",
    category: "weapon",
    slotOrType: "Assault Rifle",
    talentName: "Eagle's Strike",
    talentDescription:
      "Accuracy increases as you continuously fire. Headshots grant stacks of +2% weapon damage for 10s, stacking up to 100 times. Missing a headshot resets stacks. On kill, repair 10% armor.",
    obtainMethod: "Raid: Dark Hours",
  },
  {
    id: "the_bighorn",
    name: "The Bighorn",
    category: "weapon",
    slotOrType: "Assault Rifle",
    talentName: "Big Game Hunter",
    talentDescription:
      "Weapon switches between full-auto and semi-auto modes. Full auto: standard AR. Semi-auto: fires high-damage rounds. Headshot kills in semi-auto grant bonus armor.",
    obtainMethod: "Legendary Missions",
  },
  {
    id: "lady_death",
    name: "Lady Death",
    category: "weapon",
    slotOrType: "SMG",
    talentName: "Breathless",
    talentDescription:
      "Sprinting builds stacks. Each stack grants +4% weapon damage for 10s when you stop sprinting or start shooting. Max 32 stacks (+128% weapon damage).",
    obtainMethod: "Open World / Named Boss",
  },
  {
    id: "nemesis_exotic",
    name: "Nemesis",
    category: "weapon",
    slotOrType: "Marksman Rifle",
    talentName: "Preparation / Counter-Sniper",
    talentDescription:
      "Hold to charge the shot. A fully charged shot deals massive bonus damage. Scoping an enemy marks them, granting 5% headshot damage to marked target for all group members.",
    obtainMethod: "Crafted (parts from Strongholds)",
  },
];

// Obtain method badge colors
const obtainColors: Record<string, string> = {
  Raid: "bg-core-red/20 text-core-red",
  Legendary: "bg-core-yellow/20 text-core-yellow",
  "Dark Zone": "bg-core-red/20 text-core-red",
  Targeted: "bg-core-blue/20 text-core-blue",
  Season: "bg-core-yellow/20 text-core-yellow",
  Crafted: "bg-success/20 text-success",
  "Open World": "bg-shd-orange/20 text-shd-orange",
};

// Match obtain method to color by checking if key is contained in the method string
function getObtainColor(method: string): string {
  for (const [key, color] of Object.entries(obtainColors)) {
    if (method.includes(key)) return color;
  }
  return "bg-surface-hover text-foreground-secondary";
}

export default function ExoticsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exoticGear = useMemo(() => {
    return EXOTICS.filter((e) => {
      if (e.category !== "gear") return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.talentName.toLowerCase().includes(q) ||
        e.slotOrType.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const exoticWeapons = useMemo(() => {
    return EXOTICS.filter((e) => {
      if (e.category !== "weapon") return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.talentName.toLowerCase().includes(q) ||
        e.slotOrType.toLowerCase().includes(q)
      );
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Exotics</h1>
          <p className="mt-2 text-foreground-secondary">
            {EXOTICS.length} exotic items — unique gear and weapons with powerful talents.
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
                subtitle={item.slotOrType}
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
                    {item.talentName}
                  </h4>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {item.talentDescription}
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
                subtitle={item.slotOrType}
                badges={[
                  { label: "Exotic", colorClass: "bg-shd-orange/20 text-shd-orange" },
                  { label: item.slotOrType, colorClass: "bg-surface-hover text-foreground-secondary" },
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
                    {item.talentName}
                  </h4>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {item.talentDescription}
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
