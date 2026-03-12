// Skills database page — loads real data from data-loader
"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/shared";
import { UseInBuilderButton } from "@/components/database";
import { getAllSkills } from "@/lib/data-loader";
import type { ISkill } from "@/lib/types";

export default function SkillsPage() {
  const [skills, setSkills] = useState<ISkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  // Load real skill data
  useEffect(() => {
    getAllSkills().then((data) => {
      setSkills(data);
      setLoading(false);
    });
  }, []);

  // Filter categories and variants by search
  const filteredCategories = skills.map((cat) => {
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

  const totalVariants = skills.reduce(
    (sum, cat) => sum + cat.variants.length,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-8 w-24 rounded bg-surface" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-surface" />
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
          <h1 className="text-3xl font-bold text-foreground">Skills</h1>
          <p className="mt-2 text-foreground-secondary">
            {skills.length} skill categories with {totalVariants} variants. Click a variant to view tier scaling.
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
                                  Stat
                                </th>
                                <th className="text-right text-[10px] font-semibold text-foreground-secondary uppercase pb-1">
                                  Tier 0
                                </th>
                                <th className="text-right text-[10px] font-semibold text-foreground-secondary uppercase pb-1">
                                  Tier 6
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {variant.tierScaling.cooldown && (
                                <tr className="border-t border-border/50">
                                  <td className="py-1 text-xs text-core-yellow">Cooldown</td>
                                  <td className="py-1 text-xs text-foreground text-right font-mono">
                                    {variant.tierScaling.cooldown[0]}s
                                  </td>
                                  <td className="py-1 text-xs text-foreground text-right font-mono">
                                    {variant.tierScaling.cooldown[1]}s
                                  </td>
                                </tr>
                              )}
                              {variant.tierScaling.duration && (
                                <tr className="border-t border-border/50">
                                  <td className="py-1 text-xs text-core-yellow">Duration</td>
                                  <td className="py-1 text-xs text-foreground text-right font-mono">
                                    {variant.tierScaling.duration[0]}s
                                  </td>
                                  <td className="py-1 text-xs text-foreground text-right font-mono">
                                    {variant.tierScaling.duration[1]}s
                                  </td>
                                </tr>
                              )}
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
