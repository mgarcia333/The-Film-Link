import type { TmdbCastMember, TmdbCrewMember, TmdbMovieSummary } from '~~/types/tmdb'

// Single source of truth for what counts as a playable cast/crew credit or
// a playable movie. Both the gameplay API routes and the path-finding
// engine import these so a person or film is never shown as an option
// that the search engine would then refuse to traverse, or vice versa.
export const MAX_CAST_PER_MOVIE = 12
export const DIRECTING_JOB = 'Director'
export const MIN_VOTE_COUNT = 20
export const DOCUMENTARY_GENRE_ID = 99

const UNCREDITED_OR_SELF_PATTERN = /uncredited|^self\b/i

export function isCreditedRole(character: string): boolean {
  return !UNCREDITED_OR_SELF_PATTERN.test(character.trim())
}

export function pruneCast(cast: TmdbCastMember[]): TmdbCastMember[] {
  return cast
    .filter(member => isCreditedRole(member.character))
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_CAST_PER_MOVIE)
}

export function pruneDirectors(crew: TmdbCrewMember[]): TmdbCrewMember[] {
  return crew.filter(member => member.job === DIRECTING_JOB)
}

export function isEligibleMovie(movie: TmdbMovieSummary): boolean {
  return (
    Boolean(movie.release_date)
    && Boolean(movie.poster_path)
    && movie.vote_count >= MIN_VOTE_COUNT
    && !movie.genre_ids.includes(DOCUMENTARY_GENRE_ID)
  )
}
