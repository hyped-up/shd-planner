"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, FilterPanel } from "@/components/shared";
import { EntityCard, UseInBuilderButton } from "@/components/database";

// --- Placeholder Data ---

interface Talent {
  id: string;
  name: string;
  type: "gear" | "weapon";
  slot?: string; // chest, backpack, any — for gear talents
  weaponType?: string; // AR, SMG, etc. — for weapon talents
  description: string;
  damageType?: "additive" | "amplified" | "multiplicative";
  iconUrl?: string;
}

const TALENTS: Talent[] = [
  // Gear talents
  {
    id: "glass_cannon",
    name: "Glass Cannon",
    type: "gear",
    slot: "Chest",
    description: "All damage you deal is amplified by 25%. All damage you take is amplified by 50%.",
    damageType: "amplified",
  },
  {
    id: "obliterate",
    name: "Obliterate",
    type: "gear",
    slot: "Chest",
    description: "Critical hits increase total weapon damage by 1% for 5s. Stacks up to 25 times.",
    damageType: "amplified",
  },
  {
    id: "spotter",
    name: "Spotter",
    type: "gear",
    slot: "Chest",
    description: "Amplifies total weapon and skill damage by 15% to pulsed enemies.",
    damageType: "amplified",
  },
  {
    id: "vigilance",
    name: "Vigilance",
    type: "gear",
    slot: "Backpack",
    description: "Increases total weapon damage by 25%. Taking damage disables this buff for 4s.",
    damageType: "amplified",
  },
  {
    id: "composure",
    name: "Composure",
    type: "gear",
    slot: "Backpack",
    description: "While in cover, increases total weapon damage by 15%.",
    damageType: "amplified",
  },
  {
    id: "kinetic_momentum",
    name: "Kinetic Momentum",
    type: "gear",
    slot: "Chest",
    description: "When in combat, skills gain +30% damage and +30% repair over 15 seconds. Lost when skill goes on cooldown.",
    damageType: "additive",
  },
  // Weapon talents
  {
    id: "ranger",
    name: "Ranger",
    type: "weapon",
    weaponType: "Any",
    description: "Every 5m you are from the target grants +2% weapon damage. Maximum distance: 40m.",
    damageType: "additive",
  },
  {
    id: "optimist",
    name: "Optimist",
    type: "weapon",
    weaponType: "Any",
    description: "Weapon damage is increased by 3% for every 10% of magazine ammo missing.",
    damageType: "additive",
  },
  {
    id: "strained",
    name: "Strained",
    type: "weapon",
    weaponType: "Any",
    description: "Critical hit damage is increased by 10% for every 0.5s you are firing. Resets when you stop firing.",
    damageType: "additive",
  },
  {
    id: "fast_hands",
    name: "Fast Hands",
    type: "weapon",
    weaponType: "Any",
    description: "Critical hits add a stack of 3% reload speed bonus. Max 20 stacks. All stacks lost on reload.",
    damageType: undefined,
  },
  {
    id: "in_sync",
    name: "In Sync",
    type: "weapon",
    weaponType: "Any",
    description:
      "Hitting an enemy grants +15% skill damage for 5s. Using a skill grants +15% weapon damage for 5s. Both bonuses active at once grants +30% total.",
    damageType: "additive",
  },
  {
    id: "preservation",
    name: "Preservation",
    type: "weapon",
    weaponType: "Any",
    description: "Killing an enemy repairs 10% armor over 5s. Headshot kills double the repair.",
    damageType: undefined,
  },
];

const SLOT_OPTIONS = ["Chest", "Backpack"];
// Color mapping for damage type badges
const damageTypeColors: Record<string, { bg: string; text: string }> = {
  additive: { bg: "bg-core-blue/20", text: "text-core-blue" },
  amplified: { bg: "bg-core-red/20", text: "text-core-red" },
  multiplicative: { bg: "bg-core-yellow/20", text: "text-core-yellow" },
};

export default function TalentsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-foreground-secondary">Loading...</div>}>
      <TalentsPage />
    </Suspense>
  );
}

function TalentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Separate and filter talents
  const gearTalents = useMemo(() => {
    return TALENTS.filter((t) => {
      if (t.type !== "gear") return false;
      const q = search.toLowerCase();
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (slotFilter.length > 0 && t.slot && !slotFilter.includes(t.slot)) return false;
      return true;
    });
  }, [search, slotFilter]);

  const weaponTalents = useMemo(() => {
    return TALENTS.filter((t) => {
      if (t.type !== "weapon") return false;
      const q = search.toLowerCase();
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Talents</h1>
          <p className="mt-2 text-foreground-secondary">
            {TALENTS.length} talents — gear and weapon talents with damage type classifications.
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
                    subtitle={talent.slot ? `${talent.slot} only` : "Any gear slot"}
                    badges={[
                      ...(talent.slot
                        ? [{ label: talent.slot, colorClass: "bg-surface-hover text-foreground-secondary" }]
                        : []),
                      ...(talent.damageType
                        ? [
                            {
                              label: talent.damageType.charAt(0).toUpperCase() + talent.damageType.slice(1),
                              colorClass: `${damageTypeColors[talent.damageType].bg} ${damageTypeColors[talent.damageType].text}`,
                            },
                          ]
                        : []),
                    ]}
                  >
                    <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
                      {talent.description}
                    </p>
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
                {weaponTalents.map((talent) => (
                  <EntityCard
                    key={talent.id}
                    title={talent.name}
                    iconUrl={talent.iconUrl}
                    subtitle={talent.weaponType ? `${talent.weaponType} weapons` : undefined}
                    badges={[
                      ...(talent.damageType
                        ? [
                            {
                              label: talent.damageType.charAt(0).toUpperCase() + talent.damageType.slice(1),
                              colorClass: `${damageTypeColors[talent.damageType].bg} ${damageTypeColors[talent.damageType].text}`,
                            },
                          ]
                        : [{ label: "Utility", colorClass: "bg-surface-hover text-foreground-secondary" }]),
                    ]}
                  >
                    <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
                      {talent.description}
                    </p>
                    <UseInBuilderButton itemId={talent.id} />
                  </EntityCard>
                ))}
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
