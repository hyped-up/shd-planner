"use client";

import { useState } from "react";

interface FilterPanelProps {
  /** Section title */
  title: string;
  /** Available filter options */
  options: string[];
  /** Currently selected options */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
}

/**
 * Multi-select filter panel with checkboxes.
 * Collapsible on mobile via a toggle button.
 */
export default function FilterPanel({
  title,
  options,
  selected,
  onChange,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle a single option in the selected array
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header — always visible, acts as toggle on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground md:cursor-default"
      >
        <span>{title}</span>
        {/* Chevron indicator — only on mobile */}
        <svg
          className={`h-4 w-4 text-foreground-secondary transition-transform md:hidden ${
            isOpen ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Options list — always visible on desktop, toggled on mobile */}
      <div
        className={`border-t border-border px-4 py-2 space-y-1 ${
          isOpen ? "block" : "hidden md:block"
        }`}
      >
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 text-sm text-foreground hover:bg-surface-hover transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="h-4 w-4 rounded border-border bg-background accent-shd-orange"
            />
            <span>{option}</span>
          </label>
        ))}

        {/* Clear all button */}
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="mt-1 w-full text-xs text-shd-orange hover:text-shd-orange-hover transition-colors text-left px-2 py-1"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
