import type { StorageValue } from 'unstorage'

const KV_MOUNT = 'gameKv'

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number | undefined,
  fetcher: () => Promise<T>,
): Promise<T> {
  const storage = useStorage(KV_MOUNT)
  const cached = await storage.getItem<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await fetcher()
  await storage.setItem(key, value as StorageValue, ttlSeconds ? { ttl: ttlSeconds } : undefined)
  return value
}

// Best-effort lock: Cloudflare KV has no compare-and-swap, so two requests
// can both see the lock as free in a tight race. That only costs redundant
// work here (daily challenge generation is deterministic), never a wrong
// result, which is an acceptable trade-off for the simplicity.
export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  const storage = useStorage(KV_MOUNT)
  const existing = await storage.getItem<boolean>(key)
  if (existing) {
    return false
  }
  await storage.setItem(key, true, { ttl: ttlSeconds })
  return true
}

export async function releaseLock(key: string): Promise<void> {
  const storage = useStorage(KV_MOUNT)
  await storage.removeItem(key)
}

export async function waitForCacheKey<T>(key: string, timeoutMs: number, pollIntervalMs = 500): Promise<T | null> {
  const storage = useStorage(KV_MOUNT)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const value = await storage.getItem<T>(key)
    if (value !== null) {
      return value
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
  return null
}
