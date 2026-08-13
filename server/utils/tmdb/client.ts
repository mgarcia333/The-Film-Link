import { dedupeRequest, withConcurrencyLimit } from './concurrency'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const REQUEST_TIMEOUT_MS = 6000

export type TmdbErrorCode = 'TMDB_TIMEOUT' | 'TMDB_RATE_LIMITED' | 'TMDB_NOT_FOUND' | 'TMDB_UNAVAILABLE'

export class TmdbError extends Error {
  code: TmdbErrorCode

  constructor(code: TmdbErrorCode, message: string) {
    super(message)
    this.name = 'TmdbError'
    this.code = code
  }
}

type TmdbParams = Record<string, string | number | undefined>

export async function tmdbFetch<T>(path: string, params: TmdbParams = {}, signal?: AbortSignal): Promise<T> {
  const requestKey = buildRequestKey(path, params)
  return dedupeRequest(requestKey, () =>
    withConcurrencyLimit(() => performFetch<T>(path, params, signal)),
  )
}

function buildRequestKey(path: string, params: TmdbParams): string {
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
  return `${path}?${sortedEntries.map(([key, value]) => `${key}=${value}`).join('&')}`
}

async function performFetch<T>(path: string, params: TmdbParams, externalSignal?: AbortSignal): Promise<T> {
  const config = useRuntimeConfig()
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS)
  const signal = externalSignal ? AbortSignal.any([timeoutController.signal, externalSignal]) : timeoutController.signal

  const url = new URL(TMDB_BASE_URL + path)
  url.searchParams.set('api_key', config.tmdbApiKey)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  try {
    const response = await fetch(url, { signal })

    // Workers caps how many concurrent fetch() responses can have an
    // unread body; throwing here without draining it leaves the
    // connection open until GC, and enough of those in flight at once
    // (a difficulty search alone can throw on dozens of 404s) triggers
    // Cloudflare to force-cancel the oldest one to avoid deadlock - which
    // then surfaces as a spurious, unrelated fetch failure elsewhere.
    if (response.status === 404) {
      await response.body?.cancel()
      throw new TmdbError('TMDB_NOT_FOUND', `TMDB resource not found: ${path}`)
    }
    if (response.status === 429) {
      await response.body?.cancel()
      throw new TmdbError('TMDB_RATE_LIMITED', `TMDB rate limit exceeded: ${path}`)
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw new TmdbError('TMDB_UNAVAILABLE', `TMDB request failed with status ${response.status}: ${path}`)
    }

    const data = (await response.json()) as T | null
    if (data === null) {
      throw new TmdbError('TMDB_UNAVAILABLE', `TMDB returned an empty response: ${path}`)
    }
    return data
  }
  catch (error) {
    if (error instanceof TmdbError) {
      throw error
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TmdbError('TMDB_TIMEOUT', `TMDB request timed out or was cancelled: ${path}`)
    }
    throw new TmdbError('TMDB_UNAVAILABLE', `TMDB request errored: ${path}`)
  }
  finally {
    clearTimeout(timeout)
  }
}
