import type { TmdbMovieSummary } from '~~/types/tmdb'
import { findShortestPath } from './bidirectional-bfs'
import { createBackwardNeighborFetcher, createForwardNeighborFetcher, createMovieNode, type PathNode } from './graph'
import { getOrSetCache } from '../kv-cache'

// The search engine never looks past this many movie picks after the
// source (destination included) - see the worked example in the brief,
// where a path through one intermediate film plus the destination is
// described as "2 películas intermedias".
export const MAX_INTERMEDIATE_MOVIES = 3
const MAX_HOPS = MAX_INTERMEDIATE_MOVIES * 2

// Hard ceiling on TMDB subrequests for a single search, comfortably under
// Cloudflare Workers' own per-invocation subrequest limit. Per-node pruning
// (see pruning.ts) keeps typical searches far under this; it only kicks in
// for pathological pairs, where it fails the pair as "not connected within
// budget" instead of risking the Worker being killed for exceeding its
// resource limits mid-search.
const MAX_NEIGHBOR_FETCHES_PER_SEARCH = 48

// A validated pair essentially never needs recomputing: the underlying
// credits data changes rarely enough that a long-lived cache entry is
// effectively permanent for gameplay purposes.
const VALIDATION_CACHE_TTL_SECONDS = 60 * 60 * 24 * 180

export interface PathNodeDto {
  kind: PathNode['kind']
  id: number
  name: string
  imagePath: string | null
}

export interface PathValidationResult {
  connected: boolean
  intermediateMovieCount: number | null
  path: PathNodeDto[] | null
}

export async function findPathBetweenMovies(
  source: TmdbMovieSummary,
  destination: TmdbMovieSummary,
  language = 'es-ES',
  signal?: AbortSignal,
): Promise<PathValidationResult> {
  const cacheKey = `pathfinding:${source.id}->${destination.id}:${language}`

  return getOrSetCache(cacheKey, VALIDATION_CACHE_TTL_SECONDS, async () => {
    const context = { language, signal }

    const path = await findShortestPath({
      source: createMovieNode(source),
      destination: createMovieNode(destination),
      getForwardNeighbors: createForwardNeighborFetcher(context),
      getBackwardNeighbors: createBackwardNeighborFetcher(context),
      maxHops: MAX_HOPS,
      maxNeighborFetches: MAX_NEIGHBOR_FETCHES_PER_SEARCH,
    })

    if (!path) {
      return { connected: false, intermediateMovieCount: null, path: null }
    }

    return {
      connected: true,
      intermediateMovieCount: path.filter(node => node.kind === 'person').length,
      path: path.map(node => ({ kind: node.kind, id: node.tmdbId, name: node.name, imagePath: node.imagePath })),
    }
  })
}
