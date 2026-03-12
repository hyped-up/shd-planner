// Attribute value slider with god-roll color change
"use client";

interface SliderProps {
  min?: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Format the display value */
  formatValue?: (value: number) => string;
  /** Show the god-roll progress bar */
  showBar?: boolean;
}

export default function Slider({
  min = 0,
  max,
  step,
  value,
  onChange,
  formatValue,
  showBar = true,
}: SliderProps) {
  const isGodRoll = value >= max;
  const percent = max > 0 ? (value / max) * 100 : 0;
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-shd-orange"
        />
        <span className="text-sm text-foreground font-medium w-20 text-right">
          {displayValue}
        </span>
      </div>

      {showBar && (
        <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isGodRoll ? "bg-core-yellow" : "bg-shd-orange"
            }`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}

      {isGodRoll && (
        <span className="text-xs text-core-yellow font-medium">God Roll</span>
      )}
    </div>
  );
}
