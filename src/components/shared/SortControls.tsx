"use client";

interface SortOption {
  label: string;
  value: string;
}

interface SortControlsProps {
  /** Available sort options */
  options: SortOption[];
  /** Currently active sort field */
  currentSort: string;
  /** Current sort direction */
  direction: "asc" | "desc";
  /** Callback when sort changes */
  onChange: (sort: string, direction: "asc" | "desc") => void;
}

/**
 * Sort dropdown with ascending/descending toggle button.
 */
export default function SortControls({
  options,
  currentSort,
  direction,
  onChange,
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Sort field dropdown */}
      <select
        value={currentSort}
        onChange={(e) => onChange(e.target.value, direction)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-shd-orange focus:border-shd-orange"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Direction toggle */}
      <button
        onClick={() => onChange(currentSort, direction === "asc" ? "desc" : "asc")}
        title={direction === "asc" ? "Ascending" : "Descending"}
        className="rounded-lg border border-border bg-surface p-2 text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-shd-orange"
      >
        {direction === "asc" ? (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
    </div>
  );
}
