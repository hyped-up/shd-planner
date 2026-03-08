// Specialization dropdown selector with passive bonuses display
"use client";

import type { SpecializationType } from "@/lib/types";
import { SPECIALIZATIONS } from "@/lib/constants";

interface SpecSelectorProps {
  selected: SpecializationType | null;
  onChange: (spec: SpecializationType | null) => void;
}

// Specialization signature weapons and key passives (hardcoded summary)
const SPEC_INFO: Record<SpecializationType, { weapon: string; passive: string }> = {
  Survivalist: { weapon: "Crossbow", passive: "+10% damage to status-affected enemies" },
  Demolitionist: { weapon: "M32A1 Grenade Launcher", passive: "+Explosive damage" },
  Sharpshooter: { weapon: "TAC-50 Rifle", passive: "+Headshot damage, +Stability" },
  Gunner: { weapon: "Minigun", passive: "+Armor on Kill, +Rate of Fire" },
  Technician: { weapon: "P-017 Missile Launcher", passive: "+1 Skill Tier, +Skill damage" },
  Firewall: { weapon: "Flamethrower", passive: "+Burn damage, Shield enhancements" },
};

export default function SpecSelector({ selected, onChange }: SpecSelectorProps) {
  const info = selected ? SPEC_INFO[selected] : null;

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Specialization</div>

      {/* Dropdown */}
      <select
        value={selected ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? (val as SpecializationType) : null);
        }}
        className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 focus:outline-none focus:border-shd-orange transition-colors cursor-pointer"
      >
        <option value="">Select specialization...</option>
        {SPECIALIZATIONS.map((spec) => (
          <option key={spec} value={spec}>
            {spec}
          </option>
        ))}
      </select>

      {/* Passive bonuses display */}
      {info && (
        <div className="mt-2 text-xs text-foreground-secondary space-y-1">
          <div>
            <span className="text-shd-orange font-medium">Weapon:</span> {info.weapon}
          </div>
          <div>
            <span className="text-shd-orange font-medium">Passive:</span> {info.passive}
          </div>
        </div>
      )}
    </div>
  );
}
