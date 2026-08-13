import type { TmdbMovieSummary } from '~~/types/tmdb'

// The client resends a movie it previously received from /api/movies/search
// (or a person's filmography) when asking to validate or reveal a path, so
// this defensively rebuilds a TmdbMovieSummary from an unknown request body
// instead of trusting its shape.
export function parseMovieSummary(value: unknown): TmdbMovieSummary | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.id !== 'number' || typeof candidate.title !== 'string') {
    return null
  }

  return {
    id: candidate.id,
    title: candidate.title,
    original_title: typeof candidate.original_title === 'string' ? candidate.original_title : candidate.title,
    release_date: typeof candidate.release_date === 'string' ? candidate.release_date : '',
    poster_path: typeof candidate.poster_path === 'string' ? candidate.poster_path : null,
    vote_count: typeof candidate.vote_count === 'number' ? candidate.vote_count : 0,
    vote_average: typeof candidate.vote_average === 'number' ? candidate.vote_average : 0,
    genre_ids: Array.isArray(candidate.genre_ids) ? candidate.genre_ids.filter((id): id is number => typeof id === 'number') : [],
    original_language: typeof candidate.original_language === 'string' ? candidate.original_language : '',
    popularity: typeof candidate.popularity === 'number' ? candidate.popularity : 0,
    adult: Boolean(candidate.adult),
    video: Boolean(candidate.video),
    overview: typeof candidate.overview === 'string' ? candidate.overview : '',
  }
}
