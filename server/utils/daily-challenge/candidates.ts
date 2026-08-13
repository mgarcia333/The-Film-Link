import type { TmdbMovieSummary, TmdbSearchMoviesResponse } from '~~/types/tmdb'
import { tmdbFetch } from '../tmdb/client'
import { isEligibleMovie } from '../tmdb/pruning'

const CANDIDATE_POOL_PAGES = 5

export async function getPopularMoviePool(language: string, signal?: AbortSignal): Promise<TmdbMovieSummary[]> {
  const pages = await Promise.all(
    Array.from({ length: CANDIDATE_POOL_PAGES }, (_, index) =>
      tmdbFetch<TmdbSearchMoviesResponse>(
        '/discover/movie',
        { language, page: index + 1, sort_by: 'popularity.desc' },
        signal,
      )),
  )

  return pages.flatMap(page => page.results).filter(isEligibleMovie)
}
