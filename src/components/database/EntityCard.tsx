"use client";

import { ReactNode } from "react";
import ItemIcon from "@/components/shared/ItemIcon";

interface Badge {
  label: string;
  /** Tailwind color class for the badge background, e.g. "bg-core-red" */
  colorClass?: string;
}

interface EntityCardProps {
  /** Card title (item name) */
  title: string;
  /** Optional subtitle (category, slot, etc.) */
  subtitle?: string;
  /** Optional icon URL for the item image */
  iconUrl?: string;
  /** Fallback letter when no icon is available (defaults to first letter of title) */
  iconFallback?: string;
  /** Array of colored label badges */
  badges?: Badge[];
  /** Detail content rendered inside the card body */
  children?: ReactNode;
  /** Whether the card is currently expanded */
  expanded?: boolean;
  /** Toggle expand callback */
  onToggle?: () => void;
}

/**
 * Reusable card component for displaying any game entity.
 * Dark surface background with border and hover effect.
 */
export default function EntityCard({
  title,
  subtitle,
  iconUrl,
  iconFallback,
  badges = [],
  children,
  expanded,
  onToggle,
}: EntityCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface transition-colors hover:bg-surface-hover hover:border-shd-orange/50">
      {/* Card header — clickable if onToggle is provided */}
      <div
        className={`px-4 py-3 ${onToggle ? "cursor-pointer" : ""}`}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <ItemIcon iconUrl={iconUrl} fallbackLetter={iconFallback || title[0]} size="md" alt={title} />
            <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-foreground-secondary mt-0.5">{subtitle}</p>
            )}
            </div>
          </div>

          {/* Expand chevron */}
          {onToggle && (
            <svg
              className={`h-4 w-4 shrink-0 text-foreground-secondary transition-transform mt-1 ${
                expanded ? "rotate-180" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {/* Badges row */}
        {badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  badge.colorClass || "bg-shd-orange/20 text-shd-orange"
                }`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expandable content */}
      {(expanded || !onToggle) && children && (
        <div className="border-t border-border px-4 py-3">{children}</div>
      )}
    </div>
  );
}
