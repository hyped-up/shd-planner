// Loading state for builder page
export default function BuilderLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-surface" />
        <div className="h-4 w-96 rounded bg-surface" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
