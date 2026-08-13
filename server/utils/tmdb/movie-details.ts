import type { TmdbMovieDetails, TmdbMovieSummary } from '~~/types/tmdb'
import { tmdbFetch } from './client'
import { getOrSetCache } from '../kv-cache'

const DETAILS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30

// Only needed to re-localize a movie that is already known by id (e.g. the
// daily challenge pair, whose selection must stay language-independent).
// Gameplay navigation never needs this: credits and filmography responses
// already carry full movie summaries in the active language.
export async function getMovieDetails(movieId: number, language: string, signal?: AbortSignal): Promise<TmdbMovieSummary> {
  const details = await getOrSetCache(
    `tmdb:movie:${movieId}:details:${language}`,
    DETAILS_CACHE_TTL_SECONDS,
    () => tmdbFetch<TmdbMovieDetails>(`/movie/${movieId}`, { language }, signal),
  )

  const { genres, ...summary } = details
  return { ...summary, genre_ids: genres.map(genre => genre.id) }
}
