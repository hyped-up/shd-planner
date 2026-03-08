import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center">
        {/* SHD Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full border-2 border-shd-orange flex items-center justify-center">
            <span className="text-2xl font-bold text-shd-orange">SHD</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">SHD Planner</h1>
          <p className="text-foreground-secondary text-lg max-w-md">
            Division 2 Build Planner & Game Database
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/builder"
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-8 py-6 transition-colors hover:bg-surface-hover hover:border-shd-orange"
          >
            <span className="text-xl font-semibold text-foreground">
              Build Planner
            </span>
            <span className="text-sm text-foreground-secondary">
              Create, optimize & share builds
            </span>
          </Link>
          <Link
            href="/database"
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-8 py-6 transition-colors hover:bg-surface-hover hover:border-shd-orange"
          >
            <span className="text-xl font-semibold text-foreground">
              Database
            </span>
            <span className="text-sm text-foreground-secondary">
              Browse gear, weapons, talents & skills
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
