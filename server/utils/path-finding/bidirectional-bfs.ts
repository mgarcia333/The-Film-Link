// Generic bidirectional breadth-first search. Knows nothing about movies or
// people: it just connects two nodes through a directed neighbor relation as
// fast as possible, always expanding whichever frontier is currently
// smaller. This lets the algorithm be unit tested against a plain in-memory
// graph, independently of TMDB.

export interface SearchNode {
  id: string
}

export type NeighborFetcher<T extends SearchNode> = (node: T) => Promise<T[]>

interface VisitedEntry<T extends SearchNode> {
  node: T
  parentId: string | null
}

export interface BidirectionalSearchOptions<T extends SearchNode> {
  source: T
  destination: T
  // Real forward options from a node, as a player would see them.
  getForwardNeighbors: NeighborFetcher<T>
  // Nodes that have a valid forward edge INTO the given node. Not simply the
  // reverse lookup of getForwardNeighbors: see server/utils/path-finding/graph.ts
  // for why the two relations differ in this game's bipartite graph.
  getBackwardNeighbors: NeighborFetcher<T>
  // Total edge traversals allowed, i.e. twice the maximum number of
  // intermediate movies.
  maxHops: number
}

export async function findShortestPath<T extends SearchNode>(
  options: BidirectionalSearchOptions<T>,
): Promise<T[] | null> {
  const { source, destination, getForwardNeighbors, getBackwardNeighbors, maxHops } = options

  if (source.id === destination.id) {
    return [source]
  }

  const forwardVisited = new Map<string, VisitedEntry<T>>([[source.id, { node: source, parentId: null }]])
  const backwardVisited = new Map<string, VisitedEntry<T>>([[destination.id, { node: destination, parentId: null }]])

  let forwardFrontier = [source]
  let backwardFrontier = [destination]
  let hopsUsed = 0

  while (forwardFrontier.length > 0 && backwardFrontier.length > 0 && hopsUsed < maxHops) {
    const expandingForward = forwardFrontier.length <= backwardFrontier.length

    const { newLayer, meetingId } = expandingForward
      ? await expandLayer(forwardFrontier, getForwardNeighbors, forwardVisited, backwardVisited)
      : await expandLayer(backwardFrontier, getBackwardNeighbors, backwardVisited, forwardVisited)

    hopsUsed++

    if (meetingId !== null) {
      return reconstructPath(meetingId, forwardVisited, backwardVisited)
    }

    if (expandingForward) {
      forwardFrontier = newLayer
    }
    else {
      backwardFrontier = newLayer
    }
  }

  return null
}

interface LayerResult<T extends SearchNode> {
  newLayer: T[]
  meetingId: string | null
}

// Expands every node in `frontier` one hop, records newly discovered nodes
// in `visited`, and returns them alongside the id of the first node also
// present in `otherVisited` (a meeting point), if any.
async function expandLayer<T extends SearchNode>(
  frontier: T[],
  getNeighbors: NeighborFetcher<T>,
  visited: Map<string, VisitedEntry<T>>,
  otherVisited: Map<string, VisitedEntry<T>>,
): Promise<LayerResult<T>> {
  const expansions = await Promise.all(
    frontier.map(async parent => ({ parent, neighbors: await getNeighbors(parent) })),
  )

  const newLayer: T[] = []
  let meetingId: string | null = null
  for (const { parent, neighbors } of expansions) {
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.id)) {
        continue
      }
      visited.set(neighbor.id, { node: neighbor, parentId: parent.id })
      newLayer.push(neighbor)
      if (meetingId === null && otherVisited.has(neighbor.id)) {
        meetingId = neighbor.id
      }
    }
  }
  return { newLayer, meetingId }
}

function reconstructPath<T extends SearchNode>(
  meetingId: string,
  forwardVisited: Map<string, VisitedEntry<T>>,
  backwardVisited: Map<string, VisitedEntry<T>>,
): T[] {
  const forwardChain: T[] = []
  let currentId: string | null = meetingId
  while (currentId !== null) {
    const entry = forwardVisited.get(currentId)
    if (!entry) {
      break
    }
    forwardChain.unshift(entry.node)
    currentId = entry.parentId
  }

  const backwardChain: T[] = []
  currentId = backwardVisited.get(meetingId)?.parentId ?? null
  while (currentId !== null) {
    const entry = backwardVisited.get(currentId)
    if (!entry) {
      break
    }
    backwardChain.push(entry.node)
    currentId = entry.parentId
  }

  return [...forwardChain, ...backwardChain]
}
