import type { DifficultyLevel } from '~~/types/difficulty'
import { refillPool } from '../utils/difficulty-challenge/pool'

const TIERS: DifficultyLevel[] = ['easy', 'normal', 'difficult']

export default defineTask({
  meta: {
    name: 'warm-difficulty-pools',
    description: 'Tops each difficulty tier\'s ready-to-serve challenge pool back up to its target size.',
  },
  async run() {
    // Sequential, not Promise.all: each refill can itself make dozens of
    // TMDB calls, and running all three tiers at once would multiply that
    // fan-out for no benefit - nothing here is time-sensitive.
    for (const difficulty of TIERS) {
      await refillPool(difficulty)
    }
    return { result: { tiers: TIERS } }
  },
})
