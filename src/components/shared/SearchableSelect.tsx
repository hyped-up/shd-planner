// Searchable select combobox — filters items as user types, click or keyboard to select
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export interface SearchableSelectOption {
  id: string;
  name: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  const filtered = query
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.id.toLowerCase().includes(query.toLowerCase()) ||
          (o.subtitle && o.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  const safeHighlightIndex = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.min(highlightIndex, filtered.length - 1);
  }, [filtered.length, highlightIndex]);



  useEffect(() => {
    if (isOpen && listRef.current) {
      const el = listRef.current.children[safeHighlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [safeHighlightIndex, isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (option: SearchableSelectOption) => {
      onChange(option.id, option.name);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? query : selectedOption?.name ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
      />

      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-border bg-background-secondary shadow-lg"
        >
          {filtered.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
                index === highlightIndex
                  ? "bg-shd-orange/20 text-foreground"
                  : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              } ${option.id === value ? "font-medium text-shd-orange" : ""}`}
            >
              <div>{option.name}</div>
              {option.subtitle && (
                <div className="text-xs text-foreground-secondary mt-0.5">{option.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && filtered.length === 0 && query && (
        <div className="absolute z-50 mt-1 w-full rounded border border-border bg-background-secondary shadow-lg px-3 py-2 text-sm text-foreground-secondary">
          No matches found
        </div>
      )}
    </div>
  );
}
