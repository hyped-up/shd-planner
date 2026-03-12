// Weapon detail page — shows full stats for a single weapon archetype
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllWeapons, getWeaponById } from "@/lib/data-loader";
import { Badge } from "@/components/ui";

/** Pre-render all weapon detail pages at build time */
export async function generateStaticParams() {
  const weapons = await getAllWeapons();
  return weapons.map((w) => ({ id: w.id }));
}

/** Generate page metadata from weapon name */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const weapon = await getWeaponById(id);
  return {
    title: weapon ? `${weapon.name} — SHD Planner` : "Weapon Not Found",
  };
}

/** Weapon detail page component */
export default async function WeaponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const weapon = await getWeaponById(id);

  // Return 404 if weapon ID does not match any entry
  if (!weapon) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back navigation */}
        <Link
          href="/database/weapons"
          className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-shd-orange transition-colors mb-6"
        >
          <span>&larr;</span>
          <span>Back to Weapons</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{weapon.name}</h1>
            <Badge variant="default" colorClass="bg-core-red/20 text-core-red">
              {weapon.type}
            </Badge>
          </div>
          {weapon.nativeAttribute && (
            <p className="text-foreground-secondary">
              Native attribute: <span className="text-shd-orange">{weapon.nativeAttribute}</span>
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* RPM stat card */}
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
              RPM
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {weapon.rpm.toLocaleString()}
            </p>
          </div>

          {/* Magazine size stat card */}
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
              Magazine
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {weapon.magSize}
            </p>
          </div>

          {/* Base damage stat card */}
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
              Base Damage
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {weapon.baseDamage.toLocaleString()}
            </p>
          </div>

          {/* Reload speed stat card */}
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1">
              Reload Speed
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {weapon.reloadSpeed > 0 ? `${weapon.reloadSpeed.toFixed(1)}s` : "—"}
            </p>
          </div>
        </div>

        {/* Mod slots section */}
        {weapon.modSlots.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Mod Slots</h2>
            <div className="flex flex-wrap gap-2">
              {weapon.modSlots.map((slot) => (
                <Badge key={slot} variant="default" colorClass="bg-surface-hover text-foreground">
                  {slot}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Data source attribution */}
        {weapon._sources.length > 0 && (
          <div className="text-xs text-foreground-secondary">
            <span className="font-semibold uppercase tracking-wider">Sources:</span>{" "}
            {weapon._sources.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
