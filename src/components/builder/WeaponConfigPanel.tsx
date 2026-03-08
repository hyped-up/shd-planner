// Weapon configuration panel — slide-out modal for configuring a weapon slot
"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeaponSlot, WeaponType, IBuildWeapon } from "@/lib/types";
import { WEAPON_TYPES } from "@/lib/constants";
import { useBuildStore } from "@/hooks/use-build-store";

interface WeaponConfigPanelProps {
  isOpen: boolean;
  slot: WeaponSlot;
  onClose: () => void;
}

// Readable slot labels
const SLOT_LABELS: Record<WeaponSlot, string> = {
  primary: "Primary",
  secondary: "Secondary",
  sidearm: "Sidearm",
};

// Weapon mod slot types
const MOD_SLOTS = [
  { key: "optic" as const, label: "Optic" },
  { key: "magazine" as const, label: "Magazine" },
  { key: "muzzle" as const, label: "Muzzle" },
  { key: "underbarrel" as const, label: "Underbarrel" },
];

/**
 * Inner component — remounts each time the panel opens to reset state.
 */
function WeaponConfigPanelInner({ slot, onClose }: { slot: WeaponSlot; onClose: () => void }) {
  const setWeapon = useBuildStore((s) => s.setWeapon);
  const currentWeapon = useBuildStore((s) => s.currentBuild.weapons[slot]);

  // Local state — initialized from store on mount
  const [weaponType, setWeaponType] = useState<WeaponType | "">(
    ""
  );
  const [weaponId, setWeaponId] = useState(currentWeapon?.weaponId ?? "");
  const [talentId, setTalentId] = useState(currentWeapon?.talent?.talentId ?? "");
  const [mods, setMods] = useState<Record<string, string>>({
    optic: currentWeapon?.mods?.optic ?? "",
    magazine: currentWeapon?.mods?.magazine ?? "",
    muzzle: currentWeapon?.mods?.muzzle ?? "",
    underbarrel: currentWeapon?.mods?.underbarrel ?? "",
  });

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /** Apply weapon configuration */
  function handleApply() {
    if (!weaponId.trim() || !talentId.trim()) return;

    const weapon: IBuildWeapon = {
      slotId: slot,
      weaponId: weaponId.trim(),
      talent: { talentId: talentId.trim() },
      mods: {
        optic: mods.optic || undefined,
        magazine: mods.magazine || undefined,
        muzzle: mods.muzzle || undefined,
        underbarrel: mods.underbarrel || undefined,
      },
    };
    setWeapon(slot, weapon);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background-secondary border-l border-border z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-foreground">Configure {SLOT_LABELS[slot]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors p-1 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Step 1: Weapon Type */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 1: Weapon Type</div>
            <div className="grid grid-cols-2 gap-1">
              {WEAPON_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWeaponType(type)}
                  className={`text-xs font-medium px-2 py-2 rounded transition-colors cursor-pointer ${
                    weaponType === type
                      ? "bg-shd-orange text-background"
                      : "bg-surface text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Specific Weapon */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 2: Select Weapon</div>
            <input
              type="text"
              value={weaponId}
              onChange={(e) => setWeaponId(e.target.value)}
              placeholder="Enter weapon name or ID..."
              className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Weapon database integration coming in a future phase. Enter the weapon name manually.
            </p>
          </div>

          {/* Step 3: Talent */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 3: Choose Talent</div>
            <input
              type="text"
              value={talentId}
              onChange={(e) => setTalentId(e.target.value)}
              placeholder="Enter talent name..."
              className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Talent database integration coming in a future phase.
            </p>
          </div>

          {/* Step 4: Weapon Mods */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 4: Weapon Mods</div>
            <div className="space-y-2">
              {MOD_SLOTS.map((modSlot) => (
                <div key={modSlot.key} className="flex items-center gap-2">
                  <label className="text-xs text-foreground-secondary w-20">{modSlot.label}</label>
                  <input
                    type="text"
                    value={mods[modSlot.key]}
                    onChange={(e) => setMods({ ...mods, [modSlot.key]: e.target.value })}
                    placeholder={`${modSlot.label} mod (optional)...`}
                    className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-xs px-2 py-1.5 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 p-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleApply}
            disabled={!weaponId.trim() || !talentId.trim()}
            className="flex-1 rounded bg-shd-orange hover:bg-shd-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-background font-medium text-sm px-4 py-2.5 transition-colors cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-border bg-surface hover:bg-surface-hover text-foreground text-sm px-4 py-2.5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/** Wrapper that conditionally renders the inner panel (remounts to reset state) */
export default function WeaponConfigPanel({ isOpen, slot, onClose }: WeaponConfigPanelProps) {
  if (!isOpen) return null;
  return <WeaponConfigPanelInner key={slot} slot={slot} onClose={onClose} />;
}
