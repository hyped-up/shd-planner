import { describe, expect, it } from "vitest";
import type { IBrandSet, IExoticGear, IGearSet, INamedItem } from "@/lib/types";
import { composeGearSlotOptions } from "@/lib/gear-slot-picker";

describe("composeGearSlotOptions", () => {
  const brands: IBrandSet[] = [
    {
      id: "grupo",
      name: "Grupo Sombra",
      slots: ["Mask", "Chest"],
      coreAttribute: "weaponDamage",
      bonuses: {},
      modSlot: true,
      minorAttributes: 2,
      _verified: true,
      _sources: [],
    },
  ];

  const sets: IGearSet[] = [
    {
      id: "striker",
      name: "Striker's Battlegear",
      pieces: ["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"],
      bonuses: {},
      _verified: true,
      _sources: [],
    },
  ];

  const named: INamedItem[] = [
    {
      id: "coyote-mask",
      name: "Coyote's Mask",
      brand: "grupo",
      slot: "Mask",
      perfectTalent: { name: "Pack Instincts", description: "..." },
      uniqueAttributes: [],
      _verified: true,
      _sources: [],
    },
    {
      id: "memento",
      name: "Memento",
      brand: "exotic",
      slot: "Backpack",
      perfectTalent: { name: "Kill Confirmed", description: "..." },
      uniqueAttributes: [],
      _verified: true,
      _sources: [],
    },
  ];

  const exotics: IExoticGear[] = [
    {
      id: "ninja-bike",
      name: "NinjaBike Messenger Bag",
      slot: "Backpack",
      talent: { name: "Resourceful", description: "..." },
      uniqueAttributes: [],
      obtainMethod: "loot",
      _verified: true,
      _sources: [],
    },
    {
      id: "busy-little-mask",
      name: "Busy Little Mask",
      slot: "Mask",
      talent: { name: "Mask Talent", description: "..." },
      uniqueAttributes: [],
      obtainMethod: "loot",
      _verified: true,
      _sources: [],
    },
  ];

  it("builds a unified list containing all source categories for the slot", () => {
    const options = composeGearSlotOptions("Mask", brands, sets, named, exotics);
    expect(options.map((o) => o.id)).toEqual([
      "busy-little-mask",
      "coyote-mask",
      "grupo",
      "striker",
    ]);
    expect(options.map((o) => o.source)).toEqual([
      "exotic",
      "named",
      "brand",
      "gearset",
    ]);
  });

  it("filters out items that are invalid for the selected slot", () => {
    const options = composeGearSlotOptions("Mask", brands, sets, named, exotics);
    expect(options.some((o) => o.id === "memento")).toBe(false);
    expect(options.some((o) => o.id === "ninja-bike")).toBe(false);
  });
});
