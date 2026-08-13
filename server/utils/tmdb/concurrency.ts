// TMDB tolerates modest parallelism; this keeps us well under its rate limits
// even when a bidirectional search fans out across both frontiers at once.
const MAX_CONCURRENT_REQUESTS = 8

let activeRequests = 0
const waiting: Array<() => void> = []

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++
    return
  }
  await new Promise<void>(resolve => waiting.push(resolve))
  activeRequests++
}

function releaseSlot(): void {
  activeRequests--
  const next = waiting.shift()
  if (next) next()
}

export async function withConcurrencyLimit<T>(task: () => Promise<T>): Promise<T> {
  await acquireSlot()
  try {
    return await task()
  }
  finally {
    releaseSlot()
  }
}

const inFlightRequests = new Map<string, Promise<unknown>>()

// Two callers expanding the same movie/person in the same tick share one
// TMDB request instead of issuing duplicate fetches.
export function dedupeRequest<T>(key: string, task: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = task().finally(() => inFlightRequests.delete(key))
  inFlightRequests.set(key, promise)
  return promise as Promise<T>
}
