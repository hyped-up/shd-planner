// Badge component for tags, core attribute indicators, source labels
import type { ReactNode } from "react";

type BadgeVariant = "default" | "exotic" | "red" | "blue" | "yellow" | "success";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Custom color classes — overrides variant */
  colorClass?: string;
}

// Variant color mappings
const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-hover text-foreground-secondary",
  exotic: "bg-shd-orange/15 text-shd-orange",
  red: "bg-core-red/20 text-core-red",
  blue: "bg-core-blue/20 text-core-blue",
  yellow: "bg-core-yellow/20 text-core-yellow",
  success: "bg-success/20 text-success",
};

export default function Badge({
  children,
  variant = "default",
  colorClass,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        colorClass ?? variantClasses[variant]
      }`}
    >
      {children}
    </span>
  );
}
