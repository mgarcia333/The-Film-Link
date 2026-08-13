import { describe, expect, it } from 'vitest'
import { findShortestPath, type SearchNode } from './bidirectional-bfs'

interface FixtureNode extends SearchNode {
  id: string
}

function node(id: string): FixtureNode {
  return { id }
}

function symmetricFetcher(edges: Record<string, string[]>) {
  return async (from: FixtureNode): Promise<FixtureNode[]> => {
    return (edges[from.id] ?? []).map(node)
  }
}

// origin -[lead1]-> bridge -[lead2]-> target is the short route (4 hops).
// origin also reaches target the long way around, through four extra hops,
// so tests can assert the algorithm prefers the short route.
const edges: Record<string, string[]> = {
  'movie:origin': ['person:lead1', 'person:decoyA'],
  'person:lead1': ['movie:origin', 'movie:bridge', 'movie:longDetourA'],
  'person:decoyA': ['movie:origin', 'movie:longDetourA'],
  'movie:bridge': ['person:lead1', 'person:lead2'],
  'person:lead2': ['movie:bridge', 'movie:target'],
  'movie:target': ['person:lead2', 'person:longDetourD'],
  'movie:longDetourA': ['person:lead1', 'person:decoyA', 'person:longDetourB'],
  'person:longDetourB': ['movie:longDetourA', 'movie:longDetourC'],
  'movie:longDetourC': ['person:longDetourB', 'person:longDetourD'],
  'person:longDetourD': ['movie:longDetourC', 'movie:target'],
  'movie:isolated': [],
}

const getNeighbors = symmetricFetcher(edges)

describe('findShortestPath', () => {
  it('returns a single-node path when source and destination are the same', async () => {
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:origin'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 6,
    })

    expect(path?.map(n => n.id)).toEqual(['movie:origin'])
  })

  it('finds the short path between two connected movies', async () => {
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:target'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 6,
    })

    expect(path?.map(n => n.id)).toEqual([
      'movie:origin',
      'person:lead1',
      'movie:bridge',
      'person:lead2',
      'movie:target',
    ])
  })

  it('prefers the short path over a longer detour that also connects', async () => {
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:target'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 8,
    })

    expect(path).toHaveLength(5)
    expect(path?.some(n => n.id === 'movie:longDetourC')).toBe(false)
  })

  it('returns null when no path exists', async () => {
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:isolated'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 8,
    })

    expect(path).toBeNull()
  })

  it('returns null when the only path exceeds the maximum depth', async () => {
    // The only route to longDetourC-adjacent target-via-detour is 6 hops away.
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:longDetourC'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 2,
    })

    expect(path).toBeNull()
  })

  it('finds the depth-limited path once maxHops is large enough', async () => {
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:longDetourC'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 4,
    })

    expect(path?.map(n => n.id)).toEqual([
      'movie:origin',
      'person:lead1',
      'movie:longDetourA',
      'person:longDetourB',
      'movie:longDetourC',
    ])
  })

  it('returns null once maxNeighborFetches is exceeded, even with hops to spare', async () => {
    // The short route needs to expand origin (1 fetch) then either lead1 or
    // decoyA (2 fetches) before it can reach bridge - a budget of 1 cuts it
    // off after the very first layer.
    const path = await findShortestPath({
      source: node('movie:origin'),
      destination: node('movie:target'),
      getForwardNeighbors: getNeighbors,
      getBackwardNeighbors: getNeighbors,
      maxHops: 6,
      maxNeighborFetches: 1,
    })

    expect(path).toBeNull()
  })

  it('uses the backward relation as given, not as a reverse of the forward one', async () => {
    // S -> A -> T is the only real forward path. The backward fetcher is
    // supplied explicitly and deliberately differs from what naively
    // reversing getForwardNeighbors would produce (T has no outgoing edges).
    const forward: Record<string, string[]> = {
      s: ['a'],
      a: ['t'],
      t: [],
    }
    const backward: Record<string, string[]> = {
      t: ['a'],
      a: ['s'],
      s: [],
    }

    const path = await findShortestPath({
      source: node('s'),
      destination: node('t'),
      getForwardNeighbors: symmetricFetcher(forward),
      getBackwardNeighbors: symmetricFetcher(backward),
      maxHops: 4,
    })

    expect(path?.map(n => n.id)).toEqual(['s', 'a', 't'])
  })
})
