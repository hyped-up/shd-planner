// Error boundary for builder page
"use client";

export default function BuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Builder Error
        </h2>
        <p className="text-sm text-foreground-secondary">
          {error.message || "Something went wrong loading the build planner."}
        </p>
        <button
          onClick={reset}
          className="rounded bg-shd-orange px-4 py-2 text-sm font-medium text-background hover:bg-shd-orange-hover transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
