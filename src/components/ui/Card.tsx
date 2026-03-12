// Consistent card wrapper for database items and builder sections
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Highlight border on hover */
  interactive?: boolean;
}

export default function Card({
  children,
  className = "",
  interactive = false,
}: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-4 ${
        interactive
          ? "transition-all hover:border-shd-orange/60 hover:bg-surface-hover hover:shadow-lg hover:shadow-shd-orange/5"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
