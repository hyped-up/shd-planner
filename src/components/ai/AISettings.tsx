"use client";

// AI Settings panel — configure provider, API key, and model
// All AI features are opt-in; this component controls the global toggle

import { useState, useEffect, useCallback } from "react";
import {
  type AIConfig,
  type AIProvider,
  DEFAULT_AI_CONFIG,
  DEFAULT_MODELS,
  AVAILABLE_MODELS,
  getAIConfig,
  setAIConfig,
  clearAIConfig,
} from "@/lib/ai/config";
import { testAIConnection } from "@/lib/ai/client";

export default function AISettings() {
  const [config, setLocalConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    setLocalConfig(getAIConfig());
    setMounted(true);
  }, []);

  // Persist config changes to localStorage
  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    setLocalConfig((prev) => {
      const next = { ...prev, ...updates };
      // Auto-switch model when provider changes
      if (updates.provider && updates.provider !== prev.provider && !updates.model) {
        next.model = DEFAULT_MODELS[updates.provider];
      }
      setAIConfig(next);
      return next;
    });
    // Clear test result when config changes
    setTestResult(null);
  }, []);

  // Test the AI provider connection
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAIConnection(config);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: "Connection test failed unexpectedly" });
    } finally {
      setTesting(false);
    }
  }, [config]);

  // Clear API key and reset config
  const handleClearKey = useCallback(() => {
    clearAIConfig();
    setLocalConfig(DEFAULT_AI_CONFIG);
    setTestResult(null);
  }, []);

  // Prevent hydration mismatch — render nothing until mounted
  if (!mounted) return null;

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-100">AI Settings</h3>
        {/* Enable/disable toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm text-neutral-400">
            {config.enabled ? "Enabled" : "Disabled"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? "bg-orange-600" : "bg-neutral-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Provider selector */}
      <div className="space-y-2">
        <label htmlFor="ai-provider" className="block text-sm font-medium text-neutral-300">
          Provider
        </label>
        <select
          id="ai-provider"
          value={config.provider}
          onChange={(e) => updateConfig({ provider: e.target.value as AIProvider })}
          className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI (GPT)</option>
        </select>
      </div>

      {/* API key input */}
      <div className="space-y-2">
        <label htmlFor="ai-api-key" className="block text-sm font-medium text-neutral-300">
          API Key
        </label>
        <input
          id="ai-api-key"
          type="password"
          value={config.apiKey}
          onChange={(e) => updateConfig({ apiKey: e.target.value })}
          placeholder={config.provider === "anthropic" ? "sk-ant-..." : "sk-..."}
          className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {/* Model selector */}
      <div className="space-y-2">
        <label htmlFor="ai-model" className="block text-sm font-medium text-neutral-300">
          Model
        </label>
        <select
          id="ai-model"
          value={config.model}
          onChange={(e) => updateConfig({ model: e.target.value })}
          className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {AVAILABLE_MODELS[config.provider].map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Privacy notice */}
      <div className="rounded-md border border-neutral-700 bg-neutral-800/50 p-3">
        <p className="text-xs text-neutral-400 leading-relaxed">
          Your API key is stored locally in your browser and sent directly to{" "}
          <span className="text-neutral-300 font-medium">
            {config.provider === "anthropic" ? "Anthropic" : "OpenAI"}
          </span>
          . We never see or store it on any server.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={!config.apiKey || testing}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        <button
          type="button"
          onClick={handleClearKey}
          className="rounded-md border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          Clear API Key
        </button>
      </div>

      {/* Test result feedback */}
      {testResult && (
        <div
          className={`rounded-md p-3 text-sm ${
            testResult.success
              ? "border border-green-800 bg-green-900/30 text-green-400"
              : "border border-red-800 bg-red-900/30 text-red-400"
          }`}
        >
          {testResult.success ? "Connected" : "Failed"}: {testResult.message}
        </div>
      )}
    </div>
  );
}
