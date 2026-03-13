// Settings page — AI configuration, Google Drive, and user preferences
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, Input } from "@/components/ui";
import { GoogleDriveConnect } from "@/components/shared/GoogleDriveConnect";
import {
  getAIConfig,
  setAIConfig,
  clearAIConfig,
  AVAILABLE_MODELS,
  DEFAULT_MODELS,
  type AIProvider,
  type AIConfig,
} from "@/lib/ai/config";
import { testAIConnection } from "@/lib/ai/client";

// User preferences stored in localStorage
interface UserPreferences {
  defaultBuildName: string;
  showVerificationBadges: boolean;
  compactMode: boolean;
}

const PREFS_STORAGE_KEY = "shd-planner-preferences";
const DEFAULT_PREFS: UserPreferences = {
  defaultBuildName: "New Build",
  showVerificationBadges: true,
  compactMode: false,
};

/** Load preferences from localStorage */
function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const stored = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Save preferences to localStorage */
function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

export default function SettingsPage() {
  // AI configuration state
  const [aiConfig, setAiConfigState] = useState<AIConfig>(() => getAIConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // User preferences state
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());

  // Save indicator
  const [saved, setSaved] = useState(false);

  // Persist AI config changes
  const updateAIConfig = useCallback((updates: Partial<AIConfig>) => {
    const updated = { ...aiConfig, ...updates };
    // When switching providers, reset model to default for that provider
    if (updates.provider && updates.provider !== aiConfig.provider && !updates.model) {
      updated.model = DEFAULT_MODELS[updates.provider];
    }
    setAiConfigState(updated);
    setAIConfig(updates);
    setTestResult(null);
  }, [aiConfig]);

  // Test AI connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testAIConnection(aiConfig);
    setTestResult(result);
    setTesting(false);
  };

  // Clear AI configuration
  const handleClearAI = () => {
    clearAIConfig();
    setAiConfigState(getAIConfig());
    setTestResult(null);
    setShowKey(false);
  };

  // Update and persist preferences
  const updatePrefs = (updates: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...updates };
    setPrefs(updated);
    savePreferences(updated);
    showSaved();
  };

  // Show "Saved" indicator briefly
  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Mask API key for display
  const maskedKey = aiConfig.apiKey
    ? `${aiConfig.apiKey.slice(0, 8)}${"*".repeat(Math.max(0, aiConfig.apiKey.length - 12))}${aiConfig.apiKey.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-2 text-foreground-secondary">
            Configure AI integration, Google Drive backup, and display preferences.
          </p>
          {saved && (
            <span className="inline-flex items-center mt-2 text-xs font-medium text-success">
              Settings saved
            </span>
          )}
        </div>

        <div className="space-y-8">
          {/* --- Section 1: AI Configuration --- */}
          <Card>
            <h2 className="text-lg font-semibold text-foreground mb-1">AI Configuration</h2>
            <p className="text-sm text-foreground-secondary mb-6">
              Bring your own API key for AI-powered build analysis. Keys are stored in your browser only — never sent to our servers.
            </p>

            <div className="space-y-5">
              {/* Enable toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiConfig.enabled}
                  onChange={(e) => updateAIConfig({ enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-shd-orange"
                />
                <span className="text-sm text-foreground">Enable AI features</span>
              </label>

              {aiConfig.enabled && (
                <>
                  {/* Provider selector */}
                  <div className="space-y-1">
                    <label className="block text-xs uppercase tracking-wider text-foreground-secondary">
                      Provider
                    </label>
                    <select
                      value={aiConfig.provider}
                      onChange={(e) => updateAIConfig({ provider: e.target.value as AIProvider })}
                      className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 focus:outline-none focus:border-shd-orange cursor-pointer"
                    >
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="openai">OpenAI (GPT)</option>
                    </select>
                  </div>

                  {/* API Key */}
                  <div className="space-y-1">
                    <label className="block text-xs uppercase tracking-wider text-foreground-secondary">
                      API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showKey ? "text" : "password"}
                        value={showKey ? aiConfig.apiKey : maskedKey}
                        onChange={(e) => updateAIConfig({ apiKey: e.target.value })}
                        placeholder={`Enter your ${aiConfig.provider === "anthropic" ? "Anthropic" : "OpenAI"} API key...`}
                        className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? "Hide" : "Show"}
                      </Button>
                    </div>
                    <p className="text-xs text-foreground-secondary">
                      {aiConfig.provider === "anthropic"
                        ? "Starts with sk-ant-"
                        : "Starts with sk-"}
                    </p>
                  </div>

                  {/* Model selector */}
                  <div className="space-y-1">
                    <label className="block text-xs uppercase tracking-wider text-foreground-secondary">
                      Model
                    </label>
                    <select
                      value={aiConfig.model}
                      onChange={(e) => updateAIConfig({ model: e.target.value })}
                      className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 focus:outline-none focus:border-shd-orange cursor-pointer"
                    >
                      {AVAILABLE_MODELS[aiConfig.provider].map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Test Connection + Clear */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={!aiConfig.apiKey || testing}
                    >
                      {testing ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleClearAI}
                    >
                      Clear Configuration
                    </Button>
                  </div>

                  {/* Test result */}
                  {testResult && (
                    <div
                      className={`rounded-md p-3 text-sm ${
                        testResult.success
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-core-red/10 text-core-red border border-core-red/20"
                      }`}
                    >
                      {testResult.message}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* --- Section 2: Google Drive --- */}
          <Card>
            <h2 className="text-lg font-semibold text-foreground mb-1">Google Drive Backup</h2>
            <p className="text-sm text-foreground-secondary mb-6">
              Back up your saved builds to Google Drive. Requires a Google account.
            </p>
            <GoogleDriveConnect />
          </Card>

          {/* --- Section 3: Preferences --- */}
          <Card>
            <h2 className="text-lg font-semibold text-foreground mb-1">Preferences</h2>
            <p className="text-sm text-foreground-secondary mb-6">
              Customize the app experience. Saved automatically to your browser.
            </p>

            <div className="space-y-5">
              {/* Default build name */}
              <Input
                label="Default Build Name"
                value={prefs.defaultBuildName}
                onChange={(e) => updatePrefs({ defaultBuildName: e.target.value })}
                placeholder="New Build"
              />

              {/* Show verification badges */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.showVerificationBadges}
                  onChange={(e) => updatePrefs({ showVerificationBadges: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-shd-orange"
                />
                <div>
                  <span className="text-sm text-foreground">Show data verification badges</span>
                  <p className="text-xs text-foreground-secondary">
                    Display verified/unverified indicators on database items
                  </p>
                </div>
              </label>

              {/* Compact mode */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.compactMode}
                  onChange={(e) => updatePrefs({ compactMode: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-shd-orange"
                />
                <div>
                  <span className="text-sm text-foreground">Compact mode</span>
                  <p className="text-xs text-foreground-secondary">
                    Reduce spacing and use smaller cards in the database browser
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* --- Section 4: Data Updates --- */}
          <Card>
            <h2 className="text-lg font-semibold text-foreground mb-1">Data Updates</h2>
            <p className="text-sm text-foreground-secondary mb-4">
              Game data is bundled with the app and can auto-update in Docker deployments.
            </p>
            <DataInfo />
            <DataUpdateStatus />
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Data update status and "Check Now" button for Docker deployments */
function DataUpdateStatus() {
  const [updateStatus, setUpdateStatus] = useState<{
    lastUpdate: string | null;
    nextCheck: string | null;
    status: string;
    lastResult: {
      success: boolean;
      changelog: { added: string[]; updated: string[]; removed: string[]; unchanged: number };
      duration: number;
      timestamp: string;
    } | null;
    error?: string;
    autoUpdateAvailable: boolean;
  } | null>(null);
  const [triggering, setTriggering] = useState(false);

  // Fetch update status on mount and poll every 10s while updating
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/data-status");
      if (res.ok) {
        setUpdateStatus(await res.json());
      }
    } catch {
      // Silently ignore — endpoint may not exist in dev
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while status is "checking" or "updating"
  useEffect(() => {
    if (updateStatus?.status === "checking" || updateStatus?.status === "updating") {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [updateStatus?.status, fetchStatus]);

  // Trigger manual update
  const handleCheckNow = async () => {
    setTriggering(true);
    try {
      const res = await fetch("/api/data-update", { method: "POST" });
      if (res.ok) {
        // Re-fetch status after a short delay
        setTimeout(fetchStatus, 1000);
      }
    } catch {
      // Ignore
    } finally {
      setTriggering(false);
    }
  };

  // Don't show if auto-updates aren't available (dev mode)
  if (updateStatus === null) return null;
  if (!updateStatus.autoUpdateAvailable) return null;

  const statusLabels: Record<string, { text: string; color: string }> = {
    idle: { text: "Idle", color: "text-foreground-secondary" },
    checking: { text: "Checking for updates...", color: "text-shd-orange" },
    updating: { text: "Updating data...", color: "text-shd-orange" },
    error: { text: "Error", color: "text-core-red" },
  };

  const statusInfo = statusLabels[updateStatus.status] ?? statusLabels.idle;

  return (
    <div className="mt-4 space-y-3">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          {updateStatus.error && (
            <span className="text-xs text-core-red">
              ({updateStatus.error.substring(0, 60)})
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCheckNow}
          disabled={triggering || updateStatus.status === "checking" || updateStatus.status === "updating"}
        >
          {triggering ? "Starting..." : "Check Now"}
        </Button>
      </div>

      {/* Update details */}
      <div className="grid grid-cols-2 gap-3">
        {updateStatus.lastUpdate && (
          <div className="rounded bg-background-tertiary px-3 py-2">
            <p className="text-[10px] text-foreground-secondary uppercase">Last Updated</p>
            <p className="text-sm font-mono text-foreground">
              {new Date(updateStatus.lastUpdate).toLocaleDateString()} {new Date(updateStatus.lastUpdate).toLocaleTimeString()}
            </p>
          </div>
        )}
        {updateStatus.nextCheck && (
          <div className="rounded bg-background-tertiary px-3 py-2">
            <p className="text-[10px] text-foreground-secondary uppercase">Next Check</p>
            <p className="text-sm font-mono text-foreground">
              {new Date(updateStatus.nextCheck).toLocaleDateString()} {new Date(updateStatus.nextCheck).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Change summary from last update */}
      {updateStatus.lastResult && (
        <div className={`rounded-md p-3 text-sm ${
          updateStatus.lastResult.success
            ? "bg-success/10 text-success border border-success/20"
            : "bg-core-red/10 text-core-red border border-core-red/20"
        }`}>
          {updateStatus.lastResult.success ? (
            <>
              <span className="font-medium">Last update successful</span>
              {" "}({(updateStatus.lastResult.duration / 1000).toFixed(0)}s)
              {(updateStatus.lastResult.changelog.added.length > 0 ||
                updateStatus.lastResult.changelog.updated.length > 0) && (
                <span className="block mt-1 text-xs">
                  {updateStatus.lastResult.changelog.added.length > 0 &&
                    `${updateStatus.lastResult.changelog.added.length} added`}
                  {updateStatus.lastResult.changelog.added.length > 0 &&
                    updateStatus.lastResult.changelog.updated.length > 0 && ", "}
                  {updateStatus.lastResult.changelog.updated.length > 0 &&
                    `${updateStatus.lastResult.changelog.updated.length} updated`}
                  {`, ${updateStatus.lastResult.changelog.unchanged} unchanged`}
                </span>
              )}
            </>
          ) : (
            <span className="font-medium">Last update failed</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Display data manifest info */
function DataInfo() {
  const [manifest, setManifest] = useState<{
    version: string;
    gameVersion: string;
    lastDataUpdate: string;
    entityCounts: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    import("@/lib/data-loader").then(({ getManifest }) =>
      getManifest().then(setManifest)
    );
  }, []);

  if (!manifest) {
    return <p className="text-sm text-foreground-secondary">Loading data info...</p>;
  }

  const totalEntities = Object.values(manifest.entityCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded bg-background-tertiary px-3 py-2">
        <p className="text-[10px] text-foreground-secondary uppercase">Data Version</p>
        <p className="text-sm font-mono text-foreground">{manifest.version}</p>
      </div>
      <div className="rounded bg-background-tertiary px-3 py-2">
        <p className="text-[10px] text-foreground-secondary uppercase">Game Version</p>
        <p className="text-sm font-mono text-foreground">{manifest.gameVersion}</p>
      </div>
      <div className="rounded bg-background-tertiary px-3 py-2">
        <p className="text-[10px] text-foreground-secondary uppercase">Total Entities</p>
        <p className="text-sm font-mono text-foreground">{totalEntities}</p>
      </div>
      <div className="rounded bg-background-tertiary px-3 py-2">
        <p className="text-[10px] text-foreground-secondary uppercase">Last Updated</p>
        <p className="text-sm font-mono text-foreground">
          {new Date(manifest.lastDataUpdate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
