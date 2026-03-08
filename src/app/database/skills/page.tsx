"use client";

import { useState } from "react";
import { SearchBar } from "@/components/shared";
import { UseInBuilderButton } from "@/components/database";

// --- Placeholder Data ---

interface SkillVariant {
  id: string;
  name: string;
  description: string;
  tierScaling: { tier: number; value: string }[];
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  variants: SkillVariant[];
  iconUrl?: string;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "turret",
    name: "Turret",
    description: "Deploy an automated turret that targets enemies.",
    variants: [
      {
        id: "turret_assault",
        name: "Assault Turret",
        description: "Deploys a turret that automatically fires at hostile targets.",
        tierScaling: [
          { tier: 0, value: "52,843 dmg" },
          { tier: 1, value: "68,696 dmg" },
          { tier: 3, value: "100,402 dmg" },
          { tier: 6, value: "148,761 dmg" },
        ],
      },
      {
        id: "turret_sniper",
        name: "Sniper Turret",
        description: "Fires high-damage rounds at targets you designate.",
        tierScaling: [
          { tier: 0, value: "285,000 dmg" },
          { tier: 1, value: "370,500 dmg" },
          { tier: 3, value: "541,500 dmg" },
          { tier: 6, value: "802,500 dmg" },
        ],
      },
      {
        id: "turret_artillery",
        name: "Artillery Turret",
        description: "Launches explosive shells at targeted locations.",
        tierScaling: [
          { tier: 0, value: "422,740 dmg" },
          { tier: 1, value: "549,562 dmg" },
          { tier: 3, value: "803,206 dmg" },
          { tier: 6, value: "1,190,906 dmg" },
        ],
      },
      {
        id: "turret_striker_drone",
        name: "Striker Drone",
        description: "Deploys a drone that attacks targets you fire at.",
        tierScaling: [
          { tier: 0, value: "43,291 dmg" },
          { tier: 1, value: "56,278 dmg" },
          { tier: 3, value: "82,253 dmg" },
          { tier: 6, value: "121,915 dmg" },
        ],
      },
    ],
  },
  {
    id: "hive",
    name: "Hive",
    description: "Deploy a hive of micro-drones with various functions.",
    variants: [
      {
        id: "hive_restorer",
        name: "Restorer Hive",
        description: "Sends micro-drones to repair allies' armor.",
        tierScaling: [
          { tier: 0, value: "58,695 repair" },
          { tier: 1, value: "76,304 repair" },
          { tier: 3, value: "111,521 repair" },
          { tier: 6, value: "165,270 repair" },
        ],
      },
      {
        id: "hive_stinger",
        name: "Stinger Hive",
        description: "Launches micro-drones that attack enemies in the area.",
        tierScaling: [
          { tier: 0, value: "33,880 dmg" },
          { tier: 1, value: "44,044 dmg" },
          { tier: 3, value: "64,372 dmg" },
          { tier: 6, value: "95,398 dmg" },
        ],
      },
      {
        id: "hive_artificer",
        name: "Artificer Hive",
        description: "Enhances and repairs friendly skills and proxies.",
        tierScaling: [
          { tier: 0, value: "10% buff" },
          { tier: 1, value: "13% buff" },
          { tier: 3, value: "19% buff" },
          { tier: 6, value: "28% buff" },
        ],
      },
      {
        id: "hive_booster",
        name: "Booster Hive",
        description: "Sends stimulant-laden drones to boost combat efficiency.",
        tierScaling: [
          { tier: 0, value: "15% buff" },
          { tier: 1, value: "19.5% buff" },
          { tier: 3, value: "28.5% buff" },
          { tier: 6, value: "42.3% buff" },
        ],
      },
    ],
  },
  {
    id: "seeker_mine",
    name: "Seeker Mine",
    description: "Deploy rolling mines that seek out enemies.",
    variants: [
      {
        id: "seeker_explosive",
        name: "Explosive Seeker",
        description: "Rolls toward a targeted enemy and explodes on proximity.",
        tierScaling: [
          { tier: 0, value: "422,740 dmg" },
          { tier: 1, value: "549,562 dmg" },
          { tier: 3, value: "803,206 dmg" },
          { tier: 6, value: "1,190,906 dmg" },
        ],
      },
      {
        id: "seeker_airburst",
        name: "Airburst Seeker",
        description: "Rolls to a targeted area and launches into the air, applying burn.",
        tierScaling: [
          { tier: 0, value: "338,192 dmg" },
          { tier: 1, value: "439,650 dmg" },
          { tier: 3, value: "642,565 dmg" },
          { tier: 6, value: "952,380 dmg" },
        ],
      },
      {
        id: "seeker_cluster",
        name: "Cluster Seeker",
        description: "Splits into smaller mines that seek individual targets.",
        tierScaling: [
          { tier: 0, value: "126,822 dmg" },
          { tier: 1, value: "164,869 dmg" },
          { tier: 3, value: "240,962 dmg" },
          { tier: 6, value: "357,209 dmg" },
        ],
      },
      {
        id: "seeker_mender",
        name: "Mender Seeker",
        description: "Rolls toward allies and repairs their armor over time.",
        tierScaling: [
          { tier: 0, value: "78,260 repair/s" },
          { tier: 1, value: "101,738 repair/s" },
          { tier: 3, value: "148,694 repair/s" },
          { tier: 6, value: "220,410 repair/s" },
        ],
      },
    ],
  },
];

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  // Filter categories and variants by search
  const filteredCategories = SKILL_CATEGORIES.map((cat) => {
    const q = search.toLowerCase();
    if (!q) return cat;

    const matchingVariants = cat.variants.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        cat.name.toLowerCase().includes(q)
    );

    return { ...cat, variants: matchingVariants };
  }).filter((cat) => cat.variants.length > 0);

  const totalVariants = SKILL_CATEGORIES.reduce(
    (sum, cat) => sum + cat.variants.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Skills</h1>
          <p className="mt-2 text-foreground-secondary">
            {SKILL_CATEGORIES.length} skill categories with {totalVariants} variants. Click a variant to view tier scaling.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar
            placeholder="Search skills or variants..."
            onChange={setSearch}
          />
        </div>

        {/* Skill categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.id}>
              {/* Category header */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-core-yellow" />
                  {category.name}
                  <span className="text-sm font-normal text-foreground-secondary">
                    ({category.variants.length} variants)
                  </span>
                </h2>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {category.description}
                </p>
              </div>

              {/* Variant cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {category.variants.map((variant) => {
                  const isExpanded = expandedVariant === variant.id;
                  return (
                    <div
                      key={variant.id}
                      className={`rounded-lg border transition-all ${
                        isExpanded
                          ? "border-shd-orange bg-surface-hover"
                          : "border-border bg-surface hover:border-shd-orange/50 hover:bg-surface-hover"
                      }`}
                    >
                      {/* Variant header */}
                      <button
                        onClick={() =>
                          setExpandedVariant(isExpanded ? null : variant.id)
                        }
                        className="w-full px-4 py-3 text-left"
                      >
                        <h3 className="text-sm font-semibold text-foreground">
                          {variant.name}
                        </h3>
                        <p className="mt-1 text-xs text-foreground-secondary line-clamp-2">
                          {variant.description}
                        </p>
                      </button>

                      {/* Tier scaling table — shown when expanded */}
                      {isExpanded && (
                        <div className="border-t border-border px-4 py-3">
                          <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-2">
                            Tier Scaling
                          </h4>
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th className="text-left text-[10px] font-semibold text-foreground-secondary uppercase pb-1">
                                  Tier
                                </th>
                                <th className="text-right text-[10px] font-semibold text-foreground-secondary uppercase pb-1">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {variant.tierScaling.map((row) => (
                                <tr
                                  key={row.tier}
                                  className="border-t border-border/50"
                                >
                                  <td className="py-1 text-xs text-core-yellow font-mono">
                                    {row.tier}
                                  </td>
                                  <td className="py-1 text-xs text-foreground text-right font-mono">
                                    {row.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="mt-3">
                            <UseInBuilderButton itemId={variant.id} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground-secondary">No skills match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
