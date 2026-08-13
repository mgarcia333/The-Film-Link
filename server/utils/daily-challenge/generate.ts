import type { TmdbMovieSummary } from '~~/types/tmdb'
import { findPathBetweenMovies } from '../path-finding/validate'
import { getMovieDetails } from '../tmdb/movie-details'
import { acquireLock, getOrSetCache, releaseLock, waitForCacheKey } from '../kv-cache'
import { getRecognizableMoviePool } from './candidates'
import { createSeededRandom, hashStringToSeed } from './random'

// "camino óptimo de 2 o 3 películas intermedias"
const TARGET_INTERMEDIATE_MOVIES = new Set([2, 3])
const MAX_GENERATION_ATTEMPTS = 40
const LOCK_TTL_SECONDS = 30
const LOCK_WAIT_TIMEOUT_MS = 20000

// Movie/person credit relationships (who's cast, billing order, who
// directed) are the same regardless of TMDB's `language` param - only text
// fields are translated. Selection is pinned to one fixed language so every
// player gets the exact same pair; the result is re-localized on read.
export const DAILY_CHALLENGE_GENERATION_LANGUAGE = 'en-US'

export interface DailyChallenge {
  date: string
  source: TmdbMovieSummary
  destination: TmdbMovieSummary
}

export async function getDailyChallenge(date: string, displayLanguage: string, signal?: AbortSignal): Promise<DailyChallenge> {
  const canonical = await getCanonicalDailyChallenge(date, signal)
  if (displayLanguage === DAILY_CHALLENGE_GENERATION_LANGUAGE) {
    return canonical
  }

  const [source, destination] = await Promise.all([
    getMovieDetails(canonical.source.id, displayLanguage, signal),
    getMovieDetails(canonical.destination.id, displayLanguage, signal),
  ])
  return { date, source, destination }
}

function getCanonicalDailyChallenge(date: string, signal?: AbortSignal): Promise<DailyChallenge> {
  const cacheKey = `daily:${date}`

  return getOrSetCache(cacheKey, undefined, async () => {
    const lockKey = `daily:${date}:lock`
    const gotLock = await acquireLock(lockKey, LOCK_TTL_SECONDS)

    if (!gotLock) {
      const existing = await waitForCacheKey<DailyChallenge>(cacheKey, LOCK_WAIT_TIMEOUT_MS)
      if (existing) {
        return existing
      }
      // The other generator likely died mid-flight; fall through and
      // generate independently rather than waiting forever.
    }

    try {
      return await generateDailyChallenge(date, signal)
    }
    finally {
      await releaseLock(lockKey)
    }
  })
}

async function generateDailyChallenge(date: string, signal?: AbortSignal): Promise<DailyChallenge> {
  const pool = await getRecognizableMoviePool(DAILY_CHALLENGE_GENERATION_LANGUAGE, signal)
  if (pool.length < 2) {
    throw new Error('Not enough eligible candidate movies to build a daily challenge')
  }

  const random = createSeededRandom(hashStringToSeed(date))
  const triedPairs = new Set<string>()

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const [source, destination] = pickDistinctPair(pool, random, triedPairs)
    if (!source) {
      break
    }

    const result = await findPathBetweenMovies(source, destination, DAILY_CHALLENGE_GENERATION_LANGUAGE, signal)
    if (result.connected && result.intermediateMovieCount !== null && TARGET_INTERMEDIATE_MOVIES.has(result.intermediateMovieCount)) {
      return { date, source, destination }
    }
  }

  throw new Error(`Could not find a daily challenge pair for ${date} within ${MAX_GENERATION_ATTEMPTS} attempts`)
}

function pickDistinctPair(
  pool: TmdbMovieSummary[],
  random: () => number,
  triedPairs: Set<string>,
): [TmdbMovieSummary, TmdbMovieSummary] | [null, null] {
  const maxCombinations = (pool.length * (pool.length - 1)) / 2
  if (triedPairs.size >= maxCombinations) {
    return [null, null]
  }

  let source: TmdbMovieSummary
  let destination: TmdbMovieSummary
  let pairKey: string
  do {
    const indexA = Math.floor(random() * pool.length)
    let indexB = Math.floor(random() * pool.length)
    while (indexB === indexA) {
      indexB = Math.floor(random() * pool.length)
    }
    source = pool[indexA]!
    destination = pool[indexB]!
    pairKey = [source.id, destination.id].sort((a, b) => a - b).join('-')
  } while (triedPairs.has(pairKey))

  triedPairs.add(pairKey)
  return [source, destination]
}
