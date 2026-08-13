import type { TmdbMovieSummary, TmdbSearchMoviesResponse } from '~~/types/tmdb'
import { tmdbFetch } from './client'

// Returned as the full TMDB summary (not trimmed down) because the client
// selects a movie here and later resends it verbatim to the path-finding
// validation endpoint, which needs vote_count/genre_ids/release_date to
// judge whether the seed movie is eligible to appear in a filmography.
export async function searchMovies(
  query: string,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<TmdbMovieSummary[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return []
  }

  const response = await tmdbFetch<TmdbSearchMoviesResponse>(
    '/search/movie',
    { query: trimmedQuery, language },
    signal,
  )

  return response.results
}
