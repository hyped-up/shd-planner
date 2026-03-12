// Filter tabs — weapon type, database category, source selection
"use client";

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Use pill style (rounded-full) vs. block style */
  variant?: "pill" | "block";
}

export default function Tabs({
  tabs,
  activeKey,
  onChange,
  variant = "pill",
}: TabsProps) {
  const baseClasses =
    variant === "pill"
      ? "rounded-full px-3.5 py-1.5"
      : "rounded px-2 py-2";

  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`text-sm font-medium transition-colors cursor-pointer ${baseClasses} ${
            activeKey === tab.key
              ? "bg-shd-orange text-white"
              : "bg-surface text-foreground-secondary border border-border hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
