// Generic key-value cache backed by Cloudflare D1 (see migrations/0001_create_cache.sql).
// Replaced a KV-backed version: same get/set/delete/ttl semantics, but
// without KV's 1,000-writes-per-day account-wide cap, which real gameplay
// plus this feature's own search-and-retry pattern could burn through in a
// single busy day. D1's free tier caps on database size instead, which this
// cache is nowhere near.

function now(): number {
  return Math.floor(Date.now() / 1000)
}

// The binding lives on the Cloudflare execution env, made available on
// globalThis for the lifetime of the request - the same mechanism
// unstorage's own Cloudflare KV/R2 drivers use, so cache calls work from
// anywhere in server code without threading the H3 event through every
// function in the path-finding call chain.
function getDb(): D1Database {
  const db = (globalThis as { __env__?: Env }).__env__?.CACHE_DB
  if (!db) {
    throw new Error('CACHE_DB binding is not available')
  }
  return db
}

export async function getCacheValue<T>(key: string): Promise<T | null> {
  const row = await getDb()
    .prepare('SELECT value FROM cache WHERE key = ?1 AND (expires_at IS NULL OR expires_at > ?2)')
    .bind(key, now())
    .first<{ value: string }>()
  return row ? (JSON.parse(row.value) as T) : null
}

export async function setCacheValue<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const expiresAt = ttlSeconds ? now() + ttlSeconds : null
  try {
    await getDb()
      .prepare(`
        INSERT INTO cache (key, value, expires_at) VALUES (?1, ?2, ?3)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at
      `)
      .bind(key, JSON.stringify(value), expiresAt)
      .run()
  }
  catch {
    // Caching is an optimization, not a correctness requirement. If the
    // write fails for any reason, degrade to "fetched fresh, not cached"
    // instead of failing the caller - the next read just fetches again.
  }
}

export async function removeCacheValue(key: string): Promise<void> {
  try {
    await getDb().prepare('DELETE FROM cache WHERE key = ?1').bind(key).run()
  }
  catch {
    // Worst case a stale row lingers - harmless, and it'll be overwritten
    // or expire naturally next time the same key is set.
  }
}

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number | undefined,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await getCacheValue<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await fetcher()
  await setCacheValue(key, value, ttlSeconds)
  return value
}

// Best-effort lock: a plain read-then-write, same race window SQLite's
// lack of a single atomic "insert if absent" call here would have with any
// backend - two requests can both see the lock as free in a tight race.
// That only costs redundant work here (daily challenge generation is
// deterministic), never a wrong result, which is an acceptable trade-off
// for the simplicity.
export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  const existing = await getCacheValue<boolean>(key)
  if (existing) {
    return false
  }
  await setCacheValue(key, true, ttlSeconds)
  return true
}

export async function releaseLock(key: string): Promise<void> {
  await removeCacheValue(key)
}

export async function waitForCacheKey<T>(key: string, timeoutMs: number, pollIntervalMs = 500): Promise<T | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const value = await getCacheValue<T>(key)
    if (value !== null) {
      return value
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
  return null
}
