import type { StorageValue } from 'unstorage'

const KV_MOUNT = 'gameKv'

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const storage = useStorage(KV_MOUNT)
  const cached = await storage.getItem<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await fetcher()
  await storage.setItem(key, value as StorageValue, { ttl: ttlSeconds })
  return value
}
