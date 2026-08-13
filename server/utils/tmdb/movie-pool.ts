import type { TmdbMovieSummary, TmdbSearchMoviesResponse } from '~~/types/tmdb'
import { tmdbFetch } from './client'
import { DOCUMENTARY_GENRE_ID, isEligibleMovie } from './pruning'
import { getOrSetCache } from '../kv-cache'

// vote_count is a far better proxy for "would most people recognize this"
// than popularity: popularity is a short-term trending signal that can
// spike for a niche title, while vote_count only grows from a broad
// audience actually having watched and rated a film over time.
export type PoolSortOrder = 'vote_count.desc' | 'popularity.desc'

export interface MoviePoolConfig {
  sortBy: PoolSortOrder
  minVoteCount: number
  pageStart: number
  pageEnd: number
}

// Pools change slowly enough that re-fetching the same discover pages on
// every single challenge request would be pure waste.
const POOL_CACHE_TTL_SECONDS = 60 * 60 * 12

export function getMoviePool(
  cacheKey: string,
  config: MoviePoolConfig,
  language: string,
  signal?: AbortSignal,
): Promise<TmdbMovieSummary[]> {
  return getOrSetCache(cacheKey, POOL_CACHE_TTL_SECONDS, async () => {
    const pageCount = config.pageEnd - config.pageStart + 1
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, index) =>
        tmdbFetch<TmdbSearchMoviesResponse>('/discover/movie', {
          language,
          'page': config.pageStart + index,
          'sort_by': config.sortBy,
          'vote_count.gte': config.minVoteCount,
          'without_genres': String(DOCUMENTARY_GENRE_ID),
        }, signal),
      ),
    )
    return pages.flatMap(page => page.results).filter(isEligibleMovie)
  })
}
