// Loading state for database pages
export default function DatabaseLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-surface" />
        <div className="h-4 w-64 rounded bg-surface" />
        <div className="h-10 w-full rounded bg-surface" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
