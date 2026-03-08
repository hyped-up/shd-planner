"use client";

// Smart Search — natural language AI-powered game data query
// Falls back to regular keyword search when AI is disabled

import { useState, useEffect, useRef, useCallback } from "react";
import { getAIConfig, isAIEnabled } from "@/lib/ai/config";
import { sendAIMessage, AIError } from "@/lib/ai/client";
import { smartSearchPrompt } from "@/lib/ai/prompts";

interface SmartSearchProps {
  /** Game data context string to include in the AI prompt */
  gameDataContext?: string;
  /** Callback when user should be redirected to regular keyword search */
  onFallbackSearch?: (query: string) => void;
}

export default function SmartSearch({
  gameDataContext = "",
  onFallbackSearch,
}: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Check AI availability on mount
  useEffect(() => {
    setAiEnabled(isAIEnabled());
  }, []);

  // Auto-scroll response as streaming text arrives
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  /** Send query to AI provider */
  const handleAskAI = useCallback(async () => {
    if (!query.trim()) return;

    // If AI is not enabled, fall back to keyword search
    if (!isAIEnabled()) {
      onFallbackSearch?.(query);
      return;
    }

    const config = getAIConfig();
    setLoading(true);
    setError(null);
    setResponse("");

    const prompt = smartSearchPrompt(query, gameDataContext);

    try {
      await sendAIMessage(config, prompt.system, prompt.user, (chunk) => {
        setResponse((prev) => prev + chunk);
      });
    } catch (err) {
      const message =
        err instanceof AIError
          ? err.message
          : "Search failed. Check your API key and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query, gameDataContext, onFallbackSearch]);

  /** Handle Enter key submission */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAskAI();
      }
    },
    [handleAskAI]
  );

  // Get provider name for badge
  const providerName = getAIConfig().provider === "anthropic" ? "Claude" : "GPT";

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              aiEnabled
                ? "Ask about gear, builds, talents..."
                : "Search gear, builds, talents..."
            }
            className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 pl-9 text-sm text-neutral-100 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {/* Search icon */}
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {/* Action button — changes based on AI availability */}
        <button
          type="button"
          onClick={handleAskAI}
          disabled={!query.trim() || loading}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {aiEnabled ? "Ask AI" : "Search"}
        </button>
      </div>

      {/* AI disabled notice */}
      {!aiEnabled && (
        <p className="text-xs text-neutral-500">
          Enable AI in Settings to use natural language search. Currently using keyword search.
        </p>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-orange-500" />
          <span>Searching...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* AI response */}
      {response && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs font-medium text-neutral-300">
              AI Generated
            </span>
            <span className="text-xs text-neutral-500">Powered by {providerName}</span>
          </div>
          <div
            ref={responseRef}
            className="max-h-80 overflow-y-auto rounded-md border border-neutral-700 bg-[#141820] p-4 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap"
          >
            {response}
          </div>
        </div>
      )}
    </div>
  );
}
