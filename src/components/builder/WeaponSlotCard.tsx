// Weapon slot card — shows equipped weapon or empty placeholder
"use client";

import type { WeaponSlot } from "@/lib/types";
import ItemIcon from "@/components/shared/ItemIcon";

interface WeaponSlotCardProps {
  slot: WeaponSlot;
  weaponName?: string;
  weaponType?: string;
  talentName?: string;
  /** Optional icon URL for the weapon image */
  iconUrl?: string;
  onClick: () => void;
}

// Readable slot labels
const SLOT_LABELS: Record<WeaponSlot, string> = {
  primary: "Primary",
  secondary: "Secondary",
  sidearm: "Sidearm",
};

// Slot icon badge letters
const SLOT_ICONS: Record<WeaponSlot, string> = {
  primary: "1",
  secondary: "2",
  sidearm: "S",
};

export default function WeaponSlotCard({ slot, weaponName, weaponType, talentName, iconUrl, onClick }: WeaponSlotCardProps) {
  const isEmpty = !weaponName;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border border-border border-l-4 border-l-core-red bg-surface hover:bg-surface-hover transition-colors p-3 cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        {/* Slot icon badge */}
        <div className="flex-shrink-0">
          <ItemIcon iconUrl={iconUrl} fallbackLetter={SLOT_ICONS[slot]} size="md" alt={SLOT_LABELS[slot]} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Slot label */}
          <div className="text-xs uppercase tracking-wider text-foreground-secondary">{SLOT_LABELS[slot]}</div>

          {isEmpty ? (
            <div className="text-sm text-foreground-secondary italic mt-0.5">Empty — Click to configure</div>
          ) : (
            <div className="mt-0.5">
              <div className="text-sm font-medium text-foreground truncate">{weaponName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {weaponType && <span className="text-xs text-foreground-secondary">{weaponType}</span>}
                {talentName && (
                  <>
                    <span className="text-xs text-foreground-secondary">/</span>
                    <span className="text-xs text-shd-orange">{talentName}</span>
                  </>
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
