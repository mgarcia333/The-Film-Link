import type { TmdbMovieSummary } from '~~/types/tmdb'
import type { DifficultyLevel } from '~~/types/difficulty'
import { findPathBetweenMovies, type PathValidationResult } from '../path-finding/validate'
import { getMovieDetails } from '../tmdb/movie-details'
import { getMoviePool, type MoviePoolConfig } from '../tmdb/movie-pool'
import { TmdbError } from '../tmdb/client'

export interface DifficultyChallenge {
  source: TmdbMovieSummary
  destination: TmdbMovieSummary
}

// Selection is pinned to one fixed language for the same reason as the
// daily challenge (server/utils/daily-challenge/generate.ts): credit
// relationships don't change with TMDB's `language` param, only text does.
const GENERATION_LANGUAGE = 'en-US'

// What a player actually experiences as "harder" is not recognizing the
// films, not a bigger number on some internal search metric they never
// see - so difficulty is driven almost entirely by film fame (vote_count
// floor, see movie-pool.ts for why vote_count over popularity). Depth only
// narrows for "easy", to make the win come quick and obvious.
const TIER_POOL_CONFIG: Record<DifficultyLevel, MoviePoolConfig> = {
  easy: { sortBy: 'vote_count.desc', minVoteCount: 8000, pageStart: 1, pageEnd: 3 },
  normal: { sortBy: 'vote_count.desc', minVoteCount: 1500, pageStart: 1, pageEnd: 6 },
  difficult: { sortBy: 'popularity.desc', minVoteCount: 300, pageStart: 8, pageEnd: 16 },
}

const TIER_TARGET_DEPTH: Record<DifficultyLevel, Set<number>> = {
  easy: new Set([1, 2]),
  normal: new Set([2, 3]),
  difficult: new Set([2, 3]),
}

const MAX_GENERATION_ATTEMPTS = 30

// A pair that's genuinely unconnected (common in the sparser "difficult"
// pool) is the single most expensive outcome: the search has to exhaust
// every layer on both sides before it can conclude that. Capping each
// attempt keeps one unlucky pair from eating the whole generation budget -
// it's simply abandoned in favor of a fresh random pair.
const PER_ATTEMPT_TIMEOUT_MS = 3000
// Stop starting new attempts once this much time has passed, leaving
// enough headroom under the api route's own outer timeout for whichever
// attempt is still in flight to be aborted cleanly.
const GENERATION_DEADLINE_MS = 15000

export async function getDifficultyChallenge(
  difficulty: DifficultyLevel,
  displayLanguage: string,
  signal?: AbortSignal,
): Promise<DifficultyChallenge> {
  const canonical = await generateDifficultyChallenge(difficulty, signal)
  return localizeDifficultyChallenge(canonical, displayLanguage, signal)
}

// Split out from getDifficultyChallenge so the ready-pool (see pool.ts) can
// generate once in the background and localize separately, on demand, per
// request - generation is the expensive, TMDB-heavy part; localizing an
// already-known pair of ids is cheap.
export async function localizeDifficultyChallenge(
  canonical: DifficultyChallenge,
  displayLanguage: string,
  signal?: AbortSignal,
): Promise<DifficultyChallenge> {
  if (displayLanguage === GENERATION_LANGUAGE) {
    return canonical
  }

  const [source, destination] = await Promise.all([
    getMovieDetails(canonical.source.id, displayLanguage, signal),
    getMovieDetails(canonical.destination.id, displayLanguage, signal),
  ])
  return { source, destination }
}

export async function generateDifficultyChallenge(difficulty: DifficultyLevel, signal?: AbortSignal): Promise<DifficultyChallenge> {
  const pool = await getMoviePool(`pool:${difficulty}:${GENERATION_LANGUAGE}`, TIER_POOL_CONFIG[difficulty], GENERATION_LANGUAGE, signal)
  if (pool.length < 2) {
    throw new Error(`Not enough eligible candidate movies to build a ${difficulty} challenge`)
  }

  const targetDepth = TIER_TARGET_DEPTH[difficulty]
  const triedPairs = new Set<string>()
  const startedAt = Date.now()

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    if (Date.now() - startedAt > GENERATION_DEADLINE_MS) {
      break
    }

    const pair = pickDistinctPair(pool, triedPairs)
    if (!pair) {
      break
    }
    const [source, destination] = pair

    const result = await tryFindPath(source, destination, signal)
    if (result?.connected && result.intermediateMovieCount !== null && targetDepth.has(result.intermediateMovieCount)) {
      return { source, destination }
    }
  }

  throw new Error(`Could not find a ${difficulty} challenge pair in time`)
}

async function tryFindPath(
  source: TmdbMovieSummary,
  destination: TmdbMovieSummary,
  outerSignal?: AbortSignal,
): Promise<PathValidationResult | null> {
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), PER_ATTEMPT_TIMEOUT_MS)
  const signal = outerSignal ? AbortSignal.any([timeoutController.signal, outerSignal]) : timeoutController.signal

  try {
    return await findPathBetweenMovies(source, destination, GENERATION_LANGUAGE, signal)
  }
  catch (error) {
    // A single slow or unconnected pair shouldn't fail the whole
    // generation - treat it as inconclusive and let the caller try
    // another pair. Anything other than a TMDB-side error (misconfigured
    // key, etc.) still propagates.
    if (error instanceof TmdbError) {
      return null
    }
    throw error
  }
  finally {
    clearTimeout(timeout)
  }
}

function pickDistinctPair(
  pool: TmdbMovieSummary[],
  triedPairs: Set<string>,
): [TmdbMovieSummary, TmdbMovieSummary] | null {
  const maxCombinations = (pool.length * (pool.length - 1)) / 2
  if (triedPairs.size >= maxCombinations) {
    return null
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    const indexA = Math.floor(Math.random() * pool.length)
    let indexB = Math.floor(Math.random() * pool.length)
    while (indexB === indexA) {
      indexB = Math.floor(Math.random() * pool.length)
    }

    const source = pool[indexA]!
    const destination = pool[indexB]!
    const pairKey = [source.id, destination.id].sort((a, b) => a - b).join('-')

    if (!triedPairs.has(pairKey)) {
      triedPairs.add(pairKey)
      return [source, destination]
    }
  }

  return null
}
