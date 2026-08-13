import type { TmdbMovieSummary, TmdbSearchMoviesResponse } from '~~/types/tmdb'
import { findPathBetweenMovies } from '../path-finding/validate'
import { getMovieDetails } from '../tmdb/movie-details'
import { tmdbFetch } from '../tmdb/client'
import { isEligibleMovie } from '../tmdb/pruning'
import { createSeededRandom } from '../daily-challenge/random'

const CHALLENGE_GENERATION_LANGUAGE = 'en-US'
const MAX_GENERATION_ATTEMPTS = 40
const TARGET_INTERMEDIATE_MOVIES = new Set([2, 3])

export type DifficultyLevel = 'easy' | 'normal' | 'difficult'

export interface DifficultyChallenge {
  source: TmdbMovieSummary
  destination: TmdbMovieSummary
}

// Movie pools by difficulty:
// easy: pages 1-3 (most popular)
// normal: pages 3-8 (moderately popular)
// difficult: pages 8-15 (less popular)
const DIFFICULTY_CONFIG = {
  easy: { startPage: 1, endPage: 3 },
  normal: { startPage: 3, endPage: 8 },
  difficult: { startPage: 8, endPage: 15 },
}

async function getMoviePoolByDifficulty(difficulty: DifficultyLevel, signal?: AbortSignal): Promise<TmdbMovieSummary[]> {
  const config = DIFFICULTY_CONFIG[difficulty]
  const pageCount = config.endPage - config.startPage + 1

  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, index) =>
      tmdbFetch<TmdbSearchMoviesResponse>(
        '/discover/movie',
        {
          language: CHALLENGE_GENERATION_LANGUAGE,
          page: config.startPage + index,
          sort_by: 'popularity.desc',
        },
        signal,
      )),
  )

  return pages.flatMap(page => page.results).filter(isEligibleMovie)
}

export async function getDifficultyChallenge(
  difficulty: DifficultyLevel,
  displayLanguage: string,
  signal?: AbortSignal,
): Promise<DifficultyChallenge> {
  const canonical = await generateDifficultyChallenge(difficulty, signal)
  if (displayLanguage === CHALLENGE_GENERATION_LANGUAGE) {
    return canonical
  }

  const [source, destination] = await Promise.all([
    getMovieDetails(canonical.source.id, displayLanguage, signal),
    getMovieDetails(canonical.destination.id, displayLanguage, signal),
  ])
  return { source, destination }
}

async function generateDifficultyChallenge(difficulty: DifficultyLevel, signal?: AbortSignal): Promise<DifficultyChallenge> {
  const pool = await getMoviePoolByDifficulty(difficulty, signal)
  if (pool.length < 2) {
    throw new Error(`Not enough eligible candidate movies to build a ${difficulty} challenge`)
  }

  const random = createSeededRandom(Date.now())
  const triedPairs = new Set<string>()

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const [source, destination] = pickDistinctPair(pool, random, triedPairs)
    if (!source) {
      break
    }

    const result = await findPathBetweenMovies(source, destination, CHALLENGE_GENERATION_LANGUAGE, signal)
    if (result.connected && result.intermediateMovieCount !== null && TARGET_INTERMEDIATE_MOVIES.has(result.intermediateMovieCount)) {
      return { source, destination }
    }
  }

  throw new Error(
    `Could not find a ${difficulty} challenge pair within ${MAX_GENERATION_ATTEMPTS} attempts`,
  )
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

  for (let attempts = 0; attempts < 100; attempts++) {
    const sourceIndex = Math.floor(random() * pool.length)
    const destIndex = Math.floor(random() * pool.length)

    if (sourceIndex === destIndex) {
      continue
    }

    const source = pool[sourceIndex]!
    const destination = pool[destIndex]!
    const pairKey = `${Math.min(source.id, destination.id)}:${Math.max(source.id, destination.id)}`

    if (!triedPairs.has(pairKey)) {
      triedPairs.add(pairKey)
      return [source, destination]
    }
  }

  return [null, null]
}
