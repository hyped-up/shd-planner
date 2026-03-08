"use client";

import Image from "next/image";

interface ItemIconProps {
  /** Path to the icon image (e.g. "/icons/brands/providence-defense.png") */
  iconUrl?: string;
  /** Letter to show when no icon is available */
  fallbackLetter: string;
  /** Icon size */
  size?: "sm" | "md" | "lg";
  /** Alt text for accessibility */
  alt?: string;
}

// Map size variants to pixel dimensions and font size classes
const sizeConfig = {
  sm: { px: 24, fontSize: "text-xs" },
  md: { px: 36, fontSize: "text-sm" },
  lg: { px: 48, fontSize: "text-lg" },
} as const;

/**
 * Reusable icon component for gear, weapons, and other items.
 * Renders a Next.js Image when an icon URL is provided, otherwise
 * displays a styled letter badge as a fallback.
 */
export default function ItemIcon({
  iconUrl,
  fallbackLetter,
  size = "md",
  alt = "",
}: ItemIconProps) {
  const { px, fontSize } = sizeConfig[size];

  // Render the actual icon image when a URL is available
  if (iconUrl) {
    return (
      <Image
        src={iconUrl}
        alt={alt}
        width={px}
        height={px}
        className="rounded bg-background-tertiary"
      />
    );
  }

  // Render a letter badge fallback when no icon is available
  return (
    <div
      className={`flex items-center justify-center rounded bg-background-tertiary text-foreground-secondary ${fontSize}`}
      style={{ width: px, height: px }}
      aria-label={alt}
    >
      {fallbackLetter}
    </div>
  );
}
