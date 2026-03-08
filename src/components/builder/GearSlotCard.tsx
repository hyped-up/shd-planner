// Gear slot card — shows equipped gear piece or empty placeholder
"use client";

import type { GearSlot, CoreAttributeType } from "@/lib/types";
import { CORE_ATTRIBUTE_TYPES } from "@/lib/constants";
import ItemIcon from "@/components/shared/ItemIcon";

interface GearSlotCardProps {
  slot: GearSlot;
  itemName?: string;
  source?: string;
  coreType?: CoreAttributeType;
  /** Optional icon URL for the gear item image */
  iconUrl?: string;
  onClick: () => void;
}

// Slot icon labels (abbreviated)
const SLOT_ICONS: Record<GearSlot, string> = {
  Mask: "M",
  Backpack: "B",
  Chest: "C",
  Gloves: "G",
  Holster: "H",
  Kneepads: "K",
};

/** Get the left border color class based on the core attribute type */
function getBorderColor(coreType?: CoreAttributeType): string {
  if (!coreType) return "border-l-border";
  switch (coreType) {
    case "weaponDamage":
      return "border-l-core-red";
    case "armor":
      return "border-l-core-blue";
    case "skillTier":
      return "border-l-core-yellow";
    default:
      return "border-l-border";
  }
}

export default function GearSlotCard({ slot, itemName, source, coreType, iconUrl, onClick }: GearSlotCardProps) {
  const isEmpty = !itemName;
  const borderColor = getBorderColor(coreType);
  const coreLabel = coreType ? CORE_ATTRIBUTE_TYPES[coreType].label : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md border border-border ${borderColor} border-l-4 bg-surface hover:bg-surface-hover transition-colors p-3 cursor-pointer group`}
    >
      <div className="flex items-center gap-3">
        {/* Slot icon badge */}
        <div className="flex-shrink-0">
          <ItemIcon iconUrl={iconUrl} fallbackLetter={SLOT_ICONS[slot]} size="md" alt={slot} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Slot name */}
          <div className="text-xs uppercase tracking-wider text-foreground-secondary">{slot}</div>

          {/* Item name or empty message */}
          {isEmpty ? (
            <div className="text-sm text-foreground-secondary italic mt-0.5">Empty — Click to configure</div>
          ) : (
            <div className="mt-0.5">
              <div className="text-sm font-medium text-foreground truncate">{itemName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {source && (
                  <span className="text-xs text-foreground-secondary capitalize">{source}</span>
                )}
                {coreLabel && (
                  <span className={`text-xs ${coreType === "weaponDamage" ? "text-core-red" : coreType === "armor" ? "text-core-blue" : "text-core-yellow"}`}>
                    {coreLabel}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-foreground-secondary group-hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}
