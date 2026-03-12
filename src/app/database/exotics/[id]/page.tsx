// Exotic item detail page — shows exotic gear or weapon with unique talent
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllExoticGear, getAllExoticWeapons, getExoticById } from "@/lib/data-loader";
import { Badge } from "@/components/ui";
import type { IExoticGear, IExoticWeapon } from "@/lib/types";

// Obtain method badge colors for visual distinction
const obtainColors: Record<string, string> = {
  Raid: "bg-core-red/20 text-core-red",
  Legendary: "bg-core-yellow/20 text-core-yellow",
  "Dark Zone": "bg-core-red/20 text-core-red",
  Targeted: "bg-core-blue/20 text-core-blue",
  Season: "bg-core-yellow/20 text-core-yellow",
  Crafted: "bg-success/20 text-success",
  "Open World": "bg-shd-orange/20 text-shd-orange",
  Exotic: "bg-shd-orange/20 text-shd-orange",
};

/** Match obtain method string to a badge color class */
function getObtainColor(method: string): string {
  for (const [key, color] of Object.entries(obtainColors)) {
    if (method.includes(key)) return color;
  }
  return "bg-surface-hover text-foreground-secondary";
}

/** Type guard to check if an exotic is a weapon (has type property from IExoticWeapon) */
function isExoticWeapon(exotic: IExoticGear | IExoticWeapon): exotic is IExoticWeapon {
  return "type" in exotic;
}

/** Pre-render all exotic detail pages at build time */
export async function generateStaticParams() {
  const [gear, weapons] = await Promise.all([getAllExoticGear(), getAllExoticWeapons()]);
  return [...gear, ...weapons].map((e) => ({ id: e.id }));
}

/** Generate page metadata from exotic name */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exotic = await getExoticById(id);
  return {
    title: exotic ? `${exotic.name} — SHD Planner` : "Exotic Not Found",
  };
}

/** Exotic item detail page component */
export default async function ExoticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exotic = await getExoticById(id);

  // Return 404 if exotic ID does not match any entry
  if (!exotic) {
    notFound();
  }

  const isWeapon = isExoticWeapon(exotic);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back navigation */}
        <Link
          href="/database/exotics"
          className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-shd-orange transition-colors mb-6"
        >
          <span>&larr;</span>
          <span>Back to Exotics</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{exotic.name}</h1>
            <Badge variant="default" colorClass="bg-shd-orange/20 text-shd-orange">
              Exotic
            </Badge>
            {/* Show weapon type or gear slot */}
            {isWeapon ? (
              <Badge variant="default" colorClass="bg-core-red/20 text-core-red">
                {exotic.type}
              </Badge>
            ) : (
              <Badge variant="default" colorClass="bg-core-blue/20 text-core-blue">
                {"slot" in exotic ? exotic.slot : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Weapon stats grid (only for exotic weapons) */}
        {isWeapon && (exotic.rpm > 0 || exotic.magSize > 0) && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* RPM stat card */}
            <div className="rounded-lg border border-border bg-surface p-4 text-center">
              <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
                RPM
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {exotic.rpm.toLocaleString()}
              </p>
            </div>

            {/* Magazine size stat card */}
            <div className="rounded-lg border border-border bg-surface p-4 text-center">
              <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
                Magazine
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {exotic.magSize}
              </p>
            </div>

            {/* Base damage stat card */}
            <div className="rounded-lg border border-border bg-surface p-4 text-center">
              <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
                Base Damage
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {exotic.baseDamage.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Unique talent */}
        <div className="rounded-lg border border-border bg-surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Unique Talent</h2>
          <div className="rounded-md bg-background-secondary p-4">
            <h3 className="text-sm font-semibold text-shd-orange mb-2">
              {exotic.talent.name}
            </h3>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              {exotic.talent.description}
            </p>
          </div>
        </div>

        {/* How to obtain */}
        <div className="rounded-lg border border-border bg-surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">How to Obtain</h2>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getObtainColor(
              exotic.obtainMethod
            )}`}
          >
            {exotic.obtainMethod}
          </span>
        </div>

        {/* Data source attribution */}
        {exotic._sources.length > 0 && (
          <div className="text-xs text-foreground-secondary">
            <span className="font-semibold uppercase tracking-wider">Sources:</span>{" "}
            {exotic._sources.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
