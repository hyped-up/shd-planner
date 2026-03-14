import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import type { IBrandSet, IExoticGear, IGearSet, INamedItem, GearSlot } from "@/lib/types";

export type GearSource = "brand" | "gearset" | "named" | "exotic";

export interface GearPickerOption extends SearchableSelectOption {
  source: GearSource;
}

/**
 * Builds the unified item list for a single gear slot.
 * Keeps source typing attached so build state can preserve model separation.
 */
export function composeGearSlotOptions(
  slot: GearSlot,
  brands: IBrandSet[],
  gearSets: IGearSet[],
  namedItems: INamedItem[],
  exotics: IExoticGear[]
): GearPickerOption[] {
  const brandOptions: GearPickerOption[] = brands
    .filter((brand) => brand.slots.includes(slot))
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      subtitle: "Brand Set",
      source: "brand",
    }));

  const gearSetOptions: GearPickerOption[] = gearSets
    .filter((set) => set.pieces.includes(slot))
    .map((set) => ({
      id: set.id,
      name: set.name,
      subtitle: "Gear Set",
      source: "gearset",
    }));

  const namedOptions: GearPickerOption[] = namedItems
    .filter((item) => item.slot === slot)
    .map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: "Named Item",
      source: "named",
    }));

  const exoticOptions: GearPickerOption[] = exotics
    .filter((item) => item.slot === slot)
    .map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: "Exotic",
      source: "exotic",
    }));

  return [...brandOptions, ...gearSetOptions, ...namedOptions, ...exoticOptions].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
