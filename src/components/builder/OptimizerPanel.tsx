// Optimizer panel — configure and run the loadout optimizer
"use client";

import { useState, useCallback } from "react";
import { Button, Card } from "@/components/ui";
import { useBuildStore } from "@/hooks/use-build-store";
import {
  optimizeBuild,
  type OptimizationTarget,
  type OptimizerConstraints,
  type OptimizerResult,
} from "@/lib/calc/optimizer";

// Target options
const TARGETS: { key: OptimizationTarget; label: string; description: string }[] = [
  { key: "dps", label: "Max DPS", description: "Maximize weapon damage, CHC, and CHD" },
  { key: "armor", label: "Max Armor", description: "Maximize total armor and health" },
  { key: "skillDamage", label: "Max Skill Damage", description: "Maximize skill tier and skill damage" },
  { key: "balanced", label: "Balanced", description: "Mix of damage, survivability, and skills" },
];

interface OptimizerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OptimizerPanel({ isOpen, onClose }: OptimizerPanelProps) {
  const importBuild = useBuildStore((s) => s.importBuild);

  const [target, setTarget] = useState<OptimizationTarget>("dps");
  const [minCHC, setMinCHC] = useState<string>("");
  const [minArmor, setMinArmor] = useState<string>("");
  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [running, setRunning] = useState(false);

  // Run the optimizer
  const handleOptimize = useCallback(() => {
    setRunning(true);
    setResult(null);
    setProgress(0);

    // Build constraints
    const constraints: OptimizerConstraints = {};
    if (minCHC) constraints.minCHC = Number(minCHC);
    if (minArmor) constraints.minArmor = Number(minArmor);

    // Run with small delay to allow UI to update
    setTimeout(() => {
      const optimized = optimizeBuild(target, constraints, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });
      setResult(optimized);
      setRunning(false);
    }, 50);
  }, [target, minCHC, minArmor]);

  // Apply result to current build
  const handleApply = useCallback(() => {
    if (!result) return;
    importBuild(result.build);
    onClose();
  }, [result, importBuild, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background-secondary border-l border-border z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-foreground">Loadout Optimizer</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors p-1 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Target selector */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">
              Optimization Target
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TARGETS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTarget(t.key)}
                  className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                    target === t.key
                      ? "border-shd-orange bg-shd-orange/10"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-foreground-secondary">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">
              Constraints (Optional)
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-foreground w-28">Min CHC %</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={minCHC}
                  onChange={(e) => setMinCHC(e.target.value)}
                  placeholder="e.g. 50"
                  className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 focus:outline-none focus:border-shd-orange"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-foreground w-28">Min Armor</label>
                <input
                  type="number"
                  min="0"
                  value={minArmor}
                  onChange={(e) => setMinArmor(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 focus:outline-none focus:border-shd-orange"
                />
              </div>
            </div>
          </div>

          {/* Run button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleOptimize}
            disabled={running}
          >
            {running ? "Optimizing..." : "Run Optimizer"}
          </Button>

          {/* Progress */}
          {running && (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-background-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-shd-orange transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-foreground-secondary">{progressMsg}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-wider text-foreground-secondary">
                Results
              </div>

              {/* Score */}
              <Card>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Optimization Score</span>
                  <span className="text-lg font-bold text-shd-orange">
                    {result.score.toFixed(1)}
                  </span>
                </div>
              </Card>

              {/* Key stats */}
              <Card>
                <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
                  Build Stats
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Weapon DMG</span>
                    <span className="font-mono text-foreground">
                      {(result.stats.totalWeaponDamage * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Armor</span>
                    <span className="font-mono text-foreground">
                      {result.stats.totalArmor.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">CHC</span>
                    <span className="font-mono text-foreground">
                      {(result.stats.criticalHitChance * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">CHD</span>
                    <span className="font-mono text-foreground">
                      {(result.stats.criticalHitDamage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Skill Tier</span>
                    <span className="font-mono text-foreground">
                      {result.stats.totalSkillTier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Health</span>
                    <span className="font-mono text-foreground">
                      {result.stats.totalHealth.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Explanation */}
              <Card>
                <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-2">
                  Reasoning
                </h4>
                <div className="space-y-1">
                  {result.explanation.map((line, i) => (
                    <p key={i} className="text-xs text-foreground-secondary">
                      {line}
                    </p>
                  ))}
                </div>
              </Card>

              {/* Apply button */}
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleApply}
              >
                Apply to Current Build
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
