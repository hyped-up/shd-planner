// Module-level cache for JSON data imports
// Stores the Promise itself so concurrent calls share one import

const cache = new Map<string, Promise<unknown>>();

/**
 * Wrap an async loader so it only executes once.
 * Subsequent calls return the same Promise (and thus the same resolved value).
 */
export function cachedLoader<T>(key: string, loader: () => Promise<T>): () => Promise<T> {
  return () => {
    if (!cache.has(key)) {
      cache.set(key, loader());
    }
    return cache.get(key) as Promise<T>;
  };
}

/** Clear the entire cache (useful for testing or hot-reload) */
export function clearDataCache(): void {
  cache.clear();
}
