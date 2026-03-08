import Link from "next/link";

interface UseInBuilderButtonProps {
  /** Item ID passed as query param to the builder */
  itemId: string;
  /** Optional size variant */
  size?: "sm" | "md";
}

/**
 * Orange "Use in Builder" button that links to /builder with the item ID.
 */
export default function UseInBuilderButton({
  itemId,
  size = "sm",
}: UseInBuilderButtonProps) {
  const sizeClasses =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <Link
      href={`/builder?item=${encodeURIComponent(itemId)}`}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-shd-orange text-white font-medium hover:bg-shd-orange-hover transition-colors ${sizeClasses}`}
    >
      {/* Plus icon */}
      <svg
        className="h-3.5 w-3.5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Use in Builder
    </Link>
  );
}
