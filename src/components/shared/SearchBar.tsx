"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SearchBarProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Callback fired with the debounced search value */
  onChange: (value: string) => void;
  /** Debounce delay in milliseconds (default 300) */
  debounceMs?: number;
  /** Initial value */
  defaultValue?: string;
}

/**
 * Debounced search input with search icon and SHD orange focus ring.
 */
export default function SearchBar({
  placeholder = "Search...",
  onChange,
  debounceMs = 300,
  defaultValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback ref so we don't re-trigger the effect on every render
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Debounced dispatch
  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChangeRef.current(newValue);
      }, debounceMs);
    },
    [debounceMs]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md">
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-shd-orange focus:border-shd-orange transition-colors"
      />
    </div>
  );
}
