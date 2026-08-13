import { defineStore } from 'pinia'
import type { TmdbMovieSummary } from '~~/types/tmdb'

export type PathNodeKind = 'movie' | 'person'

export interface GamePathNode {
  kind: PathNodeKind
  id: number
  name: string
  imagePath: string | null
}

export type GameStatus = 'playing' | 'won' | 'surrendered'
export type GameMode = 'personalized' | 'daily'

interface GameStoreState {
  status: GameStatus | null
  mode: GameMode | null
  // Only set when mode is 'daily' - the UTC date the challenge belongs to,
  // used to record the result under the right day and to detect replays.
  dailyChallengeDate: string | null
  sourceMovie: TmdbMovieSummary | null
  destinationMovie: TmdbMovieSummary | null
  playedPath: GamePathNode[]
  // Counts every choice ever made, including ones later undone - undoing
  // moves the current position back but never lowers this counter.
  stepsTaken: number
  optimalPath: GamePathNode[] | null
  optimalStepCount: number | null
}

export const useGameStore = defineStore('game', {
  state: (): GameStoreState => ({
    status: null,
    mode: null,
    dailyChallengeDate: null,
    sourceMovie: null,
    destinationMovie: null,
    playedPath: [],
    stepsTaken: 0,
    optimalPath: null,
    optimalStepCount: null,
  }),

  getters: {
    currentNode: (state): GamePathNode | null => state.playedPath[state.playedPath.length - 1] ?? null,
    usedPersonIds: (state): number[] =>
      state.playedPath.filter(node => node.kind === 'person').map(node => node.id),
    canUndo: (state): boolean => state.status === 'playing' && state.playedPath.length > 1,
  },

  actions: {
    startGame(source: TmdbMovieSummary, destination: TmdbMovieSummary, mode: GameMode, dailyChallengeDate: string | null = null) {
      this.status = 'playing'
      this.mode = mode
      this.dailyChallengeDate = dailyChallengeDate
      this.sourceMovie = source
      this.destinationMovie = destination
      this.playedPath = [{ kind: 'movie', id: source.id, name: source.title, imagePath: source.poster_path }]
      this.stepsTaken = 0
      this.optimalPath = null
      this.optimalStepCount = null
    },

    choose(node: GamePathNode) {
      if (this.status !== 'playing') {
        return
      }
      this.playedPath.push(node)
      this.stepsTaken++
      if (node.kind === 'movie' && node.id === this.destinationMovie?.id) {
        this.status = 'won'
      }
    },

    undo() {
      if (!this.canUndo) {
        return
      }
      this.playedPath.pop()
    },

    surrender() {
      if (this.status !== 'playing') {
        return
      }
      this.status = 'surrendered'
    },

    setOptimalPath(path: GamePathNode[], stepCount: number) {
      this.optimalPath = path
      this.optimalStepCount = stepCount
    },

    reset() {
      this.status = null
      this.mode = null
      this.dailyChallengeDate = null
      this.sourceMovie = null
      this.destinationMovie = null
      this.playedPath = []
      this.stepsTaken = 0
      this.optimalPath = null
      this.optimalStepCount = null
    },
  },

  persist: true,
})
