// Database hub page — shows categories with real entity counts
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/shared";
import { getManifest } from "@/lib/data-loader";

// Category definitions with routing info
const categoryDefs = [
  {
    name: "Brand Sets & Named Items",
    href: "/database/gear",
    description: "Browse all brand sets with their 1/2/3-piece bonuses and associated named items.",
    countKey: "brands",
    icon: "shield",
  },
  {
    name: "Gear Sets",
    href: "/database/sets",
    description: "View gear set bonuses, chest and backpack talents, and 4-piece effects.",
    countKey: "gearSets",
    icon: "layers",
  },
  {
    name: "Weapons",
    href: "/database/weapons",
    description: "All weapon archetypes with RPM, magazine size, and base damage stats.",
    countKey: "weapons",
    icon: "crosshair",
  },
  {
    name: "Talents",
    href: "/database/talents",
    description: "Gear and weapon talents with descriptions, slot restrictions, and damage types.",
    countKey: "talents",
    icon: "zap",
  },
  {
    name: "Skills",
    href: "/database/skills",
    description: "Skill categories, variants, and tier scaling tables.",
    countKey: "skills",
    icon: "cpu",
  },
  {
    name: "Exotics",
    href: "/database/exotics",
    description: "Exotic gear and weapons with unique talents and how-to-obtain info.",
    countKey: "exotics",
    icon: "star",
  },
];

// Simple icon components for each category
function CategoryIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    shield: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4.5v5c0 4.7-3.4 9-8 10.5C7.4 21.5 4 17.2 4 12.5v-5L12 3z" />
      </svg>
    ),
    layers: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    crosshair: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      </svg>
    ),
    zap: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    cpu: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path strokeLinecap="round" d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
      </svg>
    ),
    star: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  };
  return <span className="text-shd-orange">{iconMap[icon] || null}</span>;
}

export default function DatabasePage() {
  const [search, setSearch] = useState("");
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});

  // Load manifest for real entity counts
  useEffect(() => {
    getManifest().then((manifest) => {
      if (manifest?.entityCounts) {
        setEntityCounts(manifest.entityCounts);
      }
    });
  }, []);

  // Build categories with real counts
  const categories = categoryDefs.map((cat) => ({
    ...cat,
    count: entityCounts[cat.countKey] ?? 0,
  }));

  // Filter categories by search term
  const filtered = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
  );

  // Total items across all categories
  const totalItems = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Game Database</h1>
          <p className="mt-2 text-foreground-secondary">
            Browse {totalItems > 0 ? `${totalItems}+` : ""} items across {categories.length} categories. All Division 2 gear, weapons, talents, skills, and exotics.
          </p>
        </div>

        {/* Global search */}
        <div className="mb-8">
          <SearchBar
            placeholder="Search all categories..."
            onChange={setSearch}
          />
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group rounded-lg border border-border bg-surface p-5 transition-all hover:bg-surface-hover hover:border-shd-orange/60 hover:shadow-lg hover:shadow-shd-orange/5"
            >
              <div className="flex items-start justify-between">
                <CategoryIcon icon={cat.icon} />
                {/* Count badge */}
                {cat.count > 0 && (
                  <span className="inline-flex items-center rounded-full bg-shd-orange/15 px-2.5 py-0.5 text-xs font-semibold text-shd-orange">
                    {cat.count}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-shd-orange transition-colors">
                {cat.name}
              </h2>
              <p className="mt-1.5 text-sm text-foreground-secondary leading-relaxed">
                {cat.description}
              </p>
              {/* Explore arrow */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-shd-orange opacity-0 group-hover:opacity-100 transition-opacity">
                Explore
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-foreground-secondary">No categories match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
