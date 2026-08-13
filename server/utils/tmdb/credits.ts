import type { TmdbMovieCreditsResponse, TmdbPersonMovieCreditsResponse } from '~~/types/tmdb'
import { tmdbFetch } from './client'
import { DIRECTING_JOB, isCreditedRole, isEligibleMovie, pruneCast, pruneDirectors } from './pruning'
import { getOrSetCache } from '../kv-cache'

const CREDITS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30

export interface CastOrCrewPerson {
  id: number
  name: string
  profilePath: string | null
  creditedAs: 'cast' | 'director'
}

export interface FilmographyMovie {
  id: number
  title: string
  posterPath: string | null
  releaseYear: number
  creditedAs: 'cast' | 'director'
}

// Cached raw responses, shared by both the forward (gameplay-facing) and
// backward (path-finding) views over the same credits: a movie or person's
// TMDB data only needs fetching once no matter which direction reads it.
export function getRawMovieCredits(
  movieId: number,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<TmdbMovieCreditsResponse> {
  return getOrSetCache(
    `tmdb:movie:${movieId}:credits:${language}`,
    CREDITS_CACHE_TTL_SECONDS,
    () => tmdbFetch<TmdbMovieCreditsResponse>(`/movie/${movieId}/credits`, { language }, signal),
  )
}

export function getRawPersonMovieCredits(
  personId: number,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<TmdbPersonMovieCreditsResponse> {
  return getOrSetCache(
    `tmdb:person:${personId}:movie_credits:${language}`,
    CREDITS_CACHE_TTL_SECONDS,
    () => tmdbFetch<TmdbPersonMovieCreditsResponse>(`/person/${personId}/movie_credits`, { language }, signal),
  )
}

export async function getMovieCastAndCrew(
  movieId: number,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<CastOrCrewPerson[]> {
  const credits = await getRawMovieCredits(movieId, language, signal)

  const cast: CastOrCrewPerson[] = pruneCast(credits.cast).map(member => ({
    id: member.id,
    name: member.name,
    profilePath: member.profile_path,
    creditedAs: 'cast',
  }))

  const directors: CastOrCrewPerson[] = pruneDirectors(credits.crew).map(member => ({
    id: member.id,
    name: member.name,
    profilePath: member.profile_path,
    creditedAs: 'director',
  }))

  return dedupeById([...cast, ...directors])
}

export async function getPersonFilmography(
  personId: number,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<FilmographyMovie[]> {
  const credits = await getRawPersonMovieCredits(personId, language, signal)

  const asCast: FilmographyMovie[] = credits.cast
    .filter(isEligibleMovie)
    .filter(credit => isCreditedRole(credit.character))
    .map(credit => toFilmographyMovie(credit, 'cast'))

  const asDirector: FilmographyMovie[] = credits.crew
    .filter(isEligibleMovie)
    .filter(credit => credit.job === DIRECTING_JOB)
    .map(credit => toFilmographyMovie(credit, 'director'))

  return dedupeById([...asCast, ...asDirector])
}

function toFilmographyMovie(
  movie: { id: number, title: string, poster_path: string | null, release_date: string },
  creditedAs: FilmographyMovie['creditedAs'],
): FilmographyMovie {
  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    releaseYear: new Date(movie.release_date).getUTCFullYear(),
    creditedAs,
  }
}

export function dedupeById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }
    seen.add(item.id)
    return true
  })
}
