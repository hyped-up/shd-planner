/**
 * Simple toast notification component.
 * Displays success, error, or info messages that auto-dismiss after 3 seconds.
 * Positioned at the bottom-right of the viewport.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";

/** Toast notification types */
export type ToastType = "success" | "error" | "info";

/** A single toast message */
export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// Color styles for each toast type
const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-orange-500 text-white",
};

// Auto-dismiss duration in milliseconds
const AUTO_DISMISS_MS = 3000;

/** Props for the Toast container component */
interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * Toast container that renders all active toast notifications.
 * Fixed position at the bottom-right corner.
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/** Individual toast notification with auto-dismiss */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  // Auto-dismiss after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg text-sm font-medium min-w-[280px] max-w-[400px] animate-slide-in ${TOAST_STYLES[toast.type]}`}
    >
      {/* Type icon */}
      <span className="flex-shrink-0">{getIcon(toast.type)}</span>

      {/* Message */}
      <span className="flex-1">{toast.message}</span>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        type="button"
        aria-label="Dismiss notification"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </button>
    </div>
  );
}

/** Get the icon for a toast type */
function getIcon(type: ToastType): string {
  switch (type) {
    case "success":
      return "\u2713"; // checkmark
    case "error":
      return "\u2717"; // cross
    case "info":
      return "\u2139"; // info circle
  }
}

/**
 * Custom hook for managing toast notifications.
 * Returns the current toast list and a function to add new toasts.
 *
 * Usage:
 *   const { toasts, addToast, dismissToast } = useToast();
 *   addToast("success", "Build saved!");
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add a new toast notification
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  // Dismiss a specific toast by ID
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
