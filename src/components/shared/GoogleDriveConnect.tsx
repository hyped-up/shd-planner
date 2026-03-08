/**
 * Google Drive connection button and status display.
 * Shows connect/disconnect state and last sync time.
 */

"use client";

import React, { useCallback, useState } from "react";

/** Connection state for the Google Drive integration */
interface DriveConnectionState {
  connected: boolean;
  connectedAt: string | null;
}

/**
 * Google Drive Connect component.
 * Renders a connect button when disconnected, or connection info when connected.
 */
export function GoogleDriveConnect() {
  // Check connection state from cookies on mount (lazy initializer avoids effect setState)
  const [state, setState] = useState<DriveConnectionState>(() => {
    if (typeof document === "undefined") return { connected: false, connectedAt: null };
    const connectedAt = getCookie("google_connected_at");
    return connectedAt
      ? { connected: true, connectedAt }
      : { connected: false, connectedAt: null };
  });

  // Initiate OAuth flow by navigating to the auth endpoint
  const handleConnect = useCallback(() => {
    window.location.href = "/api/auth/google";
  }, []);

  // Disconnect by clearing Google cookies
  const handleDisconnect = useCallback(() => {
    // Clear cookies by setting them to expire
    document.cookie =
      "google_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "google_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "google_connected_at=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setState({ connected: false, connectedAt: null });
  }, []);

  // Not connected: show connect button
  if (!state.connected) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors"
          type="button"
        >
          {/* Google Drive icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M7.71 3.5L1.15 15L4.58 21L11.13 9.5L7.71 3.5Z" fill="#0066DA" />
            <path d="M16.29 3.5H7.71L14.27 15H22.85L16.29 3.5Z" fill="#00AC47" />
            <path d="M1.15 15L4.58 21H19.42L22.85 15H14.27L1.15 15Z" fill="#FFBA00" />
          </svg>
          Connect Google Drive
        </button>
        <p className="text-xs text-gray-500">
          Back up your builds to Google Drive
        </p>
      </div>
    );
  }

  // Connected: show status and disconnect option
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-800">
            Google Drive Connected
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-600 hover:text-red-800 underline transition-colors"
          type="button"
        >
          Disconnect
        </button>
      </div>
      {state.connectedAt && (
        <p className="text-xs text-green-700">
          Connected since{" "}
          {new Date(state.connectedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

/** Read a cookie value by name from document.cookie */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}
