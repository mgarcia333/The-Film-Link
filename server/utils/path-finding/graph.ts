import type { TmdbMovieSummary } from '~~/types/tmdb'
import type { NeighborFetcher, SearchNode } from './bidirectional-bfs'
import { getMovieCastAndCrew, getPersonFilmography, getRawMovieCredits, getRawPersonMovieCredits } from '../tmdb/credits'
import { DIRECTING_JOB, MAX_CAST_PER_MOVIE, MAX_FORWARD_FILMOGRAPHY_PER_PERSON, isCreditedRole, isEligibleMovie, pruneCreditedCast } from '../tmdb/pruning'

export type PathNodeKind = 'movie' | 'person'

export interface PathNode extends SearchNode {
  kind: PathNodeKind
  tmdbId: number
  name: string
  imagePath: string | null
  // Only meaningful for movie nodes: whether this movie could ever show up
  // in someone's filmography (see isEligibleMovie). Always true for people.
  eligible: boolean
}

export function movieNodeId(tmdbId: number): string {
  return `movie:${tmdbId}`
}

export function personNodeId(tmdbId: number): string {
  return `person:${tmdbId}`
}

function toMovieNode(movie: { id: number, title: string, posterPath: string | null }, eligible: boolean): PathNode {
  return {
    id: movieNodeId(movie.id),
    kind: 'movie',
    tmdbId: movie.id,
    name: movie.title,
    imagePath: movie.posterPath,
    eligible,
  }
}

function toPersonNode(person: { id: number, name: string, profilePath: string | null }): PathNode {
  return {
    id: personNodeId(person.id),
    kind: 'person',
    tmdbId: person.id,
    name: person.name,
    imagePath: person.profilePath,
    eligible: true,
  }
}

// For seed movies (search results, daily challenge candidates): real TMDB
// fields are available, so eligibility is computed rather than assumed.
export function createMovieNode(movie: TmdbMovieSummary): PathNode {
  return toMovieNode({ id: movie.id, title: movie.title, posterPath: movie.poster_path }, isEligibleMovie(movie))
}

function dedupeNodes(nodes: PathNode[]): PathNode[] {
  const seen = new Set<string>()
  return nodes.filter((node) => {
    if (seen.has(node.id)) {
      return false
    }
    seen.add(node.id)
    return true
  })
}

export interface GraphSearchContext {
  language: string
  signal?: AbortSignal
}

// What a player would actually see and click: a movie's top-billed cast and
// its director(s), or a person's eligible filmography.
export function createForwardNeighborFetcher(context: GraphSearchContext): NeighborFetcher<PathNode> {
  return async (node) => {
    if (node.kind === 'movie') {
      const people = await getMovieCastAndCrew(node.tmdbId, context.language, context.signal)
      return dedupeNodes(people.map(person => toPersonNode({ id: person.id, name: person.name, profilePath: person.profilePath })))
    }

    // getPersonFilmography already applies isEligibleMovie, so every result
    // here is known-eligible without re-deriving it from partial data.
    const movies = await getPersonFilmography(node.tmdbId, context.language, context.signal, MAX_FORWARD_FILMOGRAPHY_PER_PERSON)
    return dedupeNodes(movies.map(movie => toMovieNode({ id: movie.id, title: movie.title, posterPath: movie.posterPath }, true)))
  }
}

// The true predecessors under the forward relation above: who could have
// picked this node next. A movie's predecessors are everyone credited on
// it (any billing, not just the top 12) as long as the movie itself is
// eligible to appear in a filmography; a person's predecessors are the
// movies where they were top-billed or directing, which is a stricter
// subset of their full filmography.
export function createBackwardNeighborFetcher(context: GraphSearchContext): NeighborFetcher<PathNode> {
  return async (node) => {
    if (node.kind === 'movie') {
      if (!node.eligible) {
        return []
      }
      const credits = await getRawMovieCredits(node.tmdbId, context.language, context.signal)
      const cast = pruneCreditedCast(credits.cast)
        .map(member => toPersonNode({ id: member.id, name: member.name, profilePath: member.profile_path }))
      const directors = credits.crew
        .filter(member => member.job === DIRECTING_JOB)
        .map(member => toPersonNode({ id: member.id, name: member.name, profilePath: member.profile_path }))
      return dedupeNodes([...cast, ...directors])
    }

    const credits = await getRawPersonMovieCredits(node.tmdbId, context.language, context.signal)
    const topBilled = credits.cast
      .filter(credit => credit.order < MAX_CAST_PER_MOVIE && isCreditedRole(credit.character))
      .map(credit => createMovieNode(credit))
    const directed = credits.crew
      .filter(credit => credit.job === DIRECTING_JOB)
      .map(credit => createMovieNode(credit))
    return dedupeNodes([...topBilled, ...directed])
  }
}
