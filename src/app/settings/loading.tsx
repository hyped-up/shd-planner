// Loading state for settings page
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-32 rounded bg-surface" />
        <div className="h-4 w-80 rounded bg-surface" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
