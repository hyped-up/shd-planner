// Brand set detail page — shows full brand info with bonuses and named items
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBrands, getBrandById, getNamedItemsByBrand } from "@/lib/data-loader";
import { Badge } from "@/components/ui";
import type { CoreAttributeType } from "@/lib/types";

// Color mappings for core attribute display
const coreColors: Record<CoreAttributeType, { bg: string; text: string; label: string }> = {
  weaponDamage: { bg: "bg-core-red/20", text: "text-core-red", label: "Weapon Damage" },
  armor: { bg: "bg-core-blue/20", text: "text-core-blue", label: "Armor" },
  skillTier: { bg: "bg-core-yellow/20", text: "text-core-yellow", label: "Skill Tier" },
};

/** Pre-render all brand detail pages at build time */
export async function generateStaticParams() {
  const brands = await getAllBrands();
  return brands.map((b) => ({ id: b.id }));
}

/** Generate page metadata from brand name */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrandById(id);
  return {
    title: brand ? `${brand.name} — SHD Planner` : "Brand Not Found",
  };
}

/** Brand set detail page component */
export default async function GearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Load brand and its associated named items in parallel
  const [brand, namedItems] = await Promise.all([
    getBrandById(id),
    getNamedItemsByBrand(id),
  ]);

  // Return 404 if brand ID does not match any entry
  if (!brand) {
    notFound();
  }

  const core = coreColors[brand.coreAttribute];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back navigation */}
        <Link
          href="/database/gear"
          className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-shd-orange transition-colors mb-6"
        >
          <span>&larr;</span>
          <span>Back to Brand Sets</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{brand.name}</h1>
            <Badge variant="default" colorClass={`${core.bg} ${core.text}`}>
              {core.label}
            </Badge>
          </div>
          <p className="text-foreground-secondary">
            {brand.slots.length} available slots &middot; {brand.minorAttributes} minor attributes
            {brand.modSlot ? " · Mod slot" : ""}
          </p>
        </div>

        {/* Available slots */}
        <div className="rounded-lg border border-border bg-surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Available Slots</h2>
          <div className="flex flex-wrap gap-2">
            {brand.slots.map((slot) => (
              <Badge key={slot} variant="default" colorClass="bg-surface-hover text-foreground">
                {slot}
              </Badge>
            ))}
          </div>
        </div>

        {/* Set bonuses */}
        <div className="rounded-lg border border-border bg-surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Set Bonuses</h2>
          <div className="space-y-3">
            {Object.entries(brand.bonuses).map(([pc, bonus]) => (
              <div key={pc} className="flex items-baseline gap-3">
                <span className="text-sm font-mono font-bold text-shd-orange w-6 shrink-0">
                  {pc}
                </span>
                <span className="text-sm text-foreground">
                  {typeof bonus === "string" ? bonus : bonus.stat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Named items associated with this brand */}
        {namedItems.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Named Items
              <span className="text-sm font-normal text-foreground-secondary ml-2">
                ({namedItems.length})
              </span>
            </h2>
            <div className="space-y-3">
              {namedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md bg-background-secondary p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-shd-orange">
                      {item.name}
                    </span>
                    <Badge variant="default" colorClass="bg-surface-hover text-foreground-secondary">
                      {item.slot}
                    </Badge>
                  </div>
                  {/* Perfect talent info */}
                  {item.perfectTalent.description && (
                    <p className="text-xs text-foreground-secondary mt-1">
                      {item.perfectTalent.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data source attribution */}
        {brand._sources.length > 0 && (
          <div className="text-xs text-foreground-secondary">
            <span className="font-semibold uppercase tracking-wider">Sources:</span>{" "}
            {brand._sources.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
