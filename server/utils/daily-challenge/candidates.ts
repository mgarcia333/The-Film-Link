import type { TmdbMovieSummary } from '~~/types/tmdb'
import { getMoviePool } from '../tmdb/movie-pool'

// High vote_count floor so the daily challenge lands on films almost
// everyone recognizes, not whatever happens to be trending this week.
const DAILY_POOL_CONFIG = {
  sortBy: 'vote_count.desc' as const,
  minVoteCount: 3000,
  pageStart: 1,
  pageEnd: 5,
}

export function getRecognizableMoviePool(language: string, signal?: AbortSignal): Promise<TmdbMovieSummary[]> {
  return getMoviePool(`pool:daily:${language}`, DAILY_POOL_CONFIG, language, signal)
}
