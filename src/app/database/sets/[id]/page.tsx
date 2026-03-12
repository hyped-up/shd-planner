// Gear set detail page — shows set bonuses, pieces, and chest/backpack talents
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllGearSets, getGearSetById } from "@/lib/data-loader";
import { Badge } from "@/components/ui";

/** Pre-render all gear set detail pages at build time */
export async function generateStaticParams() {
  const sets = await getAllGearSets();
  return sets.map((s) => ({ id: s.id }));
}

/** Generate page metadata from gear set name */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gearSet = await getGearSetById(id);
  return {
    title: gearSet ? `${gearSet.name} — SHD Planner` : "Gear Set Not Found",
  };
}

/** Gear set detail page component */
export default async function GearSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gearSet = await getGearSetById(id);

  // Return 404 if gear set ID does not match any entry
  if (!gearSet) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back navigation */}
        <Link
          href="/database/sets"
          className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-shd-orange transition-colors mb-6"
        >
          <span>&larr;</span>
          <span>Back to Gear Sets</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{gearSet.name}</h1>
            <Badge variant="default" colorClass="bg-core-blue/20 text-core-blue">
              Gear Set
            </Badge>
          </div>
          <p className="text-foreground-secondary">
            {gearSet.pieces.length} pieces available
          </p>
        </div>

        {/* Available pieces / slots */}
        <div className="rounded-lg border border-border bg-surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Available Slots</h2>
          <div className="flex flex-wrap gap-2">
            {gearSet.pieces.map((piece) => (
              <Badge key={piece} variant="default" colorClass="bg-surface-hover text-foreground">
                {piece}
              </Badge>
            ))}
          </div>
        </div>

        {/* Set bonuses at each piece threshold */}
        <div className="rounded-lg border border-border bg-surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Set Bonuses</h2>
          <div className="space-y-4">
            {Object.entries(gearSet.bonuses).map(([pc, bonus]) => (
              <div key={pc} className="flex items-start gap-3">
                {/* Piece count indicator */}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-shd-orange/20 text-shd-orange text-sm font-bold font-mono shrink-0">
                  {pc}
                </span>
                <span className="text-sm text-foreground pt-1.5">
                  {typeof bonus === "string" ? bonus : bonus.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chest and backpack talents */}
        {(gearSet.chestTalent || gearSet.backpackTalent) && (
          <div className="rounded-lg border border-border bg-surface p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Unique Talents</h2>
            <div className="space-y-4">
              {/* Chest talent */}
              {gearSet.chestTalent && (
                <div className="rounded-md bg-background-secondary p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" colorClass="bg-core-red/20 text-core-red">
                      Chest
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {gearSet.chestTalent.name}
                    </span>
                  </div>
                  {gearSet.chestTalent.description && (
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      {gearSet.chestTalent.description}
                    </p>
                  )}
                </div>
              )}

              {/* Backpack talent */}
              {gearSet.backpackTalent && (
                <div className="rounded-md bg-background-secondary p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" colorClass="bg-core-blue/20 text-core-blue">
                      Backpack
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {gearSet.backpackTalent.name}
                    </span>
                  </div>
                  {gearSet.backpackTalent.description && (
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      {gearSet.backpackTalent.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data source attribution */}
        {gearSet._sources.length > 0 && (
          <div className="text-xs text-foreground-secondary">
            <span className="font-semibold uppercase tracking-wider">Sources:</span>{" "}
            {gearSet._sources.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
