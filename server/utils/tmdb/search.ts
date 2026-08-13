import type { TmdbMovieSummary, TmdbSearchMoviesResponse } from '~~/types/tmdb'
import { tmdbFetch } from './client'

export interface MovieSearchResult {
  id: number
  title: string
  posterPath: string | null
  releaseYear: number | null
}

export async function searchMovies(
  query: string,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<MovieSearchResult[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return []
  }

  const response = await tmdbFetch<TmdbSearchMoviesResponse>(
    '/search/movie',
    { query: trimmedQuery, language },
    signal,
  )

  return response.results.map(toSearchResult)
}

function toSearchResult(movie: TmdbMovieSummary): MovieSearchResult {
  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    releaseYear: movie.release_date ? new Date(movie.release_date).getUTCFullYear() : null,
  }
}
