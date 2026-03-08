"use client";

// Build Advisor panel — AI-powered build analysis, optimization, and explanation
// Gracefully falls back to "enable AI" message when AI is not configured

import { useState, useEffect, useRef, useCallback } from "react";
import type { IBuild, IBuildStats } from "@/lib/types";
import { getAIConfig, isAIEnabled } from "@/lib/ai/config";
import { sendAIMessage, AIError } from "@/lib/ai/client";
import {
  buildAnalysisPrompt,
  buildOptimizationPrompt,
  buildExplanationPrompt,
} from "@/lib/ai/prompts";
import { serializeBuildForAI } from "@/lib/ai/build-serializer";

/** Optimization goal options */
const OPTIMIZATION_GOALS = [
  { value: "Max DPS", label: "Max DPS" },
  { value: "Survivability", label: "Survivability" },
  { value: "Skill Damage", label: "Skill Damage" },
  { value: "Balanced", label: "Balanced" },
  { value: "PvP", label: "PvP" },
] as const;

/** Action type for the advisor */
type AdvisorAction = "analyze" | "optimize" | "explain";

interface BuildAdvisorProps {
  build: IBuild;
  stats?: IBuildStats;
  /** Whether the panel is expanded */
  isOpen?: boolean;
  /** Callback to toggle panel open/closed */
  onToggle?: () => void;
}

export default function BuildAdvisor({ build, stats, isOpen = false, onToggle }: BuildAdvisorProps) {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>(OPTIMIZATION_GOALS[0].value);
  const [activeAction, setActiveAction] = useState<AdvisorAction | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Check AI availability on mount and when panel opens
  useEffect(() => {
    setAiEnabled(isAIEnabled());
  }, [isOpen]);

  // Auto-scroll response area as streaming text arrives
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  /** Run an AI action with streaming response */
  const runAction = useCallback(
    async (action: AdvisorAction) => {
      const config = getAIConfig();
      if (!config.enabled || !config.apiKey) return;

      setLoading(true);
      setError(null);
      setResponse("");
      setActiveAction(action);

      const buildSummary = serializeBuildForAI(build, stats);

      // Select the right prompt based on action
      let prompt: { system: string; user: string };
      switch (action) {
        case "analyze":
          prompt = buildAnalysisPrompt(buildSummary);
          break;
        case "optimize":
          prompt = buildOptimizationPrompt(buildSummary, selectedGoal);
          break;
        case "explain":
          prompt = buildExplanationPrompt(buildSummary);
          break;
      }

      try {
        await sendAIMessage(config, prompt.system, prompt.user, (chunk) => {
          setResponse((prev) => prev + chunk);
        });
      } catch (err) {
        const message =
          err instanceof AIError
            ? err.message
            : "An unexpected error occurred. Check your API key and try again.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [build, stats, selectedGoal]
  );

  // Get provider name for badge
  const providerName = getAIConfig().provider === "anthropic" ? "Claude" : "GPT";

  return (
    <div className="rounded-lg border border-neutral-700 bg-[#141820] overflow-hidden">
      {/* Header — collapsible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-neutral-100">Build Advisor</h3>
        </div>
        <svg
          className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Panel body */}
      {isOpen && (
        <div className="border-t border-neutral-700 p-4 space-y-4">
          {/* Fallback when AI is not enabled */}
          {!aiEnabled && (
            <div className="rounded-md border border-neutral-600 bg-neutral-800/50 p-4 text-center">
              <p className="text-sm text-neutral-400 mb-2">
                Enable AI in Settings to use the Build Advisor.
              </p>
              <p className="text-xs text-neutral-500">
                Requires your own Anthropic or OpenAI API key.
              </p>
            </div>
          )}

          {/* AI action buttons */}
          {aiEnabled && (
            <>
              <div className="flex flex-wrap gap-2">
                {/* Analyze button */}
                <button
                  type="button"
                  onClick={() => runAction("analyze")}
                  disabled={loading}
                  className="rounded-md bg-orange-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Analyze Build
                </button>

                {/* Optimize dropdown + button */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => runAction("optimize")}
                    disabled={loading}
                    className="rounded-l-md bg-orange-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Optimize For...
                  </button>
                  <select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    className="rounded-r-md border-l border-orange-700 bg-orange-600/80 px-2 py-1.5 text-sm text-white focus:outline-none"
                  >
                    {OPTIMIZATION_GOALS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Explain button */}
                <button
                  type="button"
                  onClick={() => runAction("explain")}
                  disabled={loading}
                  className="rounded-md bg-orange-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Explain Build
                </button>
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500" />
                  <span>
                    {activeAction === "analyze"
                      ? "Analyzing build..."
                      : activeAction === "optimize"
                        ? `Optimizing for ${selectedGoal}...`
                        : "Writing build guide..."}
                  </span>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="rounded-md border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Streaming response area */}
              {response && (
                <div className="space-y-2">
                  {/* AI Generated label + provider badge */}
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs font-medium text-neutral-300">
                      AI Generated
                    </span>
                    <span className="text-xs text-neutral-500">
                      Powered by {providerName}
                    </span>
                  </div>

                  {/* Response text */}
                  <div
                    ref={responseRef}
                    className="max-h-96 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap"
                  >
                    {response}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
